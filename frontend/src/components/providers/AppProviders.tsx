import React from "react";

import { OptimizedToastContainer } from "@/components/common/OptimizedToastContainer";

interface AppProvidersProps {
  children: React.ReactNode;
}

export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  return (
    <>
      {/* Optimized ToastContainer - placed outside Routes to avoid unmounting */}
      <OptimizedToastContainer />

      {children}
    </>
  );
};
