"use client";

import type { ReactNode } from "react";
import { ChevronDownIcon, TrashIcon } from "@/components/icons";

type Props = {
  label: string;
  first: boolean;
  last: boolean;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  children: ReactNode;
};

export function BlockChrome({
  label,
  first,
  last,
  onDelete,
  onMoveUp,
  onMoveDown,
  children,
}: Props) {
  return (
    <div className="border-border bg-surface group hover:border-primary relative flex flex-col gap-2 rounded-xs border p-3 transition">
      <div className="flex items-center justify-between">
        <span className="text-text-muted text-[11px] font-medium tracking-wide uppercase">
          {label}
        </span>
        <div className="flex items-center gap-1 opacity-70 transition group-hover:opacity-100">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={first}
            aria-label="Mută în sus"
            className="text-text-secondary hover:bg-surface-muted hover:text-foreground inline-flex h-7 w-7 items-center justify-center rounded-xs transition disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronDownIcon className="h-3.5 w-3.5 rotate-180" />
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={last}
            aria-label="Mută în jos"
            className="text-text-secondary hover:bg-surface-muted hover:text-foreground inline-flex h-7 w-7 items-center justify-center rounded-xs transition disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronDownIcon className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            aria-label="Șterge blocul"
            className="text-text-secondary hover:bg-danger-50 hover:text-danger-700 inline-flex h-7 w-7 items-center justify-center rounded-xs transition"
          >
            <TrashIcon className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      {children}
    </div>
  );
}

export const inputClassName =
  "border-border bg-surface text-foreground hover:border-primary focus:border-primary w-full rounded-xs border px-3 py-2 text-sm transition focus:outline-none";

export const textareaClassName =
  "border-border bg-surface text-foreground hover:border-primary focus:border-primary w-full rounded-xs border px-3 py-2 text-sm transition focus:outline-none resize-y min-h-[80px]";
