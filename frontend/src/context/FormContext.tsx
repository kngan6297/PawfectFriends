import React, { createContext, useContext, useState } from "react";

interface FormContextType {
  formState: {
    values: Record<string, any>;
    errors: Record<string, string>;
    touched: Record<string, boolean>;
  };
  setFieldValue: (name: string, value: any) => void;
  setFieldTouched: (name: string, touched: boolean) => void;
  handleSubmit: (onSubmit: (values: Record<string, any>) => void) => void;
}

const FormContext = createContext<FormContextType | undefined>(undefined);

export const FormProvider: React.FC<{
  children: React.ReactNode;
  initialValues: Record<string, any>;
  validate?: (values: Record<string, any>) => Record<string, string>;
}> = ({ children, initialValues, validate }) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const setFieldValue = (name: string, value: any) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const setFieldTouched = (name: string, touched: boolean) => {
    setTouched((prev) => ({ ...prev, [name]: touched }));
  };

  const handleSubmit = (onSubmit: (values: Record<string, any>) => void) => {
    if (validate) {
      const validationErrors = validate(values);
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        return;
      }
    }
    onSubmit(values);
  };

  return (
    <FormContext.Provider
      value={{
        formState: { values, errors, touched },
        setFieldValue,
        setFieldTouched,
        handleSubmit,
      }}
    >
      {children}
    </FormContext.Provider>
  );
};

export const useForm = () => {
  const context = useContext(FormContext);
  if (!context) {
    throw new Error("useForm must be used within a FormProvider");
  }
  return context;
};
