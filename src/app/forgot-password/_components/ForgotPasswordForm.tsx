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
    <main className="bg-surface flex min-h-[100svh] items-center justify-center px-4 py-12">
      <div className="animate-fade-in-up w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="font-display text-foreground text-3xl">Resetează parola</h1>
          <p className="text-text-secondary mt-2 text-sm">
            Primești un link prin email pentru a alege o parolă nouă
          </p>
        </div>

        {sent ? (
          <div className="border-success-200 bg-success-50 rounded-xs border p-6 text-center">
            <p className="text-success-700 text-sm">
              Dacă există un cont cu acest email, vei primi un link în scurt timp.
            </p>
            <Link
              href="/login"
              className="bg-primary text-text-inverse hover:bg-primary-600 mt-4 inline-flex h-10 items-center justify-center rounded-xs px-4 text-sm font-medium transition"
            >
              Înapoi la autentificare
            </Link>
          </div>
        ) : (
          <form
            onSubmit={onSubmit}
            className="border-border bg-surface-elevated rounded-xs border p-6 shadow-sm"
            noValidate
          >
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label htmlFor="email" className="text-text-secondary text-sm font-medium">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="border-border bg-surface text-foreground hover:border-primary focus:border-primary h-10 rounded-xs border px-3 text-sm transition focus:outline-none"
                />
              </div>

              {error && (
                <div className="border-danger-200 bg-danger-50 text-danger-700 rounded-xs border px-3 py-2 text-xs">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="bg-primary text-text-inverse hover:bg-primary-600 inline-flex h-10 items-center justify-center gap-2 rounded-xs text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting && <SpinnerIcon className="h-4 w-4" />}
                Trimite link de resetare
              </button>

              <Link
                href="/login"
                className="text-primary-700 hover:text-primary text-center text-xs"
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
