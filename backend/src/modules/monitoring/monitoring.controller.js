import {
  getSystemMetrics as getSystemMetricsService,
  getApplicationMetrics as getApplicationMetricsService,
  getSecurityMetrics as getSecurityMetricsService,
  getPerformanceMetrics as getPerformanceMetricsService,
  getErrorMetrics as getErrorMetricsService,
  getDatabaseMetrics as getDatabaseMetricsService,
} from './monitoring.service.js';
import { ApiError } from '../../utils/errors.js';
import {
  logSecurityEvent,
  SecurityEventType,
} from '../../utils/securityLogger.js';

export const getSystemMetrics = async (req, res) => {
  try {
    const metrics = await getSystemMetricsService();
    res.json({
      success: true,
      data: metrics,
      message: 'System metrics retrieved successfully',
    });
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw ApiError.internal('Failed to get system metrics');
  }
};

export const getApplicationMetrics = async (req, res) => {
  try {
    const metrics = await getApplicationMetricsService();
    res.json({
      success: true,
      data: metrics,
      message: 'Application metrics retrieved successfully',
    });
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw ApiError.internal('Failed to get application metrics');
  }
};

export const getSecurityMetrics = async (req, res) => {
  try {
    const metrics = await getSecurityMetricsService();
    res.json({
      success: true,
      data: metrics,
      message: 'Security metrics retrieved successfully',
    });
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw ApiError.internal('Failed to get security metrics');
  }
};

export const getPerformanceMetrics = async (req, res) => {
  try {
    const metrics = await getPerformanceMetricsService();
    res.json({
      success: true,
      data: metrics,
      message: 'Performance metrics retrieved successfully',
    });
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw ApiError.internal('Failed to get performance metrics');
  }
};

export const getErrorMetrics = async (req, res) => {
  try {
    const metrics = await getErrorMetricsService();
    res.json({
      success: true,
      data: metrics,
      message: 'Error metrics retrieved successfully',
    });
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw ApiError.internal('Failed to get error metrics');
  }
};

export const getDatabaseMetrics = async (req, res) => {
  try {
    const metrics = await getDatabaseMetricsService();
    res.json({
      success: true,
      data: metrics,
      message: 'Database metrics retrieved successfully',
    });
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw ApiError.internal('Failed to get database metrics');
  }
};
