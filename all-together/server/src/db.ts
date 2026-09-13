import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema.js';

const databaseUrl = process.env.DATABASE_URL;

export const databaseEnabled = Boolean(databaseUrl);

const client = databaseUrl
  ? postgres(databaseUrl, {
      prepare: false,
      max: 5,
      idle_timeout: 20,
      connect_timeout: 10,
    })
  : null;

export const db = client ? drizzle(client, { schema }) : null;

export async function closeDatabase() {
  if (client) await client.end();
}
