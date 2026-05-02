"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Loader2, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteBrandingImage } from "@/server-actions/branding";

interface Props {
  kind: "avatar" | "banner";
  currentImageId: string | null;
}

export function ImageUploader({ kind, currentImageId }: Props) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    currentImageId ? `/api/images/${currentImageId}?v=${currentImageId}` : null,
  );
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [pending, start] = useTransition();
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setPreviewUrl(currentImageId ? `/api/images/${currentImageId}?v=${currentImageId}` : null);
  }, [currentImageId]);

  async function onFile(file: File) {
    setError(null);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("kind", kind);
      const res = await fetch("/api/branding/upload", { method: "POST", body: fd });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        setError(j.error || "Upload failed.");
        return;
      }
      const j = (await res.json()) as { url: string; id: string };
      setPreviewUrl(`${j.url}?v=${j.id}`);
    } finally {
      setUploading(false);
    }
  }

  function pickFile() {
    inputRef.current?.click();
  }

  const isAvatar = kind === "avatar";
  const containerClass = isAvatar
    ? "relative h-24 w-24 overflow-hidden rounded-full border border-border bg-bg-elevated"
    : "relative aspect-[20/3] w-full overflow-hidden rounded-lg border border-border bg-bg-elevated";

  return (
    <div className="space-y-3">
      <div
        className={containerClass}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const f = e.dataTransfer.files?.[0];
          if (f) onFile(f);
        }}
      >
        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={previewUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted">
            {isAvatar ? "Avatar" : "Drop banner here"}
          </div>
        )}
        {(uploading || pending) && (
          <div className="absolute inset-0 flex items-center justify-center bg-bg/70">
            <Loader2 className="animate-spin text-ink" />
          </div>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
          e.currentTarget.value = "";
        }}
      />
      <div className="flex items-center gap-2">
        <Button type="button" variant="outline" size="sm" onClick={pickFile} className="gap-1.5">
          <Upload size={13} />
          {previewUrl ? "Replace" : "Upload"}
        </Button>
        {previewUrl && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={pending}
            onClick={() =>
              start(async () => {
                await deleteBrandingImage(kind);
                setPreviewUrl(null);
              })
            }
            className="gap-1.5 text-danger hover:text-danger"
          >
            <Trash2 size={13} />
            Remove
          </Button>
        )}
      </div>
      {error && <p className="text-[12px] text-danger">{error}</p>}
      <p className="text-[11.5px] text-ink-muted">
        {isAvatar
          ? "PNG, JPEG, or WebP. We'll resize to 256×256."
          : "PNG, JPEG, or WebP. Resized to 1600×500 max."}
      </p>
    </div>
  );
}
