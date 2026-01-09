# 👑 KING BLOGGERS V2 ROADMAP
## "The TikTok of Blogging" - Addiction-Grade Features & Improvements

> **Vision**: Transform King Bloggers from a publishing platform into an **addictive content discovery engine** where users can't stop scrolling, creators can't stop posting, and everyone feels like royalty.

---

## 🎯 THE ADDICTION FORMULA

TikTok's success comes from three pillars:
1. **Zero-friction content consumption** (infinite scroll, autoplay)
2. **Dopamine loops** (likes, views, notifications)
3. **Personalized discovery** (algorithm-driven "For You" feed)

We will adapt these for long-form content.

---

## 🚀 PHASE 1: ADDICTION ENGINE (HIGH IMPACT)

### 1.1 📜 Infinite Scroll Feed
**Why**: Users should never hit "the end." Content should flow endlessly.

**Implementation**:
```
- Replace grid layout with vertical infinite scroll
- Lazy-load posts as user scrolls (Intersection Observer)
- "Pull to refresh" on mobile
- Skeleton placeholders while loading
```

**Database Change**: Add `cursor`-based pagination (not offset-based)

**Files to modify**:
- `src/app/(public)/page.tsx` - Home feed
- `src/components/pages/CategoryFeedPage.tsx` - Category feeds
- `src/lib/queries/posts.ts` - Add cursor pagination

---

### 1.2 ❤️ Rich Reactions System (Beyond Up/Down)
**Why**: More reaction options = more engagement = more dopamine

**Current**: Only 👍/👎 (boring)
**New**: 🔥 Fire | 💎 Gem | 👑 Crown | 💡 Insightful | 😂 LOL

**Database Migration Required**:
```sql
-- Expand reaction_value enum
ALTER TYPE "reaction_value" ADD VALUE 'fire';
ALTER TYPE "reaction_value" ADD VALUE 'gem';
ALTER TYPE "reaction_value" ADD VALUE 'crown';
ALTER TYPE "reaction_value" ADD VALUE 'insightful';
ALTER TYPE "reaction_value" ADD VALUE 'lol';
```

**Schema Change**:
```typescript
export const reactionValueEnum = pgEnum("reaction_value", [
  "up", "down", "fire", "gem", "crown", "insightful", "lol"
]);
```

**Files to modify**:
- `src/db/schema.ts`
- `src/components/features/ReactionBar.tsx` - New emoji selector
- `src/lib/queries/reactions.ts` - Aggregate by type
- `src/app/actions/reactions.ts`

---

### 1.3 🔔 Real-Time Notifications
**Why**: Pull users back into the app constantly

**New Table**:
```typescript
export const notifications = pgTable("notifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 50 }).notNull(), // 'comment', 'reaction', 'follow', 'mention'
  actorId: uuid("actor_id").references(() => users.id, { onDelete: "set null" }),
  postId: uuid("post_id").references(() => posts.id, { onDelete: "cascade" }),
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
```

**Features**:
- Bell icon in navbar with unread count badge
- Dropdown showing recent notifications
- "Someone reacted to your post" / "New comment on X"
- Push notifications via Web Push API (PWA)

---

### 1.4 👤 Follow System
**Why**: Build creator-audience relationships

**New Table**:
```typescript
export const follows = pgTable("follows", {
  id: uuid("id").defaultRandom().primaryKey(),
  followerId: uuid("follower_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  followingId: uuid("following_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  unique: uniqueIndex("follows_unique").on(t.followerId, t.followingId),
}));
```

**Features**:
- "Follow" button on author profiles and post cards
- "Following" feed tab (posts from people you follow)
- Follower/following counts on profile
- "X started following you" notifications

---

### 1.5 📊 View Counts & Trending Algorithm
**Why**: Social proof drives engagement

**New Table**:
```typescript
export const postViews = pgTable("post_views", {
  id: uuid("id").defaultRandom().primaryKey(),
  postId: uuid("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
  viewerIp: varchar("viewer_ip", { length: 45 }), // IPv6 support
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
```

