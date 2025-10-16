import React, { forwardRef, useState } from "react";
import clsx from "clsx";
import { AlertCircle, Eye, EyeOff } from "lucide-react";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  showPassword?: boolean;
  onTogglePassword?: () => void;
  enablePasswordToggle?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      fullWidth = false,
      leftIcon,
      rightIcon,
      className,
      value,
      type = "text",
      showPassword,
      onTogglePassword,
      enablePasswordToggle = false,
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false);
    const [internalShowPassword, setInternalShowPassword] = useState(false);

    // Determine if password toggle should be shown
    const shouldShowPasswordToggle =
      enablePasswordToggle && type === "password";
    const isPasswordVisible =
      showPassword !== undefined ? showPassword : internalShowPassword;
    const inputType =
      shouldShowPasswordToggle && isPasswordVisible ? "text" : type;

    const handleTogglePassword = () => {
      if (onTogglePassword) {
        onTogglePassword();
      } else {
        setInternalShowPassword(!internalShowPassword);
      }
    };

    // Determine right icon to show (prioritize error icon)
    const getRightIcon = () => {
      if (error) {
        return <AlertCircle size={18} className="text-red-500" />;
      }

      if (shouldShowPasswordToggle) {
        return (
          <button
            type="button"
            onClick={handleTogglePassword}
            className="text-gray-400 hover:text-gray-600 transition-colors focus:outline-none focus:visible:ring-2 focus-visible:ring-primary-400 rounded"
            aria-label={isPasswordVisible ? "Hide password" : "Show password"}
          >
            {isPasswordVisible ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        );
      }

      return rightIcon;
    };

    return (
      <div className={clsx("mb-4", fullWidth && "w-full")}>
        {label && (
          <label
            className={clsx(
              "block mb-1 text-sm font-medium text-gray-700",
              error && "text-red-600"
            )}
            htmlFor={props.id}
          >
            {label}
          </label>
        )}
        <div className="relative rounded-md">
          <input
            ref={ref}
            value={value}
            type={inputType}
            onFocus={(e) => {
              setIsFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              props.onBlur?.(e);
            }}
            onChange={props.onChange}
            className={clsx(
              "appearance-none block rounded-lg border px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus-visible:ring-2 focus-visible:ring-primary-400 sm:text-sm transition-all duration-300 focus:shadow-lg focus:shadow-primary-200/50",
              leftIcon && "pl-12",
              getRightIcon() && "pr-12",
              error
                ? "border-red-300 text-red-900 placeholder-red-300 focus:border-red-500 focus:ring-red-500 focus:visible:ring-red-400 focus:shadow-lg focus:shadow-red-200/50"
                : "border-gray-300 text-gray-900 placeholder-gray-400 bg-white focus:border-primary-500 focus:ring-primary-500 focus:visible:ring-primary-400 focus:shadow-lg focus:shadow-primary-200/50",
              fullWidth && "w-full",
              className
            )}
            {...(error && { "aria-invalid": "true" })}
            aria-describedby={error ? `${props.id}-error` : undefined}
            placeholder={props.placeholder}
            {...props}
          />

          {leftIcon && (
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
              {leftIcon}
            </span>
          )}

          {getRightIcon() && (
            <span className="absolute inset-y-0 right-0 pr-3 flex items-center z-10">
              {getRightIcon()}
            </span>
          )}
        </div>

        {error && (
          <p className="mt-1 text-sm text-red-600" id={`${props.id}-error`}>
            {error}
          </p>
        )}

        {helperText && !error && (
          <p className="mt-1 text-sm text-gray-500">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
