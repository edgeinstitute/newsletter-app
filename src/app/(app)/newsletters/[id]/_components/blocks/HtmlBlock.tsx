"use client";

import type { HtmlBlock } from "@/lib/newsletter/blocks";
import { BlockChrome, textareaClassName } from "./BlockChrome";

type Props = {
  block: HtmlBlock;
  first: boolean;
  last: boolean;
  onChange: (block: HtmlBlock) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
};

export function HtmlBlockEditor({
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
      label="HTML brut"
      first={first}
      last={last}
      onDelete={onDelete}
      onMoveUp={onMoveUp}
      onMoveDown={onMoveDown}
    >
      <div className="border-border bg-surface-muted text-text-secondary rounded-xs border px-3 py-2 text-xs">
        HTML brut — folosește doar stiluri inline. beehiiv elimină tag-urile{" "}
        <code>&lt;style&gt;</code> și <code>&lt;link&gt;</code>.
      </div>
      <textarea
        value={block.html}
        onChange={(e) => onChange({ ...block, html: e.target.value })}
        placeholder="<p>…</p>"
        spellCheck={false}
        className={`${textareaClassName} font-mono text-xs`}
      />
    </BlockChrome>
  );
}
