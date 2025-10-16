import axios from 'axios';

/**
 * Unified API error parsing function that handles all error formats
 * Supports: Joi, Zod, express-validator, custom validation errors
 */
export const parseApiError = (data: any): { userMessage: string; fieldErrors: Record<string, string> } => {
    const fieldErrors: Record<string, string> = {};
    let userMessage =
        data?.userMessage ||
        data?.message ||
        "Please check your input and try again.";

    // Supports many validation formats: Joi, Zod, express-validator, custom
    const details =
        data?.errors ||
        data?.error?.details ||
        data?.details ||
        data?.issues ||
        data?.error?.issues;

    if (Array.isArray(details)) {
        for (const d of details) {
            const path = d.path || d.param || d.field;
            const msg = d.message || d.msg;
            if (path && msg) {
                fieldErrors[path] = msg;
            }
            // If there is no userMessage, get the first msg
            if (!userMessage && msg) {
                userMessage = msg;
            }
        }
    }

    return { userMessage, fieldErrors };
};

export const handleApiError = (error: unknown, defaultMessage: string): string => {
    let message = defaultMessage;

    if (error instanceof Error) {
        message = error.message;
    } else if (typeof error === 'string') {
        message = error;
    }

    // Only log non-cancel errors
    if (!axios.isCancel(error) && error instanceof Error && error.name !== 'AbortError') {
        console.error('API Error:', error);
    }

    return message;
};

// Utility function to safely log errors
export const safeLogError = (error: unknown, context: string): void => {
    // Don't log cancel/abort errors
    if (axios.isCancel(error) || (error instanceof Error && error.name === 'AbortError')) {
        return;
    }

    console.error(`Error in ${context}:`, error);
};

// Utility function to handle fetch errors
export const handleFetchError = (error: unknown, context: string): void => {
    if (error instanceof Error && error.name === 'AbortError') {
        return; // Don't log abort errors
    }
    console.error(`Error in ${context}:`, error);
}; 