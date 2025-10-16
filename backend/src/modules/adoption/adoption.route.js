import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.js';
import { adoptionLimiter, apiLimiter } from '../../middleware/rateLimiter.js';
import { validateRequest } from '../../middleware/validateRequest.js';
import { uploadSingleDocument } from '../../middleware/documentUpload.js';
import {
  applicationDetailsSchema,
  createInformationRequestSchema,
  submitInformationResponseSchema,
  reviewInformationRequestSchema,
} from './adoption.validation.js';
import {
  createAdoptionRequest,
  getAdoptionRequests,
  getAdoptionRequestById,
  updateAdoptionRequest,
  addNote,
  scheduleMeeting,
  updateMeetingStatus,
  uploadDocument,
  uploadFile,
  verifyDocument,
  deleteDocument,
  makeFinalDecision,
  scheduleFollowUp,
  getShelterAdoptionRequests,
  getUserAdoptionRequests,
  getAdoptionRequestMeetings,
  getAllShelterMeetings,
  rescheduleMeeting,
  performPreliminaryEvaluation,
  updateInterviewResults,
  updateHomeVisitResults,
  approveAdoptionRequest,
  generateContract,
  sendContract,
  signContract,
  getContractFile,
  schedulePostAdoptionFollowUp,
  completeFollowUp,
  createInformationRequest,
  submitInformationResponse,
  reviewInformationRequest,
  updateInformationRequest,
  deleteInformationRequest,
  getInformationRequests,
  sendInformationRequestReminder,
  addTimelineEvent,
  scheduleHandover,
  completeHandover,
  completeAdoption,
  cancelFollowUp,
  getUserAdoptionRequestDetails,
  getUserAdoptionRequestMeetings,
  getUserInformationRequests,
} from './adoption.controller.js';

// Initialize router
const router = Router();

// Public routes with general rate limiting
router.get('/', apiLimiter, getAdoptionRequests);

// Protected routes - require authentication
router.use(authenticate);

// Shelter-specific routes
router.get('/shelter', authorize('shelter'), getShelterAdoptionRequests);

// Shelter meetings overview - MUST come before /:id routes
router.get(
  '/shelter/meetings',
  authorize('shelter', 'admin'),

  getAllShelterMeetings
);

// User-specific routes
router.get(
  '/user',
  apiLimiter,
  authenticate,
  authorize('user'),
  getUserAdoptionRequests
);

// ⚠️ Create adoption request with rate limiting and validation - MUST come before /:id routes
router.post(
  '/:petId',
  adoptionLimiter,
  validateRequest({ body: applicationDetailsSchema }),
  createAdoptionRequest
);

// Contract file access - available to authenticated users (permission checked in controller)
// MUST come before general /:id route to avoid route conflicts
router.get('/:id/contract/file', apiLimiter, authenticate, getContractFile);

// Contract signing - available to authenticated users (permission checked in service)
router.post('/:id/contract/sign', apiLimiter, authenticate, signContract);

// User-specific routes for accessing their own adoption request data
router.get(
  '/:id/user-details',
  apiLimiter,
  authorize('user'),
  getUserAdoptionRequestDetails
);
router.get(
  '/:id/user-meetings',
  apiLimiter,
  authorize('user'),
  getUserAdoptionRequestMeetings
);
router.get(
  '/:id/user-information-requests',
  apiLimiter,
  authorize('user'),
  getUserInformationRequests
);

// Public routes that use :id parameter
router.get('/:id', apiLimiter, getAdoptionRequestById);

// Routes requiring shelter staff authorization
router.use(authorize('shelter', 'admin'));

router.route('/:id').patch(apiLimiter, updateAdoptionRequest);

// Notes management with rate limiting
router.post(
  '/:id/notes',
  apiLimiter,

  addNote
);

// Timeline management with rate limiting
router.post('/:id/timeline', apiLimiter, addTimelineEvent);

// Meeting management with rate limiting
router.post('/:id/meetings', apiLimiter, scheduleMeeting);
router.get('/:id/meetings', apiLimiter, getAdoptionRequestMeetings);
router.patch('/:id/meetings/:meetingId', apiLimiter, updateMeetingStatus);
router.patch(
  '/:id/meetings/:meetingId/reschedule',
  apiLimiter,
  rescheduleMeeting
);

// Handover management with rate limiting
router.post('/:id/handover', apiLimiter, scheduleHandover);
router.post('/:id/handover/complete', apiLimiter, completeHandover);
router.post('/:id/complete', apiLimiter, completeAdoption);

// Document management with rate limiting
router.post('/upload', apiLimiter, uploadSingleDocument, uploadFile);
router.post('/:id/documents', apiLimiter, uploadDocument);
router.patch('/:id/documents/:documentId', apiLimiter, verifyDocument);
router.delete('/:id/documents/:documentId', apiLimiter, deleteDocument);

// Final decision with rate limiting
router.post('/:id/decision', apiLimiter, makeFinalDecision);

// Follow-up management with rate limiting
router.post('/:id/follow-up', apiLimiter, scheduleFollowUp);

// New workflow routes
// Preliminary evaluation
router.post('/:id/evaluate', apiLimiter, performPreliminaryEvaluation);

// Interview results
router.post('/:id/interview-results', apiLimiter, updateInterviewResults);

// Home visit results
router.post('/:id/home-visit-results', apiLimiter, updateHomeVisitResults);

// Approval workflow
router.post('/:id/approve', apiLimiter, approveAdoptionRequest);

// Contract management
router.post(
  '/:id/contract/generate',
  apiLimiter,
  authenticate,
  generateContract
);
router.post('/:id/contract', apiLimiter, authenticate, generateContract); // Legacy endpoint
router.post('/:id/contract/send', apiLimiter, authenticate, sendContract);

// Post-adoption follow-up
router.post(
  '/:id/post-adoption-follow-up',
  apiLimiter,
  schedulePostAdoptionFollowUp
);
router.post(
  '/:id/follow-up/:followUpId/complete',
  apiLimiter,
  completeFollowUp
);
router.post('/:id/follow-up/:followUpId/cancel', apiLimiter, cancelFollowUp);

// Information request routes
router.post(
  '/:id/information-request',
  apiLimiter,
  validateRequest({ body: createInformationRequestSchema }),
  createInformationRequest
);
router.post(
  '/:id/information-response',
  apiLimiter,
  validateRequest({ body: submitInformationResponseSchema }),
  submitInformationResponse
);
router.get('/:id/information-requests', apiLimiter, getInformationRequests);
router.patch(
  '/:id/information-request/:requestId',
  apiLimiter,
  validateRequest({ body: reviewInformationRequestSchema }),
  reviewInformationRequest
);
router.delete(
  '/:id/information-request/:requestId',
  apiLimiter,
  deleteInformationRequest
);
router.post(
  '/:id/information-request-reminder',
  apiLimiter,
  sendInformationRequestReminder
);

export { router };
