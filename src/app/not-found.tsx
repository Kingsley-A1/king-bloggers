import Link from "next/link";

import { Container } from "@/components/layout/Container";
import { GlassButton } from "@/components/ui/GlassButton";
import { GlassCard } from "@/components/ui/GlassCard";
import { Logo } from "@/components/ui/Logo";

export default function NotFound() {
  return (
    <main className="min-h-[70vh] flex items-center">
      <Container className="w-full py-16">
        <div className="mx-auto w-full max-w-2xl">
          <GlassCard className="p-6 md:p-10">
            <div className="flex items-center gap-4">
              <Logo size={44} />
              <div className="min-w-0">
                <div className="text-xs font-mono text-foreground/50">404</div>
                <h1 className="mt-1 text-2xl md:text-3xl font-black tracking-tight">
                  Page not found
                </h1>
                <p className="mt-2 text-sm text-foreground/60">
                  The page you’re looking for doesn’t exist, was moved, or needs
                  a different link.
                </p>
              </div>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <GlassButton as="a" href="/" variant="primary">
                Go Home
              </GlassButton>
              <GlassButton as="a" href="/about" variant="glass">
                About King Bloggers
              </GlassButton>
              <GlassButton as="a" href="/blogger/editor" variant="glass">
                Open Studio
              </GlassButton>
              <GlassButton as="a" href="/profile" variant="glass">
                Go to Profile
              </GlassButton>
              <GlassButton as="a" href="/login" variant="ghost">
                Login
              </GlassButton>
              <Link
                href="/docs"
                className="rounded-full px-4 py-2 text-center text-xs font-bold uppercase tracking-widest text-foreground/70 hover:text-foreground hover:bg-foreground/5 transition-colors"
              >
                Read Docs
              </Link>
            </div>
          </GlassCard>
        </div>
      </Container>
    </main>
  );
}
