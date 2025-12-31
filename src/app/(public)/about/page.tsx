import Link from "next/link";

import { SectionHeader } from "@/components/features/SectionHeader";
import { Container } from "@/components/layout/Container";
import { GlassCard } from "@/components/ui/GlassCard";
import { Logo } from "@/components/ui/Logo";

export const metadata = {
  title: "About — King Bloggers",
  description:
    "Learn about King Bloggers: a sovereign Nigerian media platform for Tech, Art, Culture, Politics, Economics, and Religion.",
  openGraph: {
    title: "About — King Bloggers",
    description:
      "A sovereign Nigerian media platform for Tech, Art, Culture, Politics, Economics, and Religion.",
    images: ["/icons/og.png"],
  },
};

function StatBox({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center p-4">
      <div className="text-2xl md:text-3xl font-black text-king-orange">
        {value}
      </div>
      <div className="text-xs text-foreground/50 uppercase tracking-wide mt-1">
        {label}
      </div>
    </div>
  );
}

export default function AboutPage() {
  return (
    <main className="min-h-screen py-14">
      <Container>
        {/* Hero */}
        <GlassCard className="p-8 md:p-14 text-center mb-8">
          <div className="flex justify-center mb-6">
            <Logo size={56} variant="icon" />
          </div>
          <SectionHeader
            title="About King Bloggers"
            subtitle="A sovereign Nigerian-first media platform for Tech, Art & Culture, Entertainment, Politics, Economics, and Religion — built for speed, clarity, and mobile-first reading."
            centered
          />

          <div className="mt-10 flex flex-wrap justify-center gap-6 md:gap-12">
            <StatBox value="6" label="Categories" />
            <StatBox value="37" label="States Covered" />
            <StatBox value="774" label="Nigerian LGAs" />
            <StatBox value="PWA" label="Mobile-Ready" />
          </div>
        </GlassCard>

        {/* Mission & Vision */}
        <div className="grid gap-6 md:grid-cols-2 mb-8">
          <GlassCard className="p-6 md:p-8">
            <h3 className="text-lg font-black mb-3 flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-king-orange" />
              Our Mission
            </h3>
            <p className="text-foreground/70 leading-relaxed">
              To build Africa&apos;s most trusted media space — where readers
              discover authentic Nigerian voices and bloggers publish with
              clarity, authority, and zero distraction. We believe every
              Nigerian story deserves a world-class platform.
            </p>
          </GlassCard>

          <GlassCard className="p-6 md:p-8">
            <h3 className="text-lg font-black mb-3 flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-king-gold" />
              Our Vision
            </h3>
            <p className="text-foreground/70 leading-relaxed">
              A premium publishing ecosystem that elevates Nigerian storytelling
              to world-class standards — mobile-optimised, offline-capable, and
              designed for the sovereign reader. We&apos;re building the future
              of African digital media.
            </p>
          </GlassCard>
        </div>

        {/* Team Section */}
        <GlassCard className="p-8 md:p-10 mb-8">
          <h3 className="text-xl font-black mb-6">
            Built by Nigerians, for Nigerians
          </h3>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="text-center p-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-king-orange/20 flex items-center justify-center text-2xl mb-3">
                👨‍💻
              </div>
              <div className="font-bold">Engineering</div>
              <p className="text-sm text-foreground/60 mt-1">
                Lagos-based tech team building with Next.js, React, and edge
                computing
              </p>
            </div>
            <div className="text-center p-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-king-gold/20 flex items-center justify-center text-2xl mb-3">
                ✍️
              </div>
              <div className="font-bold">Editorial</div>
              <p className="text-sm text-foreground/60 mt-1">
                Curating quality content across Tech, Culture, Politics, and
                more
              </p>
            </div>
            <div className="text-center p-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-green-500/20 flex items-center justify-center text-2xl mb-3">
                🌍
              </div>
              <div className="font-bold">Community</div>
              <p className="text-sm text-foreground/60 mt-1">
                Growing a network of bloggers and readers across all 36 states +
                FCT
              </p>
            </div>
          </div>
        </GlassCard>

        {/* Features Grid */}
        <GlassCard className="p-8 md:p-10">
          <h3 className="text-xl font-black mb-6">Platform Highlights</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: "Liquid Glass UI",
                desc: "Apple-grade design with dark/light themes, buttery 60fps transitions.",
              },
              {
                title: "PWA Installable",
                desc: "Install on any device — works offline, feels native.",
              },
              {
                title: "Blogger Studio",
                desc: "Rich-text editor, cover uploads, category & geo-targeting.",
              },
              {
                title: "Nigerian LGA Data",
                desc: "Full coverage of 37 states & 774 local government areas.",
              },
              {
                title: "Auth & Security",
                desc: "Email + Google login with NextAuth v5 and secure JWT sessions.",
              },
              {
                title: "Lightning Fast",
                desc: "Next.js 15 App Router, edge-ready, streaming SSR for instant loads.",
              },
            ].map((f) => (
              <div
                key={f.title}
                className="rounded-xl border border-foreground/10 bg-foreground/5 p-5 hover:bg-foreground/10 transition-colors"
              >
                <div className="font-bold text-sm">{f.title}</div>
                <p className="mt-2 text-sm text-foreground/60">{f.desc}</p>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* CTA */}
        <div className="mt-10 text-center">
          <Link
            href="/blogger/editor"
            className="inline-flex items-center gap-2 rounded-full bg-king-orange px-8 py-3 text-sm font-bold uppercase tracking-widest text-white shadow-lg hover:opacity-90 transition-all active:scale-95"
          >
            Start Publishing
          </Link>
          <p className="mt-3 text-sm text-foreground/50">
            Join the sovereign network. Tell your story.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-4">
            <Link
              href="/contact"
              className="text-sm text-foreground/60 hover:text-king-orange transition-colors"
            >
              Contact Us
            </Link>
            <span className="text-foreground/30">•</span>
            <Link
              href="/privacy-policy"
              className="text-sm text-foreground/60 hover:text-king-orange transition-colors"
            >
              Privacy Policy
            </Link>
            <span className="text-foreground/30">•</span>
            <Link
              href="/docs"
              className="text-sm text-foreground/60 hover:text-king-orange transition-colors"
            >
              Documentation
            </Link>
          </div>
        </div>
      </Container>
    </main>
  );
}
