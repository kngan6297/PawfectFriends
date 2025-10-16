import Redis from 'ioredis';
import { config } from './config.js';

// Check if Redis is configured
const isRedisConfigured = config.redis.enabled && config.redis.host;

export const redisConfig = {
  // Connection settings
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password,

  // Connection options
  retryStrategy: () => {
    return 1000; // Return 1 second delay
  },
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  showFriendlyErrorStack: process.env.NODE_ENV === 'development',

  // Pool settings
  enableOfflineQueue: true,
  connectTimeout: 10000,
  disconnectTimeout: 2000,

  // Cache settings
  keyPrefix: 'pawfect_friends:',
  defaultTTL: 3600, // 1 hour in seconds

  // Cache keys
  keys: {
    recommendations: (userId) => `recommendations:${userId}`,
    userPreferences: (userId) => `preferences:${userId}`,
    petDetails: (petId) => `pet:${petId}`,
  },

  // Error handling
  onError: (error) => {
    console.error('Redis error:', error);
  },

  // Connection events
  onConnect: () => {
    console.log('Connected to Redis');
  },

  onReady: () => {
    console.log('Redis client ready');
  },

  onReconnecting: () => {
    console.log('Reconnecting to Redis...');
  },

  onEnd: () => {
    console.log('Redis connection ended');
  },
};

// Create Redis client only if configured, otherwise export dummy client
export const redisClient = isRedisConfigured
  ? new Redis(redisConfig)
  : {
      get: async () => null,
      set: async () => null,
      del: async () => null,
      keys: async () => [],
      ttl: async () => -1,
      on: () => {},
      off: () => {},
      connect: async () => {},
      disconnect: async () => {},
    };

export default redisClient;
