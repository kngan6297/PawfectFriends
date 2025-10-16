import React from "react";
import clsx from "clsx";
import { Button } from "./Button";

interface ToggleProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label?: string;
  hint?: string;
  disabled?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg";
  id?: string;
}

export const Toggle: React.FC<ToggleProps> = ({
  checked,
  onCheckedChange,
  label,
  hint,
  disabled = false,
  className,
  size = "md",
  id,
}) => {
  const handleChange = () => {
    if (!disabled) {
      onCheckedChange(!checked);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      handleChange();
    }
  };

  const sizeClasses = {
    sm: "w-9 h-5",
    md: "w-11 h-6",
    lg: "w-14 h-7",
  };

  const thumbSizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  const thumbTranslateClasses = {
    sm: checked ? "translate-x-4" : "translate-x-0.5",
    md: checked ? "translate-x-5" : "translate-x-0.5",
    lg: checked ? "translate-x-7" : "translate-x-0.5",
  };

  const toggleId = id || `toggle-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className={clsx("flex items-start space-x-3", className)}>
      <div className="flex items-center">
        <Button
          type="button"
          onClick={handleChange}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          className={clsx(
            "relative inline-flex items-center rounded-full transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
            sizeClasses[size],
            checked
              ? "bg-blue-600 hover:bg-blue-700"
              : "bg-gray-200 hover:bg-gray-300",
            disabled && "cursor-not-allowed opacity-50"
          )}
          role="switch"
          aria-checked={checked ? "true" : "false"}
          aria-labelledby={label ? `${toggleId}-label` : undefined}
          aria-describedby={hint ? `${toggleId}-hint` : undefined}
          id={toggleId}
        >
          <span
            className={clsx(
              "inline-block rounded-full bg-white shadow-lg transform transition-transform duration-200 ease-in-out",
              thumbSizeClasses[size],
              thumbTranslateClasses[size]
            )}
          />
        </Button>
      </div>

      {(label || hint) && (
        <div className="flex-1 min-w-0">
          {label && (
            <label
              htmlFor={toggleId}
              id={`${toggleId}-label`}
              className="block text-sm font-medium text-gray-700 cursor-pointer"
            >
              {label}
            </label>
          )}
          {hint && (
            <p id={`${toggleId}-hint`} className="text-xs text-gray-500 mt-1">
              {hint}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
