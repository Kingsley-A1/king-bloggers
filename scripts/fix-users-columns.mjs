// ============================================
// 👑 KING BLOGGERS - Fix Missing Users Columns
// ============================================
// Adds missing `name` and `image_url` columns to users table
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

async function fix() {
  console.log("👑 Fixing missing users columns...\n");

  try {
    // Add name column if not exists
    console.log("📌 Adding 'name' column to users...");
    try {
      await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS name TEXT`;
      console.log("   ✓ Added 'name' column");
    } catch (e) {
      if (e.code === "42701") {
        console.log("   - 'name' column already exists");
      } else {
        throw e;
      }
    }

    // Add image_url column if not exists
    console.log("📌 Adding 'image_url' column to users...");
    try {
      await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS image_url TEXT`;
      console.log("   ✓ Added 'image_url' column");
    } catch (e) {
      if (e.code === "42701") {
        console.log("   - 'image_url' column already exists");
      } else {
        throw e;
      }
    }

    console.log("\n✅ Fix complete! Users can now register and login.");
  } catch (error) {
    console.error("\n❌ Fix failed:", error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

fix();
