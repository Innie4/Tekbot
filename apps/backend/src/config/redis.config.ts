import { registerAs } from '@nestjs/config';

export const redisConfig = registerAs('redis', () => ({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT, 10) || 6379,
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB, 10) || 0,
  keyPrefix: process.env.REDIS_KEY_PREFIX || 'tekbot:',
  retryAttempts: parseInt(process.env.REDIS_RETRY_ATTEMPTS, 10) || 3,
  retryDelay: parseInt(process.env.REDIS_RETRY_DELAY, 10) || 3000,
  maxRetriesPerRequest: parseInt(process.env.REDIS_MAX_RETRIES_PER_REQUEST, 10) || 3,
  lazyConnect: process.env.REDIS_LAZY_CONNECT === 'true',
  keepAlive: parseInt(process.env.REDIS_KEEP_ALIVE, 10) || 30000,
  family: parseInt(process.env.REDIS_FAMILY, 10) || 4,
  connectTimeout: parseInt(process.env.REDIS_CONNECT_TIMEOUT, 10) || 10000,
  commandTimeout: parseInt(process.env.REDIS_COMMAND_TIMEOUT, 10) || 5000,
}));