**Features**:
- Track views (deduplicated by IP + session)
- Show view count on posts ("1.2K views")
- "Trending" section based on:
  ```
  trending_score = (views * 0.3) + (reactions * 0.5) + (comments * 0.2) / age_in_hours
  ```
- "Most Viewed This Week" leaderboard

---

### 1.6 🔖 Bookmarks / Save for Later
**Why**: Users want to save content they'll read later

**New Table**:
```typescript
export const bookmarks = pgTable("bookmarks", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  postId: uuid("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  unique: uniqueIndex("bookmarks_unique").on(t.userId, t.postId),
}));
```

**Features**:
- Bookmark icon on every post
- "Saved" tab in user profile
- Offline reading support (PWA cache)

---

## 🎨 PHASE 2: CSS & DESIGN IMPROVEMENTS

### 2.1 Global CSS Enhancements

**Current Issues**:
1. Glass effects could be more dramatic
2. Missing micro-animations
3. Need more depth/layering
4. No dark mode gradient mesh variety

**Proposed Additions to `global.css`**:

```css
/* ============================================
   👑 KING BLOGGERS V2 - ENHANCED GLASS ENGINE
   ============================================ */

/* --- PREMIUM GRADIENT OVERLAYS --- */
.glass-card::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.1) 0%,
    transparent 50%,
    rgba(0, 0, 0, 0.05) 100%
  );
  pointer-events: none;
  z-index: 1;
}

.dark .glass-card::before {
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.05) 0%,
    transparent 50%,
    rgba(0, 0, 0, 0.2) 100%
  );
}

/* --- AURORA MESH BACKGROUND (TikTok-inspired) --- */
.aurora-mesh {
  background-image:
    radial-gradient(ellipse at 10% 20%, rgba(255, 140, 0, 0.15) 0%, transparent 50%),
    radial-gradient(ellipse at 90% 80%, rgba(212, 175, 55, 0.1) 0%, transparent 50%),
    radial-gradient(ellipse at 50% 50%, rgba(139, 92, 246, 0.05) 0%, transparent 60%),
    radial-gradient(ellipse at 80% 20%, rgba(59, 130, 246, 0.05) 0%, transparent 40%);
  background-attachment: fixed;
  animation: auroraPulse 15s ease-in-out infinite;
}

@keyframes auroraPulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

/* --- GLOW TEXT EFFECT --- */
.text-glow-orange {
  text-shadow: 
    0 0 10px rgba(255, 140, 0, 0.5),
    0 0 30px rgba(255, 140, 0, 0.3),
    0 0 60px rgba(255, 140, 0, 0.1);
}

/* --- FLOATING ACTION BUTTON --- */
.fab {
  position: fixed;
  bottom: calc(24px + env(safe-area-inset-bottom));
  right: 24px;
  z-index: 50;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: rgb(var(--king-orange));
  color: black;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 
    0 8px 32px rgba(255, 140, 0, 0.4),
    0 0 0 0 rgba(255, 140, 0, 0.4);
  animation: fabPulse 2s ease-in-out infinite;
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.fab:hover {
  transform: scale(1.1);
}

.fab:active {
  transform: scale(0.95);
}

@keyframes fabPulse {
  0%, 100% { box-shadow: 0 8px 32px rgba(255, 140, 0, 0.4), 0 0 0 0 rgba(255, 140, 0, 0.4); }
  50% { box-shadow: 0 8px 32px rgba(255, 140, 0, 0.4), 0 0 0 12px rgba(255, 140, 0, 0); }
}

/* --- NOTIFICATION BADGE --- */
.notification-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 999px;
  background: #ef4444;
  color: white;
  font-size: 10px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: badgePop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes badgePop {
  0% { transform: scale(0); }
  100% { transform: scale(1); }
}

/* --- STAGGERED CARD REVEAL --- */
.stagger-reveal > * {
  opacity: 0;
  transform: translateY(20px);
  animation: staggerIn 0.5s ease forwards;
}

.stagger-reveal > *:nth-child(1) { animation-delay: 0ms; }
.stagger-reveal > *:nth-child(2) { animation-delay: 50ms; }
.stagger-reveal > *:nth-child(3) { animation-delay: 100ms; }
.stagger-reveal > *:nth-child(4) { animation-delay: 150ms; }
.stagger-reveal > *:nth-child(5) { animation-delay: 200ms; }
.stagger-reveal > *:nth-child(6) { animation-delay: 250ms; }
.stagger-reveal > *:nth-child(7) { animation-delay: 300ms; }
.stagger-reveal > *:nth-child(8) { animation-delay: 350ms; }
.stagger-reveal > *:nth-child(9) { animation-delay: 400ms; }

@keyframes staggerIn {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* --- SMOOTH SCROLL SNAP (for feed) --- */
.snap-feed {
  scroll-snap-type: y proximity;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.snap-feed > * {
  scroll-snap-align: start;
  scroll-snap-stop: normal;
}

/* --- CONTENT REVEAL ON SCROLL --- */
.reveal-on-scroll {
  opacity: 0;
  transform: translateY(30px);
  transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}

.reveal-on-scroll.revealed {
  opacity: 1;
  transform: translateY(0);
}

/* --- GLASS MODAL BACKDROP --- */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  z-index: 100;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* --- REACTION EMOJI PICKER --- */
.reaction-picker {
  display: flex;
  gap: 4px;
  padding: 8px 12px;
  background: var(--glass-bg);
  backdrop-filter: blur(20px);
  border: 1px solid var(--glass-border);
  border-radius: 999px;
  box-shadow: var(--glass-shadow);
}

.reaction-emoji {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s ease;
}

.reaction-emoji:hover {
  transform: scale(1.3);
  background: rgba(var(--king-orange) / 0.1);
}

.reaction-emoji:active {
  transform: scale(1.1);
}

/* --- LOADING DOTS --- */
.loading-dots {
  display: inline-flex;
  gap: 4px;
}

.loading-dots span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
  animation: loadingDot 1.4s infinite ease-in-out both;
}

.loading-dots span:nth-child(1) { animation-delay: -0.32s; }
.loading-dots span:nth-child(2) { animation-delay: -0.16s; }
.loading-dots span:nth-child(3) { animation-delay: 0s; }

@keyframes loadingDot {
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1); }
}

/* --- SWIPE HINT (mobile) --- */
.swipe-hint {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  padding: 8px 16px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  border-radius: 20px;
  font-size: 12px;
  animation: swipeHint 2s ease infinite;
}

@keyframes swipeHint {
  0%, 100% { opacity: 0.5; transform: translateX(-50%) translateY(0); }
  50% { opacity: 1; transform: translateX(-50%) translateY(-5px); }
}

/* --- TYPING INDICATOR --- */
.typing-indicator {
  display: flex;
  gap: 4px;
  padding: 12px 16px;
  background: var(--glass-bg);
  border-radius: 18px;
  border: 1px solid var(--glass-border);
  width: fit-content;
}

.typing-indicator span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgb(var(--foreground-rgb) / 0.4);
  animation: typing 1.4s infinite ease-in-out;
}

.typing-indicator span:nth-child(1) { animation-delay: 0s; }
.typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
.typing-indicator span:nth-child(3) { animation-delay: 0.4s; }

@keyframes typing {
  0%, 60%, 100% { transform: translateY(0); }
  30% { transform: translateY(-8px); }
}
```

