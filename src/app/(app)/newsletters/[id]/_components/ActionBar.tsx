"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckIcon, SpinnerIcon } from "@/components/icons";
import { pushNewsletterToBeehiiv, sendTestNewsletter } from "@/app/actions/newsletter-actions";
import type { NewsletterStatus } from "@/lib/supabase/database.types";
import { newsletterStatusLabel, newsletterStatusTone } from "@/lib/newsletter/status-ui";

type SaveState = "idle" | "pending" | "saving" | "saved" | "error";

type Props = {
  id: string;
  title: string;
  subtitle: string;
  previewText: string;
  onTitleChange: (value: string) => void;
  onSubtitleChange: (value: string) => void;
  onPreviewTextChange: (value: string) => void;
  status: NewsletterStatus;
  beehiivPostId: string | null;
  beehiivConfigured: boolean;
  saveState: SaveState;
  saveError: string | null;
  blocksCount: number;
  saveIsBlocking: boolean;
  lastError: string | null;
  onPushStarted: () => void;
  onPushed: (postId: string) => void;
  onPushFailed: (error: string) => void;
};

export function ActionBar({
  id,
  title,
  subtitle,
  previewText,
  onTitleChange,
  onSubtitleChange,
  onPreviewTextChange,
  status,
  beehiivPostId,
  beehiivConfigured,
  saveState,
  saveError,
  blocksCount,
  saveIsBlocking,
  lastError,
  onPushStarted,
  onPushed,
  onPushFailed,
}: Props) {
  const [testOpen, setTestOpen] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: true } | { ok: false; error: string } | null>(
    null,
  );

  const [pushing, setPushing] = useState(false);

  const saveBadge =
    saveState === "saving"
      ? "Se salvează…"
      : saveState === "pending"
        ? "Modificări nesalvate"
        : saveState === "error"
          ? (saveError ?? "Eroare la salvare")
          : "Salvat";

  const saveBadgeTone =
    saveState === "saving" || saveState === "pending"
      ? "text-text-muted"
      : saveState === "error"
        ? "text-danger-700"
        : "text-success-700";

  const pushDisabled =
    pushing ||
    status === "syncing" ||
    saveIsBlocking ||
    !beehiivConfigured ||
    blocksCount === 0 ||
    !title.trim();

  const pushDisabledReason = !beehiivConfigured
    ? "Configurează beehiiv în Setări"
    : !title.trim()
      ? "Adaugă un titlu"
      : blocksCount === 0
        ? "Adaugă cel puțin un bloc"
        : saveIsBlocking
          ? "Așteaptă salvarea"
          : undefined;

  const onPush = async () => {
    if (
      !window.confirm(
        "Trimiți draftul în beehiiv? Vei putea apoi să-l trimiți subscriberilor din beehiiv.",
      )
    ) {
      return;
    }
    setPushing(true);
    onPushStarted();
    const result = await pushNewsletterToBeehiiv(id);
    setPushing(false);
    if (!result.ok) {
      onPushFailed(result.error);
      return;
    }
    onPushed(result.data.beehiivPostId);
  };

  const onSendTest = async () => {
    if (!testEmail.trim()) return;
    setTesting(true);
    setTestResult(null);
    const result = await sendTestNewsletter(id, testEmail);
    setTesting(false);
    setTestResult(result);
  };

  return (
    <div className="border-border bg-surface-elevated flex flex-col gap-4 rounded-xs border p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <Link
          href="/newsletters"
          className="text-text-secondary hover:text-foreground text-xs transition"
        >
          ← Înapoi la lista de newsletters
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-full px-2 py-1 text-xs ${newsletterStatusTone[status]}`}>
            {newsletterStatusLabel[status]}
          </span>
          <span className={`text-xs ${saveBadgeTone}`}>{saveBadge}</span>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <input
          type="text"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Titlul newsletter-ului"
          maxLength={300}
          className="text-foreground hover:border-primary focus:border-primary rounded-xs border border-transparent bg-transparent px-2 py-1 text-2xl font-semibold tracking-tight transition focus:outline-none"
        />
        <input
          type="text"
          value={subtitle}
          onChange={(e) => onSubtitleChange(e.target.value)}
          placeholder="Subtitlu (opțional)"
          maxLength={300}
          className="text-text-secondary hover:border-primary focus:border-primary rounded-xs border border-transparent bg-transparent px-2 py-1 text-sm transition focus:outline-none"
        />
        <input
          type="text"
          value={previewText}
          onChange={(e) => onPreviewTextChange(e.target.value)}
          placeholder="Preview text (apare în inbox, opțional)"
          maxLength={300}
          className="text-text-muted hover:border-primary focus:border-primary rounded-xs border border-transparent bg-transparent px-2 py-1 text-xs transition focus:outline-none"
        />
      </div>

      {lastError && status === "failed" && (
        <div className="border-danger-200 bg-danger-50 text-danger-700 rounded-xs border px-3 py-2 text-xs">
          <p className="font-medium">Ultima trimitere a eșuat:</p>
          <p className="mt-1 break-words">{lastError}</p>
        </div>
      )}

      {status === "synced" && beehiivPostId && (
        <div className="border-success-200 bg-success-50 text-success-700 inline-flex items-center gap-2 rounded-xs border px-3 py-2 text-xs">
          <CheckIcon className="h-4 w-4" />
          <span>
            Salvat în beehiiv ca draft (<span className="font-mono">{beehiivPostId}</span>). Intră
            în dashboard-ul beehiiv pentru a-l trimite subscriberilor.
          </span>
        </div>
      )}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
        {!testOpen ? (
          <button
            type="button"
            onClick={() => setTestOpen(true)}
            className="border-border bg-surface-elevated text-foreground hover:border-primary inline-flex h-10 items-center justify-center gap-2 rounded-xs border px-4 text-sm transition"
          >
            Previzualizare email
          </button>
        ) : (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="tu@exemplu.ro"
              className="border-border bg-surface text-foreground hover:border-primary focus:border-primary h-10 rounded-xs border px-3 text-sm transition focus:outline-none"
            />
            <button
              type="button"
              onClick={onSendTest}
              disabled={testing || !testEmail.trim()}
              className="border-border bg-surface-elevated text-foreground hover:border-primary inline-flex h-10 items-center justify-center gap-2 rounded-xs border px-4 text-sm transition disabled:cursor-not-allowed disabled:opacity-60"
            >
              {testing && <SpinnerIcon className="h-4 w-4" />}
              Trimite test
            </button>
            <button
              type="button"
              onClick={() => {
                setTestOpen(false);
                setTestResult(null);
              }}
              className="text-text-muted hover:text-foreground text-sm"
            >
              Închide
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={onPush}
          disabled={pushDisabled}
          title={pushDisabledReason}
          className="bg-primary text-text-inverse hover:bg-primary-600 inline-flex h-10 items-center justify-center gap-2 rounded-xs px-4 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60"
        >
          {(pushing || status === "syncing") && <SpinnerIcon className="h-4 w-4" />}
          Trimite în beehiiv
        </button>
      </div>

      {testResult && (
        <div className="flex justify-end">
          {testResult.ok ? (
            <div className="border-success-200 bg-success-50 text-success-700 inline-flex items-center gap-2 rounded-xs border px-3 py-2 text-xs">
              <CheckIcon className="h-4 w-4" />
              Previzualizare trimisă. Verifică inbox-ul.
            </div>
          ) : (
            <div className="border-danger-200 bg-danger-50 text-danger-700 rounded-xs border px-3 py-2 text-xs">
              {testResult.error}
            </div>
          )}
        </div>
      )}

      <p className="text-text-muted text-xs">
        Previzualizarea folosește Mailgun pentru rapiditate — aspectul real este cel generat de
        beehiiv la trimitere.
      </p>
    </div>
  );
}
