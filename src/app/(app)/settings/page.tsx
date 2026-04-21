import { redirect } from "next/navigation";
import { getUserInfo } from "@/lib/supabase/getUser";
import { getAdminClient } from "@/lib/supabase/admin";
import { getProfileCached } from "@/lib/queries/profile";
import {
  getInviteTemplateOrDefault,
  getMailgunConfigPublic,
} from "@/lib/queries/settings";
import { SettingsView } from "./_components/SettingsView";

export default async function SettingsPage() {
  const info = await getUserInfo();
  if (!info) redirect("/login");

  const admin = getAdminClient();
  const profile = await getProfileCached(admin, info.id);
  if (profile?.role !== "admin") redirect("/dashboard");

  const [mailgun, template] = await Promise.all([
    getMailgunConfigPublic(admin),
    getInviteTemplateOrDefault(admin),
  ]);

  return (
    <div className="flex flex-col gap-6 animate-fade-in-up">
      <header>
        <h1 className="font-display text-3xl text-foreground">Setări</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Configurează integrările platformei și template-urile de email.
        </p>
      </header>

      <SettingsView mailgun={mailgun} template={template} />
    </div>
  );
}