---

## 🔧 PHASE 3: TECHNICAL IMPROVEMENTS

### 3.1 Performance Optimizations

| Issue | Current | Target | Solution |
|-------|---------|--------|----------|
| First Paint | ~2.5s | <1s | Edge caching, optimized images |
| Bundle Size | 123kB JS | <100kB | Code splitting, tree shaking |
| API Latency | ~200ms | <100ms | Connection pooling, query optimization |

**Actions**:
1. Add `next/dynamic` for heavy components (AnalyticsChart, SovereignEditor)
2. Implement `next/image` blur placeholders (already done ✅)
3. Add Redis caching layer for hot queries
4. Use `streaming` for long API responses

---

### 3.2 SEO & Meta Improvements

**Add to blog posts**:
```typescript
// src/app/(public)/blog/[slug]/page.tsx
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const post = await getPublishedPostBySlug(params.slug);
  if (!post) return {};
  
  return {
    title: `${post.title} | King Bloggers`,
    description: post.excerpt ?? post.title,
    openGraph: {
      title: post.title,
      description: post.excerpt ?? undefined,
      images: post.coverImageUrl ? [post.coverImageUrl] : undefined,
      type: 'article',
      publishedTime: post.createdAt.toISOString(),
      authors: [post.authorEmail],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt ?? undefined,
      images: post.coverImageUrl ? [post.coverImageUrl] : undefined,
    },
  };
}
```

