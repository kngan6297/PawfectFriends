import React, { createContext, useContext, useState } from "react";

export type SortOption =
  | "newest"
  | "oldest"
  | "name_asc"
  | "name_desc"
  | "fee_asc"
  | "fee_desc"
  | "popular";

interface SearchFilters {
  searchQuery: string;
  type: string;
  size: string;
  gender: string;
  age: string;
  breed: string;
  location: string;
  status: string;
  sortBy: SortOption;
  page: number;
  pageSize: number;
}

interface SearchFilterContextType {
  filters: SearchFilters;
  updateFilters: (newFilters: Partial<SearchFilters>) => void;
  resetFilters: () => void;
}

const defaultFilters: SearchFilters = {
  searchQuery: "",
  type: "",
  size: "",
  gender: "",
  age: "",
  breed: "",
  location: "",
  status: "adoptable",
  sortBy: "newest",
  page: 1,
  pageSize: 12,
};

const SearchFilterContext = createContext<SearchFilterContextType | undefined>(
  undefined
);

export const SearchFilterProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [filters, setFilters] = useState<SearchFilters>(defaultFilters);

  const updateFilters = (newFilters: Partial<SearchFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const resetFilters = () => {
    setFilters(defaultFilters);
  };

  return (
    <SearchFilterContext.Provider
      value={{ filters, updateFilters, resetFilters }}
    >
      {children}
    </SearchFilterContext.Provider>
  );
};

export const useSearchFilter = () => {
  const context = useContext(SearchFilterContext);
  if (!context) {
    throw new Error(
      "useSearchFilter must be used within a SearchFilterProvider"
    );
  }
  return context;
};
