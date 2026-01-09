// ============================================
// 👑 KING BLOGGERS V2 - Migration Script
// ============================================
// Safely applies V2 schema changes to CockroachDB
// Handles existing enums gracefully
// ============================================

import { config as loadEnv } from "dotenv";
import postgres from "postgres";

// Load from .env.local
loadEnv({ path: ".env.local" });

if (!process.env.DATABASE_URL) {
  console.error("❌ Missing DATABASE_URL in .env.local");
  process.exit(1);
}

const sql = postgres(process.env.DATABASE_URL, { ssl: "require" });

async function migrate() {
  console.log("👑 KING BLOGGERS V2 Migration Starting...\n");

  try {
    // Step 1: Add new enum values (CockroachDB safe)
    console.log("📌 Step 1: Expanding reaction_value enum...");
    const newReactionValues = ["fire", "gem", "crown", "insightful", "lol"];
    for (const val of newReactionValues) {
      try {
        await sql`ALTER TYPE reaction_value ADD VALUE IF NOT EXISTS ${sql.unsafe(`'${val}'`)}`;
        console.log(`   ✓ Added '${val}'`);
      } catch (e) {
        if (e.code === "42710") {
          console.log(`   - '${val}' already exists`);
        } else {
          throw e;
        }
      }
    }

    // Step 2: Create notification_type enum if not exists
    console.log("\n📌 Step 2: Creating notification_type enum...");
    try {
      await sql`
        CREATE TYPE notification_type AS ENUM (
          'comment', 'reaction', 'follow', 'mention', 'post'
        )
      `;
      console.log("   ✓ Created notification_type enum");
    } catch (e) {
      if (e.code === "42710") {
        console.log("   - notification_type already exists");
      } else {
        throw e;
      }
    }

    // Step 3: Add columns to posts table
    console.log("\n📌 Step 3: Adding count columns to posts...");
    const postColumns = [
      ["view_count", "INTEGER DEFAULT 0 NOT NULL"],
      ["reaction_count", "INTEGER DEFAULT 0 NOT NULL"],
      ["comment_count", "INTEGER DEFAULT 0 NOT NULL"],
    ];
    for (const [col, type] of postColumns) {
      try {
        await sql.unsafe(`ALTER TABLE posts ADD COLUMN IF NOT EXISTS ${col} ${type}`);
        console.log(`   ✓ Added ${col}`);
      } catch (e) {
        if (e.code === "42701") {
          console.log(`   - ${col} already exists`);
        } else {
          throw e;
        }
      }
    }

    // Step 4: Create follows table
    console.log("\n📌 Step 4: Creating follows table...");
    await sql`
      CREATE TABLE IF NOT EXISTS follows (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        following_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `;
    console.log("   ✓ Created follows table");
    
    // Create indexes
    await sql`CREATE UNIQUE INDEX IF NOT EXISTS follows_unique ON follows (follower_id, following_id)`;
    await sql`CREATE INDEX IF NOT EXISTS follows_follower_idx ON follows (follower_id)`;
    await sql`CREATE INDEX IF NOT EXISTS follows_following_idx ON follows (following_id)`;
    console.log("   ✓ Created indexes");

    // Step 5: Create notifications table
    console.log("\n📌 Step 5: Creating notifications table...");
    await sql`
      CREATE TABLE IF NOT EXISTS notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type notification_type NOT NULL,
        actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
        post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
        message TEXT,
        read BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `;
    console.log("   ✓ Created notifications table");
    
    await sql`CREATE INDEX IF NOT EXISTS notifications_user_idx ON notifications (user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS notifications_user_unread_idx ON notifications (user_id, read)`;
    console.log("   ✓ Created indexes");

    // Step 6: Create post_views table
    console.log("\n📌 Step 6: Creating post_views table...");
    await sql`
      CREATE TABLE IF NOT EXISTS post_views (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
        viewer_ip VARCHAR(45),
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `;
    console.log("   ✓ Created post_views table");
    
    await sql`CREATE INDEX IF NOT EXISTS post_views_post_idx ON post_views (post_id)`;
    await sql`CREATE INDEX IF NOT EXISTS post_views_post_ip_idx ON post_views (post_id, viewer_ip)`;
    console.log("   ✓ Created indexes");

    // Step 7: Create bookmarks table
    console.log("\n📌 Step 7: Creating bookmarks table...");
    await sql`
      CREATE TABLE IF NOT EXISTS bookmarks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `;
    console.log("   ✓ Created bookmarks table");
    
    await sql`CREATE UNIQUE INDEX IF NOT EXISTS bookmarks_unique ON bookmarks (user_id, post_id)`;
    await sql`CREATE INDEX IF NOT EXISTS bookmarks_user_idx ON bookmarks (user_id)`;
    console.log("   ✓ Created indexes");

    console.log("\n✅ V2 Migration Complete!");
    console.log("\n📊 Summary:");
    console.log("   - Expanded reaction_value enum with 5 new values");
    console.log("   - Created notification_type enum");
    console.log("   - Added view_count, reaction_count, comment_count to posts");
    console.log("   - Created follows table with indexes");
    console.log("   - Created notifications table with indexes");
    console.log("   - Created post_views table with indexes");
    console.log("   - Created bookmarks table with indexes");

  } catch (error) {
    console.error("\n❌ Migration failed:", error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

migrate();
