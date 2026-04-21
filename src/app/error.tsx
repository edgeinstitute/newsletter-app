"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="bg-surface flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-md text-center">
        <p className="text-text-muted text-xs tracking-widest uppercase">Eroare</p>
        <h1 className="font-display text-foreground mt-3 text-3xl">Ceva nu a mers bine</h1>
        <p className="text-text-secondary mt-2 text-sm">
          A apărut o eroare neașteptată. Poți încerca din nou sau reîncărca pagina.
        </p>
        {error.digest && (
          <p className="text-text-muted mt-4 font-mono text-xs">ID: {error.digest}</p>
        )}
        <div className="mt-6 flex justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="bg-primary text-text-inverse hover:bg-primary-600 rounded-xs px-4 py-2 text-sm font-medium transition"
          >
            Încearcă din nou
          </button>
          <Link
            href="/"
            className="border-border bg-surface-elevated text-foreground hover:border-primary rounded-xs border px-4 py-2 text-sm font-medium transition"
          >
            Acasă
          </Link>
        </div>
      </div>
    </div>
  );
}
