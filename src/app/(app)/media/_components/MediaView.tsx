"use client";

import { useMemo, useRef, useState, useTransition, type ChangeEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckIcon, SpinnerIcon, TrashIcon } from "@/components/icons";
import { Dropdown, type DropdownOption } from "@/components/ui/Dropdown";
import { assignMediaToNewsletter, deleteMedia, uploadMedia } from "@/app/actions/media-actions";
import type { WpMediaItem } from "@/lib/wordpress/client";
import type { NewsletterStatus } from "@/lib/supabase/database.types";

export type NewsletterOption = {
  id: string;
  title: string;
  status: NewsletterStatus;
};

type Props = {
  items: WpMediaItem[];
  total: number;
  page: number;
  totalPages: number;
  perPage: number;
  filter: string;
  newsletters: NewsletterOption[];
};

function buildHref(filter: string, page: number): string {
  const params = new URLSearchParams();
  if (filter !== "all") params.set("filter", filter);
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return qs ? `/media?${qs}` : "/media";
}

export function MediaView({ items, total, page, totalPages, perPage, filter, newsletters }: Props) {
  const router = useRouter();
  const [uploadTarget, setUploadTarget] = useState<string>(filter !== "all" ? filter : "");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const newsletterById = useMemo(() => {
    const map = new Map<string, NewsletterOption>();
    for (const n of newsletters) map.set(n.id, n);
    return map;
  }, [newsletters]);

  const onFilesPicked = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (!files.length) return;
    setError(null);
    setSuccess(null);
    setUploading(true);

    const results = await Promise.all(
      files.map(async (file) => {
        const fd = new FormData();
        fd.set("file", file);
        if (uploadTarget) fd.set("newsletterId", uploadTarget);
        const result = await uploadMedia(fd);
        return { file, result };
      }),
    );

    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";

    const uploaded = results.filter((r) => r.result.ok).length;
    const errors = results
      .filter((r) => !r.result.ok)
      .map((r) => `${r.file.name}: ${r.result.ok ? "" : r.result.error}`);

    if (uploaded) {
      setSuccess(
        uploaded === 1 ? "O imagine a fost încărcată." : `${uploaded} imagini au fost încărcate.`,
      );
      router.refresh();
    }
    if (errors.length) setError(errors.join(" · "));
  };

  const onDelete = (id: number, filename: string) => {
    if (!window.confirm(`Ștergi "${filename}" din WordPress? Acțiunea este ireversibilă.`)) return;
    setError(null);
    setSuccess(null);
    setPendingId(id);
    startTransition(async () => {
      const result = await deleteMedia(id);
      setPendingId(null);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  };

  const onReassign = (id: number, newsletterId: string) => {
    setError(null);
    setSuccess(null);
    setPendingId(id);
    startTransition(async () => {
      const target = newsletterId === "__none__" ? null : newsletterId;
      const result = await assignMediaToNewsletter(id, target);
      setPendingId(null);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  };

  const onCopy = async (id: number, url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      window.setTimeout(() => {
        setCopiedId((c) => (c === id ? null : c));
      }, 1500);
    } catch {
      window.prompt("Copiază URL-ul:", url);
    }
  };

  const sidebarOption = (label: string, active: boolean, href: string, key?: string) => (
    <Link
      key={key}
      href={href}
      scroll={false}
      className={`flex w-full items-center rounded-xs px-3 py-2 text-left text-sm transition ${
        active
          ? "bg-primary-50 text-primary-700"
          : "text-text-secondary hover:bg-surface-muted hover:text-foreground"
      }`}
    >
      <span className="truncate">{label}</span>
    </Link>
  );

  const reassignOptions = (current: string | null): DropdownOption<string>[] => [
    { value: "__none__", label: "Fără newsletter", description: "Scoate din librărie" },
    ...newsletters.map((n) => ({
      value: n.id,
      label: n.title,
      description: n.id === current ? "Asociat curent" : undefined,
    })),
  ];

  const uploadTargetLabel = uploadTarget
    ? `Încarcă în „${newsletterById.get(uploadTarget)?.title ?? uploadTarget}”`
    : "Încarcă fără asociere";

  const firstOnPage = total === 0 ? 0 : (page - 1) * perPage + 1;
  const lastOnPage = Math.min(page * perPage, total);

  return (
    <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
      <aside className="border-border bg-surface-elevated flex h-fit flex-col gap-1 rounded-xs border p-2">
        {sidebarOption("Toate newsletter-ele", filter === "all", buildHref("all", 1))}
        <div className="text-text-muted mt-3 mb-1 px-3 text-[11px] font-medium tracking-wide uppercase">
          Newsletters
        </div>
        {newsletters.length === 0 && (
          <div className="text-text-muted px-3 py-2 text-xs">Nu există newsletters încă.</div>
        )}
        {newsletters.map((n) => sidebarOption(n.title, filter === n.id, buildHref(n.id, 1), n.id))}
      </aside>

      <section className="flex flex-col gap-4">
        <div className="border-border bg-surface-elevated flex flex-col gap-3 rounded-xs border p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-col gap-1">
              <span className="text-text-secondary text-xs font-medium">Asociază la upload</span>
              <Dropdown<string>
                value={uploadTarget}
                onChange={(value) => setUploadTarget(value)}
                options={[
                  { value: "", label: "Fără asociere", description: "Neasociat" },
                  ...newsletters.map((n) => ({
                    value: n.id,
                    label: n.title,
                  })),
                ]}
                buttonClassName="min-w-[260px]"
                placeholder="Alege newsletter"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml"
                multiple
                onChange={onFilesPicked}
                disabled={uploading}
                className="hidden"
                id="media-upload-input"
              />
              <label
                htmlFor="media-upload-input"
                className={`bg-primary text-text-inverse hover:bg-primary-600 inline-flex h-10 items-center justify-center gap-2 rounded-xs px-4 text-sm font-medium transition ${
                  uploading ? "cursor-not-allowed opacity-60" : "cursor-pointer"
                }`}
              >
                {uploading && <SpinnerIcon className="h-4 w-4" />}
                {uploading ? "Se încarcă…" : "+ Încarcă imagini"}
              </label>
            </div>
          </div>
          <p className="text-text-muted text-xs">
            {uploadTargetLabel} · PNG/JPG/GIF/WebP/SVG, max 15MB per fișier.
          </p>
          {error && (
            <div className="border-danger-200 bg-danger-50 text-danger-700 rounded-xs border px-3 py-2 text-xs">
              {error}
            </div>
          )}
          {success && !error && (
            <div className="border-success-200 bg-success-50 text-success-700 inline-flex items-center gap-2 rounded-xs border px-3 py-2 text-xs">
              <CheckIcon className="h-4 w-4" />
              {success}
            </div>
          )}
        </div>

        <div className="text-text-muted flex items-center justify-between text-xs">
          <span>
            {total === 0 ? "Nicio imagine." : `Afișate ${firstOnPage}–${lastOnPage} din ${total}`}
          </span>
          {totalPages > 1 && (
            <span>
              Pagina {page} din {totalPages}
            </span>
          )}
        </div>

        {items.length === 0 ? (
          <div className="border-border bg-surface-elevated text-text-muted rounded-xs border p-8 text-center text-sm">
            Nicio imagine în această categorie. Încarcă una de mai sus.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {items.map((item) => {
              const busy = pendingId === item.id;
              const copied = copiedId === item.id;
              const assigned = item.newsletterId
                ? (newsletterById.get(item.newsletterId)?.title ?? item.newsletterId)
                : "Fără newsletter";
              return (
                <div
                  key={item.id}
                  className="border-border bg-surface-elevated group flex flex-col overflow-hidden rounded-xs border"
                >
                  <div className="bg-surface-muted relative aspect-square overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.thumbnailUrl ?? item.url}
                      alt={item.filename}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover"
                    />
                    {busy && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <SpinnerIcon className="text-text-inverse h-6 w-6" />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 p-2">
                    <p
                      className="text-foreground truncate text-xs font-medium"
                      title={item.filename}
                    >
                      {item.filename}
                    </p>
                    <p className="text-text-muted truncate text-[11px]" title={assigned}>
                      {assigned}
                    </p>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onCopy(item.id, item.url)}
                        className="border-border bg-surface hover:border-primary flex-1 rounded-xs border px-2 py-1.5 text-[11px] transition"
                      >
                        {copied ? "Copiat!" : "Copiază URL"}
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(item.id, item.filename)}
                        aria-label="Șterge imaginea"
                        disabled={busy}
                        className="border-border text-text-secondary hover:border-danger hover:text-danger inline-flex h-7 w-7 items-center justify-center rounded-xs border transition disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <TrashIcon className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <Dropdown<string>
                      value={item.newsletterId ?? "__none__"}
                      options={reassignOptions(item.newsletterId)}
                      onChange={(value) => onReassign(item.id, value)}
                      buttonClassName="h-8 text-[11px]"
                      disabled={busy}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {totalPages > 1 && <Pagination filter={filter} page={page} totalPages={totalPages} />}
      </section>
    </div>
  );
}

function Pagination({
  filter,
  page,
  totalPages,
}: {
  filter: string;
  page: number;
  totalPages: number;
}) {
  const pages = pageWindow(page, totalPages);
  return (
    <nav className="flex items-center justify-center gap-1 pt-2">
      <PageLink
        href={buildHref(filter, Math.max(page - 1, 1))}
        disabled={page === 1}
        label="← Anterior"
      />
      {pages.map((p, idx) =>
        p === "…" ? (
          <span key={`ellipsis-${idx}`} className="text-text-muted px-2 text-sm">
            …
          </span>
        ) : (
          <Link
            key={p}
            href={buildHref(filter, p)}
            scroll={false}
            className={`inline-flex h-9 min-w-9 items-center justify-center rounded-xs border px-3 text-sm transition ${
              p === page
                ? "border-primary bg-primary text-text-inverse"
                : "border-border bg-surface-elevated text-text-secondary hover:border-primary hover:text-foreground"
            }`}
          >
            {p}
          </Link>
        ),
      )}
      <PageLink
        href={buildHref(filter, Math.min(page + 1, totalPages))}
        disabled={page >= totalPages}
        label="Următor →"
      />
    </nav>
  );
}

function PageLink({ href, disabled, label }: { href: string; disabled: boolean; label: string }) {
  if (disabled) {
    return (
      <span className="border-border text-text-muted inline-flex h-9 cursor-not-allowed items-center justify-center rounded-xs border bg-transparent px-3 text-sm opacity-50">
        {label}
      </span>
    );
  }
  return (
    <Link
      href={href}
      scroll={false}
      className="border-border bg-surface-elevated text-text-secondary hover:border-primary hover:text-foreground inline-flex h-9 items-center justify-center rounded-xs border px-3 text-sm transition"
    >
      {label}
    </Link>
  );
}

function pageWindow(current: number, total: number): (number | "…")[] {
  const maxNumbers = 7;
  if (total <= maxNumbers) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const result: (number | "…")[] = [1];
  const start = Math.max(current - 1, 2);
  const end = Math.min(current + 1, total - 1);
  if (start > 2) result.push("…");
  for (let p = start; p <= end; p++) result.push(p);
  if (end < total - 1) result.push("…");
  result.push(total);
  return result;
}
