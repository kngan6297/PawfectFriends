import React from "react";
import clsx from "clsx";

type BadgeVariant =
  | "default"
  | "primary"
  | "secondary"
  | "success"
  | "warning"
  | "danger"
  | "accent-blue"
  | "accent-purple"
  | "accent-green";
type BadgeSize = "sm" | "md" | "lg";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  className?: string;
  rounded?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = "default",
  size = "md",
  className,
  rounded = false,
  ...props
}) => {
  const baseStyles = "inline-flex items-center font-medium";

  const variantStyles = {
    default: "bg-gray-100 text-gray-800",
    primary: "bg-blue-100 text-blue-800",
    secondary: "bg-gray-100 text-gray-800",
    success: "bg-green-100 text-green-800",
    warning: "bg-amber-100 text-amber-800",
    danger: "bg-red-100 text-red-800",
    "accent-blue": "bg-blue-100 text-blue-800 border border-blue-200",
    "accent-purple": "bg-purple-100 text-purple-800 border border-purple-200",
    "accent-green": "bg-green-100 text-green-800 border border-green-200",
  };

  const sizeStyles = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-2.5 py-0.5",
    lg: "text-base px-3 py-1",
  };

  const roundedStyles = rounded ? "rounded-full" : "rounded-md";

  return (
    <span
      className={clsx(
        baseStyles,
        variantStyles[variant],
        sizeStyles[size],
        roundedStyles,
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};
