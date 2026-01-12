import type { Metadata } from "next";
import Link from "next/link";

import { SectionHeader } from "@/components/features/SectionHeader";
import { Container } from "@/components/layout/Container";
import { GlassCard } from "@/components/ui/GlassCard";
import { Logo } from "@/components/ui/Logo";

export const metadata: Metadata = {
  title: "Documentation — King Bloggers",
  description:
    "Complete documentation for King Bloggers: getting started, writing posts, account setup, PWA installation, and more.",
  openGraph: {
    title: "Documentation — King Bloggers",
    description: "Complete guide to using King Bloggers platform.",
    images: ["/icons/og.png"],
  },
};

function TOCLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className="block py-2 px-3 text-sm text-foreground/70 hover:text-king-orange hover:bg-foreground/5 rounded-lg transition-colors"
    >
      {children}
    </a>
  );
}

function DocSection({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="text-xl md:text-2xl font-black mb-4 pb-2 border-b border-foreground/10 flex items-center gap-3">
        <span className="inline-block w-3 h-3 rounded-full bg-king-orange" />
        {title}
      </h2>
      <div className="docs-content">{children}</div>
    </section>
  );
}

function CalloutBox({
  type,
  title,
  children,
}: {
  type: "info" | "warning" | "tip";
  title: string;
  children: React.ReactNode;
}) {
  const styles = {
    info: "docs-callout docs-callout-info",
    warning: "docs-callout docs-callout-warning",
    tip: "docs-callout docs-callout-tip",
  };
  const icons = { info: "ℹ️", warning: "⚠️", tip: "💡" };

  return (
    <div className={styles[type]}>
      <div className="font-bold mb-1">
        {icons[type]} {title}
      </div>
      <div className="text-sm">{children}</div>
    </div>
  );
}

