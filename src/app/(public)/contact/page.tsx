import Link from "next/link";

import { SectionHeader } from "@/components/features/SectionHeader";
import { Container } from "@/components/layout/Container";
import { GlassCard } from "@/components/ui/GlassCard";
import { Logo } from "@/components/ui/Logo";

export const metadata = {
  title: "Contact — King Bloggers",
  description:
    "Get in touch with King Bloggers for partnerships, support, and publishing inquiries.",
  openGraph: {
    title: "Contact — King Bloggers",
    description: "Reach us for partnerships, support, advertising, and publishing inquiries.",
    images: ["/icons/og.png"],
  },
};

function ContactCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <GlassCard className="p-6 md:p-8">
      <div className="text-xs font-mono text-foreground/50 mb-4">{title}</div>
      {children}
    </GlassCard>
  );
}

function SocialIcon({ d }: { d: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d={d} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function ContactPage() {
  return (
    <main className="min-h-screen py-14">
      <Container>
        {/* Header */}
        <GlassCard className="p-8 md:p-12 text-center mb-8">
          <div className="flex justify-center mb-6">
            <Logo size={48} variant="icon" />
          </div>
          <SectionHeader
            title="Get in Touch"
            subtitle="Reach King Bloggers for partnerships, support, advertising, and publishing inquiries. We respond within 24 hours."
            centered
          />
        </GlassCard>

        {/* Contact Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <ContactCard title="Phone & WhatsApp">
            <div className="space-y-3">
              <a
                href="tel:09036826272"
                className="flex items-center gap-3 text-lg font-black hover:text-king-orange transition-colors"
              >
                <span className="text-foreground/50">📞</span>
                09036826272
              </a>
              <a
                href="https://wa.me/2349036826272"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 text-foreground/70 hover:text-king-orange transition-colors"
              >
                <span className="text-foreground/50">💬</span>
                WhatsApp: 09036826272
              </a>
            </div>
          </ContactCard>

          <ContactCard title="Email">
            <div className="space-y-3">
              <a
                href="mailto:hello@kingbloggers.com"
                className="flex items-center gap-3 text-lg font-black hover:text-king-orange transition-colors break-all"
              >
                <span className="text-foreground/50">✉️</span>
                hello@kingbloggers.com
              </a>
              <p className="text-sm text-foreground/50">
                For partnerships and business inquiries.
              </p>
            </div>
          </ContactCard>

          <ContactCard title="Location">
            <div className="space-y-2 text-foreground/70">
              <p className="font-bold">🇳🇬 Nigeria</p>
              <p className="text-sm text-foreground/50">
                Headquartered in Lagos, serving readers and bloggers nationwide across all 774 LGAs.
              </p>
            </div>
          </ContactCard>
        </div>

        {/* Socials */}
        <GlassCard className="p-8 md:p-10 mt-8">
          <div className="text-center">
            <h3 className="text-lg font-black mb-2">Follow Us</h3>
            <p className="text-sm text-foreground/60 mb-6">Stay connected on social media</p>
            <div className="flex flex-wrap justify-center gap-3">
              {[
                { href: "https://instagram.com/king_bloggers", label: "Instagram", icon: "M7 7h10v10H7z M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2 M16 11.5a4 4 0 1 1-8 0 4 4 0 0 1 8 0" },
                { href: "https://facebook.com/king_bloggers", label: "Facebook", icon: "M14 9h3V6h-3a4 4 0 0 0-4 4v3H7v3h3v5h3v-5h3l1-3h-4v-3a1 1 0 0 1 1-1Z" },
                { href: "https://x.com/king_bloggers", label: "X (Twitter)", icon: "M4 4l16 16 M20 4L4 20" },
                { href: "https://tiktok.com/@king_bloggers", label: "TikTok", icon: "M14 3v10a4 4 0 1 1-4-4" },
              ].map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={s.label}
                  className="inline-flex items-center gap-2 rounded-full border border-foreground/10 bg-foreground/5 px-4 py-2 text-xs font-bold uppercase tracking-widest text-foreground/70 hover:bg-foreground/10 hover:text-foreground transition-colors"
                >
                  <SocialIcon d={s.icon} />
                  {s.label}
                </a>
              ))}
            </div>
          </div>
        </GlassCard>

        {/* FAQ CTA */}
        <div className="mt-10 text-center">
          <p className="text-foreground/60 mb-4">
            Have questions about publishing or using the platform?
          </p>
          <Link
            href="/docs"
            className="inline-flex items-center gap-2 rounded-full bg-foreground/5 border border-foreground/10 px-6 py-3 text-sm font-bold uppercase tracking-widest text-foreground/80 hover:bg-foreground/10 transition-all active:scale-95"
          >
            View Documentation →
          </Link>
          <div className="mt-6 flex flex-wrap justify-center gap-4">
            <Link href="/about" className="text-sm text-foreground/60 hover:text-king-orange transition-colors">About Us</Link>
            <span className="text-foreground/30">•</span>
            <Link href="/privacy-policy" className="text-sm text-foreground/60 hover:text-king-orange transition-colors">Privacy Policy</Link>
            <span className="text-foreground/30">•</span>
            <Link href="/register" className="text-sm text-foreground/60 hover:text-king-orange transition-colors">Join as Blogger</Link>
          </div>
        </div>
      </Container>
    </main>
  );
}
