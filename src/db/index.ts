import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";

import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("Missing DATABASE_URL in environment (.env.local)");
}

const queryClient = postgres(connectionString, {
  max: 10,
  prepare: false,
  ssl: "require",
  // CockroachDB Serverless can pause after inactivity; allow 15s for cold-start wake-up.
  connect_timeout: 15,
  idle_timeout: 30,
  // Keep connections alive with periodic pings
  keep_alive: 30,
});

export const db = drizzle(queryClient, { schema });
export { schema };
