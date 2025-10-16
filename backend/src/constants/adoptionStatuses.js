/**
 * Centralized adoption status constants
 * This file contains all adoption-related status enums to ensure consistency across the codebase
 */

// Main adoption request statuses
export const ADOPTION_STATUSES = [
  'pending',
  'approved',
  'scheduled',
  'completed',
  'denied',
  'rejected',
];

// Timeline statuses (simplified flow)
export const TIMELINE_STATUSES = [
  'submitted',
  'pending',
  'approved',
  'scheduled',
  'completed',
  'denied',
  'rejected',
];

// Final decision statuses
export const FINAL_DECISION_STATUSES = ['approved', 'rejected'];

// Rejection reasons
export const REJECTION_REASONS = [
  'incomplete_application',
  'unsuitable_housing',
  'no_yard_for_dog',
  'other_pets_conflict',
  'children_concerns',
  'work_schedule_issues',
  'lack_of_experience',
  'financial_concerns',
  'vet_reference_issues',
  'verification_failed',
  'interview_concerns',
  'user_withdraw',
  'failed_contract',
  'pet_health_issue',
  'shelter_decision',
  'other',
];

// Meeting statuses
export const MEETING_STATUSES = [
  'scheduled',
  'completed',
  'canceled',
  'rescheduled',
];

// Document statuses
export const DOCUMENT_STATUSES = ['pending', 'approved', 'rejected'];

// Contract statuses
export const CONTRACT_STATUSES = ['drafted', 'sent', 'signed'];

// Follow-up outcomes
export const FOLLOW_UP_OUTCOMES = ['completed', 'cancelled', 'rescheduled'];

// Information request statuses
export const INFORMATION_REQUEST_STATUSES = [
  'pending',
  'submitted',
  'approved',
  'needs_revision',
  'overdue',
];

// Preliminary evaluation decision statuses
export const PRELIMINARY_EVALUATION_STATUSES = ['proceed', 'reject'];

// Follow-up statuses
export const FOLLOW_UP_STATUSES = [
  'scheduled',
  'completed',
  'canceled',
  'rescheduled',
];

// Verification types (Vietnamese context)
export const VERIFICATION_TYPES = [
  'phone_call',
  'text_message',
  'facebook_message',
  'zalo_message',
  'in_person',
  'not_required',
];

// Commitment types (Vietnamese context)
export const COMMITMENT_TYPES = [
  'online_form',
  'facebook_post',
  'offline_signing',
  'verbal_agreement',
];

// Follow-up types (Vietnamese context)
export const FOLLOW_UP_TYPES = [
  'phone_call',
  'home_visit',
  'email_check',
  'photo_update',
  'facebook_post',
  'zalo_message',
  'not_required',
];

// Rejection reason types (removed duplicate - see line 47)

// Information request categories
export const INFORMATION_REQUEST_CATEGORIES = [
  'personal_information',
  'housing_details',
  'pet_experience',
  'financial_information',
  'veterinarian_reference',
  'personal_references',
  'documents',
  'home_photos',
  'other',
];

// Priority levels
export const PRIORITY_LEVELS = ['low', 'medium', 'high', 'critical'];

// Field types for information requests
export const FIELD_TYPES = [
  'text',
  'textarea',
  'number',
  'email',
  'phone',
  'date',
  'file',
  'select',
  'image_upload',
  'video_upload',
];

// Document types
export const DOCUMENT_TYPES = [
  'id',
  'proof_of_residence',
  'reference_letter',
  'vet_records',
  'application',
  'commitment_form',
  'home_photos',
  'other',
];

// Meeting types
export const MEETING_TYPES = [
  'in_person',
  'video_call',
  'phone_call',
  'handover',
];

// Reminder types
export const REMINDER_TYPES = ['email', 'sms', 'in_app', 'zalo', 'facebook'];

// Housing types
export const HOUSING_TYPES = ['house', 'apartment', 'condo', 'other'];

// Helper functions
export const isActiveStatus = (status) => {
  return ['pending', 'approved'].includes(status);
};

export const isCompletedStatus = (status) => {
  return ['completed', 'cancelled'].includes(status);
};

export const isRejectedStatus = (status) => {
  return ['rejected', 'cancelled'].includes(status);
};

export const getStatusDisplayName = (status) => {
  const statusMap = {
    pending: 'Pending',
    approved: 'Approved',
    scheduled: 'Scheduled',
    completed: 'Completed',
    denied: 'Denied',
    rejected: 'Rejected',
    submitted: 'Submitted',
  };
  return statusMap[status] || status;
};

export const getStatusColor = (status) => {
  const colorMap = {
    pending: 'yellow',
    approved: 'green',
    scheduled: 'blue',
    completed: 'green',
    denied: 'red',
    rejected: 'red',
    submitted: 'blue',
  };
  return colorMap[status] || 'gray';
};
