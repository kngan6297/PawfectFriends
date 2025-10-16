import React from "react";
import clsx from "clsx";

interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
}

export const Textarea: React.FC<TextareaProps> = ({
  label,
  error,
  helperText,
  fullWidth = false,
  id,
  className = "",
  ...props
}) => {
  return (
    <div className={clsx("mb-4", fullWidth && "w-full")}>
      {label && (
        <label
          htmlFor={id}
          className={clsx(
            "block text-sm font-medium text-gray-700 mb-1",
            error && "text-red-600"
          )}
        >
          {label}
        </label>
      )}
      <textarea
        id={id}
        className={clsx(
          "shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md transition-all duration-300",
          error
            ? "border-red-300 text-red-900 placeholder-red-300 focus:border-red-500 focus:ring-red-500"
            : "border-gray-300 text-gray-900 placeholder-gray-400 bg-white focus:border-indigo-500 focus:ring-indigo-500",
          fullWidth && "w-full",
          className
        )}
        {...(error && { "aria-invalid": "true" })}
        aria-describedby={
          error ? `${id}-error` : helperText ? `${id}-helper` : undefined
        }
        {...props}
      />

      {error && (
        <p className="mt-1 text-sm text-red-600" id={`${id}-error`}>
          {error}
        </p>
      )}

      {helperText && !error && (
        <p className="mt-1 text-sm text-gray-500" id={`${id}-helper`}>
          {helperText}
        </p>
      )}
    </div>
  );
};
