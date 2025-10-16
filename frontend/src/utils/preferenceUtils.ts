/**
 * Utility functions for safely handling preference values that can be strings or arrays
 */

/**
 * Safely extract a string value from a preference field that can be string | string[]
 * @param value - The preference value (string, string[], or undefined)
 * @returns The first string value, or empty string if not available
 */
export const getPreferenceString = (value: string | string[] | undefined): string => {
  if (!value) return "";
  if (Array.isArray(value)) return value[0] || "";
  return value;
};

/**
 * Safely extract all string values from a preference field
 * @param value - The preference value (string, string[], or undefined)
 * @returns Array of strings, or empty array if not available
 */
export const getPreferenceStrings = (value: string | string[] | undefined): string[] => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  return [value];
};

/**
 * Check if a preference value matches a specific string
 * @param value - The preference value (string, string[], or undefined)
 * @param target - The target string to match
 * @returns True if the value matches the target
 */
export const preferenceMatches = (value: string | string[] | undefined, target: string): boolean => {
  if (!value) return false;
  if (Array.isArray(value)) return value.includes(target);
  return value === target;
};

/**
 * Check if a preference value contains any of the target strings
 * @param value - The preference value (string, string[], or undefined)
 * @param targets - Array of target strings to check
 * @returns True if the value contains any of the targets
 */
export const preferenceContainsAny = (value: string | string[] | undefined, targets: string[]): boolean => {
  if (!value || !targets.length) return false;
  if (Array.isArray(value)) return value.some(v => targets.includes(v));
  return targets.includes(value);
};
