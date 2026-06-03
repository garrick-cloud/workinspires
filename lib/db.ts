import { Pool } from 'pg';

declare global {
  var workinspiresPool: Pool | undefined;
}

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not configured.');
}

const pool =
  global.workinspiresPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
  });

if (process.env.NODE_ENV !== 'production') {
  global.workinspiresPool = pool;
}

export default pool;
