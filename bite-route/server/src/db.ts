import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from './schema.js';

const url = process.env.DATABASE_URL;
export const sqlClient = url ? postgres(url, { ssl: 'require', max: 5 }) : null;
export const db = sqlClient ? drizzle(sqlClient, { schema }) : null;
export const databaseEnabled = Boolean(db);
