/**
 * Match score thresholds for consistent badge logic across components
 * These values determine when to show different match strength indicators
 */
export const MATCH_THRESHOLDS = {
  /** High match - good compatibility */
  high: 0.8,
  /** Best match - excellent compatibility */
  best: 0.9,
  /** Perfect match - ideal compatibility */
  perfect: 0.95,
} as const;

/**
 * Get match strength level based on score
 * @param score - Match score between 0 and 1
 * @returns Object with level and label for display
 */
export const getMatchStrengthInfo = (score: number) => {
  if (score >= MATCH_THRESHOLDS.perfect) {
    return { level: 'perfect', label: 'Perfect Match', color: 'text-green-600' };
  }
  if (score >= MATCH_THRESHOLDS.best) {
    return { level: 'best', label: 'Best Match', color: 'text-green-600' };
  }
  if (score >= MATCH_THRESHOLDS.high) {
    return { level: 'high', label: 'High Match', color: 'text-blue-600' };
  }
  if (score >= 0.6) {
    return { level: 'medium', label: 'Good Match', color: 'text-yellow-600' };
  }
  if (score >= 0.4) {
    return { level: 'low', label: 'Fair Match', color: 'text-orange-600' };
  }
  return { level: 'poor', label: 'Poor Match', color: 'text-red-600' };
};

/**
 * Type for match strength levels
 */
export type MatchStrengthLevel = 'perfect' | 'best' | 'high' | 'medium' | 'low' | 'poor';
