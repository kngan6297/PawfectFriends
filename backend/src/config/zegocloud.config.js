import dotenv from 'dotenv';

dotenv.config();

export const zegocloudConfig = {
  appID: parseInt(process.env.ZEGOCLOUD_APP_ID) || 0,
  serverSecret: process.env.ZEGOCLOUD_SERVER_SECRET || '',
  tokenExpiration: parseInt(process.env.ZEGOCLOUD_TOKEN_EXPIRATION) || 7200, // 2 hours in seconds
  enableLog: process.env.ZEGOCLOUD_ENABLE_LOG === 'true',
  logLevel: process.env.ZEGOCLOUD_LOG_LEVEL || 'info',
};

export default zegocloudConfig;
