"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAdminClient } from "@/lib/supabase/admin";
import { getDynamicServerClient } from "@/lib/supabase/dynamic";
import { getUserId } from "@/lib/supabase/getUser";

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function signOut(): Promise<never> {
  const supabase = await getDynamicServerClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}

export async function deleteOwnAccount(): Promise<ActionResult> {
  const userId = await getUserId();
  if (!userId) return { ok: false, error: "Autentificare necesară" };

  const admin = getAdminClient();

  const { data: list } = await admin.storage.from("profile_photos").list(userId, { limit: 100 });
  if (list && list.length > 0) {
    const paths = list.map((f) => `${userId}/${f.name}`);
    await admin.storage.from("profile_photos").remove(paths);
  }

  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/", "layout");
  return { ok: true };
}
