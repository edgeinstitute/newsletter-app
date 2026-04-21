"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useSupabase } from "@/providers/SupabaseProvider";
import { deleteOwnAccount } from "@/app/actions/auth-actions";
import { SpinnerIcon } from "@/components/icons";

type Props = {
  email: string | null;
};

export function DeleteAccountSection({ email }: Props) {
  const supabase = useSupabase();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    if (!email) {
      setError("Emailul contului lipsește");
      return;
    }
    if (typed.trim().toLowerCase() !== email.toLowerCase()) {
      setError("Emailul introdus nu corespunde contului tău");
      return;
    }
    startTransition(async () => {
      const result = await deleteOwnAccount();
      if (!result.ok) {
        setError(result.error);
        return;
      }
      await supabase.auth.signOut();
      router.replace("/login");
      router.refresh();
    });
  };

  return (
    <section className="rounded-xs border border-danger-200 bg-danger-50 p-6">
      <h2 className="text-lg font-medium text-danger-700">Zonă sensibilă</h2>
      <p className="mt-1 text-sm text-danger-700/80">
        Ștergerea contului este ireversibilă. Toate datele tale vor fi șterse.
      </p>

      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-5 inline-flex h-10 items-center justify-center rounded-xs border border-danger bg-transparent px-4 text-sm font-medium text-danger-700 transition hover:bg-danger hover:text-text-inverse"
        >
          Șterge contul
        </button>
      ) : (
        <form onSubmit={onSubmit} className="mt-5 flex flex-col gap-3" noValidate>
          <label className="flex flex-col gap-1 text-sm text-danger-700">
            <span>Confirmă ștergerea introducând emailul tău: <strong>{email}</strong></span>
            <input
              type="email"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              className="h-10 rounded-xs border border-danger-200 bg-surface-elevated px-3 text-sm text-foreground focus:border-danger focus:outline-none"
            />
          </label>

          {error && <p className="text-xs text-danger-700">{error}</p>}

          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={pending}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xs bg-danger px-4 text-sm font-medium text-text-inverse transition hover:bg-danger-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pending && <SpinnerIcon className="h-4 w-4" />}
              Confirmă ștergerea
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setTyped("");
                setError(null);
              }}
              disabled={pending}
              className="inline-flex h-10 items-center justify-center rounded-xs border border-border bg-surface-elevated px-4 text-sm text-foreground transition hover:border-primary"
            >
              Renunță
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
