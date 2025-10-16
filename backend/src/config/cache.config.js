import NodeCache from 'node-cache';

// Cache configuration
const cacheConfig = {
  // Standard TTL in seconds
  stdTTL: 3600, // 1 hour

  // Check for expired keys every 600 seconds (10 minutes)
  checkperiod: 600,

  // Use object cloning to prevent cache pollution
  useClones: false,

  // Maximum number of keys that can be stored
  maxKeys: 1000,
};

// Cache keys
export const cacheKeys = {
  recommendations: (userId) => `recommendations:${userId}`,
  userPreferences: (userId) => `preferences:${userId}`,
  petDetails: (petId) => `pet:${petId}`,
};

// Initialize cache
export const cache = new NodeCache(cacheConfig);

// Cache wrapper with error handling
export const cacheWrapper = {
  get: async (key) => {
    try {
      return cache.get(key);
    } catch (error) {
      console.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  },

  set: async (key, value, ttl = cacheConfig.stdTTL) => {
    try {
      return cache.set(key, value, ttl);
    } catch (error) {
      console.error(`Cache set error for key ${key}:`, error);
      return false;
    }
  },

  del: async (key) => {
    try {
      return cache.del(key);
    } catch (error) {
      console.error(`Cache delete error for key ${key}:`, error);
      return false;
    }
  },

  clear: async () => {
    try {
      return cache.flushAll();
    } catch (error) {
      console.error('Cache clear error:', error);
      return false;
    }
  },

  getStats: () => {
    try {
      return cache.getStats();
    } catch (error) {
      console.error('Cache stats error:', error);
      return null;
    }
  },
};
