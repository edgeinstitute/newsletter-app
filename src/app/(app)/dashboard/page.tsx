import { getUserInfo } from "@/lib/supabase/getUser";
import { getAdminClient } from "@/lib/supabase/admin";
import { getProfileCached } from "@/lib/queries/profile";

export default async function DashboardOverviewPage() {
  const info = await getUserInfo();
  const name = info?.name ?? info?.email ?? "";
  const profile = info ? await getProfileCached(getAdminClient(), info.id) : null;
  const isAdmin = profile?.role === "admin";

  return (
    <div className="animate-fade-in-up flex flex-col gap-6">
      <header>
        <h1 className="font-display text-foreground text-3xl">
          Bine ai revenit{name ? `, ${name}` : ""}
        </h1>
        <p className="text-text-secondary mt-1 text-sm">Acesta este panoul tău de administrare.</p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card
          title="Profil"
          description="Actualizează datele și avatarul contului tău."
          href="/profile"
        />
        {isAdmin && (
          <Card
            title="Echipă"
            description="Administrează membrii, rolurile și accesul."
            href="/users"
          />
        )}
      </section>
    </div>
  );
}

function Card({ title, description, href }: { title: string; description: string; href: string }) {
  return (
    <a
      href={href}
      className="border-border bg-surface-elevated hover:border-primary rounded-xs border p-5 transition hover:shadow-sm"
    >
      <h3 className="text-foreground text-base font-medium">{title}</h3>
      <p className="text-text-secondary mt-1 text-sm">{description}</p>
    </a>
  );
}
