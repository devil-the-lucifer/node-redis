// const { Redis} = require('ioredis');

// const redisClient = new Redis();

// module.exports ={
//     redisClient   
// }



// const Redis = require('ioredis');


// const redisClientService = async () => {
//   // Create a new Redis client using ioredis
//   const client = new Redis(process.env.REDIS_URI, {
//      tls: {},
//     reconnectOnError: (err) => {
//       console.error(`Redis Client Error: ${err.message}`);
//       return true; // Reconnect on error
//     },
//     connectTimeout: 3000, // Set connection timeout to 20 seconds
//     keepAlive: 5000, // Keep connection alive every 5 seconds
//   });

//   client.on('connect', () => {
//     console.log('Redis connected successfully.');
//   });

//   client.on('error', (err) => {
//     console.error(`Redis Client Error: ${err.message}`);
//     throw new Error(`Redis Client Error: ${err.message}`);
//   });

//   client.on('close', () => {
//     console.log('Redis connection closed.');
//   });

//   client.on('end', () => {
//     console.log('Redis connection ended.');
//   });

//   try {
//     await client.ping(); // Check if the connection is alive
//     console.log('Redis PING successful.');
//   } catch (err) {
//     console.error(`Redis connection failed: ${err.message}`);
//     throw new Error(`Redis connection failed: ${err.message}`);
//   }

//   return client;
// };

// // To close the Redis connection when your app shuts down gracefully
// const closeRedisClientService = async (client) => {
//   if (client) {
//     await client.quit();
//     console.log('Redis connection closed successfully.');
//   }
// };

// module.exports = {
//   redisClientService,
//   closeRedisClientService
// };


// src/utils/redisClient.ts
import logger from '../loaders/logger';
import Redis, { RedisOptions } from 'ioredis';

let redisInstance: Redis | null = null;

// Configuration for DigitalOcean Managed Redis
const redisConfig: RedisOptions = {
  host: process.env.REDIS_HOST, // Managed Redis host
  port: parseInt(process.env.REDIS_PORT || '25061'), // Default port for DO Managed Redis
  password: process.env.REDIS_PASSWORD, // Managed Redis password
  tls: {},
  connectTimeout: 5000, // 5s connection timeout
  maxRetriesPerRequest: 3, // Limit retries
  retryStrategy: (times) => Math.min(times * 100, 3000), // Exponential backoff
  enableOfflineQueue: false, // Disable offline queue to fail fast
  enableReadyCheck: true, // Ensure Redis is ready before accepting commands
  connectionName: 'app-platform-connection', // Identify connection in Redis
};

export const createRedisClient = async (): Promise<Redis> => {
  if (redisInstance && redisInstance.status === 'ready') {
    return redisInstance;
  }

  const client = new Redis(redisConfig);

  // Connection events
  client.on('connect', () => {
    logger.info('Redis: Connecting to DigitalOcean Managed Redis...');
  });

  client.on('ready', () => {
    logger.info('Redis: Connected to DigitalOcean Managed Redis');
  });

  client.on('error', (err) => {
    logger.error(`Redis Managed DB Error: ${err.message}`);
    if (err.message.includes('ECONNREFUSED')) {
      logger.error('Check firewall rules and VPC/private network settings');
    }
  });

  client.on('close', () => {
    logger.warn('Redis: Connection to Managed Redis closed');
  });

  client.on('reconnecting', (delay) => {
    logger.info(`Redis: Reconnecting to Managed Redis in ${delay}ms`);
  });

  // Health check
  setInterval(async () => {
    try {
      await client.ping();
    } catch (err) {
      logger.error('Redis Managed DB health check failed:', err.message);
    }
  }, 30000); // 30s health checks

  try {
    await client.ping();
    logger.info('Redis Managed DB connection validated');
    redisInstance = client;
    return client;
  } catch (err) {
    logger.error('Failed to connect to Redis Managed DB:', err.message);
    throw new Error('Redis Managed DB connection failed');
  }
};

export const closeRedisClient = async (): Promise<void> => {
  if (redisInstance) {
    try {
      await redisInstance.quit();
      logger.info('Redis Managed DB connection closed gracefully');
    } catch (err) {
      logger.error('Error closing Redis Managed DB connection:', err.message);
    } finally {
      redisInstance = null;
    }
  }
};

// Graceful shutdown
process.on('SIGINT', closeRedisClient);
process.on('SIGTERM', closeRedisClient);

// Export singleton instance
export const redisClientService = async (): Promise<Redis> => {
  if (!redisInstance) {
    return createRedisClient();
  }
  return redisInstance;
};


