import { format, formatDistanceToNow, isValid, parseISO } from "date-fns";

/**
 * Format a date string to dd/MM/yyyy format
 * @param dateString - Date string or Date object
 * @returns Formatted date string or "N/A" if invalid
 */
export const formatDate = (dateString: string | Date | undefined | null): string => {
    if (!dateString) return "N/A";

    try {
        const date = typeof dateString === "string" ? parseISO(dateString) : dateString;

        if (!isValid(date)) {
            return "N/A";
        }

        return format(date, "dd/MM/yyyy");
    } catch (error) {
        console.warn("Error formatting date:", error);
        return "N/A";
    }
};

/**
 * Format a date string to dd/MM/yyyy HH:mm format (with time)
 * @param dateString - Date string or Date object
 * @returns Formatted date string with time or "N/A" if invalid
 */
export const formatDateTime = (dateString: string | Date | undefined | null): string => {
    if (!dateString) return "N/A";

    try {
        const date = typeof dateString === "string" ? parseISO(dateString) : dateString;

        if (!isValid(date)) {
            return "N/A";
        }

        return format(date, "dd/MM/yyyy HH:mm");
    } catch (error) {
        console.warn("Error formatting date with time:", error);
        return "N/A";
    }
};

/**
 * Format a date string to dd MMM yyyy format (e.g., "15 Jan 2024")
 * @param dateString - Date string or Date object
 * @returns Formatted date string or "N/A" if invalid
 */
export const formatDateShort = (dateString: string | Date | undefined | null): string => {
    if (!dateString) return "N/A";

    try {
        const date = typeof dateString === "string" ? parseISO(dateString) : dateString;

        if (!isValid(date)) {
            return "N/A";
        }

        return format(date, "dd MMM yyyy");
    } catch (error) {
        console.warn("Error formatting short date:", error);
        return "N/A";
    }
};

/**
 * Format a date string to relative time (e.g., "2 hours ago")
 * @param dateString - Date string or Date object
 * @returns Relative time string or "N/A" if invalid
 */
export const formatRelativeTime = (dateString: string | Date | undefined | null): string => {
    if (!dateString) return "N/A";

    try {
        const date = typeof dateString === "string" ? parseISO(dateString) : dateString;

        if (!isValid(date)) {
            return "N/A";
        }

        return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
        console.warn("Error formatting relative time:", error);
        return "N/A";
    }
};

/**
 * Format a date string to a more detailed format (e.g., "15/01/2024, 2:30 PM")
 * @param dateString - Date string or Date object
 * @returns Detailed date string or "N/A" if invalid
 */
export const formatDetailedDate = (dateString: string | Date | undefined | null): string => {
    if (!dateString) return "N/A";

    try {
        const date = typeof dateString === "string" ? parseISO(dateString) : dateString;

        if (!isValid(date)) {
            return "N/A";
        }

        return format(date, "dd/MM/yyyy, h:mm a");
    } catch (error) {
        console.warn("Error formatting detailed date:", error);
        return "N/A";
    }
};

/**
 * Format a date string to time only (e.g., "2:30 PM")
 * @param dateString - Date string or Date object
 * @returns Time string or "N/A" if invalid
 */
export const formatTime = (dateString: string | Date | undefined | null): string => {
    if (!dateString) return "N/A";

    try {
        const date = typeof dateString === "string" ? parseISO(dateString) : dateString;

        if (!isValid(date)) {
            return "N/A";
        }

        return format(date, "h:mm a");
    } catch (error) {
        console.warn("Error formatting time:", error);
        return "N/A";
    }
};

/**
 * Convert a date string or Date object to ISO string format
 * @param dateString - Date string or Date object
 * @returns ISO string or current date ISO string if invalid
 */
export const toISOString = (dateString: string | Date | undefined | null): string => {
    if (!dateString) return new Date().toISOString();

    try {
        const date = typeof dateString === "string" ? parseISO(dateString) : dateString;

        if (!isValid(date)) {
            return new Date().toISOString();
        }

        return date.toISOString();
    } catch (error) {
        console.warn("Error converting to ISO string:", error);
        return new Date().toISOString();
    }
};

/**
 * Format a date string to dd/MM/yyyy format for display in tables and lists
 * This is the standard format used throughout the application
 * @param dateString - Date string or Date object
 * @returns Formatted date string or "N/A" if invalid
 */
export const formatDisplayDate = (dateString: string | Date | undefined | null): string => {
    return formatDate(dateString);
};

/**
 * Format a date string to dd/MM/yyyy HH:mm format for display with time
 * @param dateString - Date string or Date object
 * @returns Formatted date string with time or "N/A" if invalid
 */
export const formatDisplayDateTime = (dateString: string | Date | undefined | null): string => {
    return formatDateTime(dateString);
};

/**
 * Format a date string for input fields (yyyy-MM-dd format)
 * @param dateString - Date string or Date object
 * @returns Formatted date string for input fields or current date if invalid
 */
export const formatInputDate = (dateString: string | Date | undefined | null): string => {
    if (!dateString) return format(new Date(), "yyyy-MM-dd");

    try {
        const date = typeof dateString === "string" ? parseISO(dateString) : dateString;

        if (!isValid(date)) {
            return format(new Date(), "yyyy-MM-dd");
        }

        return format(date, "yyyy-MM-dd");
    } catch (error) {
        console.warn("Error formatting input date:", error);
        return format(new Date(), "yyyy-MM-dd");
    }
};