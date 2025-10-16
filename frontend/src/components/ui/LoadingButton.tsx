import { Loader2, PawPrint } from "lucide-react";
import { ButtonHTMLAttributes } from "react";
import { PawSpinner } from "./PawSpinner";

interface LoadingButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  isLoading?: boolean;
  loadingText?: string;
  variant?: "primary" | "secondary" | "danger";
  fullWidth?: boolean;
}

// Pet-themed loading animation component
const PawLoadingAnimation = () => (
  <div className="flex items-center space-x-1">
    <PawPrint
      className="h-4 w-4 animate-bounce text-white"
      style={{ animationDelay: "0ms" }}
    />
    <PawPrint
      className="h-4 w-4 animate-bounce text-white"
      style={{ animationDelay: "150ms" }}
    />
    <PawPrint
      className="h-4 w-4 animate-bounce text-white"
      style={{ animationDelay: "300ms" }}
    />
  </div>
);

// Enhanced paw spinner component with variant support
const EnhancedPawSpinner = ({ variant = "primary" }: { variant?: string }) => (
  <PawSpinner
    size="sm"
    color={variant === "primary" || variant === "danger" ? "white" : "#334155"}
    className={
      variant === "primary" || variant === "danger"
        ? "text-white"
        : "text-gray-700"
    }
  />
);

export function LoadingButton({
  children,
  loading = false,
  isLoading = false,
  loadingText,
  variant = "primary",
  fullWidth = false,
  className = "",
  disabled,
  ...props
}: LoadingButtonProps) {
  const isButtonLoading = loading || isLoading;

  const baseStyles =
    "inline-flex items-center justify-center px-6 py-3 text-sm font-semibold rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:-translate-y-1 shadow-lg hover:shadow-xl";

  const variantStyles = {
    primary:
      "border-transparent text-white bg-gradient-to-r from-primary-600 to-purple-600 hover:from-primary-700 hover:to-purple-700 focus:ring-primary-500 shadow-primary-600/25",
    secondary:
      "border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:ring-primary-500 shadow-gray-400/25",
    danger:
      "border-transparent text-white bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 focus:ring-red-500 shadow-red-600/25",
  };

  const widthStyles = fullWidth ? "w-full" : "";

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${widthStyles} ${className}`}
      disabled={isButtonLoading || disabled}
      {...props}
    >
      {isButtonLoading && (
        <div className="mr-2">
          <EnhancedPawSpinner variant={variant} />
        </div>
      )}
      {isButtonLoading ? loadingText || children : children}
    </button>
  );
}
