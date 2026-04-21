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
    <div className="animate-fade-in-up flex flex-col gap-8">
      <header>
        <h1 className="font-display text-foreground text-3xl">Profilul meu</h1>
        <p className="text-text-secondary mt-1 text-sm">
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
