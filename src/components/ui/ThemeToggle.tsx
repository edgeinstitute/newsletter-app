"use client";

import { useTheme } from "@/providers/ThemeProvider";
import { SunIcon, MoonIcon } from "@/components/icons";

type Props = {
  className?: string;
};

export function ThemeToggle({ className }: Props) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Comută pe tema deschisă" : "Comută pe tema întunecată"}
      title={isDark ? "Temă deschisă" : "Temă întunecată"}
      className={`border-border bg-surface-elevated text-text-secondary hover:text-foreground hover:border-primary inline-flex h-9 w-9 items-center justify-center rounded-xs border transition ${className ?? ""}`}
    >
      {isDark ? <MoonIcon className="h-4 w-4" /> : <SunIcon className="h-4 w-4" />}
    </button>
  );
}
