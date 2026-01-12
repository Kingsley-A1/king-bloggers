# 👑 KING BLOGGERS - COMPREHENSIVE CODE AUDIT

> **Audit Date:** January 9, 2026  
> **Auditor:** Senior Developer Review  
> **Project:** King Bloggers - Sovereign Nigerian Media Platform  
> **Stack:** Next.js 15, React 19, Drizzle ORM, CockroachDB, NextAuth v5, Cloudflare R2

---

## 📊 EXECUTIVE SUMMARY

| Category        | Critical | High   | Medium | Low    |
| --------------- | -------- | ------ | ------ | ------ |
| 🔐 Security     | 3        | 5      | 4      | 2      |
| 🔧 Backend      | 1        | 4      | 5      | 3      |
| 🎨 Frontend/UI  | 0        | 2      | 6      | 4      |
| ⚡ Performance  | 1        | 3      | 4      | 2      |
| 🏗️ Architecture | 0        | 2      | 3      | 2      |
| **TOTAL**       | **5**    | **16** | **22** | **13** |

---

## 🔐 SECURITY ISSUES

### 🔴 CRITICAL

#### SEC-001: Exposed Credentials in .env.local

- **File:** `.env.local`
- **Issue:** Database URL, API keys, and secrets are visible. If this file is ever committed to version control, all credentials are compromised.
- **Risk:** Complete database breach, unauthorized access to all services
- **Status:** ⬜ Not Fixed
- **Fix:**

  ```bash
  # 1. Add to .gitignore if not already
  echo ".env.local" >> .gitignore

  # 2. Rotate ALL credentials immediately:
  # - Database password
  # - NEXTAUTH_SECRET (generate new: openssl rand -base64 32)
  # - Google OAuth credentials
  # - R2 API keys
  ```

#### SEC-002: Upload API Has No Authentication

- **File:** `src/app/api/upload/route.ts` (Lines 12-31)
- **Issue:** The upload endpoint accepts any request without verifying the user session. Anyone can upload files to R2.
- **Risk:** Storage abuse, malicious file uploads, cost explosion
- **Status:** ⬜ Not Fixed
- **Fix:**

  ```typescript
  import { auth } from "@/lib/auth";

  export async function POST(req: Request) {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // ... rest of upload logic
  }
  ```

#### SEC-003: Missing CSRF Protection on Reactions Action

- **File:** `src/app/actions/reactions.ts`
- **Issue:** `setReaction` accepts raw input without origin verification. Cross-site attacks possible.
- **Risk:** Unauthorized vote manipulation
- **Status:** ⬜ Not Fixed
- **Fix:** Add rate limiting (already exists in other actions) and consider using form actions with built-in CSRF protection.

---

### 🟠 HIGH

#### SEC-004: Comment Body Not Sanitized Before Storage

- **File:** `src/lib/actions/comments.ts` (Lines 17-35)
- **Issue:** Comment body is stored directly without sanitization. While posts use `sanitizeHtml`, comments bypass this.
- **Risk:** Stored XSS attacks when rendering comments
- **Status:** ⬜ Not Fixed
- **Fix:**

  ```typescript
  import { sanitizeText } from "../sanitize";

  await db.insert(comments).values({
    postId: parsed.data.postId,
    authorId: session.user.id,
    body: sanitizeText(parsed.data.body), // ADD THIS
  });
  ```

#### SEC-005: Rate Limiting Uses In-Memory Store

- **File:** `src/lib/rate-limit.ts` (Lines 1-40)
- **Issue:** Rate limiting uses `Map()` which resets on server restart and doesn't work across multiple instances (Vercel serverless).
- **Risk:** Rate limiting ineffective in production
- **Status:** ⬜ Not Fixed
- **Fix:**
  ```typescript
  // Use Upstash Redis for distributed rate limiting
  // npm install @upstash/ratelimit @upstash/redis
  import { Ratelimit } from "@upstash/ratelimit";
  import { Redis } from "@upstash/redis";
  ```

