import * as React from "react";

import { cn } from "../../lib/utils";

export type GlassButtonVariant = "primary" | "glass" | "ghost";
export type GlassButtonSize = "default" | "sm" | "lg" | "icon";

type CommonProps = {
  variant?: GlassButtonVariant;
  size?: GlassButtonSize;
};

type ButtonProps = CommonProps &
  React.ButtonHTMLAttributes<HTMLButtonElement> & { as?: "button" };
type AnchorProps = CommonProps &
  React.AnchorHTMLAttributes<HTMLAnchorElement> & { as: "a" };

export type GlassButtonProps = ButtonProps | AnchorProps;

export function GlassButton(props: GlassButtonProps) {
  const { variant = "glass", size = "default" } = props;

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
    "inline-flex items-center justify-center",
    "select-none",
    props.className
  );

  if (props.as === "a") {
    const { as: _as, className: _className, ...rest } = props;
    return <a className={classes} {...rest} />;
  }

  const { as: _as, className: _className, ...rest } = props as ButtonProps;
  return (
    <button
      type={(rest as ButtonProps).type ?? "button"}
      className={classes}
      {...rest}
    />
  );
}
