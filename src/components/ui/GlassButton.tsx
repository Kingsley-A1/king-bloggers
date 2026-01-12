import * as React from "react";

import { cn } from "../../lib/utils";
import { Spinner } from "./Spinner";

// ============================================
// 👑 KING BLOGGERS - Glass Button Component
// ============================================
// UI-001: ✅ Built-in loading state support
// The Apple Ease: cubic-bezier(0.4, 0, 0.2, 1)
// Haptic Motion: scale-95 on press
// ============================================

export type GlassButtonVariant = "primary" | "glass" | "ghost";
export type GlassButtonSize = "default" | "sm" | "lg" | "icon";

type CommonProps = {
  variant?: GlassButtonVariant;
  size?: GlassButtonSize;
  loading?: boolean;
  loadingText?: string;
};

type ButtonProps = CommonProps &
  React.ButtonHTMLAttributes<HTMLButtonElement> & { as?: "button" };
type AnchorProps = CommonProps &
  React.AnchorHTMLAttributes<HTMLAnchorElement> & { as: "a" };

export type GlassButtonProps = ButtonProps | AnchorProps;

export function GlassButton(props: GlassButtonProps) {
  const {
    variant = "glass",
    size = "default",
    loading = false,
    loadingText,
  } = props;

  const classes = cn(
    "glass-button",
    variant === "primary" &&
      "glow-orange bg-king-orange text-black border-king-orange hover:bg-king-orange-hover hover:border-king-orange-hover",
    variant === "glass" && "",
    variant === "ghost" &&
      "bg-transparent border-transparent shadow-none hover:bg-foreground/5 hover:text-foreground",
    size === "default" && "px-6 py-2",
    size === "sm" && "px-4 py-1 text-xs",
    size === "lg" && "px-8 py-3 text-sm",
    size === "icon" &&
      "p-2 w-10 h-10 flex items-center justify-center px-0 py-0",
    "disabled:opacity-50 disabled:pointer-events-none",
    "inline-flex items-center justify-center gap-2",
    "select-none",
    loading && "cursor-wait",
    props.className
  );

  // Determine spinner size based on button size
  const spinnerSize = size === "sm" ? 12 : size === "lg" ? 18 : 14;

  if (props.as === "a") {
    const {
      as: _as,
      className: _className,
      loading: _loading,
      loadingText: _loadingText,
      ...rest
    } = props;
    return <a className={classes} {...rest} />;
  }

  const {
    as: _as,
    className: _className,
    loading: _loading,
    loadingText: _loadingText,
    children,
    disabled,
    ...rest
  } = props as ButtonProps & { children?: React.ReactNode };

  return (
    <button
      type={(rest as ButtonProps).type ?? "button"}
      className={classes}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? (
        <>
          <Spinner size={spinnerSize} />
          {loadingText ?? children}
        </>
      ) : (
        children
      )}
    </button>
  );
}
