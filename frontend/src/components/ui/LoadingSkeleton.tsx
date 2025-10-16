import React from "react";
import { Loader2 } from "lucide-react";

interface LoadingSkeletonProps {
  message?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  message = "Loading...",
  size = "md",
  className = "",
}) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  return (
    <div className={`flex items-center justify-center h-full ${className}`}>
      <div className="text-center">
        <Loader2 className={`${sizeClasses[size]} animate-spin mx-auto mb-4`} />
        <p className="text-gray-600">{message}</p>
      </div>
    </div>
  );
};
