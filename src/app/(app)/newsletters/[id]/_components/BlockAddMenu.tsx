"use client";

import { Dropdown, type DropdownOption } from "@/components/ui/Dropdown";
import type { BlockType } from "@/lib/newsletter/blocks";

const options: DropdownOption<BlockType>[] = [
  { value: "heading", label: "Titlu", description: "H1 / H2 / H3" },
  { value: "paragraph", label: "Paragraf", description: "Text cu bold, italic, link" },
  { value: "image", label: "Imagine", description: "Din URL extern" },
  { value: "button", label: "Buton", description: "Link cu stil de buton" },
  { value: "list", label: "Listă", description: "Ordonată sau cu bullet" },
  { value: "quote", label: "Citat", description: "Blockquote cu autor opțional" },
  { value: "divider", label: "Separator", description: "Linie orizontală" },
  { value: "html", label: "HTML brut", description: "Pentru utilizatori avansați" },
];

type Props = {
  onInsert: (type: BlockType) => void;
  compact?: boolean;
};

export function BlockAddMenu({ onInsert, compact }: Props) {
  return (
    <div className={compact ? "-my-1" : ""}>
      <Dropdown<BlockType>
        value={"" as BlockType}
        options={options}
        onChange={(value) => onInsert(value)}
        placeholder="+ Adaugă bloc"
        buttonClassName={`w-full justify-center ${compact ? "h-8 text-xs" : ""}`}
      />
    </div>
  );
}
