"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useSupabase } from "@/providers/SupabaseProvider";
import { SpinnerIcon, CheckIcon } from "@/components/icons";

function passwordStrength(pw: string): { score: number; label: string } {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) score++;
  const label = ["Slabă", "Acceptabilă", "Bună", "Puternică"][Math.max(0, score - 1)] ?? "Slabă";
  return { score, label };
}

type Props = {
  email: string | null;
};

export function ChangePasswordSection({ email }: Props) {
  const supabase = useSupabase();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const strength = useMemo(() => passwordStrength(next), [next]);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSavedAt(null);
    if (!email) {
      setError("Emailul contului lipsește");
      return;
    }
    if (next.length < 8) {
      setError("Parola nouă trebuie să aibă minim 8 caractere");
      return;
    }
    if (next !== confirm) {
      setError("Parolele noi nu coincid");
      return;
    }

    setSubmitting(true);

    const { error: signErr } = await supabase.auth.signInWithPassword({
      email,
      password: current,
    });
    if (signErr) {
      setSubmitting(false);
      setError("Parola actuală este incorectă");
      return;
    }

    const { error: upErr } = await supabase.auth.updateUser({ password: next });
    setSubmitting(false);
    if (upErr) {
      setError(upErr.message);
      return;
    }

    setCurrent("");
    setNext("");
    setConfirm("");
    setSavedAt(Date.now());
  };

  return (
    <section className="border-border bg-surface-elevated rounded-xs border p-6">
      <h2 className="text-foreground text-lg font-medium">Schimbă parola</h2>
      <p className="text-text-muted mt-1 text-sm">Introdu parola actuală și alege una nouă.</p>

      <form onSubmit={onSubmit} className="mt-5 flex flex-col gap-4" noValidate>
        <label className="flex flex-col gap-1">
          <span className="text-text-secondary text-sm font-medium">Parola actuală</span>
          <input
            type="password"
            autoComplete="current-password"
            required
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            className="border-border bg-surface text-foreground hover:border-primary focus:border-primary h-10 rounded-xs border px-3 text-sm transition focus:outline-none"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-text-secondary text-sm font-medium">Parolă nouă</span>
          <input
            type="password"
            autoComplete="new-password"
            required
            value={next}
            onChange={(e) => setNext(e.target.value)}
            className="border-border bg-surface text-foreground hover:border-primary focus:border-primary h-10 rounded-xs border px-3 text-sm transition focus:outline-none"
          />
          <div className="mt-2 flex gap-1">
            {[0, 1, 2, 3].map((i) => (
              <span
                key={i}
                className={`h-1 flex-1 rounded-full transition ${
                  i < strength.score
                    ? strength.score <= 1
                      ? "bg-danger"
                      : strength.score === 2
                        ? "bg-warning"
                        : "bg-success"
                    : "bg-surface-strong"
                }`}
              />
            ))}
          </div>
          {next && <p className="text-text-muted text-xs">Siguranță: {strength.label}</p>}
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-text-secondary text-sm font-medium">Confirmă parola nouă</span>
          <input
            type="password"
            autoComplete="new-password"
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="border-border bg-surface text-foreground hover:border-primary focus:border-primary h-10 rounded-xs border px-3 text-sm transition focus:outline-none"
          />
        </label>

        {error && (
          <div className="border-danger-200 bg-danger-50 text-danger-700 rounded-xs border px-3 py-2 text-xs">
            {error}
          </div>
        )}

        <div className="flex items-center justify-end gap-3">
          {savedAt && (
            <span className="text-success-700 inline-flex items-center gap-1 text-xs">
              <CheckIcon className="h-3.5 w-3.5" /> Parolă actualizată
            </span>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="bg-primary text-text-inverse hover:bg-primary-600 inline-flex h-10 items-center justify-center gap-2 rounded-xs px-4 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting && <SpinnerIcon className="h-4 w-4" />}
            Schimbă parola
          </button>
        </div>
      </form>
    </section>
  );
}
