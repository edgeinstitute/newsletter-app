import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, NewsletterStatus } from "@/lib/supabase/database.types";
import { isBlockArray, type NewsletterContent } from "@/lib/newsletter/blocks";

type AdminDb = SupabaseClient<Database>;

export type NewsletterRow = {
  id: string;
  title: string;
  subtitle: string;
  previewText: string;
  status: NewsletterStatus;
  content: NewsletterContent;
  beehiivPostId: string | null;
  lastError: string | null;
  syncedAt: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

function mapRow(row: Database["public"]["Tables"]["newsletters"]["Row"]): NewsletterRow {
  return {
    id: row.id,
    title: row.title,
    subtitle: row.subtitle,
    previewText: row.preview_text,
    status: row.status,
    content: isBlockArray(row.content) ? row.content : [],
    beehiivPostId: row.beehiiv_post_id,
    lastError: row.last_error,
    syncedAt: row.synced_at,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listNewsletterRows(adminDb: AdminDb): Promise<NewsletterRow[]> {
  const { data, error } = await adminDb
    .from("newsletters")
    .select("*")
    .order("updated_at", { ascending: false });
  if (error || !data) return [];
  return data.map(mapRow);
}

export async function getNewsletterRow(
  adminDb: AdminDb,
  id: string,
): Promise<NewsletterRow | null> {
  const { data, error } = await adminDb.from("newsletters").select("*").eq("id", id).maybeSingle();
  if (error || !data) return null;
  return mapRow(data);
}

export type NewsletterMetadata = {
  id: string;
  title: string;
  status: NewsletterStatus;
  updatedAt: string;
};

export async function listNewsletterMetadata(adminDb: AdminDb): Promise<NewsletterMetadata[]> {
  const { data, error } = await adminDb
    .from("newsletters")
    .select("id, title, status, updated_at")
    .order("updated_at", { ascending: false });
  if (error || !data) return [];
  return data.map((row) => ({
    id: row.id,
    title: row.title,
    status: row.status,
    updatedAt: row.updated_at,
  }));
}
