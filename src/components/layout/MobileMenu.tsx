"use client";

import Link from "next/link";
import * as React from "react";

import { cn } from "../../lib/utils";
import { GlassButton } from "../ui/GlassButton";

export type MobileMenuLink = { label: string; href: string };

export type MobileMenuProps = {
  open: boolean;
  onClose: () => void;
  links: MobileMenuLink[];
  className?: string;
};

export function MobileMenu({ open, onClose, links, className }: MobileMenuProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Close menu"
        onClick={onClose}
        className="absolute inset-0 bg-black/60"
      />
      <div
        className={cn(
          "absolute right-0 top-0 h-full w-[85%] max-w-sm",
          "glass-card rounded-none border-l border-foreground/10 bg-background/80 backdrop-blur-2xl",
          "p-6",
          className,
        )}
      >
        <div className="flex items-center justify-between">
          <div className="text-sm font-black">Menu</div>
          <GlassButton variant="ghost" onClick={onClose} className="px-3">
            Close
          </GlassButton>
        </div>

        <nav className="mt-8 space-y-3">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={onClose}
              className="block rounded-2xl border border-foreground/10 bg-foreground/5 px-4 py-3 text-sm font-bold text-foreground/80 hover:bg-foreground/10"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
