"use client";

import { Dropdown } from "@/components/ui/Dropdown";
import type { ButtonBlock } from "@/lib/newsletter/blocks";
import { BlockChrome, inputClassName } from "./BlockChrome";

type Props = {
  block: ButtonBlock;
  first: boolean;
  last: boolean;
  onChange: (block: ButtonBlock) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
};

const alignmentOptions = [
  { value: "left", label: "Stânga", description: "Aliniat la stânga" },
  { value: "center", label: "Centru", description: "Aliniat la centru" },
  { value: "right", label: "Dreapta", description: "Aliniat la dreapta" },
];

export function ButtonBlockEditor({
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
      label="Buton"
      first={first}
      last={last}
      onDelete={onDelete}
      onMoveUp={onMoveUp}
      onMoveDown={onMoveDown}
    >
      <div className="grid gap-2 sm:grid-cols-[1fr_1fr_140px]">
        <label className="flex flex-col gap-1">
          <span className="text-text-secondary text-xs font-medium">Text *</span>
          <input
            type="text"
            value={block.text}
            onChange={(e) => onChange({ ...block, text: e.target.value })}
            placeholder="Click aici"
            className={inputClassName}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-text-secondary text-xs font-medium">URL *</span>
          <input
            type="url"
            value={block.href}
            onChange={(e) => onChange({ ...block, href: e.target.value })}
            placeholder="https://…"
            className={inputClassName}
          />
        </label>
        <Dropdown<string>
          label="Aliniere"
          value={block.alignment ?? "center"}
          options={alignmentOptions}
          onChange={(value) =>
            onChange({ ...block, alignment: value as "left" | "center" | "right" })
          }
        />
      </div>
    </BlockChrome>
  );
}
