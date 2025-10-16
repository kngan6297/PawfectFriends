import { useForm } from "@/context/FormContext";
import { ChangeEvent } from "react";

interface FormFieldProps {
  name: string;
  label: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  className?: string;
  errorClassName?: string;
  labelClassName?: string;
  inputClassName?: string;
}

export default function FormField({
  name,
  label,
  type = "text",
  placeholder,
  required = false,
  className = "",
  errorClassName = "mt-1 text-sm text-red-600",
  labelClassName = "block text-sm font-medium text-gray-700",
  inputClassName = "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm",
}: FormFieldProps) {
  const {
    formState: { values, errors, touched },
    setFieldValue,
    setFieldTouched,
  } = useForm();

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFieldValue(name, e.target.value);
  };

  const handleBlur = () => {
    setFieldTouched(name, true);
  };

  const showError = touched[name] && errors[name];

  return (
    <div className={className}>
      <label htmlFor={name} className={labelClassName}>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        type={type}
        id={name}
        name={name}
        value={values[name] || ""}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        required={required}
        className={`${inputClassName} ${showError ? "border-red-300" : ""}`}
        aria-describedby={showError ? `${name}-error` : undefined}
      />
      {showError && (
        <p className={errorClassName} id={`${name}-error`} role="alert">
          {errors[name]}
        </p>
      )}
    </div>
  );
}
