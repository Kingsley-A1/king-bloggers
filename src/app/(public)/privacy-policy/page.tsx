import { SectionHeader } from "@/components/features/SectionHeader";
import { Container } from "@/components/layout/Container";
import { GlassCard } from "@/components/ui/GlassCard";

export const metadata = {
  title: "Privacy Policy — King Bloggers",
  description:
    "King Bloggers privacy policy: how we collect, use, and protect your data.",
};

const LAST_UPDATED = "January 2025";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-foreground/10 bg-foreground/5 p-6 md:p-8">
      <h2 className="text-lg font-black mb-3 flex items-center gap-2">
        <span className="inline-block w-2 h-2 rounded-full bg-king-orange" />
        {title}
      </h2>
      <div className="text-foreground/70 space-y-3 text-sm md:text-base leading-relaxed">
        {children}
      </div>
    </section>
  );
}

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen py-14">
      <Container>
        <GlassCard className="p-8 md:p-12 mb-8">
          <SectionHeader
            title="Privacy Policy"
            subtitle="Your privacy matters. This policy explains how King Bloggers collects, uses, and protects your information."
            centered
          />
          <p className="text-center text-sm text-foreground/50 mt-4">
            Last updated: {LAST_UPDATED}
          </p>
        </GlassCard>

        <div className="space-y-6">
          <Section title="1. Information We Collect">
            <p>
              <strong>Account Information:</strong> When you register, we collect your name, email address, phone number, and location (state & LGA) to create and manage your account.
            </p>
            <p>
              <strong>Content:</strong> Posts, comments, and media you submit through the platform are stored on our servers.
            </p>
            <p>
              <strong>Usage Data:</strong> We may collect anonymized analytics about how you use the platform (pages visited, time spent, etc.) to improve our services.
            </p>
          </Section>

          <Section title="2. How We Use Your Information">
            <ul className="list-disc pl-5 space-y-2">
              <li>Provide and maintain the King Bloggers platform</li>
              <li>Authenticate your identity and secure your account</li>
              <li>Enable publishing, reading, and community features</li>
              <li>Send important service updates and notifications</li>
              <li>Improve the platform based on aggregated usage patterns</li>
              <li>Geo-target content for relevant local experiences</li>
            </ul>
          </Section>

          <Section title="3. Data Sharing">
            <p>
              We do <strong>not</strong> sell your personal data. We may share limited information with:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Service providers (hosting, analytics) who assist in operating the platform under strict confidentiality</li>
              <li>Legal authorities if required by law or to protect our rights</li>
            </ul>
          </Section>

          <Section title="4. Data Security">
            <p>
              We implement industry-standard security measures including encrypted connections (HTTPS), secure authentication (NextAuth), and regular security audits. However, no method of transmission over the internet is 100% secure.
            </p>
          </Section>

          <Section title="5. Cookies & Local Storage">
            <p>
              King Bloggers uses cookies and local storage to:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Keep you logged in (session cookies)</li>
              <li>Remember your theme preference (dark/light mode)</li>
              <li>Enable PWA functionality (offline access)</li>
            </ul>
          </Section>

          <Section title="6. Your Rights">
            <p>You have the right to:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Access your personal data</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your account and associated data</li>
              <li>Withdraw consent for optional data processing</li>
            </ul>
            <p>
              To exercise these rights, contact us via our <a href="/contact" className="text-king-orange underline underline-offset-2">contact page</a>.
            </p>
          </Section>

          <Section title="7. Children&apos;s Privacy">
            <p>
              King Bloggers is not intended for users under 13 years of age. We do not knowingly collect personal information from children.
            </p>
          </Section>

          <Section title="8. Changes to This Policy">
            <p>
              We may update this privacy policy from time to time. Changes will be posted on this page with an updated revision date. Continued use of the platform after changes constitutes acceptance of the revised policy.
            </p>
          </Section>

          <Section title="9. Contact Us">
            <p>
              If you have any questions about this privacy policy, please reach out:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Email: <a href="mailto:hello@kingbloggers.com" className="text-king-orange underline underline-offset-2">hello@kingbloggers.com</a></li>
              <li>Phone/WhatsApp: <a href="tel:09036826272" className="text-king-orange underline underline-offset-2">09036826272</a></li>
              <li>Visit our <a href="/contact" className="text-king-orange underline underline-offset-2">Contact page</a></li>
            </ul>
          </Section>
        </div>

        <div className="mt-10 text-center text-sm text-foreground/50">
          © {new Date().getFullYear()} King Bloggers. All rights reserved.
        </div>
      </Container>
    </main>
  );
}
