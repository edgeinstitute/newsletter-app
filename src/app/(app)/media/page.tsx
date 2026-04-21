import Link from "next/link";
import { redirect } from "next/navigation";
import { getUserInfo } from "@/lib/supabase/getUser";
import { getAdminClient } from "@/lib/supabase/admin";
import { getProfileCached } from "@/lib/queries/profile";
import { getWordpressConfigPublic } from "@/lib/queries/settings";
import { listNewsletterMetadata } from "@/lib/queries/newsletters";
import { readModule } from "@/lib/server/settings-store";
import { listWpMedia, type WordpressConfig, type WpMediaItem } from "@/lib/wordpress/client";
import { MediaView, type NewsletterOption } from "./_components/MediaView";

const PER_PAGE = 16;

export default async function MediaPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; page?: string }>;
}) {
  const info = await getUserInfo();
  if (!info) redirect("/login");

  const admin = getAdminClient();
  const profile = await getProfileCached(admin, info.id);
  if (profile?.role !== "admin") redirect("/dashboard");

  const { filter: rawFilter = "all", page: rawPage = "1" } = await searchParams;
  const filter = rawFilter && rawFilter !== "" ? rawFilter : "all";
  const page = Math.max(Number.parseInt(rawPage, 10) || 1, 1);

  const [wpPublic, newsletters] = await Promise.all([
    getWordpressConfigPublic(admin),
    listNewsletterMetadata(admin),
  ]);

  if (!wpPublic) {
    return (
      <div className="animate-fade-in-up flex flex-col gap-6">
        <header>
          <h1 className="font-display text-foreground text-3xl">Media</h1>
          <p className="text-text-secondary mt-1 text-sm">
            Încarcă imagini în WordPress și asociază-le cu newsletter-ele tale.
          </p>
        </header>
        <div className="border-border bg-surface-muted text-text-secondary rounded-xs border px-4 py-3 text-sm">
          WordPress nu este configurat. Deschide{" "}
          <Link href="/settings?tab=wordpress" className="text-primary underline">
            Setări → WordPress
          </Link>{" "}
          pentru a adăuga URL-ul site-ului, username-ul și Application Password.
        </div>
      </div>
    );
  }

  const cfg = await readModule<WordpressConfig>("wordpress");
  const search = filter === "all" ? undefined : `edge-nl:${filter}`;
  let items: WpMediaItem[] = [];
  let total = 0;
  let totalPages = 1;
  let loadError: string | null = null;
  if (cfg) {
    const result = await listWpMedia(cfg, { perPage: PER_PAGE, page, search });
    if (result.ok) {
      items = result.data.items;
      total = result.data.total;
      totalPages = Math.max(result.data.totalPages, 1);
    } else {
      loadError = result.error;
    }
  }

  const newsletterOptions: NewsletterOption[] = newsletters.map((n) => ({
    id: n.id,
    title: n.title.trim() || "Fără titlu",
    status: n.status,
  }));

  return (
    <div className="animate-fade-in-up flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="font-display text-foreground text-3xl">Media</h1>
        <p className="text-text-secondary text-sm">
          Imagini asociate cu newsletter-ele tale în WordPress ({wpPublic.siteUrl}).
        </p>
      </header>

      {loadError && (
        <div className="border-danger-200 bg-danger-50 text-danger-700 rounded-xs border px-3 py-2 text-sm">
          {loadError}
        </div>
      )}

      <MediaView
        items={items}
        total={total}
        page={page}
        totalPages={totalPages}
        perPage={PER_PAGE}
        filter={filter}
        newsletters={newsletterOptions}
      />
    </div>
  );
}
