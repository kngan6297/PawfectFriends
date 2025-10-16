import { useState, useEffect, useCallback } from "react";
import { UseFormReturn, FieldValues, Path } from "react-hook-form";
import { z } from "zod";

export interface ValidationResult {
    isValid: boolean | null; // null = not validated yet
    message?: string;
    isTouched: boolean;
}

export type FieldValidationState<T extends FieldValues> = {
    [K in keyof T]?: ValidationResult;
};

export interface UseFormValidationOptions<T extends FieldValues> {
    schema: z.ZodSchema<T>;
    form: UseFormReturn<T>;
    validateOnChange?: boolean;
    validateOnBlur?: boolean;
    debounceMs?: number;
}

export function useFormValidation<T extends FieldValues>({
    schema,
    form,
    validateOnChange = true,
    validateOnBlur = true,
    debounceMs = 300,
}: UseFormValidationOptions<T>) {
    const [validationState, setValidationState] = useState<FieldValidationState<T>>({});
    const [debounceTimers, setDebounceTimers] = useState<Record<string, NodeJS.Timeout>>({});

    const { watch, setError, clearErrors, formState: { errors } } = form;
    const formValues = watch();

    // Validate a single field
    const validateField = useCallback(
        async (fieldName: keyof T, value: any): Promise<ValidationResult> => {
            if (!value || value === "") {
                return { isValid: null, isTouched: false };
            }

            try {
                // Create a partial schema for the specific field
                const fieldSchema = (schema as any).pick?.({ [fieldName]: true });
                if (fieldSchema) {
                    await fieldSchema.parseAsync({ [fieldName]: value });
                } else {
                    // For non-object schemas, validate the entire value
                    await schema.parseAsync(value);
                }

                return { isValid: true, isTouched: true };
            } catch (error) {
                if (error instanceof z.ZodError) {
                    const fieldError = error.errors.find(err => err.path[0] === fieldName);
                    return {
                        isValid: false,
                        message: fieldError?.message || "Invalid value",
                        isTouched: true,
                    };
                }
                return { isValid: false, message: "Validation error", isTouched: true };
            }
        },
        [schema]
    );

    // Debounced validation function
    const debouncedValidate = useCallback(
        (fieldName: keyof T, value: any) => {
            // Clear existing timer
            if (debounceTimers[fieldName as string]) {
                clearTimeout(debounceTimers[fieldName as string]);
            }

            // Set new timer
            const timer = setTimeout(async () => {
                const result = await validateField(fieldName, value);
                setValidationState(prev => ({
                    ...prev,
                    [fieldName]: result,
                }));

                // Update form errors
                if (result.isValid === false) {
                    setError(fieldName as Path<T>, {
                        type: "manual",
                        message: result.message,
                    });
                } else if (result.isValid === true) {
                    clearErrors(fieldName as Path<T>);
                }
            }, debounceMs);

            setDebounceTimers(prev => ({
                ...prev,
                [fieldName as string]: timer,
            }));
        },
        [validateField, debounceMs, setError, clearErrors, debounceTimers]
    );

    // Handle field change
    const handleFieldChange = useCallback(
        (fieldName: keyof T, value: any) => {
            if (validateOnChange) {
                debouncedValidate(fieldName, value);
            }
        },
        [validateOnChange, debouncedValidate]
    );

    // Handle field blur
    const handleFieldBlur = useCallback(
        async (fieldName: keyof T, value: any) => {
            if (validateOnBlur) {
                const result = await validateField(fieldName, value);
                setValidationState(prev => ({
                    ...prev,
                    [fieldName]: result,
                }));

                if (result.isValid === false) {
                    setError(fieldName as Path<T>, {
                        type: "manual",
                        message: result.message,
                    });
                } else if (result.isValid === true) {
                    clearErrors(fieldName as Path<T>);
                }
            }
        },
        [validateOnBlur, validateField, setError, clearErrors]
    );

    // Get field validation state
    const getFieldValidation = useCallback(
        (fieldName: keyof T): ValidationResult => {
            return validationState[fieldName] || { isValid: null, isTouched: false };
        },
        [validationState]
    );

    // Get all validation errors
    const getValidationErrors = useCallback(() => {
        const errorFields: { field: string; message: string }[] = [];

        Object.entries(validationState).forEach(([field, state]) => {
            if (state && state.isValid === false && state.message) {
                errorFields.push({
                    field,
                    message: state.message,
                });
            }
        });

        return errorFields;
    }, [validationState]);

    // Validate entire form
    const validateForm = useCallback(async () => {
        try {
            await schema.parseAsync(formValues);
            return { isValid: true, errors: [] };
        } catch (error) {
            if (error instanceof z.ZodError) {
                const errors = error.errors.map(err => ({
                    field: err.path[0] as string,
                    message: err.message,
                }));
                return { isValid: false, errors };
            }
            return { isValid: false, errors: [{ field: "unknown", message: "Validation error" }] };
        }
    }, [schema, formValues]);

    // Cleanup timers on unmount
    useEffect(() => {
        return () => {
            Object.values(debounceTimers).forEach(timer => clearTimeout(timer));
        };
    }, [debounceTimers]);

    return {
        validationState,
        getFieldValidation,
        getValidationErrors,
        validateForm,
        handleFieldChange,
        handleFieldBlur,
    };
} 