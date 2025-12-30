import dotenv from "dotenv";
import postgres from "postgres";

dotenv.config({ path: ".env.local" });
dotenv.config();

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("Missing DATABASE_URL in environment.");
  process.exit(1);
}

const sql = postgres(databaseUrl, {
  max: 1,
});

try {
  await sql`ALTER TABLE posts ADD COLUMN IF NOT EXISTS video_url STRING;`;

  try {
    await sql`CREATE TYPE IF NOT EXISTS reaction_value AS ENUM ('up', 'down');`;
  } catch (err) {
    const message = err?.message ? String(err.message) : "";
    const alreadyExists = /already exists/i.test(message);
    if (!alreadyExists) throw err;
  }

  await sql`
    CREATE TABLE IF NOT EXISTS post_reactions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      value reaction_value NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `;

  await sql`
    CREATE UNIQUE INDEX IF NOT EXISTS post_reactions_post_user_unique
    ON post_reactions (post_id, user_id);
  `;

  console.log("Migration completed: video_url + post_reactions are ready.");
} finally {
  await sql.end({ timeout: 5 });
}
