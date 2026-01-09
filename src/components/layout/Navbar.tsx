"use client";

import Link from "next/link";
import * as React from "react";
import { UserRound } from "lucide-react";
import { useSession } from "next-auth/react";

import { cn } from "../../lib/utils";
import { GlassButton } from "../ui/GlassButton";
import { Logo } from "../ui/Logo";
import { Container } from "./Container";
import { MobileMenu } from "./MobileMenu";
import { ThemeToggle } from "../features/ThemeToggle";
import { NotificationBell } from "../features/NotificationBell";

const LINKS = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Docs", href: "/docs" },
  { label: "Contact", href: "/contact" },
];

export function Navbar() {
  const [compact, setCompact] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const { status } = useSession();
  const signedIn = status === "authenticated";

  const authHref = signedIn ? "/profile" : "/register";

  React.useEffect(() => {
    function onScroll() {
      setCompact(window.scrollY > 24);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-40 glass-nav transition-all duration-300",
          compact ? "py-2" : "py-4"
        )}
      >
        <Container className="flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3">
            <Logo variant="full" size={compact ? 32 : 36} />
          </Link>

          <nav className="hidden md:flex items-center gap-2">
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

          <div className="flex items-center gap-2">
            <ThemeToggle />
            {signedIn && <NotificationBell />}
            {signedIn ? (
              <Link
                href="/profile"
                aria-label="Profile"
                className="inline-flex items-center gap-2 rounded-xl border border-foreground/10 bg-foreground/5 px-3 py-2 text-foreground/80 active:scale-95 transition-all hover:bg-foreground/10"
              >
                <UserRound className="h-4 w-4" />
              </Link>
            ) : (
              <GlassButton
                as="a"
                href="/register"
                variant="glass"
                className="px-4"
              >
                Login
              </GlassButton>
            )}
            <div className="hidden md:block">
              <GlassButton as="a" href="/blogger/editor" variant="primary">
                Open Studio
              </GlassButton>
            </div>
            <button
              type="button"
              aria-label="Open menu"
              onClick={() => setOpen(true)}
              className="md:hidden rounded-xl border border-foreground/10 bg-foreground/5 px-4 py-2 text-xs font-bold uppercase tracking-widest text-foreground/80 active:scale-95 transition-all hover:bg-foreground/10"
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
          { label: signedIn ? "Profile" : "Login", href: authHref },
          { label: "Open Studio", href: "/blogger/editor" },
        ]}
      />
    </>
  );
}
