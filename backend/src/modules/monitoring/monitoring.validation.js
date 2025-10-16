import Joi from 'joi';

// Get system metrics query schema
export const getSystemMetricsQuerySchema = Joi.object({
  period: Joi.string()
    .valid('hour', 'day', 'week', 'month', 'year')
    .default('day')
    .optional(),
  startDate: Joi.date().optional(),
  endDate: Joi.date().optional(),
  includeDetails: Joi.boolean().default(false).optional(),
});

// Get application metrics query schema
export const getApplicationMetricsQuerySchema = Joi.object({
  period: Joi.string()
    .valid('hour', 'day', 'week', 'month', 'year')
    .default('day')
    .optional(),
  startDate: Joi.date().optional(),
  endDate: Joi.date().optional(),
  metrics: Joi.array()
    .items(
      Joi.string().valid(
        'requests',
        'response_time',
        'error_rate',
        'active_users',
        'new_registrations',
        'adoption_requests',
        'pet_views',
        'favorites'
      )
    )
    .optional(),
  groupBy: Joi.string().valid('hour', 'day', 'week', 'month').optional(),
});

// Get security metrics query schema
export const getSecurityMetricsQuerySchema = Joi.object({
  period: Joi.string()
    .valid('hour', 'day', 'week', 'month', 'year')
    .default('day')
    .optional(),
  startDate: Joi.date().optional(),
  endDate: Joi.date().optional(),
  threatLevel: Joi.string()
    .valid('low', 'medium', 'high', 'critical')
    .optional(),
  includeDetails: Joi.boolean().default(false).optional(),
});

// Get performance metrics query schema
export const getPerformanceMetricsQuerySchema = Joi.object({
  period: Joi.string()
    .valid('hour', 'day', 'week', 'month', 'year')
    .default('day')
    .optional(),
  startDate: Joi.date().optional(),
  endDate: Joi.date().optional(),
  metrics: Joi.array()
    .items(
      Joi.string().valid(
        'cpu_usage',
        'memory_usage',
        'disk_usage',
        'network_io',
        'response_time',
        'throughput',
        'error_rate'
      )
    )
    .optional(),
  threshold: Joi.number().min(0).max(100).optional(),
});

// Get error metrics query schema
export const getErrorMetricsQuerySchema = Joi.object({
  period: Joi.string()
    .valid('hour', 'day', 'week', 'month', 'year')
    .default('day')
    .optional(),
  startDate: Joi.date().optional(),
  endDate: Joi.date().optional(),
  errorType: Joi.string()
    .valid(
      'validation',
      'authentication',
      'authorization',
      'database',
      'external_api',
      'system'
    )
    .optional(),
  severity: Joi.string().valid('low', 'medium', 'high', 'critical').optional(),
  includeStackTraces: Joi.boolean().default(false).optional(),
});

// Get database metrics query schema
export const getDatabaseMetricsQuerySchema = Joi.object({
  period: Joi.string()
    .valid('hour', 'day', 'week', 'month', 'year')
    .default('day')
    .optional(),
  startDate: Joi.date().optional(),
  endDate: Joi.date().optional(),
  metrics: Joi.array()
    .items(
      Joi.string().valid(
        'connection_count',
        'query_performance',
        'slow_queries',
        'index_usage',
        'storage_usage',
        'backup_status'
      )
    )
    .optional(),
  collection: Joi.string().optional(),
});

// Monitoring validation object for routes
export const monitoringValidation = {
  getSystemMetrics: {
    query: getSystemMetricsQuerySchema,
  },
  getApplicationMetrics: {
    query: getApplicationMetricsQuerySchema,
  },
  getSecurityMetrics: {
    query: getSecurityMetricsQuerySchema,
  },
  getPerformanceMetrics: {
    query: getPerformanceMetricsQuerySchema,
  },
  getErrorMetrics: {
    query: getErrorMetricsQuerySchema,
  },
  getDatabaseMetrics: {
    query: getDatabaseMetricsQuerySchema,
  },
};
