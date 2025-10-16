import React from "react";
import { Checkbox } from "@/components/ui/Checkbox";

interface CheckboxGroupProps {
  label: string;
  options: { value: string; label: string }[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  required?: boolean;
  helperText?: string;
  className?: string;
}

export const CheckboxGroup: React.FC<CheckboxGroupProps> = ({
  label,
  options,
  selectedValues,
  onChange,
  required = false,
  helperText,
  className = "",
}) => {
  const handleCheckboxChange = (value: string, checked: boolean) => {
    if (checked) {
      onChange([...selectedValues, value]);
    } else {
      onChange(selectedValues.filter((v) => v !== value));
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="space-y-2">
        {options.map((option) => (
          <Checkbox
            key={option.value}
            id={`${label}-${option.value}`}
            name={label}
            value={option.value}
            checked={selectedValues.includes(option.value)}
            onChange={(checked) => handleCheckboxChange(option.value, checked)}
            label={option.label}
          />
        ))}
      </div>
      {helperText && <p className="text-xs text-gray-500">{helperText}</p>}
    </div>
  );
};
