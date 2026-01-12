👑 King Bloggers: Execution Checklist (High Priority)

This is the build plan that turns the current HTML prototypes into a real Next.js 15 + CockroachDB + Drizzle + Auth.js + Cloudflare R2 product.

Reference prototypes:

- Reader experience: `index.html`
- Blogger Studio experience: `bloggers.html`

Non‑negotiables (Definition of Done for every feature)

- No mock data for core flows: Auth, publish, fetch feed, comments, uploads must hit real persistence.
- Liquid Glass rules: Obsidian Deep base, glass blur(20px), 1px white/10 border, orange only for primary actions.
- Speed: no layout shifts, no flicker, tight client bundles.

---

P0 — Foundation (must ship first)

P0.1 Project boots and routes render

- Create the Next.js App Router structure under `src/` (per `project-structure.md`).
- Wire Tailwind + globals so the mesh background + glass tokens match `global.css` + `tailwind.config.ts`.
- Done when: `npm run dev` renders a home route and a studio route without console errors.

P0.2 Environment + secrets contract

- Establish `.env.local` keys (local) and `.env.example` keys (public contract):
  - `DATABASE_URL`
  - `NEXTAUTH_SECRET`
  - `NEXTAUTH_URL`
  - `R2_ACCOUNT_ID`, `R2_BUCKET`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_PUBLIC_BASE_URL`
- Done when: app starts with env validation and fails fast on missing keys.

P0.3 Database schema (Drizzle) + migrations

- Implement Drizzle schema (source of truth):
  - `users`: id, email, passwordHash (credentials), role (reader|blogger), state, lga, createdAt
  - `posts`: id, authorId, title, slug (unique), excerpt, content, category, coverImageUrl, status (draft|published), createdAt, updatedAt
  - `comments`: id, postId, authorId, body, createdAt
  - `reactions` (optional in P0 if needed for MVP): postId, userId, type
- Done when: `npm run db:generate` and `npm run db:push` work against CockroachDB.

P0.4 Auth + RBAC (Auth.js / NextAuth v5)

- Credentials auth minimum viable:
  - Register (reader + blogger)
  - Login
- Sessions include `role`.
- Route protection:
  - Blogger routes blocked for non-blogger.
- Done when: you can register/login and access the correct areas by role.

P0.5 Publishing pipeline (no mock)

- Blogger Studio: create/edit/delete posts via Server Actions.
- Reader Feed: fetch published posts from DB.
- Post page: fetch by slug.
- Done when: a new post appears on the public feed and has a working URL.

---

P1 — Core Product (second wave)

P1.1 Cloudflare R2 uploads (Zero‑Egress Media)

- Generate presigned upload URLs (server) and upload directly (client).
- DB stores URL string only (no Base64, no blobs).
- Done when: cover image upload works end-to-end and renders in the feed + post page.

P1.2 Studio parity with `bloggers.html`

- Sidebar navigation (Editor / Posts / Analytics / Media).
- Live preview split view + mobile/desktop preview toggle.
- Auto slug generation + read time.
- Done when: the Next app matches the workflow of the prototype with real DB saves.

P1.3 Comments (Reader interaction)

- Guests can read.
- Only authenticated readers/bloggers can comment.
- Done when: comment create + list persists and is visible on post page.

P1.4 Geo onboarding (State/LGA)

- Implement a `geo-data` utility and store selection on blogger profile.
- Done when: blogger registration requires state + lga; values stored in DB.

---

P2 — PWA + Analytics + Polish

P2.1 PWA install + offline-first

- Configure a PWA service worker (Workbox 7.4+ or equivalent) and `public/manifest.json` + icons.
- Cache strategy: allow reading previously visited posts offline.
- Done when: Lighthouse shows PWA installable and offline pages render from cache.

P2.2 Analytics (real data)

- Track: post views (server-side increments) and basic aggregates per blogger.
- Done when: Blogger dashboard shows real counts from DB.

P2.3 Performance + quality gates

- Lighthouse targets and basic accessibility passes.
- Done when: no CLS regressions; images are optimized; pages are fast on mobile.

---

Immediate Next Actions (today)

1. Install dependencies and verify Node toolchain.
2. Scaffold Next.js App Router structure (`src/app`, `src/components`, `src/db`, `src/lib`).
3. Add env contract + Drizzle config; connect CockroachDB.
