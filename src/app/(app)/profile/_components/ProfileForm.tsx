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
    <section className="border-border bg-surface-elevated rounded-xs border p-6">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-foreground text-lg font-medium">Detalii cont</h2>
          <p className="text-text-muted text-sm">Informațiile de bază ale contului tău.</p>
        </div>
        <span className="bg-primary-50 text-primary-700 rounded-full px-2 py-1 text-xs">
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
            className="border-border bg-surface text-foreground hover:border-primary focus:border-primary h-10 rounded-xs border px-3 text-sm transition focus:outline-none"
          />
        </Field>

        <Field label="Telefon">
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+40 7xx xxx xxx"
            className="border-border bg-surface text-foreground hover:border-primary focus:border-primary h-10 rounded-xs border px-3 text-sm transition focus:outline-none"
          />
        </Field>

        <Field label="Email">
          <input
            type="email"
            readOnly
            value={email ?? ""}
            className="border-border bg-surface-muted text-text-muted h-10 cursor-not-allowed rounded-xs border px-3 text-sm"
          />
        </Field>

        {error && (
          <div className="border-danger-200 bg-danger-50 text-danger-700 rounded-xs border px-3 py-2 text-xs">
            {error}
          </div>
        )}

        <div className="flex items-center justify-end gap-3">
          {savedAt && !pending && (
            <span className="text-success-700 inline-flex items-center gap-1 text-xs">
              <CheckIcon className="h-3.5 w-3.5" /> Salvat
            </span>
          )}
          <button
            type="submit"
            disabled={pending}
            className="bg-primary text-text-inverse hover:bg-primary-600 inline-flex h-10 items-center justify-center gap-2 rounded-xs px-4 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60"
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
      <span className="text-text-secondary text-sm font-medium">
        {label}
        {required && <span className="text-danger"> *</span>}
      </span>
      {children}
    </label>
  );
}
