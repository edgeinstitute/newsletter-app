"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HomeIcon, UsersIcon, UserIcon, SettingsIcon } from "@/components/icons";
import type { ProfileRole } from "@/lib/supabase/database.types";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
};

const items: NavItem[] = [
  { href: "/dashboard", label: "Panou", icon: HomeIcon },
  { href: "/users", label: "Echipă", icon: UsersIcon, adminOnly: true },
  { href: "/settings", label: "Setări", icon: SettingsIcon, adminOnly: true },
  { href: "/profile", label: "Profil", icon: UserIcon },
];

type Props = {
  collapsed: boolean;
  role: ProfileRole;
  onNavigate?: () => void;
};

export function DashboardNav({ collapsed, role, onNavigate }: Props) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1 p-3">
      {items.map((item) => {
        if (item.adminOnly && role !== "admin") return null;
        const active =
          item.href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            title={collapsed ? item.label : undefined}
            className={`flex items-center gap-3 rounded-xs px-3 py-2 text-sm transition ${
              active
                ? "bg-primary-50 text-primary-700"
                : "text-text-secondary hover:bg-surface-muted hover:text-foreground"
            } ${collapsed ? "justify-center px-0" : ""}`}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {!collapsed && <span className="truncate">{item.label}</span>}
            {!collapsed && item.adminOnly && (
              <span className="ml-auto rounded-full bg-primary-200 px-1.5 py-0.5 text-[10px] font-medium text-primary-700">
                Admin
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