---

### 3.3 Search Functionality

**Why**: Users need to find content quickly

**Implementation Options**:
1. **Basic**: PostgreSQL full-text search with `tsvector`
2. **Advanced**: Algolia or Meilisearch integration

**Database Addition** (for basic):
```sql
ALTER TABLE posts ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(excerpt, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(content, '')), 'C')
  ) STORED;

CREATE INDEX posts_search_idx ON posts USING GIN (search_vector);
```

---

## 📱 PHASE 4: MOBILE-FIRST FEATURES

### 4.1 Swipe Navigation
- Swipe left/right between posts
- Swipe up for next post in feed
- Swipe down to refresh

### 4.2 Bottom Navigation Bar
Replace header nav on mobile with thumb-friendly bottom bar:
- Home | Search | Create | Notifications | Profile

### 4.3 Stories/Highlights
Short-lived content (24h) for quick updates:
- Circular avatars at top of feed
- Tap to view, swipe to next

---

## 📈 PHASE 5: ANALYTICS & GROWTH

### 5.1 Creator Analytics Dashboard
- Real-time view counts
- Engagement rate over time
- Best performing posts
- Audience demographics (by state/LGA)
- Best time to post

### 5.2 Reader Insights
- Reading streaks ("You've read 7 days in a row!")
- Personalized recommendations
- "Based on your interests" section

---

## 🗂️ MIGRATION CHECKLIST

### Pending Schema Changes (New Tables):
1. `notifications` - For real-time alerts
2. `follows` - User follow relationships
3. `post_views` - View tracking
4. `bookmarks` - Saved posts
5. Expand `reaction_value` enum with new emotions

### Migration File to Create:
```
drizzle/0002_addiction_engine.sql
```

---

## 📋 PRIORITY MATRIX

| Feature | Impact | Effort | Priority |
|---------|--------|--------|----------|
| Infinite Scroll | 🔥🔥🔥 | Medium | P0 |
| Rich Reactions | 🔥🔥🔥 | Low | P0 |
| View Counts | 🔥🔥 | Low | P1 |
| Bookmarks | 🔥🔥 | Low | P1 |
| Follow System | 🔥🔥🔥 | Medium | P1 |
| Notifications | 🔥🔥🔥 | High | P2 |
| Search | 🔥🔥 | Medium | P2 |
| Stories | 🔥🔥 | High | P3 |

---

## 🎯 SUCCESS METRICS

| Metric | Current | Target (90 days) |
|--------|---------|------------------|
| Avg. Session Duration | ? | 8+ minutes |
| Pages per Session | ? | 5+ |
| Daily Active Users | ? | 1000+ |
| Posts Created/Day | ? | 50+ |
| Return Visitor Rate | ? | 40%+ |

---

## 🚀 LET'S BUILD THE IMPOSSIBLE

This roadmap transforms King Bloggers from a simple blog platform into an **addictive content engine**. Each feature is designed to create dopamine loops, reduce friction, and keep users coming back.

**The Vision**: When users open King Bloggers, they should feel the same pull they feel opening TikTok—but instead of 15-second videos, they're consuming high-quality written content that makes them smarter.

---

*Document created: January 9, 2026*
*Last updated: January 9, 2026*
*Version: 2.0*
