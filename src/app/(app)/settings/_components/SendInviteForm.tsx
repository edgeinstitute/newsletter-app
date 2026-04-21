"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Dropdown } from "@/components/ui/Dropdown";
import { CheckIcon, SpinnerIcon } from "@/components/icons";
import { sendTeamInvite } from "@/app/actions/settings-actions";
import type { ProfileRole } from "@/lib/supabase/database.types";

const roleOptions: { value: ProfileRole; label: string; description: string }[] = [
  { value: "admin", label: "Administrator", description: "Acces complet" },
  { value: "staff", label: "Echipă", description: "Acces de lucru" },
  { value: "viewer", label: "Vizualizator", description: "Doar citire" },
];

type Props = {
  mailgunReady: boolean;
};

export function SendInviteForm({ mailgunReady }: Props) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<ProfileRole>("staff");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastInvited, setLastInvited] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const result = await sendTeamInvite({
      email: email.trim().toLowerCase(),
      fullName: fullName.trim(),
      role,
    });
    setSubmitting(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setLastInvited(email.trim().toLowerCase());
    setEmail("");
    setFullName("");
    setRole("staff");
    router.refresh();
  };

  return (
    <div className="rounded-xs border border-border bg-surface-elevated">
      <div className="border-b border-border px-5 py-4">
        <h2 className="text-base font-medium text-foreground">
          Trimite invitație
        </h2>
        <p className="mt-1 text-xs text-text-muted">
          Contul este creat în Supabase, iar linkul de setare parolă este
          trimis prin Mailgun folosind template-ul configurat.
        </p>
      </div>

      {!mailgunReady && (
        <div className="border-b border-border bg-warning-50 px-5 py-3 text-sm text-warning-700">
          Mailgun nu este configurat. Completează credențialele în tab-ul{" "}
          <strong>Mailgun</strong> înainte de a trimite invitații.
        </div>
      )}

      <form onSubmit={onSubmit} className="flex flex-col gap-4 p-5" noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-text-secondary">
              Nume complet <span className="text-danger">*</span>
            </span>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="h-10 rounded-xs border border-border bg-surface px-3 text-sm text-foreground transition hover:border-primary focus:border-primary focus:outline-none"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-text-secondary">
              Email <span className="text-danger">*</span>
            </span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-10 rounded-xs border border-border bg-surface px-3 text-sm text-foreground transition hover:border-primary focus:border-primary focus:outline-none"
            />
          </label>
        </div>

        <Dropdown<ProfileRole>
          label="Rol"
          value={role}
          options={roleOptions}
          onChange={setRole}
        />

        {error && (
          <div className="rounded-xs border border-danger-200 bg-danger-50 px-3 py-2 text-sm text-danger-700">
            {error}
          </div>
        )}
        {lastInvited && !error && (
          <div className="inline-flex items-center gap-2 rounded-xs border border-success-200 bg-success-50 px-3 py-2 text-sm text-success-700">
            <CheckIcon className="h-4 w-4" />
            Invitație trimisă către {lastInvited}.
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="submit"
            disabled={submitting || !mailgunReady}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xs bg-primary px-4 text-sm font-medium text-text-inverse transition hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting && <SpinnerIcon className="h-4 w-4" />}
            Trimite invitație
          </button>
        </div>
      </form>
    </div>
  );
}
