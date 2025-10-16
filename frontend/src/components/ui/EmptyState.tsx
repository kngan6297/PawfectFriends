import React from "react";
import { Button } from "@/components/ui/Button";

interface EmptyStateProps {
  text: string;
  ctaLabel?: string;
  onCta?: () => void;
  icon?: React.ReactNode;
  className?: string;
  variant?: "default" | "compact" | "large";
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  text,
  ctaLabel,
  onCta,
  icon,
  className = "",
  variant = "default",
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case "compact":
        return "py-6";
      case "large":
        return "py-16";
      default:
        return "py-10";
    }
  };

  const getIconSize = () => {
    switch (variant) {
      case "compact":
        return "h-8 w-8";
      case "large":
        return "h-16 w-16";
      default:
        return "h-12 w-12";
    }
  };

  return (
    <div
      className={`text-center text-gray-500 select-none ${getVariantStyles()} ${className}`}
    >
      {icon && (
        <div className="mb-4 flex justify-center">
          <div className={`${getIconSize()} text-gray-400`}>{icon}</div>
        </div>
      )}
      <p className={`mb-2 ${variant === "compact" ? "text-sm" : "text-base"}`}>
        {text}
      </p>
      {ctaLabel && onCta && (
        <Button
          variant="outline"
          size={variant === "compact" ? "sm" : "default"}
          className="mt-3"
          onClick={onCta}
          aria-label={`${ctaLabel} - ${text}`}
        >
          {ctaLabel}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
