"use client";

import * as React from "react";
import { CheckCircle, XCircle, X } from "lucide-react";

import { cn } from "../../lib/utils";

// ============================================
// 👑 KING BLOGGERS - Toast Component
// ============================================
// UI-007: ✅ Accessibility with role="alert" and aria-live
// ============================================

export type ToastVariant = "success" | "error";

export type ToastProps = {
  open: boolean;
  message: string;
  variant?: ToastVariant;
  onClose?: () => void;
  className?: string;
  duration?: number;
};

export function Toast({
  open,
  message,
  variant = "success",
  onClose,
  className,
  duration = 4000,
}: ToastProps) {
  // Auto-dismiss after duration
  React.useEffect(() => {
    if (!open || !onClose) return;
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [open, onClose, duration]);

  if (!open) return null;

  const isSuccess = variant === "success";

  return (
    <div className="fixed inset-x-0 bottom-5 z-50 flex justify-center px-4 pointer-events-none">
      <div
        role="alert"
        aria-live="polite"
        aria-atomic="true"
        className={cn(
          "glass-card max-w-md w-full p-4",
          "flex items-center gap-3",
          "animate-in slide-in-from-bottom-5 fade-in duration-300",
          "pointer-events-auto",
          isSuccess ? "border-green-500/30" : "border-red-500/30",
          className
        )}
      >
        {isSuccess ? (
          <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
        ) : (
          <XCircle className="h-5 w-5 text-red-500 shrink-0" />
        )}
        <p className="text-sm text-foreground/90 flex-1">{message}</p>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-foreground/10 transition-colors"
            aria-label="Close notification"
          >
            <X className="h-4 w-4 text-foreground/50" />
          </button>
        ) : null}
      </div>
    </div>
  );
}
