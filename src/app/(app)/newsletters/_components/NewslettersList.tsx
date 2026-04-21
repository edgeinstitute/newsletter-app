"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SpinnerIcon, TrashIcon } from "@/components/icons";
import { createNewsletter, deleteNewsletter } from "@/app/actions/newsletter-actions";
import type { NewsletterRow } from "@/lib/queries/newsletters";
import { newsletterStatusLabel, newsletterStatusTone } from "@/lib/newsletter/status-ui";

type Props = {
  rows: NewsletterRow[];
  beehiivConfigured: boolean;
};

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("ro-RO", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function NewslettersList({ rows, beehiivConfigured }: Props) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const onCreate = async () => {
    setError(null);
    setCreating(true);
    const result = await createNewsletter();
    setCreating(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.push(`/newsletters/${result.data.id}`);
  };

  const onDelete = (id: string, title: string) => {
    const label = title.trim() || "acest newsletter";
    if (!window.confirm(`Ștergi "${label}"? Acțiunea este ireversibilă.`)) return;
    setError(null);
    setPendingId(id);
    startTransition(async () => {
      const result = await deleteNewsletter(id);
      setPendingId(null);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  };

  return (
    <div className="flex flex-col gap-4">
      {!beehiivConfigured && (
        <div className="border-border bg-surface-muted text-text-secondary rounded-xs border px-4 py-3 text-sm">
          beehiiv nu este configurat. Deschide{" "}
          <Link href="/settings?tab=beehiiv" className="text-primary underline">
            Setări → beehiiv
          </Link>{" "}
          pentru a adăuga cheia API și Publication ID.
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={onCreate}
          disabled={creating}
          className="bg-primary text-text-inverse hover:bg-primary-600 inline-flex h-10 items-center justify-center gap-2 rounded-xs px-4 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60"
        >
          {creating && <SpinnerIcon className="h-4 w-4" />}+ Newsletter nou
        </button>
      </div>

      {error && (
        <div className="border-danger-200 bg-danger-50 text-danger-700 rounded-xs border px-3 py-2 text-sm">
          {error}
        </div>
      )}

      <div className="border-border bg-surface-elevated overflow-hidden rounded-xs border">
        <ul className="divide-border divide-y">
          {rows.length === 0 && (
            <li className="text-text-muted p-6 text-center text-sm">
              Niciun newsletter încă. Apasă „+ Newsletter nou” pentru a începe.
            </li>
          )}
          {rows.map((row) => {
            const busy = pendingId === row.id;
            const title = row.title.trim() || "Fără titlu";
            return (
              <li
                key={row.id}
                className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-4"
              >
                <Link href={`/newsletters/${row.id}`} className="min-w-0 flex-1 hover:opacity-80">
                  <p className="text-foreground truncate text-sm font-medium">{title}</p>
                  <p className="text-text-muted truncate text-xs">
                    {row.subtitle.trim() || `Ultima modificare ${formatDate(row.updatedAt)}`}
                  </p>
                </Link>

                <div className="flex flex-wrap items-center gap-3 sm:justify-end">
                  <span
                    className={`rounded-full px-2 py-1 text-xs ${newsletterStatusTone[row.status]}`}
                  >
                    {newsletterStatusLabel[row.status]}
                  </span>
                  <button
                    type="button"
                    onClick={() => onDelete(row.id, title)}
                    disabled={busy}
                    aria-label={`Șterge ${title}`}
                    className="border-border text-text-secondary hover:border-danger hover:text-danger inline-flex h-9 w-9 items-center justify-center rounded-xs border transition disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {busy ? <SpinnerIcon className="h-4 w-4" /> : <TrashIcon className="h-4 w-4" />}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
