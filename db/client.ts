import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { sql } from 'drizzle-orm';
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

  // Dev-only warning: alert if the users table is empty so login failures are obvious.
  if (process.env.NODE_ENV !== 'production') {
    _db.select({ count: sql<number>`count(*)` }).from(schema.users)
      .then((res) => {
        if (res[0]?.count === 0) {
          console.warn(
            '\n⚠️  [db/client] The users table is empty. Demo logins will fall back to MOCK_USERS, but seeded data is missing.\n   Run: npm run db:seed\n'
          );
        }
      })
      .catch(() => {
        // Silently ignore — DB may not be reachable during build or tests.
      });
  }

  return _db;
}

export const db = new Proxy({} as DrizzleDB, {
  get(_target, prop) {
    return Reflect.get(getDb() as object, prop);
  },
});

export type DB = DrizzleDB;
