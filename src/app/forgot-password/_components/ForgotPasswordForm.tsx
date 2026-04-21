"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useSupabase } from "@/providers/SupabaseProvider";
import { SpinnerIcon } from "@/components/icons";

export function ForgotPasswordForm() {
  const supabase = useSupabase();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const redirectTo = `${window.location.origin}/auth/callback`;
    const { error: resetErr } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo,
    });
    setSubmitting(false);
    if (resetErr) {
      setError(resetErr.message);
      return;
    }
    setSent(true);
  };

  return (
    <main className="flex min-h-[100svh] items-center justify-center bg-surface px-4 py-12">
      <div className="w-full max-w-md animate-fade-in-up">
        <div className="mb-8 text-center">
          <h1 className="font-display text-3xl text-foreground">Resetează parola</h1>
          <p className="mt-2 text-sm text-text-secondary">
            Primești un link prin email pentru a alege o parolă nouă
          </p>
        </div>

        {sent ? (
          <div className="rounded-xs border border-success-200 bg-success-50 p-6 text-center">
            <p className="text-sm text-success-700">
              Dacă există un cont cu acest email, vei primi un link în scurt timp.
            </p>
            <Link
              href="/login"
              className="mt-4 inline-flex h-10 items-center justify-center rounded-xs bg-primary px-4 text-sm font-medium text-text-inverse transition hover:bg-primary-600"
            >
              Înapoi la autentificare
            </Link>
          </div>
        ) : (
          <form
            onSubmit={onSubmit}
            className="rounded-xs border border-border bg-surface-elevated p-6 shadow-sm"
            noValidate
          >
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label htmlFor="email" className="text-sm font-medium text-text-secondary">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                Trimite link de resetare
              </button>

              <Link
                href="/login"
                className="text-center text-xs text-primary-700 hover:text-primary"
              >
                ← Înapoi la autentificare
              </Link>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}
