"use client";

import * as React from "react";
import { useFormStatus } from "react-dom";

import {
  GlassButton,
  type GlassButtonSize,
  type GlassButtonVariant,
} from "./GlassButton";
import { Spinner } from "./Spinner";

export type FormSubmitButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: GlassButtonVariant;
  size?: GlassButtonSize;
  pendingText?: string;
};

export function FormSubmitButton({
  pendingText = "Working…",
  type = "submit",
  variant = "glass",
  size = "default",
  disabled,
  children,
  ...props
}: FormSubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <GlassButton
      {...props}
      variant={variant}
      size={size}
      type={type}
      disabled={Boolean(disabled) || pending}
    >
      {pending ? (
        <span className="inline-flex items-center gap-2">
          <Spinner size={16} /> {pendingText}
        </span>
      ) : (
        children
      )}
    </GlassButton>
  );
}
