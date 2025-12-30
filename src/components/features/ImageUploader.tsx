"use client";

import * as React from "react";

import { GlassButton } from "../ui/GlassButton";
import { GlassCard } from "../ui/GlassCard";
import { Spinner } from "../ui/Spinner";

type UploadResponse = {
  uploadUrl: string;
  key: string;
  publicUrl: string | null;
};

export type ImageUploaderProps = {
  onUploaded?: (result: UploadResponse) => void;
  className?: string;
};

export function ImageUploader({ onUploaded, className }: ImageUploaderProps) {
  const [dragging, setDragging] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [lastUrl, setLastUrl] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  async function uploadFile(file: File) {
    setBusy(true);
    try {
      const presign = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: file.name, contentType: file.type || "application/octet-stream" }),
      });

      if (!presign.ok) {
        throw new Error("Failed to get upload URL");
      }

      const data = (await presign.json()) as UploadResponse;

      const put = await fetch(data.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type || "application/octet-stream" },
        body: file,
      });

      if (!put.ok) {
        throw new Error("Upload failed");
      }

      if (data.publicUrl) setLastUrl(data.publicUrl);
      onUploaded?.(data);
    } finally {
      setBusy(false);
    }
  }

  return (
    <GlassCard
      className={
        "p-6 md:p-8 border-dashed " +
        (dragging ? "border-king-orange/40 bg-king-orange/10" : "") +
        (className ? " " + className : "")
      }
    >
      <div
        className="rounded-2xl border border-foreground/10 bg-foreground/5 p-6 md:p-10 text-center"
        onDragEnter={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragging(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragging(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragging(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragging(false);
          const file = e.dataTransfer.files?.[0];
          if (file) void uploadFile(file);
        }}
      >
        <p className="text-sm text-foreground/70">Drag & drop an image here, or choose a file.</p>

        <div className="mt-6 flex items-center justify-center gap-3">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void uploadFile(file);
            }}
          />
          <GlassButton
            variant="primary"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
          >
            {busy ? (
              <span className="inline-flex items-center gap-2">
                <Spinner /> Uploading
              </span>
            ) : (
              "Choose Image"
            )}
          </GlassButton>
        </div>

        {lastUrl ? (
          <div className="mt-6 text-xs font-mono text-foreground/60 break-all">{lastUrl}</div>
        ) : null}
      </div>
    </GlassCard>
  );
}
