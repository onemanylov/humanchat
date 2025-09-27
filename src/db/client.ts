import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';

const databasePath = process.env.DATABASE_URL || './.data/sqlite.db';
const sqlite = new Database(databasePath);

export const db = drizzle(sqlite);
