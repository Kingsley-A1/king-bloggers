"use client";

import Link from "next/link";
import * as React from "react";
import {
  Home,
  Info,
  BookOpen,
  Mail,
  LayoutDashboard,
  PenSquare,
  FileText,
  User,
  Bell,
  LogIn,
  Share2,
  Bug,
} from "lucide-react";

import { cn } from "../../lib/utils";
import { GlassButton } from "../ui/GlassButton";

export type MobileMenuLink = { label: string; href: string };

export type MobileMenuProps = {
  open: boolean;
  onClose: () => void;
  links: MobileMenuLink[];
  className?: string;
};

export function MobileMenu({
  open,
  onClose,
  links,
  className,
}: MobileMenuProps) {
  if (!open) return null;

  type NavLike = {
    share?: (data: {
      title?: string;
      text?: string;
      url?: string;
    }) => Promise<void>;
    clipboard?: { writeText?: (text: string) => Promise<void> };
  };

  const appUrl = (globalThis as unknown as { location?: { origin?: string } })
    .location?.origin;
  const shareUrl = appUrl || "https://kingbloggers.com";

  function iconForLink(label: string, href: string) {
    if (href === "/") return Home;
    if (href === "/about") return Info;
    if (href === "/docs") return BookOpen;
    if (href === "/contact") return Mail;
    if (href === "/blogger/dashboard") return LayoutDashboard;
    if (href.startsWith("/blogger/editor")) return PenSquare;
    if (href === "/blogger/my-blogs") return FileText;
    if (href === "/profile") return User;
    if (href === "/notifications") return Bell;
    if (href === "/login") return LogIn;
    if (href === "/register") return LogIn;
    void label;
    return null;
  }

  async function shareApp() {
    const nav = (globalThis as unknown as { navigator?: NavLike }).navigator;
    const title = "King Bloggers";
    const text = "King Bloggers — Tech, Art & Culture & Power. Tap to open:";
    try {
      if (nav?.share) {
        await nav.share({ title, text, url: shareUrl });
        return;
      }
      if (nav?.clipboard?.writeText) {
        await nav.clipboard.writeText(shareUrl);
      }
    } catch {
      // ignore
    }
  }

  function reportIssue() {
    try {
      window.dispatchEvent(new Event("kb:open-report-issue"));
    } catch {
      // ignore
    }
  }

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
          className
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
              className="flex items-center gap-3 rounded-2xl border border-foreground/10 bg-foreground/5 px-4 py-3 text-sm font-bold text-foreground/80 hover:bg-foreground/10"
            >
              {(() => {
                const Icon = iconForLink(l.label, l.href);
                return Icon ? <Icon className="h-5 w-5" /> : null;
              })()}
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="mt-8 pt-6 border-t border-foreground/10 space-y-3">
          <button
            type="button"
            onClick={async () => {
              onClose();
              await shareApp();
            }}
            className="w-full flex items-center gap-3 rounded-2xl border border-foreground/10 bg-foreground/5 px-4 py-3 text-sm font-bold text-foreground/80 hover:bg-foreground/10 active:scale-95 transition"
            aria-label="Share app"
          >
            <Share2 className="h-5 w-5" />
            Share App
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              reportIssue();
            }}
            className="w-full flex items-center gap-3 rounded-2xl border border-foreground/10 bg-foreground/5 px-4 py-3 text-sm font-bold text-foreground/80 hover:bg-foreground/10 active:scale-95 transition"
            aria-label="Report issue"
          >
            <Bug className="h-5 w-5 text-king-orange" />
            Report issue
          </button>

          <p className="text-xs text-foreground/50">
            Share app uses the main OG preview. Reporting opens a secure
            WhatsApp flow.
          </p>
        </div>
      </div>
    </div>
  );
}
