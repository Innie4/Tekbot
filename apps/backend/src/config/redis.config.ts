import { registerAs } from '@nestjs/config';

export const redisConfig = registerAs('redis', () => ({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT, 10) || 6379,
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB, 10) || 0,
  keyPrefix: process.env.REDIS_KEY_PREFIX || 'tekbot:',
  retryDelayOnFailover: parseInt(process.env.REDIS_RETRY_DELAY_ON_FAILOVER, 10) || 100,
  enableReadyCheck: process.env.REDIS_ENABLE_READY_CHECK !== 'false',
  maxRetriesPerRequest: parseInt(process.env.REDIS_MAX_RETRIES_PER_REQUEST, 10) || 3,
  lazyConnect: process.env.REDIS_LAZY_CONNECT === 'true',
  keepAlive: parseInt(process.env.REDIS_KEEP_ALIVE, 10) || 30000,
  family: parseInt(process.env.REDIS_FAMILY, 10) || 4, // 4 (IPv4) or 6 (IPv6)
  connectTimeout: parseInt(process.env.REDIS_CONNECT_TIMEOUT, 10) || 10000,
  commandTimeout: parseInt(process.env.REDIS_COMMAND_TIMEOUT, 10) || 5000,
  
  // Cluster configuration (if using Redis Cluster)
  cluster: {
    enabled: process.env.REDIS_CLUSTER_ENABLED === 'true',
    nodes: process.env.REDIS_CLUSTER_NODES ? 
      process.env.REDIS_CLUSTER_NODES.split(',').map(node => {
        const [host, port] = node.split(':');
        return { host, port: parseInt(port, 10) };
      }) : [],
    options: {
      redisOptions: {
        password: process.env.REDIS_PASSWORD,
      },
    },
  },
  
  // Sentinel configuration (if using Redis Sentinel)
  sentinel: {
    enabled: process.env.REDIS_SENTINEL_ENABLED === 'true',
    sentinels: process.env.REDIS_SENTINELS ? 
      process.env.REDIS_SENTINELS.split(',').map(sentinel => {
        const [host, port] = sentinel.split(':');
        return { host, port: parseInt(port, 10) };
      }) : [],
    name: process.env.REDIS_SENTINEL_NAME || 'mymaster',
    password: process.env.REDIS_SENTINEL_PASSWORD,
  },
  
  // TLS configuration
  tls: {
    enabled: process.env.REDIS_TLS_ENABLED === 'true',
    cert: process.env.REDIS_TLS_CERT,
    key: process.env.REDIS_TLS_KEY,
    ca: process.env.REDIS_TLS_CA,
    rejectUnauthorized: process.env.REDIS_TLS_REJECT_UNAUTHORIZED !== 'false',
  },
  
  // Connection pool settings
  pool: {
    min: parseInt(process.env.REDIS_POOL_MIN, 10) || 2,
    max: parseInt(process.env.REDIS_POOL_MAX, 10) || 10,
    acquireTimeoutMillis: parseInt(process.env.REDIS_POOL_ACQUIRE_TIMEOUT, 10) || 60000,
    createTimeoutMillis: parseInt(process.env.REDIS_POOL_CREATE_TIMEOUT, 10) || 30000,
    destroyTimeoutMillis: parseInt(process.env.REDIS_POOL_DESTROY_TIMEOUT, 10) || 5000,
    idleTimeoutMillis: parseInt(process.env.REDIS_POOL_IDLE_TIMEOUT, 10) || 30000,
    reapIntervalMillis: parseInt(process.env.REDIS_POOL_REAP_INTERVAL, 10) || 1000,
    createRetryIntervalMillis: parseInt(process.env.REDIS_POOL_CREATE_RETRY_INTERVAL, 10) || 200,
  },
}));