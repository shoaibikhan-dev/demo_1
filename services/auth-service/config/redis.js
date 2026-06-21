const Redis = require('ioredis');

const redisClient = new Redis({
  host: process.env.REDIS_HOST || 'redis',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => Math.min(times * 100, 3000),
  reconnectOnError: (err) => err.message.includes('READONLY'),
});

redisClient.on('error',   (err) => console.error('❌ Redis error:', err.message));
redisClient.on('connect', ()    => console.log('✅ Redis connected successfully'));

const connectRedis = async () => {
  try {
    await redisClient.ping();
  } catch (error) {
    console.error('❌ Redis connection failed:', error.message);
  }
};

module.exports = { redisClient, connectRedis };
