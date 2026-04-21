import { redirect } from "next/navigation";
import { getUserInfo } from "@/lib/supabase/getUser";
import { getAdminClient } from "@/lib/supabase/admin";
import { getProfileCached } from "@/lib/queries/profile";
import { ProfileForm } from "./_components/ProfileForm";
import { AvatarUpload } from "./_components/AvatarUpload";
import { ChangePasswordSection } from "./_components/ChangePasswordSection";
import { DeleteAccountSection } from "./_components/DeleteAccountSection";

export default async function ProfilePage() {
  const info = await getUserInfo();
  if (!info) redirect("/login");

  const admin = getAdminClient();
  const profile = await getProfileCached(admin, info.id);
  if (!profile) redirect("/login");

  return (
    <div className="flex flex-col gap-8 animate-fade-in-up">
      <header>
        <h1 className="font-display text-3xl text-foreground">Profilul meu</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Gestionează datele contului și preferințele de securitate.
        </p>
      </header>

      <AvatarUpload
        userId={info.id}
        initialAvatarUrl={profile.avatar_url}
        displayName={profile.full_name ?? info.name ?? ""}
      />

      <ProfileForm
        email={info.email}
        role={profile.role}
        initialFullName={profile.full_name ?? info.name ?? ""}
        initialPhone={profile.phone ?? ""}
      />

      <ChangePasswordSection email={info.email} />

      <DeleteAccountSection email={info.email} />
    </div>
  );
}
