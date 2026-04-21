import { redirect } from "next/navigation";
import { getUserInfo } from "@/lib/supabase/getUser";
import { getAdminClient } from "@/lib/supabase/admin";
import { getProfileCached } from "@/lib/queries/profile";
import { getBeehiivConfigPublic } from "@/lib/queries/settings";
import { listNewsletterRows } from "@/lib/queries/newsletters";
import { NewslettersList } from "./_components/NewslettersList";

export default async function NewslettersPage() {
  const info = await getUserInfo();
  if (!info) redirect("/login");

  const admin = getAdminClient();
  const profile = await getProfileCached(admin, info.id);
  if (profile?.role !== "admin") redirect("/dashboard");

  const [rows, beehiiv] = await Promise.all([
    listNewsletterRows(admin),
    getBeehiivConfigPublic(admin),
  ]);

  return (
    <div className="animate-fade-in-up flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="font-display text-foreground text-3xl">Newsletters</h1>
        <p className="text-text-secondary text-sm">
          Compune newsletters aici, apoi trimite-le în beehiiv ca draft.
        </p>
      </header>

      <NewslettersList rows={rows} beehiivConfigured={Boolean(beehiiv)} />
    </div>
  );
}
