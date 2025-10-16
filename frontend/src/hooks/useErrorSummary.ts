import { useState, useEffect, useCallback } from "react";

export interface ErrorField {
    field: string;
    message: string;
}

export interface UseErrorSummaryOptions {
    errorFields: ErrorField[];
    mobileThreshold?: number;
    userPreferenceKey?: string;
}

export interface UseErrorSummaryReturn {
    shouldShowSummary: boolean;
    isAlwaysShowEnabled: boolean;
    toggleAlwaysShow: () => void;
    dismissSummary: () => void;
    errorCount: number;
    visibleErrors: ErrorField[];
}

export function useErrorSummary({
    errorFields,
    mobileThreshold = 2,
    userPreferenceKey = "error-summary-always-show",
}: UseErrorSummaryOptions): UseErrorSummaryReturn {
    const [isAlwaysShowEnabled, setIsAlwaysShowEnabled] = useState(false);
    const [isDismissed, setIsDismissed] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    // Load user preference from localStorage
    useEffect(() => {
        const savedPreference = localStorage.getItem(userPreferenceKey);
        if (savedPreference) {
            setIsAlwaysShowEnabled(JSON.parse(savedPreference));
        }
    }, [userPreferenceKey]);

    // Check if device is mobile
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth <= 768);
        };

        checkMobile();
        window.addEventListener("resize", checkMobile);

        return () => window.removeEventListener("resize", checkMobile);
    }, []);

    // Toggle always show preference
    const toggleAlwaysShow = useCallback(() => {
        const newValue = !isAlwaysShowEnabled;
        setIsAlwaysShowEnabled(newValue);
        localStorage.setItem(userPreferenceKey, JSON.stringify(newValue));
    }, [isAlwaysShowEnabled, userPreferenceKey]);

    // Dismiss summary
    const dismissSummary = useCallback(() => {
        setIsDismissed(true);
        // Reset dismissal after a short delay
        setTimeout(() => setIsDismissed(false), 1000);
    }, []);

    // Determine if summary should be shown
    const shouldShowSummary = useCallback(() => {
        if (isDismissed) return false;

        const hasEnoughErrors = errorFields.length > mobileThreshold;
        const isMobileDevice = isMobile;
        const userWantsAlwaysShow = isAlwaysShowEnabled;

        return hasEnoughErrors && (isMobileDevice || userWantsAlwaysShow);
    }, [errorFields.length, mobileThreshold, isMobile, isAlwaysShowEnabled, isDismissed]);

    // Get visible errors (limit to first few for mobile)
    const visibleErrors = useCallback(() => {
        const maxVisible = isMobile ? 3 : 5;
        return errorFields.slice(0, maxVisible);
    }, [errorFields, isMobile]);

    return {
        shouldShowSummary: shouldShowSummary(),
        isAlwaysShowEnabled,
        toggleAlwaysShow,
        dismissSummary,
        errorCount: errorFields.length,
        visibleErrors: visibleErrors(),
    };
} 