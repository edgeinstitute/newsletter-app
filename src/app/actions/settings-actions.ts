"use server";

import { revalidatePath } from "next/cache";
import { getAdminClient } from "@/lib/supabase/admin";
import { getUserId } from "@/lib/supabase/getUser";
import { encrypt, decrypt } from "@/lib/crypto";
import { getEnv } from "@/lib/env";
import {
  DEFAULT_INVITE_TEMPLATE,
  htmlToText,
  renderTemplate,
  type InviteTemplate,
} from "@/lib/invite-template";
import type { ProfileRole } from "@/lib/supabase/database.types";

export type ActionResult<T = undefined> =
  | (T extends undefined ? { ok: true } : { ok: true; data: T })
  | { ok: false; error: string };

export type MailgunConfig = {
  apiKey: string;
  domain: string;
  fromEmail: string;
  fromName: string;
  region: "us" | "eu";
};

const MAILGUN_MODULE = "mailgun";
const INVITE_TEMPLATE_MODULE = "email_template_invite";

async function requireAdmin(): Promise<
  { ok: true; userId: string } | { ok: false; error: string }
> {
  const userId = await getUserId();
  if (!userId) return { ok: false, error: "Autentificare necesară" };
  const admin = getAdminClient();
  const { data, error } = await admin
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();
  if (error) return { ok: false, error: error.message };
  if (data?.role !== "admin") return { ok: false, error: "Acces restricționat" };
  return { ok: true, userId };
}

async function readModule<T>(moduleName: string): Promise<T | null> {
  const admin = getAdminClient();
  const { data, error } = await admin
    .from("settings")
    .select("encrypted_config")
    .eq("module_name", moduleName)
    .maybeSingle();
  if (error || !data) return null;
  try {
    return JSON.parse(decrypt(data.encrypted_config)) as T;
  } catch {
    return null;
  }
}

async function writeModule(moduleName: string, value: unknown): Promise<string | null> {
  const admin = getAdminClient();
  const encrypted_config = encrypt(JSON.stringify(value));
  const { error } = await admin
    .from("settings")
    .upsert(
      { module_name: moduleName, encrypted_config, updated_at: new Date().toISOString() },
      { onConflict: "module_name" },
    );
  return error?.message ?? null;
}

export async function saveMailgunConfig(
  input: MailgunConfig,
): Promise<ActionResult> {
  const check = await requireAdmin();
  if (!check.ok) return check;

  let apiKey = input.apiKey.trim();
  const domain = input.domain.trim();
  const fromEmail = input.fromEmail.trim().toLowerCase();
  const fromName = input.fromName.trim();
  const region = input.region === "eu" ? "eu" : "us";

  if (!domain || !fromEmail) {
    return { ok: false, error: "Completează domeniul și adresa expeditor" };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fromEmail)) {
    return { ok: false, error: "Adresa expeditor este invalidă" };
  }
  if (!apiKey) {
    const existing = await readModule<MailgunConfig>(MAILGUN_MODULE);
    if (!existing) {
      return { ok: false, error: "API Key este obligatoriu la prima configurare" };
    }
    apiKey = existing.apiKey;
  }

  const err = await writeModule(MAILGUN_MODULE, {
    apiKey,
    domain,
    fromEmail,
    fromName: fromName || domain,
    region,
  } satisfies MailgunConfig);
  if (err) return { ok: false, error: err };

  revalidatePath("/settings");
  return { ok: true };
}

export async function saveInviteTemplate(
  input: InviteTemplate,
): Promise<ActionResult> {
  const check = await requireAdmin();
  if (!check.ok) return check;

  const subject = input.subject.trim();
  const bodyHtml = input.bodyHtml;

  if (!subject || !bodyHtml.trim()) {
    return { ok: false, error: "Completează subiectul și conținutul" };
  }
  if (!bodyHtml.includes("{{inviteLink}}")) {
    return { ok: false, error: "Template-ul trebuie să conțină {{inviteLink}}" };
  }

  const err = await writeModule(INVITE_TEMPLATE_MODULE, {
    subject,
    bodyHtml,
  } satisfies InviteTemplate);
  if (err) return { ok: false, error: err };

  revalidatePath("/settings");
  return { ok: true };
}

export async function resetInviteTemplate(): Promise<
  ActionResult<InviteTemplate>
> {
  const check = await requireAdmin();
  if (!check.ok) return check;
  const err = await writeModule(INVITE_TEMPLATE_MODULE, DEFAULT_INVITE_TEMPLATE);
  if (err) return { ok: false, error: err };
  revalidatePath("/settings");
  return { ok: true, data: DEFAULT_INVITE_TEMPLATE };
}

