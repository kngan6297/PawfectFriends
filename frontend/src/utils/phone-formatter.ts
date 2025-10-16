/**
 * Normalizes a phone number to a consistent format
 * @param phone - The phone number to normalize
 * @returns The normalized phone number
 */
export const normalizePhoneNumber = (phone: string): string => {
    // Remove all non-digit characters
    const digits = phone.replace(/\D/g, "");

    // If the number starts with 0, replace it with +84
    if (digits.startsWith("0")) {
        return `+84${digits.slice(1)}`;
    }

    // If the number starts with 84, add the + prefix
    if (digits.startsWith("84")) {
        return `+${digits}`;
    }

    // If the number doesn't start with + or 84, add +84
    return `+84${digits}`;
};

/**
 * Checks if a string appears to be a phone number
 * @param input - The string to check
 * @returns True if the string looks like a phone number
 */
export const isPhoneNumber = (input: string): boolean => {
    // Remove spaces and common phone formatting characters
    const cleaned = input.replace(/[\s\(\)\.\-]/g, '');

    // Check if it contains only digits, +, and possibly starts with +
    // Must have at least 7 digits to be considered a phone number
    const hasEnoughDigits = (cleaned.match(/\d/g) || []).length >= 7;
    const onlyValidChars = /^[0-9+\-]+$/.test(cleaned);

    // Additional check: if it contains @ or . in certain patterns, it's likely an email
    const hasEmailPattern = /@.*\./.test(input) || /\.(com|org|net|edu|gov|mil|int|co|uk|us|vn)$/i.test(input);

    return hasEnoughDigits && onlyValidChars && !hasEmailPattern;
}; 