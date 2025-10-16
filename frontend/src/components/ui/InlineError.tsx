import React from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface InlineErrorProps {
  message?: string;
  onRetry?: () => void;
  className?: string;
  variant?: "error" | "warning" | "info";
}

export const InlineError: React.FC<InlineErrorProps> = ({
  message = "Data could not be loaded.",
  onRetry,
  className = "",
  variant = "error",
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case "warning":
        return "border-yellow-200 bg-yellow-50 text-yellow-700";
      case "info":
        return "border-blue-200 bg-blue-50 text-blue-700";
      default:
        return "border-red-200 bg-red-50 text-red-700";
    }
  };

  const getButtonStyles = () => {
    switch (variant) {
      case "warning":
        return "text-yellow-700 hover:text-yellow-800 focus-visible:ring-yellow-500";
      case "info":
        return "text-blue-700 hover:text-blue-800 focus-visible:ring-blue-500";
      default:
        return "text-red-700 hover:text-red-800 focus-visible:ring-red-500";
    }
  };

  return (
    <div
      role="alert"
      className={`rounded-lg border p-3 text-sm ${getVariantStyles()} ${className}`}
    >
      <div className="flex items-center gap-2">
        <AlertCircle className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
        <span>{message}</span>
        {onRetry && (
          <Button
            variant="ghost"
            onClick={onRetry}
            className={`px-1 ${getButtonStyles()} focus-visible:ring-2 focus-visible:ring-offset-2`}
            aria-label="Retry loading data"
          >
            Try again
          </Button>
        )}
      </div>
    </div>
  );
};

export default InlineError;
