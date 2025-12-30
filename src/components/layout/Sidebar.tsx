"use client";

import Link from "next/link";
import * as React from "react";

import { cn } from "../../lib/utils";
import { Logo } from "../ui/Logo";
import { GlassButton } from "../ui/GlassButton";

const SIDEBAR_LINKS = [
  { label: "Dashboard", href: "/blogger/dashboard" },
  { label: "Editor", href: "/blogger/editor" },
];

export function Sidebar() {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <div className="md:hidden sticky top-0 z-40 glass-nav">
        <div className="px-6 py-3 flex items-center justify-between">
          <Logo variant="icon" size={24} />
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="rounded-2xl border border-foreground/10 bg-foreground/5 px-4 py-2 text-xs font-bold uppercase tracking-widest text-foreground/80 active:scale-95"
          >
            Studio
          </button>
        </div>
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            className="absolute inset-0 bg-black/60"
            aria-label="Close sidebar"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute left-0 top-0 h-full w-[85%] max-w-xs glass-card rounded-none border-r border-foreground/10 bg-background/80 p-6">
            <div className="flex items-center justify-between">
              <Logo />
              <GlassButton variant="ghost" onClick={() => setOpen(false)} className="px-3">
                Close
              </GlassButton>
            </div>
            <nav className="mt-8 space-y-2">
              {SIDEBAR_LINKS.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-2xl border border-foreground/10 bg-foreground/5 px-4 py-3 text-sm font-bold text-foreground/80 hover:bg-foreground/10"
                >
                  {l.label}
                </Link>
              ))}
            </nav>
          </aside>
        </div>
      ) : null}

      <aside
        className={cn(
          "hidden md:block",
          "sticky top-0 h-screen",
          "w-72",
          "border-r border-foreground/10 bg-background/60 backdrop-blur-xl",
          "p-6",
        )}
      >
        <Logo />
        <nav className="mt-10 space-y-2">
          {SIDEBAR_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="block rounded-2xl border border-foreground/10 bg-foreground/5 px-4 py-3 text-sm font-bold text-foreground/80 hover:bg-foreground/10"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </aside>
    </>
  );
}
