import express from 'express';
import { validateRequest } from '../../middleware/validateRequest.js';
import { authenticate } from '../../middleware/auth.js';
import { authorize } from '../../middleware/auth.js';
import { reportValidation } from './report.validation.js';
import * as reportController from './report.controller.js';

const router = express.Router();

// User routes (authenticated users)
router.post(
  '/',
  authenticate,
  validateRequest(reportValidation.createReport),
  reportController.createReport
);

router.get('/my-reports', authenticate, reportController.getReportsByReporter);

// Admin routes (admin only)
router.get(
  '/',
  authenticate,
  authorize('admin'),
  validateRequest(reportValidation.query, 'query'),
  reportController.getReports
);

router.get(
  '/stats',
  authenticate,
  authorize('admin'),
  reportController.getReportStats
);

router.get(
  '/:reportId',
  authenticate,
  authorize('admin'),
  reportController.getReportById
);

router.patch(
  '/:reportId/status',
  authenticate,
  authorize('admin'),
  validateRequest(reportValidation.updateStatus),
  reportController.updateReportStatus
);

router.patch(
  '/:reportId/action',
  authenticate,
  authorize('admin'),
  validateRequest(reportValidation.applyAction),
  reportController.applyAdminAction
);

router.get(
  '/user/:userId',
  authenticate,
  authorize('admin'),
  reportController.getReportsByUser
);

export const reportRouter = router;
export default router;
