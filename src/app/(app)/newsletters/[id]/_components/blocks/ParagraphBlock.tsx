"use client";

import { useMemo, useRef } from "react";
import type { ParagraphBlock } from "@/lib/newsletter/blocks";
import { parseInline, serializeInline } from "@/lib/newsletter/inline";
import { BlockChrome, textareaClassName } from "./BlockChrome";

type Props = {
  block: ParagraphBlock;
  first: boolean;
  last: boolean;
  onChange: (block: ParagraphBlock) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
};

export function ParagraphBlockEditor({
  block,
  first,
  last,
  onChange,
  onDelete,
  onMoveUp,
  onMoveDown,
}: Props) {
  const value = useMemo(() => serializeInline(block.runs), [block.runs]);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const setValue = (next: string) => {
    onChange({ ...block, runs: parseInline(next) });
  };

  const wrap = (prefix: string, suffix: string) => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = value.slice(start, end) || "text";
    const next = `${value.slice(0, start)}${prefix}${selected}${suffix}${value.slice(end)}`;
    setValue(next);
    requestAnimationFrame(() => {
      el.focus();
      const cursor = start + prefix.length + selected.length + suffix.length;
      el.setSelectionRange(cursor, cursor);
    });
  };

  const insertLink = () => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const label = value.slice(start, end) || "text";
    const href = window.prompt("URL:", "https://");
    if (!href) return;
    const next = `${value.slice(0, start)}[${label}](${href})${value.slice(end)}`;
    setValue(next);
  };

  return (
    <BlockChrome
      label="Paragraf"
      first={first}
      last={last}
      onDelete={onDelete}
      onMoveUp={onMoveUp}
      onMoveDown={onMoveDown}
    >
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => wrap("**", "**")}
          className="border-border bg-surface hover:border-primary inline-flex h-7 items-center justify-center rounded-xs border px-2 text-xs font-bold transition"
        >
          B
        </button>
        <button
          type="button"
          onClick={() => wrap("_", "_")}
          className="border-border bg-surface hover:border-primary inline-flex h-7 items-center justify-center rounded-xs border px-2 text-xs italic transition"
        >
          I
        </button>
        <button
          type="button"
          onClick={insertLink}
          className="border-border bg-surface hover:border-primary inline-flex h-7 items-center justify-center rounded-xs border px-2 text-xs underline transition"
        >
          Link
        </button>
        <span className="text-text-muted ml-2 text-[11px]">
          <code className="text-text-muted">**bold**</code> ·{" "}
          <code className="text-text-muted">_italic_</code> ·{" "}
          <code className="text-text-muted">[text](url)</code>
        </span>
      </div>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Scrie un paragraf…"
        className={textareaClassName}
      />
    </BlockChrome>
  );
}
