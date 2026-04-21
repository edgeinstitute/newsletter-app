import "server-only";
import { htmlToPlainText } from "@/lib/text/html-to-text";

export type WordpressConfig = {
  siteUrl: string;
  username: string;
  applicationPassword: string;
};

export type WpMediaItem = {
  id: number;
  url: string;
  thumbnailUrl: string | null;
  filename: string;
  mimeType: string;
  width: number | null;
  height: number | null;
  uploadedAt: string;
  description: string;
  newsletterId: string | null;
};

const MARKER_RE = /\[edge-nl:([a-zA-Z0-9_-]+)\]/;

export function parseMarker(description: string): string | null {
  const match = MARKER_RE.exec(description);
  return match?.[1] ?? null;
}

export function withMarker(description: string, newsletterId: string | null): string {
  const stripped = description.replace(MARKER_RE, "").trim();
  if (!newsletterId) return stripped;
  return stripped ? `${stripped}\n[edge-nl:${newsletterId}]` : `[edge-nl:${newsletterId}]`;
}

type WpSize = {
  source_url?: string;
  width?: number;
  height?: number;
};

type WpMediaRaw = {
  id: number;
  date_gmt: string;
  source_url: string;
  mime_type: string;
  title?: { rendered?: string };
  slug?: string;
  description?: { rendered?: string; raw?: string };
  media_details?: {
    width?: number;
    height?: number;
    sizes?: Record<string, WpSize>;
  };
};

function baseUrl(cfg: WordpressConfig): string {
  return cfg.siteUrl.trim().replace(/\/+$/, "");
}

function basicAuth(cfg: WordpressConfig): string {
  const token = Buffer.from(
    `${cfg.username}:${cfg.applicationPassword.replace(/\s+/g, "")}`,
  ).toString("base64");
  return `Basic ${token}`;
}

function mapMedia(raw: WpMediaRaw): WpMediaItem {
  const sizes = raw.media_details?.sizes ?? {};
  const thumb =
    sizes.thumbnail?.source_url ??
    sizes.medium?.source_url ??
    sizes.medium_large?.source_url ??
    raw.source_url ??
    null;
  const rawDesc = raw.description?.raw ?? htmlToPlainText(raw.description?.rendered ?? "");
  return {
    id: raw.id,
    url: raw.source_url,
    thumbnailUrl: thumb,
    filename: raw.title?.rendered || raw.slug || `media-${raw.id}`,
    mimeType: raw.mime_type,
    width: raw.media_details?.width ?? null,
    height: raw.media_details?.height ?? null,
    uploadedAt: raw.date_gmt,
    description: rawDesc,
    newsletterId: parseMarker(rawDesc),
  };
}

function sanitizeFilename(name: string): string {
  const cleaned = name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-100);
  return cleaned || "upload.bin";
}

export async function uploadToWp(
  cfg: WordpressConfig,
  file: {
    buffer: ArrayBuffer;
    filename: string;
    mimeType: string;
  },
): Promise<{ ok: true; data: WpMediaItem } | { ok: false; error: string }> {
  const url = `${baseUrl(cfg)}/wp-json/wp/v2/media`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: basicAuth(cfg),
      "Content-Type": file.mimeType || "application/octet-stream",
      "Content-Disposition": `attachment; filename="${sanitizeFilename(file.filename)}"`,
    },
    body: Buffer.from(file.buffer),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    return {
      ok: false,
      error: `WordPress ${res.status}: ${text.slice(0, 300) || res.statusText}`,
    };
  }
  const json = (await res.json().catch(() => null)) as WpMediaRaw | null;
  if (!json?.id || !json.source_url) {
    return { ok: false, error: "Răspuns WordPress invalid" };
  }
  return { ok: true, data: mapMedia(json) };
}

export async function getWpMedia(
  cfg: WordpressConfig,
  id: number,
): Promise<{ ok: true; data: WpMediaItem } | { ok: false; error: string }> {
  const url = `${baseUrl(cfg)}/wp-json/wp/v2/media/${id}`;
  const res = await fetch(url, {
    method: "GET",
    headers: { Authorization: basicAuth(cfg) },
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    return {
      ok: false,
      error: `WordPress ${res.status}: ${text.slice(0, 300) || res.statusText}`,
    };
  }
  const json = (await res.json().catch(() => null)) as WpMediaRaw | null;
  if (!json?.id) return { ok: false, error: "Răspuns WordPress invalid" };
  return { ok: true, data: mapMedia(json) };
}

export async function updateWpMedia(
  cfg: WordpressConfig,
  id: number,
  patch: { description?: string; alt_text?: string; title?: string },
): Promise<{ ok: true; data: WpMediaItem } | { ok: false; error: string }> {
  const url = `${baseUrl(cfg)}/wp-json/wp/v2/media/${id}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: basicAuth(cfg),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(patch),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    return {
      ok: false,
      error: `WordPress ${res.status}: ${text.slice(0, 300) || res.statusText}`,
    };
  }
  const json = (await res.json().catch(() => null)) as WpMediaRaw | null;
  if (!json?.id) return { ok: false, error: "Răspuns WordPress invalid" };
  return { ok: true, data: mapMedia(json) };
}

export type WpListResult = {
  items: WpMediaItem[];
  total: number;
  totalPages: number;
  page: number;
  perPage: number;
};

export async function listWpMedia(
  cfg: WordpressConfig,
  opts: { perPage?: number; page?: number; search?: string } = {},
): Promise<{ ok: true; data: WpListResult } | { ok: false; error: string }> {
  const perPage = Math.min(Math.max(opts.perPage ?? 16, 1), 100);
  const page = Math.max(opts.page ?? 1, 1);
  const searchParam = opts.search ? `&search=${encodeURIComponent(opts.search)}` : "";
  const url = `${baseUrl(cfg)}/wp-json/wp/v2/media?media_type=image&per_page=${perPage}&page=${page}&orderby=date&order=desc${searchParam}`;
  const res = await fetch(url, {
    method: "GET",
    headers: { Authorization: basicAuth(cfg) },
    cache: "no-store",
  });
  if (res.status === 400) {
    // WP returns 400 "rest_post_invalid_page_number" when requesting past last page.
    return {
      ok: true,
      data: { items: [], total: 0, totalPages: 1, page, perPage },
    };
  }
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    return {
      ok: false,
      error: `WordPress ${res.status}: ${text.slice(0, 300) || res.statusText}`,
    };
  }
  const json = (await res.json().catch(() => null)) as WpMediaRaw[] | null;
  if (!Array.isArray(json)) {
    return { ok: false, error: "Răspuns WordPress invalid" };
  }
  const total = Number(res.headers.get("X-WP-Total") ?? json.length);
  const totalPages = Number(res.headers.get("X-WP-TotalPages") ?? 1);
  return {
    ok: true,
    data: {
      items: json.map(mapMedia),
      total: Number.isFinite(total) ? total : json.length,
      totalPages: Number.isFinite(totalPages) ? totalPages : 1,
      page,
      perPage,
    },
  };
}

export async function deleteWpMedia(
  cfg: WordpressConfig,
  id: number,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const url = `${baseUrl(cfg)}/wp-json/wp/v2/media/${id}?force=true`;
  const res = await fetch(url, {
    method: "DELETE",
    headers: { Authorization: basicAuth(cfg) },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    return {
      ok: false,
      error: `WordPress ${res.status}: ${text.slice(0, 300) || res.statusText}`,
    };
  }
  return { ok: true };
}
