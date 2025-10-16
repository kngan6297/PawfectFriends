export const config = {
  // ... existing config ...

  redis: {
    host: process.env.REDIS_HOST || null, // null means no-op
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    password: process.env.REDIS_PASSWORD || '',
    enabled: process.env.REDIS_HOST ? true : false, // Enable only if host is set
  },

  // ... existing config ...
};
