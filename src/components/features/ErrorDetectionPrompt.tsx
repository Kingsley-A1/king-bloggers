"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { AlertTriangle, Bug, Loader2, Send, X, Upload } from "lucide-react";

import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";
import { Toast } from "@/components/features/Toast";
import { cn } from "@/lib/utils";
import { compressImage } from "@/lib/image-compression";

type PromptKind = "error" | "slow" | "manual";

type CapturedError = {
  name?: string;
  message?: string;
  stack?: string;
};

type ToastState = {
  open: boolean;
  message: string;
  variant?: "success" | "error";
};

const WHATSAPP_E164 = "2349036826272";
const STORAGE_KEY_LAST = "kb_error_prompt_last";

function nowMs() {
  return Date.now();
}

function shouldAutoOpen(): boolean {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY_LAST);
    if (!raw) return true;
    const last = Number(raw);
    if (!Number.isFinite(last)) return true;
    // avoid spamming prompt more than once per 5 minutes
    return nowMs() - last > 5 * 60 * 1000;
  } catch {
    return true;
  }
}

function markAutoOpen() {
  try {
    sessionStorage.setItem(STORAGE_KEY_LAST, String(nowMs()));
  } catch {
    // ignore
  }
}

function waMeUrl(text: string) {
  return `https://wa.me/${WHATSAPP_E164}?text=${encodeURIComponent(text)}`;
}

async function uploadScreenshot(file: File): Promise<string | null> {
  // Keep this lightweight + WhatsApp-friendly:
  // - if non-gif image, compress to JPEG ~ <= 600KB
  // - otherwise upload as-is

  const isGif = file.type === "image/gif";
  let uploadFile: File = file;

  if (!isGif && file.type.startsWith("image/")) {
    try {
      const res = await compressImage(file, {
        maxWidth: 1600,
        maxHeight: 1600,
        quality: 0.85,
        format: "image/jpeg",
        maxFileSizeBytes: 600 * 1024,
      });
      uploadFile = new File([res.blob], "screenshot.jpg", {
        type: "image/jpeg",
      });
    } catch {
      // if compression fails, upload original
      uploadFile = file;
    }
  }

  const formData = new FormData();
  formData.set("file", uploadFile);
  formData.set("fileName", uploadFile.name);
  formData.set("contentType", uploadFile.type || "application/octet-stream");

  const res = await fetch("/api/upload", {
    method: "PUT",
    body: formData,
  });

  if (!res.ok) return null;
  const data = (await res.json().catch(() => null)) as {
    publicUrl?: string;
  } | null;
  return data?.publicUrl ?? null;
}

