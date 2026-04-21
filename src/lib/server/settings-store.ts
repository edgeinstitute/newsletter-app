import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getAdminClient } from "@/lib/supabase/admin";
import { encrypt, decrypt } from "@/lib/crypto";
import type { Database } from "@/lib/supabase/database.types";

type AdminDb = SupabaseClient<Database>;

export async function readModule<T>(
  moduleName: string,
  adminDb: AdminDb = getAdminClient(),
): Promise<T | null> {
  const { data, error } = await adminDb
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

export async function writeModule(moduleName: string, value: unknown): Promise<string | null> {
  const admin = getAdminClient();
  const encrypted_config = encrypt(JSON.stringify(value));
  const { error } = await admin.from("settings").upsert(
    {
      module_name: moduleName,
      encrypted_config,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "module_name" },
  );
  return error?.message ?? null;
}
