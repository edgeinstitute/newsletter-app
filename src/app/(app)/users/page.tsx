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
    <div className="flex flex-col gap-6 animate-fade-in-up">
      <header>
        <h1 className="font-display text-3xl text-foreground">Echipa</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Administrează membrii, rolurile și accesul la funcții.
        </p>
      </header>

      <Suspense
        fallback={
          <div className="flex justify-center py-12">
            <SpinnerIcon className="h-6 w-6 text-primary" />
          </div>
        }
      >
        <UsersLoader currentUserId={info.id} />
      </Suspense>
    </div>
  );
}
