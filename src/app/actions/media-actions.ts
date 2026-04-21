"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/server/auth";
import { readModule, writeModule } from "@/lib/server/settings-store";
import {
  deleteWpMedia,
  getWpMedia,
  listWpMedia,
  updateWpMedia,
  uploadToWp,
  withMarker,
  type WordpressConfig,
  type WpListResult,
  type WpMediaItem,
} from "@/lib/wordpress/client";
import type { ActionResult } from "@/lib/server/action-result";

const WORDPRESS_MODULE = "wordpress";
const MAX_FILE_BYTES = 15 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/gif",
  "image/webp",
  "image/svg+xml",
]);

export async function saveWordpressConfig(input: WordpressConfig): Promise<ActionResult> {
  const check = await requireAdmin();
  if (!check.ok) return check;

  const siteUrl = input.siteUrl.trim().replace(/\/+$/, "");
  const username = input.username.trim();
  let applicationPassword = input.applicationPassword.trim();

  if (!/^https?:\/\//i.test(siteUrl)) {
    return { ok: false, error: "URL-ul site-ului trebuie să înceapă cu http(s)://" };
  }
  if (!username) {
    return { ok: false, error: "Completează username-ul WordPress" };
  }

  if (!applicationPassword) {
    const existing = await readModule<WordpressConfig>(WORDPRESS_MODULE);
    if (!existing) {
      return { ok: false, error: "Application Password este obligatoriu la prima configurare" };
    }
    applicationPassword = existing.applicationPassword;
  }

  const err = await writeModule(WORDPRESS_MODULE, {
    siteUrl,
    username,
    applicationPassword,
  } satisfies WordpressConfig);
  if (err) return { ok: false, error: err };

  revalidatePath("/settings");
  revalidatePath("/media");
  return { ok: true };
}

export async function uploadMedia(formData: FormData): Promise<ActionResult<WpMediaItem>> {
  const check = await requireAdmin();
  if (!check.ok) return check;

  const file = formData.get("file");
  const newsletterIdRaw = formData.get("newsletterId");
  const newsletterId =
    typeof newsletterIdRaw === "string" && newsletterIdRaw.trim().length > 0
      ? newsletterIdRaw.trim()
      : null;

  if (!(file instanceof File)) {
    return { ok: false, error: "Fișier lipsă" };
  }
  if (file.size === 0) {
    return { ok: false, error: "Fișier gol" };
  }
  if (file.size > MAX_FILE_BYTES) {
    return { ok: false, error: "Dimensiune maximă 15MB" };
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return { ok: false, error: `Tip fișier neacceptat: ${file.type || "necunoscut"}` };
  }

  const cfg = await readModule<WordpressConfig>(WORDPRESS_MODULE);
  if (!cfg) {
    return { ok: false, error: "Configurează WordPress în Setări înainte de upload" };
  }

  const buffer = await file.arrayBuffer();
  const uploaded = await uploadToWp(cfg, {
    buffer,
    filename: file.name,
    mimeType: file.type,
  });
  if (!uploaded.ok) return uploaded;

  if (newsletterId) {
    const tagged = await updateWpMedia(cfg, uploaded.data.id, {
      description: withMarker(uploaded.data.description, newsletterId),
    });
    if (tagged.ok) {
      revalidatePath("/media");
      return { ok: true, data: tagged.data };
    }
    // Upload succeeded but tagging failed — surface a warning, keep file.
    revalidatePath("/media");
    return {
      ok: false,
      error: `Imaginea a fost încărcată, dar asocierea cu newsletter-ul a eșuat: ${tagged.error}`,
    };
  }

  revalidatePath("/media");
  return { ok: true, data: uploaded.data };
}

export async function assignMediaToNewsletter(
  wpMediaId: number,
  newsletterId: string | null,
): Promise<ActionResult<WpMediaItem>> {
  const check = await requireAdmin();
  if (!check.ok) return check;

  const cfg = await readModule<WordpressConfig>(WORDPRESS_MODULE);
  if (!cfg) return { ok: false, error: "Configurează WordPress în Setări" };

  const current = await getWpMedia(cfg, wpMediaId);
  if (!current.ok) return current;

  const patched = await updateWpMedia(cfg, wpMediaId, {
    description: withMarker(current.data.description, newsletterId),
  });
  if (!patched.ok) return patched;

  revalidatePath("/media");
  return { ok: true, data: patched.data };
}

export type MediaFilter = "all" | { newsletterId: string };

function filterToSearch(filter: MediaFilter): string | undefined {
  if (filter === "all") return undefined;
  return `edge-nl:${filter.newsletterId}`;
}

export async function listMedia(opts: {
  page?: number;
  perPage?: number;
  filter?: MediaFilter;
}): Promise<ActionResult<WpListResult>> {
  const check = await requireAdmin();
  if (!check.ok) return check;

  const cfg = await readModule<WordpressConfig>(WORDPRESS_MODULE);
  if (!cfg) return { ok: false, error: "Configurează WordPress în Setări" };

  const result = await listWpMedia(cfg, {
    perPage: opts.perPage ?? 16,
    page: opts.page ?? 1,
    search: filterToSearch(opts.filter ?? "all"),
  });
  if (!result.ok) return result;
  return { ok: true, data: result.data };
}

export async function deleteMedia(id: number): Promise<ActionResult> {
  const check = await requireAdmin();
  if (!check.ok) return check;

  const cfg = await readModule<WordpressConfig>(WORDPRESS_MODULE);
  if (!cfg) return { ok: false, error: "Configurează WordPress în Setări" };

  const result = await deleteWpMedia(cfg, id);
  if (!result.ok) return result;

  revalidatePath("/media");
  return { ok: true };
}
