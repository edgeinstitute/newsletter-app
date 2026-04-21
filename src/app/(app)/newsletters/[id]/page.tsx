import { notFound, redirect } from "next/navigation";
import { getUserInfo } from "@/lib/supabase/getUser";
import { getAdminClient } from "@/lib/supabase/admin";
import { getProfileCached } from "@/lib/queries/profile";
import { getBeehiivConfigPublic } from "@/lib/queries/settings";
import { getNewsletterRow } from "@/lib/queries/newsletters";
import { NewsletterEditor } from "./_components/NewsletterEditor";

export default async function NewsletterEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const info = await getUserInfo();
  if (!info) redirect("/login");

  const admin = getAdminClient();
  const profile = await getProfileCached(admin, info.id);
  if (profile?.role !== "admin") redirect("/dashboard");

  const [row, beehiiv] = await Promise.all([
    getNewsletterRow(admin, id),
    getBeehiivConfigPublic(admin),
  ]);
  if (!row) notFound();

  return <NewsletterEditor initial={row} beehiivConfigured={Boolean(beehiiv)} />;
}
