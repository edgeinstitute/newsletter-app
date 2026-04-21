import "server-only";
import { cookies } from "next/headers";
import { unstable_cache, revalidateTag } from "next/cache";
import { createServerClient } from "@supabase/ssr";
import type { NextRequest, NextResponse } from "next/server";
import { getEnv } from "@/lib/env";
import { getAdminClient } from "@/lib/supabase/admin";
import { decrypt } from "@/lib/crypto";
import type { Database } from "@/lib/supabase/database.types";

const CACHE_TAG = "supabase-config";

type PublicConfig = { url: string; anonKey: string };

async function resolveAnonKey(): Promise<string> {
  const env = getEnv();
  if (env.SUPABASE_PUBLISHABLE_KEY) return env.SUPABASE_PUBLISHABLE_KEY;

  const admin = getAdminClient();
  const { data, error } = await admin
    .from("settings")
    .select("encrypted_config")
    .eq("module_name", "supabase_anon_key")
    .maybeSingle();
  if (error) throw error;
  if (!data?.encrypted_config) {
    throw new Error("Supabase anon key not configured (env or settings).");
  }
  return decrypt(data.encrypted_config);
}

const getCachedPublicConfig = unstable_cache(
  async (): Promise<PublicConfig> => {
    const { SUPABASE_URL } = getEnv();
    const anonKey = await resolveAnonKey();
    return { url: SUPABASE_URL, anonKey };
  },
  ["supabase-public-config"],
  { revalidate: 3600, tags: [CACHE_TAG] },
);

export async function getPublicSupabaseConfig(): Promise<PublicConfig> {
  return getCachedPublicConfig();
}

export function invalidateSupabaseConfigCache() {
  revalidateTag(CACHE_TAG, "max");
}

export async function getDynamicServerClient() {
  const { url, anonKey } = await getPublicSupabaseConfig();
  const cookieStore = await cookies();

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from a server component without a mutable cookie store — safe to ignore.
        }
      },
    },
  });
}

export async function getDynamicMiddlewareClient(request: NextRequest, response: NextResponse) {
  const { url, anonKey } = await getPublicSupabaseConfig();

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value, options } of cookiesToSet) {
          request.cookies.set(name, value);
          response.cookies.set(name, value, options);
        }
      },
    },
  });
}
