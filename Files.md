King Bloggers: Project File Structure Manifest

This document outlines the complete file architecture required to build the King Bloggers PWA.

1. Configuration & Root Files

These files govern the build system, PWA behavior, and the design tokens.

next.config.mjs: PWA workbox settings, R2 image domains, and Server Action limits.

tailwind.config.ts: Centralized design tokens for the "Liquid Glass" aesthetic (Colors, Shadows, Animations).

drizzle.config.ts: Database migration paths and CockroachDB connection config.

.env.local: Storage for sensitive keys:

DATABASE_URL (CockroachDB)

R2_ACCESS_KEY_ID & R2_SECRET_ACCESS_KEY (Cloudflare)

NEXTAUTH_SECRET (Auth.js)

2. Database & Data Layer (Backend)

The "Brain" of the operation using Drizzle ORM and CockroachDB.

src/db/schema.ts: Drizzle definitions for:

users (Columns: Role, State, LGA)

posts (Columns: Slug, Content, ImageURL)

categories (Enums: Tech, Art, Politics, etc.)

comments

src/db/index.ts: The singleton CockroachDB client connection.

src/lib/geo-data.ts: Static JSON mapping for the 36 Nigerian States and their LGAs.

3. Logic & Security (Engine)

The middleware and helper functions that drive multi-role access.

src/lib/auth.ts: Auth.js (NextAuth) configuration.

Logic for CredentialsProvider and GoogleProvider.

session() callbacks to inject user.role into the client session.

src/middleware.ts: Next.js middleware to strictly protect /blogger/* and /admin/* routes.

src/lib/r2.ts: S3-compatible client for Cloudflare R2 asset management (Presigned URL generation).

src/lib/utils.ts: Utility functions for clsx/tailwind-merge class handling and date formatting.

4. UI Components (Atomic Design)

The visual building blocks using the tokens defined in tailwind.config.ts.

src/components/ui/GlassCard.tsx: The primary container component with backdrop-blur and border effects.

src/components/ui/GlassButton.tsx: High-performance buttons with haptic-like hover transitions.

src/components/layout/Navbar.tsx: The "Smart Header" that collapses on scroll.

src/components/forms/RegistrationForm.tsx: The multi-step Reader/Blogger logic (Geo-location selectors).

src/components/forms/SovereignEditor.tsx: The "Blogger Studio" writing environment (WYSIWYG).

5. App Router Structure (The Map)

The physical routes that the user navigates.

src/app/layout.tsx: Root layout containing global font imports (Plus Jakarta Sans) and the mesh-gradient background.

src/app/(public)/page.tsx: The main interactive "King Bloggers" home feed.

src/app/(public)/blog/[slug]/page.tsx: Dynamic single post view with comment section.

src/app/(auth)/register/page.tsx: The entry point for Role Selection (Reader vs Blogger Cards).

src/app/(blogger)/dashboard/page.tsx: The "Command Center" for creators (Analytics & Post Management).

src/app/api/upload/route.ts: API endpoint for generating R2 presigned URLs for image uploads.

6. Progressive Web App (Offline Support)

public/manifest.json: JSON configuration for "Add to Home Screen" behavior (Icons, Name, Theme Color).

public/icons/: Directory containing icon-192x192.png and icon-512x512.png.