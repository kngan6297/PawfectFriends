import React from "react";
import {
  getAccessibilityProps,
  AccessibilityProps,
} from "@/utils/accessibility";

interface AccessibleFormFieldProps extends AccessibilityProps {
  type?: string;
  value?: string | number;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  readOnly?: boolean;
  autoComplete?: string;
  className?: string;
  children?: React.ReactNode;
}

export const AccessibleFormField = ({
  id,
  label,
  required,
  error,
  description,
  type = "text",
  value,
  onChange,
  placeholder,
  disabled,
  readOnly,
  autoComplete,
  className = "",
  children,
}: AccessibleFormFieldProps) => {
  const accessibilityProps = getAccessibilityProps({
    id,
    label,
    required,
    error,
    description,
  });

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(event.target.value);
  };

  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {description && (
        <p id={`${id}-description`} className="text-sm text-gray-500">
          {description}
        </p>
      )}

      <div className="relative">
        {children || (
          <input
            type={type}
            value={value}
            onChange={handleChange}
            placeholder={placeholder}
            disabled={disabled}
            readOnly={readOnly}
            autoComplete={autoComplete}
            className={`
              block w-full rounded-md shadow-sm
              ${
                error
                  ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                  : "border-gray-300 focus:border-primary-500 focus:ring-primary-500"
              }
              ${disabled ? "bg-gray-100 cursor-not-allowed" : "bg-white"}
              ${readOnly ? "bg-gray-50" : ""}
              ${className}
            `}
            {...accessibilityProps}
          />
        )}
      </div>

      {error && (
        <p
          id={`${id}-error`}
          className="mt-1 text-sm text-red-600"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
};
