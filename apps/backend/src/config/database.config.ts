import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  url: process.env.DATABASE_URL,
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT, 10) || 5432,
  username: process.env.DATABASE_USERNAME || 'tekbot_user',
  password: process.env.DATABASE_PASSWORD || 'tekbot_password',
  database: process.env.DATABASE_NAME || 'tekbot_dev',
  schema: process.env.DATABASE_SCHEMA || 'public',
  ssl:
    process.env.NODE_ENV === 'production'
      ? { rejectUnauthorized: false }
      : false,
  logging: process.env.NODE_ENV === 'development',
  synchronize: false, // Always use migrations in production
  migrationsRun: process.env.NODE_ENV === 'production',
  maxConnections: parseInt(process.env.DATABASE_MAX_CONNECTIONS, 10) || 10,
  acquireTimeout: parseInt(process.env.DATABASE_ACQUIRE_TIMEOUT, 10) || 60000,
  timeout: parseInt(process.env.DATABASE_TIMEOUT, 10) || 60000,
  retryAttempts: parseInt(process.env.DATABASE_RETRY_ATTEMPTS, 10) || 3,
  retryDelay: parseInt(process.env.DATABASE_RETRY_DELAY, 10) || 3000,
}));

export const databaseConfig = registerAs('database', () => ({
  url: process.env.DATABASE_URL,
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT, 10) || 5432,
  username: process.env.DATABASE_USERNAME || 'tekbot_user',
  password: process.env.DATABASE_PASSWORD || 'tekbot_password',
  database: process.env.DATABASE_NAME || 'tekbot_dev',
  schema: process.env.DATABASE_SCHEMA || 'public',
  ssl:
    process.env.NODE_ENV === 'production'
      ? { rejectUnauthorized: false }
      : false,
  logging: process.env.NODE_ENV === 'development',
  synchronize: false,
  migrationsRun: process.env.NODE_ENV === 'production',
  maxConnections: parseInt(process.env.DATABASE_MAX_CONNECTIONS, 10) || 10,
  acquireTimeout: parseInt(process.env.DATABASE_ACQUIRE_TIMEOUT, 10) || 60000,
  timeout: parseInt(process.env.DATABASE_TIMEOUT, 10) || 60000,
  retryAttempts: parseInt(process.env.DATABASE_RETRY_ATTEMPTS, 10) || 3,
  retryDelay: parseInt(process.env.DATABASE_RETRY_DELAY, 10) || 3000,
}));
