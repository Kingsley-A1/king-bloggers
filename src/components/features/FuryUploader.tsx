"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Upload,
  CheckCircle,
  AlertCircle,
  X,
  Image as ImageIcon,
  Video,
  Copy,
  Check,
  Zap,
  Flame,
} from "lucide-react";

import { GlassButton } from "../ui/GlassButton";
import { cn } from "@/lib/utils";
import { copyTextToClipboard } from "@/lib/clipboard";

// ============================================
// 👑 KING BLOGGERS - FURY Image/Video Uploader
// ============================================
// Features:
// - FURIOUS progress counter with speed indicator
// - Mobile-first, touch-optimized design
// - Real-time upload speed tracking
// - Animated fire effects at high speeds
// - Drag & drop with haptic-style feedback
// ============================================

type UploadResponse = {
  uploadUrl: string;
  key: string;
  publicUrl: string | null;
};

type UploadState = "idle" | "preparing" | "uploading" | "success" | "error";

export type FuryUploaderProps = {
  onUploaded?: (result: UploadResponse) => void;
  className?: string;
  accept?: string;
  maxSize?: number; // in MB
  variant?: "card" | "inline" | "compact";
  showCopyUrl?: boolean;
};

/**
 * FuryUploader - A blazing fast, mobile-first media uploader
 * 
 * Features a "fury meter" that shows upload speed and animated effects
 * when uploads are going fast. Mobile-optimized with large touch targets.
 */
