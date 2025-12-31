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
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS name STRING;`;
  console.log("Migration completed: users.name column is ready.");
} finally {
  await sql.end({ timeout: 5 });
}
