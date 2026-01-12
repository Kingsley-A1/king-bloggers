"use client";

import Link from "next/link";
import * as React from "react";
import { useSession } from "next-auth/react";
import { Bell, PenSquare } from "lucide-react";

import { cn } from "../../lib/utils";
import { GlassButton } from "../ui/GlassButton";
import { Logo } from "../ui/Logo";
import { Avatar } from "../ui/Avatar";
import { Container } from "./Container";
import { MobileMenu } from "./MobileMenu";
import { ThemeToggle } from "../features/ThemeToggle";
import { NavSearch } from "../features/NavSearch";
import { getUnreadCount } from "@/lib/actions/notifications";

// ============================================
// 👑 KING BLOGGERS - Mobile-First Navbar
// ============================================
// Clean, compact, app-like header
// ============================================

const LINKS = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Docs", href: "/docs" },
  { label: "Contact", href: "/contact" },
];

export function Navbar() {
  const [compact, setCompact] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const { data: session, status } = useSession();
  const signedIn = status === "authenticated";
  const loading = status === "loading";

  // Scroll handler
  React.useEffect(() => {
    function onScroll() {
      setCompact(window.scrollY > 24);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Poll for unread notifications
  React.useEffect(() => {
    if (!signedIn) return;
    
    const loadCount = () => getUnreadCount().then(setUnreadCount).catch(() => 0);
    loadCount();
    const interval = setInterval(loadCount, 30000);
    return () => clearInterval(interval);
  }, [signedIn]);

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-40 glass-nav transition-all duration-300",
          compact ? "py-2" : "py-3 md:py-4"
        )}
      >
        <Container className="flex items-center justify-between gap-2 md:gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <Logo variant="full" size={compact ? 28 : 32} />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="rounded-full px-4 py-2 text-xs font-bold uppercase tracking-widest text-foreground/70 hover:text-foreground hover:bg-foreground/5 transition-colors"
              >
                {l.label}
              </Link>
            ))}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-1.5 md:gap-2">
            <ThemeToggle />
            
            {/* Global Search */}
            <NavSearch />
            
            {/* Notification Bell - Link to page instead of modal */}
            {signedIn && (
              <>
                <Link
                  href="/notifications"
                  className={cn(
                    "relative p-2 rounded-full transition-all",
                    "hover:bg-foreground/10 active:scale-95"
                  )}
                  aria-label="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-king-orange text-[10px] font-bold text-white px-1">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </Link>

                {/* Upload Button - Only for signed-in users */}
                <Link
                  href="/blogger/editor"
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full",
                    "bg-king-orange/10 border border-king-orange/30",
                    "text-king-orange hover:bg-king-orange/20",
                    "transition-all active:scale-95",
                    "text-sm font-bold"
                  )}
                  aria-label="Upload Blog"
                >
                  <PenSquare className="w-4 h-4" />
                  <span className="hidden sm:inline">Upload</span>
                </Link>
              </>
            )}

            {/* Profile / Login */}
            {loading ? (
              <div
                aria-label="Loading session"
                className="h-9 w-9 rounded-full border border-foreground/10 bg-foreground/5 animate-pulse"
              />
            ) : signedIn ? (
              <Link
                href="/profile"
                aria-label="Profile"
                className="inline-flex items-center justify-center rounded-full border border-foreground/10 bg-foreground/5 p-0.5 active:scale-95 transition-all hover:bg-foreground/10"
              >
                <Avatar
                  src={session?.user?.image}
                  name={session?.user?.name}
                  alt={session?.user?.name ?? "Profile"}
                  size={32}
                />
              </Link>
            ) : (
              <GlassButton as="a" href="/login" variant="glass" className="px-3 py-1.5 text-sm">
                Log In
              </GlassButton>
            )}

            {/* Desktop Studio Button */}
            <div className="hidden md:block">
              <GlassButton as="a" href="/bloggers/editor" variant="primary" className="text-sm">
                Open Studio
              </GlassButton>
            </div>

            {/* Mobile Menu Toggle */}
            <button
              type="button"
              aria-label="Open menu"
              onClick={() => setOpen(true)}
              className="md:hidden rounded-lg border border-foreground/10 bg-foreground/5 px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-foreground/80 active:scale-95 transition-all hover:bg-foreground/10"
            >
              Menu
            </button>
          </div>
        </Container>
      </header>

      <MobileMenu
        open={open}
        onClose={() => setOpen(false)}
        links={[
          ...LINKS,
          ...(signedIn
            ? [
                { label: "Profile", href: "/profile" },
                { label: "Notifications", href: "/notifications" },
              ]
            : [{ label: "Log In", href: "/login" }]),
          { label: "Open Studio", href: "/bloggers/editor" },
        ]}
      />
    </>
  );
}
