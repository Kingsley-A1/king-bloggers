"use client";

import Link from "next/link";
import * as React from "react";
import {
  Menu,
  Home,
  Bookmark,
  LayoutDashboard,
  FileText,
  PenSquare,
  Share2,
  LogOut,
} from "lucide-react";
import { signOut } from "next-auth/react";

import { cn } from "../../lib/utils";
import { Logo } from "../ui/Logo";
import { GlassButton } from "../ui/GlassButton";
import { Toast } from "../features/Toast";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://kingbloggers.com";

const SIDEBAR_LINKS = [
  { label: "Home", href: "/", icon: Home },
  { label: "Saved", href: "/saved", icon: Bookmark },
  { label: "Dashboard", href: "/blogger/dashboard", icon: LayoutDashboard },
  { label: "My Blogs", href: "/blogger/my-blogs", icon: FileText },
  { label: "New Blog", href: "/blogger/editor?new=true", icon: PenSquare },
];

export function Sidebar() {
  const [open, setOpen] = React.useState(false);
  const [toast, setToast] = React.useState<{ open: boolean; message: string }>(
    { open: false, message: "" }
  );

  async function shareApp() {
    type NavLike = {
      share?: (data: { title?: string; text?: string; url?: string }) => Promise<void>;
      clipboard?: { writeText?: (text: string) => Promise<void> };
    };

    const origin = (
      globalThis as unknown as { location?: { origin?: string } }
    ).location?.origin;
    const shareUrl = origin || APP_URL;

    const title = "King Bloggers";
    const text = "King Bloggers — Tech, Art & Culture & Power. Tap to open:";

    const nav = (globalThis as unknown as { navigator?: NavLike }).navigator;

    try {
      if (nav?.share) {
        // WhatsApp will use OG tags from the shared URL for preview.
        await nav.share({ title, text, url: shareUrl });
        return;
      }

      if (nav?.clipboard?.writeText) {
        await nav.clipboard.writeText(shareUrl);
        setToast({ open: true, message: "App link copied." });
        return;
      }

      // Last-resort fallback
      window.prompt("Copy this link:", shareUrl);
    } catch {
      // User cancelled or share failed
    }
  }

  return (
    <>
      {/* 👑 Mobile Header with Menu Icon */}
      <div className="md:hidden sticky top-0 z-40 glass-nav">
        <div className="px-4 py-3 flex items-center justify-between">
          <Logo variant="icon" size={24} />
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex items-center justify-center w-10 h-10 rounded-lg border border-foreground/10 bg-foreground/5 active:scale-95 transition-all hover:bg-foreground/10"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
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
              <GlassButton
                variant="ghost"
                onClick={() => setOpen(false)}
                className="px-3"
              >
                Close
              </GlassButton>
            </div>
            <nav className="mt-8 space-y-2">
              {SIDEBAR_LINKS.map((l) => {
                const Icon = l.icon;
                return (
                  <Link
                    key={l.href}
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 rounded-2xl border border-foreground/10 bg-foreground/5 px-4 py-3 text-sm font-bold text-foreground/80 hover:bg-foreground/10"
                  >
                    <Icon className="h-5 w-5" />
                    {l.label}
                  </Link>
                );
              })}

              <button
                type="button"
                onClick={async () => {
                  setOpen(false);
                  await shareApp();
                }}
                className="w-full flex items-center gap-3 rounded-2xl border border-foreground/10 bg-foreground/5 px-4 py-3 text-sm font-bold text-foreground/80 hover:bg-foreground/10"
                aria-label="Share app"
              >
                <Share2 className="h-5 w-5" />
                Share App
              </button>

              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  void signOut({ callbackUrl: "/" });
                }}
                className="w-full flex items-center gap-3 rounded-2xl border border-foreground/10 bg-foreground/5 px-4 py-3 text-sm font-bold text-foreground/80 hover:bg-foreground/10"
                aria-label="Log out"
              >
                <LogOut className="h-5 w-5" />
                Log Out
              </button>
            </nav>
          </aside>
        </div>
      ) : null}

      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden md:block",
          "sticky top-0 h-screen",
          "w-72",
          "border-r border-foreground/10 bg-background/60 backdrop-blur-xl",
          "p-6"
        )}
      >
        <Logo />
        <nav className="mt-10 space-y-2">
          {SIDEBAR_LINKS.map((l) => {
            const Icon = l.icon;
            return (
              <Link
                key={l.href}
                href={l.href}
                className="flex items-center gap-3 rounded-2xl border border-foreground/10 bg-foreground/5 px-4 py-3 text-sm font-bold text-foreground/80 hover:bg-foreground/10 transition-colors"
              >
                <Icon className="h-5 w-5" />
                {l.label}
              </Link>
            );
          })}

          <button
            type="button"
            onClick={() => void shareApp()}
            className="w-full flex items-center gap-3 rounded-2xl border border-foreground/10 bg-foreground/5 px-4 py-3 text-sm font-bold text-foreground/80 hover:bg-foreground/10 transition-colors"
            aria-label="Share app"
          >
            <Share2 className="h-5 w-5" />
            Share App
          </button>

          <button
            type="button"
            onClick={() => void signOut({ callbackUrl: "/" })}
            className="w-full flex items-center gap-3 rounded-2xl border border-foreground/10 bg-foreground/5 px-4 py-3 text-sm font-bold text-foreground/80 hover:bg-foreground/10 transition-colors"
            aria-label="Log out"
          >
            <LogOut className="h-5 w-5" />
            Log Out
          </button>
        </nav>
      </aside>

      <Toast
        open={toast.open}
        message={toast.message}
        onClose={() => setToast({ open: false, message: "" })}
      />
    </>
  );
}
