import React from "react";
import { X } from "lucide-react";
import { cn } from "@/utils/cn";

export type ToastProps = {
  id: string;
  title?: string;
  description?: string;
  type?: "success" | "error" | "info" | "warning";
  onClose?: () => void;
};

export const Toast: React.FC<ToastProps> = ({
  id,
  title,
  description,
  type = "info",
  onClose,
}) => {
  const bgColor = {
    success: "bg-green-50",
    error: "bg-red-50",
    info: "bg-blue-50",
    warning: "bg-yellow-50",
  }[type];

  const textColor = {
    success: "text-green-800",
    error: "text-red-800",
    info: "text-blue-800",
    warning: "text-yellow-800",
  }[type];

  const borderColor = {
    success: "border-green-200",
    error: "border-red-200",
    info: "border-blue-200",
    warning: "border-yellow-200",
  }[type];

  return (
    <div
      id={id}
      className={cn(
        "rounded-lg border p-4 shadow-lg",
        bgColor,
        borderColor,
        textColor
      )}
      role="alert"
    >
      <div className="flex items-start">
        <div className="flex-1">
          {title && <h3 className="text-sm font-medium">{title}</h3>}
          {description && <p className="mt-1 text-sm">{description}</p>}
        </div>
        {onClose && (
          <button
            type="button"
            className="ml-4 inline-flex flex-shrink-0 rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
};
