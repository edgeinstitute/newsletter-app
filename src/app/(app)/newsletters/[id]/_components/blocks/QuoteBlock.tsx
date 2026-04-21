"use client";

import type { QuoteBlock } from "@/lib/newsletter/blocks";
import { BlockChrome, inputClassName, textareaClassName } from "./BlockChrome";

type Props = {
  block: QuoteBlock;
  first: boolean;
  last: boolean;
  onChange: (block: QuoteBlock) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
};

export function QuoteBlockEditor({
  block,
  first,
  last,
  onChange,
  onDelete,
  onMoveUp,
  onMoveDown,
}: Props) {
  return (
    <BlockChrome
      label="Citat"
      first={first}
      last={last}
      onDelete={onDelete}
      onMoveUp={onMoveUp}
      onMoveDown={onMoveDown}
    >
      <textarea
        value={block.text}
        onChange={(e) => onChange({ ...block, text: e.target.value })}
        placeholder="Textul citatului…"
        className={textareaClassName}
      />
      <label className="flex flex-col gap-1">
        <span className="text-text-secondary text-xs font-medium">Autor (opțional)</span>
        <input
          type="text"
          value={block.author ?? ""}
          onChange={(e) => onChange({ ...block, author: e.target.value.trim() || undefined })}
          placeholder="Numele autorului"
          className={inputClassName}
        />
      </label>
    </BlockChrome>
  );
}
