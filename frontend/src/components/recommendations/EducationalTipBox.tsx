import React from "react";
import { Info, Lightbulb } from "lucide-react";

interface EducationalTipBoxProps {
  title: string;
  content: string | React.ReactNode;
  variant?: "info" | "tip";
  className?: string;
}

export const EducationalTipBox: React.FC<EducationalTipBoxProps> = ({
  title,
  content,
  variant = "info",
  className = "",
}) => {
  const isInfo = variant === "info";
  
  return (
    <div className={`bg-blue-50 border border-blue-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          {isInfo ? (
            <Info className="h-5 w-5 text-blue-600" />
          ) : (
            <Lightbulb className="h-5 w-5 text-blue-600" />
          )}
        </div>
        <div className="ml-3 flex-1">
          <h4 className="text-sm font-medium text-blue-900 mb-2">
            {isInfo ? "Why we ask this?" : "💡 Pro tip"}
          </h4>
          <div className="text-sm text-blue-700">
            {typeof content === "string" ? <p>{content}</p> : content}
          </div>
        </div>
      </div>
    </div>
  );
};
