"use client";

import { useMemo, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { CheckIcon, SpinnerIcon } from "@/components/icons";
import { resetInviteTemplate, saveInviteTemplate } from "@/app/actions/settings-actions";
import {
  PREVIEW_VARS,
  TEMPLATE_VARIABLES,
  renderTemplate,
  type InviteTemplate,
} from "@/lib/invite-template";

type Props = {
  initial: InviteTemplate;
};

export function InviteTemplateEditor({ initial }: Props) {
  const router = useRouter();
  const [subject, setSubject] = useState(initial.subject);
  const [bodyHtml, setBodyHtml] = useState(initial.bodyHtml);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();
  const [resetting, startResetTransition] = useTransition();

  const previewSubject = useMemo(() => renderTemplate(subject, PREVIEW_VARS), [subject]);
  const previewHtml = useMemo(() => renderTemplate(bodyHtml, PREVIEW_VARS), [bodyHtml]);

  const dirty = subject !== initial.subject || bodyHtml !== initial.bodyHtml;

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await saveInviteTemplate({ subject, bodyHtml });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSaved(true);
      router.refresh();
    });
  };

  const onReset = () => {
    if (!window.confirm("Resetezi template-ul la valorile implicite?")) return;
    setError(null);
    setSaved(false);
    startResetTransition(async () => {
      const result = await resetInviteTemplate();
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSubject(result.data.subject);
      setBodyHtml(result.data.bodyHtml);
      setSaved(true);
      router.refresh();
    });
  };

  const insertVar = (key: string) => {
    setBodyHtml((prev) => `${prev}{{${key}}}`);
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      <div className="border-border bg-surface-elevated rounded-xs border">
        <div className="border-border border-b px-5 py-4">
          <h2 className="text-foreground text-base font-medium">Template invitație</h2>
          <p className="text-text-muted mt-1 text-xs">
            Variabile disponibile:{" "}
            {TEMPLATE_VARIABLES.map((v, i) => (
              <span key={v.key}>
                <button
                  type="button"
                  onClick={() => insertVar(v.key)}
                  title={v.label}
                  className="bg-surface-muted text-primary-700 hover:bg-primary-50 rounded-xs px-1.5 py-0.5 font-mono text-[11px]"
                >
                  {`{{${v.key}}}`}
                </button>
                {i < TEMPLATE_VARIABLES.length - 1 && " "}
              </span>
            ))}
          </p>
        </div>

        <div className="flex flex-col gap-4 p-5">
          <label className="flex flex-col gap-1">
            <span className="text-text-secondary text-sm font-medium">
              Subiect <span className="text-danger">*</span>
            </span>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="border-border bg-surface text-foreground hover:border-primary focus:border-primary h-10 rounded-xs border px-3 text-sm transition focus:outline-none"
            />
          </label>

          <div className="grid gap-4 lg:grid-cols-2">
            <label className="flex flex-col gap-1">
              <span className="text-text-secondary text-sm font-medium">
                Conținut HTML <span className="text-danger">*</span>
              </span>
              <textarea
                required
                value={bodyHtml}
                onChange={(e) => setBodyHtml(e.target.value)}
                spellCheck={false}
                rows={20}
                className="border-border bg-surface text-foreground hover:border-primary focus:border-primary min-h-[400px] rounded-xs border px-3 py-2 font-mono text-[12px] leading-relaxed transition focus:outline-none"
              />
            </label>

            <div className="flex flex-col gap-1">
              <span className="text-text-secondary text-sm font-medium">Previzualizare</span>
              <div className="border-border bg-surface flex flex-col overflow-hidden rounded-xs border">
                <div className="border-border bg-surface-muted border-b px-3 py-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-text-muted">Subiect:</span>
                    <span className="text-foreground truncate font-medium">
                      {previewSubject || "—"}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-text-muted">Către:</span>
                    <span className="text-foreground truncate">
                      {PREVIEW_VARS.fullName} &lt;{PREVIEW_VARS.email}&gt;
                    </span>
                  </div>
                </div>
                <iframe
                  title="Previzualizare email"
                  sandbox=""
                  srcDoc={previewHtml}
                  className="h-[400px] w-full bg-white"
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="border-danger-200 bg-danger-50 text-danger-700 rounded-xs border px-3 py-2 text-sm">
              {error}
            </div>
          )}
          {saved && !error && (
            <div className="border-success-200 bg-success-50 text-success-700 inline-flex items-center gap-2 rounded-xs border px-3 py-2 text-sm">
              <CheckIcon className="h-4 w-4" />
              Template salvat.
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
            <button
              type="button"
              onClick={onReset}
              disabled={resetting || pending}
              className="border-border bg-surface-elevated text-text-secondary hover:border-danger hover:text-danger inline-flex h-10 items-center justify-center gap-2 rounded-xs border px-4 text-sm transition disabled:cursor-not-allowed disabled:opacity-60"
            >
              {resetting && <SpinnerIcon className="h-4 w-4" />}
              Resetează la implicit
            </button>

            <button
              type="submit"
              disabled={pending || !dirty}
              className="bg-primary text-text-inverse hover:bg-primary-600 inline-flex h-10 items-center justify-center gap-2 rounded-xs px-4 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pending && <SpinnerIcon className="h-4 w-4" />}
              Salvează template-ul
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
