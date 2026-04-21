"use client";

import { useMemo, useState, useTransition, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Dropdown } from "@/components/ui/Dropdown";
import { SpinnerIcon, TrashIcon, CloseIcon } from "@/components/icons";
import type { ProfileRole } from "@/lib/supabase/database.types";
import { createTeamMember, changeRole, removeTeamMember } from "@/app/actions/profile-actions";

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
        (m.fullName ?? "").toLowerCase().includes(q) || (m.email ?? "").toLowerCase().includes(q),
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
          className="border-border bg-surface-elevated text-foreground hover:border-primary focus:border-primary h-10 w-full rounded-xs border px-3 text-sm transition focus:outline-none"
        />
        <button
          type="button"
          onClick={() => setAddOpen(true)}
          className="bg-primary text-text-inverse hover:bg-primary-600 inline-flex h-10 w-full items-center justify-center rounded-xs px-4 text-sm font-medium transition md:w-80"
        >
          + Adaugă membru
        </button>
      </div>

      {error && (
        <div className="border-danger-200 bg-danger-50 text-danger-700 rounded-xs border px-3 py-2 text-sm">
          {error}
        </div>
      )}

      <div className="border-border bg-surface-elevated overflow-hidden rounded-xs border">
        <ul className="divide-border divide-y">
          {filtered.length === 0 && (
            <li className="text-text-muted p-6 text-center text-sm">Niciun membru găsit.</li>
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
              <li
                key={m.id}
                className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-4"
              >
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
                    <div className="bg-primary-200 text-primary-700 flex h-10 w-10 items-center justify-center rounded-full text-xs font-medium">
                      {initials}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-foreground truncate text-sm font-medium">
                      {name}
                      {isSelf && (
                        <span className="bg-primary-50 text-primary-700 ml-2 rounded-full px-2 py-0.5 text-[10px] tracking-wide uppercase">
                          Tu
                        </span>
                      )}
                    </p>
                    <p className="text-text-muted truncate text-xs">{m.email ?? "—"}</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 sm:justify-end">
                  {isSelf ? (
                    <span className="bg-primary-50 text-primary-700 rounded-full px-2 py-1 text-xs">
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
                      className="border-border text-text-secondary hover:border-danger hover:text-danger inline-flex h-9 w-9 items-center justify-center rounded-xs border transition disabled:cursor-not-allowed disabled:opacity-60"
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

function AddMemberModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
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
    <div className="animate-fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="border-border bg-surface-elevated animate-fade-in-up w-full max-w-md rounded-xs border shadow-lg">
        <div className="border-border flex items-center justify-between border-b px-5 py-4">
          <h2 className="text-foreground text-lg font-medium">Adaugă membru nou</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-text-muted hover:bg-surface-muted inline-flex h-8 w-8 items-center justify-center rounded-xs"
            aria-label="Închide"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="flex flex-col gap-4 p-5" noValidate>
          <label className="flex flex-col gap-1">
            <span className="text-text-secondary text-sm font-medium">
              Nume complet <span className="text-danger">*</span>
            </span>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="border-border bg-surface text-foreground hover:border-primary focus:border-primary h-10 rounded-xs border px-3 text-sm transition focus:outline-none"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-text-secondary text-sm font-medium">
              Email <span className="text-danger">*</span>
            </span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border-border bg-surface text-foreground hover:border-primary focus:border-primary h-10 rounded-xs border px-3 text-sm transition focus:outline-none"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-text-secondary text-sm font-medium">
              Parolă temporară <span className="text-danger">*</span>
            </span>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border-border bg-surface text-foreground hover:border-primary focus:border-primary h-10 rounded-xs border px-3 text-sm transition focus:outline-none"
            />
            <span className="text-text-muted text-xs">Minim 8 caractere.</span>
          </label>

          <Dropdown<ProfileRole>
            label="Rol"
            value={role}
            options={roleOptions}
            onChange={setRole}
          />

          {error && (
            <div className="border-danger-200 bg-danger-50 text-danger-700 rounded-xs border px-3 py-2 text-xs">
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="border-border bg-surface-elevated text-foreground hover:border-primary inline-flex h-10 items-center justify-center rounded-xs border px-4 text-sm transition"
            >
              Renunță
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="bg-primary text-text-inverse hover:bg-primary-600 inline-flex h-10 items-center justify-center gap-2 rounded-xs px-4 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60"
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
