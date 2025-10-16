import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  Target,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Info,
  ChevronRight,
} from "lucide-react";
import { recommendationService } from "@/services/recommendation.service";
import { UserRequirements } from "@/types/user";

interface RequirementsWidgetProps {
  showDetails?: boolean;
  showActionButton?: boolean;
  className?: string;
}

export const RequirementsWidget: React.FC<RequirementsWidgetProps> = ({
  showDetails = true,
  showActionButton = true,
  className = "",
}) => {
  const [requirements, setRequirements] = useState<UserRequirements | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);

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

  if (isLoading) {
    return (
      <Card className={`p-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
          <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
          <div className="h-2 bg-gray-200 rounded w-3/4"></div>
        </div>
      </Card>
    );
  }

  const completionStatus = getCompletionStatus();
  const completionPercentage = requirements?.completionPercentage || 0;

  return (
    <Card className={`p-4 ${className}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-blue-600" />
          <h3 className="font-medium text-gray-900">Pet Matching Profile</h3>
        </div>

        {showActionButton && (
          <Link to="/profile/requirements">
            <Button variant="ghost" size="sm" className="h-8 px-2">
              <ChevronRight className="w-4 h-4" />
            </Button>
          </Link>
        )}
      </div>

      {/* Completion Status */}
      <div
        className={`p-3 rounded-lg mb-3 ${
          completionStatus.color === "green"
            ? "bg-green-50 border border-green-200"
            : completionStatus.color === "blue"
            ? "bg-blue-50 border border-blue-200"
            : completionStatus.color === "yellow"
            ? "bg-yellow-50 border border-yellow-200"
            : "bg-red-50 border border-red-200"
        }`}
      >
        <div className="flex items-center gap-2 mb-2">
          {completionStatus.color === "green" ? (
            <CheckCircle className="w-4 h-4 text-green-600" />
          ) : completionStatus.color === "red" ? (
            <AlertCircle className="w-4 h-4 text-red-600" />
          ) : (
            <Info className="w-4 h-4 text-blue-600" />
          )}
          <span className="text-sm font-medium text-gray-800">
            {completionStatus.message}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="mb-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-600">Completion</span>
            <span className="text-xs font-medium text-gray-700">
              {completionPercentage}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                completionStatus.color === "green"
                  ? "bg-green-600"
                  : completionStatus.color === "blue"
                  ? "bg-blue-600"
                  : completionStatus.color === "yellow"
                  ? "bg-yellow-600"
                  : "bg-red-600"
              }`}
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>

        {/* Recommendation Quality */}
        <p className="text-xs text-gray-600">
          {completionPercentage >= 90
            ? "Excellent - Highly personalized recommendations"
            : completionPercentage >= 70
            ? "Good - Well-personalized recommendations"
            : completionPercentage >= 50
            ? "Fair - Moderately personalized recommendations"
            : "Poor - Basic recommendations only"}
        </p>
      </div>

      {/* Quick Summary */}
      {showDetails && requirements && (
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Pet Type:</span>
            <span className="font-medium text-gray-900">
              {requirements.petType || "Not specified"}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-600">Experience:</span>
            <span className="font-medium text-gray-900">
              {requirements.experienceLevel || "Not specified"}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-600">Living:</span>
            <span className="font-medium text-gray-900">
              {requirements.livingSituation || "Not specified"}
            </span>
          </div>

          {/* Special Considerations */}
          {(requirements.allergyFriendly ||
            requirements.openToSpecialNeeds ||
            requirements.hasChildren) && (
            <div className="pt-2 border-t border-gray-200">
              <span className="text-xs text-gray-500">
                Special considerations:
              </span>
              <div className="flex flex-wrap gap-1 mt-1">
                {requirements.allergyFriendly && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                    Allergy-friendly
                  </span>
                )}
                {requirements.openToSpecialNeeds && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                    Special needs
                  </span>
                )}
                {requirements.hasChildren && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">
                    Children
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Action Button */}
      {showActionButton && (
        <div className="mt-4 pt-3 border-t border-gray-200">
          <Link to="/profile/requirements">
            <Button
              variant="outline"
              size="sm"
              className="w-full flex items-center justify-center gap-2"
            >
              <TrendingUp className="w-4 h-4" />
              {completionPercentage < 50
                ? "Complete Profile"
                : "Update Requirements"}
            </Button>
          </Link>
        </div>
      )}
    </Card>
  );
};
