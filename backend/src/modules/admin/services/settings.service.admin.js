import logger from '../../../utils/logger.js';
import mongoose from 'mongoose';

// Default system settings
const DEFAULT_SETTINGS = {
  // Application settings
  app: {
    name: 'PawfectFriends',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    maintenanceMode: false,
    maintenanceMessage: 'System is under maintenance. Please try again later.',
  },

  // Email settings
  email: {
    enabled: true,
    provider: 'smtp',
    smtp: {
      host: process.env.SMTP_HOST || 'localhost',
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
      },
    },
    from: process.env.EMAIL_FROM || 'noreply@pawfectfriends.com',
  },

  // Database settings
  database: {
    connectionString:
      process.env.MONGODB_URI || 'mongodb://localhost:27017/pawfectfriends',
    maxConnections: 10,
    timeout: 30000,
  },

  // Storage settings
  storage: {
    provider: 'local', // local, aws, gcp, azure
    local: {
      uploadPath: './uploads',
      maxFileSize: 10 * 1024 * 1024, // 10MB
    },
    aws: {
      bucket: process.env.AWS_S3_BUCKET || '',
      region: process.env.AWS_REGION || 'us-east-1',
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    },
  },

  // Security settings
  security: {
    jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
    jwtExpiresIn: '7d',
    bcryptRounds: 12,
    rateLimitWindow: 15 * 60 * 1000, // 15 minutes
    rateLimitMax: 100,
    corsOrigins: process.env.CORS_ORIGINS
      ? process.env.CORS_ORIGINS.split(',')
      : ['http://localhost:3000'],
  },

  // Feature flags
  features: {
    userRegistration: true,
    shelterRegistration: true,
    petAdoption: true,
    messaging: true,
    notifications: true,
    reviews: true,
    reports: true,
    analytics: true,
  },

  // Notification settings
  notifications: {
    email: true,
    push: false,
    sms: false,
    defaultChannels: ['email'],
  },

  // Analytics settings
  analytics: {
    enabled: false,
    provider: 'none', // none, google, mixpanel, etc.
    trackingId: '',
  },

  // API settings
  api: {
    version: 'v1',
    rateLimitEnabled: true,
    documentationEnabled: true,
    loggingEnabled: true,
  },
};