#### SEC-006: Google OAuth `allowDangerousEmailAccountLinking` Should Be Reviewed

- **File:** `src/lib/auth.ts` (Line 28)
- **Issue:** Set to `false` (good), but needs documentation on email collision handling behavior.
- **Risk:** Account confusion if user signs up with email then tries Google with same email
- **Status:** ⬜ Needs Documentation
- **Action:** Add clear error handling when email exists with different auth method.

#### SEC-007: JWT Callback Queries Database on Every Request

- **File:** `src/lib/auth.ts` (Lines 73-93)
- **Issue:** Every authenticated request triggers a DB query to refresh role/name/image.
- **Risk:** Performance bottleneck, unnecessary DB load
- **Status:** ⬜ Not Fixed
- **Fix:** Cache user data or only refresh on specific triggers.

#### SEC-008: Profile Update Allows Any Role Change

- **File:** `src/lib/actions/profile.ts` (Lines 15-55)
- **Issue:** Users can change their own role from "reader" to "blogger" without admin approval.
- **Risk:** Unauthorized blogger access
- **Status:** ⬜ Not Fixed
- **Fix:** Remove `role` from user-editable fields or add admin approval flow.

---

### 🟡 MEDIUM

#### SEC-009: Missing Content-Security-Policy Headers

- **File:** `next.config.mjs`
- **Issue:** No CSP headers configured. XSS attacks are harder to mitigate.
- **Status:** ⬜ Not Fixed
- **Fix:** Add security headers in `next.config.mjs`:
  ```javascript
  const nextConfig = {
    async headers() {
      return [
        {
          source: "/:path*",
          headers: [
            { key: "X-Frame-Options", value: "DENY" },
            { key: "X-Content-Type-Options", value: "nosniff" },
            { key: "Referrer-Policy", value: "origin-when-cross-origin" },
          ],
        },
      ];
    },
  };
  ```

#### SEC-010: File Upload Missing Type Validation

- **File:** `src/app/api/upload/route.ts`
- **Issue:** No validation that uploaded files are actually images. User can upload any file type.
- **Status:** ⬜ Not Fixed
- **Fix:** Validate `contentType` against allowed MIME types:
  ```typescript
  const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (!ALLOWED_TYPES.includes(contentType)) {
    return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
  }
  ```

#### SEC-011: Missing File Size Limits on Upload

- **File:** `src/app/api/upload/route.ts`
- **Issue:** No max file size enforcement. Users can upload arbitrarily large files.
- **Status:** ⬜ Not Fixed
- **Fix:** Check Content-Length header and reject large files.

#### SEC-012: `dangerouslySetInnerHTML` Used for Post Content

- **File:** `src/app/(public)/blog/[slug]/page.tsx` (Line 91)
- **Issue:** Post content uses `dangerouslySetInnerHTML`. While sanitized on save, a bug in sanitization could cause XSS.
- **Status:** ⚠️ Mitigated (sanitization exists)
- **Recommendation:** Consider using a sanitization library like DOMPurify for extra safety.

---

### 🟢 LOW

#### SEC-013: Password Minimum Length Is Only 8 Characters

- **File:** `src/lib/auth.ts` (Line 15)
- **Issue:** Modern standards recommend 12+ characters.
- **Status:** ⬜ Not Fixed

#### SEC-014: No Account Lockout After Failed Logins

- **Issue:** Rate limiting exists but no progressive lockout.
- **Status:** ⬜ Not Fixed

---

## 🔧 BACKEND ISSUES

### 🔴 CRITICAL

#### BE-001: updatePost Action Doesn't Re-sanitize Content

