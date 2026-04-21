import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { cache } from "react";
import { getEnv } from "@/lib/env";
import type { Database } from "@/lib/supabase/database.types";

export function createAdminClient(): SupabaseClient<Database> {
  const { SUPABASE_URL, SUPABASE_SECRET_KEY } = getEnv();
  return createClient<Database>(SUPABASE_URL, SUPABASE_SECRET_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export const getAdminClient = cache(createAdminClient);
