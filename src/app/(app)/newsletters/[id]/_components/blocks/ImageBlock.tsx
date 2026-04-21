"use client";

import { useRef, useState, type ChangeEvent } from "react";
import type { ImageBlock } from "@/lib/newsletter/blocks";
import { SpinnerIcon } from "@/components/icons";
import { uploadMedia } from "@/app/actions/media-actions";
import { BlockChrome, inputClassName } from "./BlockChrome";

type Props = {
  block: ImageBlock;
  first: boolean;
  last: boolean;
  newsletterId: string;
  onChange: (block: ImageBlock) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
};

const MAX_FILE_BYTES = 15 * 1024 * 1024;

export function ImageBlockEditor({
  block,
  first,
  last,
  newsletterId,
  onChange,
  onDelete,
  onMoveUp,
  onMoveDown,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const onFilePicked = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);

    if (file.size > MAX_FILE_BYTES) {
      setUploadError("Dimensiune maximă 15MB");
      e.target.value = "";
      return;
    }

    setUploading(true);
    const fd = new FormData();
    fd.set("file", file);
    fd.set("newsletterId", newsletterId);
    const result = await uploadMedia(fd);
    setUploading(false);
    e.target.value = "";

    if (!result.ok) {
      setUploadError(result.error);
      return;
    }
    const nextAlt = block.alt || result.data.filename;
    onChange({ ...block, url: result.data.url, alt: nextAlt });
  };

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
      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml"
          onChange={onFilePicked}
          disabled={uploading}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="border-border bg-surface hover:border-primary inline-flex h-9 items-center gap-2 rounded-xs border px-3 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-60"
        >
          {uploading && <SpinnerIcon className="h-3.5 w-3.5" />}
          {uploading ? "Se încarcă…" : "Încarcă imagine"}
        </button>
        <span className="text-text-muted text-[11px]">PNG/JPG/GIF/WebP/SVG, max 15MB.</span>
      </div>
      {uploadError && (
        <div className="border-danger-200 bg-danger-50 text-danger-700 rounded-xs border px-3 py-2 text-xs">
          {uploadError}
        </div>
      )}
      {block.url && (
        <div className="border-border mt-2 overflow-hidden rounded-xs border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={block.url} alt={block.alt} className="mx-auto block max-h-64 object-contain" />
        </div>
      )}
    </BlockChrome>
  );
}
