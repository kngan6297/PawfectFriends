import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, X, Settings } from "lucide-react";
import { ErrorField } from "@/hooks/useErrorSummary";

interface ErrorSummaryProps {
  isVisible: boolean;
  errorFields: ErrorField[];
  isAlwaysShowEnabled: boolean;
  onToggleAlwaysShow: () => void;
  onDismiss: () => void;
  onScrollToError: (fieldName: string) => void;
  getFieldLabel: (fieldName: string) => string;
  className?: string;
}

export const ErrorSummary: React.FC<ErrorSummaryProps> = ({
  isVisible,
  errorFields,
  isAlwaysShowEnabled,
  onToggleAlwaysShow,
  onDismiss,
  onScrollToError,
  getFieldLabel,
  className = "",
}) => {
  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        className={`mb-4 p-3 bg-red-50 border border-red-200 rounded-lg ${className}`}
      >
        <div className="flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-red-800">
                Please fix the following issues ({errorFields.length} total):
              </h4>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onToggleAlwaysShow}
                  className="text-xs text-red-600 hover:text-red-800 transition-colors flex items-center gap-1"
                  title={
                    isAlwaysShowEnabled
                      ? "Disable always show"
                      : "Always show error summary"
                  }
                >
                  <Settings
                    size={12}
                    className={isAlwaysShowEnabled ? "text-red-500" : ""}
                  />
                  <span className="hidden sm:inline">
                    {isAlwaysShowEnabled ? "Always on" : "Always show"}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={onDismiss}
                  className="text-red-600 hover:text-red-800 transition-colors"
                  title="Dismiss error summary"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            <ul className="space-y-1">
              {errorFields.map((error, index) => (
                <li
                  key={index}
                  className="text-xs text-red-700 flex items-center gap-1"
                >
                                      <span className="w-1 h-1 bg-red-500 rounded-full flex-shrink-0"></span>
                  <button
                    type="button"
                    onClick={() => onScrollToError(error.field)}
                                          className="text-left hover:text-red-800 transition-colors flex-1"
                  >
                    <span className="font-medium">
                      {getFieldLabel(error.field)}:
                    </span>
                    <span> {error.message}</span>
                  </button>
                </li>
              ))}
              {errorFields.length > 3 && (
                                  <li className="text-xs text-red-600 italic">
                  ...and {errorFields.length - 3} more issue
                  {errorFields.length - 3 !== 1 ? "s" : ""}
                </li>
              )}
            </ul>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ErrorSummary;