async function postToMailgun(
  cfg: MailgunConfig,
  payload: { to: string; subject: string; html: string; text: string },
): Promise<{ ok: true } | { ok: false; error: string }> {
  const base = cfg.region === "eu"
    ? "https://api.eu.mailgun.net"
    : "https://api.mailgun.net";
  const url = `${base}/v3/${encodeURIComponent(cfg.domain)}/messages`;

  const fromHeader = cfg.fromName
    ? `${cfg.fromName} <${cfg.fromEmail}>`
    : cfg.fromEmail;

  const body = new URLSearchParams();
  body.set("from", fromHeader);
  body.set("to", payload.to);
  body.set("subject", payload.subject);
  body.set("html", payload.html);
  body.set("text", payload.text);

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`api:${cfg.apiKey}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    return {
      ok: false,
      error: `Mailgun ${res.status}: ${text.slice(0, 200) || res.statusText}`,
    };
  }
  return { ok: true };
}

export async function sendMailgunTest(toEmail: string): Promise<ActionResult> {
  const check = await requireAdmin();
  if (!check.ok) return check;

  const target = toEmail.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(target)) {
    return { ok: false, error: "Adresă email invalidă" };
  }

  const cfg = await readModule<MailgunConfig>(MAILGUN_MODULE);
  if (!cfg) return { ok: false, error: "Configurează Mailgun înainte de test" };

  const result = await postToMailgun(cfg, {
    to: target,
    subject: "Test Mailgun — conexiune OK",
    html: `<p>Acesta este un email de test trimis din panoul de administrare.</p>
           <p style="color:#737373;font-size:12px;">Dacă ai primit acest mesaj, configurația Mailgun funcționează corect.</p>`,
    text: "Test Mailgun — conexiune OK. Configurația funcționează.",
  });
  if (!result.ok) return result;
  return { ok: true };
}

export async function sendTeamInvite(input: {
  email: string;
  fullName: string;
  role: ProfileRole;
}): Promise<ActionResult<{ userId: string }>> {
  const check = await requireAdmin();
  if (!check.ok) return check;

  const email = input.email.trim().toLowerCase();
  const fullName = input.fullName.trim();
  const role = input.role;
  if (!email || fullName.length < 2) {
    return { ok: false, error: "Completează numele și emailul" };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "Adresă email invalidă" };
  }

  const cfg = await readModule<MailgunConfig>(MAILGUN_MODULE);
  if (!cfg) {
    return { ok: false, error: "Configurează Mailgun înainte de a trimite invitații" };
  }
  const template =
    (await readModule<InviteTemplate>(INVITE_TEMPLATE_MODULE)) ??
    DEFAULT_INVITE_TEMPLATE;

  const { APP_URL } = getEnv();
  const admin = getAdminClient();

  const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
    type: "invite",
    email,
    options: {
      data: { full_name: fullName },
      redirectTo: `${APP_URL}/auth/callback`,
    },
  });
  if (linkErr || !linkData.properties?.action_link || !linkData.user) {
    return {
      ok: false,
      error: linkErr?.message ?? "Nu s-a putut genera invitația",
    };
  }
  const inviteLink = linkData.properties.action_link;
  const userId = linkData.user.id;

  if (role !== "staff") {
    const { error: upErr } = await admin
      .from("profiles")
      .update({ role, updated_at: new Date().toISOString() })
      .eq("id", userId);
    if (upErr) return { ok: false, error: upErr.message };
  }

  const { data: inviterProfile } = await admin
    .from("profiles")
    .select("full_name")
    .eq("id", check.userId)
    .maybeSingle();

  const appName = cfg.fromName || "EDGE Newsletter";
  const vars: Record<string, string> = {
    fullName,
    email,
    role:
      role === "admin"
        ? "Administrator"
        : role === "viewer"
          ? "Vizualizator"
          : "Echipă",
    inviteLink,
    inviterName: inviterProfile?.full_name ?? "Echipa",
    appName,
  };

  const renderedHtml = renderTemplate(template.bodyHtml, vars);
  const renderedSubject = renderTemplate(template.subject, vars);
  const renderedText = htmlToText(renderedHtml);

  const send = await postToMailgun(cfg, {
    to: email,
    subject: renderedSubject,
    html: renderedHtml,
    text: renderedText,
  });
  if (!send.ok) {
    return {
      ok: false,
      error: `Utilizatorul a fost creat, dar emailul nu a fost trimis. ${send.error}`,
    };
  }

  revalidatePath("/users");
  revalidatePath("/settings");
  return { ok: true, data: { userId } };
}
