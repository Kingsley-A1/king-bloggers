"use client";

import * as React from "react";

import { cn } from "../../lib/utils";
import { GlassButton } from "../ui/GlassButton";

export type ToastVariant = "success" | "error";

export type ToastProps = {
  open: boolean;
  message: string;
  variant?: ToastVariant;
  onClose?: () => void;
  className?: string;
};

export function Toast({
  open,
  message,
  variant = "success",
  onClose,
  className,
}: ToastProps) {
  if (!open) return null;

  const styles =
    variant === "success" ? "border-king-orange/25" : "border-foreground/20";

  return (
    <div className="fixed inset-x-0 bottom-5 z-50 flex justify-center px-4">
      <div
        role="status"
        className={cn(
          "glass-card max-w-xl w-full p-4 md:p-5",
          styles,
          "flex items-center justify-between gap-4",
          className
        )}
      >
        <p className="text-sm text-foreground/80">{message}</p>
        {onClose ? (
          <GlassButton variant="ghost" onClick={onClose} className="px-3">
            Close
          </GlassButton>
        ) : null}
      </div>
    </div>
  );
}
