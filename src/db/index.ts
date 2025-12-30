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
});

export const db = drizzle(queryClient, { schema });
export { schema };
