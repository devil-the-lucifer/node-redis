// const { Redis} = require('ioredis');

// const redisClient = new Redis();

// module.exports ={
//     redisClient   
// }



const Redis = require('ioredis');


const redisClientService = async () => {
  // Create a new Redis client using ioredis
  const client = new Redis(process.env.REDIS_URI, {
    reconnectOnError: (err) => {
      console.error(`Redis Client Error: ${err.message}`);
      return true; // Reconnect on error
    },
    connectTimeout: 20000, // Set connection timeout to 20 seconds
    keepAlive: 5000, // Keep connection alive every 5 seconds
  });

  client.on('connect', () => {
    console.log('Redis connected successfully.');
  });

  client.on('error', (err) => {
    console.error(`Redis Client Error: ${err.message}`);
    throw new Error(`Redis Client Error: ${err.message}`);
  });

  client.on('close', () => {
    console.log('Redis connection closed.');
  });

  client.on('end', () => {
    console.log('Redis connection ended.');
  });

  try {
    await client.ping(); // Check if the connection is alive
    console.log('Redis PING successful.');
  } catch (err) {
    console.error(`Redis connection failed: ${err.message}`);
    throw new Error(`Redis connection failed: ${err.message}`);
  }

  return client;
};

// To close the Redis connection when your app shuts down gracefully
const closeRedisClientService = async (client) => {
  if (client) {
    await client.quit();
    console.log('Redis connection closed successfully.');
  }
};

module.exports = {
  redisClientService,
  closeRedisClientService
};



