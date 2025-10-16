import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { clsx } from "clsx";

interface AccordionItemProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  isOpen?: boolean;
  onToggle?: () => void;
  className?: string;
}

export const AccordionItem: React.FC<AccordionItemProps> = ({
  title,
  icon,
  children,
  isOpen = false,
  onToggle,
  className,
}) => {
  return (
    <div className={clsx("border border-gray-200 rounded-lg", className)}>
      <button
        onClick={onToggle}
        className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
        aria-expanded={isOpen}
      >
        <div className="flex items-center">
          {icon && <span className="mr-3 text-primary-600">{icon}</span>}
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
        {isOpen ? (
          <ChevronUp className="h-5 w-5 text-gray-500" />
        ) : (
          <ChevronDown className="h-5 w-5 text-gray-500" />
        )}
      </button>

      {isOpen && (
        <div className="px-6 pb-6 border-t border-gray-100">
          <div className="pt-4 space-y-4">{children}</div>
        </div>
      )}
    </div>
  );
};

interface AccordionProps {
  children: React.ReactNode;
  className?: string;
  defaultOpen?: string[];
}

export const Accordion: React.FC<AccordionProps> = ({
  children,
  className,
  defaultOpen = [],
}) => {
  const [openSections, setOpenSections] = useState<string[]>(defaultOpen);

  const toggleSection = (sectionId: string) => {
    setOpenSections((prev) =>
      prev.includes(sectionId)
        ? prev.filter((id) => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  return (
    <div className={clsx("space-y-4", className)}>
      {React.Children.map(children, (child, index) => {
        if (React.isValidElement(child)) {
          const sectionId =
            child.props["data-section-id"] || `section-${index}`;
          return React.cloneElement(child, {
            isOpen: openSections.includes(sectionId),
            onToggle: () => toggleSection(sectionId),
            "data-section-id": sectionId,
          });
        }
        return child;
      })}
    </div>
  );
};
