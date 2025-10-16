import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface CollapsibleContentProps {
  children: React.ReactNode;
  maxLines?: number;
  className?: string;
  showToggle?: boolean;
  defaultExpanded?: boolean;
  toggleText?: {
    showMore: string;
    showLess: string;
  };
}

export const CollapsibleContent: React.FC<CollapsibleContentProps> = ({
  children,
  maxLines = 3,
  className = "",
  showToggle = true,
  defaultExpanded = false,
  toggleText = {
    showMore: "Show more",
    showLess: "Show less",
  },
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className={className}>
      <div
        className={`${
          isExpanded ? "" : `line-clamp-${maxLines}`
        } transition-all duration-200`}
      >
        {children}
      </div>

      {showToggle && (
        <button
          onClick={toggleExpanded}
          className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 transition-colors"
          aria-label={isExpanded ? toggleText.showLess : toggleText.showMore}
        >
          {isExpanded ? (
            <>
              {toggleText.showLess}
              <ChevronUp className="w-4 h-4" />
            </>
          ) : (
            <>
              {toggleText.showMore}
              <ChevronDown className="w-4 h-4" />
            </>
          )}
        </button>
      )}
    </div>
  );
};
