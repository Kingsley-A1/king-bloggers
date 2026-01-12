# 👑 KING BLOGGERS - Personalization Engine (KBPE)

## 🎯 Vision

Build a TikTok-grade recommendation system that creates **addiction-level engagement** by showing users content they can't resist.

---

## 🧠 THE ALGORITHM PILLARS

### 1. **User Interest Graph**

Track what users engage with to build a personalized interest profile.

**Signals (Ranked by Weight):**
| Signal | Weight | Description |
|--------|--------|-------------|
| Time Spent | 0.30 | How long they read (scroll depth %) |
| Reaction Given | 0.25 | Fire/Crown/Gem = high intent |
| Bookmark | 0.20 | Explicit "want to read later" |
| Comment | 0.15 | Highest engagement form |
| Follow Author | 0.10 | Trust signal for creator |

**Data Model:**

```typescript
// New table: user_interests
export const userInterests = pgTable(
  "user_interests",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    category: postCategoryEnum("category").notNull(),
    score: integer("score").notNull().default(0), // 0-1000 scale
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    unique: uniqueIndex("user_interests_unique").on(t.userId, t.category),
  })
);

// New table: reading_history
export const readingHistory = pgTable(
  "reading_history",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    postId: uuid("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    scrollDepth: integer("scroll_depth").notNull().default(0), // 0-100%
    timeSpent: integer("time_spent").notNull().default(0), // seconds
    completed: boolean("completed").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    unique: uniqueIndex("reading_history_unique").on(t.userId, t.postId),
  })
);

// New table: user_author_affinity (who they love reading)
export const userAuthorAffinity = pgTable(
  "user_author_affinity",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    authorId: uuid("author_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    score: integer("score").notNull().default(0), // 0-1000 scale
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    unique: uniqueIndex("user_author_affinity_unique").on(t.userId, t.authorId),
  })
);
```

---

### 2. **Content Quality Score**

Every post gets a quality score based on engagement metrics.

**Formula:**

```
quality_score = (
  (reactions * 5) +
  (comments * 10) +
  (bookmarks * 8) +
  (avg_scroll_depth * 0.5) +
  (shares * 15)
) / sqrt(hours_since_published + 1)
```

The `sqrt(hours)` ensures fresh content gets a chance while older viral content stays relevant.

---

### 3. **For You Feed Algorithm**

**Step 1: Candidate Generation (Fast, Broad)**

- Pull last 1000 published posts
- Filter out posts user already read (completed = true)
- Filter out posts from blocked authors (future feature)

**Step 2: Ranking (Personalized)**
For each candidate post, calculate:

```
personalized_score = (
  (category_interest_score * 0.40) +
  (author_affinity_score * 0.30) +
  (content_quality_score * 0.20) +
  (freshness_boost * 0.10)
)
```

**Step 3: Diversification**

- Don't show 3+ posts from same author in a row
- Mix categories (70% preferred, 30% exploration)
- Inject 1 "exploration" post every 5 posts (from low-interest categories to expand taste)

**Step 4: Ranking Boosts**
| Condition | Boost |
|-----------|-------|
| Author user follows | +50% |
| Post is < 6 hours old | +20% |
| User's home state matches author | +10% |
| Post is trending | +15% |

---

## 📊 DATABASE SCHEMA ADDITIONS

```sql
-- User interest scores per category
CREATE TABLE user_interests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category post_category NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, category)
);

-- Reading history with engagement metrics
CREATE TABLE reading_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  scroll_depth INTEGER NOT NULL DEFAULT 0,
  time_spent INTEGER NOT NULL DEFAULT 0,
  completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, post_id)
);

-- Author affinity scores
CREATE TABLE user_author_affinity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  score INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, author_id)
);

-- Indexes for fast queries
CREATE INDEX reading_history_user_idx ON reading_history(user_id);
CREATE INDEX reading_history_post_idx ON reading_history(post_id);
CREATE INDEX user_interests_user_idx ON user_interests(user_id);
CREATE INDEX user_author_affinity_user_idx ON user_author_affinity(user_id);
```

---

## 🔄 SIGNAL CAPTURE FLOW

### 1. **Track Reading Progress** (Client-Side)

```typescript
// useReadingTracker hook
// - Track scroll depth with IntersectionObserver
// - Track time on page
// - Send beacon on page leave/close
```

### 2. **Update Interest Scores** (Server Action)

When user engages, update their interest profile:

```typescript
async function updateUserInterests(
  userId: string,
  postId: string,
  action: EngagementAction
) {
  const post = await getPost(postId);
  const weights = {
    view: 1,
    read_50: 5,
    read_100: 10,
    reaction: 15,
    bookmark: 20,
    comment: 25,
    follow_author: 30,
  };

  // Update category interest
  await upsertUserInterest(userId, post.category, weights[action]);

  // Update author affinity
  await upsertAuthorAffinity(userId, post.authorId, weights[action]);
}
```

---

## 🖥️ FRONTEND COMPONENTS

### 1. **For You Feed** (`/` or `/for-you`)

- Infinite scroll with personalized ranking
- "Based on your interests" section header
- Mix of followed authors + discovery

### 2. **Following Feed** (`/following`)

- Only posts from followed authors
- Chronological order

### 3. **Trending Feed** (`/trending`)

- Quality score ranking
- "Trending in [Category]" sections

### 4. **Explore** (`/explore`)

- Categories user hasn't engaged with
- "Discover new topics"

---

## 📈 COLD START STRATEGY

**New Users (No History):**

1. Use trending posts for first feed
2. Ask for 3 preferred categories on registration (optional)
3. Use location (state) to boost local authors
4. After 5 engagements, start personalizing

**New Posts (No Engagement):**

1. Show to followers first
2. Small "new content" pool for exploration slots
3. Boost based on author's historical quality

---

## 🛠️ IMPLEMENTATION PHASES

### Phase 1: Foundation (Current Sprint)

- [x] Add database tables
- [ ] Create reading tracker hook
- [ ] Implement trackEngagement action
- [ ] Build basic For You query

### Phase 2: Ranking

- [ ] Implement quality scoring
- [ ] Build personalized ranking algorithm
- [ ] Add diversification logic

### Phase 3: UI

- [ ] For You feed component
- [ ] Following feed component
- [ ] Feed switcher tabs

### Phase 4: Optimization

- [ ] Cache hot user interests in Redis
- [ ] Precompute quality scores hourly
- [ ] A/B test ranking weights

---

## 📁 FILE STRUCTURE

```
src/
  lib/
    personalization/
      types.ts           # EngagementAction, UserInterests, etc.
      track-engagement.ts # Server action to record signals
      update-interests.ts # Update interest scores
      for-you-query.ts   # Personalized feed query
      quality-score.ts   # Calculate post quality
  components/
    features/
      ReadingTracker.tsx  # Client-side scroll/time tracking
      ForYouFeed.tsx      # Personalized feed component
      FeedSwitcher.tsx    # Tabs: For You | Following | Trending
  app/
    (public)/
      page.tsx           # Uses ForYouFeed
      following/
        page.tsx         # Following-only feed
      trending/
        page.tsx         # Trending feed
```

---

## 🎯 SUCCESS METRICS

| Metric                 | Target                |
| ---------------------- | --------------------- |
| Avg. Scroll Depth      | > 60%                 |
| Session Duration       | > 8 minutes           |
| Posts Read per Session | > 5                   |
| Return Rate (7-day)    | > 40%                 |
| Follow Rate            | > 15% of active users |

---

This is the blueprint. Ready to implement! 🚀
