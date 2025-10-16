import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { petApi } from "@/services/api";
import { Pet } from "@/types/pet";
import { PetCard } from "@/components/pet/PetCard";
import { Search, ChevronDown, ChevronUp } from "lucide-react";
import { useToastContext } from "@/components/ui/ToastProvider";
import { debounce } from "lodash";
import SearchFilters from "@/components/search/SearchFilters";
import Pagination from "@/components/ui/Pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
  SelectSeparator,
} from "../../components/ui/Select";
import { Button } from "@/components/ui/Button";
import { requestDeduplication } from "@/services/requestDeduplication";

interface Filters {
  type: string;
  size: string;
  age: string;
  gender: string;
  breed: string;
  location: string;
  status: string;
  search: string;
  sort: string;
}

const PetList: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, favoritePetIds, toggleFavoritePet, isPetFavorited } = useAuth();
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);

  // Computed values for accessibility
  const ariaLabel = useMemo(
    () => (isFilterExpanded ? "Hide filter options" : "Show filter options"),
    [isFilterExpanded]
  );

  // Filter states
  const [filters, setFilters] = useState<Filters>({
    type: searchParams.get("type") || "all",
    size: searchParams.get("size") || "all",
    age: searchParams.get("age") || "all",
    gender: searchParams.get("gender") || "all",
    breed: searchParams.get("breed") || "",
    location: searchParams.get("location") || "",
    status: searchParams.get("status") || "adoptable",
    search: searchParams.get("search") || "",
    sort: searchParams.get("sort") || "newest",
  });

  // Pagination states
  const currentPage = Number(searchParams.get("page")) || 1;
  const currentPageSize = Number(searchParams.get("pageSize")) || 12;

  const { showToast } = useToastContext();

  // Debounced fetch function
  const debouncedFetchPets = useCallback(
    debounce(async () => {
      try {
        setLoading(true);
        setError(null);
        const requestFilters = {
          ...filters,
          page: currentPage,
          limit: currentPageSize,
        };
        
        const key = requestDeduplication.generateKey('GET', '/api/pets', requestFilters);
        const response = await requestDeduplication.execute(key, () => 
          petApi.getPets(requestFilters, favoritePetIds)
        );

        if (!response) {
          throw new Error("No response from server");
        }

        const { pets = [], pagination = {} } = response;

        if (!Array.isArray(pets)) {
          throw new Error("Invalid pets data received");
        }

        setPets(pets);
        setTotalPages(Math.ceil((pagination.total || 0) / currentPageSize));
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to fetch pets";
        setError(errorMessage);
        setPets([]);
        setTotalPages(1);
      } finally {
        setLoading(false);
      }
    }, 300),
    [filters, currentPage, currentPageSize, favoritePetIds]
  );

  // Sync filters with search params
  useEffect(() => {
    const type = searchParams.get("type") || "all";
    const size = searchParams.get("size") || "all";
    const age = searchParams.get("age") || "all";
    const gender = searchParams.get("gender") || "all";
    const breed = searchParams.get("breed") || "";
    const location = searchParams.get("location") || "";
    const status = searchParams.get("status") || "adoptable";
    const search = searchParams.get("search") || "";
    const sort = searchParams.get("sort") || "newest";

    setFilters({
      type,
      size,
      age,
      gender,
      breed,
      location,
      status,
      search,
      sort,
    });
  }, [searchParams]);

  // Combined useEffect for fetching both pets and favorites
  useEffect(() => {
    const fetchData = async () => {
      await Promise.all([debouncedFetchPets()]);
    };

    fetchData();
  }, [debouncedFetchPets]);

  const handleFilterChange = (
    e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleFilter = () => {
    const params: Record<string, string> = {};
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== "" && value !== "all") {
        params[key] = value;
      }
    });
    params.page = "1"; // Reset to first page when filters change
    setSearchParams(params);
  };

  const handleResetFilters = () => {
    setFilters({
      type: "all",
      size: "all",
      age: "all",
      gender: "all",
      breed: "",
      location: "",
      status: "adoptable",
      search: "",
      sort: "newest",
    });
    setSearchParams({ page: "1" });
  };

  const handlePageChange = (newPage: number) => {
    searchParams.set("page", newPage.toString());
    setSearchParams(searchParams);
  };

  const toggleFavorite = async (petId: string, newIsFavorite: boolean) => {
    if (!user) {
      showToast({
        type: "error",
        title: "Error",
        description: "Please login to add favorites",
      });
      return;
    }

    try {
      await toggleFavoritePet(petId);
    } catch (error) {
      console.error("Failed to toggle favorite:", error);
      showToast({
        type: "error",
        title: "Error",
        description: "Failed to update favorite",
      });
    }
  };

  if (loading) {
    return (
      <div className="w-full py-8 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Find Your Perfect Pet
          </h1>
          <p className="mt-3 text-xl text-gray-500">
            Browse adoptable pets from shelters and rescues
          </p>
        </div>
        <div className="mt-8 grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(8)].map((_, index) => (
            <div
              key={index}
              className="bg-white rounded-xl shadow-sm overflow-hidden h-[400px] animate-pulse"
            >
              <div className="h-48 bg-gray-200"></div>
              <div className="p-5">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-3 bg-gray-200 rounded w-5/6 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-4/6 mb-4"></div>
                <div className="h-8 bg-gray-200 rounded w-full mt-6"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full py-8 px-4 sm:px-6 lg:px-8">
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-red-600">
            Error Loading Pets
          </h3>
          <p className="mt-2 text-sm text-gray-500">{error}</p>
          <button
            onClick={debouncedFetchPets}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full py-8 px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
          Find Your Perfect Pet
        </h1>
        <p className="mt-3 text-xl text-gray-500">
          Browse adoptable pets from shelters and rescues
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        {/* Mobile Filter Toggle */}
        <div className="lg:hidden mb-4">
          <Button
            type="button"
            onClick={() => setIsFilterExpanded(!isFilterExpanded)}
            aria-expanded={isFilterExpanded ? "true" : "false"}
            aria-controls="filter-grid"
            aria-label={ariaLabel}
            className="w-full flex items-center justify-between px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-200 ease-in-out"
          >
            <span>Filters</span>
            {isFilterExpanded ? (
              <ChevronUp
                className="h-5 w-5 transition-transform duration-200"
                aria-hidden="true"
              />
            ) : (
              <ChevronDown
                className="h-5 w-5 transition-transform duration-200"
                aria-hidden="true"
              />
            )}
          </Button>
        </div>

        {/* Filter Grid */}
        <div
          id="filter-grid"
          className={`grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 transition-all duration-300 ease-in-out ${
            isFilterExpanded
              ? "opacity-100 max-h-[500px]"
              : "hidden lg:grid opacity-100"
          }`}
        >
          <div className="transform transition-all duration-200 hover:scale-[1.02]">
            <label
              htmlFor="type-select"
              className="block text-sm font-medium text-gray-900 mb-1"
            >
              Pet Type
            </label>
            <Select
              value={filters.type}
              onValueChange={(value) => setFilters({ ...filters, type: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select pet type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="dog">Dogs</SelectItem>
                <SelectItem value="cat">Cats</SelectItem>
                <SelectItem value="bird">Birds</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="transform transition-all duration-200 hover:scale-[1.02]">
            <label
              htmlFor="breed-input"
              className="block text-sm font-medium text-gray-900 mb-1"
            >
              Breed
            </label>
            <input
              id="breed-input"
              name="breed"
              type="text"
              list="breed-list"
              placeholder="Start typing breed..."
              value={filters.breed}
              onChange={handleFilterChange}
              aria-label="Enter pet breed"
              className="border rounded-lg p-2 w-full focus:ring-primary-500 focus:border-primary-500 text-gray-900 transition-all duration-200 hover:border-primary-400"
            />
            <datalist id="breed-list" aria-label="Common pet breeds">
              {filters.type === "dog" && (
                <>
                  <option value="Labrador Retriever" />
                  <option value="German Shepherd" />
                  <option value="Golden Retriever" />
                  <option value="French Bulldog" />
                  <option value="Bulldog" />
                  <option value="Poodle" />
                  <option value="Beagle" />
                  <option value="Rottweiler" />
                  <option value="Dachshund" />
                  <option value="Yorkshire Terrier" />
                </>
              )}
              {filters.type === "cat" && (
                <>
                  <option value="Persian" />
                  <option value="Maine Coon" />
                  <option value="Siamese" />
                  <option value="Ragdoll" />
                  <option value="British Shorthair" />
                  <option value="Abyssinian" />
                  <option value="Sphynx" />
                  <option value="Bengal" />
                  <option value="Russian Blue" />
                  <option value="American Shorthair" />
                </>
              )}
              {filters.type === "bird" && (
                <>
                  <option value="Budgerigar" />
                  <option value="Cockatiel" />
                  <option value="Lovebird" />
                  <option value="Canary" />
                  <option value="Parakeet" />
                  <option value="Cockatoo" />
                  <option value="African Grey" />
                  <option value="Macaw" />
                  <option value="Finch" />
                  <option value="Conure" />
                </>
              )}
            </datalist>
          </div>

          <div className="transform transition-all duration-200 hover:scale-[1.02]">
            <label
              htmlFor="size-select"
              className="block text-sm font-medium text-gray-900 mb-1"
            >
              Size
            </label>
            <Select
              value={filters.size}
              onValueChange={(value) => setFilters({ ...filters, size: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select pet size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sizes</SelectItem>
                <SelectItem value="small">Small</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="large">Large</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="transform transition-all duration-200 hover:scale-[1.02]">
            <label
              htmlFor="age-select"
              className="block text-sm font-medium text-gray-900 mb-1"
            >
              Age
            </label>
            <Select
              value={filters.age}
              onValueChange={(value) => setFilters({ ...filters, age: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select pet age" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Ages</SelectItem>
                <SelectItem value="baby">Baby (Under 1 year)</SelectItem>
                <SelectItem value="young">Young (1-3 years)</SelectItem>
                <SelectItem value="adult">Adult (3-5 years)</SelectItem>
                <SelectItem value="senior">Senior (5+ years)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="transform transition-all duration-200 hover:scale-[1.02]">
            <label
              htmlFor="gender-select"
              className="block text-sm font-medium text-gray-900 mb-1"
            >
              Gender
            </label>
            <Select
              value={filters.gender}
              onValueChange={(value) =>
                setFilters({ ...filters, gender: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Genders</SelectItem>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="unknown">Unknown</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={handleFilter}
            disabled={loading}
            aria-label={loading ? "Filtering pets..." : "Apply filters"}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-primary-600 transition-all duration-200 ease-in-out transform hover:scale-[1.02] active:scale-[0.98]"
          >
            {loading ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Filtering...
              </>
            ) : (
              "Apply Filters"
            )}
          </button>
          <button
            onClick={handleResetFilters}
            disabled={loading}
            aria-label="Reset all filters"
            className="ml-2 inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white transition-all duration-200 ease-in-out transform hover:scale-[1.02] active:scale-[0.98]"
            type="button"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Pet Grid */}
      <div className="mt-8">
        <div className="flex justify-between items-center mb-4">
          <div
            className="text-sm text-gray-700"
            role="status"
            aria-live="polite"
          >
            {loading ? (
              <span className="flex items-center">
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-700"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Loading pets...
              </span>
            ) : pets.length > 0 ? (
              <span>
                {pets.length} {pets.length === 1 ? "pet" : "pets"} found
              </span>
            ) : (
              <span>No pets found</span>
            )}
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2">
            <label
              htmlFor="sort-select"
              className="text-sm font-medium text-gray-900"
            >
              Sort by:
            </label>
            <Select
              value={filters.sort}
              onValueChange={(value) => setFilters({ ...filters, sort: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sort pets by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="fee_asc">
                  Adoption Fee: Low to High
                </SelectItem>
                <SelectItem value="fee_desc">
                  Adoption Fee: High to Low
                </SelectItem>
                <SelectItem value="popular">Most Popular</SelectItem>
                <SelectItem value="name_asc">Name: A to Z</SelectItem>
                <SelectItem value="name_desc">Name: Z to A</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.isArray(pets) &&
            pets.map((pet, index) => {
              const petId = (pet?.id ?? pet?._id) as string;
              return (
                <div
                  key={petId}
                  className="transform transition-all duration-300 ease-in-out animate-fadeInUp"
                  style={{
                    animationDelay: `${index * 50}ms`,
                  }}
                >
                  <PetCard
                    pet={pet}
                    isFavorite={isPetFavorited(petId)}
                    onFavoriteToggle={(petId, isFavorite) =>
                      toggleFavorite(petId, isFavorite)
                    }
                  />
                </div>
              );
            })}
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-12 flex justify-center">
          <nav className="flex items-center gap-2" aria-label="Pagination">
            <button
              onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              aria-label="Go to previous page"
              className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white transition-colors"
            >
              Previous
            </button>

            <div className="flex items-center gap-1">
              {/* First page */}
              <button
                onClick={() => handlePageChange(1)}
                aria-label="Go to page 1"
                aria-current={currentPage === 1 ? "page" : undefined}
                className={`min-w-[40px] h-10 px-3 rounded-lg text-sm font-medium transition-colors ${
                  currentPage === 1
                    ? "bg-primary-600 text-white hover:bg-primary-700"
                    : "text-gray-700 hover:bg-gray-50 border border-gray-300"
                }`}
              >
                1
              </button>

              {/* Ellipsis after first page if needed */}
              {currentPage > 4 && (
                <span className="px-2 py-2 text-gray-500">...</span>
              )}

              {/* Pages around current page */}
              {(() => {
                const startPage = Math.max(2, currentPage - 2);
                const endPage = Math.min(totalPages - 1, currentPage + 2);
                const pages = [];

                for (let i = startPage; i <= endPage; i++) {
                  pages.push(
                    <button
                      key={i}
                      onClick={() => handlePageChange(i)}
                      aria-label={`Go to page ${i}`}
                      aria-current={currentPage === i ? "page" : undefined}
                      className={`min-w-[40px] h-10 px-3 rounded-lg text-sm font-medium transition-colors ${
                        currentPage === i
                          ? "bg-primary-600 text-white hover:bg-primary-700"
                          : "text-gray-700 hover:bg-gray-50 border border-gray-300"
                      }`}
                    >
                      {i}
                    </button>
                  );
                }

                return pages;
              })()}

              {/* Ellipsis before last page if needed */}
              {currentPage < totalPages - 3 && (
                <span className="px-2 py-2 text-gray-500">...</span>
              )}

              {/* Last page (if different from first) */}
              {totalPages > 1 && (
                <button
                  onClick={() => handlePageChange(totalPages)}
                  aria-label={`Go to page ${totalPages}`}
                  aria-current={currentPage === totalPages ? "page" : undefined}
                  className={`min-w-[40px] h-10 px-3 rounded-lg text-sm font-medium transition-colors ${
                    currentPage === totalPages
                      ? "bg-primary-600 text-white hover:bg-primary-700"
                      : "text-gray-700 hover:bg-gray-50 border border-gray-300"
                  }`}
                >
                  {totalPages}
                </button>
              )}
            </div>

            <button
              onClick={() =>
                handlePageChange(Math.min(totalPages, currentPage + 1))
              }
              disabled={currentPage === totalPages}
              aria-label="Go to next page"
              className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white transition-colors"
            >
              Next
            </button>
          </nav>
        </div>
      )}

      {/* Empty State */}
      {(!Array.isArray(pets) || pets.length === 0) && (
        <div
          className="mt-12 text-center py-12 bg-gray-50 rounded-lg"
          role="status"
        >
          <Search
            className="h-12 w-12 text-gray-600 mx-auto"
            aria-hidden="true"
          />
          <h3 className="mt-2 text-lg font-medium text-gray-900">
            No pets found
          </h3>
          <p className="mt-1 text-gray-700">
            Try adjusting your filters to find more pets
          </p>
        </div>
      )}
    </div>
  );
};

export default PetList;
