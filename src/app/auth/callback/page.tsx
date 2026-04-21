"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSupabase } from "@/providers/SupabaseProvider";
import { SpinnerIcon } from "@/components/icons";

export default function AuthCallbackPage() {
  const supabase = useSupabase();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const hash = window.location.hash.startsWith("#")
        ? window.location.hash.slice(1)
        : window.location.hash;
      const params = new URLSearchParams(hash);

      const errorDescription = params.get("error_description") ?? params.get("error");
      if (errorDescription) {
        if (!cancelled) {
          setError(
            errorDescription.includes("expired")
              ? "Linkul a expirat. Solicită un link nou."
              : decodeURIComponent(errorDescription),
          );
        }
        return;
      }

      const accessToken = params.get("access_token");
      const refreshToken = params.get("refresh_token");
      const type = params.get("type");

      if (!accessToken || !refreshToken) {
        if (!cancelled) setError("Link invalid sau incomplet.");
        return;
      }

      const { error: setErr } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      if (cancelled) return;
      if (setErr) {
        setError(setErr.message);
        return;
      }

      if (type === "invite") {
        router.replace("/auth/setup-password");
      } else if (type === "recovery") {
        router.replace("/auth/setup-password?mode=recovery");
      } else {
        router.replace("/dashboard");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router, supabase]);

  return (
    <main className="bg-surface flex min-h-[100svh] items-center justify-center px-4">
      <div className="border-border bg-surface-elevated animate-fade-in w-full max-w-sm rounded-xs border p-6 text-center">
        {error ? (
          <>
            <h1 className="font-display text-foreground text-2xl">Eroare</h1>
            <p className="text-danger-700 mt-2 text-sm">{error}</p>
            <button
              type="button"
              onClick={() => router.replace("/login")}
              className="bg-primary text-text-inverse hover:bg-primary-600 mt-4 inline-flex h-10 items-center justify-center rounded-xs px-4 text-sm font-medium transition"
            >
              Înapoi la autentificare
            </button>
          </>
        ) : (
          <>
            <SpinnerIcon className="text-primary mx-auto h-6 w-6" />
            <p className="text-text-secondary mt-3 text-sm">Se verifică linkul…</p>
          </>
        )}
      </div>
    </main>
  );
}
