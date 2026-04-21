import "server-only";
import { getAdminClient } from "@/lib/supabase/admin";
import type { ProfileRole } from "@/lib/supabase/database.types";
import { UsersView, type TeamMember } from "./UsersView";

type Props = {
  currentUserId: string;
};

export async function UsersLoader({ currentUserId }: Props) {
  const admin = getAdminClient();

  const { data: profiles, error: profilesErr } = await admin
    .from("profiles")
    .select("id, full_name, phone, role, avatar_url, created_at")
    .order("created_at", { ascending: true });

  if (profilesErr) {
    return (
      <div className="border-danger-200 bg-danger-50 text-danger-700 rounded-xs border px-4 py-3 text-sm">
        Nu am putut încărca membrii echipei: {profilesErr.message}
      </div>
    );
  }

  const emailsById = new Map<string, string | null>();
  let page = 1;
  const perPage = 1000;
  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) break;
    for (const u of data.users) emailsById.set(u.id, u.email ?? null);
    if (data.users.length < perPage) break;
    page++;
  }

  const members: TeamMember[] = (profiles ?? []).map((p) => ({
    id: p.id,
    fullName: p.full_name,
    phone: p.phone,
    role: p.role as ProfileRole,
    avatarUrl: p.avatar_url,
    email: emailsById.get(p.id) ?? null,
    createdAt: p.created_at,
  }));

  return <UsersView members={members} currentUserId={currentUserId} />;
}
