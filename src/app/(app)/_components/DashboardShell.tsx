"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useSupabase } from "@/providers/SupabaseProvider";
import { DashboardNav } from "./DashboardNav";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import {
  MenuIcon,
  CloseIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  LogoutIcon,
} from "@/components/icons";
import type { ProfileRole } from "@/lib/supabase/database.types";

const SIDEBAR_COOKIE = "sidebar-collapsed";

export type ShellUser = {
  id: string;
  email: string | null;
  displayName: string;
  role: ProfileRole;
  avatarUrl: string | null;
};

type Props = {
  initialCollapsed: boolean;
  user: ShellUser;
  children: React.ReactNode;
};

export function DashboardShell({ initialCollapsed, user, children }: Props) {
  const router = useRouter();
  const supabase = useSupabase();
  const [collapsed, setCollapsed] = useState(initialCollapsed);
  const [mobileOpen, setMobileOpen] = useState(false);

  const persistCollapsed = useCallback((next: boolean) => {
    document.cookie = `${SIDEBAR_COOKIE}=${next ? "1" : "0"}; path=/; max-age=${60 * 60 * 24 * 365}`;
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      persistCollapsed(next);
      return next;
    });
  };

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

  const signOut = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  };

  const initials = user.displayName
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");

  const roleLabel: Record<ProfileRole, string> = {
    admin: "Administrator",
    staff: "Echipă",
    viewer: "Vizualizator",
  };

  return (
    <div className="flex min-h-[100svh] bg-surface text-foreground">
      {/* Desktop sidebar */}
      <aside
        className={`hidden lg:flex flex-col border-r border-border bg-surface-elevated transition-[width] duration-200 ${
          collapsed ? "w-16" : "w-64"
        }`}
      >
        <div
          className={`flex h-16 items-center border-b border-border px-4 ${
            collapsed ? "justify-center" : "justify-between"
          }`}
        >
          {!collapsed && (
            <span className="font-display text-2xl text-foreground">EDGE</span>
          )}
          <button
            type="button"
            onClick={toggleCollapsed}
            className="inline-flex h-8 w-8 items-center justify-center rounded-xs text-text-muted hover:bg-surface-muted hover:text-foreground"
            aria-label={collapsed ? "Extinde meniul" : "Restrânge meniul"}
          >
            {collapsed ? (
              <ChevronRightIcon className="h-4 w-4" />
            ) : (
              <ChevronLeftIcon className="h-4 w-4" />
            )}
          </button>
        </div>

        <DashboardNav collapsed={collapsed} role={user.role} />

        <div className="mt-auto border-t border-border p-3">
          <div className={`flex items-center gap-3 ${collapsed ? "justify-center" : ""}`}>
            <Avatar url={user.avatarUrl} initials={initials} />
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {user.displayName}
                </p>
                <p className="truncate text-xs text-text-muted">{user.email}</p>
                <p className="mt-0.5 text-[10px] uppercase tracking-wide text-primary-700">
                  {roleLabel[user.role]}
                </p>
              </div>
            )}
          </div>
          {!collapsed && (
            <div className="mt-3 flex items-center gap-2">
              <ThemeToggle className="flex-1" />
              <button
                type="button"
                onClick={signOut}
                aria-label="Deconectare"
                className="inline-flex h-9 w-9 items-center justify-center rounded-xs border border-border bg-surface-elevated text-text-secondary transition hover:border-danger hover:text-danger"
              >
                <LogoutIcon className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile sidebar drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40 animate-fade-in"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />
          <aside className="absolute left-0 top-0 flex h-full w-72 flex-col border-r border-border bg-surface-elevated animate-slide-in-right">
            <div className="flex h-16 items-center justify-between border-b border-border px-4">
              <span className="font-display text-2xl text-foreground">EDGE</span>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-xs text-text-muted hover:bg-surface-muted"
                aria-label="Închide meniul"
              >
                <CloseIcon className="h-4 w-4" />
              </button>
            </div>
            <DashboardNav collapsed={false} role={user.role} onNavigate={() => setMobileOpen(false)} />
            <div className="mt-auto border-t border-border p-3">
              <div className="flex items-center gap-3">
                <Avatar url={user.avatarUrl} initials={initials} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {user.displayName}
                  </p>
                  <p className="truncate text-xs text-text-muted">{user.email}</p>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <ThemeToggle className="flex-1" />
                <button
                  type="button"
                  onClick={signOut}
                  aria-label="Deconectare"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xs border border-border bg-surface-elevated text-text-secondary transition hover:border-danger hover:text-danger"
                >
                  <LogoutIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* Content */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-border bg-surface-elevated px-4 lg:hidden">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xs border border-border bg-surface-elevated text-text-secondary"
              aria-label="Deschide meniul"
            >
              <MenuIcon className="h-4 w-4" />
            </button>
            <Link href="/dashboard" className="font-display text-xl text-foreground">
              EDGE
            </Link>
          </div>
          <Avatar url={user.avatarUrl} initials={initials} />
        </header>

        <main className="flex-1 overflow-auto">
          <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-10">{children}</div>
        </main>
      </div>
    </div>
  );
}

function Avatar({ url, initials }: { url: string | null; initials: string }) {
  if (url) {
    return (
      <Image
        src={url}
        alt=""
        width={36}
        height={36}
        className="h-9 w-9 rounded-full object-cover"
        unoptimized
      />
    );
  }
  return (
    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-200 text-xs font-medium text-primary-700">
      {initials || "?"}
    </div>
  );
}
