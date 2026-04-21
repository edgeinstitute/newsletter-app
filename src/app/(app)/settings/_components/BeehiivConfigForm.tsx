"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { CheckIcon, EyeIcon, EyeOffIcon, SpinnerIcon } from "@/components/icons";
import { saveBeehiivConfig } from "@/app/actions/newsletter-actions";
import type { PublicBeehiivConfig } from "@/lib/queries/settings";

type Props = {
  initial: PublicBeehiivConfig | null;
};

export function BeehiivConfigForm({ initial }: Props) {
  const router = useRouter();
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [publicationId, setPublicationId] = useState(initial?.publicationId ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSaved(false);

    if (!apiKey && !initial) {
      setError("API Key este obligatoriu la prima configurare");
      return;
    }

    startTransition(async () => {
      const result = await saveBeehiivConfig({ apiKey, publicationId });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSaved(true);
      setApiKey("");
      router.refresh();
    });
  };

  const needsKey = !initial && !apiKey;

  return (
    <div className="border-border bg-surface-elevated rounded-xs border">
      <div className="border-border border-b px-5 py-4">
        <h2 className="text-foreground text-base font-medium">Credențiale beehiiv</h2>
        <p className="text-text-muted mt-1 text-xs">
          Cheia API este criptată cu AES-256 înainte de a fi salvată. Necesită acces la endpoint-ul
          Create Post (plan Enterprise beehiiv).
        </p>
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-4 p-5" noValidate>
        <label className="flex flex-col gap-1">
          <span className="text-text-secondary text-sm font-medium">
            API Key {!initial && <span className="text-danger">*</span>}
          </span>
          <div className="relative">
            <input
              type={showKey ? "text" : "password"}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={
                initial
                  ? `Păstrează ${initial.apiKeyMasked} (lasă gol pentru a nu schimba)`
                  : "Bearer token beehiiv"
              }
              autoComplete="off"
              className="border-border bg-surface text-foreground hover:border-primary focus:border-primary h-10 w-full rounded-xs border px-3 pr-10 text-sm transition focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setShowKey((v) => !v)}
              aria-label={showKey ? "Ascunde cheia" : "Arată cheia"}
              className="text-text-muted hover:bg-surface-muted absolute top-1 right-1 inline-flex h-8 w-8 items-center justify-center rounded-xs"
            >
              {showKey ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
            </button>
          </div>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-text-secondary text-sm font-medium">
            Publication ID <span className="text-danger">*</span>
          </span>
          <input
            type="text"
            required
            value={publicationId}
            onChange={(e) => setPublicationId(e.target.value)}
            placeholder="pub_xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
            className="border-border bg-surface text-foreground hover:border-primary focus:border-primary h-10 rounded-xs border px-3 text-sm transition focus:outline-none"
          />
          <span className="text-text-muted text-xs">
            Îl găsești în Settings → API în dashboard-ul beehiiv.
          </span>
        </label>

        {error && (
          <div className="border-danger-200 bg-danger-50 text-danger-700 rounded-xs border px-3 py-2 text-sm">
            {error}
          </div>
        )}
        {saved && !error && (
          <div className="border-success-200 bg-success-50 text-success-700 inline-flex items-center gap-2 rounded-xs border px-3 py-2 text-sm">
            <CheckIcon className="h-4 w-4" />
            Configurație salvată.
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="submit"
            disabled={pending || needsKey}
            className="bg-primary text-text-inverse hover:bg-primary-600 inline-flex h-10 items-center justify-center gap-2 rounded-xs px-4 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending && <SpinnerIcon className="h-4 w-4" />}
            Salvează configurația
          </button>
        </div>
      </form>
    </div>
  );
}
