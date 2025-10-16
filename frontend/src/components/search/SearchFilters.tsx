import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, Filter, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
  SelectSeparator,
} from "@/components/ui/Select";
import { useSearchFilter, SortOption } from "@/context/SearchFilterContext";
import { useDebounce } from "@/hooks/useDebounce";

const sortOptions: { value: SortOption; label: string }[] = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "fee_asc", label: "Adoption Fee: Low to High" },
  { value: "fee_desc", label: "Adoption Fee: High to Low" },
  { value: "popular", label: "Most Popular" },
  { value: "name_asc", label: "Name: A to Z" },
  { value: "name_desc", label: "Name: Z to A" },
];

const petTypes = [
  { value: "all", label: "All Types" },
  { value: "dog", label: "Dogs" },
  { value: "cat", label: "Cats" },
  { value: "bird", label: "Birds" },
  { value: "other", label: "Other" },
];

const petSizes = [
  { value: "all", label: "All Sizes" },
  { value: "small", label: "Small" },
  { value: "medium", label: "Medium" },
  { value: "large", label: "Large" },
];

const petGenders = [
  { value: "all", label: "All Genders" },
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "unknown", label: "Unknown" },
];

const petAges = [
  { value: "all", label: "All Ages" },
  { value: "baby", label: "Baby (Under 1 year)" },
  { value: "young", label: "Young (1-3 years)" },
  { value: "adult", label: "Adult (3-5 years)" },
  { value: "senior", label: "Senior (5+ years)" },
];

export default function SearchFilters() {
  const { filters, updateFilters, resetFilters } = useSearchFilter();

  // Local state for pending filter changes
  const [pendingFilters, setPendingFilters] = useState({
    searchQuery: filters.searchQuery,
    type: filters.type,
    size: filters.size,
    gender: filters.gender,
    age: filters.age,
    breed: filters.breed,
    location: filters.location,
    status: filters.status,
    sortBy: filters.sortBy,
  });

  const [searchInput, setSearchInput] = useState(filters.searchQuery);
  const debouncedSearch = useDebounce(searchInput, 300);

  // Update local state when context filters change (e.g., after reset)
  useEffect(() => {
    setPendingFilters({
      searchQuery: filters.searchQuery,
      type: filters.type,
      size: filters.size,
      gender: filters.gender,
      age: filters.age,
      breed: filters.breed,
      location: filters.location,
      status: filters.status,
      sortBy: filters.sortBy,
    });
    setSearchInput(filters.searchQuery);
  }, [filters]);

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    setPendingFilters((prev) => ({ ...prev, searchQuery: value }));
  };

  const handleFilterChange = (
    key: keyof typeof pendingFilters,
    value: string
  ) => {
    setPendingFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleApplyFilters = () => {
    updateFilters({ ...pendingFilters, page: 1 });
  };

  const handleResetFilters = () => {
    resetFilters();
    // Reset pendingFilters to match the default values
    setPendingFilters({
      searchQuery: "",
      type: "all",
      size: "all",
      gender: "all",
      age: "all",
      breed: "",
      location: "",
      status: "adoptable",
      sortBy: "newest",
    });
    setSearchInput("");
  };

  return (
    <div className="bg-white shadow rounded-lg p-4 space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <label htmlFor="search" className="sr-only">
          Search pets
        </label>
        <input
          id="search"
          type="text"
          value={searchInput}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Search pets..."
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg
            className="h-5 w-5 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pet Type Filter */}
        <div>
          <label
            htmlFor="pet-type"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Pet Type
          </label>
          <Select
            value={pendingFilters.type}
            onValueChange={(value) => handleFilterChange("type", value)}
          >
            <SelectTrigger className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500">
              <SelectValue placeholder="Select pet type" />
            </SelectTrigger>
            <SelectContent>
              {petTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Breed Filter */}
        <div>
          <label
            htmlFor="pet-breed"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Breed
          </label>
          <input
            id="pet-breed"
            type="text"
            value={pendingFilters.breed}
            onChange={(e) => handleFilterChange("breed", e.target.value)}
            placeholder="Start typing breed..."
            className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            aria-label="Enter pet breed"
          />
        </div>

        {/* Size Filter */}
        <div>
          <label
            htmlFor="pet-size"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Size
          </label>
          <Select
            value={pendingFilters.size}
            onValueChange={(value) => handleFilterChange("size", value)}
          >
            <SelectTrigger className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500">
              <SelectValue placeholder="Select pet size" />
            </SelectTrigger>
            <SelectContent>
              {petSizes.map((size) => (
                <SelectItem key={size.value} value={size.value}>
                  {size.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Age Filter */}
        <div>
          <label
            htmlFor="pet-age"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Age
          </label>
          <Select
            value={pendingFilters.age}
            onValueChange={(value) => handleFilterChange("age", value)}
          >
            <SelectTrigger className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500">
              <SelectValue placeholder="Select pet age" />
            </SelectTrigger>
            <SelectContent>
              {petAges.map((age) => (
                <SelectItem key={age.value} value={age.value}>
                  {age.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Gender Filter */}
        <div>
          <label
            htmlFor="pet-gender"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Gender
          </label>
          <Select
            value={pendingFilters.gender}
            onValueChange={(value) => handleFilterChange("gender", value)}
          >
            <SelectTrigger className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500">
              <SelectValue placeholder="Select pet gender" />
            </SelectTrigger>
            <SelectContent>
              {petGenders.map((gender) => (
                <SelectItem key={gender.value} value={gender.value}>
                  {gender.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Location Filter */}
        <div>
          <label
            htmlFor="pet-location"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Location
          </label>
          <input
            id="pet-location"
            type="text"
            value={pendingFilters.location}
            onChange={(e) => handleFilterChange("location", e.target.value)}
            placeholder="Enter location..."
            className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            aria-label="Enter location"
          />
        </div>

        {/* Sort Options */}
        <div>
          <label
            htmlFor="sort-by"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Sort By
          </label>
          <select
            id="sort-by"
            value={pendingFilters.sortBy}
            onChange={(e) => handleFilterChange("sortBy", e.target.value)}
            className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            aria-label="Select sort option"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3">
        <button
          onClick={handleResetFilters}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          Reset Filters
        </button>
        <button
          onClick={handleApplyFilters}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          Apply Filters
        </button>
      </div>
    </div>
  );
}
