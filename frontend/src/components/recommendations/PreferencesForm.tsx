import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  Brain,
  Zap,
  ChevronDown,
  ChevronUp,
  Settings,
  User,
} from "lucide-react";
import { ScoringPreferences } from "@/services/recommendation.service";
import { UserRequirements } from "@/types/user";
import { normalizePreferences } from "@/utils/preferences";

interface PreferencesFormProps {
  preferences: ScoringPreferences;
  onPreferencesChange: (newPrefs: ScoringPreferences) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  onLoadPreviousSession: () => void;

  onToggleSelectType: () => void;
}

export const PreferencesForm: React.FC<PreferencesFormProps> = ({
  preferences,
  onPreferencesChange,
  onSubmit,
  isLoading,
  onLoadPreviousSession,
  onToggleSelectType,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(() => {
    // Load advanced preferences state from localStorage
    const saved = localStorage.getItem("preferencesForm_showAdvanced");
    return saved ? JSON.parse(saved) : false;
  });
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const firstErrorRef = useRef<HTMLDivElement>(null);

  // Focus on first error field when validation fails
  useEffect(() => {
    if (validationErrors.length > 0 && firstErrorRef.current) {
      firstErrorRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      firstErrorRef.current.focus?.();
    }
  }, [validationErrors]);

  // Handle advanced preferences toggle and persist to localStorage
  const handleAdvancedToggle = () => {
    const newState = !showAdvanced;
    setShowAdvanced(newState);
    localStorage.setItem(
      "preferencesForm_showAdvanced",
      JSON.stringify(newState)
    );
  };

  // Simplified form completion check - only essential fields
  const isFormComplete = (): boolean => {
    return !!(
      preferences.preferredSpecies &&
      preferences.preferredSpecies.length > 0 &&
      preferences.lifestyle &&
      preferences.lifestyle.length > 0 &&
      preferences.experience &&
      preferences.experience.length > 0
    );
  };

  // Clear validation errors when preferences change
  const updatePreferences = (updates: Partial<ScoringPreferences>) => {
    // Merge the updates with existing preferences and return full object
    const newPreferences = { ...preferences, ...updates };
    console.log("PreferencesForm - updatePreferences:", {
      old: preferences,
      updates,
      new: newPreferences,
    });
    onPreferencesChange(newPreferences);
    // Clear validation errors when user starts filling the form
    if (validationErrors.length > 0) {
      setValidationErrors([]);
    }
  };

  const validateForm = (): boolean => {
    const errors: string[] = [];

    // Simplified validation - only essential fields
    if (
      !preferences.preferredSpecies ||
      preferences.preferredSpecies.length === 0
    ) {
      errors.push("Please select at least one preferred species");
    }

    if (!preferences.lifestyle || preferences.lifestyle.length === 0) {
      errors.push("Please select your lifestyle");
    }

    if (!preferences.experience || preferences.experience.length === 0) {
      errors.push("Please select your experience level");
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form before submitting
    if (!validateForm()) {
      return;
    }

    // Normalize preferences to ensure all fields are arrays before submitting
    // This makes it easier for the AI service to handle the data consistently
    const normalizedPrefs = normalizePreferences(preferences);
    onPreferencesChange(normalizedPrefs);

    onSubmit(e);
  };

  // Core preference options
  const speciesOptions = [
    { value: "dog", label: "Dogs", emoji: "🐕" },
    { value: "cat", label: "Cats", emoji: "🐱" },
    { value: "bird", label: "Birds", emoji: "🦜" },
    { value: "rabbit", label: "Rabbits", emoji: "🐰" },
    { value: "hamster", label: "Hamsters", emoji: "🐹" },
    { value: "fish", label: "Fish", emoji: "🐠" },
  ];

  const lifestyleOptions = [
    { value: "homebody", label: "Homebody", emoji: "🏠" },
    { value: "busy", label: "Busy/Work", emoji: "💼" },
    { value: "active", label: "Active", emoji: "🏃‍♂️" },
    { value: "traveler", label: "Traveler", emoji: "✈️" },
    { value: "student", label: "Student", emoji: "📚" },
    { value: "retired", label: "Retired", emoji: "🌅" },
  ];

  const experienceOptions = [
    { value: "first-time", label: "First Time", emoji: "🆕" },
    { value: "some", label: "Some Experience", emoji: "📝" },
    { value: "experienced", label: "Experienced", emoji: "🎯" },
    { value: "professional", label: "Professional", emoji: "👨‍⚕️" },
  ];

  const kidsOptions = [
    { value: "yes", label: "Yes", emoji: "👶" },
    { value: "no", label: "No", emoji: "🚫" },
  ];

  const otherPetsOptions = [
    { value: "yes", label: "Yes", emoji: "🐾" },
    { value: "no", label: "No", emoji: "🚫" },
  ];

  // Advanced preference options
  const budgetOptions = [
    { value: "low", label: "Low Budget", emoji: "💰" },
    { value: "medium", label: "Medium Budget", emoji: "💵" },
    { value: "high", label: "High Budget", emoji: "💎" },
  ];

  const activityLevelOptions = [
    { value: "low", label: "Low Energy", emoji: "😴" },
    { value: "moderate", label: "Moderate", emoji: "⚡" },
    { value: "high", label: "High Energy", emoji: "🔥" },
  ];

  const livingSpaceOptions = [
    { value: "apartment-limited", label: "Small Apartment", emoji: "🏢" },
    { value: "apartment-moderate", label: "Medium Apartment", emoji: "🏠" },
    { value: "house", label: "House", emoji: "🏡" },
    { value: "rural", label: "Rural/Farm", emoji: "🌲" },
  ];

  const timeAvailableOptions = [
    { value: "minimal", label: "<1 hour", emoji: "⏰" },
    { value: "moderate", label: "1-3 hours", emoji: "⏰" },
    { value: "significant", label: "3+ hours", emoji: "⏰" },
    { value: "wfh", label: "Work from Home", emoji: "🏠" },
  ];

  const distanceOptions = [
    { value: "5", label: "📍 5 miles", emoji: "📍" },
    { value: "10", label: "📍 10 miles", emoji: "📍" },
    { value: "25", label: "📍 25 miles", emoji: "📍" },
    { value: "50", label: "📍 50 miles", emoji: "📍" },
    { value: "100", label: "📍 100+ miles", emoji: "📍" },
  ];

  const renderPillToggle = (
    options: Array<{ value: string; label: string; emoji: string }>,
    field: keyof ScoringPreferences,
    multiSelect: boolean = false
  ) => {
    const selectedCount = multiSelect
      ? (preferences[field] as string[])?.length || 0
      : 0;

    return (
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {options.map((option) => {
            let isSelected = false;

            // Handle maxDistance field specially since it's a number
            if (field === "maxDistance") {
              isSelected = preferences.maxDistance === parseInt(option.value);
            } else {
              isSelected = multiSelect
                ? (preferences[field] as string[])?.includes(option.value) ||
                  false
                : (preferences[field] as string[])?.includes(option.value) ||
                  false;
            }

            return (
              <Button
                key={option.value}
                type="button"
                aria-pressed={isSelected}
                aria-label={option.label}
                onClick={() => {
                  if (field === "maxDistance") {
                    // For maxDistance, store as number
                    updatePreferences({ [field]: parseInt(option.value) });
                  } else if (multiSelect) {
                    const currentValues =
                      (preferences[field] as string[]) || [];
                    const newValues = isSelected
                      ? currentValues.filter((v) => v !== option.value)
                      : [...currentValues, option.value];
                    updatePreferences({ [field]: newValues });
                  } else {
                    // For single-select fields, store as array for consistency
                    updatePreferences({ [field]: [option.value] });
                  }
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-full border-2 transition-all duration-200 ${
                  isSelected
                    ? "border-blue-500 bg-blue-50 text-blue-700 shadow-sm"
                    : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                <span className="text-lg">{option.emoji}</span>
                <span className="font-medium">{option.label}</span>
              </Button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <Zap className="w-6 h-6 text-blue-600" />
        <h2 className="text-2xl font-semibold">Quick AI Matching</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Core Preferences - Always Visible */}
        <div className="space-y-6">
          {/* Species Selection */}
          <div ref={firstErrorRef}>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              What type of pet are you looking for? *
            </label>
            {renderPillToggle(speciesOptions, "preferredSpecies", true)}
          </div>

          {/* Lifestyle */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              How would you describe your lifestyle? *
            </label>
            {renderPillToggle(lifestyleOptions, "lifestyle", false)}
          </div>

          {/* Experience */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              What's your experience with pets? *
            </label>
            {renderPillToggle(experienceOptions, "experience", false)}
          </div>

          {/* Kids - Optional but important */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Do you have kids? (Optional)
            </label>
            {renderPillToggle(kidsOptions, "hasChildren")}
          </div>

          {/* Other Pets - Optional but important */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Do you have other pets? (Optional)
            </label>
            {renderPillToggle(otherPetsOptions, "hasOtherPets")}
          </div>
        </div>

        {/* Advanced Preferences - Collapsible */}
        <div className="border-t pt-6">
          <Button
            type="button"
            onClick={handleAdvancedToggle}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
            variant="outline"
          >
            <Settings className="w-4 h-4" />
            <span className="font-medium">Advanced Preferences</span>
            {showAdvanced ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </Button>

          {showAdvanced && (
            <div className="mt-4 space-y-6 pl-4 border-l-2 border-gray-200">
              {/* Budget */}
              <div>
                <label
                  className="block text-sm font-medium text-gray-700 mb-3"
                  title="Consider ongoing costs like food, vet care, grooming, and supplies"
                >
                  Budget Range
                </label>
                {renderPillToggle(budgetOptions, "budget")}
              </div>

              {/* Activity Level */}
              <div>
                <label
                  className="block text-sm font-medium text-gray-700 mb-3"
                  title="How much energy and exercise the pet needs daily"
                >
                  Preferred Pet Activity Level
                </label>
                {renderPillToggle(activityLevelOptions, "activityLevel")}
              </div>

              {/* Living Space */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Living Space
                </label>
                {renderPillToggle(livingSpaceOptions, "livingSpace")}
              </div>

              {/* Time Available */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Daily Time Available
                </label>
                {renderPillToggle(timeAvailableOptions, "timeAvailable")}
              </div>
            </div>
          )}
        </div>

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg
                  className="h-4 w-4 text-red-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-2">
                <h3 className="text-sm font-medium text-red-800">
                  Please complete:
                </h3>
                <div className="mt-1 text-sm text-red-700">
                  <ul className="list-disc pl-4 space-y-1">
                    {validationErrors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button
            type="submit"
            disabled={isLoading || !isFormComplete()}
            className="flex items-center gap-2"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Brain className="w-4 h-4" />
            )}
            {isLoading
              ? "Analyzing..."
              : !isFormComplete()
              ? "Complete Required Fields"
              : "Get AI Matches"}
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={onLoadPreviousSession}
            className="text-sm"
          >
            Load Previous
          </Button>
        </div>

        <p className="text-xs text-gray-500 mt-2 text-center">
          Need guidance?{" "}
          <Link
            to="/recommendations/wizard"
            className="text-primary-600 underline"
          >
            🧭 Try the step-by-step version
          </Link>{" "}
          or{" "}
          <Link
            to="/profile/requirements"
            className="text-primary-600 underline"
          >
            📝 set detailed requirements
          </Link>
        </p>
      </form>
    </Card>
  );
};
