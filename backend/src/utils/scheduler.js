import cron from 'node-cron';
import logger from './logger.js';
// import { cleanupExpiredTokens } from '../modules/auth/auth.service.js';

/**
 * Initialize all scheduled tasks
 */
export const initializeScheduledTasks = () => {
  // Clean up expired tokens every day at midnight
  cron.schedule('0 0 * * *', async () => {
    try {
      logger.info('Starting scheduled token cleanup');
      // const result = await cleanupExpiredTokens();
      logger.info('Scheduled token cleanup completed');
    } catch (error) {
      logger.error('Scheduled token cleanup failed:', error);
    }
  });

  // Comment out Redis-related cleanup
  /*
  // Schedule token cleanup
  setInterval(cleanupExpiredTokens, 1000 * 60 * 60); // Run every hour
  */

  // Add other scheduled tasks here

  logger.info('Scheduled tasks initialized');
};
