import Link from "next/link";
import * as React from "react";

import { Container } from "./Container";
import { Logo } from "../ui/Logo";

function SocialLink({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={label}
      className="inline-flex items-center justify-center rounded-2xl border border-foreground/10 bg-foreground/5 p-3 text-foreground/70 hover:bg-foreground/10 hover:text-foreground transition-colors"
    >
      {children}
    </a>
  );
}

function Icon({ d }: { d: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d={d} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-16 border-t border-foreground/10 bg-background/60">
      <Container className="py-12">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-10">
          <div className="space-y-4">
            <Logo />
            <p className="max-w-md text-sm text-foreground/60">
              A sovereign feed for Tech, Art, Culture, and Power.
            </p>
            <div className="flex items-center gap-3">
              <SocialLink href="https://instagram.com/king_bloggers" label="Instagram">
                <Icon d="M7 7h10v10H7z M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2 M16 11.5a4 4 0 1 1-8 0 4 4 0 0 1 8 0" />
              </SocialLink>
              <SocialLink href="https://facebook.com/king_bloggers" label="Facebook">
                <Icon d="M14 9h3V6h-3a4 4 0 0 0-4 4v3H7v3h3v5h3v-5h3l1-3h-4v-3a1 1 0 0 1 1-1Z" />
              </SocialLink>
              <SocialLink href="https://x.com/king_bloggers" label="X">
                <Icon d="M4 4l16 16 M20 4L4 20" />
              </SocialLink>
              <SocialLink href="https://tiktok.com/@king_bloggers" label="TikTok">
                <Icon d="M14 3v10a4 4 0 1 1-4-4" />
              </SocialLink>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-10">
            <div className="space-y-3">
              <div className="text-xs font-mono text-foreground/50">Pages</div>
              <div className="space-y-2 text-sm">
                <Link className="block text-foreground/70 hover:text-foreground" href="/about">
                  About
                </Link>
                <Link className="block text-foreground/70 hover:text-foreground" href="/docs">
                  Documentation
                </Link>
                <Link className="block text-foreground/70 hover:text-foreground" href="/contact">
                  Contact
                </Link>
                <Link className="block text-foreground/70 hover:text-foreground" href="/privacy-policy">
                  Privacy Policy
                </Link>
              </div>
            </div>

            <div className="space-y-3">
              <div className="text-xs font-mono text-foreground/50">Socials</div>
              <div className="space-y-2 text-sm text-foreground/70">
                <div>IG / FB / X / TikTok: @king_bloggers</div>
                <div className="text-foreground/50">© {year} King Bloggers</div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </footer>
  );
}
