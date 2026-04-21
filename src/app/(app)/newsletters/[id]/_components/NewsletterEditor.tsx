"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Block, BlockType, NewsletterContent } from "@/lib/newsletter/blocks";
import { createBlock } from "@/lib/newsletter/blocks";
import type { NewsletterRow } from "@/lib/queries/newsletters";
import type { NewsletterStatus } from "@/lib/supabase/database.types";
import { saveNewsletterDraft } from "@/app/actions/newsletter-actions";
import { ActionBar } from "./ActionBar";
import { BlockAddMenu } from "./BlockAddMenu";
import { PreviewPane } from "./PreviewPane";
import { HeadingBlockEditor } from "./blocks/HeadingBlock";
import { ParagraphBlockEditor } from "./blocks/ParagraphBlock";
import { ImageBlockEditor } from "./blocks/ImageBlock";
import { ButtonBlockEditor } from "./blocks/ButtonBlock";
import { DividerBlockEditor } from "./blocks/DividerBlock";
import { ListBlockEditor } from "./blocks/ListBlock";
import { QuoteBlockEditor } from "./blocks/QuoteBlock";
import { HtmlBlockEditor } from "./blocks/HtmlBlock";

type Props = {
  initial: NewsletterRow;
  beehiivConfigured: boolean;
};

type SaveState = "idle" | "pending" | "saving" | "saved" | "error";

type EditorState = {
  title: string;
  subtitle: string;
  previewText: string;
  content: NewsletterContent;
  status: NewsletterStatus;
};

const AUTOSAVE_DELAY_MS = 1500;

function stateSignature(s: EditorState): string {
  return JSON.stringify({
    title: s.title,
    subtitle: s.subtitle,
    previewText: s.previewText,
    content: s.content,
  });
}

