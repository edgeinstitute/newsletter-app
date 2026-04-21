"use server";

import { revalidatePath } from "next/cache";
import { getAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/server/auth";
import { readModule, writeModule } from "@/lib/server/settings-store";
import { postToMailgun, type MailgunConfig } from "@/lib/mail/mailgun";
import { renderToHtml } from "@/lib/newsletter/render-html";
import { serializeContent } from "@/lib/newsletter/serialize";
import { isBlockArray, type NewsletterContent } from "@/lib/newsletter/blocks";
import type { ActionResult } from "@/lib/server/action-result";
import type { Database, Json } from "@/lib/supabase/database.types";

const BEEHIIV_MODULE = "beehiiv";
const MAILGUN_MODULE = "mailgun";
const MAX_BLOCKS = 200;
const MAX_CONTENT_BYTES = 1_000_000;

export type BeehiivConfig = {
  apiKey: string;
  publicationId: string;
};

type NewsletterInsert = Database["public"]["Tables"]["newsletters"]["Insert"];

export async function saveBeehiivConfig(input: BeehiivConfig): Promise<ActionResult> {
  const check = await requireAdmin();
  if (!check.ok) return check;

  const publicationId = input.publicationId.trim();
  let apiKey = input.apiKey.trim();

  if (!publicationId) {
    return { ok: false, error: "Publication ID este obligatoriu" };
  }

  if (!apiKey) {
    const existing = await readModule<BeehiivConfig>(BEEHIIV_MODULE);
    if (!existing) {
      return { ok: false, error: "API Key este obligatoriu la prima configurare" };
    }
    apiKey = existing.apiKey;
  }

  const err = await writeModule(BEEHIIV_MODULE, {
    apiKey,
    publicationId,
  } satisfies BeehiivConfig);
  if (err) return { ok: false, error: err };

  revalidatePath("/settings");
  return { ok: true };
}

export async function createNewsletter(): Promise<ActionResult<{ id: string }>> {
  const check = await requireAdmin();
  if (!check.ok) return check;

  const admin = getAdminClient();
  const insert: NewsletterInsert = {
    title: "",
    subtitle: "",
    preview_text: "",
    status: "draft",
    content: [] as unknown as Json,
    created_by: check.userId,
  };
  const { data, error } = await admin.from("newsletters").insert(insert).select("id").single();
  if (error || !data) {
    return { ok: false, error: error?.message ?? "Nu s-a putut crea newsletter-ul" };
  }

  revalidatePath("/newsletters");
  return { ok: true, data: { id: data.id } };
}

export async function saveNewsletterDraft(input: {
  id: string;
  title: string;
  subtitle: string;
  previewText: string;
  content: NewsletterContent;
}): Promise<ActionResult> {
  const check = await requireAdmin();
  if (!check.ok) return check;

  if (!isBlockArray(input.content)) {
    return { ok: false, error: "Conținut invalid" };
  }
  if (input.content.length > MAX_BLOCKS) {
    return { ok: false, error: `Maxim ${MAX_BLOCKS} blocuri pe newsletter` };
  }
  const serialized = JSON.stringify(input.content);
  if (serialized.length > MAX_CONTENT_BYTES) {
    return { ok: false, error: "Conținutul depășește 1MB" };
  }

  const admin = getAdminClient();
  const { data: current, error: readErr } = await admin
    .from("newsletters")
    .select("status")
    .eq("id", input.id)
    .maybeSingle();
  if (readErr) return { ok: false, error: readErr.message };
  if (!current) return { ok: false, error: "Newsletter inexistent" };

  const nextStatus = current.status === "synced" ? "draft" : current.status;

  const { error } = await admin
    .from("newsletters")
    .update({
      title: input.title.slice(0, 500),
      subtitle: input.subtitle.slice(0, 500),
      preview_text: input.previewText.slice(0, 500),
      content: input.content as unknown as Json,
      status: nextStatus,
    })
    .eq("id", input.id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/newsletters");
  revalidatePath(`/newsletters/${input.id}`);
  return { ok: true };
}

export async function deleteNewsletter(id: string): Promise<ActionResult> {
  const check = await requireAdmin();
  if (!check.ok) return check;

  const admin = getAdminClient();
  const { error } = await admin.from("newsletters").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/newsletters");
  return { ok: true };
}

async function postToBeehiiv(
  cfg: BeehiivConfig,
  payload: {
    title: string;
    subtitle?: string;
    preview_text?: string;
    blocks: unknown[];
  },
): Promise<{ ok: true; data: { id: string } } | { ok: false; error: string }> {
  const url = `https://api.beehiiv.com/v2/publications/${encodeURIComponent(cfg.publicationId)}/posts`;
  const body: Record<string, unknown> = {
    title: payload.title,
    blocks: payload.blocks,
    status: "draft",
  };
  if (payload.subtitle) body.subtitle = payload.subtitle;
  if (payload.preview_text) {
    body.email_settings = { email_preview_text: payload.preview_text };
  }

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${cfg.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    return {
      ok: false,
      error: `beehiiv ${res.status}: ${text.slice(0, 300) || res.statusText}`,
    };
  }
  const json = (await res.json().catch(() => null)) as { data?: { id?: string } } | null;
  if (!json?.data?.id) {
    return { ok: false, error: "Răspuns beehiiv invalid (lipsă data.id)" };
  }
  return { ok: true, data: { id: json.data.id } };
}

export async function pushNewsletterToBeehiiv(
  id: string,
): Promise<ActionResult<{ beehiivPostId: string }>> {
  const check = await requireAdmin();
  if (!check.ok) return check;

  const admin = getAdminClient();
  const { data: row, error: readErr } = await admin
    .from("newsletters")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (readErr) return { ok: false, error: readErr.message };
  if (!row) return { ok: false, error: "Newsletter inexistent" };

  if (row.status === "syncing") {
    return { ok: false, error: "Trimitere deja în curs" };
  }
  if (!row.title.trim()) {
    return { ok: false, error: "Adaugă un titlu înainte de trimitere" };
  }
  if (!isBlockArray(row.content) || row.content.length === 0) {
    return { ok: false, error: "Adaugă cel puțin un bloc înainte de trimitere" };
  }

  const cfg = await readModule<BeehiivConfig>(BEEHIIV_MODULE);
  if (!cfg) {
    return { ok: false, error: "Configurează beehiiv în Setări înainte de trimitere" };
  }

  const { error: syncingErr } = await admin
    .from("newsletters")
    .update({ status: "syncing", last_error: null })
    .eq("id", id);
  if (syncingErr) return { ok: false, error: syncingErr.message };

  const serialized = serializeContent(row.content);
  const result = await postToBeehiiv(cfg, {
    title: row.title,
    subtitle: row.subtitle || undefined,
    preview_text: row.preview_text || undefined,
    blocks: serialized,
  });

  if (!result.ok) {
    await admin
      .from("newsletters")
      .update({ status: "failed", last_error: result.error })
      .eq("id", id);
    revalidatePath("/newsletters");
    revalidatePath(`/newsletters/${id}`);
    return { ok: false, error: result.error };
  }

  const { error: updErr } = await admin
    .from("newsletters")
    .update({
      status: "synced",
      beehiiv_post_id: result.data.id,
      synced_at: new Date().toISOString(),
      last_error: null,
    })
    .eq("id", id);
  if (updErr) {
    return { ok: false, error: updErr.message };
  }

  revalidatePath("/newsletters");
  revalidatePath(`/newsletters/${id}`);
  return { ok: true, data: { beehiivPostId: result.data.id } };
}

export async function sendTestNewsletter(id: string, toEmail: string): Promise<ActionResult> {
  const check = await requireAdmin();
  if (!check.ok) return check;

  const target = toEmail.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(target)) {
    return { ok: false, error: "Adresă email invalidă" };
  }

  const admin = getAdminClient();
  const { data: row, error: readErr } = await admin
    .from("newsletters")
    .select("title, subtitle, preview_text, content")
    .eq("id", id)
    .maybeSingle();
  if (readErr) return { ok: false, error: readErr.message };
  if (!row) return { ok: false, error: "Newsletter inexistent" };

  const content: NewsletterContent = isBlockArray(row.content) ? row.content : [];

  const mailgun = await readModule<MailgunConfig>(MAILGUN_MODULE);
  if (!mailgun) {
    return { ok: false, error: "Configurează Mailgun înainte de a trimite previzualizarea" };
  }

  const { html, text } = renderToHtml(content, {
    title: row.title,
    subtitle: row.subtitle || undefined,
    previewText: row.preview_text || undefined,
  });

  const subject = row.title.trim()
    ? `[Test] ${row.title.trim()}`
    : "[Test] Previzualizare newsletter";

  const result = await postToMailgun(mailgun, { to: target, subject, html, text });
  if (!result.ok) return result;
  return { ok: true };
}
