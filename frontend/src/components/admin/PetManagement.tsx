import React, { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import {
  PawPrint,
  Search,
  Edit,
  Trash2,
  Eye,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Calendar,
  User,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/Dialog";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/Tooltip";
import { formatDisplayDate } from "@/utils/dateUtils";
import { adminApi } from "@/services/admin.service";
import { ModerationStatus, AdoptionStatus } from "@/types/pet";

// Admin-specific Pet interface with backward compatibility
interface AdminPet {
  id: string; // Changed from _id to id
  _id?: string; // Keep _id as optional for backward compatibility
  name: string;
  type: string;
  breed: string;
  age: number;
  gender: string;
  // Use new status fields with fallback to legacy status
  moderationStatus: ModerationStatus;
  adoptionStatus: AdoptionStatus;
  status?: string; // Legacy field for backward compatibility
  shelter: {
    _id: string;
    name: string;
  };
  images: string[];
  createdAt: string;
  updatedAt: string;
  isFlagged?: boolean;
  flagReason?: string;
}

interface PetManagementProps {
  pets?: AdminPet[];
  onPetAction?: (action: string, petId: string, data?: any) => void;
  onRefresh?: () => void;
  loading?: boolean;
}

const PetManagement: React.FC<PetManagementProps> = ({
  pets: initialPets,
  onPetAction,
  loading: externalLoading = false,
}) => {
  const [pets, setPets] = useState<AdminPet[]>(initialPets || []);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [hasNext, setHasNext] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("");
  const [selectedPet, setSelectedPet] = useState<AdminPet | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [selectedPets, setSelectedPets] = useState<string[]>([]);
  const [rejectScope, setRejectScope] = useState<"single" | "bulk">("single");
  const [sortField, setSortField] = useState<string>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Normalize pets to ensure consistent id field and status mapping
  const normalizePets = (arr: any[]): AdminPet[] =>
    arr.map((p) => ({
      ...p,
      id: p.id || p._id,
      // Map backend fields to frontend status fields
      moderationStatus:
        p.moderationStatus ||
        (p.isApproved === true
          ? "approved"
          : p.isApproved === false
          ? "pending"
          : "pending"), // Default to pending if isApproved is undefined
      adoptionStatus:
        p.adoptionStatus ||
        (p.status === "adopted"
          ? "adopted"
          : p.status === "pending"
          ? "pending"
          : "adoptable"),
      // Keep legacy status for backward compatibility
      status: p.status,
    }));

  const fetchPets = useCallback(async () => {
    try {
      setLoading(true);
      const filters: any = {};

      if (searchTerm) filters.search = searchTerm;
      if (typeFilter && typeFilter !== "all") filters.type = typeFilter;

      // Add pagination
      filters.page = page;
      filters.limit = pageSize;

      // Add sorting
      const sortPrefix = sortOrder === "desc" ? "-" : "";
      filters.sort = `${sortPrefix}${sortField}`;

      const response = await adminApi.getAllPets(filters);

      // The backend returns { success: true, message: "...", data: [pets], meta: { page, limit, total } }
      const petsData = Array.isArray(response.data?.data)
        ? response.data.data
        : [];
      const meta = response.data?.meta ?? {};

      const normalizedPets = normalizePets(petsData);

      // If backend doesn't support pagination (returns all pets), apply client-side pagination
      if (typeof meta.total !== "number" || meta.total === 0) {
        const totalPets = normalizedPets.length;
        const startIndex = (page - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const paginatedPets = normalizedPets.slice(startIndex, endIndex);

        setPets(paginatedPets);
        setTotal(totalPets);
        setHasNext(endIndex < totalPets);
      } else {
        // Backend supports pagination
        setPets(normalizedPets);
        setTotal(meta.total);
        setHasNext(
          typeof meta.hasNext === "boolean"
            ? meta.hasNext
            : petsData.length === pageSize
        );
      }
    } catch (error) {
      console.error("Error fetching pets:", error);
      toast.error("Failed to fetch pets");
      setPets([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  }, [searchTerm, typeFilter, sortField, sortOrder, page, pageSize]);

  // Handle initial pets or fetch pets when filters change
  useEffect(() => {
    // If we have initial pets and no filters are applied, use them
    if (
      initialPets &&
      !searchTerm &&
      typeFilter === "all" &&
      sortField === "createdAt" &&
      sortOrder === "desc"
    ) {
      const normalizedPets = normalizePets(initialPets);
      const totalPets = normalizedPets.length;

      // Apply pagination to initial pets
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedPets = normalizedPets.slice(startIndex, endIndex);

      setPets(paginatedPets);
      setTotal(totalPets);
      setHasNext(endIndex < totalPets);
      return;
    }

    // Otherwise, fetch pets with current filters
    const timeoutId = setTimeout(() => {
      fetchPets();
    }, 350);

    return () => clearTimeout(timeoutId);
  }, [
    initialPets,
    searchTerm,
    typeFilter,
    sortField,
    sortOrder,
    page,
    pageSize,
    fetchPets,
  ]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const handleUpdatePet = async (petId: string, data: any) => {
    try {
      await adminApi.updatePet(petId, data);
      toast.success("Pet updated successfully");
      fetchPets();
      onPetAction?.("update", petId, data);
    } catch (error) {
      console.error("Error updating pet:", error);
      toast.error("Failed to update pet");
      throw error; // Re-throw to handle in the button click handler
    }
  };

  const handleDeletePet = async (petId: string) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this pet? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      await adminApi.deletePet(petId);
      toast.success("Pet deleted successfully");
      fetchPets();
      onPetAction?.("delete", petId);
    } catch (error) {
      console.error("Error deleting pet:", error);
      toast.error("Failed to delete pet");
    }
  };

  const handleApprovePet = async (petId: string) => {
    try {
      await adminApi.updatePetModeration(petId, {
        moderationStatus: "approved",
      });
      toast.success("Pet approved successfully");
      setShowModal(false);
      fetchPets();
      onPetAction?.("approve", petId);
    } catch (error) {
      console.error("Error approving pet:", error);
      toast.error("Failed to approve pet");
    }
  };
  const handleRejectPet = async () => {
    if (!selectedPet || !rejectReason.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }

    try {
      await adminApi.rejectPet(selectedPet.id, rejectReason);
      toast.success("Pet rejected successfully");
      setShowRejectModal(false);
      setRejectReason("");
      setSelectedPet(null);
      fetchPets();
      onPetAction?.("reject", selectedPet.id, { reason: rejectReason });
    } catch (error) {
      console.error("Error rejecting pet:", error);
      toast.error("Failed to reject pet");
    }
  };

  const handleBulkApprove = async () => {
    if (selectedPets.length === 0) return;

    try {
      const promises = selectedPets.map((petId) =>
        adminApi.updatePetModeration(petId, { moderationStatus: "approved" })
      );
      await Promise.all(promises);
      toast.success(`${selectedPets.length} pets approved successfully`);
      setSelectedPets([]);
      fetchPets();
    } catch (error) {
      console.error("Error bulk approving pets:", error);
      toast.error("Failed to approve some pets");
    }
  };

  const handleBulkReject = async () => {
    if (!rejectReason.trim() || selectedPets.length === 0) {
      return toast.error("Reason & selection required");
    }

    try {
      await Promise.all(
        selectedPets.map((id) => adminApi.rejectPet(id, rejectReason))
      );
      toast.success(`Rejected ${selectedPets.length} pets`);
      setSelectedPets([]);
      setRejectReason("");
      setShowRejectModal(false);
      fetchPets();
    } catch {
      toast.error("Failed to reject some pets");
    }
  };

  const togglePetSelection = (petId: string) => {
    setSelectedPets((prev) =>
      prev.includes(petId)
        ? prev.filter((id) => id !== petId)
        : [...prev, petId]
    );
  };

  const selectAllPets = () => {
    const allPetIds = pets.map((pet) => pet.id);
    setSelectedPets(allPetIds);
  };

  const clearSelection = () => {
    setSelectedPets([]);
  };

  const openModal = (type: string, pet?: AdminPet) => {
    setModalType(type);
    setSelectedPet(pet || null);
    setShowModal(true);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "approved":
        return "success";
      case "pending":
        return "warning";
      case "rejected":
        return "danger";
      default:
        return "default";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="h-4 w-4" />;
      case "pending":
        return <AlertTriangle className="h-4 w-4" />;
      case "rejected":
        return <XCircle className="h-4 w-4" />;
      default:
        return <PawPrint className="h-4 w-4" />;
    }
  };

  const getAdoptionStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "adoptable":
        return "success";
      case "pending":
        return "warning";
      case "adopted":
        return "default";
      default:
        return "default";
    }
  };

  const getAdoptionStatusIcon = (status: string) => {
    switch (status) {
      case "adoptable":
        return <PawPrint className="h-4 w-4" />;
      case "pending":
        return <AlertTriangle className="h-4 w-4" />;
      case "adopted":
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <PawPrint className="h-4 w-4" />;
    }
  };

  const isLoading = loading || externalLoading;

  // Pagination calculations
  const totalPages = total > 0 ? Math.ceil(total / pageSize) : undefined;
  const startItem = (page - 1) * pageSize + 1;
  const endItem =
    total > 0 ? Math.min(page * pageSize, total) : page * pageSize;

  return (
    <div className="space-y-6">
      {/* Unified Filter Bar */}
      <div className="bg-card text-card-foreground border rounded-lg p-4">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
          {/* Search */}
          <div className="relative w-full lg:w-80">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search pets..."
              value={searchTerm}
              onChange={(e) => {
                setPage(1);
                setSearchTerm(e.target.value);
              }}
              className="pl-10"
            />
          </div>

          {/* Type Filter */}
          <Select
            value={typeFilter}
            onValueChange={(v) => {
              setPage(1);
              setTypeFilter(v);
            }}
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="dog">Dog</SelectItem>
              <SelectItem value="cat">Cat</SelectItem>
              <SelectItem value="bird">Bird</SelectItem>
              <SelectItem value="rabbit">Rabbit</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Sticky Action Bar */}
      {selectedPets.length > 0 && (
        <div className="sticky top-0 z-50 bg-card text-card-foreground border-b border-gray-200 dark:border-gray-700 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-foreground">
                {selectedPets.length} pet{selectedPets.length !== 1 ? "s" : ""}{" "}
                selected
              </span>
              <Button variant="outline" size="sm" onClick={clearSelection}>
                Clear Selection
              </Button>
            </div>
            <div className="flex gap-2">
              <Button
                variant="accent-green"
                size="sm"
                onClick={handleBulkApprove}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Approve All
              </Button>
              <Button
                variant="accent-pink"
                size="sm"
                onClick={() => {
                  setRejectScope("bulk");
                  setShowRejectModal(true);
                }}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reject All
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Pets Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Pet Management</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner />
            </div>
          ) : (
            <div className="w-full" data-loading={isLoading}>
              <table className="w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      <input
                        type="checkbox"
                        checked={
                          selectedPets.length === pets.length && pets.length > 0
                        }
                        onChange={
                          selectedPets.length === pets.length
                            ? clearSelection
                            : selectAllPets
                        }
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        aria-label="Select all results"
                        title="Select all results"
                      />
                    </th>
                    <th
                      scope="col"
                      className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      <button
                        onClick={() => handleSort("name")}
                        className="flex items-center gap-1 hover:text-gray-700"
                      >
                        Pet
                        {sortField === "name" &&
                          (sortOrder === "asc" ? (
                            <ChevronUp className="h-3 w-3" />
                          ) : (
                            <ChevronDown className="h-3 w-3" />
                          ))}
                      </button>
                    </th>
                    <th
                      scope="col"
                      className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Type & Breed
                    </th>
                    <th
                      scope="col"
                      className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Shelter
                    </th>
                    <th
                      scope="col"
                      className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      <button
                        onClick={() => handleSort("moderationStatus")}
                        className="flex items-center gap-1 hover:text-gray-700"
                      >
                        Moderation Status
                        {sortField === "moderationStatus" &&
                          (sortOrder === "asc" ? (
                            <ChevronUp className="h-3 w-3" />
                          ) : (
                            <ChevronDown className="h-3 w-3" />
                          ))}
                      </button>
                    </th>
                    <th
                      scope="col"
                      className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      <button
                        onClick={() => handleSort("adoptionStatus")}
                        className="flex items-center gap-1 hover:text-gray-700"
                      >
                        Adoption Status
                        {sortField === "adoptionStatus" &&
                          (sortOrder === "asc" ? (
                            <ChevronUp className="h-3 w-3" />
                          ) : (
                            <ChevronDown className="h-3 w-3" />
                          ))}
                      </button>
                    </th>
                    <th
                      scope="col"
                      className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      <button
                        onClick={() => handleSort("createdAt")}
                        className="flex items-center gap-1 hover:text-gray-700"
                      >
                        Created
                        {sortField === "createdAt" &&
                          (sortOrder === "asc" ? (
                            <ChevronUp className="h-3 w-3" />
                          ) : (
                            <ChevronDown className="h-3 w-3" />
                          ))}
                      </button>
                    </th>
                    <th
                      scope="col"
                      className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {Array.isArray(pets) &&
                    pets.map((pet) => (
                      <tr key={pet.id || pet._id}>
                        <td className="px-2 sm:px-4 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedPets.includes(pet.id)}
                            onChange={() => togglePetSelection(pet.id)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            aria-label={`Select ${pet.name}`}
                            title={`Select ${pet.name}`}
                          />
                        </td>
                        <td className="px-2 sm:px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                              <PawPrint className="h-4 w-4 text-blue-600" />
                            </div>
                            <div className="ml-2 sm:ml-3 min-w-0">
                              <div className="text-sm font-medium text-gray-900 truncate">
                                {pet.name}
                              </div>
                              <div className="text-xs text-gray-500">
                                {pet.age}y • {pet.gender}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-2 sm:px-4 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 capitalize truncate">
                            {pet.type}
                          </div>
                          <div className="text-xs text-gray-500 truncate">
                            {pet.breed}
                          </div>
                        </td>
                        <td className="px-2 sm:px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <User className="h-3 w-3 text-gray-400 mr-1 sm:mr-2 flex-shrink-0" />
                            <div className="text-sm text-gray-900 truncate">
                              {pet.shelter?.name || "Unknown"}
                            </div>
                          </div>
                        </td>
                        <td className="px-2 sm:px-4 py-4 whitespace-nowrap">
                          <Badge
                            variant={getStatusBadgeVariant(
                              pet.moderationStatus
                            )}
                          >
                            <div className="flex items-center">
                              {getStatusIcon(pet.moderationStatus)}
                              <span className="ml-1 capitalize">
                                {pet.moderationStatus}
                              </span>
                            </div>
                          </Badge>
                          {pet.isFlagged && (
                            <div className="mt-1">
                              <Badge variant="danger" size="sm">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Flagged
                              </Badge>
                            </div>
                          )}
                        </td>
                        <td className="px-2 sm:px-4 py-4 whitespace-nowrap">
                          <Badge
                            variant={getAdoptionStatusBadgeVariant(
                              pet.adoptionStatus
                            )}
                          >
                            <div className="flex items-center">
                              {getAdoptionStatusIcon(pet.adoptionStatus)}
                              <span className="ml-1 capitalize">
                                {pet.adoptionStatus}
                              </span>
                            </div>
                          </Badge>
                        </td>
                        <td className="px-2 sm:px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1 sm:mr-2 flex-shrink-0" />
                            <span className="text-xs sm:text-sm">
                              {formatDisplayDate(pet.createdAt)}
                            </span>
                          </div>
                        </td>
                        <td className="px-2 sm:px-4 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-1 sm:space-x-2">
                            <Tooltip>
                              <TooltipTrigger>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 w-8 p-0 sm:h-9 sm:w-9"
                                  onClick={() => openModal("view", pet)}
                                >
                                  <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>View Pet Details</TooltipContent>
                            </Tooltip>

                            <Tooltip>
                              <TooltipTrigger>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 w-8 p-0 sm:h-9 sm:w-9"
                                  onClick={() => openModal("edit", pet)}
                                >
                                  <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Edit Pet</TooltipContent>
                            </Tooltip>

                            {pet.moderationStatus === "pending" && (
                              <Tooltip>
                                <TooltipTrigger>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 w-8 p-0 sm:h-9 sm:w-9"
                                    onClick={() => {
                                      setSelectedPet(pet);
                                      setRejectScope("single");
                                      setShowRejectModal(true);
                                    }}
                                  >
                                    <XCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Reject Pet</TooltipContent>
                              </Tooltip>
                            )}

                            <Tooltip>
                              <TooltipTrigger>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 w-8 p-0 sm:h-9 sm:w-9"
                                  onClick={() => handleDeletePet(pet.id)}
                                >
                                  <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Delete Pet</TooltipContent>
                            </Tooltip>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
              {Array.isArray(pets) && pets.length === 0 && (
                <div className="text-center py-12">
                  <PawPrint className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No pets found</p>
                </div>
              )}

              {/* Pagination Footer */}
              {pets.length > 0 && (
                <div className="flex items-center justify-between px-2 sm:px-6 py-4 border-t bg-muted/50">
                  <div className="flex items-center gap-4">
                    <div className="text-sm text-muted-foreground">
                      Showing {startItem}–{endItem}
                      {total > 0 && <> of {total}</>} pets
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        Show:
                      </span>
                      <Select
                        value={String(pageSize)}
                        onValueChange={(v) => {
                          setPageSize(+v);
                          setPage(1);
                        }}
                      >
                        <SelectTrigger className="w-20 h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="10">10</SelectItem>
                          <SelectItem value="20">20</SelectItem>
                          <SelectItem value="50">50</SelectItem>
                          <SelectItem value="100">100</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    {totalPages ? (
                      <div className="flex items-center gap-1">
                        {Array.from(
                          { length: Math.min(5, totalPages) },
                          (_, i) => {
                            const pageNum =
                              Math.max(1, Math.min(totalPages - 4, page - 2)) +
                              i;
                            return pageNum <= totalPages ? (
                              <Button
                                key={pageNum}
                                variant={
                                  pageNum === page ? "primary" : "outline"
                                }
                                size="sm"
                                onClick={() => setPage(pageNum)}
                                className="w-8 h-8 p-0"
                              >
                                {pageNum}
                              </Button>
                            ) : null;
                          }
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground px-2">
                        …
                      </span>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => p + 1)}
                      disabled={!hasNext}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pet Details Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent
          className="
            max-w-2xl z-[60]
            bg-white text-gray-900
            border border-gray-200
            sm:rounded-xl
          "
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PawPrint className="h-5 w-5 text-blue-600" />
              {modalType === "view" ? "Pet Details" : "Edit Pet"}
            </DialogTitle>
          </DialogHeader>
          {selectedPet && (
            <div className="space-y-4">
              {/* Image Thumbnails */}
              {selectedPet.images && selectedPet.images.length > 0 && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-600">
                    Images
                  </label>
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {selectedPet.images.slice(0, 4).map((image, index) => (
                      <div
                        key={index}
                        className="flex-shrink-0 cursor-pointer group"
                        onClick={() => {
                          setSelectedImageIndex(index);
                          setShowImageModal(true);
                        }}
                      >
                        <img
                          src={image}
                          alt={`${selectedPet.name} image ${index + 1}`}
                          className="h-16 w-16 rounded-lg object-cover border border-gray-200 hover:border-blue-300 transition-colors group-hover:shadow-md"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="pet-name"
                    className="block text-sm font-medium text-gray-600 mb-1"
                  >
                    Name
                  </label>
                  <Input
                    id="pet-name"
                    value={selectedPet.name}
                    readOnly={modalType === "view"}
                    onChange={
                      modalType === "view"
                        ? undefined
                        : (e) =>
                            setSelectedPet((p) =>
                              p ? { ...p, name: e.target.value } : p
                            )
                    }
                    aria-label="Pet name"
                  />
                </div>
                <div>
                  <label
                    htmlFor="pet-type"
                    className="block text-sm font-medium text-gray-600 mb-1"
                  >
                    Type
                  </label>
                  <Input
                    id="pet-type"
                    value={selectedPet.type}
                    readOnly={modalType === "view"}
                    onChange={
                      modalType === "view"
                        ? undefined
                        : (e) =>
                            setSelectedPet((p) =>
                              p ? { ...p, type: e.target.value } : p
                            )
                    }
                    aria-label="Pet type"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="pet-breed"
                    className="block text-sm font-medium text-gray-600 mb-1"
                  >
                    Breed
                  </label>
                  <Input
                    id="pet-breed"
                    value={selectedPet.breed}
                    readOnly={modalType === "view"}
                    onChange={
                      modalType === "view"
                        ? undefined
                        : (e) =>
                            setSelectedPet((p) =>
                              p ? { ...p, breed: e.target.value } : p
                            )
                    }
                    aria-label="Pet breed"
                  />
                </div>
                <div>
                  <label
                    htmlFor="pet-age"
                    className="block text-sm font-medium text-gray-600 mb-1"
                  >
                    Age
                  </label>
                  <Input
                    id="pet-age"
                    type="number"
                    value={selectedPet.age?.toString() ?? ""}
                    readOnly={modalType === "view"}
                    onChange={
                      modalType === "view"
                        ? undefined
                        : (e) =>
                            setSelectedPet((p) =>
                              p
                                ? {
                                    ...p,
                                    age: Number.isFinite(+e.target.value)
                                      ? +e.target.value
                                      : p.age,
                                  }
                                : p
                            )
                    }
                    aria-label="Pet age"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="pet-moderation-status"
                    className="block text-sm font-medium text-gray-600 mb-1"
                  >
                    Moderation Status
                  </label>
                  <Select
                    value={selectedPet.moderationStatus}
                    disabled={modalType === "view"}
                    onValueChange={
                      modalType === "view"
                        ? undefined
                        : (v) =>
                            setSelectedPet((p) =>
                              p
                                ? {
                                    ...p,
                                    moderationStatus: v as ModerationStatus,
                                  }
                                : p
                            )
                    }
                  >
                    <SelectTrigger
                      id="pet-moderation-status"
                      aria-label="Pet moderation status"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label
                    htmlFor="pet-adoption-status"
                    className="block text-sm font-medium text-gray-600 mb-1"
                  >
                    Adoption Status
                  </label>
                  <Select
                    value={selectedPet.adoptionStatus}
                    disabled={modalType === "view"}
                    onValueChange={
                      modalType === "view"
                        ? undefined
                        : (v) =>
                            setSelectedPet((p) =>
                              p
                                ? { ...p, adoptionStatus: v as AdoptionStatus }
                                : p
                            )
                    }
                  >
                    <SelectTrigger
                      id="pet-adoption-status"
                      aria-label="Pet adoption status"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="adoptable">Adoptable</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="adopted">Adopted</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="pet-gender"
                    className="block text-sm font-medium text-gray-600 mb-1"
                  >
                    Gender
                  </label>
                  <Input
                    id="pet-gender"
                    value={selectedPet.gender}
                    readOnly={modalType === "view"}
                    onChange={
                      modalType === "view"
                        ? undefined
                        : (e) =>
                            setSelectedPet((p) =>
                              p ? { ...p, gender: e.target.value } : p
                            )
                    }
                    aria-label="Pet gender"
                  />
                </div>
                <div>
                  <label
                    htmlFor="pet-shelter"
                    className="block text-sm font-medium text-gray-600 mb-1"
                  >
                    Shelter
                  </label>
                  <Input
                    id="pet-shelter"
                    value={selectedPet.shelter?.name || "Unknown"}
                    disabled
                    readOnly
                    aria-label="Pet shelter"
                  />
                </div>
              </div>

              {/* Quick CTAs for Pending Pets */}
              {selectedPet.moderationStatus === "pending" &&
                modalType === "view" && (
                  <div className="flex gap-3 pt-4 border-t border-gray-200">
                    <Button
                      variant="accent-green"
                      onClick={() => handleApprovePet(selectedPet.id)}
                      className="flex-1"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve Pet
                    </Button>
                    <Button
                      variant="accent-pink"
                      onClick={() => {
                        setRejectScope("single");
                        setShowRejectModal(true);
                        setShowModal(false);
                      }}
                      className="flex-1"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject Pet
                    </Button>
                  </div>
                )}
              {modalType !== "view" && (
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowModal(false)}>
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    disabled={isUpdating}
                    isLoading={isUpdating}
                    onClick={async () => {
                      setIsUpdating(true);
                      try {
                        await handleUpdatePet(selectedPet!.id, {
                          name: selectedPet!.name,
                          type: selectedPet!.type,
                          breed: selectedPet!.breed,
                          age: selectedPet!.age,
                          gender: selectedPet!.gender,
                          moderationStatus: selectedPet!.moderationStatus,
                          adoptionStatus: selectedPet!.adoptionStatus,
                        });
                        setShowModal(false);
                      } catch (error) {
                        // Error is already handled in handleUpdatePet
                        // Keep modal open so user can retry
                      } finally {
                        setIsUpdating(false);
                      }
                    }}
                  >
                    {isUpdating ? "Updating..." : "Update Pet"}
                  </Button>
                </DialogFooter>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Pet Modal */}
      <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
        <DialogContent className="bg-white text-gray-900 border border-gray-200">
          <DialogHeader>
            <DialogTitle>
              {rejectScope === "bulk" ? "Reject Selected Pets" : "Reject Pet"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Reason for Rejection
              </label>
              <textarea
                placeholder="Please provide a reason for rejecting this pet..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
              />
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason("");
                  setRejectScope("single");
                }}
              >
                Cancel
              </Button>
              <Button
                variant="accent-pink"
                onClick={() =>
                  rejectScope === "bulk"
                    ? handleBulkReject()
                    : handleRejectPet()
                }
              >
                Reject {rejectScope === "bulk" ? "Selected" : "Pet"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
      {/* Image Zoom Modal */}
      <Dialog open={showImageModal} onOpenChange={setShowImageModal}>
        <DialogContent className="max-w-4xl bg-white text-gray-900 border border-gray-200">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PawPrint className="h-5 w-5 text-blue-600" />
              {selectedPet?.name} - Image {selectedImageIndex + 1}
            </DialogTitle>
          </DialogHeader>
          {selectedPet?.images && (
            <div className="space-y-4">
              <div className="flex justify-center">
                <img
                  src={selectedPet.images[selectedImageIndex]}
                  alt={`${selectedPet.name} image ${selectedImageIndex + 1}`}
                  className="max-h-96 max-w-full rounded-lg object-contain"
                />
              </div>
              {selectedPet.images.length > 1 && (
                <div className="flex justify-center gap-2">
                  {selectedPet.images.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImageIndex(index)}
                      className={`h-12 w-12 rounded-lg border-2 transition-colors ${
                        index === selectedImageIndex
                          ? "border-blue-500"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <img
                        src={selectedPet.images[index]}
                        alt={`Thumbnail ${index + 1}`}
                        className="h-full w-full rounded-md object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PetManagement;
