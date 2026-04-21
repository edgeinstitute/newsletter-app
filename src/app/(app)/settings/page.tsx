import { redirect } from "next/navigation";
import { getUserInfo } from "@/lib/supabase/getUser";
import { getAdminClient } from "@/lib/supabase/admin";
import { getProfileCached } from "@/lib/queries/profile";
import {
  getBeehiivConfigPublic,
  getInviteTemplateOrDefault,
  getMailgunConfigPublic,
  getWordpressConfigPublic,
} from "@/lib/queries/settings";
import { SettingsView } from "./_components/SettingsView";

type SettingsTab = "mailgun" | "beehiiv" | "wordpress" | "template" | "invite";
const ALLOWED_TABS: SettingsTab[] = ["mailgun", "beehiiv", "wordpress", "template", "invite"];

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const info = await getUserInfo();
  if (!info) redirect("/login");

  const admin = getAdminClient();
  const profile = await getProfileCached(admin, info.id);
  if (profile?.role !== "admin") redirect("/dashboard");

  const [mailgun, beehiiv, wordpress, template] = await Promise.all([
    getMailgunConfigPublic(admin),
    getBeehiivConfigPublic(admin),
    getWordpressConfigPublic(admin),
    getInviteTemplateOrDefault(admin),
  ]);

  const { tab } = await searchParams;
  const initialTab = ALLOWED_TABS.find((t) => t === tab);

  return (
    <div className="animate-fade-in-up flex flex-col gap-6">
      <header>
        <h1 className="font-display text-foreground text-3xl">Setări</h1>
        <p className="text-text-secondary mt-1 text-sm">
          Configurează integrările platformei și template-urile de email.
        </p>
      </header>

      <SettingsView
        mailgun={mailgun}
        beehiiv={beehiiv}
        wordpress={wordpress}
        template={template}
        initialTab={initialTab}
      />
    </div>
  );
}