export function ErrorDetectionPrompt() {
  const pathname = usePathname();
  const [sessionUser, setSessionUser] = React.useState<{
    name?: string | null;
    email?: string | null;
  } | null>(null);

  const [open, setOpen] = React.useState(false);
  const [kind, setKind] = React.useState<PromptKind>("manual");
  const [captured, setCaptured] = React.useState<CapturedError | null>(null);
  const [message, setMessage] = React.useState("");
  const [screenshot, setScreenshot] = React.useState<File | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [toast, setToast] = React.useState<ToastState>({
    open: false,
    message: "",
  });

  const userName = sessionUser?.name ?? "";
  const userEmail = sessionUser?.email ?? "";

  React.useEffect(() => {
    let alive = true;
    async function loadSession() {
      try {
        const res = await fetch("/api/auth/session", { cache: "no-store" });
        if (!res.ok) return;
        const json = (await res.json().catch(() => null)) as {
          user?: { name?: string | null; email?: string | null };
        } | null;
        if (!alive) return;
        setSessionUser(json?.user ?? null);
      } catch {
        // ignore
      }
    }

    void loadSession();
    return () => {
      alive = false;
    };
  }, []);

  const openPrompt = React.useCallback(
    (nextKind: PromptKind, err?: CapturedError) => {
      if (!shouldAutoOpen()) return;
      markAutoOpen();
      setKind(nextKind);
      setCaptured(err ?? null);
      setOpen(true);
    },
    []
  );

  // Allow manual open via global event (e.g., menu link)
  React.useEffect(() => {
    function onOpen() {
      setKind("manual");
      setCaptured(null);
      setOpen(true);
    }

    window.addEventListener("kb:open-report-issue", onOpen);
    return () => window.removeEventListener("kb:open-report-issue", onOpen);
  }, []);

  // Auto-detect JS errors
  React.useEffect(() => {
    function onError(event: ErrorEvent) {
      const err: CapturedError = {
        name: event.error?.name ?? "Error",
        message: event.message,
        stack: event.error?.stack,
      };
      openPrompt("error", err);
    }

    function onUnhandled(event: PromiseRejectionEvent) {
      const reason = event.reason as unknown;
      const err: CapturedError =
        reason && typeof reason === "object"
          ? {
              name: (reason as { name?: string }).name ?? "UnhandledRejection",
              message:
                (reason as { message?: string }).message ??
                (typeof reason === "string"
                  ? reason
                  : "Unhandled promise rejection"),
              stack: (reason as { stack?: string }).stack,
            }
          : { name: "UnhandledRejection", message: String(reason) };
      openPrompt("error", err);
    }

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onUnhandled);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onUnhandled);
    };
  }, [openPrompt]);

  // Slow initial load detection (only on first paint per route)
  React.useEffect(() => {
    const t = window.setTimeout(() => {
      // Only prompt if the document still isn't fully loaded.
      if (document.readyState !== "complete") {
        openPrompt("slow");
      }
    }, 12000);

    return () => window.clearTimeout(t);
  }, [pathname, openPrompt]);

  function close() {
    setOpen(false);
    setBusy(false);
  }

  async function handleSend() {
    if (busy) return;
    const trimmed = message.trim();
    if (trimmed.length < 4) {
      setToast({
        open: true,
        message: "Please describe the issue.",
        variant: "error",
      });
      return;
    }

    setBusy(true);

    const url =
      typeof window !== "undefined"
        ? window.location.href
        : `https://kingbloggers.com${pathname}`;

    let screenshotUrl: string | null = null;
    let screenshotNote: string | null = null;
    if (screenshot) {
      screenshotUrl = await uploadScreenshot(screenshot);
      if (!screenshotUrl) {
        screenshotNote =
          "Screenshot selected, but upload failed (try signing in or retry).";
      }
    }

    const payload = {
      kind,
      message: trimmed,
      url,
      screenshotUrl: screenshotUrl ?? undefined,
      userAgent:
        typeof navigator !== "undefined" ? navigator.userAgent : undefined,
      errorName: captured?.name,
      errorMessage: captured?.message,
      errorStack: captured?.stack,
      clientTimeIso: new Date().toISOString(),
    };

    const res = await fetch("/api/error-report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = (await res.json().catch(() => null)) as {
      ok?: boolean;
      reportId?: string;
      error?: string;
    } | null;

    const reportId = data?.reportId ?? "";

    const composed = [
      "King Bloggers — Issue Report",
      reportId ? `Report ID: ${reportId}` : null,
      userName || userEmail
        ? `User: ${userName || "(no name)"}${
            userEmail ? ` <${userEmail}>` : ""
          }`
        : "User: (not signed in)",
      `Page: ${url}`,
      kind === "error"
        ? "Type: Runtime error"
        : kind === "slow"
        ? "Type: Slow load"
        : "Type: User report",
      captured?.message ? `Error: ${captured.message}` : null,
      screenshotUrl ? `Screenshot: ${screenshotUrl}` : null,
      screenshotNote ? `Note: ${screenshotNote}` : null,
      "---",
      trimmed,
    ]
      .filter((x): x is string => typeof x === "string" && x.length > 0)
      .join("\n");

    // Even if backend fails, user can still send on WhatsApp.
    if (!res.ok) {
      setToast({
        open: true,
        message: data?.error
          ? `Saved locally, backend error: ${data.error}`
          : "Backend error. Sending via WhatsApp anyway…",
        variant: "error",
      });
    }

    // Open WhatsApp with prefilled message.
    try {
      window.open(waMeUrl(composed), "_blank", "noopener,noreferrer");
      setToast({
        open: true,
        message: "WhatsApp opened. Tap send.",
        variant: "success",
      });
    } catch {
      // ignore
    }

    setBusy(false);
    close();
  }

  async function handleCopy() {
    const url =
      typeof window !== "undefined"
        ? window.location.href
        : `https://kingbloggers.com${pathname}`;
    const composed = [
      "King Bloggers — Issue Report",
      userName || userEmail
        ? `User: ${userName || "(no name)"}${
            userEmail ? ` <${userEmail}>` : ""
          }`
        : "User: (not signed in)",
      `Page: ${url}`,
      "---",
      message.trim() || "(no message)",
    ].join("\n");

    try {
      await navigator.clipboard.writeText(composed);
      setToast({
        open: true,
        message: "Copied report text.",
        variant: "success",
      });
    } catch {
      setToast({ open: true, message: "Copy failed.", variant: "error" });
    }
  }

  return (
    <>
      {/* Manual entry point (non-intrusive) */}
      <button
        type="button"
        onClick={() => {
          setKind("manual");
          setCaptured(null);
          setOpen(true);
        }}
        className={cn(
          "fixed bottom-5 left-5 z-40",
          "md:bottom-6 md:left-6",
          "rounded-full px-4 py-3",
          "glass-card border border-foreground/10",
          "text-sm font-bold",
          "hover:bg-foreground/10 transition-colors",
          "active:scale-95"
        )}
        aria-label="Report a problem"
      >
        <span className="inline-flex items-center gap-2">
          <Bug className="h-4 w-4 text-king-orange" />
          Report
        </span>
      </button>

      {open ? (
        <div className="fixed inset-0 z-50">
          <button
            className="absolute inset-0 bg-black/70"
            onClick={close}
            aria-label="Close report dialog"
          />

          <div className="absolute inset-x-0 bottom-0 md:inset-0 md:flex md:items-center md:justify-center">
            <GlassCard
              className={cn(
                "w-full md:max-w-lg",
                "rounded-t-3xl md:rounded-3xl",
                "border border-foreground/10",
                "bg-background/80",
                "p-5 md:p-7",
                "backdrop-blur-xl"
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-king-orange" />
                    <h3 className="text-lg font-black tracking-tight">
                      Having trouble?
                    </h3>
                  </div>
                  <p className="mt-1 text-sm text-foreground/60">
                    Tell us what happened. We’ll route it to support on
                    WhatsApp.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={close}
                  className="p-2 rounded-xl hover:bg-foreground/10 active:scale-95 transition"
                  aria-label="Close"
                >
                  <X className="h-5 w-5 text-foreground/60" />
                </button>
              </div>

              <div className="mt-4 space-y-3">
                {(userName || userEmail) && (
                  <div className="text-xs text-foreground/60">
                    Reporting as{" "}
                    <span className="text-king-orange font-semibold">
                      {userName || userEmail}
                    </span>
                  </div>
                )}

                {captured?.message ? (
                  <div className="rounded-2xl border border-foreground/10 bg-foreground/5 p-3">
                    <div className="text-xs font-mono text-foreground/60">
                      Captured error
                    </div>
                    <div className="mt-1 text-sm text-foreground/80 line-clamp-3">
                      {captured.message}
                    </div>
                  </div>
                ) : null}

                <label className="block">
                  <span className="text-sm font-semibold">
                    Describe the problem
                  </span>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={5}
                    placeholder="What were you trying to do? What happened?"
                    className={cn(
                      "mt-2 w-full rounded-2xl",
                      "border border-foreground/10 bg-foreground/5",
                      "px-4 py-3 text-sm",
                      "outline-none focus:ring-2 focus:ring-king-orange/40",
                      "resize-none"
                    )}
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-semibold">
                    Screenshot (optional)
                  </span>
                  <div className="mt-2 flex items-center gap-3">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        setScreenshot(e.target.files?.[0] ?? null)
                      }
                      className="block w-full text-sm text-foreground/60 file:mr-4 file:rounded-xl file:border-0 file:bg-foreground/10 file:px-4 file:py-2 file:text-sm file:font-bold file:text-foreground hover:file:bg-foreground/15"
                    />
                  </div>
                  {screenshot ? (
                    <div className="mt-2 text-xs text-foreground/60">
                      <Upload className="inline h-3.5 w-3.5 mr-1 text-king-orange" />
                      {screenshot.name}
                    </div>
                  ) : null}
                </label>
              </div>

              <div className="mt-5 flex flex-col gap-2">
                <GlassButton
                  variant="primary"
                  onClick={() => void handleSend()}
                  disabled={busy}
                  className="w-full"
                >
                  {busy ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Preparing…
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2">
                      <Send className="h-4 w-4" />
                      Send to WhatsApp
                    </span>
                  )}
                </GlassButton>

                <GlassButton
                  variant="ghost"
                  onClick={() => void handleCopy()}
                  className="w-full"
                >
                  Copy report text
                </GlassButton>

                <p className="text-xs text-foreground/50 text-center">
                  Note: WhatsApp can’t auto-attach images from links; we include
                  a screenshot link if uploaded.
                </p>
              </div>
            </GlassCard>
          </div>
        </div>
      ) : null}

      <Toast
        open={toast.open}
        message={toast.message}
        variant={toast.variant}
        onClose={() => setToast({ open: false, message: "" })}
      />
    </>
  );
}
