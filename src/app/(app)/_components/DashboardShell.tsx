"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { signOut as signOutAction } from "@/app/actions/auth-actions";
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
  const [collapsed, setCollapsed] = useState(initialCollapsed);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [signingOut, startSignOut] = useTransition();

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

  const signOut = () => {
    startSignOut(() => {
      void signOutAction();
    });
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
    <div className="bg-surface text-foreground flex h-[100svh]">
      {/* Desktop sidebar */}
      <aside
        className={`border-border bg-surface-elevated sticky top-0 hidden h-[100svh] flex-col border-r transition-[width] duration-200 lg:flex ${
          collapsed ? "w-16" : "w-64"
        }`}
      >
        <div
          className={`border-border flex h-16 items-center border-b px-4 ${
            collapsed ? "justify-center" : "justify-between"
          }`}
        >
          {!collapsed && <span className="font-display text-foreground text-2xl">EDGE</span>}
          <button
            type="button"
            onClick={toggleCollapsed}
            className="text-text-muted hover:bg-surface-muted hover:text-foreground inline-flex h-8 w-8 items-center justify-center rounded-xs"
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

        <div className="border-border mt-auto border-t p-3">
          <div className={`flex items-center gap-3 ${collapsed ? "justify-center" : ""}`}>
            <Avatar url={user.avatarUrl} initials={initials} />
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="text-foreground truncate text-sm font-medium">{user.displayName}</p>
                <p className="text-text-muted truncate text-xs">{user.email}</p>
                <p className="text-primary-700 mt-0.5 text-[10px] tracking-wide uppercase">
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
                disabled={signingOut}
                aria-label="Deconectare"
                className="border-border bg-surface-elevated text-text-secondary hover:border-danger hover:text-danger inline-flex h-9 w-9 items-center justify-center rounded-xs border transition disabled:opacity-60"
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
            className="animate-fade-in absolute inset-0 bg-black/40"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />
          <aside className="border-border bg-surface-elevated animate-slide-in-right absolute top-0 left-0 flex h-full w-72 flex-col border-r">
            <div className="border-border flex h-16 items-center justify-between border-b px-4">
              <span className="font-display text-foreground text-2xl">EDGE</span>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="text-text-muted hover:bg-surface-muted inline-flex h-8 w-8 items-center justify-center rounded-xs"
                aria-label="Închide meniul"
              >
                <CloseIcon className="h-4 w-4" />
              </button>
            </div>
            <DashboardNav
              collapsed={false}
              role={user.role}
              onNavigate={() => setMobileOpen(false)}
            />
            <div className="border-border mt-auto border-t p-3">
              <div className="flex items-center gap-3">
                <Avatar url={user.avatarUrl} initials={initials} />
                <div className="min-w-0 flex-1">
                  <p className="text-foreground truncate text-sm font-medium">{user.displayName}</p>
                  <p className="text-text-muted truncate text-xs">{user.email}</p>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <ThemeToggle className="flex-1" />
                <button
                  type="button"
                  onClick={signOut}
                  disabled={signingOut}
                  aria-label="Deconectare"
                  className="border-border bg-surface-elevated text-text-secondary hover:border-danger hover:text-danger inline-flex h-9 w-9 items-center justify-center rounded-xs border transition disabled:opacity-60"
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
        <header className="border-border bg-surface-elevated flex h-16 items-center justify-between gap-3 border-b px-4 lg:hidden">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="border-border bg-surface-elevated text-text-secondary inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xs border"
              aria-label="Deschide meniul"
            >
              <MenuIcon className="h-4 w-4" />
            </button>
            <Link href="/dashboard" className="font-display text-foreground shrink-0 text-xl">
              EDGE
            </Link>
          </div>
          <div className="flex min-w-0 items-center gap-2">
            <div className="hidden min-w-0 text-right sm:block">
              <p className="text-foreground truncate text-sm font-medium">{user.displayName}</p>
              <p className="text-text-muted truncate text-xs">{user.email}</p>
            </div>
            <Avatar url={user.avatarUrl} initials={initials} />
          </div>
        </header>

        <main className="flex-1 overflow-auto">
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-10">{children}</div>
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
        priority
        className="h-9 w-9 rounded-full object-cover"
        unoptimized
      />
    );
  }
  return (
    <div className="bg-primary-200 text-primary-700 flex h-9 w-9 items-center justify-center rounded-full text-xs font-medium">
      {initials || "?"}
    </div>
  );
}
