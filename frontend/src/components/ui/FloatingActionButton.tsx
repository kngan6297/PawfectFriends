import React from "react";
import { cn } from "@/utils/cn";
import { LucideIcon } from "lucide-react";

interface FloatingActionButtonProps {
  icon: LucideIcon;
  onClick: () => void;
  className?: string;
  size?: "sm" | "md" | "lg";
  variant?: "primary" | "secondary" | "success" | "warning";
  tooltip?: string;
  disabled?: boolean;
}

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  icon: Icon,
  onClick,
  className,
  size = "md",
  variant = "primary",
  tooltip,
  disabled = false,
}) => {
  const sizeClasses = {
    sm: "w-12 h-12",
    md: "w-14 h-14",
    lg: "w-16 h-16",
  };

  const variantClasses = {
    primary: "bg-blue-500 hover:bg-blue-600 text-white shadow-lg",
    secondary: "bg-gray-500 hover:bg-gray-600 text-white shadow-lg",
    success: "bg-green-500 hover:bg-green-600 text-white shadow-lg",
    warning: "bg-amber-500 hover:bg-amber-600 text-white shadow-lg",
  };

  const iconSizes = {
    sm: "h-5 w-5",
    md: "h-6 w-6",
    lg: "h-7 w-7",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={tooltip}
      className={cn(
        "fixed rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 z-50",
        sizeClasses[size],
        variantClasses[variant],
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      <Icon className={iconSizes[size]} />
    </button>
  );
};
