import "server-only";
import { cache } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, ProfileRole } from "@/lib/supabase/database.types";

export type UserProfile = {
  id: string;
  full_name: string | null;
  phone: string | null;
  role: ProfileRole;
  avatar_url: string | null;
};

export const getProfileCached = cache(
  async (adminDb: SupabaseClient<Database>, userId: string): Promise<UserProfile | null> => {
    const { data, error } = await adminDb
      .from("profiles")
      .select("id, full_name, phone, role, avatar_url")
      .eq("id", userId)
      .maybeSingle();
    if (error) return null;
    return data;
  },
);
