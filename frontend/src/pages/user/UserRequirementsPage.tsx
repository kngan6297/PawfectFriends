import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { UserRequirementsForm } from "@/components/recommendations/UserRequirementsForm";
import { recommendationService } from "@/services/recommendation.service";
import { UserRequirements } from "@/types/user";
import { formatDisplayDate } from "@/utils/dateUtils";
import {
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Info,
  Target,
  TrendingUp,
} from "lucide-react";

export const UserRequirementsPage: React.FC = () => {
  const [requirements, setRequirements] = useState<UserRequirements | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadRequirements();
  }, []);

  const loadRequirements = async () => {
    try {
      setIsLoading(true);
      const userRequirements =
        await recommendationService.getUserRequirements();
      setRequirements(userRequirements);
    } catch (error) {
      console.error("Failed to load requirements:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (updatedRequirements: UserRequirements) => {
    try {
      await recommendationService.updateUserRequirements(updatedRequirements);
      setRequirements(updatedRequirements);
      setIsEditing(false);
      setSaveSuccess(true);

      // Hide success message after 3 seconds
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error("Failed to save requirements:", error);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Reload original requirements
    loadRequirements();
  };

  const getCompletionStatus = () => {
    if (!requirements)
      return { level: "none", color: "gray", message: "No requirements set" };

    const completion = requirements.completionPercentage || 0;

    if (completion >= 90) {
      return {
        level: "excellent",
        color: "green",
        message: "Excellent profile completion!",
      };
    } else if (completion >= 70) {
      return {
        level: "good",
        color: "blue",
        message: "Good profile completion",
      };
    } else if (completion >= 50) {
      return {
        level: "fair",
        color: "yellow",
        message: "Fair profile completion",
      };
    } else {
      return {
        level: "poor",
        color: "red",
        message: "Profile needs completion",
      };
    }
  };

  const getRecommendationQuality = () => {
    if (!requirements) return "No requirements set";

    const completion = requirements.completionPercentage || 0;

    if (completion >= 90)
      return "Excellent - Highly personalized recommendations";
    if (completion >= 70) return "Good - Well-personalized recommendations";
    if (completion >= 50)
      return "Fair - Moderately personalized recommendations";
    return "Poor - Basic recommendations only";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  const completionStatus = getCompletionStatus();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>

          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Pet Matching Requirements
            </h1>
            <p className="text-gray-600 mt-1">
              Set your preferences to get better pet recommendations
            </p>
          </div>
        </div>

        {/* Success Message */}
        {saveSuccess && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <h3 className="text-sm font-medium text-green-800">
                  Requirements saved successfully!
                </h3>
                <p className="text-sm text-green-700 mt-1">
                  Your pet matching profile has been updated.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Requirements Summary */}
        {requirements && !isEditing && (
          <Card className="p-6 mb-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Current Requirements
                </h2>
                <p className="text-gray-600">
                  Your current pet matching preferences and profile completion
                  status.
                </p>
              </div>

              <Button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2"
              >
                <Target className="w-4 h-4" />
                Edit Requirements
              </Button>
            </div>

            {/* Completion Status */}
            <div
              className={`p-4 rounded-lg mb-4 ${
                completionStatus.color === "green"
                  ? "bg-green-50 border border-green-200"
                  : completionStatus.color === "blue"
                  ? "bg-blue-50 border border-blue-200"
                  : completionStatus.color === "yellow"
                  ? "bg-yellow-50 border border-yellow-200"
                  : "bg-red-50 border border-red-200"
              }`}
            >
              <div className="flex items-center gap-3">
                {completionStatus.color === "green" ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : completionStatus.color === "red" ? (
                  <AlertCircle className="w-5 h-5 text-red-600" />
                ) : (
                  <Info className="w-5 h-5 text-blue-600" />
                )}
                <div>
                  <h3 className="text-sm font-medium text-gray-800">
                    {completionStatus.message}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {getRecommendationQuality()}
                  </p>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Profile Completion
                </span>
                <span className="text-sm font-medium text-gray-700">
                  {requirements.completionPercentage || 0}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all duration-300 ${
                    completionStatus.color === "green"
                      ? "bg-green-600"
                      : completionStatus.color === "blue"
                      ? "bg-blue-600"
                      : completionStatus.color === "yellow"
                      ? "bg-yellow-600"
                      : "bg-red-600"
                  }`}
                  style={{
                    width: `${requirements.completionPercentage || 0}%`,
                  }}
                />
              </div>
            </div>

            {/* Key Requirements Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900">Pet Preferences</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>
                    <strong>Type:</strong>{" "}
                    {requirements.petType || "Not specified"}
                  </p>
                  <p>
                    <strong>Size:</strong>{" "}
                    {requirements.size || "Not specified"}
                  </p>
                  <p>
                    <strong>Age:</strong> {requirements.age || "Not specified"}
                  </p>
                  <p>
                    <strong>Gender:</strong>{" "}
                    {requirements.gender || "No preference"}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium text-gray-900">Lifestyle</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>
                    <strong>Experience:</strong>{" "}
                    {requirements.experienceLevel || "Not specified"}
                  </p>
                  <p>
                    <strong>Living:</strong>{" "}
                    {requirements.livingSituation || "Not specified"}
                  </p>
                  <p>
                    <strong>Activity:</strong>{" "}
                    {requirements.activityLevel || "Not specified"}
                  </p>
                  <p>
                    <strong>Time:</strong>{" "}
                    {requirements.timeAvailability || "Not specified"}
                  </p>
                </div>
              </div>
            </div>

            {/* Special Considerations */}
            {(requirements.allergyFriendly ||
              requirements.openToSpecialNeeds ||
              requirements.hasChildren ||
              requirements.hasOtherPets) && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">
                  Special Considerations
                </h4>
                <div className="text-sm text-gray-600 space-y-1">
                  {requirements.allergyFriendly && (
                    <p>• Need allergy-friendly pets</p>
                  )}
                  {requirements.openToSpecialNeeds && (
                    <p>• Open to special needs pets</p>
                  )}
                  {requirements.hasChildren && (
                    <p>• Have children in household</p>
                  )}
                  {requirements.hasOtherPets && <p>• Have other pets</p>}
                </div>
              </div>
            )}

            {/* Last Updated */}
            {requirements.lastUpdated && (
              <div className="mt-4 text-xs text-gray-500">
                Last updated:{" "}
                {formatDisplayDate(new Date(requirements.lastUpdated))}
              </div>
            )}
          </Card>
        )}

        {/* Requirements Form */}
        {isEditing ? (
          <UserRequirementsForm
            initialRequirements={requirements || {}}
            onSave={handleSave}
            onCancel={handleCancel}
            showProgress={true}
          />
        ) : (
          <Card className="p-6">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <TrendingUp className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Ready to improve your recommendations?
              </h3>
              <p className="text-gray-600 mb-4">
                Set your detailed pet matching requirements to get more
                personalized and accurate recommendations.
              </p>
              <Button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2"
              >
                <Target className="w-4 h-4" />
                Set Requirements
              </Button>
            </div>
          </Card>
        )}

        {/* Tips */}
        <Card className="p-6 mt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Tips for Better Recommendations
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
            <div className="space-y-2">
              <p>
                • <strong>Be specific</strong> about your living situation and
                lifestyle
              </p>
              <p>
                • <strong>Consider your experience level</strong> with pets
              </p>
              <p>
                • <strong>Think about your time availability</strong> for pet
                care
              </p>
              <p>
                • <strong>Include special considerations</strong> like allergies
                or children
              </p>
            </div>
            <div className="space-y-2">
              <p>
                • <strong>Update regularly</strong> as your situation changes
              </p>
              <p>
                • <strong>Be honest</strong> about your capabilities and
                limitations
              </p>
              <p>
                • <strong>Consider your budget</strong> for pet care and
                supplies
              </p>
              <p>
                • <strong>Think long-term</strong> about your commitment level
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
