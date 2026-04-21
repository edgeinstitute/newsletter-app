import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getUserInfo } from "@/lib/supabase/getUser";
import { getAdminClient } from "@/lib/supabase/admin";
import { getProfileCached } from "@/lib/queries/profile";
import { UsersLoader } from "./_components/UsersLoader";
import { SpinnerIcon } from "@/components/icons";

export default async function UsersPage() {
  const info = await getUserInfo();
  if (!info) redirect("/login");

  const admin = getAdminClient();
  const profile = await getProfileCached(admin, info.id);
  const isAdmin = profile?.role === "admin";
  if (!isAdmin) redirect("/dashboard");

  return (
    <div className="animate-fade-in-up flex flex-col gap-6">
      <header>
        <h1 className="font-display text-foreground text-3xl">Echipa</h1>
        <p className="text-text-secondary mt-1 text-sm">
          Administrează membrii, rolurile și accesul la funcții.
        </p>
      </header>

      <Suspense
        fallback={
          <div className="flex justify-center py-12">
            <SpinnerIcon className="text-primary h-6 w-6" />
          </div>
        }
      >
        <UsersLoader currentUserId={info.id} />
      </Suspense>
    </div>
  );
}
