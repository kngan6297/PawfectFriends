import React, { useState, useMemo } from "react";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/Button";
import PetTable from "./PetTable";
import PetFilterBar from "./PetFilterBar";
import PetStats from "./PetStats";
import { Pet } from "@/types/pet";
import { useLocation } from "react-router-dom";
import PetEditLogModal from "./PetEditLogModal";
import ComplaintModal from "./ComplaintModal";
import ComplaintManagementModal from "./ComplaintManagementModal";
import { History, Flag, AlertTriangle } from "lucide-react";

export type PetManagementMode = "shelter" | "admin" | "generic";

interface PetManagementProps {
  pets: Pet[];
  onPetsChange: () => void;
  mode?: PetManagementMode;
  title?: string;
  description?: string;
  showStats?: boolean;
  showAddButton?: boolean;
  onAddPet?: () => void;
  addButtonText?: string;
  customActions?: {
    label: string;
    action: (pet: Pet) => void;
    variant?: "primary" | "secondary" | "outline" | "danger";
    icon?: React.ReactNode;
    condition?: (pet: Pet) => boolean;
  }[];
  onPetAction?: (action: string, petId: string, data?: any) => Promise<void>;
}

const PetManagement: React.FC<PetManagementProps> = ({
  pets,
  onPetsChange,
  mode = "generic",
  title = "Pet Management",
  description = "Manage pets and adoption listings",
  showStats = true,
  showAddButton = false,
  onAddPet,
  addButtonText = "Add New Pet",
  customActions = [],
  onPetAction,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [ageFilter, setAgeFilter] = useState("");
  const [genderFilter, setGenderFilter] = useState("");
  const [sizeFilter, setSizeFilter] = useState("");
  const [healthFilter, setHealthFilter] = useState("");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [loading, setLoading] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const location = useLocation();

  const [logModalOpen, setLogModalOpen] = useState(false);
  const [logPetId, setLogPetId] = useState<string | null>(null);
  const [showFlaggedOnly, setShowFlaggedOnly] = useState(false);
  const [complaintModalOpen, setComplaintModalOpen] = useState(false);
  const [complaintManagementModalOpen, setComplaintManagementModalOpen] =
    useState(false);
  const [selectedPetForComplaint, setSelectedPetForComplaint] =
    useState<Pet | null>(null);
  const [
    selectedPetForComplaintManagement,
    setSelectedPetForComplaintManagement,
  ] = useState<Pet | null>(null);

  // Memoized filtered pets for performance
  const filteredPets = useMemo(() => {
    let petsToFilter = pets;

    // If showing flagged pets only, filter by status
    if (showFlaggedOnly) {
      petsToFilter = pets.filter((pet) => pet.status === "flagged");
    }

    return petsToFilter.filter((pet) => {
      // Search by name or breed
      const matchesSearch =
        searchTerm === "" ||
        pet.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (pet.breeds?.primary || pet.breed || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (pet.breeds?.secondary || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase());

      // Filter by status
      const matchesStatus = statusFilter === "" || pet.status === statusFilter;

      // Filter by type
      const matchesType = typeFilter === "" || pet.type === typeFilter;

      // Filter by age
      const matchesAge = ageFilter === "" || pet.age === ageFilter;

      // Filter by gender
      const matchesGender = genderFilter === "" || pet.gender === genderFilter;

      // Filter by size
      const matchesSize = sizeFilter === "" || pet.size === sizeFilter;

      // Filter by health status
      const matchesHealth =
        healthFilter === "" ||
        getHealthStatus(pet).toLowerCase().includes(healthFilter.toLowerCase());

      return (
        matchesSearch &&
        matchesStatus &&
        matchesType &&
        matchesAge &&
        matchesGender &&
        matchesSize &&
        matchesHealth
      );
    });
  }, [
    pets,
    showFlaggedOnly,
    searchTerm,
    statusFilter,
    typeFilter,
    ageFilter,
    genderFilter,
    sizeFilter,
    healthFilter,
  ]);

  // Pagination logic
  const totalPets = filteredPets.length;
  const totalPages = Math.ceil(totalPets / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedPets = filteredPets.slice(startIndex, endIndex);

  // Reset to first page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [
    searchTerm,
    statusFilter,
    typeFilter,
    ageFilter,
    genderFilter,
    sizeFilter,
    healthFilter,
  ]);

  const getHealthStatus = (pet: Pet) => {
    const conditions = [];
    if (pet.health?.medicalHistory?.length) {
      conditions.push("Medical History");
    }
    if (pet.tags?.length) {
      conditions.push(...pet.tags);
    }
    return conditions.length > 0 ? conditions.join(", ") : "Healthy";
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("");
    setTypeFilter("");
    setAgeFilter("");
    setGenderFilter("");
    setSizeFilter("");
    setHealthFilter("");
  };

  const activeFiltersCount = [
    statusFilter,
    typeFilter,
    ageFilter,
    genderFilter,
    sizeFilter,
    healthFilter,
  ].filter(Boolean).length;

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1); // Reset to first page when changing page size
  };

  const handleCustomAction = async (action: any, pet: Pet) => {
    try {
      setLoading(true);
      if (onPetAction) {
        await onPetAction(
          action.label.toLowerCase().replace(/\s+/g, "_"),
          pet._id || "",
          action.data
        );
      } else {
        action.action(pet);
      }
    } catch (error) {
      console.error("Action error:", error);
      toast.error("Failed to perform action");
    } finally {
      setLoading(false);
    }
  };

  const customActionsWithLog = useMemo(
    () => [
      ...customActions,
      {
        label: "View Log",
        action: (pet: Pet) => {
          setLogPetId(pet._id || pet.id || "");
          setLogModalOpen(true);
        },
        variant: "outline" as "outline",
        icon: <History className="h-4 w-4" />,
        condition: (pet: Pet) => mode === "admin",
      },
      {
        label: "Report",
        action: (pet: Pet) => {
          setSelectedPetForComplaint(pet);
          setComplaintModalOpen(true);
        },
        variant: "outline" as "outline",
        icon: <AlertTriangle className="h-4 w-4" />,
        condition: (pet: Pet) => mode !== "admin" && pet.status !== "flagged",
      },
      {
        label: "Manage Complaints",
        action: (pet: Pet) => {
          setSelectedPetForComplaintManagement(pet);
          setComplaintManagementModalOpen(true);
        },
        variant: "outline" as "outline",
        icon: <Flag className="h-4 w-4" />,
        condition: (pet: Pet) => mode === "admin" && pet.status === "flagged",
      },
    ],
    [customActions, mode]
  );

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex flex-col md:flex-row justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          <p className="text-sm text-gray-600 mt-1">{description}</p>
        </div>
        <div className="flex items-center space-x-2 mt-4 md:mt-0">
          {mode === "admin" && (
            <Button
              variant={showFlaggedOnly ? "primary" : "outline"}
              onClick={() => setShowFlaggedOnly(!showFlaggedOnly)}
              className="flex items-center space-x-2"
            >
              <Flag className="h-4 w-4" />
              <span>{showFlaggedOnly ? "Show All" : "Flagged Only"}</span>
            </Button>
          )}
          {showAddButton &&
            onAddPet &&
            location.pathname !== "/shelter/pets/create" && (
              <Button variant="primary" onClick={onAddPet}>
                {addButtonText}
              </Button>
            )}
        </div>
      </div>

      {/* Stats Overview */}
      {showStats && <PetStats pets={pets} />}

      {/* Filter Bar */}
      <PetFilterBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        typeFilter={typeFilter}
        onTypeFilterChange={setTypeFilter}
        ageFilter={ageFilter}
        onAgeFilterChange={setAgeFilter}
        genderFilter={genderFilter}
        onGenderFilterChange={setGenderFilter}
        sizeFilter={sizeFilter}
        onSizeFilterChange={setSizeFilter}
        healthFilter={healthFilter}
        onHealthFilterChange={setHealthFilter}
        showAdvancedFilters={showAdvancedFilters}
        onToggleAdvancedFilters={() =>
          setShowAdvancedFilters(!showAdvancedFilters)
        }
        onClearFilters={clearFilters}
        activeFiltersCount={activeFiltersCount}
      />

      {/* Results Summary */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full lg:w-auto">
          <p className="text-sm text-gray-600">
            Showing {startIndex + 1}-{Math.min(endIndex, totalPets)} of{" "}
            {totalPets} pets
            {activeFiltersCount > 0 && (
              <span className="ml-2 text-blue-600">
                ({activeFiltersCount} filter
                {activeFiltersCount !== 1 ? "s" : ""} active)
              </span>
            )}
          </p>

          {/* Page Size Selector */}
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-sm text-gray-600 whitespace-nowrap">
              Show:
            </span>
            <select
              value={pageSize}
              onChange={(e) => handlePageSizeChange(Number(e.target.value))}
              className="text-sm border border-gray-300 rounded-md px-2 py-1 min-w-[60px] mr-2"
              aria-label="Items per page"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span className="text-sm text-gray-600 whitespace-nowrap">
              per page
            </span>
          </div>
        </div>

        {/* Clear Filters Button */}
        {activeFiltersCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={clearFilters}
            className="text-sm whitespace-nowrap"
          >
            Clear Filters
          </Button>
        )}
      </div>

      {/* Pet Table */}
      <PetTable
        pets={paginatedPets}
        mode={mode}
        customActions={customActionsWithLog}
        onCustomAction={handleCustomAction}
        loading={loading}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center">
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Previous
            </Button>

            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }

              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? "primary" : "outline"}
                  size="sm"
                  onClick={() => handlePageChange(pageNum)}
                >
                  {pageNum}
                </Button>
              );
            })}

            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      <PetEditLogModal
        open={logModalOpen}
        onClose={() => setLogModalOpen(false)}
        petId={logPetId || ""}
      />

      <ComplaintModal
        open={complaintModalOpen}
        onClose={() => setComplaintModalOpen(false)}
        petId={
          selectedPetForComplaint?._id || selectedPetForComplaint?.id || ""
        }
        petName={selectedPetForComplaint?.name || ""}
        onComplaintSubmitted={() => {
          onPetsChange();
        }}
      />

      <ComplaintManagementModal
        open={complaintManagementModalOpen}
        onClose={() => setComplaintManagementModalOpen(false)}
        petId={
          selectedPetForComplaintManagement?._id ||
          selectedPetForComplaintManagement?.id ||
          ""
        }
        petName={selectedPetForComplaintManagement?.name || ""}
        onComplaintUpdated={() => {
          onPetsChange();
        }}
      />
    </div>
  );
};

export default PetManagement;
