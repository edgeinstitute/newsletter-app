"use server";

import { revalidatePath } from "next/cache";
import { getAdminClient } from "@/lib/supabase/admin";
import { getUserId } from "@/lib/supabase/getUser";

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function updateUserProfile(input: {
  full_name: string;
  phone: string | null;
}): Promise<ActionResult> {
  const userId = await getUserId();
  if (!userId) return { ok: false, error: "Autentificare necesară" };

  const fullName = input.full_name.trim();
  if (fullName.length < 2) {
    return { ok: false, error: "Numele complet este obligatoriu" };
  }

  const admin = getAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({
      full_name: fullName,
      phone: input.phone?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);
  if (error) return { ok: false, error: error.message };

  await admin.auth.admin.updateUserById(userId, {
    user_metadata: { full_name: fullName },
  });

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function updateAvatarUrl(avatarUrl: string): Promise<ActionResult> {
  const userId = await getUserId();
  if (!userId) return { ok: false, error: "Autentificare necesară" };

  const admin = getAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({ avatar_url: avatarUrl, updated_at: new Date().toISOString() })
    .eq("id", userId);
  if (error) return { ok: false, error: error.message };

  await admin.auth.admin.updateUserById(userId, {
    user_metadata: { avatar_url: avatarUrl },
  });

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function deleteAvatar(): Promise<ActionResult> {
  const userId = await getUserId();
  if (!userId) return { ok: false, error: "Autentificare necesară" };

  const admin = getAdminClient();

  const { data: list } = await admin.storage.from("profile_photos").list(userId, { limit: 100 });
  if (list && list.length > 0) {
    const paths = list.map((f) => `${userId}/${f.name}`);
    await admin.storage.from("profile_photos").remove(paths);
  }

  const { error } = await admin
    .from("profiles")
    .update({ avatar_url: null, updated_at: new Date().toISOString() })
    .eq("id", userId);
  if (error) return { ok: false, error: error.message };

  await admin.auth.admin.updateUserById(userId, {
    user_metadata: { avatar_url: null },
  });

  revalidatePath("/", "layout");
  return { ok: true };
}
