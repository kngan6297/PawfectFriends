import React, { createContext, useContext, ReactNode } from "react";
import { useShelterData } from "@/hooks/useShelterData";

// Create the context
const ShelterDataContext = createContext<ReturnType<
  typeof useShelterData
> | null>(null);

// Provider component
interface ShelterDataProviderProps {
  children: ReactNode;
}

export const ShelterDataProvider: React.FC<ShelterDataProviderProps> = ({
  children,
}) => {
  const shelterData = useShelterData();

  return (
    <ShelterDataContext.Provider value={shelterData}>
      {children}
    </ShelterDataContext.Provider>
  );
};

// Custom hook to use the context
export const useShelterDataContext = () => {
  const context = useContext(ShelterDataContext);
  if (!context) {
    throw new Error(
      "useShelterDataContext must be used within a ShelterDataProvider"
    );
  }
  return context;
};
