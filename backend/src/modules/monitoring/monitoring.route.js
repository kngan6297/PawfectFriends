import express from 'express';
import {
  getSystemMetrics,
  getApplicationMetrics,
  getSecurityMetrics,
  getPerformanceMetrics,
  getErrorMetrics,
  getDatabaseMetrics,
} from './monitoring.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/auth.js';
import { validateRequest } from '../../middleware/validateRequest.js';
import { monitoringValidation } from './monitoring.validation.js';
import {
  logSecurityEvent,
  SecurityEventType,
} from '../../utils/securityLogger.js';

const router = express.Router();

// Apply authentication and authorization middleware to all routes
router.use(authenticate);
router.use(authorize('admin'));

// Log security events for all monitoring routes
router.use((req, res, next) => {
  logSecurityEvent(SecurityEventType.MONITORING.ACCESS, {
    userId: req.user._id,
    path: req.path,
    method: req.method,
  });
  next();
});

// System metrics
router.get(
  '/system',
  validateRequest(monitoringValidation.getSystemMetrics),
  getSystemMetrics
);

// Application metrics
router.get(
  '/application',
  validateRequest(monitoringValidation.getApplicationMetrics),
  getApplicationMetrics
);

// Security metrics
router.get(
  '/security',
  validateRequest(monitoringValidation.getSecurityMetrics),
  getSecurityMetrics
);

// Performance metrics
router.get(
  '/performance',
  validateRequest(monitoringValidation.getPerformanceMetrics),
  getPerformanceMetrics
);

// Error metrics
router.get(
  '/errors',
  validateRequest(monitoringValidation.getErrorMetrics),
  getErrorMetrics
);

// Database metrics
router.get(
  '/database',
  validateRequest(monitoringValidation.getDatabaseMetrics),
  getDatabaseMetrics
);

export default router;