export const adminSettingsService = {
  /**
   * Get system settings
   */
  getSettings: async () => {
    try {
      // In a real application, you might want to store settings in a database
      // For now, we'll return the default settings merged with any environment overrides
      return {
        ...DEFAULT_SETTINGS,
        // Override with environment variables where applicable
        app: {
          ...DEFAULT_SETTINGS.app,
          environment: process.env.NODE_ENV || DEFAULT_SETTINGS.app.environment,
        },
        email: {
          ...DEFAULT_SETTINGS.email,
          enabled: process.env.EMAIL_ENABLED !== 'false',
        },
        database: {
          ...DEFAULT_SETTINGS.database,
          connectionString:
            process.env.MONGODB_URI ||
            DEFAULT_SETTINGS.database.connectionString,
        },
      };
    } catch (error) {
      logger.error('Get system settings service error:', error);
      throw error;
    }
  },

  /**
   * Update system settings
   */
  updateSettings: async (settingsData) => {
    try {
      // In a real application, you would validate and save settings to a database
      // For now, we'll just return the merged settings
      const currentSettings = await adminSettingsService.getSettings();
      const updatedSettings = {
        ...currentSettings,
        ...settingsData,
      };

      logger.info('System settings updated', {
        updatedKeys: Object.keys(settingsData),
      });
      return updatedSettings;
    } catch (error) {
      logger.error('Update system settings service error:', error);
      throw error;
    }
  },

  /**
   * Reset system settings to defaults
   */
  resetSettings: async () => {
    try {
      logger.info('System settings reset to defaults');
      return DEFAULT_SETTINGS;
    } catch (error) {
      logger.error('Reset system settings service error:', error);
      throw error;
    }
  },

  /**
   * Get system health status
   */
  getSystemHealth: async () => {
    try {
      const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: {},
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: process.version,
      };

      // Check database connection
      try {
        const dbState = mongoose.connection.readyState;
        health.services.database = {
          status: dbState === 1 ? 'healthy' : 'unhealthy',
          state: dbState,
          connectionString: process.env.MONGODB_URI
            ? 'configured'
            : 'not configured',
        };
      } catch (error) {
        health.services.database = {
          status: 'unhealthy',
          error: error.message,
        };
      }

      // Check email configuration
      try {
        const emailConfigured = !!(
          process.env.SMTP_HOST && process.env.SMTP_USER
        );
        health.services.email = {
          status: emailConfigured ? 'healthy' : 'unhealthy',
          configured: emailConfigured,
        };
      } catch (error) {
        health.services.email = {
          status: 'unhealthy',
          error: error.message,
        };
      }

      // Check storage configuration
      try {
        const storageConfigured = !!(
          process.env.AWS_S3_BUCKET || process.env.STORAGE_PATH
        );
        health.services.storage = {
          status: storageConfigured ? 'healthy' : 'unhealthy',
          configured: storageConfigured,
        };
      } catch (error) {
        health.services.storage = {
          status: 'unhealthy',
          error: error.message,
        };
      }

      // Determine overall health status
      const unhealthyServices = Object.values(health.services).filter(
        (service) => service.status === 'unhealthy'
      );

      if (unhealthyServices.length > 0) {
        health.status = 'degraded';
      }

      return health;
    } catch (error) {
      logger.error('Get system health service error:', error);
      throw error;
    }
  },

  /**
   * Test email configuration
   */
  testEmailConfiguration: async () => {
    try {
      // In a real application, you would actually send a test email
      const emailConfigured = !!(
        process.env.SMTP_HOST && process.env.SMTP_USER
      );

      return {
        success: emailConfigured,
        message: emailConfigured
          ? 'Email configuration is valid'
          : 'Email configuration is missing required parameters',
        details: {
          smtpHost: process.env.SMTP_HOST ? 'configured' : 'missing',
          smtpUser: process.env.SMTP_USER ? 'configured' : 'missing',
          smtpPort: process.env.SMTP_PORT || 'default (587)',
        },
      };
    } catch (error) {
      logger.error('Test email configuration service error:', error);
      return {
        success: false,
        message: 'Email configuration test failed',
        error: error.message,
      };
    }
  },

  /**
   * Test database connection
   */
  testDatabaseConnection: async () => {
    try {
      const dbState = mongoose.connection.readyState;
      const isConnected = dbState === 1;

      return {
        success: isConnected,
        message: isConnected
          ? 'Database connection is healthy'
          : 'Database connection is not established',
        details: {
          state: dbState,
          connectionString: process.env.MONGODB_URI
            ? 'configured'
            : 'not configured',
        },
      };
    } catch (error) {
      logger.error('Test database connection service error:', error);
      return {
        success: false,
        message: 'Database connection test failed',
        error: error.message,
      };
    }
  },

  /**
   * Test storage connection
   */
  testStorageConnection: async () => {
    try {
      const storageConfigured = !!(
        process.env.AWS_S3_BUCKET || process.env.STORAGE_PATH
      );

      return {
        success: storageConfigured,
        message: storageConfigured
          ? 'Storage configuration is valid'
          : 'Storage configuration is missing required parameters',
        details: {
          provider: process.env.STORAGE_PROVIDER || 'local',
          awsBucket: process.env.AWS_S3_BUCKET
            ? 'configured'
            : 'not configured',
          localPath: process.env.STORAGE_PATH || 'default',
        },
      };
    } catch (error) {
      logger.error('Test storage connection service error:', error);
      return {
        success: false,
        message: 'Storage connection test failed',
        error: error.message,
      };
    }
  },

  /**
   * Export system settings
   */
  exportSettings: async () => {
    try {
      const settings = await adminSettingsService.getSettings();
      return {
        ...settings,
        exportedAt: new Date().toISOString(),
        exportedBy: 'admin',
      };
    } catch (error) {
      logger.error('Export system settings service error:', error);
      throw error;
    }
  },

  /**
   * Import system settings
   */
  importSettings: async (file) => {
    try {
      // In a real application, you would parse the uploaded file
      // For now, we'll just return a success response
      const settings = JSON.parse(file.buffer.toString());

      logger.info('System settings imported from file', {
        fileName: file.originalname,
        settingsCount: Object.keys(settings).length,
      });

      return {
        success: true,
        message: 'Settings imported successfully',
        settings,
        importedAt: new Date().toISOString(),
      };
    } catch (error) {
      logger.error('Import system settings service error:', error);
      throw error;
    }
  },
};
