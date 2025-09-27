import { drizzle } from "drizzle-orm/node-postgres";

import * as schema from "@/initalizers/db/drizzle/schema";
import * as relations from "@/initalizers/db/drizzle/relations";
import { Pool } from "pg";

let connection: Pool;

if (process.env.NODE_ENV === "production") {
  connection = new Pool({ connectionString: process.env.DATABASE_URL! });
} else {
  const globalConnection = global as typeof globalThis & {
    connection: Pool;
  };

  if (!globalConnection.connection)
    globalConnection.connection = new Pool({
      connectionString: process.env.DATABASE_URL!,
    });

  connection = globalConnection.connection;
}

const db = drizzle(connection, { schema: { ...schema, ...relations } });

export default db;
