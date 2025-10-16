import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Checkbox } from "@/components/ui/Checkbox";
import {
  User,
  Home,
  Clock,
  DollarSign,
  Heart,
  Users,
  PawPrint,
  Settings,
  ChevronDown,
  ChevronUp,
  Save,
  Loader2,
} from "lucide-react";
import { UserRequirements } from "@/types/user";
import { recommendationService } from "@/services/recommendation.service";

interface UserRequirementsFormProps {
  initialRequirements?: Partial<UserRequirements>;
  onSave?: (requirements: UserRequirements) => void;
  onCancel?: () => void;
  showProgress?: boolean;
}

export const UserRequirementsForm: React.FC<UserRequirementsFormProps> = ({
  initialRequirements = {},
  onSave,
  onCancel,
  showProgress = true,
}) => {
  const [requirements, setRequirements] =
    useState<Partial<UserRequirements>>(initialRequirements);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(["basic"])
  );
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Calculate completion percentage
  const calculateCompletion = (): number => {
    const requiredFields = [
      "petType",
      "experienceLevel",
      "livingSituation",
      "activityLevel",
      "timeAvailability",
      "budgetRange",
      "allergyFriendly",
      "openToSpecialNeeds",
      "hasChildren",
      "hasOtherPets",
      "trainingPreference",
      "groomingPreference",
      "exercisePreference",
      "socialPreference",
      "independencePreference",
      "medicalCarePreference",
      "patienceLevel",
      "travelFrequency",
      "workSchedule",
      "homeEnvironment",
      "hasYard",
      "climate",
      "commitmentLevel",
    ];

    const completedFields = requiredFields.filter(
      (field) =>
        requirements[field as keyof UserRequirements] !== undefined &&
        requirements[field as keyof UserRequirements] !== null
    ).length;

    return Math.round((completedFields / requiredFields.length) * 100);
  };

  const completionPercentage = calculateCompletion();

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const updateRequirement = (field: keyof UserRequirements, value: any) => {
    setRequirements((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear validation errors when user starts filling the form
    if (validationErrors.length > 0) {
      setValidationErrors([]);
    }
  };

  const validateForm = (): boolean => {
    const errors: string[] = [];

    if (!requirements.petType) {
      errors.push("Pet type is required");
    }

    if (!requirements.experienceLevel) {
      errors.push("Experience level is required");
    }

    if (!requirements.livingSituation) {
      errors.push("Living situation is required");
    }

    if (requirements.hasChildren && requirements.childrenAgeRange) {
      if (
        requirements.childrenAgeRange.min > requirements.childrenAgeRange.max
      ) {
        errors.push("Children age range is invalid");
      }
    }

    if (requirements.hasYard && requirements.yardSize === "none") {
      errors.push("Yard size cannot be none if hasYard is true");
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      const updatedRequirements = {
        ...requirements,
        lastUpdated: new Date(),
        completionPercentage: calculateCompletion(),
      };

      if (onSave) {
        onSave(updatedRequirements as UserRequirements);
      } else {
        await recommendationService.updateUserRequirements(updatedRequirements);
      }
    } catch (error) {
      console.error("Failed to save requirements:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderSectionHeader = (
    section: string,
    title: string,
    icon: React.ReactNode
  ) => (
    <button
      type="button"
      onClick={() => toggleSection(section)}
      className="flex items-center justify-between w-full p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
    >
      <div className="flex items-center gap-3">
        {icon}
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      </div>
      {expandedSections.has(section) ? (
        <ChevronUp className="w-5 h-5 text-gray-500" />
      ) : (
        <ChevronDown className="w-5 h-5 text-gray-500" />
      )}
    </button>
  );

  const renderSelect = (
    label: string,
    field: keyof UserRequirements,
    options: Array<{ value: string; label: string }>,
    required = false
  ) => (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <Select
        value={(requirements[field] as string) || ""}
        onValueChange={(value) => updateRequirement(field, value)}
        required={required}
      >
        <option value="">Select {label.toLowerCase()}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
    </div>
  );

  const renderCheckbox = (
    label: string,
    field: keyof UserRequirements,
    description?: string
  ) => (
    <div className="flex items-start space-x-3">
      <Checkbox
        id={field}
        name={field}
        value={field}
        checked={(requirements[field] as boolean) || false}
        onChange={(checked: boolean) => updateRequirement(field, checked)}
        label={label}
        className="mt-1"
      />
      {description && (
        <p className="text-sm text-gray-500 ml-2">{description}</p>
      )}
    </div>
  );

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <User className="w-6 h-6 text-blue-600" />
        <h2 className="text-2xl font-semibold">Pet Matching Requirements</h2>
      </div>

      {showProgress && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-800">
              Profile Completion
            </span>
            <span className="text-sm font-medium text-blue-800">
              {completionPercentage}%
            </span>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
          <p className="text-xs text-blue-600 mt-1">
            Complete your profile for better pet recommendations
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Preferences */}
        <div className="space-y-4">
          {renderSectionHeader(
            "basic",
            "Basic Pet Preferences",
            <PawPrint className="w-5 h-5" />
          )}

          {expandedSections.has("basic") && (
            <div className="p-4 space-y-4">
              {renderSelect(
                "Pet Type",
                "petType",
                [
                  { value: "dog", label: "Dog" },
                  { value: "cat", label: "Cat" },
                  { value: "bird", label: "Bird" },
                  { value: "other", label: "Other" },
                ],
                true
              )}

              {renderSelect("Gender Preference", "gender", [
                { value: "male", label: "Male" },
                { value: "female", label: "Female" },
                { value: "unknown", label: "No Preference" },
              ])}

              {renderSelect("Size Preference", "size", [
                { value: "small", label: "Small" },
                { value: "medium", label: "Medium" },
                { value: "large", label: "Large" },
              ])}

              {renderSelect("Age Preference", "age", [
                { value: "baby", label: "Baby" },
                { value: "young", label: "Young" },
                { value: "adult", label: "Adult" },
                { value: "senior", label: "Senior" },
              ])}
            </div>
          )}
        </div>

        {/* Experience & Lifestyle */}
        <div className="space-y-4">
          {renderSectionHeader(
            "experience",
            "Experience & Lifestyle",
            <User className="w-5 h-5" />
          )}

          {expandedSections.has("experience") && (
            <div className="p-4 space-y-4">
              {renderSelect(
                "Experience Level",
                "experienceLevel",
                [
                  { value: "first-time", label: "First-time Owner" },
                  { value: "experienced", label: "Experienced Owner" },
                  { value: "expert", label: "Expert Owner" },
                ],
                true
              )}

              {renderSelect(
                "Living Situation",
                "livingSituation",
                [
                  { value: "apartment", label: "Apartment" },
                  { value: "house", label: "House" },
                  { value: "condo", label: "Condo" },
                  { value: "farm", label: "Farm/Rural" },
                ],
                true
              )}

              {renderSelect(
                "Activity Level",
                "activityLevel",
                [
                  { value: "low", label: "Low - Relaxed lifestyle" },
                  { value: "medium", label: "Medium - Balanced lifestyle" },
                  { value: "high", label: "High - Active lifestyle" },
                ],
                true
              )}

              {renderSelect(
                "Time Availability",
                "timeAvailability",
                [
                  { value: "low", label: "Low - Limited time" },
                  { value: "medium", label: "Medium - Some time available" },
                  { value: "high", label: "High - Plenty of time" },
                ],
                true
              )}
            </div>
          )}
        </div>

        {/* Care & Training */}
        <div className="space-y-4">
          {renderSectionHeader(
            "care",
            "Care & Training",
            <Settings className="w-5 h-5" />
          )}

          {expandedSections.has("care") && (
            <div className="p-4 space-y-4">
              {renderSelect(
                "Training Preference",
                "trainingPreference",
                [
                  { value: "none", label: "No training needed" },
                  { value: "basic", label: "Basic training" },
                  { value: "advanced", label: "Advanced training" },
                ],
                true
              )}

              {renderSelect(
                "Grooming Preference",
                "groomingPreference",
                [
                  { value: "minimal", label: "Minimal grooming" },
                  { value: "moderate", label: "Moderate grooming" },
                  { value: "high", label: "High grooming needs" },
                ],
                true
              )}

              {renderSelect(
                "Exercise Preference",
                "exercisePreference",
                [
                  { value: "low", label: "Low exercise needs" },
                  { value: "medium", label: "Medium exercise needs" },
                  { value: "high", label: "High exercise needs" },
                ],
                true
              )}

              {renderSelect(
                "Medical Care Preference",
                "medicalCarePreference",
                [
                  { value: "basic", label: "Basic care only" },
                  { value: "moderate", label: "Moderate care needs" },
                  { value: "advanced", label: "Advanced care needs" },
                ],
                true
              )}
            </div>
          )}
        </div>

        {/* Family & Environment */}
        <div className="space-y-4">
          {renderSectionHeader(
            "family",
            "Family & Environment",
            <Users className="w-5 h-5" />
          )}

          {expandedSections.has("family") && (
            <div className="p-4 space-y-4">
              {renderCheckbox(
                "Have Children",
                "hasChildren",
                "Do you have children in your household?"
              )}

              {requirements.hasChildren && (
                <div className="ml-6 space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Children Age Range
                  </label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      placeholder="Min age"
                      value={requirements.childrenAgeRange?.min || ""}
                      onChange={(e) =>
                        updateRequirement("childrenAgeRange", {
                          ...requirements.childrenAgeRange,
                          min: parseInt(e.target.value),
                        })
                      }
                      className="w-20"
                    />
                    <span className="text-gray-500">to</span>
                    <Input
                      type="number"
                      placeholder="Max age"
                      value={requirements.childrenAgeRange?.max || ""}
                      onChange={(e) =>
                        updateRequirement("childrenAgeRange", {
                          ...requirements.childrenAgeRange,
                          max: parseInt(e.target.value),
                        })
                      }
                      className="w-20"
                    />
                  </div>
                </div>
              )}

              {renderCheckbox(
                "Have Other Pets",
                "hasOtherPets",
                "Do you have other pets in your household?"
              )}

              {requirements.hasOtherPets && (
                <div className="ml-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Other Pet Types
                  </label>
                  <Input
                    placeholder="e.g., cats, dogs, birds"
                    value={requirements.otherPetTypes?.join(", ") || ""}
                    onChange={(e) =>
                      updateRequirement(
                        "otherPetTypes",
                        e.target.value.split(",").map((s) => s.trim())
                      )
                    }
                  />
                </div>
              )}

              {renderCheckbox(
                "Have Yard",
                "hasYard",
                "Do you have access to a yard or outdoor space?"
              )}

              {requirements.hasYard && (
                <div className="ml-6">
                  {renderSelect("Yard Size", "yardSize", [
                    { value: "small", label: "Small yard" },
                    { value: "medium", label: "Medium yard" },
                    { value: "large", label: "Large yard" },
                  ])}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Special Considerations */}
        <div className="space-y-4">
          {renderSectionHeader(
            "special",
            "Special Considerations",
            <Heart className="w-5 h-5" />
          )}

          {expandedSections.has("special") && (
            <div className="p-4 space-y-4">
              {renderCheckbox(
                "Need Allergy-Friendly Pet",
                "allergyFriendly",
                "Do you or family members have pet allergies?"
              )}

              {renderCheckbox(
                "Open to Special Needs Pets",
                "openToSpecialNeeds",
                "Are you open to adopting pets with special needs?"
              )}

              {renderSelect("Work Schedule", "workSchedule", [
                { value: "flexible", label: "Flexible schedule" },
                { value: "part-time", label: "Part-time work" },
                { value: "full-time", label: "Full-time work" },
                { value: "shift-work", label: "Shift work" },
              ])}

              {renderSelect("Travel Frequency", "travelFrequency", [
                { value: "rarely", label: "Rarely travel" },
                { value: "occasionally", label: "Occasionally travel" },
                { value: "frequently", label: "Frequently travel" },
              ])}

              {renderSelect("Home Environment", "homeEnvironment", [
                { value: "quiet", label: "Quiet environment" },
                { value: "moderate", label: "Moderate activity" },
                { value: "busy", label: "Busy environment" },
              ])}

              {renderSelect("Climate", "climate", [
                { value: "cold", label: "Cold climate" },
                { value: "moderate", label: "Moderate climate" },
                { value: "hot", label: "Hot climate" },
                { value: "variable", label: "Variable climate" },
              ])}
            </div>
          )}
        </div>

        {/* Preferences & Notes */}
        <div className="space-y-4">
          {renderSectionHeader(
            "preferences",
            "Preferences & Notes",
            <Settings className="w-5 h-5" />
          )}

          {expandedSections.has("preferences") && (
            <div className="p-4 space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Preferred Breeds
                </label>
                <Input
                  placeholder="e.g., Golden Retriever, Persian Cat"
                  value={requirements.preferredBreeds?.join(", ") || ""}
                  onChange={(e) =>
                    updateRequirement(
                      "preferredBreeds",
                      e.target.value.split(",").map((s) => s.trim())
                    )
                  }
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Deal Breakers
                </label>
                <Input
                  placeholder="e.g., aggressive, excessive barking"
                  value={requirements.dealBreakers?.join(", ") || ""}
                  onChange={(e) =>
                    updateRequirement(
                      "dealBreakers",
                      e.target.value.split(",").map((s) => s.trim())
                    )
                  }
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Additional Notes
                </label>
                <Textarea
                  placeholder="Any other preferences or considerations..."
                  value={requirements.additionalNotes || ""}
                  onChange={(e) =>
                    updateRequirement("additionalNotes", e.target.value)
                  }
                  rows={3}
                />
              </div>
            </div>
          )}
        </div>

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
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
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Please complete the following:
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <ul className="list-disc pl-5 space-y-1">
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
        <div className="flex gap-3 pt-6">
          <Button
            type="submit"
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {isLoading ? "Saving..." : "Save Requirements"}
          </Button>

          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
        </div>

        <p className="text-xs text-gray-500 text-center">
          Your requirements help us provide better pet recommendations. You can
          update these anytime from your profile.
        </p>
      </form>
    </Card>
  );
};
