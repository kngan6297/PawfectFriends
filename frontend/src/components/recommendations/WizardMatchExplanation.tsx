import React from "react";
import { CheckCircle, XCircle, Info } from "lucide-react";

interface WizardMatchExplanationProps {
  pet: any;
  score: number;
  preferences: any;
}

export const WizardMatchExplanation: React.FC<WizardMatchExplanationProps> = ({
  pet,
  score,
  preferences,
}) => {
  const getMatchReasons = () => {
    const reasons = [];

    // Check lifestyle compatibility
    if (preferences.lifestyle === "active" && pet.energyLevel === "high") {
      reasons.push({
        type: "match",
        text: "High energy pet matches your active lifestyle",
      });
    } else if (
      preferences.lifestyle === "homebody" &&
      pet.energyLevel === "low"
    ) {
      reasons.push({
        type: "match",
        text: "Low energy pet fits your relaxed lifestyle",
      });
    } else if (preferences.lifestyle === "busy" && pet.energyLevel === "low") {
      reasons.push({
        type: "match",
        text: "Low maintenance pet fits your busy schedule",
      });
    }

    // Check living space compatibility
    if (
      preferences.livingSpace?.includes("apartment") &&
      pet.size === "small"
    ) {
      reasons.push({
        type: "match",
        text: "Small pet suitable for apartment living",
      });
    } else if (
      preferences.livingSpace?.includes("yard") &&
      pet.energyLevel === "high"
    ) {
      reasons.push({
        type: "match",
        text: "High energy pet needs your yard space",
      });
    }

    // Check species preference
    if (preferences.preferredSpecies?.includes(pet.species?.toLowerCase())) {
      reasons.push({
        type: "match",
        text: `Matches your preferred species: ${pet.species}`,
      });
    }

    // Check time availability
    if (preferences.timeAvailable === "minimal" && pet.energyLevel === "low") {
      reasons.push({
        type: "match",
        text: "Low maintenance pet fits your limited time",
      });
    } else if (
      preferences.timeAvailable === "significant" &&
      pet.energyLevel === "high"
    ) {
      reasons.push({
        type: "match",
        text: "High energy pet needs your available time",
      });
    }

    // Check experience level
    if (
      preferences.experience === "first-time" &&
      pet.trainingLevel === "easy"
    ) {
      reasons.push({
        type: "match",
        text: "Easy to train, perfect for first-time owners",
      });
    }

    return reasons;
  };

  const getMismatchReasons = () => {
    const mismatches = [];

    // Check for potential mismatches
    if (
      preferences.livingSpace?.includes("apartment") &&
      pet.size === "large"
    ) {
      mismatches.push({
        type: "mismatch",
        text: "Large pet may need more space than your apartment",
      });
    }

    if (preferences.timeAvailable === "minimal" && pet.energyLevel === "high") {
      mismatches.push({
        type: "mismatch",
        text: "High energy pet needs more time than you have available",
      });
    }

    if (
      preferences.experience === "first-time" &&
      pet.trainingLevel === "advanced"
    ) {
      mismatches.push({
        type: "mismatch",
        text: "Advanced training needs may be challenging for first-time owners",
      });
    }

    return mismatches;
  };

  const reasons = getMatchReasons();
  const mismatches = getMismatchReasons();
  const hasReasons = reasons.length > 0 || mismatches.length > 0;

  if (!hasReasons) {
    return (
      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center text-sm text-gray-600">
          <Info className="h-4 w-4 mr-2" />
          <span>
            Match score: {Math.round(score * 100)}% based on your preferences
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
      <div className="text-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="font-medium text-gray-700">Why this match?</span>
          <span className="text-xs text-gray-500">
            Score: {Math.round(score * 100)}%
          </span>
        </div>

        {reasons.length > 0 && (
          <div className="space-y-1 mb-2">
            {reasons.map((reason, index) => (
              <div
                key={index}
                className="flex items-center text-xs text-green-700"
              >
                <CheckCircle className="h-3 w-3 mr-1 flex-shrink-0" />
                <span>{reason.text}</span>
              </div>
            ))}
          </div>
        )}

        {mismatches.length > 0 && (
          <div className="space-y-1">
            {mismatches.map((mismatch, index) => (
              <div
                key={index}
                className="flex items-center text-xs text-amber-700"
              >
                <XCircle className="h-3 w-3 mr-1 flex-shrink-0" />
                <span>{mismatch.text}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
