"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { updateUserProfile } from "@/app/actions/user-actions";
import { SpinnerIcon, CheckIcon } from "@/components/icons";
import type { ProfileRole } from "@/lib/supabase/database.types";

const roleLabel: Record<ProfileRole, string> = {
  admin: "Administrator",
  staff: "Echipă",
  viewer: "Vizualizator",
};

type Props = {
  email: string | null;
  role: ProfileRole;
  initialFullName: string;
  initialPhone: string;
};

export function ProfileForm({ email, role, initialFullName, initialPhone }: Props) {
  const router = useRouter();
  const [fullName, setFullName] = useState(initialFullName);
  const [phone, setPhone] = useState(initialPhone);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await updateUserProfile({
        full_name: fullName,
        phone: phone || null,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSavedAt(Date.now());
      router.refresh();
    });
  };

  return (
    <section className="rounded-xs border border-border bg-surface-elevated p-6">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-medium text-foreground">Detalii cont</h2>
          <p className="text-sm text-text-muted">Informațiile de bază ale contului tău.</p>
        </div>
        <span className="rounded-full bg-primary-50 px-2 py-1 text-xs text-primary-700">
          {roleLabel[role]}
        </span>
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        <Field label="Nume complet" required>
          <input
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="h-10 rounded-xs border border-border bg-surface px-3 text-sm text-foreground transition hover:border-primary focus:border-primary focus:outline-none"
          />
        </Field>

        <Field label="Telefon">
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+40 7xx xxx xxx"
            className="h-10 rounded-xs border border-border bg-surface px-3 text-sm text-foreground transition hover:border-primary focus:border-primary focus:outline-none"
          />
        </Field>

        <Field label="Email">
          <input
            type="email"
            readOnly
            value={email ?? ""}
            className="h-10 cursor-not-allowed rounded-xs border border-border bg-surface-muted px-3 text-sm text-text-muted"
          />
        </Field>

        {error && (
          <div className="rounded-xs border border-danger-200 bg-danger-50 px-3 py-2 text-xs text-danger-700">
            {error}
          </div>
        )}

        <div className="flex items-center justify-end gap-3">
          {savedAt && !pending && (
            <span className="inline-flex items-center gap-1 text-xs text-success-700">
              <CheckIcon className="h-3.5 w-3.5" /> Salvat
            </span>
          )}
          <button
            type="submit"
            disabled={pending}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xs bg-primary px-4 text-sm font-medium text-text-inverse transition hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending && <SpinnerIcon className="h-4 w-4" />}
            Salvează
          </button>
        </div>
      </form>
    </section>
  );
}

function Field({
  label,
  children,
  required,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-sm font-medium text-text-secondary">
        {label}
        {required && <span className="text-danger"> *</span>}
      </span>
      {children}
    </label>
  );
}
