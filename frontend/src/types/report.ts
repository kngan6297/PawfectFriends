export interface ReportEvidence {
    type: 'screenshot' | 'link' | 'text';
    content: string;
    description?: string;
}

export interface ReportActionDetails {
    banDuration?: number; // in days, for temporary bans
    banReason?: string;
    warningMessage?: string;
}

export interface Report {
    id: string;
    reporter: {
        id: string;
        name: string;
        email: string;
    };
    reportedUser: {
        id: string;
        name: string;
        email: string;
        role: string;
    };
    reason: 'spam' | 'fraud' | 'harassment' | 'inappropriate_content' | 'fake_profile' | 'scam' | 'violation_of_terms' | 'other';
    description: string;
    evidence: ReportEvidence[];
    status: 'pending' | 'investigating' | 'resolved' | 'dismissed';
    adminNotes?: string;
    adminAction: 'none' | 'warning' | 'temporary_ban' | 'permanent_ban' | 'content_removal';
    actionDetails?: ReportActionDetails;
    handledBy?: {
        id: string;
        name: string;
        email: string;
    };
    handledAt?: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateReportData {
    reportedUserId: string;
    reason: Report['reason'];
    description: string;
    evidence?: ReportEvidence[];
}

export interface UpdateReportStatusData {
    status: Report['status'];
    adminNotes?: string;
}

export interface ApplyAdminActionData {
    action: Report['adminAction'];
    actionDetails?: ReportActionDetails;
}

export interface ReportFilters {
    status?: Report['status'];
    reason?: Report['reason'];
    reportedUserId?: string;
}

export interface ReportQueryOptions {
    page?: number;
    limit?: number;
    sortBy?: 'createdAt' | 'status' | 'reason';
    sortOrder?: 'asc' | 'desc';
}

export interface ReportStats {
    total: number;
    byStatus: Record<string, number>;
    byReason: Record<string, number>;
}

export interface ReportsResponse {
    reports: Report[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
    };
}

export const REPORT_REASONS = {
    spam: 'Spam',
    fraud: 'Fraud',
    harassment: 'Harassment',
    inappropriate_content: 'Inappropriate Content',
    fake_profile: 'Fake Profile',
    scam: 'Scam',
    violation_of_terms: 'Violation of Terms',
    other: 'Other',
} as const;

export const REPORT_STATUSES = {
    pending: 'Pending',
    investigating: 'Investigating',
    resolved: 'Resolved',
    dismissed: 'Dismissed',
} as const;

export const ADMIN_ACTIONS = {
    none: 'No Action',
    warning: 'Warning',
    temporary_ban: 'Temporary Ban',
    permanent_ban: 'Permanent Ban',
    content_removal: 'Content Removal',
} as const; 