export function NewsletterEditor({ initial, beehiivConfigured }: Props) {
  const router = useRouter();
  const [title, setTitle] = useState(initial.title);
  const [subtitle, setSubtitle] = useState(initial.subtitle);
  const [previewText, setPreviewText] = useState(initial.previewText);
  const [content, setContent] = useState<NewsletterContent>(initial.content);
  const [status, setStatus] = useState<NewsletterStatus>(initial.status);
  const [lastError, setLastError] = useState<string | null>(initial.lastError);
  const [beehiivPostId, setBeehiivPostId] = useState<string | null>(initial.beehiivPostId);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState<"edit" | "preview">("edit");

  const initialSignature = useMemo(
    () =>
      stateSignature({
        title: initial.title,
        subtitle: initial.subtitle,
        previewText: initial.previewText,
        content: initial.content,
        status: initial.status,
      }),
    [initial],
  );

  const [lastSavedSignature, setLastSavedSignature] = useState(initialSignature);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savingRef = useRef(false);

  const editorState: EditorState = useMemo(
    () => ({ title, subtitle, previewText, content, status }),
    [title, subtitle, previewText, content, status],
  );

  const currentSignature = useMemo(() => stateSignature(editorState), [editorState]);
  const dirty = currentSignature !== lastSavedSignature;

  const saveState: SaveState = saveError
    ? "error"
    : saving
      ? "saving"
      : dirty
        ? "pending"
        : "saved";

  const flushSave = useCallback(async () => {
    if (currentSignature === lastSavedSignature) return;
    if (savingRef.current) return;

    savingRef.current = true;
    setSaving(true);
    setSaveError(null);
    const result = await saveNewsletterDraft({
      id: initial.id,
      title,
      subtitle,
      previewText,
      content,
    });
    savingRef.current = false;
    setSaving(false);

    if (!result.ok) {
      setSaveError(result.error);
      return;
    }
    setLastSavedSignature(currentSignature);
    if (status === "synced") {
      setStatus("draft");
    }
  }, [
    currentSignature,
    lastSavedSignature,
    initial.id,
    title,
    subtitle,
    previewText,
    content,
    status,
  ]);

  useEffect(() => {
    if (!dirty) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      void flushSave();
    }, AUTOSAVE_DELAY_MS);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [dirty, flushSave]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (saveTimer.current) clearTimeout(saveTimer.current);
        void flushSave();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [flushSave]);

  const insertBlock = (type: BlockType, index: number) => {
    const block = createBlock(type);
    setContent((prev) => {
      const next = [...prev];
      next.splice(index, 0, block);
      return next;
    });
  };

  const updateBlock = (id: string, updater: (block: Block) => Block) => {
    setContent((prev) => prev.map((b) => (b.id === id ? updater(b) : b)));
  };

  const deleteBlock = (id: string) => {
    setContent((prev) => prev.filter((b) => b.id !== id));
  };

  const moveBlock = (id: string, delta: -1 | 1) => {
    setContent((prev) => {
      const idx = prev.findIndex((b) => b.id === id);
      if (idx < 0) return prev;
      const target = idx + delta;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      const current = next[idx];
      const swap = next[target];
      if (!current || !swap) return prev;
      next[idx] = swap;
      next[target] = current;
      return next;
    });
  };

  const onPushed = (postId: string) => {
    setStatus("synced");
    setBeehiivPostId(postId);
    setLastError(null);
    setLastSavedSignature(stateSignature({ ...editorState, status: "synced" }));
    router.refresh();
  };

  const onPushFailed = (error: string) => {
    setStatus("failed");
    setLastError(error);
  };

  const onPushStarted = () => {
    setStatus("syncing");
    setLastError(null);
  };

  const saveIsBlocking = saveState === "pending" || saveState === "saving" || saveState === "error";

  return (
    <div className="animate-fade-in-up flex flex-col gap-4">
      <ActionBar
        id={initial.id}
        title={title}
        subtitle={subtitle}
        previewText={previewText}
        onTitleChange={setTitle}
        onSubtitleChange={setSubtitle}
        onPreviewTextChange={setPreviewText}
        status={status}
        beehiivPostId={beehiivPostId}
        beehiivConfigured={beehiivConfigured}
        saveState={saveState}
        saveError={saveError}
        blocksCount={content.length}
        saveIsBlocking={saveIsBlocking}
        lastError={lastError}
        onPushStarted={onPushStarted}
        onPushed={onPushed}
        onPushFailed={onPushFailed}
      />

      <div className="border-border bg-surface-elevated flex gap-1 rounded-xs border p-1 lg:hidden">
        <button
          type="button"
          onClick={() => setMobileTab("edit")}
          className={`flex-1 rounded-xs px-3 py-2 text-sm transition ${
            mobileTab === "edit"
              ? "bg-primary text-text-inverse"
              : "text-text-secondary hover:bg-surface-muted"
          }`}
        >
          Editează
        </button>
        <button
          type="button"
          onClick={() => setMobileTab("preview")}
          className={`flex-1 rounded-xs px-3 py-2 text-sm transition ${
            mobileTab === "preview"
              ? "bg-primary text-text-inverse"
              : "text-text-secondary hover:bg-surface-muted"
          }`}
        >
          Previzualizare
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className={`${mobileTab === "edit" ? "block" : "hidden"} lg:block`}>
          <div className="border-border bg-surface-elevated flex flex-col gap-3 rounded-xs border p-4">
            {content.length === 0 && (
              <div className="text-text-muted border-border rounded-xs border border-dashed px-4 py-8 text-center text-sm">
                Niciun bloc încă. Apasă „+ Adaugă bloc” mai jos pentru a începe.
              </div>
            )}
            {content.map((block, idx) => (
              <div key={block.id} className="flex flex-col gap-2">
                <BlockAddMenu onInsert={(type) => insertBlock(type, idx)} compact />
                <BlockFrame
                  block={block}
                  first={idx === 0}
                  last={idx === content.length - 1}
                  onChange={(updated) => updateBlock(block.id, () => updated)}
                  onDelete={() => deleteBlock(block.id)}
                  onMoveUp={() => moveBlock(block.id, -1)}
                  onMoveDown={() => moveBlock(block.id, 1)}
                />
              </div>
            ))}
            <BlockAddMenu onInsert={(type) => insertBlock(type, content.length)} />
          </div>
        </div>

        <div className={`${mobileTab === "preview" ? "block" : "hidden"} lg:block`}>
          <PreviewPane
            title={title}
            subtitle={subtitle}
            previewText={previewText}
            content={content}
          />
        </div>
      </div>
    </div>
  );
}

type BlockControls = {
  first: boolean;
  last: boolean;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
};

function BlockFrame({
  block,
  onChange,
  ...controls
}: { block: Block; onChange: (block: Block) => void } & BlockControls) {
  switch (block.type) {
    case "heading":
      return <HeadingBlockEditor block={block} onChange={onChange} {...controls} />;
    case "paragraph":
      return <ParagraphBlockEditor block={block} onChange={onChange} {...controls} />;
    case "image":
      return <ImageBlockEditor block={block} onChange={onChange} {...controls} />;
    case "button":
      return <ButtonBlockEditor block={block} onChange={onChange} {...controls} />;
    case "divider":
      return <DividerBlockEditor block={block} {...controls} />;
    case "list":
      return <ListBlockEditor block={block} onChange={onChange} {...controls} />;
    case "quote":
      return <QuoteBlockEditor block={block} onChange={onChange} {...controls} />;
    case "html":
      return <HtmlBlockEditor block={block} onChange={onChange} {...controls} />;
  }
}
