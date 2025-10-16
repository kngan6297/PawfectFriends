import { ScoringPreferences } from '@/services/recommendation.service';

/**
 * Converts a value to an array, handling null/undefined and non-array values
 */
const toArr = (v: unknown): string[] => {
    if (v == null) return [];
    if (Array.isArray(v)) return v;
    return [v as string];
};

/**
 * Normalizes ScoringPreferences to ensure all preference fields are arrays
 * This makes it easier for the AI service to handle the data consistently
 */
export const normalizePreferences = (p: ScoringPreferences): ScoringPreferences => ({
    ...p,
    // Core preferences
    lifestyle: toArr(p.lifestyle),
    experience: toArr(p.experience),
    livingSpace: toArr(p.livingSpace),
    timeAvailable: toArr(p.timeAvailable),
    hasChildren: toArr(p.hasChildren),
    hasOtherPets: toArr(p.hasOtherPets),

    // Advanced preferences
    activityLevel: toArr(p.activityLevel),
    workSchedule: toArr(p.workSchedule),
    travelFrequency: toArr(p.travelFrequency),
    noiseTolerance: toArr(p.noiseTolerance),
    groomingPreference: toArr(p.groomingPreference),
    trainingCommitment: toArr(p.trainingCommitment),
    budget: toArr(p.budget),
    allergies: toArr(p.allergies),
    homeType: toArr(p.homeType),
    spaceAvailable: toArr(p.spaceAvailable),
    hasYard: toArr(p.hasYard),

    // These are already arrays, but ensure they exist
    preferredSpecies: p.preferredSpecies || [],
    preferredTypes: p.preferredTypes || [],
    preferredSizes: p.preferredSizes || [],
    preferredAges: p.preferredAges || [],
    preferredBreeds: p.preferredBreeds || [],
});

/**
 * Type guard to check if preferences are normalized (all fields are arrays)
 */
export const isPreferencesNormalized = (p: ScoringPreferences): boolean => {
    const arrayFields = [
        'lifestyle', 'experience', 'livingSpace', 'timeAvailable',
        'hasChildren', 'hasOtherPets', 'activityLevel', 'workSchedule',
        'travelFrequency', 'noiseTolerance', 'groomingPreference',
        'trainingCommitment', 'budget', 'allergies', 'homeType',
        'spaceAvailable', 'hasYard'
    ];

    return arrayFields.every(field => Array.isArray(p[field as keyof ScoringPreferences]));
};
