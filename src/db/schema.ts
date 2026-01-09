import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

// ============================================
// 👑 KING BLOGGERS V2 - DATABASE SCHEMA
// ============================================
// The Addiction Engine: Follows, Notifications,
// Rich Reactions, Views, Bookmarks
// ============================================

export const userRoleEnum = pgEnum("user_role", ["reader", "blogger"]);
export const postStatusEnum = pgEnum("post_status", ["draft", "published"]);
export const postCategoryEnum = pgEnum("post_category", [
  "tech",
  "art_culture",
  "entertainment",
  "politics",
  "economics",
  "religion",
]);

// V2: Expanded reactions for more engagement
export const reactionValueEnum = pgEnum("reaction_value", [
  "up",
  "down",
  "fire",      // 🔥 Fire
  "gem",       // 💎 Gem
  "crown",     // 👑 Crown
  "insightful", // 💡 Insightful
  "lol",       // 😂 LOL
]);

// V2: Notification types
export const notificationTypeEnum = pgEnum("notification_type", [
  "comment",     // Someone commented on your post
  "reaction",    // Someone reacted to your post
  "follow",      // Someone followed you
  "mention",     // Someone mentioned you
  "post",        // Someone you follow posted
]);

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  name: text("name"),
  imageUrl: text("image_url"),
  passwordHash: text("password_hash"),
  role: userRoleEnum("role").notNull().default("reader"),
  state: text("state"),
  lga: text("lga"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const posts = pgTable("posts", {
  id: uuid("id").defaultRandom().primaryKey(),
  authorId: uuid("author_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  slug: varchar("slug", { length: 256 }).notNull().unique(),
  excerpt: text("excerpt"),
  content: text("content").notNull(),
  category: postCategoryEnum("category").notNull(),
  coverImageUrl: text("cover_image_url"),
  videoUrl: text("video_url"),
  status: postStatusEnum("status").notNull().default("draft"),
  // V2: Cached counts for performance (denormalized)
  viewCount: integer("view_count").notNull().default(0),
  reactionCount: integer("reaction_count").notNull().default(0),
  commentCount: integer("comment_count").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const postReactions = pgTable(
  "post_reactions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    postId: uuid("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    value: reactionValueEnum("value").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    postUserUnique: uniqueIndex("post_reactions_post_user_unique").on(
      t.postId,
      t.userId
    ),
  })
);

export const comments = pgTable("comments", {
  id: uuid("id").defaultRandom().primaryKey(),
  postId: uuid("post_id")
    .notNull()
    .references(() => posts.id, { onDelete: "cascade" }),
  authorId: uuid("author_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  body: text("body").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const newsletterSubscribers = pgTable("newsletter_subscribers", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ============================================
// 👑 V2: ADDICTION ENGINE TABLES
// ============================================

/**
 * Follows - User follow relationships
 * Enables "Following" feed and social connections
 */
export const follows = pgTable(
  "follows",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    followerId: uuid("follower_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    followingId: uuid("following_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    followUnique: uniqueIndex("follows_unique").on(t.followerId, t.followingId),
    followerIdx: index("follows_follower_idx").on(t.followerId),
    followingIdx: index("follows_following_idx").on(t.followingId),
  })
);

/**
 * Notifications - Real-time user alerts
 * Pulls users back with engagement updates
 */
export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: notificationTypeEnum("type").notNull(),
    actorId: uuid("actor_id").references(() => users.id, { onDelete: "set null" }),
    postId: uuid("post_id").references(() => posts.id, { onDelete: "cascade" }),
    message: text("message"),
    read: boolean("read").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    userIdx: index("notifications_user_idx").on(t.userId),
    userUnreadIdx: index("notifications_user_unread_idx").on(t.userId, t.read),
  })
);

/**
 * Post Views - Track individual views
 * Deduplicated by IP for accurate counts
 */
export const postViews = pgTable(
  "post_views",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    postId: uuid("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    viewerIp: varchar("viewer_ip", { length: 45 }), // IPv6 support
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    postIdx: index("post_views_post_idx").on(t.postId),
    // Dedupe by post + IP within a time window
    postIpIdx: index("post_views_post_ip_idx").on(t.postId, t.viewerIp),
  })
);

/**
 * Bookmarks - Save posts for later
 * Enables offline reading and collections
 */
export const bookmarks = pgTable(
  "bookmarks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    postId: uuid("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    bookmarkUnique: uniqueIndex("bookmarks_unique").on(t.userId, t.postId),
    userIdx: index("bookmarks_user_idx").on(t.userId),
  })
);

// ============================================
// 👑 TYPE EXPORTS
// ============================================

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;

export type PostReaction = typeof postReactions.$inferSelect;
export type Comment = typeof comments.$inferSelect;
export type Follow = typeof follows.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type PostView = typeof postViews.$inferSelect;
export type Bookmark = typeof bookmarks.$inferSelect;

export type ReactionValue = (typeof reactionValueEnum.enumValues)[number];
export type NotificationType = (typeof notificationTypeEnum.enumValues)[number];
export type PostCategory = (typeof postCategoryEnum.enumValues)[number];
export type UserRole = (typeof userRoleEnum.enumValues)[number];
