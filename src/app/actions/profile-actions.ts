"use server";

import { revalidatePath } from "next/cache";
import { getAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/server/auth";
import type { ActionResult } from "@/lib/server/action-result";
import type { ProfileRole } from "@/lib/supabase/database.types";

export async function createTeamMember(input: {
  email: string;
  password: string;
  fullName: string;
  role: ProfileRole;
}): Promise<ActionResult<{ userId: string }>> {
  const check = await requireAdmin();
  if (!check.ok) return check;

  const email = input.email.trim().toLowerCase();
  const fullName = input.fullName.trim();
  if (!email || !input.password || fullName.length < 2) {
    return { ok: false, error: "Date incomplete" };
  }
  if (input.password.length < 8) {
    return { ok: false, error: "Parola trebuie să aibă minim 8 caractere" };
  }

  const admin = getAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: input.password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });
  if (error || !data.user) {
    return { ok: false, error: error?.message ?? "Eroare la creare utilizator" };
  }

  if (input.role !== "staff") {
    const { error: upErr } = await admin
      .from("profiles")
      .update({ role: input.role, updated_at: new Date().toISOString() })
      .eq("id", data.user.id);
    if (upErr) return { ok: false, error: upErr.message };
  }

  revalidatePath("/users");
  return { ok: true, data: { userId: data.user.id } };
}

export async function changeRole(targetUserId: string, role: ProfileRole): Promise<ActionResult> {
  const check = await requireAdmin();
  if (!check.ok) return check;

  const admin = getAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({ role, updated_at: new Date().toISOString() })
    .eq("id", targetUserId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/users");
  return { ok: true };
}

export async function removeTeamMember(targetUserId: string): Promise<ActionResult> {
  const check = await requireAdmin();
  if (!check.ok) return check;
  if (targetUserId === check.userId) {
    return { ok: false, error: "Nu îți poți șterge propriul cont aici" };
  }

  const admin = getAdminClient();
  const { error } = await admin.auth.admin.deleteUser(targetUserId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/users");
  return { ok: true };
}
