import { SectionHeader } from "@/components/features/SectionHeader";
import { Container } from "@/components/layout/Container";
import { GlassCard } from "@/components/ui/GlassCard";
import { Logo } from "@/components/ui/Logo";

export const metadata = {
  title: "About — King Bloggers",
  description:
    "Learn about King Bloggers: a sovereign Nigerian media platform for Tech, Art, Culture, Politics, Economics, and Religion.",
};

function StatBox({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center p-4">
      <div className="text-2xl md:text-3xl font-black text-king-orange">{value}</div>
      <div className="text-xs text-foreground/50 uppercase tracking-wide mt-1">{label}</div>
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
              To build Africa&apos;s most trusted media space — where readers discover authentic Nigerian voices and bloggers publish with clarity, authority, and zero distraction.
            </p>
          </GlassCard>

          <GlassCard className="p-6 md:p-8">
            <h3 className="text-lg font-black mb-3 flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-king-gold" />
              Our Vision
            </h3>
            <p className="text-foreground/70 leading-relaxed">
              A premium publishing ecosystem that elevates Nigerian storytelling to world-class standards — mobile-optimised, offline-capable, and designed for the sovereign reader.
            </p>
          </GlassCard>
        </div>

        {/* Features Grid */}
        <GlassCard className="p-8 md:p-10">
          <h3 className="text-xl font-black mb-6">Platform Highlights</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { title: "Liquid Glass UI", desc: "Apple-grade design with dark/light themes, buttery 60fps transitions." },
              { title: "PWA Installable", desc: "Install on any device — works offline, feels native." },
              { title: "Blogger Studio", desc: "Rich-text editor, cover uploads, category & geo-targeting." },
              { title: "Nigerian LGA Data", desc: "Full coverage of 37 states & 774 local government areas." },
              { title: "Auth & Security", desc: "Email-based registration with NextAuth v5 and secure sessions." },
              { title: "Lightning Fast", desc: "Next.js 15 App Router, edge-ready, streaming SSR." },
            ].map((f) => (
              <div key={f.title} className="rounded-xl border border-foreground/10 bg-foreground/5 p-5">
                <div className="font-bold text-sm">{f.title}</div>
                <p className="mt-2 text-sm text-foreground/60">{f.desc}</p>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* CTA */}
        <div className="mt-10 text-center">
          <a
            href="/blogger/editor"
            className="inline-flex items-center gap-2 rounded-full bg-king-orange px-8 py-3 text-sm font-bold uppercase tracking-widest text-white shadow-lg hover:opacity-90 transition-all active:scale-95"
          >
            Start Publishing
          </a>
          <p className="mt-3 text-sm text-foreground/50">
            Join the sovereign network. Tell your story.
          </p>
        </div>
      </Container>
    </main>
  );
}
