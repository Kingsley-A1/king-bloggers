"use client";

import * as React from "react";
import {
  Upload,
  CheckCircle,
  AlertCircle,
  X,
  Image as ImageIcon,
  Copy,
  Check,
} from "lucide-react";

import { GlassButton } from "../ui/GlassButton";
import { GlassCard } from "../ui/GlassCard";
import { cn } from "@/lib/utils";
import { copyTextToClipboard } from "@/lib/clipboard";

// ============================================
// 👑 KING BLOGGERS - Intelligent Image Uploader
// ============================================
// Features: Progress tracking, preview, drag & drop
// ============================================

type UploadResponse = {
  uploadUrl: string;
  key: string;
  publicUrl: string | null;
};

type UploadState = "idle" | "preparing" | "uploading" | "success" | "error";

export type ImageUploaderProps = {
  onUploaded?: (result: UploadResponse) => void;
  className?: string;
  accept?: string;
  maxSize?: number; // in MB
};

export function ImageUploader({
  onUploaded,
  className,
  accept = "image/*",
  maxSize = 10, // 10MB default
}: ImageUploaderProps) {
  const [dragging, setDragging] = React.useState(false);
  const [state, setState] = React.useState<UploadState>("idle");
  const [progress, setProgress] = React.useState(0);
  const [error, setError] = React.useState<string | null>(null);
  const [preview, setPreview] = React.useState<string | null>(null);
  const [fileName, setFileName] = React.useState<string | null>(null);
  const [publicUrl, setPublicUrl] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const abortRef = React.useRef<XMLHttpRequest | null>(null);

  // Cleanup preview URL on unmount
  React.useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  function reset() {
    setState("idle");
    setProgress(0);
    setError(null);
    setPreview(null);
    setFileName(null);
    setPublicUrl(null);
    setCopied(false);
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
  }

  function validateFile(file: File): string | null {
    // Check file type
    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");
    if (!isImage && !isVideo) {
      return "Please select an image or video file.";
    }

    // Check file size
    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > maxSize) {
      return `File too large. Maximum size is ${maxSize}MB. Your file is ${sizeMB.toFixed(
        1
      )}MB.`;
    }

    return null;
  }

  async function uploadFile(file: File) {
    // Validate first
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      setState("error");
      return;
    }

    // Create preview
    const previewUrl = URL.createObjectURL(file);
    setPreview(previewUrl);
    setFileName(file.name);
    setError(null);
    setState("preparing");
    setProgress(0);

    try {
      // Step 1: Get presigned URL from our API
      const presign = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type || "application/octet-stream",
          fileSize: file.size,
        }),
      });

      if (!presign.ok) {
        const data = await presign.json().catch(() => ({}));
        throw new Error(
          data.error || "Failed to prepare upload. Please try again."
        );
      }

      const data = (await presign.json()) as UploadResponse;

      // Step 2: Try direct upload to R2, fallback to server proxy if CORS fails
      setState("uploading");

      let uploadSuccess = false;

      // Try direct upload first (faster)
      try {
        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          abortRef.current = xhr;

          xhr.upload.addEventListener("progress", (e) => {
            if (e.lengthComputable) {
              const percent = Math.round((e.loaded / e.total) * 100);
              setProgress(percent);
            }
          });

          xhr.addEventListener("load", () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve();
            } else {
              reject(new Error(`Upload failed with status ${xhr.status}`));
            }
          });

          xhr.addEventListener("error", () => {
            // This likely means CORS failed - we'll fallback to server proxy
            reject(new Error("CORS_ERROR"));
          });

          xhr.addEventListener("abort", () => {
            reject(new Error("Upload cancelled."));
          });

          xhr.open("PUT", data.uploadUrl);
          xhr.setRequestHeader(
            "Content-Type",
            file.type || "application/octet-stream"
          );
          xhr.send(file);
        });
        uploadSuccess = true;
      } catch (directError) {
        // If CORS error, try server-side proxy
        if (
          directError instanceof Error &&
          directError.message === "CORS_ERROR"
        ) {
          console.log("Direct upload failed (CORS), using server proxy...");
          setProgress(0);

          // Use FormData for server-side upload
          const formData = new FormData();
          formData.append("file", file);
          formData.append("fileName", file.name);
          formData.append(
            "contentType",
            file.type || "application/octet-stream"
          );

          const proxyResponse = await fetch("/api/upload", {
            method: "PUT",
            body: formData,
          });

          if (!proxyResponse.ok) {
            const proxyData = await proxyResponse.json().catch(() => ({}));
            throw new Error(
              proxyData.error || "Server upload failed. Please try again."
            );
          }

          const proxyResult = await proxyResponse.json();
          // Update data with proxy result
          if (proxyResult.publicUrl) {
            data.publicUrl = proxyResult.publicUrl;
          }
          if (proxyResult.key) {
            data.key = proxyResult.key;
          }

          setProgress(100);
          uploadSuccess = true;
        } else {
          // Re-throw non-CORS errors
          throw directError;
        }
      }

      // Success!
      if (uploadSuccess) {
        setState("success");
        setProgress(100);
        if (data.publicUrl) setPublicUrl(data.publicUrl);
        onUploaded?.(data);
        abortRef.current = null;
      }
    } catch (err) {
      setState("error");
      setError(
        err instanceof Error ? err.message : "Upload failed. Please try again."
      );
      abortRef.current = null;
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void uploadFile(file);
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) void uploadFile(file);
    // Reset input so same file can be selected again
    e.target.value = "";
  }

  const isUploading = state === "preparing" || state === "uploading";

  return (
    <GlassCard
      className={cn(
        "p-4 md:p-6 transition-all duration-300",
        dragging && "ring-2 ring-king-orange/50 bg-king-orange/5",
        className
      )}
    >
      <div
        className={cn(
          "relative rounded-xl border-2 border-dashed p-6 md:p-8 text-center transition-all duration-300",
          dragging
            ? "border-king-orange bg-king-orange/10"
            : "border-foreground/20 hover:border-foreground/30",
          state === "success" && "border-emerald-500/50 bg-emerald-500/5",
          state === "error" && "border-red-500/50 bg-red-500/5"
        )}
        onDragEnter={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setDragging(false);
        }}
        onDrop={handleDrop}
      >
        {/* Preview or Icon */}
        <div className="mb-4 flex justify-center">
          {preview ? (
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview}
                alt="Preview"
                className="h-24 w-24 rounded-lg object-cover ring-2 ring-foreground/10"
              />
              {state === "success" && (
                <div className="absolute -bottom-1 -right-1 rounded-full bg-emerald-500 p-1">
                  <CheckCircle className="h-4 w-4 text-white" />
                </div>
              )}
              {!isUploading && state !== "success" && (
                <button
                  onClick={reset}
                  className="absolute -top-2 -right-2 rounded-full bg-foreground/80 p-1 hover:bg-foreground transition-colors"
                >
                  <X className="h-3 w-3 text-background" />
                </button>
              )}
            </div>
          ) : (
            <div
              className={cn(
                "rounded-full p-4 transition-colors",
                dragging ? "bg-king-orange/20" : "bg-foreground/5"
              )}
            >
              {state === "error" ? (
                <AlertCircle className="h-8 w-8 text-red-500" />
              ) : (
                <ImageIcon
                  className={cn(
                    "h-8 w-8 transition-colors",
                    dragging ? "text-king-orange" : "text-foreground/40"
                  )}
                />
              )}
            </div>
          )}
        </div>

        {/* Status Text */}
        <div className="mb-4">
          {state === "idle" && (
            <>
              <p className="text-sm font-medium text-foreground/80">
                Drop an image here or click to browse
              </p>
              <p className="mt-1 text-xs text-foreground/50">
                PNG, JPG, GIF, WEBP up to {maxSize}MB
              </p>
            </>
          )}

          {state === "preparing" && (
            <p className="text-sm text-foreground/70">Preparing upload...</p>
          )}

          {state === "uploading" && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-king-orange">
                Uploading... {progress}%
              </p>
              {fileName && (
                <p className="text-xs text-foreground/50 truncate max-w-xs mx-auto">
                  {fileName}
                </p>
              )}
            </div>
          )}

          {state === "success" && (
            <div className="space-y-1">
              <p className="text-sm font-medium text-emerald-500">
                ✓ Upload complete!
              </p>
              {fileName && (
                <p className="text-xs text-foreground/50 truncate max-w-xs mx-auto">
                  {fileName}
                </p>
              )}
            </div>
          )}

          {state === "error" && <p className="text-sm text-red-500">{error}</p>}
        </div>

        {/* Progress Bar */}
        {isUploading && (
          <div className="mb-4 mx-auto max-w-xs">
            <div className="h-2 rounded-full bg-foreground/10 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-king-orange to-sovereign-gold rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-3">
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            className="hidden"
            onChange={handleFileSelect}
          />

          {(state === "idle" || state === "error") && (
            <GlassButton
              variant="primary"
              onClick={() => inputRef.current?.click()}
              className="gap-2"
            >
              <Upload className="h-4 w-4" />
              Choose Image
            </GlassButton>
          )}

          {isUploading && (
            <GlassButton
              variant="ghost"
              onClick={() => {
                if (abortRef.current) abortRef.current.abort();
                reset();
              }}
            >
              Cancel
            </GlassButton>
          )}

          {state === "success" && (
            <GlassButton variant="ghost" onClick={reset} className="gap-2">
              <Upload className="h-4 w-4" />
              Upload Another
            </GlassButton>
          )}
        </div>

        {/* Public URL Display */}
        {publicUrl && state === "success" && (
          <div className="mt-4 p-2 rounded-lg bg-foreground/5 border border-foreground/10">
            <p className="text-[10px] text-foreground/40 mb-1 flex items-center gap-1">
              {copied ? (
                <>
                  <Check className="h-3 w-3 text-green-500" /> Copied!
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" /> Click to copy URL
                </>
              )}
            </p>
            <button
              onClick={async () => {
                const ok = await copyTextToClipboard(publicUrl);
                if (ok) {
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }
              }}
              className={cn(
                "text-xs font-mono break-all text-left w-full transition-colors",
                copied
                  ? "text-green-500"
                  : "text-king-orange/80 hover:text-king-orange"
              )}
            >
              {publicUrl}
            </button>
          </div>
        )}
      </div>
    </GlassCard>
  );
}