export function FuryUploader({
  onUploaded,
  className,
  accept = "image/*,video/*",
  maxSize = 50, // 50MB default
  variant = "card",
  showCopyUrl = true,
}: FuryUploaderProps) {
  const [dragging, setDragging] = React.useState(false);
  const [state, setState] = React.useState<UploadState>("idle");
  const [progress, setProgress] = React.useState(0);
  const [error, setError] = React.useState<string | null>(null);
  const [preview, setPreview] = React.useState<string | null>(null);
  const [fileName, setFileName] = React.useState<string | null>(null);
  const [publicUrl, setPublicUrl] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);
  const [isVideo, setIsVideo] = React.useState(false);

  // Speed tracking
  const [uploadSpeed, setUploadSpeed] = React.useState(0); // bytes per second
  const [eta, setEta] = React.useState<number | null>(null);

  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const abortRef = React.useRef<XMLHttpRequest | null>(null);
  const lastProgressRef = React.useRef({ time: 0, bytes: 0 });

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
    setIsVideo(false);
    setUploadSpeed(0);
    setEta(null);
    lastProgressRef.current = { time: 0, bytes: 0 };
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
  }

  function validateFile(file: File): string | null {
    const isImageFile = file.type.startsWith("image/");
    const isVideoFile = file.type.startsWith("video/");
    if (!isImageFile && !isVideoFile) {
      return "Please select an image or video file.";
    }

    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > maxSize) {
      return `File too large. Max ${maxSize}MB, yours is ${sizeMB.toFixed(1)}MB.`;
    }

    return null;
  }

  // Format speed for display
  function formatSpeed(bytesPerSec: number): string {
    if (bytesPerSec === 0) return "0 B/s";
    const units = ["B/s", "KB/s", "MB/s", "GB/s"];
    let unitIndex = 0;
    let speed = bytesPerSec;
    while (speed >= 1024 && unitIndex < units.length - 1) {
      speed /= 1024;
      unitIndex++;
    }
    return `${speed.toFixed(1)} ${units[unitIndex]}`;
  }

  // Format ETA
  function formatEta(seconds: number): string {
    if (seconds < 1) return "< 1s";
    if (seconds < 60) return `${Math.ceil(seconds)}s`;
    return `${Math.floor(seconds / 60)}m ${Math.ceil(seconds % 60)}s`;
  }

  // Get fury level based on speed (0-3)
  function getFuryLevel(speed: number): number {
    const mbps = speed / (1024 * 1024);
    if (mbps >= 10) return 3; // BLAZING
    if (mbps >= 5) return 2; // FAST
    if (mbps >= 1) return 1; // NORMAL
    return 0; // SLOW
  }

  async function uploadFile(file: File) {
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
    setIsVideo(file.type.startsWith("video/"));
    setError(null);
    setState("preparing");
    setProgress(0);
    setUploadSpeed(0);
    lastProgressRef.current = { time: Date.now(), bytes: 0 };

    try {
      // Step 1: Get presigned URL
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
        throw new Error(data.error || "Failed to prepare upload.");
      }

      const data = (await presign.json()) as UploadResponse;

      // Step 2: Upload with progress tracking
      setState("uploading");

      let uploadSuccess = false;

      // Try direct upload first
      try {
        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          abortRef.current = xhr;

          xhr.upload.addEventListener("progress", (e) => {
            if (e.lengthComputable) {
              const now = Date.now();
              const elapsed = (now - lastProgressRef.current.time) / 1000;
              const bytesDelta = e.loaded - lastProgressRef.current.bytes;

              if (elapsed > 0.1) {
                // Calculate speed every 100ms
                const speed = bytesDelta / elapsed;
                setUploadSpeed(speed);

                // Calculate ETA
                const remaining = e.total - e.loaded;
                if (speed > 0) {
                  setEta(remaining / speed);
                }

                lastProgressRef.current = { time: now, bytes: e.loaded };
              }

              setProgress(Math.round((e.loaded / e.total) * 100));
            }
          });

          xhr.addEventListener("load", () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve();
            } else {
              reject(new Error(`Upload failed: ${xhr.status}`));
            }
          });

          xhr.addEventListener("error", () => {
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
        // Fallback to server proxy
        if (
          directError instanceof Error &&
          directError.message === "CORS_ERROR"
        ) {
          console.log("Direct upload failed, using server proxy...");
          setProgress(0);

          const formData = new FormData();
          formData.append("file", file);
          formData.append("fileName", file.name);
          formData.append("contentType", file.type || "application/octet-stream");

          const proxyResponse = await fetch("/api/upload", {
            method: "PUT",
            body: formData,
          });

          if (!proxyResponse.ok) {
            const proxyData = await proxyResponse.json().catch(() => ({}));
            throw new Error(proxyData.error || "Server upload failed.");
          }

          const proxyResult = await proxyResponse.json();
          if (proxyResult.publicUrl) {
            data.publicUrl = proxyResult.publicUrl;
          }
          if (proxyResult.key) {
            data.key = proxyResult.key;
          }

          setProgress(100);
          uploadSuccess = true;
        } else {
          throw directError;
        }
      }

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
    e.target.value = "";
  }

  const isUploading = state === "preparing" || state === "uploading";
  const furyLevel = getFuryLevel(uploadSpeed);

  // Fury colors
  const furyColors = [
    "from-blue-500 to-cyan-500", // Slow
    "from-green-500 to-emerald-500", // Normal
    "from-king-orange to-amber-500", // Fast
    "from-red-500 to-orange-500", // BLAZING
  ];

  return (
    <div
      className={cn(
        "relative",
        variant === "card" && "rounded-2xl border border-white/10 bg-[#0a0a0a]/80 backdrop-blur-xl p-4 md:p-6",
        variant === "inline" && "rounded-xl bg-foreground/5 p-4",
        variant === "compact" && "rounded-lg bg-foreground/5 p-3",
        className
      )}
    >
      <div
        className={cn(
          "relative rounded-xl border-2 border-dashed transition-all duration-300",
          variant === "compact" ? "p-4" : "p-6 md:p-8",
          dragging
            ? "border-king-orange bg-king-orange/10 scale-[1.02]"
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
        {/* Preview */}
        <div className="mb-4 flex justify-center">
          {preview ? (
            <div className="relative">
              {isVideo ? (
                <video
                  src={preview}
                  className="h-20 w-20 md:h-24 md:w-24 rounded-xl object-cover ring-2 ring-foreground/10"
                  muted
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={preview}
                  alt="Preview"
                  className="h-20 w-20 md:h-24 md:w-24 rounded-xl object-cover ring-2 ring-foreground/10"
                />
              )}
              {state === "success" && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -bottom-1 -right-1 rounded-full bg-emerald-500 p-1"
                >
                  <CheckCircle className="h-4 w-4 text-white" />
                </motion.div>
              )}
              {!isUploading && state !== "success" && (
                <button
                  onClick={reset}
                  className="absolute -top-2 -right-2 rounded-full bg-foreground/80 p-1.5 hover:bg-foreground transition-colors active:scale-90"
                >
                  <X className="h-3 w-3 text-background" />
                </button>
              )}
            </div>
          ) : (
            <motion.div
              animate={{
                scale: dragging ? 1.1 : 1,
                rotate: dragging ? [0, -5, 5, 0] : 0,
              }}
              className={cn(
                "rounded-2xl p-5 transition-colors",
                dragging ? "bg-king-orange/20" : "bg-foreground/5"
              )}
            >
              {state === "error" ? (
                <AlertCircle className="h-10 w-10 text-red-500" />
              ) : (
                <div className="relative">
                  <ImageIcon
                    className={cn(
                      "h-10 w-10 transition-colors",
                      dragging ? "text-king-orange" : "text-foreground/40"
                    )}
                  />
                  <Video className="absolute -bottom-1 -right-1 h-5 w-5 text-foreground/30" />
                </div>
              )}
            </motion.div>
          )}
        </div>

        {/* Status */}
        <div className="text-center mb-4">
          {state === "idle" && (
            <>
              <p className="text-sm font-medium text-foreground/80 mb-1">
                Drop files here or tap to browse
              </p>
              <p className="text-xs text-foreground/50">
                Images & Videos up to {maxSize}MB
              </p>
            </>
          )}

          {state === "preparing" && (
            <p className="text-sm text-foreground/70 animate-pulse">
              Preparing upload...
            </p>
          )}

          {state === "uploading" && (
            <div className="space-y-3">
              {/* FURY Progress Counter */}
              <div className="flex items-center justify-center gap-2">
                <motion.div
                  animate={{
                    scale: [1, 1.2, 1],
                    rotate: furyLevel >= 2 ? [0, 10, -10, 0] : 0,
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: furyLevel >= 3 ? 0.3 : furyLevel >= 2 ? 0.5 : 1,
                  }}
                >
                  {furyLevel >= 2 ? (
                    <Flame
                      className={cn(
                        "h-6 w-6",
                        furyLevel >= 3
                          ? "text-red-500"
                          : "text-king-orange"
                      )}
                    />
                  ) : (
                    <Zap className="h-5 w-5 text-blue-400" />
                  )}
                </motion.div>
                
                {/* Giant Progress Number */}
                <motion.span
                  key={progress}
                  initial={{ scale: 1.2, opacity: 0.7 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className={cn(
                    "text-4xl md:text-5xl font-black tabular-nums",
                    "bg-gradient-to-r bg-clip-text text-transparent",
                    furyColors[furyLevel]
                  )}
                >
                  {progress}%
                </motion.span>
              </div>

              {/* Speed & ETA */}
              <div className="flex items-center justify-center gap-3 text-xs text-foreground/60">
                <span className={cn(
                  "font-mono font-medium",
                  furyLevel >= 2 && "text-king-orange",
                  furyLevel >= 3 && "text-red-400"
                )}>
                  {formatSpeed(uploadSpeed)}
                </span>
                {eta !== null && eta > 0 && (
                  <>
                    <span className="text-foreground/30">•</span>
                    <span>ETA {formatEta(eta)}</span>
                  </>
                )}
              </div>

              {fileName && (
                <p className="text-xs text-foreground/40 truncate max-w-[200px] mx-auto">
                  {fileName}
                </p>
              )}
            </div>
          )}

          {state === "success" && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="space-y-1"
            >
              <p className="text-sm font-semibold text-emerald-400">
                ✓ Upload Complete!
              </p>
              {fileName && (
                <p className="text-xs text-foreground/50 truncate max-w-[200px] mx-auto">
                  {fileName}
                </p>
              )}
            </motion.div>
          )}

          {state === "error" && (
            <motion.p
              initial={{ x: -10 }}
              animate={{ x: 0 }}
              className="text-sm text-red-400"
            >
              {error}
            </motion.p>
          )}
        </div>

        {/* FURY Progress Bar */}
        {isUploading && (
          <div className="mb-4 mx-auto max-w-xs">
            <div className="h-3 rounded-full bg-foreground/10 overflow-hidden relative">
              <motion.div
                className={cn(
                  "h-full rounded-full bg-gradient-to-r",
                  furyColors[furyLevel]
                )}
                style={{ width: `${progress}%` }}
                transition={{ type: "spring", damping: 30 }}
              />
              {/* Fire particles at high speed */}
              {furyLevel >= 2 && (
                <div
                  className="absolute top-0 bottom-0 w-6 pointer-events-none"
                  style={{ left: `calc(${progress}% - 12px)` }}
                >
                  {[...Array(3)].map((_, i) => (
                    <motion.div
                      key={i}
                      className={cn(
                        "absolute w-2 h-2 rounded-full",
                        furyLevel >= 3 ? "bg-red-400" : "bg-king-orange"
                      )}
                      animate={{
                        y: [-2, -10, -2],
                        x: [0, (i - 1) * 4, 0],
                        opacity: [1, 0.5, 1],
                        scale: [1, 0.5, 1],
                      }}
                      transition={{
                        repeat: Infinity,
                        duration: 0.4,
                        delay: i * 0.1,
                      }}
                      style={{
                        left: "50%",
                        top: "50%",
                        transform: "translate(-50%, -50%)",
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
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
              size={variant === "compact" ? "sm" : "default"}
              onClick={() => inputRef.current?.click()}
              className="gap-2 w-full sm:w-auto min-h-[48px]"
            >
              <Upload className="h-5 w-5" />
              Choose File
            </GlassButton>
          )}

          {isUploading && (
            <GlassButton
              variant="ghost"
              size={variant === "compact" ? "sm" : "default"}
              onClick={() => {
                if (abortRef.current) abortRef.current.abort();
                reset();
              }}
              className="min-h-[48px]"
            >
              Cancel
            </GlassButton>
          )}

          {state === "success" && (
            <GlassButton
              variant="glass"
              size={variant === "compact" ? "sm" : "default"}
              onClick={reset}
              className="gap-2 min-h-[48px]"
            >
              <Upload className="h-4 w-4" />
              Upload Another
            </GlassButton>
          )}
        </div>

        {/* Copy URL */}
        {showCopyUrl && publicUrl && state === "success" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-3 rounded-xl bg-foreground/5 border border-foreground/10"
          >
            <p className="text-[10px] text-foreground/40 mb-1 flex items-center gap-1">
              {copied ? (
                <>
                  <Check className="h-3 w-3 text-green-500" /> Copied!
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" /> Tap to copy URL
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
                  ? "text-green-400"
                  : "text-king-orange/80 hover:text-king-orange"
              )}
            >
              {publicUrl}
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default FuryUploader;
