import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema/index';

type DrizzleDB = ReturnType<typeof drizzle<typeof schema>>;

let _db: DrizzleDB | null = null;

function getDb(): DrizzleDB {
  if (_db) return _db;
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL is not set');
  }
  _db = drizzle(neon(url), { schema });
  return _db;
}

export const db = new Proxy({} as DrizzleDB, {
  get(_target, prop) {
    return Reflect.get(getDb() as object, prop);
  },
});

export type DB = DrizzleDB;
