/**
 * Centralized adoption status constants for frontend
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
] as const;

export type AdoptionStatus = typeof ADOPTION_STATUSES[number];

// Timeline statuses (simplified flow)
export const TIMELINE_STATUSES = [
    'submitted',
    'pending',
    'approved',
    'scheduled',
    'completed',
    'denied',
    'rejected',
] as const;

export type TimelineStatus = typeof TIMELINE_STATUSES[number];

// Final decision statuses
export const FINAL_DECISION_STATUSES = [
    'approved',
    'rejected',
] as const;

export type FinalDecisionStatus = typeof FINAL_DECISION_STATUSES[number];

// Meeting statuses
export const MEETING_STATUSES = [
    'scheduled',
    'completed',
    'canceled',
    'rescheduled',
] as const;

export type MeetingStatus = typeof MEETING_STATUSES[number];

// Document statuses
export const DOCUMENT_STATUSES = [
    'pending',
    'approved',
    'rejected',
] as const;

export type DocumentStatus = typeof DOCUMENT_STATUSES[number];

// Information request statuses
export const INFORMATION_REQUEST_STATUSES = [
    'pending',
    'submitted',
    'approved',
    'needs_revision',
    'overdue',
] as const;

export type InformationRequestStatus = typeof INFORMATION_REQUEST_STATUSES[number];

// Preliminary evaluation decision statuses
export const PRELIMINARY_EVALUATION_STATUSES = [
    'proceed',
    'reject',
] as const;

export type PreliminaryEvaluationStatus = typeof PRELIMINARY_EVALUATION_STATUSES[number];

// Follow-up statuses
export const FOLLOW_UP_STATUSES = [
    'scheduled',
    'completed',
    'canceled',
    'rescheduled',
] as const;

export type FollowUpStatus = typeof FOLLOW_UP_STATUSES[number];

// Verification types (Vietnamese context)
export const VERIFICATION_TYPES = [
    'phone_call',
    'text_message',
    'facebook_message',
    'zalo_message',
    'in_person',
    'not_required',
] as const;

export type VerificationType = typeof VERIFICATION_TYPES[number];

// Commitment types (Vietnamese context)
export const COMMITMENT_TYPES = [
    'online_form',
    'facebook_post',
    'offline_signing',
    'verbal_agreement',
] as const;

export type CommitmentType = typeof COMMITMENT_TYPES[number];

// Follow-up types (Vietnamese context)
export const FOLLOW_UP_TYPES = [
    'photo_update',
    'facebook_post',
    'zalo_message',
    'phone_call',
    'not_required',
] as const;

export type FollowUpType = typeof FOLLOW_UP_TYPES[number];

// Rejection reason types
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
] as const;

export type RejectionReason = typeof REJECTION_REASONS[number];

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
] as const;

export type InformationRequestCategory = typeof INFORMATION_REQUEST_CATEGORIES[number];

// Priority levels
export const PRIORITY_LEVELS = [
    'low',
    'medium',
    'high',
    'critical',
] as const;

export type PriorityLevel = typeof PRIORITY_LEVELS[number];

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
] as const;

export type FieldType = typeof FIELD_TYPES[number];

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
] as const;

export type DocumentType = typeof DOCUMENT_TYPES[number];

// Meeting types
export const MEETING_TYPES = [
    'phone_call',
    'text_message',
    'facebook_chat',
    'zalo_chat',
    'in_person',
] as const;

export type MeetingType = typeof MEETING_TYPES[number];

// Reminder types
export const REMINDER_TYPES = [
    'email',
    'sms',
    'in_app',
    'zalo',
    'facebook',
] as const;

export type ReminderType = typeof REMINDER_TYPES[number];

// Housing types
export const HOUSING_TYPES = [
    'house',
    'apartment',
    'condo',
    'other',
] as const;

export type HousingType = typeof HOUSING_TYPES[number];

// Helper functions
export const isActiveStatus = (status: AdoptionStatus): boolean => {
    return ['pending', 'approved'].includes(status);
};

export const isCompletedStatus = (status: AdoptionStatus): boolean => {
    return ['completed'].includes(status);
};

export const isRejectedStatus = (status: AdoptionStatus): boolean => {
    return ['rejected'].includes(status);
};

export const getStatusDisplayName = (status: AdoptionStatus | TimelineStatus): string => {
    const statusMap: Record<string, string> = {
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

export const getStatusColor = (status: AdoptionStatus | TimelineStatus): string => {
    const colorMap: Record<string, string> = {
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