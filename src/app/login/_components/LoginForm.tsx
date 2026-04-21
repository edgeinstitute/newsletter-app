"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSupabase } from "@/providers/SupabaseProvider";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { SpinnerIcon } from "@/components/icons";

export function LoginForm() {
  const supabase = useSupabase();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (signInError) {
      setSubmitting(false);
      setError(
        signInError.message === "Invalid login credentials"
          ? "Email sau parolă incorectă"
          : signInError.message,
      );
      return;
    }
    router.replace("/dashboard");
    router.refresh();
  };

  return (
    <main className="relative flex min-h-[100svh] items-center justify-center bg-surface px-4 py-12">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md animate-fade-in-up">
        <div className="mb-8 text-center">
          <h1 className="font-display text-4xl text-foreground">EDGE</h1>
          <p className="mt-2 text-sm text-text-secondary">
            Autentifică-te pentru a accesa platforma
          </p>
        </div>

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
                placeholder="nume@domeniu.ro"
              />
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-medium text-text-secondary">
                  Parolă
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-primary-700 hover:text-primary"
                >
                  Ai uitat parola?
                </Link>
              </div>
              <input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
              Intră în cont
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
