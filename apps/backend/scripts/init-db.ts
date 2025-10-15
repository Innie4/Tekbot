import 'reflect-metadata';
import { Pool } from 'pg';

function getDbNames(urlStr: string) {
  const url = new URL(urlStr);
  const targetDb = (url.pathname || '/tekbot').replace('/', '') || 'tekbot';
  // Connect to the default 'postgres' database to issue CREATE DATABASE
  const adminUrl = new URL(urlStr);
  adminUrl.pathname = '/postgres';
  return { targetDb, adminUrl: adminUrl.toString() };
}

async function ensureDatabase() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not set.');
  }

  const { targetDb, adminUrl } = getDbNames(databaseUrl);
  const pool = new Pool({ connectionString: adminUrl });
  try {
    const result = await pool.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [targetDb]
    );

    if (result.rowCount === 0) {
      await pool.query(`CREATE DATABASE "${targetDb}"`);
      console.log(`Database '${targetDb}' created.`);
    } else {
      console.log(`Database '${targetDb}' already exists.`);
    }
  } finally {
    await pool.end();
  }
}

ensureDatabase()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Failed to ensure database:', err);
    process.exit(1);
  });