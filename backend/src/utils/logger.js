import path from 'path';
import { fileURLToPath } from 'url';
import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

// Get the directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure logs directory exists
import fs from 'fs/promises';
const ensureLogsDirectory = async () => {
  const logsDir = path.join(__dirname, '../logs');
  try {
    await fs.access(logsDir);
  } catch {
    await fs.mkdir(logsDir, { recursive: true });
  }
};

// Define log formats
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let log = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(meta).length > 0) {
      log += ` ${JSON.stringify(meta)}`;
    }
    return log;
  })
);

const fileFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

const importFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.printf(
    ({ timestamp, level, message, sessionId, page, batch, petId, ...meta }) => {
      const logData = {
        timestamp,
        level,
        message,
        sessionId,
        page,
        batch,
        petId,
        ...meta,
      };
      return JSON.stringify(logData);
    }
  )
);

// Create logger instance
const createLogger = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  const isImportMode =
    process.argv.includes('--import') || process.argv.includes('importPets');
  const logLevel = process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug');

  const transports = [];

  // Console transport (only in development or when explicitly requested)
  if (!isProduction || process.env.LOG_CONSOLE === 'true') {
    transports.push(
      new winston.transports.Console({
        level: logLevel,
        format: consoleFormat,
        silent: isImportMode && process.env.LOG_CONSOLE !== 'true', // Silent during imports unless explicitly enabled
      })
    );
  }

  // Daily rotating file transport for all logs
  transports.push(
    new DailyRotateFile({
      filename: path.join(__dirname, '../logs/combined-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: logLevel,
      format: fileFormat,
      maxSize: '20m',
      maxFiles: '14d', // Keep logs for 14 days
      zippedArchive: true,
      createSymlink: true,
      symlinkName: 'combined.log',
    })
  );

  // Daily rotating file transport for errors only
  transports.push(
    new DailyRotateFile({
      filename: path.join(__dirname, '../logs/error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      format: fileFormat,
      maxSize: '20m',
      maxFiles: '30d', // Keep error logs for 30 days
      zippedArchive: true,
      createSymlink: true,
      symlinkName: 'error.log',
    })
  );

  // Import-specific log file (when running imports)
  if (isImportMode) {
    const sessionId = process.env.IMPORT_SESSION_ID || `import_${Date.now()}`;

    transports.push(
      new DailyRotateFile({
        filename: path.join(
          __dirname,
          `../logs/import-${sessionId}-%DATE%.log`
        ),
        datePattern: 'YYYY-MM-DD',
        level: 'info',
        format: importFormat,
        maxSize: '50m',
        maxFiles: '7d', // Keep import logs for 7 days
        zippedArchive: true,
      })
    );

    // Summary log for import progress
    transports.push(
      new winston.transports.File({
        filename: path.join(
          __dirname,
          `../logs/import-summary-${sessionId}.log`
        ),
        level: 'info',
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.printf(
            ({
              timestamp,
              level,
              message,
              sessionId,
              page,
              totalProcessed,
              totalImported,
              progress,
              ...meta
            }) => {
              if (
                message.includes('Progress:') ||
                message.includes('Batch completed') ||
                message.includes('Import completed')
              ) {
                return JSON.stringify({
                  timestamp,
                  level,
                  message,
                  sessionId,
                  page,
                  totalProcessed,
                  totalImported,
                  progress,
                  ...meta,
                });
              }
              return null; // Don't log other messages to summary
            }
          )
        ),
      })
    );
  }

  return winston.createLogger({
    level: logLevel,
    format: fileFormat,
    transports,
    // Handle uncaught exceptions
    exceptionHandlers: [
      new DailyRotateFile({
        filename: path.join(__dirname, '../logs/exceptions-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m',
        maxFiles: '30d',
        zippedArchive: true,
      }),
    ],
    // Handle unhandled promise rejections
    rejectionHandlers: [
      new DailyRotateFile({
        filename: path.join(__dirname, '../logs/rejections-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m',
        maxFiles: '30d',
        zippedArchive: true,
      }),
    ],
  });
};

// Create logger instance
const logger = createLogger();

// Import-specific logging methods
logger.import = {
  start: (sessionId, config) => {
    logger.info('🚀 Import started', {
      sessionId,
      config,
      event: 'import_started',
    });
  },

  progress: (
    sessionId,
    page,
    totalProcessed,
    totalImported,
    totalSkipped,
    maxPets
  ) => {
    const progress = Math.round((totalProcessed / maxPets) * 100);
    logger.info('📊 Import progress', {
      sessionId,
      page,
      totalProcessed,
      totalImported,
      totalSkipped,
      progress: `${progress}%`,
      event: 'import_progress',
    });
  },

  batch: (
    sessionId,
    page,
    batchNumber,
    batchSize,
    processed,
    imported,
    skipped
  ) => {
    logger.info('📦 Batch completed', {
      sessionId,
      page,
      batchNumber,
      batchSize,
      processed,
      imported,
      skipped,
      event: 'batch_completed',
    });
  },

  pet: (sessionId, petId, status, page, batchNumber, error = null) => {
    const logData = {
      sessionId,
      petId,
      status, // 'success', 'failed', 'skipped'
      page,
      batchNumber,
      event: 'pet_processed',
    };

    if (error) {
      logData.error = error.message;
      logData.stack = error.stack;
    }

    if (status === 'success') {
      logger.info('✅ Pet processed successfully', logData);
    } else if (status === 'failed') {
      logger.error('❌ Pet processing failed', logData);
    } else {
      logger.warn('⏭️ Pet skipped', logData);
    }
  },

  checkpoint: (sessionId, checkpointData) => {
    logger.info('💾 Checkpoint saved', {
      sessionId,
      ...checkpointData,
      event: 'checkpoint_saved',
    });
  },

  resume: (sessionId, checkpointData) => {
    logger.info('🔄 Import resumed', {
      sessionId,
      ...checkpointData,
      event: 'import_resumed',
    });
  },

  complete: (sessionId, summary) => {
    logger.info('✨ Import completed', {
      sessionId,
      ...summary,
      event: 'import_completed',
    });
  },

  error: (sessionId, error, context = {}) => {
    logger.error('❌ Import error', {
      sessionId,
      error: error.message,
      stack: error.stack,
      ...context,
      event: 'import_error',
    });
  },
};

// Performance logging
logger.performance = {
  start: (operation, metadata = {}) => {
    const startTime = Date.now();
    logger.debug('⏱️ Performance measurement started', {
      operation,
      startTime,
      ...metadata,
      event: 'performance_start',
    });
    return startTime;
  },

  end: (operation, startTime, metadata = {}) => {
    const endTime = Date.now();
    const duration = endTime - startTime;
    logger.debug('⏱️ Performance measurement ended', {
      operation,
      startTime,
      endTime,
      duration: `${duration}ms`,
      ...metadata,
      event: 'performance_end',
    });
    return duration;
  },

  measure: async (operation, fn, metadata = {}) => {
    const startTime = logger.performance.start(operation, metadata);
    try {
      const result = await fn();
      logger.performance.end(operation, startTime, metadata);
      return result;
    } catch (error) {
      logger.performance.end(operation, startTime, {
        ...metadata,
        error: error.message,
      });
      throw error;
    }
  },
};

// API logging
logger.api = {
  request: (method, url, params = {}) => {
    logger.debug('🌐 API request', {
      method,
      url,
      params,
      event: 'api_request',
    });
  },

  response: (method, url, statusCode, responseTime, data = {}) => {
    const logData = {
      method,
      url,
      statusCode,
      responseTime: `${responseTime}ms`,
      event: 'api_response',
    };

    if (statusCode >= 400) {
      logger.warn('⚠️ API response warning', { ...logData, data });
    } else {
      logger.debug('🌐 API response success', logData);
    }
  },

  error: (method, url, error, retryCount = 0) => {
    logger.error('❌ API error', {
      method,
      url,
      error: error.message,
      retryCount,
      event: 'api_error',
    });
  },
};

// Create a stream object for Morgan
logger.stream = {
  write: (message) => {
    logger.info(message.trim());
  },
};

// Initialize logs directory
ensureLogsDirectory().catch(console.error);

export default logger;
