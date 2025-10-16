import React from "react";
import { cn } from "@/utils/cn";
import { LucideIcon } from "lucide-react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | "primary"
    | "secondary"
    | "outline"
    | "ghost"
    | "accent-amber"
    | "accent-pink"
    | "accent-green";
  size?: "sm" | "md" | "lg" | "icon";
  leftIcon?: LucideIcon;
  rightIcon?: LucideIcon;
  fullWidth?: boolean;
  className?: string;
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      leftIcon: LeftIcon,
      rightIcon: RightIcon,
      fullWidth = false,
      className,
      children,
      isLoading = false,
      type = "button", // ✅ default to "button", not "submit"
      ...props
    },
    ref
  ) => {
    const variantStyles = {
      primary:
        "bg-blue-500 text-white hover:bg-blue-600 focus:ring-blue-500 shadow-soft",
      secondary:
        "bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500 shadow-soft",
      outline:
        "border border-gray-300 bg-white text-gray-800 hover:bg-gray-50 focus:ring-blue-500 shadow-soft",
      ghost: "text-gray-800 hover:bg-gray-50 focus:ring-blue-500",
      "accent-amber":
        "bg-amber-300 text-gray-800 hover:bg-amber-400 focus:ring-amber-500 shadow-soft",
      "accent-pink":
        "bg-pink-300 text-white hover:bg-pink-400 focus:ring-pink-500 shadow-soft",
      "accent-green":
        "bg-green-500 text-white hover:bg-green-600 focus:ring-green-500 shadow-soft",
    };

    const sizeStyles = {
      sm: "px-3 py-1.5 text-sm",
      md: "px-4 py-2 text-sm",
      lg: "px-6 py-3 text-base",
      icon: "p-2",
    };

    return (
      <button
        ref={ref}
        type={type} // ✅ pass-through the type prop
        className={cn(
          "inline-flex items-center justify-center font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200",
          variantStyles[variant],
          sizeStyles[size],
          fullWidth && "w-full",
          className
        )}
        disabled={isLoading}
        {...props}
      >
        {isLoading ? (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        ) : (
          LeftIcon && <LeftIcon className="w-5 h-5 mr-2" />
        )}
        {children}
        {RightIcon && <RightIcon className="w-5 h-5 ml-2" />}
      </button>
    );
  }
);

Button.displayName = "Button";