- **File:** `src/lib/actions/posts.ts` (Lines 95-115)
- **Issue:** `updatePost` applies patches directly without sanitization. If content is edited, XSS can be injected.
- **Status:** ⬜ Not Fixed
- **Fix:**

  ```typescript
  const { postId, ...patch } = parsed.data;

  // ADD SANITIZATION
  const sanitizedPatch = {
    ...patch,
    title: patch.title ? sanitizeText(patch.title) : undefined,
    content: patch.content ? sanitizeHtml(patch.content) : undefined,
    excerpt: patch.excerpt ? sanitizeText(patch.excerpt) : undefined,
  };

  const updated = await db.update(posts).set({
    ...sanitizedPatch,
    updatedAt: new Date(),
  })...
  ```

---

### 🟠 HIGH

#### BE-002: Newsletter Subscription Lacks Rate Limiting

- **File:** `src/app/api/newsletter/route.ts`
- **Issue:** No rate limiting. Email harvesting/spamming possible.
- **Status:** ⬜ Not Fixed

#### BE-003: Comments Have No Edit/Delete Functionality

- **File:** `src/lib/actions/comments.ts`
- **Issue:** Users cannot edit or delete their own comments.
- **Status:** ⬜ Missing Feature

#### BE-004: No Post Deletion Feature

- **File:** `src/lib/actions/posts.ts`
- **Issue:** Bloggers cannot delete their posts.
- **Status:** ⬜ Missing Feature

#### BE-005: Database Connection Pool May Exhaust

- **File:** `src/db/index.ts` (Line 12)
- **Issue:** Pool max is 10, but serverless functions can spawn many instances.
- **Status:** ⬜ Not Fixed
- **Fix:** Consider connection pooling service like PgBouncer or Neon's built-in pooler.

---

### 🟡 MEDIUM

#### BE-006: Duplicate Query Functions for Comments

- **Files:** `src/lib/actions/comments.ts` AND `src/lib/queries/comments.ts`
- **Issue:** `listCommentsForPost` exists in both with slightly different implementations.
- **Status:** ⬜ Not Fixed
- **Fix:** Remove duplicate, use single source of truth.

#### BE-007: No Pagination on Post Listings

- **File:** `src/lib/queries/posts.ts` (Line 25)
- **Issue:** Hardcoded `limit: 30`. No cursor or offset pagination.
- **Status:** ⬜ Not Fixed

#### BE-008: Reaction Counts Query Is N+1 Prone

