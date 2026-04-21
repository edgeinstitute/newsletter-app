"use client";

import type { DividerBlock } from "@/lib/newsletter/blocks";
import { BlockChrome } from "./BlockChrome";

type Props = {
  block: DividerBlock;
  first: boolean;
  last: boolean;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
};

export function DividerBlockEditor({ first, last, onDelete, onMoveUp, onMoveDown }: Props) {
  return (
    <BlockChrome
      label="Separator"
      first={first}
      last={last}
      onDelete={onDelete}
      onMoveUp={onMoveUp}
      onMoveDown={onMoveDown}
    >
      <div className="flex items-center justify-center py-4">
        <hr className="border-border w-full border-t" />
      </div>
    </BlockChrome>
  );
}
