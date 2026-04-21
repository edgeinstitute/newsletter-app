import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getUser, getUserInfo } from "@/lib/supabase/getUser";
import { getAdminClient } from "@/lib/supabase/admin";
import { getProfileCached } from "@/lib/queries/profile";
import { DashboardShell } from "./_components/DashboardShell";

const SIDEBAR_COOKIE = "sidebar-collapsed";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [info, user, cookieStore] = await Promise.all([getUserInfo(), getUser(), cookies()]);
  if (!info || !user) redirect("/login");

  const admin = getAdminClient();
  const profile = await getProfileCached(admin, info.id);

  const collapsed = cookieStore.get(SIDEBAR_COOKIE)?.value === "1";

  const displayName = profile?.full_name ?? info.name ?? info.email ?? "Utilizator";

  return (
    <DashboardShell
      initialCollapsed={collapsed}
      user={{
        id: info.id,
        email: info.email,
        displayName,
        role: profile?.role ?? "staff",
        avatarUrl: profile?.avatar_url ?? null,
      }}
    >
      {children}
    </DashboardShell>
  );
}