export default function DocsPage() {
  return (
    <main className="min-h-screen py-14">
      <Container>
        {/* Hero */}
        <GlassCard className="p-8 md:p-12 text-center mb-10">
          <div className="flex justify-center mb-6">
            <Logo size={56} variant="icon" />
          </div>
          <SectionHeader
            title="Documentation"
            subtitle="Everything you need to know about King Bloggers — from getting started to advanced publishing features."
            centered
          />
        </GlassCard>

        <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
          {/* Sidebar TOC */}
          <aside className="hidden lg:block">
            <div className="sticky top-24">
              <GlassCard className="p-4">
                <div className="text-xs font-mono text-foreground/50 mb-3 px-3">
                  TABLE OF CONTENTS
                </div>
                <nav className="space-y-1">
                  <TOCLink href="#getting-started">Getting Started</TOCLink>
                  <TOCLink href="#create-account">Creating Your Account</TOCLink>
                  <TOCLink href="#writing-posts">Writing & Publishing Posts</TOCLink>
                  <TOCLink href="#categories">Categories Explained</TOCLink>
                  <TOCLink href="#blogger-dashboard">Blogger Dashboard</TOCLink>
                  <TOCLink href="#pwa-install">Installing the PWA</TOCLink>
                  <TOCLink href="#themes">Light & Dark Themes</TOCLink>
                  <TOCLink href="#geo-targeting">Geo-Targeting (States & LGAs)</TOCLink>
                  <TOCLink href="#community">Community Guidelines</TOCLink>
                  <TOCLink href="#faq">FAQ</TOCLink>
                  <TOCLink href="#support">Support & Contact</TOCLink>
                </nav>
              </GlassCard>
            </div>
          </aside>

          {/* Main Content */}
          <div className="space-y-12">
            <GlassCard className="p-6 md:p-10">
              <DocSection id="getting-started" title="Getting Started">
                <p>
                  Welcome to <strong>King Bloggers</strong> — a sovereign Nigerian media platform built for speed, clarity, and mobile-first reading. Whether you&apos;re a reader discovering fresh content or a blogger publishing your voice, this guide will help you get the most out of the platform.
                </p>
                <h3 className="text-lg font-bold mt-6 mb-2">Quick Start for Readers</h3>
                <ol className="list-decimal pl-5 space-y-2">
                  <li>Browse the homepage or category feeds (Tech, Art & Culture, Entertainment, Politics, Economics, Religion)</li>
                  <li>Click any post card to read the full article</li>
                  <li>Use the theme toggle (☀️/🌙) to switch between light and dark modes</li>
                  <li>Install the PWA for an app-like experience</li>
                </ol>

                <h3 className="text-lg font-bold mt-6 mb-2">Quick Start for Bloggers</h3>
                <ol className="list-decimal pl-5 space-y-2">
                  <li>Create an account at <Link href="/register" className="text-king-orange underline">/register</Link></li>
                  <li>Log in and access your <strong>Blogger Studio</strong></li>
                  <li>Write, edit, and publish posts with the rich-text editor</li>
                  <li>Track your stats on the Dashboard</li>
                </ol>
              </DocSection>
            </GlassCard>

            <GlassCard className="p-6 md:p-10">
              <DocSection id="create-account" title="Creating Your Account">
                <p>
                  To publish on King Bloggers, you need a blogger account. Registration is simple and secure.
                </p>
                <h3 className="text-lg font-bold mt-6 mb-2">Registration Steps</h3>
                <ol className="list-decimal pl-5 space-y-2">
                  <li>Go to <Link href="/register" className="text-king-orange underline">/register</Link></li>
                  <li>Enter your <strong>full name</strong>, <strong>email</strong>, <strong>phone number</strong>, and create a <strong>password</strong></li>
                  <li>Select your <strong>State</strong> and <strong>LGA</strong> from the dropdown (we support all 774 Nigerian LGAs)</li>
                  <li>Click <strong>&ldquo;Create Account&rdquo;</strong></li>
                  <li>You&apos;ll be redirected to the login page — sign in with your new credentials</li>
                </ol>
                <CalloutBox type="tip" title="Pro Tip">
                  Use a strong password with at least 8 characters including numbers and symbols.
                </CalloutBox>
              </DocSection>
            </GlassCard>

            <GlassCard className="p-6 md:p-10">
              <DocSection id="writing-posts" title="Writing & Publishing Posts">
                <p>
                  The Blogger Studio includes a powerful rich-text editor for creating beautiful posts.
                </p>
                <h3 className="text-lg font-bold mt-6 mb-2">Creating a New Post</h3>
                <ol className="list-decimal pl-5 space-y-2">
                  <li>Navigate to <strong>Blogger Studio → Editor</strong> (or click &ldquo;Open Studio&rdquo; from the navbar)</li>
                  <li>Enter your <strong>Title</strong></li>
                  <li>Select a <strong>Category</strong> (Tech, Art & Culture, Entertainment, Politics, Economics, or Religion)</li>
                  <li>Upload a <strong>Cover Image</strong> (recommended: 1200×630px for best social sharing)</li>
                  <li>Write your content using the rich-text toolbar (bold, italic, headings, lists, links, code, etc.)</li>
                  <li>Click <strong>&ldquo;Save Draft&rdquo;</strong> to save without publishing, or <strong>&ldquo;Publish&rdquo;</strong> to go live</li>
                </ol>
                <CalloutBox type="info" title="Cover Images">
                  High-quality cover images make your posts stand out. Use landscape images for best results on cards and social shares.
                </CalloutBox>
              </DocSection>
            </GlassCard>

            <GlassCard className="p-6 md:p-10">
              <DocSection id="categories" title="Categories Explained">
                <p>
                  King Bloggers organizes content into six sovereign categories:
                </p>
                <div className="grid gap-4 sm:grid-cols-2 mt-6">
                  {[
                    { name: "Tech", desc: "Technology, startups, software, gadgets, and digital innovation." },
                    { name: "Art & Culture", desc: "Visual arts, music, literature, fashion, and cultural movements." },
                    { name: "Entertainment", desc: "Film, TV, celebrity news, events, and pop culture." },
                    { name: "Politics", desc: "Governance, policy, elections, and political analysis." },
                    { name: "Economics", desc: "Finance, business, markets, and economic trends." },
                    { name: "Religion", desc: "Faith, spirituality, religious events, and interfaith dialogue." },
                  ].map((cat) => (
                    <div key={cat.name} className="rounded-xl border border-foreground/10 bg-foreground/5 p-4">
                      <div className="font-bold">{cat.name}</div>
                      <p className="text-sm text-foreground/60 mt-1">{cat.desc}</p>
                    </div>
                  ))}
                </div>
              </DocSection>
            </GlassCard>

            <GlassCard className="p-6 md:p-10">
              <DocSection id="blogger-dashboard" title="Blogger Dashboard">
                <p>
                  Your Dashboard provides real-time analytics and management tools for your blogging activity.
                </p>
                <h3 className="text-lg font-bold mt-6 mb-2">Dashboard Features</h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li><strong>Total Posts:</strong> Count of all posts you&apos;ve created</li>
                  <li><strong>Published:</strong> Number of live, published posts</li>
                  <li><strong>Comments:</strong> Total comments received on your posts</li>
                  <li><strong>Activity Chart:</strong> 10-day publishing trend visualization</li>
                  <li><strong>Quick Actions:</strong> Access to Editor, Posts list, and Settings</li>
                </ul>
              </DocSection>
            </GlassCard>

            <GlassCard className="p-6 md:p-10">
              <DocSection id="pwa-install" title="Installing the PWA">
                <p>
                  King Bloggers is a <strong>Progressive Web App (PWA)</strong> — you can install it on your device for an app-like experience with offline support.
                </p>
                <h3 className="text-lg font-bold mt-6 mb-2">Installation on Android / Chrome</h3>
                <ol className="list-decimal pl-5 space-y-2">
                  <li>Visit the site in Chrome or Edge</li>
                  <li>Look for the <strong>&ldquo;Install App&rdquo;</strong> prompt at the bottom of the screen</li>
                  <li>Click <strong>&ldquo;Install App&rdquo;</strong> and confirm</li>
                  <li>The app will be added to your home screen</li>
                </ol>
                <h3 className="text-lg font-bold mt-6 mb-2">Installation on iOS (iPhone/iPad)</h3>
                <ol className="list-decimal pl-5 space-y-2">
                  <li>Open the site in Safari</li>
                  <li>Tap the <strong>Share</strong> button (square with arrow)</li>
                  <li>Scroll down and tap <strong>&ldquo;Add to Home Screen&rdquo;</strong></li>
                  <li>Confirm by tapping <strong>&ldquo;Add&rdquo;</strong></li>
                </ol>
                <CalloutBox type="tip" title="Offline Support">
                  Once installed, the PWA caches key assets so you can browse previously loaded pages even without internet.
                </CalloutBox>
              </DocSection>
            </GlassCard>

            <GlassCard className="p-6 md:p-10">
              <DocSection id="themes" title="Light & Dark Themes">
                <p>
                  King Bloggers supports both <strong>Light</strong> and <strong>Dark</strong> modes for comfortable reading in any environment.
                </p>
                <ul className="list-disc pl-5 space-y-2 mt-4">
                  <li>Click the <strong>☀️/🌙</strong> toggle in the navbar to switch themes</li>
                  <li>By default, the theme follows your system preference</li>
                  <li>Your preference is saved locally</li>
                </ul>
              </DocSection>
            </GlassCard>

            <GlassCard className="p-6 md:p-10">
              <DocSection id="geo-targeting" title="Geo-Targeting (States & LGAs)">
                <p>
                  King Bloggers captures your Nigerian <strong>State</strong> and <strong>Local Government Area (LGA)</strong> during registration. This enables:
                </p>
                <ul className="list-disc pl-5 space-y-2 mt-4">
                  <li>Location-aware content recommendations (coming soon)</li>
                  <li>Regional analytics for bloggers</li>
                  <li>Community features based on geography</li>
                </ul>
                <p className="mt-4">
                  We support all <strong>37 states</strong> and <strong>774 LGAs</strong> in Nigeria.
                </p>
              </DocSection>
            </GlassCard>

            <GlassCard className="p-6 md:p-10">
              <DocSection id="community" title="Community Guidelines">
                <p>
                  King Bloggers is a space for respectful, authentic Nigerian voices. We expect all users to:
                </p>
                <ul className="list-disc pl-5 space-y-2 mt-4">
                  <li>Publish original, truthful content</li>
                  <li>Respect intellectual property and credit sources</li>
                  <li>Avoid hate speech, harassment, or discrimination</li>
                  <li>Refrain from spam, misleading content, or scams</li>
                  <li>Engage constructively in comments</li>
                </ul>
                <CalloutBox type="warning" title="Content Moderation">
                  Posts or accounts violating these guidelines may be removed without notice.
                </CalloutBox>
              </DocSection>
            </GlassCard>

            <GlassCard className="p-6 md:p-10">
              <DocSection id="faq" title="Frequently Asked Questions">
                <div className="space-y-6">
                  <div>
                    <h3 className="font-bold">Is King Bloggers free to use?</h3>
                    <p className="text-foreground/70 mt-1">
                      Yes! Reading and publishing are completely free. Premium features may be added in the future.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-bold">Can I edit or delete my posts?</h3>
                    <p className="text-foreground/70 mt-1">
                      Yes. From your Blogger Studio, go to &ldquo;My Posts&rdquo; to edit or delete any of your content.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-bold">How do I change my password?</h3>
                    <p className="text-foreground/70 mt-1">
                      Visit Settings in your Blogger Studio to update your password and profile details.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-bold">Can I upload videos?</h3>
                    <p className="text-foreground/70 mt-1">
                      Currently, King Bloggers supports images. Video embedding (YouTube, etc.) may be added in future updates.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-bold">Is my data secure?</h3>
                    <p className="text-foreground/70 mt-1">
                      We use industry-standard encryption and secure authentication. See our <Link href="/privacy-policy" className="text-king-orange underline">Privacy Policy</Link> for details.
                    </p>
                  </div>
                </div>
              </DocSection>
            </GlassCard>

            <GlassCard className="p-6 md:p-10">
              <DocSection id="support" title="Support & Contact">
                <p>
                  Need help? We&apos;re here for you.
                </p>
                <div className="grid gap-4 sm:grid-cols-2 mt-6">
                  <div className="rounded-xl border border-foreground/10 bg-foreground/5 p-5">
                    <div className="font-bold">📧 Email</div>
                    <a href="mailto:hello@kingbloggers.com" className="text-king-orange underline text-sm">
                      hello@kingbloggers.com
                    </a>
                  </div>
                  <div className="rounded-xl border border-foreground/10 bg-foreground/5 p-5">
                    <div className="font-bold">💬 WhatsApp</div>
                    <a href="https://wa.me/2349036826272" className="text-king-orange underline text-sm">
                      +234 903 682 6272
                    </a>
                  </div>
                </div>
                <p className="mt-6">
                  Visit our <Link href="/contact" className="text-king-orange underline">Contact page</Link> for more ways to reach us.
                </p>
              </DocSection>
            </GlassCard>

            {/* Footer CTA */}
            <div className="text-center py-8">
              <Link
                href="/bloggers/editor"
                className="inline-flex items-center gap-2 rounded-full bg-king-orange px-8 py-3 text-sm font-bold uppercase tracking-widest text-white shadow-lg hover:opacity-90 transition-all active:scale-95"
              >
                Start Publishing Now →
              </Link>
            </div>
          </div>
        </div>
      </Container>
    </main>
  );
}
