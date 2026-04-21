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
    <section className="border-danger-200 bg-danger-50 rounded-xs border p-6">
      <h2 className="text-danger-700 text-lg font-medium">Zonă sensibilă</h2>
      <p className="text-danger-700/80 mt-1 text-sm">
        Ștergerea contului este ireversibilă. Toate datele tale vor fi șterse.
      </p>

      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="border-danger text-danger-700 hover:bg-danger hover:text-text-inverse mt-5 inline-flex h-10 items-center justify-center rounded-xs border bg-transparent px-4 text-sm font-medium transition"
        >
          Șterge contul
        </button>
      ) : (
        <form onSubmit={onSubmit} className="mt-5 flex flex-col gap-3" noValidate>
          <label className="text-danger-700 flex flex-col gap-1 text-sm">
            <span>
              Confirmă ștergerea introducând emailul tău: <strong>{email}</strong>
            </span>
            <input
              type="email"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              className="border-danger-200 bg-surface-elevated text-foreground focus:border-danger h-10 rounded-xs border px-3 text-sm focus:outline-none"
            />
          </label>

          {error && <p className="text-danger-700 text-xs">{error}</p>}

          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={pending}
              className="bg-danger text-text-inverse hover:bg-danger-600 inline-flex h-10 items-center justify-center gap-2 rounded-xs px-4 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60"
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
              className="border-border bg-surface-elevated text-foreground hover:border-primary inline-flex h-10 items-center justify-center rounded-xs border px-4 text-sm transition"
            >
              Renunță
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