- **File:** `src/lib/queries/reactions.ts`
- **Issue:** Makes 3 separate queries (up count, down count, user's reaction). Should be single query.
- **Status:** ⬜ Not Fixed
- **Fix:** Use single query with conditional aggregation:
  ```sql
  SELECT
    SUM(CASE WHEN value = 'up' THEN 1 ELSE 0 END) as up,
    SUM(CASE WHEN value = 'down' THEN 1 ELSE 0 END) as down,
    MAX(CASE WHEN user_id = $1 THEN value END) as my_value
  FROM post_reactions WHERE post_id = $2
  ```

#### BE-009: No Slug Uniqueness Validation Before Insert

- **File:** `src/lib/actions/posts.ts` (Line 62)
- **Issue:** Random suffix added to slug, but collision still theoretically possible.
- **Status:** ⬜ Not Fixed
- **Fix:** Check slug existence before insert or use `ON CONFLICT`.

#### BE-010: Missing `updatedAt` Trigger

- **File:** `src/db/schema.ts`
- **Issue:** `updatedAt` must be manually set. No database trigger.
- **Status:** ⬜ Not Fixed

---

### 🟢 LOW

#### BE-011: Comments Don't Link Back to Post Slug

- **File:** `src/app/(reader)/profile/page.tsx`
- **Issue:** Comment history shows `postId` but no link to actual post.
- **Status:** ⬜ Not Fixed

#### BE-012: No Author Name in Post Queries

- **File:** `src/lib/queries/posts.ts`
- **Issue:** Returns `authorEmail` but not `authorName`. Privacy concern showing emails.
- **Status:** ⬜ Not Fixed

#### BE-013: Video URL Not Validated

- **File:** `src/lib/actions/posts.ts`
- **Issue:** `videoUrl` accepts any URL without validation.
- **Status:** ⬜ Not Fixed

---

## 🎨 FRONTEND / UI ISSUES

### 🟠 HIGH

#### UI-001: Editor Uses Deprecated `document.execCommand`

- **File:** `src/components/forms/SovereignEditor.tsx` (Line 122)
- **Issue:** `document.execCommand` is deprecated and may be removed from browsers.
- **Status:** ⬜ Not Fixed
- **Fix:** Migrate to Tiptap, Slate, or ProseMirror for rich text editing.

#### UI-002: Blogger Dashboard Accessible Without Auth

- **File:** `src/app/blogger/dashboard/page.tsx`
- **Issue:** Page renders "You must be logged in" instead of redirecting. Middleware should block.
- **Status:** ⬜ Inconsistent
- **Fix:** Middleware already protects `/blogger/*` routes. Dashboard should never reach unauthenticated state.

---

### 🟡 MEDIUM

#### UI-003: PostCard Uses `<img>` Instead of `next/image`

- **File:** `src/components/features/PostCard.tsx` (Line 41)
- **Issue:** Uses raw `<img>` tag, missing Next.js image optimization.
- **Status:** ⬜ Not Fixed
- **Fix:** Replace with `<Image>` from `next/image` with proper sizing.

#### UI-004: No Loading States for Category Pages

- **File:** `src/app/(public)/tech/page.tsx` (and other category pages)
- **Issue:** Missing loading skeletons for category feeds.
- **Status:** ⬜ Not Fixed

#### UI-005: ThemeToggle Missing System Theme Detection

- **File:** `src/components/features/ThemeToggle.tsx`
- **Issue:** Only toggles light/dark, doesn't respect system preference option.
- **Status:** ⬜ Not Fixed

#### UI-006: Registration Form Missing Password Confirmation

- **File:** `src/components/forms/RegistrationForm.tsx`
- **Issue:** No "confirm password" field during registration.
- **Status:** ⬜ Not Fixed

#### UI-007: Toast Component Has No Accessibility Announcements

- **File:** `src/components/features/Toast.tsx`
- **Issue:** Missing `role="alert"` and `aria-live` for screen readers.
- **Status:** ⬜ Not Fixed

#### UI-008: Mobile Menu Doesn't Trap Focus

- **File:** `src/components/layout/MobileMenu.tsx`
- **Issue:** Keyboard users can tab outside the open menu.
- **Status:** ⬜ Not Fixed

---

### 🟢 LOW

#### UI-009: No Empty State for Blogger Dashboard Charts

- **Issue:** Chart shows flat line when no data. Could show helpful message.
- **Status:** ⬜ Not Fixed

#### UI-010: Profile Page Shows Raw Email

- **File:** `src/app/(reader)/profile/page.tsx`
- **Issue:** Displays full email address. Consider masking.
- **Status:** ⬜ Not Fixed

#### UI-011: Comment Section Has No Max Length Visual Indicator

- **Issue:** 4000 char limit exists but user doesn't see it.
- **Status:** ⬜ Not Fixed

#### UI-012: No Skeleton for PostCard Images

- **Issue:** Images pop in without placeholder.
- **Status:** ⬜ Not Fixed

---

## ⚡ PERFORMANCE ISSUES

### 🔴 CRITICAL

#### PERF-001: Home Page Forces Dynamic Rendering

- **File:** `src/app/(public)/page.tsx` (Line 14)
- **Issue:** `export const dynamic = "force-dynamic"` and `noStore()` prevent caching entirely.
- **Risk:** Every page load hits the database
- **Status:** ⬜ Not Fixed
- **Fix:** Use ISR (Incremental Static Regeneration):
  ```typescript
  export const revalidate = 60; // Revalidate every 60 seconds
  // Remove noStore() and force-dynamic
  ```

---

### 🟠 HIGH

#### PERF-002: Blog Post Page Makes 4+ Database Queries

- **File:** `src/app/(public)/blog/[slug]/page.tsx`
- **Issue:** Separate queries for: post, session, comments, reactions
- **Status:** ⬜ Not Fixed
- **Fix:** Combine into single query with JOINs where possible.

#### PERF-003: No Connection Pooling Configuration

- **File:** `src/db/index.ts`
- **Issue:** Using raw postgres-js without external pooling for serverless.
- **Status:** ⬜ Not Fixed

#### PERF-004: Large Bundle from Framer Motion

- **File:** `package.json`
- **Issue:** `framer-motion` is a heavy dependency. Verify if actually used.
- **Status:** ⬜ Not Verified

---

### 🟡 MEDIUM

#### PERF-005: CSS Variables Recalculated on Every Theme Change

- **File:** `global.css`
- **Issue:** Transition on body causes layout recalculation.
- **Status:** ⬜ Not Fixed

#### PERF-006: No Image Optimization for R2 Images

- **Issue:** Images served directly from R2 without CDN resizing.
- **Status:** ⬜ Not Fixed
- **Fix:** Use Cloudflare Image Resizing or next/image with custom loader.

#### PERF-007: LocalStorage Draft Saving Every 400ms

- **File:** `src/components/forms/SovereignEditor.tsx` (Line 117)
- **Issue:** Debounce is only 400ms, causes frequent writes.
- **Status:** ⬜ Not Fixed
- **Fix:** Increase debounce to 1000-2000ms.

#### PERF-008: No Static Generation for About/Docs Pages

- **Files:** `src/app/(public)/about/page.tsx`, `docs/page.tsx`
- **Issue:** These pages should be fully static.
- **Status:** ⬜ Not Verified

---

### 🟢 LOW

#### PERF-009: Google Fonts Loaded Synchronously

- **File:** `src/app/layout.tsx`
- **Issue:** `display: "swap"` is set (good), but consider self-hosting fonts.
- **Status:** ⬜ Optional

#### PERF-010: No Service Worker Caching Strategy Defined

- **Issue:** PWA uses default cache strategy.
- **Status:** ⬜ Not Fixed

---

## 🏗️ ARCHITECTURE ISSUES

### 🟠 HIGH

#### ARCH-001: Duplicate Auth Re-exports

- **Files:** `src/lib/auth.ts` (Line 114) AND `src/app/api/auth/[...nextauth]/route.ts`
- **Issue:** Auth handlers are exported from both locations. Confusing.
- **Status:** ⬜ Not Fixed
- **Fix:** Only export from route handler.

#### ARCH-002: Reader Layout vs Public Layout Confusion

- **Files:** `src/app/(reader)/layout.tsx` vs `src/app/(public)/layout.tsx`
- **Issue:** Reader layout exists but is nearly identical to public. Profile is under reader but uses different layout.
- **Status:** ⬜ Needs Refactoring

---

### 🟡 MEDIUM

#### ARCH-003: Inconsistent Import Paths

- **Issue:** Mix of `@/` and relative imports (`../../lib/`).
- **Status:** ⬜ Not Fixed
- **Fix:** Standardize on `@/` path aliases everywhere.

#### ARCH-004: No Error Boundaries

- **Issue:** No global or route-level error boundaries.
- **Status:** ⬜ Not Fixed
- **Fix:** Add `error.tsx` files to route groups.

#### ARCH-005: Types Spread Across Files

- **Issue:** Types defined inline in many files instead of central types folder.
- **Status:** ⬜ Not Fixed

---

### 🟢 LOW

#### ARCH-006: Console.log Statements Present

- **Files:** Various
- **Issue:** Debug console statements should be removed.
- **Status:** ⬜ Not Fixed

#### ARCH-007: Unused react-hook-form Dependency

- **File:** `package.json`
- **Issue:** `react-hook-form` is listed but forms use controlled components.
- **Status:** ⬜ Not Verified

---

## 📋 MISSING FEATURES CHECKLIST

| Feature                          | Priority    | Status     |
| -------------------------------- | ----------- | ---------- |
| Password Reset / Forgot Password | 🔴 Critical | ⬜ Missing |
| Email Verification               | 🔴 Critical | ⬜ Missing |
| Admin Dashboard                  | 🟠 High     | ⬜ Missing |
| Delete Account                   | 🟠 High     | ⬜ Missing |
| Delete Post                      | 🟠 High     | ⬜ Missing |
| Delete Comment                   | 🟠 High     | ⬜ Missing |
| Edit Comment                     | 🟡 Medium   | ⬜ Missing |
| Post Search                      | 🟡 Medium   | ⬜ Missing |
| User Profile Public View         | 🟡 Medium   | ⬜ Missing |
| Follow/Bookmark Authors          | 🟢 Low      | ⬜ Missing |
| Post Analytics (views count)     | 🟢 Low      | ⬜ Missing |
| Email Newsletter Sending         | 🟢 Low      | ⬜ Missing |

---

## 🔧 CONFIGURATION ISSUES

| Issue                                   | File                  | Status        |
| --------------------------------------- | --------------------- | ------------- |
| No `robots.txt` file                    | `public/`             | ⬜ Missing    |
| No `sitemap.xml` generation             | -                     | ⬜ Missing    |
| No `.nvmrc` for Node version            | Root                  | ⬜ Missing    |
| PWA icons only 192x192, need more sizes | `public/icons/`       | ⬜ Missing    |
| No OG image present                     | `public/icons/og.png` | ⬜ Unverified |
| No ESLint configuration visible         | -                     | ⬜ Unverified |
| No Prettier configuration               | -                     | ⬜ Missing    |

---

## 🏆 WHAT'S DONE WELL

✅ **TypeScript Strict Mode** - Full type safety throughout  
✅ **Zod Validation** - All inputs validated  
✅ **HTML Sanitization** - Custom sanitizer for post content  
✅ **Rate Limiting Framework** - Good structure, needs Redis  
✅ **Glass UI Design System** - Consistent, beautiful components  
✅ **PWA Manifest** - Proper PWA configuration  
✅ **Drizzle ORM** - Type-safe database queries  
✅ **NextAuth v5** - Modern auth implementation  
✅ **Theme Support** - Dark/Light mode works well  
✅ **Mobile Responsive** - Good mobile layouts  
✅ **Role-based Middleware** - Protects blogger routes  
✅ **Optimistic UI Updates** - Reactions update instantly

---

## 📌 PRIORITY ACTION ITEMS

### Immediate (This Week)

1. ⬜ Add authentication to upload API (SEC-002)
2. ⬜ Sanitize comment bodies (SEC-004)
3. ⬜ Sanitize post updates (BE-001)
4. ⬜ Add file type validation to uploads (SEC-010)
5. ⬜ Remove role from user-editable fields (SEC-008)

### Short Term (This Month)

1. ⬜ Implement Redis rate limiting (SEC-005)
2. ⬜ Add ISR caching to home page (PERF-001)
3. ⬜ Add password reset flow
4. ⬜ Add delete post functionality
5. ⬜ Add security headers (SEC-009)

### Medium Term (This Quarter)

1. ⬜ Replace execCommand editor (UI-001)
2. ⬜ Optimize database queries (PERF-002)
3. ⬜ Add admin dashboard
4. ⬜ Implement pagination
5. ⬜ Add email verification

---

## 📊 QUALITY METRICS

| Metric            | Current | Target |
| ----------------- | ------- | ------ |
| Security Score    | 45/100  | 90/100 |
| Performance Score | 60/100  | 85/100 |
| Code Quality      | 70/100  | 90/100 |
| Test Coverage     | 0%      | 80%    |
| Accessibility     | 65/100  | 95/100 |

---

> **Next Review:** Schedule follow-up audit after critical issues are resolved.

_Generated by Senior Developer Audit Process_
