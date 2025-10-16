import React from "react";
import { RefreshCw, Search, Filter, Settings } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface EmptyStateProps {
  isLoading?: boolean;
  hasRecommendations?: boolean;
  message?: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
  showIcon?: boolean;
  icon?: React.ReactNode;
  variant?: "loading" | "no-results" | "no-pets" | "error";
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  isLoading = false,
  hasRecommendations = false,
  message,
  description,
  actionText,
  onAction,
  showIcon = true,
  icon,
  variant = "no-results",
}) => {
  // Loading state
  if (isLoading && !hasRecommendations) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-700 mb-2">
            Loading pets...
          </h3>
          <p className="text-gray-500">
            Fetching available pets for recommendations
          </p>
        </div>
      </div>
    );
  }

  // No recommendations yet (initial state)
  if (!hasRecommendations && !message) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-700 mb-2">
            No recommendations yet
          </h3>
          <p className="text-gray-500">
            Fill out your preferences to get personalized pet recommendations
          </p>
        </div>
      </div>
    );
  }

  // Custom empty state
  const getDefaultContent = () => {
    switch (variant) {
      case "no-results":
        return {
          icon: <Filter className="w-8 h-8 text-gray-400" />,
          title: message || "No pets matched your preferences",
          description:
            description || "Try adjusting your preferences to find more pets",
          actionText: actionText || "Adjust Preferences",
        };
      case "no-pets":
        return {
          icon: <Search className="w-8 h-8 text-gray-400" />,
          title: message || "No pets available",
          description:
            description || "There are currently no pets in our database",
          actionText: actionText || "Check Back Later",
        };
      case "error":
        return {
          icon: <Settings className="w-8 h-8 text-red-400" />,
          title: message || "Something went wrong",
          description:
            description ||
            "We couldn't load the recommendations. Please try again.",
          actionText: actionText || "Try Again",
        };
      default:
        return {
          icon: icon || <Search className="w-8 h-8 text-gray-400" />,
          title: message || "No results found",
          description: description || "Try adjusting your search criteria",
          actionText: actionText || "Adjust Search",
        };
    }
  };

  const content = getDefaultContent();

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center py-12">
        {showIcon && (
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            {content.icon}
          </div>
        )}
        <h3 className="text-lg font-medium text-gray-700 mb-2">
          {content.title}
        </h3>
        <p className="text-gray-500 mb-6">{content.description}</p>
        {onAction && actionText && (
          <Button onClick={onAction} variant="outline">
            {content.actionText}
          </Button>
        )}
      </div>
    </div>
  );
};
