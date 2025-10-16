import React, { createContext, useContext, ReactNode } from "react";
import { colors, shadows } from "@/constants";

interface ThemeContextType {
  colors: typeof colors & { shadows: typeof shadows };
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const themeColors = {
    ...colors,
    shadows,
  };

  const value: ThemeContextType = {
    colors: themeColors,
    isDark: false, // Always light mode
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
