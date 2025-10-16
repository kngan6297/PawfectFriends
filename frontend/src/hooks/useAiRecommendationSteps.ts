import { useState } from "react";

interface AiRecommendationPreferences {
    lifestyle: string[];
    experience: string[];
    homeType: string[];
    spaceAvailable: string[];
    livingSpace: string[];
    timeAvailable: string[];
    activityLevel: string[];
    preferredSpecies: string[];
    budget: string[];
    hasChildren: string[];
    hasOtherPets: string[];
    hasYard: string[];
    // Additional fields as arrays for consistency
    preferredTypes: string[];
    preferredSizes: string[];
    preferredAges: string[];
    preferredBreeds: string[];
    workSchedule: string[];
    travelFrequency: string[];
    noiseTolerance: string[];
    groomingPreference: string[];
    trainingCommitment: string[];
    allergies: string[];
    additionalInfo: string;
}

export const useAiRecommendationSteps = () => {
    const [preferences, setPreferences] = useState<AiRecommendationPreferences>({
        lifestyle: [],
        experience: [],
        homeType: [],
        spaceAvailable: [],
        livingSpace: [],
        timeAvailable: [],
        activityLevel: [],
        preferredSpecies: [],
        budget: [],
        hasChildren: [],
        hasOtherPets: [],
        hasYard: [],
        // Additional fields initialized as arrays
        preferredTypes: [],
        preferredSizes: [],
        preferredAges: [],
        preferredBreeds: [],
        workSchedule: [],
        travelFrequency: [],
        noiseTolerance: [],
        groomingPreference: [],
        trainingCommitment: [],
        allergies: [],
        additionalInfo: "",
    });

    const [currentStep, setCurrentStep] = useState(1);
    const totalSteps = 4;

    const handleNextStep = () => {
        if (currentStep < totalSteps) {
            setCurrentStep(currentStep + 1);
        }
    };

    const handlePreviousStep = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleEditStep = (step: number) => {
        setCurrentStep(step);
    };

    const resetPreferences = () => {
        setPreferences({
            lifestyle: [],
            experience: [],
            homeType: [],
            spaceAvailable: [],
            livingSpace: [],
            timeAvailable: [],
            activityLevel: [],
            preferredSpecies: [],
            budget: [],
            hasChildren: [],
            hasOtherPets: [],
            hasYard: [],
            // Additional fields reset as arrays
            preferredTypes: [],
            preferredSizes: [],
            preferredAges: [],
            preferredBreeds: [],
            workSchedule: [],
            travelFrequency: [],
            noiseTolerance: [],
            groomingPreference: [],
            trainingCommitment: [],
            allergies: [],
            additionalInfo: "",
        });
        setCurrentStep(1);
    };

    const canProceedToNext = (): boolean => {
        const stepValidators = {
            1: () => !!(
                preferences.lifestyle &&
                preferences.lifestyle.length > 0 &&
                preferences.experience &&
                preferences.experience.length > 0 &&
                preferences.timeAvailable &&
                preferences.timeAvailable.length > 0
            ),
            2: () => !!(
                preferences.livingSpace &&
                preferences.livingSpace.length > 0 &&
                preferences.hasChildren &&
                preferences.hasChildren.length > 0 &&
                preferences.hasOtherPets &&
                preferences.hasOtherPets.length > 0 &&
                preferences.budget &&
                preferences.budget.length > 0
            ),
            3: () => preferences.preferredSpecies.length > 0,
            4: () => true,
        };

        return stepValidators[currentStep]?.() ?? false;
    };

    return {
        preferences,
        setPreferences,
        currentStep,
        totalSteps,
        handleNextStep,
        handlePreviousStep,
        handleEditStep,
        resetPreferences,
        canProceedToNext,
    };
}; 