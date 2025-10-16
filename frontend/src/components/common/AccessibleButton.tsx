import React from "react";
import { handleKeyPress } from "@/utils/accessibility";

interface AccessibleButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  description?: string;
  icon?: React.ReactNode;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  fullWidth?: boolean;
}

export default function AccessibleButton({
  label,
  description,
  icon,
  variant = "primary",
  size = "md",
  isLoading = false,
  fullWidth = false,
  className = "",
  onClick,
  disabled,
  type = "button",
  ...props
}: AccessibleButtonProps) {
  const buttonRef = React.useRef<HTMLButtonElement>(null);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || isLoading) return;
    onClick?.(event);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    handleKeyPress(event, () => {
      if (disabled || isLoading) return;
      onClick?.(event as any);
    });
  };

  const baseStyles =
    "inline-flex items-center justify-center font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors";

  const variantStyles = {
    primary:
      "bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500",
    secondary:
      "bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-gray-500",
    danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
    ghost: "text-gray-700 hover:bg-gray-100 focus:ring-gray-500",
  };

  const sizeStyles = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg",
  };

  const widthStyles = fullWidth ? "w-full" : "";

  const buttonStyles = [
    baseStyles,
    variantStyles[variant],
    sizeStyles[size],
    widthStyles,
    disabled || isLoading ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
    className,
  ].join(" ");

  return (
    <button
      ref={buttonRef}
      type={type}
      className={buttonStyles}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      disabled={disabled || isLoading}
      aria-label={label}
      aria-description={description}
      {...props}
    >
      {isLoading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {icon && !isLoading && <span className="mr-2">{icon}</span>}
      {label}
    </button>
  );
}
