"use client";

import type { ImageBlock } from "@/lib/newsletter/blocks";
import { BlockChrome, inputClassName } from "./BlockChrome";

type Props = {
  block: ImageBlock;
  first: boolean;
  last: boolean;
  onChange: (block: ImageBlock) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
};

export function ImageBlockEditor({
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
      label="Imagine"
      first={first}
      last={last}
      onDelete={onDelete}
      onMoveUp={onMoveUp}
      onMoveDown={onMoveDown}
    >
      <div className="grid gap-2 sm:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className="text-text-secondary text-xs font-medium">URL imagine *</span>
          <input
            type="url"
            value={block.url}
            onChange={(e) => onChange({ ...block, url: e.target.value })}
            placeholder="https://…"
            className={inputClassName}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-text-secondary text-xs font-medium">Text alternativ</span>
          <input
            type="text"
            value={block.alt}
            onChange={(e) => onChange({ ...block, alt: e.target.value })}
            placeholder="Descriere pentru screen reader"
            className={inputClassName}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-text-secondary text-xs font-medium">Link la click (opțional)</span>
          <input
            type="url"
            value={block.href ?? ""}
            onChange={(e) => onChange({ ...block, href: e.target.value.trim() || undefined })}
            placeholder="https://…"
            className={inputClassName}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-text-secondary text-xs font-medium">Lățime (%, opțional)</span>
          <input
            type="number"
            min={10}
            max={100}
            value={block.width ?? ""}
            onChange={(e) => {
              const num = Number(e.target.value);
              onChange({
                ...block,
                width: Number.isFinite(num) && num > 0 ? num : undefined,
              });
            }}
            placeholder="100"
            className={inputClassName}
          />
        </label>
      </div>
      {block.url && (
        <div className="border-border mt-2 overflow-hidden rounded-xs border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={block.url} alt={block.alt} className="mx-auto block max-h-64 object-contain" />
        </div>
      )}
    </BlockChrome>
  );
}
