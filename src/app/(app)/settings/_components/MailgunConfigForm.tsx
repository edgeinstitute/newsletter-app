"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Dropdown } from "@/components/ui/Dropdown";
import {
  CheckIcon,
  EyeIcon,
  EyeOffIcon,
  SpinnerIcon,
} from "@/components/icons";
import {
  saveMailgunConfig,
  sendMailgunTest,
} from "@/app/actions/settings-actions";
import type { PublicMailgunConfig } from "@/lib/queries/settings";

type Region = "us" | "eu";

const regionOptions: { value: Region; label: string; description: string }[] = [
  { value: "us", label: "US", description: "api.mailgun.net" },
  { value: "eu", label: "EU", description: "api.eu.mailgun.net" },
];

type Props = {
  initial: PublicMailgunConfig | null;
};

export function MailgunConfigForm({ initial }: Props) {
  const router = useRouter();
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [domain, setDomain] = useState(initial?.domain ?? "");
  const [fromEmail, setFromEmail] = useState(initial?.fromEmail ?? "");
  const [fromName, setFromName] = useState(initial?.fromName ?? "");
  const [region, setRegion] = useState<Region>(initial?.region ?? "eu");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  const [testEmail, setTestEmail] = useState("");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<
    { ok: true } | { ok: false; error: string } | null
  >(null);

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSaved(false);

    if (!apiKey && !initial) {
      setError("API Key este obligatoriu la prima configurare");
      return;
    }

    startTransition(async () => {
      const result = await saveMailgunConfig({
        apiKey,
        domain,
        fromEmail,
        fromName,
        region,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSaved(true);
      setApiKey("");
      router.refresh();
    });
  };

  const onTest = async () => {
    if (!testEmail) return;
    setTestResult(null);
    setTesting(true);
    const result = await sendMailgunTest(testEmail);
    setTesting(false);
    setTestResult(result);
  };

  const needsKey = !initial && !apiKey;

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xs border border-border bg-surface-elevated">
        <div className="border-b border-border px-5 py-4">
          <h2 className="text-base font-medium text-foreground">
            Credențiale Mailgun
          </h2>
          <p className="mt-1 text-xs text-text-muted">
            Cheia API este criptată cu AES-256 înainte de a fi salvată.
          </p>
        </div>

        <form onSubmit={onSubmit} className="flex flex-col gap-4 p-5" noValidate>
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-text-secondary">
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
                    : "key-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                }
                autoComplete="off"
                className="h-10 w-full rounded-xs border border-border bg-surface px-3 pr-10 text-sm text-foreground transition hover:border-primary focus:border-primary focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowKey((v) => !v)}
                aria-label={showKey ? "Ascunde cheia" : "Arată cheia"}
                className="absolute right-1 top-1 inline-flex h-8 w-8 items-center justify-center rounded-xs text-text-muted hover:bg-surface-muted"
              >
                {showKey ? (
                  <EyeOffIcon className="h-4 w-4" />
                ) : (
                  <EyeIcon className="h-4 w-4" />
                )}
              </button>
            </div>
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium text-text-secondary">
                Domeniu Mailgun <span className="text-danger">*</span>
              </span>
              <input
                type="text"
                required
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="mg.edgeinstitute.ro"
                className="h-10 rounded-xs border border-border bg-surface px-3 text-sm text-foreground transition hover:border-primary focus:border-primary focus:outline-none"
              />
            </label>

            <Dropdown<Region>
              label="Regiune"
              value={region}
              options={regionOptions}
              onChange={setRegion}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium text-text-secondary">
                Email expeditor <span className="text-danger">*</span>
              </span>
              <input
                type="email"
                required
                value={fromEmail}
                onChange={(e) => setFromEmail(e.target.value)}
                placeholder="noreply@edgeinstitute.ro"
                className="h-10 rounded-xs border border-border bg-surface px-3 text-sm text-foreground transition hover:border-primary focus:border-primary focus:outline-none"
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium text-text-secondary">
                Nume expeditor
              </span>
              <input
                type="text"
                value={fromName}
                onChange={(e) => setFromName(e.target.value)}
                placeholder="EDGE Newsletter"
                className="h-10 rounded-xs border border-border bg-surface px-3 text-sm text-foreground transition hover:border-primary focus:border-primary focus:outline-none"
              />
            </label>
          </div>

          {error && (
            <div className="rounded-xs border border-danger-200 bg-danger-50 px-3 py-2 text-sm text-danger-700">
              {error}
            </div>
          )}
          {saved && !error && (
            <div className="inline-flex items-center gap-2 rounded-xs border border-success-200 bg-success-50 px-3 py-2 text-sm text-success-700">
              <CheckIcon className="h-4 w-4" />
              Configurație salvată.
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="submit"
              disabled={pending || needsKey}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xs bg-primary px-4 text-sm font-medium text-text-inverse transition hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pending && <SpinnerIcon className="h-4 w-4" />}
              Salvează configurația
            </button>
          </div>
        </form>
      </div>

      {initial && (
        <div className="rounded-xs border border-border bg-surface-elevated">
          <div className="border-b border-border px-5 py-4">
            <h2 className="text-base font-medium text-foreground">
              Test de trimitere
            </h2>
            <p className="mt-1 text-xs text-text-muted">
              Trimite un email scurt pentru a verifica conexiunea cu Mailgun.
            </p>
          </div>
          <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-end">
            <label className="flex flex-1 flex-col gap-1">
              <span className="text-sm font-medium text-text-secondary">
                Trimite către
              </span>
              <input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="tu@exemplu.ro"
                className="h-10 rounded-xs border border-border bg-surface px-3 text-sm text-foreground transition hover:border-primary focus:border-primary focus:outline-none"
              />
            </label>
            <button
              type="button"
              onClick={onTest}
              disabled={testing || !testEmail}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xs border border-border bg-surface-elevated px-4 text-sm text-foreground transition hover:border-primary disabled:cursor-not-allowed disabled:opacity-60"
            >
              {testing && <SpinnerIcon className="h-4 w-4" />}
              Trimite test
            </button>
          </div>
          {testResult && (
            <div className="px-5 pb-5">
              {testResult.ok ? (
                <div className="inline-flex items-center gap-2 rounded-xs border border-success-200 bg-success-50 px-3 py-2 text-sm text-success-700">
                  <CheckIcon className="h-4 w-4" />
                  Email trimis.
                </div>
              ) : (
                <div className="rounded-xs border border-danger-200 bg-danger-50 px-3 py-2 text-sm text-danger-700">
                  {testResult.error}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
