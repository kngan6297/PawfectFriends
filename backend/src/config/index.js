// Import env.js to load and validate environment variables
import './env.js';

// Environment variables are already loaded and validated by env.js import above
// Now we can access them directly from process.env

const config = {
  redis: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD,
    enabled: process.env.REDIS_HOST ? true : false, // Enable only if host is set
  },
  port: process.env.PORT,
  mongoUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN,
  frontendUrl: process.env.FRONTEND_URL,
  clientUrl: process.env.CLIENT_URL,
  email: {
    smtp: {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    },
    from: process.env.SMTP_USER || 'noreply@pawfectfriends.com',
  },
  smtp: {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  corsOrigin: process.env.CORS_ORIGIN,
  rateLimit: {
    windowMs: process.env.RATE_LIMIT_WINDOW_MS,
    max: process.env.RATE_LIMIT_MAX,
  },
  zego: {
    appId: process.env.ZEGO_APP_ID,
    serverSecret: process.env.ZEGO_SERVER_SECRET,
    callbackSecret: process.env.ZEGO_CALLBACK_SECRET,
    tokenTTL: process.env.ZEGO_TOKEN_TTL,
    // DEPRECATED: These variables are no longer used for authentication
    // - ZEGO_APP_SIGN: Replaced by server-side token generation
    // - ZEGO_SECRET: Replaced by ZEGO_SERVER_SECRET
    // - ZEGO_SERVER: Use ZEGO_APP_ID for client configuration
  },
  fileUpload: {
    provider: process.env.FILE_UPLOAD_PROVIDER,
    uploadDir: process.env.UPLOAD_DIR,
    tempDir: process.env.TEMP_DIR,
    scanFiles: process.env.SCAN_FILES,
    cloudinary: {
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      apiSecret: process.env.CLOUDINARY_API_SECRET,
      folder: process.env.CLOUDINARY_FOLDER,
    },
  },
  ai: {
    serviceUrl: process.env.AI_SERVICE_URL,
    useMLRecommendations: process.env.USE_ML_RECOMMENDATIONS,
    mlWeight: process.env.ML_WEIGHT,
    ruleWeight: process.env.RULE_WEIGHT,
  },
  petfinder: {
    enabled: process.env.USE_PETFINDER_API,
    apiKey: process.env.PETFINDER_API_KEY,
    apiSecret: process.env.PETFINDER_API_SECRET,
  },
  logging: {
    level: process.env.LOG_LEVEL,
    console: process.env.LOG_CONSOLE,
    importSessionId: process.env.IMPORT_SESSION_ID,
  },
  contentModeration: {
    zimEnabled: process.env.ZIM_CONTENT_MODERATION_ENABLED,
  },
  zim: {
    mirrorEnabled: process.env.ZIM_MIRROR_ENABLED,
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
  },
  session: {
    secret: process.env.SESSION_SECRET,
  },
  monitoring: {
    enabled: process.env.ENABLE_MONITORING,
    interval: process.env.MONITORING_INTERVAL,
  },
  baseUrl: process.env.BASE_URL,
};

export default config;
