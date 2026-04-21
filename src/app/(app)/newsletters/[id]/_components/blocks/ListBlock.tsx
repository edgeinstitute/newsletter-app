"use client";

import { Dropdown } from "@/components/ui/Dropdown";
import type { ListBlock } from "@/lib/newsletter/blocks";
import { BlockChrome, inputClassName } from "./BlockChrome";
import { CloseIcon } from "@/components/icons";

type Props = {
  block: ListBlock;
  first: boolean;
  last: boolean;
  onChange: (block: ListBlock) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
};

const typeOptions = [
  { value: "unordered", label: "Bullet", description: "• item" },
  { value: "ordered", label: "Numerotată", description: "1. item" },
];

export function ListBlockEditor({
  block,
  first,
  last,
  onChange,
  onDelete,
  onMoveUp,
  onMoveDown,
}: Props) {
  const updateItem = (index: number, value: string) => {
    onChange({
      ...block,
      items: block.items.map((item, i) => (i === index ? value : item)),
    });
  };

  const removeItem = (index: number) => {
    onChange({
      ...block,
      items: block.items.filter((_, i) => i !== index),
    });
  };

  const addItem = () => {
    onChange({ ...block, items: [...block.items, ""] });
  };

  return (
    <BlockChrome
      label="Listă"
      first={first}
      last={last}
      onDelete={onDelete}
      onMoveUp={onMoveUp}
      onMoveDown={onMoveDown}
    >
      <Dropdown<string>
        label="Tip"
        value={block.ordered ? "ordered" : "unordered"}
        options={typeOptions}
        onChange={(value) => onChange({ ...block, ordered: value === "ordered" })}
      />
      <div className="flex flex-col gap-2">
        {block.items.map((item, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <span className="text-text-muted w-6 text-xs">
              {block.ordered ? `${idx + 1}.` : "•"}
            </span>
            <input
              type="text"
              value={item}
              onChange={(e) => updateItem(idx, e.target.value)}
              placeholder="Element listă"
              className={inputClassName}
            />
            <button
              type="button"
              onClick={() => removeItem(idx)}
              aria-label="Șterge element"
              className="text-text-muted hover:bg-danger-50 hover:text-danger-700 inline-flex h-8 w-8 items-center justify-center rounded-xs transition"
            >
              <CloseIcon className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={addItem}
        className="border-border bg-surface hover:border-primary self-start rounded-xs border px-3 py-1.5 text-xs transition"
      >
        + Adaugă element
      </button>
    </BlockChrome>
  );
}
