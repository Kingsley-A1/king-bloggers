"use client";

import * as React from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";

type ErrorStateProps = {
  title?: string;
  message?: string;
  showRetry?: boolean;
  showHome?: boolean;
  onRetry?: () => void;
  className?: string;
};

export function ErrorState({
  title = "Something went wrong",
  message = "An unexpected error occurred. Please try again.",
  showRetry = true,
  showHome = true,
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={`flex items-center justify-center min-h-[300px] p-4 ${
        className ?? ""
      }`}
    >
      <GlassCard className="p-8 md:p-10 text-center max-w-md w-full">
        <div className="w-16 h-16 mx-auto rounded-full bg-red-500/10 flex items-center justify-center mb-4">
          <AlertTriangle className="h-8 w-8 text-red-500" />
        </div>
        <h2 className="text-xl font-black tracking-tight mb-2">{title}</h2>
        <p className="text-foreground/60 text-sm mb-6">{message}</p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          {showRetry && (
            <GlassButton
              variant="primary"
              onClick={onRetry ?? (() => window.location.reload())}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </GlassButton>
          )}
          {showHome && (
            <Link href="/">
              <GlassButton variant="ghost" className="gap-2">
                <Home className="h-4 w-4" />
                Go Home
              </GlassButton>
            </Link>
          )}
        </div>
      </GlassCard>
    </div>
  );
}

type EmptyStateProps = {
  icon?: React.ReactNode;
  title: string;
  message?: string;
  action?: React.ReactNode;
  className?: string;
};

export function EmptyState({
  icon,
  title,
  message,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={`flex items-center justify-center min-h-[200px] p-4 ${
        className ?? ""
      }`}
    >
      <div className="text-center max-w-sm">
        {icon && (
          <div className="w-14 h-14 mx-auto rounded-full bg-foreground/5 flex items-center justify-center mb-4 text-foreground/40">
            {icon}
          </div>
        )}
        <h3 className="text-lg font-bold tracking-tight mb-1">{title}</h3>
        {message && (
          <p className="text-foreground/60 text-sm mb-4">{message}</p>
        )}
        {action}
      </div>
    </div>
  );
}

type LoadingStateProps = {
  message?: string;
  className?: string;
};

export function LoadingState({
  message = "Loading...",
  className,
}: LoadingStateProps) {
  return (
    <div
      className={`flex items-center justify-center min-h-[200px] p-4 ${
        className ?? ""
      }`}
    >
      <div className="text-center">
        <div className="w-10 h-10 mx-auto mb-3 border-2 border-king-orange/30 border-t-king-orange rounded-full animate-spin" />
        <p className="text-sm text-foreground/60">{message}</p>
      </div>
    </div>
  );
}
