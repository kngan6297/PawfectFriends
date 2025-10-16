import React, { createContext, useContext, ReactNode } from "react";
import { Tooltip } from "react-tooltip";

interface TooltipContextType {
  registerTooltip: (id: string, content: string) => void;
  unregisterTooltip: (id: string) => void;
}

const TooltipContext = createContext<TooltipContextType | null>(null);

interface PetTooltipProviderProps {
  children: ReactNode;
  petId: string;
}

export const PetTooltipProvider: React.FC<PetTooltipProviderProps> = ({
  children,
  petId,
}) => {
  const [tooltips, setTooltips] = React.useState<Map<string, string>>(
    new Map()
  );

  const registerTooltip = React.useCallback((id: string, content: string) => {
    setTooltips((prev) => new Map(prev).set(id, content));
  }, []);

  const unregisterTooltip = React.useCallback((id: string) => {
    setTooltips((prev) => {
      const newMap = new Map(prev);
      newMap.delete(id);
      return newMap;
    });
  }, []);

  const contextValue = React.useMemo(
    () => ({
      registerTooltip,
      unregisterTooltip,
    }),
    [registerTooltip, unregisterTooltip]
  );

  return (
    <TooltipContext.Provider value={contextValue}>
      {children}
      {/* Render all tooltips in one place */}
      {Array.from(tooltips.entries()).map(([id, content]) => (
        <Tooltip key={id} id={id} content={content} />
      ))}
    </TooltipContext.Provider>
  );
};

export const usePetTooltip = () => {
  const context = useContext(TooltipContext);
  if (!context) {
    throw new Error("usePetTooltip must be used within a PetTooltipProvider");
  }
  return context;
};
