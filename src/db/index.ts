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
  // Fail faster on flaky networks (Cockroach Cloud) to avoid 40s+ hangs in callbacks.
  connect_timeout: 5,
  idle_timeout: 20,
});

export const db = drizzle(queryClient, { schema });
export { schema };
