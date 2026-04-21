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
    <main className="bg-surface relative flex min-h-[100svh] items-center justify-center px-4 py-12">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="animate-fade-in-up w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="font-display text-foreground text-4xl">EDGE</h1>
          <p className="text-text-secondary mt-2 text-sm">
            Autentifică-te pentru a accesa platforma
          </p>
        </div>

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
                placeholder="nume@domeniu.ro"
              />
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-text-secondary text-sm font-medium">
                  Parolă
                </label>
                <Link
                  href="/forgot-password"
                  className="text-primary-700 hover:text-primary text-xs"
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
              Intră în cont
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
