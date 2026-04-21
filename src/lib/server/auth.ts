import "server-only";
import { getAdminClient } from "@/lib/supabase/admin";
import { getUserId } from "@/lib/supabase/getUser";

export async function requireAdmin(): Promise<
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
