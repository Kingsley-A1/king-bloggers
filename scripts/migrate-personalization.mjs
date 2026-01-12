// ============================================
// 👑 KING BLOGGERS - Personalization Engine Migration
// ============================================
// Creates tables for user interests, reading history,
// and author affinity to power the "For You" feed
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
  console.log("👑 KING BLOGGERS Personalization Engine Migration...\n");

  try {
    // Step 1: Create user_interests table
    console.log("📌 Step 1: Creating user_interests table...");
    await sql`
      CREATE TABLE IF NOT EXISTS user_interests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        category post_category NOT NULL,
        score INTEGER NOT NULL DEFAULT 0,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `;
    console.log("   ✓ Created user_interests table");

    await sql`CREATE UNIQUE INDEX IF NOT EXISTS user_interests_unique ON user_interests (user_id, category)`;
    await sql`CREATE INDEX IF NOT EXISTS user_interests_user_idx ON user_interests (user_id)`;
    console.log("   ✓ Created indexes");

    // Step 2: Create reading_history table
    console.log("\n📌 Step 2: Creating reading_history table...");
    await sql`
      CREATE TABLE IF NOT EXISTS reading_history (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
        scroll_depth INTEGER NOT NULL DEFAULT 0,
        time_spent INTEGER NOT NULL DEFAULT 0,
        completed BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `;
    console.log("   ✓ Created reading_history table");

    await sql`CREATE UNIQUE INDEX IF NOT EXISTS reading_history_unique ON reading_history (user_id, post_id)`;
    await sql`CREATE INDEX IF NOT EXISTS reading_history_user_idx ON reading_history (user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS reading_history_post_idx ON reading_history (post_id)`;
    console.log("   ✓ Created indexes");

    // Step 3: Create user_author_affinity table
    console.log("\n📌 Step 3: Creating user_author_affinity table...");
    await sql`
      CREATE TABLE IF NOT EXISTS user_author_affinity (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        score INTEGER NOT NULL DEFAULT 0,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `;
    console.log("   ✓ Created user_author_affinity table");

    await sql`CREATE UNIQUE INDEX IF NOT EXISTS user_author_affinity_unique ON user_author_affinity (user_id, author_id)`;
    await sql`CREATE INDEX IF NOT EXISTS user_author_affinity_user_idx ON user_author_affinity (user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS user_author_affinity_author_idx ON user_author_affinity (author_id)`;
    console.log("   ✓ Created indexes");

    console.log("\n✅ Personalization Engine Migration Complete!");
    console.log("\n📊 Summary:");
    console.log("   - Created user_interests table (category affinity)");
    console.log("   - Created reading_history table (engagement tracking)");
    console.log("   - Created user_author_affinity table (author preferences)");
    console.log("\n🎯 Ready for 'For You' feed personalization!");
  } catch (error) {
    console.error("\n❌ Migration failed:", error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

migrate();
