"use client";

import Link from "next/link";
import * as React from "react";
import { useSession } from "next-auth/react";
import { Bell, Plus, Menu as MenuIcon } from "lucide-react";

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
// 👑 KING BLOGGERS - Mobile-First Navbar V3
// ============================================
// Mobile: Logo, Search, Bell, +Create, Hamburger
// Desktop: Full nav with all links
// Profile moved to menu on mobile
// ============================================

const LINKS = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Docs", href: "/docs" },
  { label: "Contact", href: "/contact" },
];

export function Navbar() {
  const [scrolled, setScrolled] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const { data: session, status } = useSession();
  const signedIn = status === "authenticated";
  const loading = status === "loading";

  // Scroll handler - only used for padding, not logo
  React.useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 24);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Poll for unread notifications
  React.useEffect(() => {
    if (!signedIn) return;

    const loadCount = () =>
      getUnreadCount()
        .then(setUnreadCount)
        .catch(() => 0);
    loadCount();
    const interval = setInterval(loadCount, 30000);
    return () => clearInterval(interval);
  }, [signedIn]);

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-40 glass-nav transition-all duration-300",
          scrolled ? "py-2" : "py-2.5 md:py-3"
        )}
      >
        <Container className="flex items-center justify-between gap-2">
          {/* Logo - Always full with text, bigger on mobile */}
          <Link href="/" className="flex items-center gap-1.5 flex-shrink-0">
            <Logo
              variant="full"
              size={32}
              className="scale-105 sm:scale-100 origin-left"
            />
          </Link>

          {/* Desktop Nav - Hidden on mobile */}
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

          {/* Right Actions - Optimized for mobile */}
          <div className="flex items-center gap-1 md:gap-2">
            {/* Theme Toggle - Hidden on mobile */}
            <div className="hidden md:block">
              <ThemeToggle />
            </div>

            {/* Global Search - Always visible */}
            <NavSearch />

            {/* Notification Bell */}
            {signedIn && (
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
                  <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] flex items-center justify-center rounded-full bg-king-orange text-[9px] font-bold text-white px-1">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </Link>
            )}

            {/* 👑 MOBILE: Quick Create "+" Button */}
            {signedIn && (
              <Link
                href="/blogger/editor"
                className={cn(
                  "md:hidden flex items-center justify-center w-9 h-9 rounded-full",
                  "bg-king-orange text-black",
                  "transition-all active:scale-95",
                  "shadow-lg shadow-king-orange/30"
                )}
                aria-label="Create Post"
              >
                <Plus className="w-5 h-5 stroke-[3]" />
              </Link>
            )}

            {/* Desktop Upload Button */}
            {signedIn && (
              <Link
                href="/blogger/editor"
                className={cn(
                  "hidden md:flex items-center gap-1.5 px-4 py-2 rounded-full",
                  "bg-king-orange text-black font-bold",
                  "transition-all active:scale-95",
                  "shadow-lg shadow-king-orange/30",
                  "text-sm"
                )}
                aria-label="Upload Blog"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Create</span>
              </Link>
            )}

            {/* Desktop Profile - Hidden on mobile (moved to menu) */}
            {loading ? (
              <div
                aria-label="Loading session"
                className="hidden md:block h-8 w-8 rounded-full border border-foreground/10 bg-foreground/5 animate-pulse"
              />
            ) : signedIn ? (
              <Link
                href="/profile"
                aria-label="Profile"
                className="hidden md:inline-flex items-center justify-center rounded-full border border-foreground/10 bg-foreground/5 p-0.5 active:scale-95 transition-all hover:bg-foreground/10"
              >
                <Avatar
                  src={session?.user?.image}
                  name={session?.user?.name}
                  alt={session?.user?.name ?? "Profile"}
                  size={28}
                />
              </Link>
            ) : (
              <GlassButton
                as="a"
                href="/register"
                variant="glass"
                className="hidden md:inline-flex px-3 py-1.5 text-xs"
              >
                Sign Up
              </GlassButton>
            )}

            {/* Not signed in - mobile Sign Up */}
            {!signedIn && !loading && (
              <GlassButton
                as="a"
                href="/register"
                variant="primary"
                className="md:hidden px-3 py-1.5 text-xs"
              >
                Sign Up
              </GlassButton>
            )}

            {/* 👑 HAMBURGER MENU - Mobile only */}
            <button
              type="button"
              aria-label="Open menu"
              onClick={() => setOpen(true)}
              className="md:hidden flex items-center justify-center w-9 h-9 rounded-lg border border-foreground/10 bg-foreground/5 active:scale-95 transition-all hover:bg-foreground/10"
            >
              <MenuIcon className="w-5 h-5" />
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
                { label: "Dashboard", href: "/blogger/dashboard" },
                { label: "Upload Blog", href: "/blogger/editor" },
                { label: "My Blogs", href: "/blogger/my-blogs" },
                { label: "Profile", href: "/profile" },
                { label: "Notifications", href: "/notifications" },
              ]
            : [{ label: "Sign Up", href: "/register" }]),
        ]}
      />
    </>
  );
}
