import React from "react";
import clsx from "clsx";

interface RadioButtonProps {
  name: string;
  value: string;
  checked: boolean;
  onChange: (value: string) => void;
  label: string;
  description?: string;
  disabled?: boolean;
  className?: string;
}

export const RadioButton: React.FC<RadioButtonProps> = ({
  name,
  value,
  checked,
  onChange,
  label,
  description,
  disabled = false,
  className,
}) => {
  const handleChange = () => {
    if (!disabled) {
      onChange(value);
    }
  };

  return (
    <label
      className={clsx(
        "flex items-start space-x-3 cursor-pointer p-3 rounded-lg border transition-colors",
        checked
          ? "border-primary-200 bg-primary-50"
          : "border-gray-200 hover:border-gray-300",
        disabled && "cursor-not-allowed opacity-50",
        className
      )}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={handleChange}
        disabled={disabled}
        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded-full transition-colors mt-0.5"
      />
      <div className="flex-1">
        <span className="text-sm font-medium text-gray-900">{label}</span>
        {description && (
          <p className="text-xs text-gray-600 mt-1">{description}</p>
        )}
      </div>
    </label>
  );
};

interface RadioGroupProps {
  name: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string; description?: string }[];
  disabled?: boolean;
  className?: string;
}

export const RadioGroup: React.FC<RadioGroupProps> = ({
  name,
  value,
  onChange,
  options,
  disabled = false,
  className,
}) => {
  return (
    <div className={clsx("space-y-2", className)}>
      {options.map((option) => (
        <RadioButton
          key={option.value}
          name={name}
          value={option.value}
          checked={value === option.value}
          onChange={onChange}
          label={option.label}
          description={option.description}
          disabled={disabled}
        />
      ))}
    </div>
  );
};
