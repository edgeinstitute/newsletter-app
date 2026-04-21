"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSupabase } from "@/providers/SupabaseProvider";
import { SpinnerIcon } from "@/components/icons";

function passwordStrength(pw: string): { score: number; label: string } {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) score++;
  const label = ["Slabă", "Acceptabilă", "Bună", "Puternică"][Math.max(0, score - 1)] ?? "Slabă";
  return { score, label };
}

export function SetupPasswordClient() {
  const supabase = useSupabase();
  const router = useRouter();
  const params = useSearchParams();
  const isRecovery = params.get("mode") === "recovery";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const strength = useMemo(() => passwordStrength(password), [password]);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Parola trebuie să aibă minim 8 caractere");
      return;
    }
    if (password !== confirm) {
      setError("Parolele nu coincid");
      return;
    }
    setSubmitting(true);
    const { error: updateErr } = await supabase.auth.updateUser({ password });
    if (updateErr) {
      setSubmitting(false);
      setError(updateErr.message);
      return;
    }
    router.replace("/dashboard");
    router.refresh();
  };

  return (
    <main className="flex min-h-[100svh] items-center justify-center bg-surface px-4 py-12">
      <div className="w-full max-w-md animate-fade-in-up">
        <div className="mb-8 text-center">
          <h1 className="font-display text-3xl text-foreground">
            {isRecovery ? "Resetează parola" : "Bine ai venit"}
          </h1>
          <p className="mt-2 text-sm text-text-secondary">
            {isRecovery
              ? "Alege o parolă nouă pentru contul tău"
              : "Setează parola pentru a activa contul"}
          </p>
        </div>

        <form
          onSubmit={onSubmit}
          className="rounded-xs border border-border bg-surface-elevated p-6 shadow-sm"
          noValidate
        >
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label htmlFor="password" className="text-sm font-medium text-text-secondary">
                Parolă nouă
              </label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-10 rounded-xs border border-border bg-surface px-3 text-sm text-foreground transition hover:border-primary focus:border-primary focus:outline-none"
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
              {password && (
                <p className="text-xs text-text-muted">Siguranță: {strength.label}</p>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="confirm" className="text-sm font-medium text-text-secondary">
                Confirmă parola
              </label>
              <input
                id="confirm"
                type="password"
                autoComplete="new-password"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="h-10 rounded-xs border border-border bg-surface px-3 text-sm text-foreground transition hover:border-primary focus:border-primary focus:outline-none"
              />
            </div>

            {error && (
              <div className="rounded-xs border border-danger-200 bg-danger-50 px-3 py-2 text-xs text-danger-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xs bg-primary text-sm font-medium text-text-inverse transition hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting && <SpinnerIcon className="h-4 w-4" />}
              {isRecovery ? "Schimbă parola" : "Activează contul"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
