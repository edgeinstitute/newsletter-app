"use client";

import { useRef, useState, useTransition, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useSupabase } from "@/providers/SupabaseProvider";
import { updateAvatarUrl, deleteAvatar } from "@/app/actions/user-actions";
import { SpinnerIcon, TrashIcon, PencilIcon } from "@/components/icons";

const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 300 * 1024;

type Props = {
  userId: string;
  initialAvatarUrl: string | null;
  displayName: string;
};

export function AvatarUpload({ userId, initialAvatarUrl, displayName }: Props) {
  const supabase = useSupabase();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialAvatarUrl);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const initials = displayName
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");

  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(null);

    if (!ACCEPTED.includes(file.type)) {
      setError("Formate acceptate: JPEG, PNG, WebP");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("Imaginea depășește 300 KB");
      return;
    }

    setUploading(true);
    const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    const path = `${userId}/avatar.${ext}`;

    const { error: upErr } = await supabase.storage
      .from("profile_photos")
      .upload(path, file, { upsert: true, contentType: file.type });

    if (upErr) {
      setUploading(false);
      setError(upErr.message);
      return;
    }

    const { data } = supabase.storage.from("profile_photos").getPublicUrl(path);
    const publicUrl = `${data.publicUrl}?v=${Date.now()}`;

    startTransition(async () => {
      const result = await updateAvatarUrl(publicUrl);
      setUploading(false);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setAvatarUrl(publicUrl);
      router.refresh();
    });
  };

  const onRemove = () => {
    setError(null);
    startTransition(async () => {
      const result = await deleteAvatar();
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setAvatarUrl(null);
      router.refresh();
    });
  };

  const busy = uploading || pending;

  return (
    <section className="border-border bg-surface-elevated rounded-xs border p-6">
      <h2 className="text-foreground text-lg font-medium">Fotografie de profil</h2>
      <p className="text-text-muted mt-1 text-sm">JPEG, PNG sau WebP, până la 300 KB.</p>

      <div className="mt-5 flex items-center gap-5">
        <div className="bg-primary-200 relative h-20 w-20 shrink-0 overflow-hidden rounded-full">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt=""
              width={80}
              height={80}
              className="h-full w-full object-cover"
              unoptimized
            />
          ) : (
            <div className="text-primary-700 flex h-full w-full items-center justify-center text-lg font-medium">
              {initials || "?"}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={busy}
              className="border-border bg-surface text-foreground hover:border-primary inline-flex h-9 items-center gap-2 rounded-xs border px-3 text-sm transition disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy ? (
                <SpinnerIcon className="h-3.5 w-3.5" />
              ) : (
                <PencilIcon className="h-3.5 w-3.5" />
              )}
              {avatarUrl ? "Schimbă" : "Încarcă"}
            </button>
            {avatarUrl && (
              <button
                type="button"
                onClick={onRemove}
                disabled={busy}
                className="border-border bg-surface text-danger-700 hover:border-danger inline-flex h-9 items-center gap-2 rounded-xs border px-3 text-sm transition disabled:cursor-not-allowed disabled:opacity-60"
              >
                <TrashIcon className="h-3.5 w-3.5" /> Șterge
              </button>
            )}
          </div>
          {error && <p className="text-danger-700 text-xs">{error}</p>}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED.join(",")}
          onChange={onFile}
          className="hidden"
        />
      </div>
    </section>
  );
}
