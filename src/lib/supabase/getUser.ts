import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import type { User } from "@supabase/supabase-js";
import { getDynamicServerClient } from "@/lib/supabase/dynamic";

export type ProxyUserInfo = {
  id: string;
  email: string | null;
  name: string | null;
};

export const getUser = cache(async (): Promise<User | null> => {
  try {
    const supabase = await getDynamicServerClient();
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      if (error.message?.toLowerCase().includes("refresh_token_not_found")) return null;
      return null;
    }
    return data.user ?? null;
  } catch {
    return null;
  }
});

export async function getUserId(): Promise<string | null> {
  const h = await headers();
  return h.get("x-user-id");
}

export async function getUserInfo(): Promise<ProxyUserInfo | null> {
  const h = await headers();
  const id = h.get("x-user-id");
  if (!id) return null;
  const emailRaw = h.get("x-user-email");
  const nameRaw = h.get("x-user-name");
  return {
    id,
    email: emailRaw ? decodeURIComponent(emailRaw) : null,
    name: nameRaw ? decodeURIComponent(nameRaw) : null,
  };
}
