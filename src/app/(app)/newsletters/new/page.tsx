import { redirect } from "next/navigation";
import { getUserInfo } from "@/lib/supabase/getUser";
import { getAdminClient } from "@/lib/supabase/admin";
import { getProfileCached } from "@/lib/queries/profile";
import { createNewsletter } from "@/app/actions/newsletter-actions";

export default async function NewNewsletterPage() {
  const info = await getUserInfo();
  if (!info) redirect("/login");

  const admin = getAdminClient();
  const profile = await getProfileCached(admin, info.id);
  if (profile?.role !== "admin") redirect("/dashboard");

  const result = await createNewsletter();
  if (!result.ok) redirect("/newsletters");
  redirect(`/newsletters/${result.data.id}`);
}
