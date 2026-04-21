"use client";

import { useMemo, useState, useTransition, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Dropdown } from "@/components/ui/Dropdown";
import { SpinnerIcon, TrashIcon, CloseIcon } from "@/components/icons";
import type { ProfileRole } from "@/lib/supabase/database.types";
import {
  createTeamMember,
  changeRole,
  removeTeamMember,
} from "@/app/actions/profile-actions";

export type TeamMember = {
  id: string;
  fullName: string | null;
  phone: string | null;
  role: ProfileRole;
  avatarUrl: string | null;
  email: string | null;
  createdAt: string;
};

const roleOptions: { value: ProfileRole; label: string; description: string }[] = [
  { value: "admin", label: "Administrator", description: "Acces complet" },
  { value: "staff", label: "Echipă", description: "Acces de lucru" },
  { value: "viewer", label: "Vizualizator", description: "Doar citire" },
];

const roleLabel: Record<ProfileRole, string> = {
  admin: "Administrator",
  staff: "Echipă",
  viewer: "Vizualizator",
};

type Props = {
  members: TeamMember[];
  currentUserId: string;
};

export function UsersView({ members, currentUserId }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const sorted = useMemo(() => {
    const copy = [...members];
    copy.sort((a, b) => {
      if (a.id === currentUserId) return -1;
      if (b.id === currentUserId) return 1;
      return (a.fullName ?? "").localeCompare(b.fullName ?? "");
    });
    return copy;
  }, [members, currentUserId]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sorted;
    return sorted.filter(
      (m) =>
        (m.fullName ?? "").toLowerCase().includes(q) ||
        (m.email ?? "").toLowerCase().includes(q),
    );
  }, [sorted, query]);

  const updateRole = (id: string, role: ProfileRole) => {
    setError(null);
    setPendingId(id);
    startTransition(async () => {
      const result = await changeRole(id, role);
      setPendingId(null);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  };

  const remove = (id: string, name: string) => {
    if (!window.confirm(`Ștergi membrul ${name}? Această acțiune este ireversibilă.`)) {
      return;
    }
    setError(null);
    setPendingId(id);
    startTransition(async () => {
      const result = await removeTeamMember(id);
      setPendingId(null);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <input
          type="search"
          placeholder="Caută după nume sau email…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full h-10 rounded-xs border border-border bg-surface-elevated px-3 text-sm text-foreground transition hover:border-primary focus:border-primary focus:outline-none"
        />
        <button
          type="button"
          onClick={() => setAddOpen(true)}
          className="w-full md:w-80 inline-flex h-10 items-center justify-center rounded-xs bg-primary px-4 text-sm font-medium text-text-inverse transition hover:bg-primary-600"
        >
          + Adaugă membru
        </button>
      </div>

      {error && (
        <div className="rounded-xs border border-danger-200 bg-danger-50 px-3 py-2 text-sm text-danger-700">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-xs border border-border bg-surface-elevated">
        <ul className="divide-y divide-border">
          {filtered.length === 0 && (
            <li className="p-6 text-center text-sm text-text-muted">
              Niciun membru găsit.
            </li>
          )}
          {filtered.map((m) => {
            const isSelf = m.id === currentUserId;
            const busy = pendingId === m.id;
            const name = m.fullName ?? m.email ?? "Membru";
            const initials = (m.fullName ?? m.email ?? "?")
              .split(/\s+/)
              .slice(0, 2)
              .map((p) => p[0]?.toUpperCase() ?? "")
              .join("");

            return (
              <li key={m.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-4">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  {m.avatarUrl ? (
                    <Image
                      src={m.avatarUrl}
                      alt=""
                      width={40}
                      height={40}
                      className="h-10 w-10 rounded-full object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-200 text-xs font-medium text-primary-700">
                      {initials}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {name}
                      {isSelf && (
                        <span className="ml-2 rounded-full bg-primary-50 px-2 py-0.5 text-[10px] uppercase tracking-wide text-primary-700">
                          Tu
                        </span>
                      )}
                    </p>
                    <p className="truncate text-xs text-text-muted">{m.email ?? "—"}</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 sm:justify-end">
                  {isSelf ? (
                    <span className="rounded-full bg-primary-50 px-2 py-1 text-xs text-primary-700">
                      {roleLabel[m.role]}
                    </span>
                  ) : (
                    <Dropdown<ProfileRole>
                      value={m.role}
                      options={roleOptions}
                      onChange={(next) => updateRole(m.id, next)}
                      buttonClassName="min-w-[140px]"
                      disabled={busy}
                      align="end"
                    />
                  )}

                  {!isSelf && (
                    <button
                      type="button"
                      onClick={() => remove(m.id, name)}
                      disabled={busy}
                      aria-label={`Șterge ${name}`}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-xs border border-border text-text-secondary transition hover:border-danger hover:text-danger disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {busy ? (
                        <SpinnerIcon className="h-4 w-4" />
                      ) : (
                        <TrashIcon className="h-4 w-4" />
                      )}
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {addOpen && (
        <AddMemberModal
          onClose={() => setAddOpen(false)}
          onCreated={() => {
            setAddOpen(false);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

function AddMemberModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<ProfileRole>("staff");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const result = await createTeamMember({
      email: email.trim().toLowerCase(),
      password,
      fullName: fullName.trim(),
      role,
    });
    setSubmitting(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onCreated();
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 animate-fade-in">
      <div className="w-full max-w-md rounded-xs border border-border bg-surface-elevated shadow-lg animate-fade-in-up">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-lg font-medium text-foreground">Adaugă membru nou</h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-xs text-text-muted hover:bg-surface-muted"
            aria-label="Închide"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="flex flex-col gap-4 p-5" noValidate>
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

          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-text-secondary">
              Parolă temporară <span className="text-danger">*</span>
            </span>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-10 rounded-xs border border-border bg-surface px-3 text-sm text-foreground transition hover:border-primary focus:border-primary focus:outline-none"
            />
            <span className="text-xs text-text-muted">Minim 8 caractere.</span>
          </label>

          <Dropdown<ProfileRole>
            label="Rol"
            value={role}
            options={roleOptions}
            onChange={setRole}
          />

          {error && (
            <div className="rounded-xs border border-danger-200 bg-danger-50 px-3 py-2 text-xs text-danger-700">
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="inline-flex h-10 items-center justify-center rounded-xs border border-border bg-surface-elevated px-4 text-sm text-foreground transition hover:border-primary"
            >
              Renunță
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xs bg-primary px-4 text-sm font-medium text-text-inverse transition hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting && <SpinnerIcon className="h-4 w-4" />}
              Creează cont
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
