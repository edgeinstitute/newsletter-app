"use client";

import { Dropdown } from "@/components/ui/Dropdown";
import type { HeadingBlock } from "@/lib/newsletter/blocks";
import { BlockChrome, inputClassName } from "./BlockChrome";

type Props = {
  block: HeadingBlock;
  first: boolean;
  last: boolean;
  onChange: (block: HeadingBlock) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
};

const levelOptions = [
  { value: "1", label: "H1 · Titlu mare", description: "Cel mai proeminent" },
  { value: "2", label: "H2 · Subtitlu", description: "Nivel mediu" },
  { value: "3", label: "H3 · Secțiune", description: "Nivel minor" },
];

export function HeadingBlockEditor({
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
      label="Titlu"
      first={first}
      last={last}
      onDelete={onDelete}
      onMoveUp={onMoveUp}
      onMoveDown={onMoveDown}
    >
      <div className="grid gap-2 sm:grid-cols-[140px_1fr]">
        <Dropdown<string>
          value={String(block.level)}
          options={levelOptions}
          onChange={(value) => onChange({ ...block, level: Number(value) as 1 | 2 | 3 })}
        />
        <input
          type="text"
          value={block.text}
          onChange={(e) => onChange({ ...block, text: e.target.value })}
          placeholder="Scrie titlul…"
          className={inputClassName}
        />
      </div>
    </BlockChrome>
  );
}
