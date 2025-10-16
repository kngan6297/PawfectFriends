import React, { useState, createContext, useContext } from "react";

interface TooltipContextType {
  isVisible: boolean;
  setIsVisible: (visible: boolean) => void;
}

const TooltipContext = createContext<TooltipContextType | undefined>(undefined);

const useTooltip = () => {
  const context = useContext(TooltipContext);
  if (!context) {
    throw new Error("Tooltip components must be used within a Tooltip");
  }
  return context;
};

interface TooltipProps {
  children: React.ReactNode;
  className?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({
  children,
  className = "",
}) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <TooltipContext.Provider value={{ isVisible, setIsVisible }}>
      <div className={`relative inline-block ${className}`}>{children}</div>
    </TooltipContext.Provider>
  );
};

interface TooltipTriggerProps {
  children: React.ReactNode;
  asChild?: boolean;
}

export const TooltipTrigger: React.FC<TooltipTriggerProps> = ({
  children,
  asChild = false,
}) => {
  const { setIsVisible } = useTooltip();

  const triggerProps = {
    onMouseEnter: () => setIsVisible(true),
    onMouseLeave: () => setIsVisible(false),
  };

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, triggerProps);
  }

  return <div {...triggerProps}>{children}</div>;
};

interface TooltipContentProps {
  children: React.ReactNode;
  position?: "top" | "bottom" | "left" | "right";
  className?: string;
}

export const TooltipContent: React.FC<TooltipContentProps> = ({
  children,
  position = "top",
  className = "",
}) => {
  const { isVisible } = useTooltip();

  const positionClasses = {
    top: "bottom-full left-1/2 transform -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 transform -translate-x-1/2 mt-2",
    left: "right-full top-1/2 transform -translate-y-1/2 mr-2",
    right: "left-full top-1/2 transform -translate-y-1/2 ml-2",
  };

  const arrowClasses = {
    top: "top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900",
    bottom:
      "bottom-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-b-gray-900",
    left: "left-full top-1/2 transform -translate-y-1/2 border-4 border-transparent border-l-gray-900",
    right:
      "right-full top-1/2 transform -translate-y-1/2 border-4 border-transparent border-r-gray-900",
  };

  if (!isVisible) return null;

  return (
    <div
      className={`absolute z-50 px-3 py-2 text-sm text-white bg-gray-900 rounded-lg shadow-lg whitespace-normal max-w-xs ${positionClasses[position]} transition-opacity duration-200 ${className}`}
    >
      {children}
      <div className={`absolute ${arrowClasses[position]}`}></div>
    </div>
  );
};

// Legacy Tooltip component for backward compatibility
interface LegacyTooltipProps {
  content: string;
  children: React.ReactNode;
  position?: "top" | "bottom" | "left" | "right";
  className?: string;
}

export const LegacyTooltip: React.FC<LegacyTooltipProps> = ({
  content,
  children,
  position = "top",
  className = "",
}) => {
  const [isVisible, setIsVisible] = useState(false);

  const positionClasses = {
    top: "bottom-full left-1/2 transform -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 transform -translate-x-1/2 mt-2",
    left: "right-full top-1/2 transform -translate-y-1/2 mr-2",
    right: "left-full top-1/2 transform -translate-y-1/2 ml-2",
  };

  const arrowClasses = {
    top: "top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900",
    bottom:
      "bottom-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-b-gray-900",
    left: "left-full top-1/2 transform -translate-y-1/2 border-4 border-transparent border-l-gray-900",
    right:
      "right-full top-1/2 transform -translate-y-1/2 border-4 border-transparent border-r-gray-900",
  };

  return (
    <div
      className={`relative inline-block ${className}`}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div
          className={`absolute z-50 px-3 py-2 text-sm text-white bg-gray-900 rounded-lg shadow-lg whitespace-normal max-w-xs ${positionClasses[position]} transition-opacity duration-200`}
        >
          {content}
          <div className={`absolute ${arrowClasses[position]}`}></div>
        </div>
      )}
    </div>
  );
};
