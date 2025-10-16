import React from "react";
import clsx from "clsx";

interface CheckboxProps {
  id: string;
  name: string;
  value: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  disabled?: boolean;
  className?: string;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  id,
  name,
  value,
  checked,
  onChange,
  label,
  disabled = false,
  className,
}) => {
  const handleChange = () => {
    if (!disabled) {
      onChange(!checked);
    }
  };

  return (
    <label
      className={clsx(
        "flex items-center space-x-2 cursor-pointer",
        disabled && "cursor-not-allowed opacity-50",
        className
      )}
    >
      <input
        type="checkbox"
        id={id}
        name={name}
        value={value}
        checked={checked}
        onChange={handleChange}
        disabled={disabled}
        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded transition-colors"
      />
      <span className="text-sm font-medium text-gray-700">{label}</span>
    </label>
  );
};

interface CheckboxGroupProps {
  name: string;
  values: string[];
  onChange: (values: string[]) => void;
  options: { value: string; label: string }[];
  disabled?: boolean;
  className?: string;
  layout?: "horizontal" | "vertical" | "grid";
}

export const CheckboxGroup: React.FC<CheckboxGroupProps> = ({
  name,
  values,
  onChange,
  options,
  disabled = false,
  className,
  layout = "horizontal",
}) => {
  const handleChange = (value: string, checked: boolean) => {
    if (checked) {
      onChange([...values, value]);
    } else {
      onChange(values.filter((v) => v !== value));
    }
  };

  const containerClasses = clsx(
    {
      "flex items-center space-x-4": layout === "horizontal",
      "space-y-2": layout === "vertical",
      "grid grid-cols-2 sm:grid-cols-3 gap-3": layout === "grid",
    },
    className
  );

  return (
    <div className={containerClasses}>
      {options.map((option) => (
        <Checkbox
          key={option.value}
          id={`${name}-${option.value}`}
          name={name}
          value={option.value}
          checked={values.includes(option.value)}
          onChange={(checked) => handleChange(option.value, checked)}
          label={option.label}
          disabled={disabled}
        />
      ))}
    </div>
  );
};
