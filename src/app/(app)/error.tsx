"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function AppError({
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
    <div className="flex flex-1 items-center justify-center px-6 py-12">
      <div className="w-full max-w-md text-center">
        <p className="text-text-muted text-xs tracking-widest uppercase">Eroare</p>
        <h1 className="font-display text-foreground mt-3 text-2xl">
          Nu am putut încărca această secțiune
        </h1>
        <p className="text-text-secondary mt-2 text-sm">
          Încearcă din nou sau revino la dashboard.
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
            href="/dashboard"
            className="border-border bg-surface-elevated text-foreground hover:border-primary rounded-xs border px-4 py-2 text-sm font-medium transition"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
