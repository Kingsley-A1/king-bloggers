📜 The King's Code: Development Manifesto

To the Architect / AI Companion:
You are entering the codebase of King Bloggers. We are not building a simple website; we are constructing a Sovereign Digital State. Every line of code must radiate power, precision, and permanence.

Read this before writing a single line.

1. The Prime Directive: "Sovereignty & Speed"

Our mission is to empower the Creator (Blogger) with a seamless broadcast studio and the Subject (Reader) with a distraction-free intelligence feed.

The Standard: If it lags, it is weak. If it flickers, it is broken. We build for 60fps interactions and <100ms server responses.

The Vibe: High-End Tech Meets Cultural Authority. Think "Apple Design" mixed with "Editorial Brutalism."

2. The Visual Constitution: "Liquid Glass"

We do not use flat colors. We build with light, depth, and glass.

Rule #1: The Obsidian Void. The background is never pure #000. It is a layered composition of #050505 (King's Black) and subtle radial meshes.

Rule #2: Glass Physics. Cards and overlays must use backdrop-filter: blur(20px) + a 1px border (white/10) + a subtle inner shadow to mimic physical glass.

Rule #3: The Royal Accents. * King's Orange (#FF8C00): ONLY for primary actions (Publish, Subscribe, Active State).

Sovereign Gold (#D4AF37): ONLY for badges, awards, and premium markers.

Rule #4: Haptic Motion. Buttons are not static. They scale (scale-95) on press. Transitions use our custom easing cubic-bezier(0.4, 0, 0.2, 1) (The Apple Ease).

3. Engineering Principles (The "Edge-First" Law)

A. Strict Type Safety

No any. We use TypeScript to prevent runtime errors.

Schema First. The Database Schema (src/db/schema.ts) is the source of truth. We do not guess data structures; we define them in Drizzle.

Validation. All inputs (Registration, Editor) must be validated with Zod before touching the backend.

B. The Sovereign Architecture

Server Actions over API Routes. We use Next.js Server Actions for mutations (Create Post, Update Profile) to keep the client bundle small.

Edge over Node. Whenever possible, deploy logic to the Edge (Vercel Edge Functions) for global speed.

Zero-Egress Media. We never store images in the database (Base64 is forbidden). Images go to Cloudflare R2; the DB only stores the URL string.

C. Mobile-First Authority

The Thumb Zone. Navigation and primary actions must be reachable with a thumb on a mobile device.

Touch Targets. No button is smaller than 44x44px.

PWA Standard. The app must work offline. If the user loses signal, they should still be able to read cached articles.

4. The Component Philosophy (Atomic Design)

We build reusable, isolated components. We do not copy-paste code.

Atoms: GlassButton, Input, Badge. (Dumb, styling only).

Molecules: PostCard, SearchBar, AuthorChip. (Simple logic).

Organisms: Navbar, SovereignEditor, AnalyticsChart. (Complex state).

Templates: DashboardLayout, BlogLayout.

5. The "Don't Make Me Think" UX

For Bloggers: The "Studio" must hide complexity. No complex settings menus. Just "Write" and "Publish." The WYSIWYG editor shows exactly what the reader sees.

For Readers: Content is King. The UI slides away (Scroll-Collapse Headers) when reading.

6. Commit Standards

When committing code or asking the AI to generate features:

Be Atomic: One feature per file/commit.

Be Clean: Remove console.log before production.

Be Documented: Complex logic (like the R2 upload flow) requires comments explaining why, not just how.

By adhering to this code, we ensure that King Bloggers remains a platform of excellence, durability, and prestige.