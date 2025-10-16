import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  PawPrint,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Archive,
  RotateCcw,
  Filter,
  Search,
  Download,
  Upload,
  CheckSquare,
  Square,
  MoreHorizontal,
  Calendar,
  Heart,
  Users,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
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
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { api } from "@/services/api";
import { Pet } from "@/types/pet";

interface EnhancedPetManagementProps {
  shelterId: string;
}

const EnhancedPetManagement: React.FC<EnhancedPetManagementProps> = ({
  shelterId,
}) => {
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPets, setSelectedPets] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    type: "",
    age: "",
    gender: "",
    size: "",
  });
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showArchived, setShowArchived] = useState(false);

  useEffect(() => {
    fetchPets();
  }, [shelterId, showArchived]);

  const fetchPets = async () => {
    try {
      setLoading(true);
      const params = {
        archived: showArchived,
        ...filters,
      };
      const response = await api.get(`/api/shelters/${shelterId}/pets`, {
        params,
      });
      setPets(response.data.data || []);
    } catch (error) {
      console.error("Error fetching pets:", error);
      toast.error("Failed to fetch pets");
    } finally {
      setLoading(false);
    }
  };

  const handlePetStatusToggle = async (
    petId: string,
    currentStatus: string
  ) => {
    try {
      const newStatus = currentStatus === "adoptable" ? "hidden" : "adoptable";
      await api.patch(`/api/pets/${petId}/status`, { status: newStatus });

      setPets((prev) =>
        prev.map((pet) =>
          pet._id === petId ? { ...pet, status: newStatus } : pet
        )
      );

      toast.success(
        `Pet ${
          newStatus === "adoptable" ? "activated" : "hidden"
        } successfully!`
      );
    } catch (error) {
      console.error("Error updating pet status:", error);
      toast.error("Failed to update pet status");
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedPets.size === 0) {
      toast.warning("Please select pets to perform bulk actions");
      return;
    }

    try {
      const petIds = Array.from(selectedPets);

      switch (action) {
        case "activate":
          await api.patch(`/api/shelters/${shelterId}/pets/bulk-status`, {
            petIds,
            status: "adoptable",
          });
          setPets((prev) =>
            prev.map((pet) =>
              selectedPets.has(pet._id || "")
                ? { ...pet, status: "adoptable" }
                : pet
            )
          );
          toast.success(`${petIds.length} pets activated successfully!`);
          break;

        case "hide":
          await api.patch(`/api/shelters/${shelterId}/pets/bulk-status`, {
            petIds,
            status: "hidden",
          });
          setPets((prev) =>
            prev.map((pet) =>
              selectedPets.has(pet._id || "")
                ? { ...pet, status: "hidden" }
                : pet
            )
          );
          toast.success(`${petIds.length} pets hidden successfully!`);
          break;

        case "archive":
          await api.patch(`/api/shelters/${shelterId}/pets/bulk-archive`, {
            petIds,
            archived: true,
          });
          setPets((prev) =>
            prev.filter((pet) => !selectedPets.has(pet._id || ""))
          );
          toast.success(`${petIds.length} pets archived successfully!`);
          break;

        case "delete":
          if (
            confirm(
              `Are you sure you want to delete ${petIds.length} pets? This action cannot be undone.`
            )
          ) {
            await api.delete(`/api/shelters/${shelterId}/pets/bulk`, {
              data: { petIds },
            });
            setPets((prev) =>
              prev.filter((pet) => !selectedPets.has(pet._id || ""))
            );
            toast.success(`${petIds.length} pets deleted successfully!`);
          }
          break;
      }

      setSelectedPets(new Set());
    } catch (error) {
      console.error("Error performing bulk action:", error);
      toast.error("Failed to perform bulk action");
    }
  };

  const handleSelectAll = () => {
    if (selectedPets.size === pets.length) {
      setSelectedPets(new Set());
    } else {
      setSelectedPets(new Set(pets.map((pet) => pet._id || "")));
    }
  };

  const handleSelectPet = (petId: string) => {
    const newSelected = new Set(selectedPets);
    if (newSelected.has(petId)) {
      newSelected.delete(petId);
    } else {
      newSelected.add(petId);
    }
    setSelectedPets(newSelected);
  };

  const exportPets = async () => {
    try {
      const response = await api.get(`/api/shelters/${shelterId}/pets/export`, {
        params: filters,
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `shelter-pets-${new Date().toISOString().split("T")[0]}.csv`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();

      toast.success("Pets exported successfully!");
    } catch (error) {
      console.error("Error exporting pets:", error);
      toast.error("Failed to export pets");
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "adoptable":
        return "success";
      case "pending":
        return "warning";
      case "adopted":
        return "default";
      case "hidden":
        return "secondary";
      default:
        return "default";
    }
  };

  const filteredPets = pets.filter((pet) => {
    const matchesSearch =
      pet.name.toLowerCase().includes(filters.search.toLowerCase()) ||
      (pet.breeds?.primary || pet.breed || "")
        .toLowerCase()
        .includes(filters.search.toLowerCase());
    const matchesStatus = !filters.status || pet.status === filters.status;
    const matchesType = !filters.type || pet.type === filters.type;
    const matchesAge = !filters.age || pet.age === filters.age;
    const matchesGender = !filters.gender || pet.gender === filters.gender;
    const matchesSize = !filters.size || pet.size === filters.size;

    return (
      matchesSearch &&
      matchesStatus &&
      matchesType &&
      matchesAge &&
      matchesGender &&
      matchesSize
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Pet Management</h3>
          <p className="text-sm text-gray-600">
            Manage your shelter's pets and adoption listings
          </p>
        </div>
        <div className="flex space-x-2">
          <Button
            onClick={() => setShowArchived(!showArchived)}
            variant="outline"
            leftIcon={showArchived ? RotateCcw : Archive}
          >
            {showArchived ? "Show Active" : "Show Archived"}
          </Button>
          <Button onClick={exportPets} variant="outline" leftIcon={Download}>
            Export
          </Button>
          <Button
            leftIcon={Plus}
            onClick={() => (window.location.href = "/shelter/pets/create")}
          >
            Add New Pet
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                value={filters.search}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, search: e.target.value }))
                }
                placeholder="Search pets..."
                className="pl-10"
              />
            </div>
            <div>
              <Select
                value={filters.status}
                onValueChange={(value) =>
                  setFilters((prev) => ({ ...prev, status: value }))
                }
              >
                <SelectTrigger aria-label="Filter by status">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="adoptable">Adoptable</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="adopted">Adopted</SelectItem>
                  <SelectItem value="hidden">Hidden</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Select
                value={filters.type}
                onValueChange={(value) =>
                  setFilters((prev) => ({ ...prev, type: value }))
                }
              >
                <SelectTrigger aria-label="Filter by type">
                  <SelectValue placeholder="All Types" />
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
            <div>
              <Select
                value={filters.age}
                onValueChange={(value) =>
                  setFilters((prev) => ({ ...prev, age: value }))
                }
              >
                <SelectTrigger aria-label="Filter by age">
                  <SelectValue placeholder="All Ages" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Ages</SelectItem>
                  <SelectItem value="baby">Baby</SelectItem>
                  <SelectItem value="young">Young</SelectItem>
                  <SelectItem value="adult">Adult</SelectItem>
                  <SelectItem value="senior">Senior</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Select
                value={filters.gender}
                onValueChange={(value) =>
                  setFilters((prev) => ({ ...prev, gender: value }))
                }
              >
                <SelectTrigger aria-label="Filter by gender">
                  <SelectValue placeholder="All Genders" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Genders</SelectItem>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Select
                value={filters.size}
                onValueChange={(value) =>
                  setFilters((prev) => ({ ...prev, size: value }))
                }
              >
                <SelectTrigger aria-label="Filter by size">
                  <SelectValue placeholder="All Sizes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sizes</SelectItem>
                  <SelectItem value="small">Small</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="large">Large</SelectItem>
                  <SelectItem value="xlarge">Extra Large</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedPets.size > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium text-blue-900">
                  {selectedPets.size} pets selected
                </span>
                <Button onClick={handleSelectAll} variant="outline" size="sm">
                  Deselect All
                </Button>
              </div>
              <div className="flex space-x-2">
                <Button
                  onClick={() => handleBulkAction("activate")}
                  variant="outline"
                  size="sm"
                  leftIcon={Eye}
                >
                  Activate
                </Button>
                <Button
                  onClick={() => handleBulkAction("hide")}
                  variant="outline"
                  size="sm"
                  leftIcon={EyeOff}
                >
                  Hide
                </Button>
                <Button
                  onClick={() => handleBulkAction("archive")}
                  variant="outline"
                  size="sm"
                  leftIcon={Archive}
                >
                  Archive
                </Button>
                <Button
                  onClick={() => handleBulkAction("delete")}
                  variant="outline"
                  size="sm"
                  leftIcon={Trash2}
                >
                  Delete
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pets Grid/List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredPets.map((pet) => (
          <Card key={pet._id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-0">
              {/* Pet Image */}
              <div className="relative">
                <img
                  src={
                    pet.photos?.[0]?.url ||
                    pet.photos?.[0]?.full ||
                    "/default-pet.jpg"
                  }
                  alt={pet.name}
                  className="w-full h-48 object-cover rounded-t-lg"
                />
                <div className="absolute top-2 left-2">
                  <input
                    type="checkbox"
                    checked={selectedPets.has(pet._id || "")}
                    onChange={() => handleSelectPet(pet._id || "")}
                    className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    aria-label={`Select ${pet.name} for bulk actions`}
                  />
                </div>
                <div className="absolute top-2 right-2">
                  <Badge variant={getStatusBadgeVariant(pet.status)}>
                    {pet.status}
                  </Badge>
                </div>
              </div>

              {/* Pet Info */}
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-gray-900">{pet.name}</h4>
                  <div className="flex items-center space-x-1">
                    <Heart className="h-4 w-4 text-red-500" />
                    <span className="text-sm text-gray-500">
                      {pet.isFavorite ? 1 : 0}
                    </span>
                  </div>
                </div>

                <div className="space-y-1 mb-3">
                  <p className="text-sm text-gray-600">
                    {pet.breeds?.primary || pet.breed} • {pet.age} •{" "}
                    {pet.gender}
                  </p>
                  <p className="text-sm text-gray-600">
                    {pet.size} • {pet.shelter?.location || "Unknown location"}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between">
                  <div className="flex space-x-1">
                    <Button
                      variant="outline"
                      size="sm"
                      leftIcon={pet.status === "adoptable" ? EyeOff : Eye}
                      onClick={() =>
                        handlePetStatusToggle(pet._id || "", pet.status)
                      }
                    >
                      {pet.status === "adoptable" ? "Hide" : "Show"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      leftIcon={Edit}
                      onClick={() =>
                        (window.location.href = `/shelter/pets/${pet._id}/edit`)
                      }
                    >
                      Edit
                    </Button>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Users className="h-3 w-3 text-gray-400" />
                    <span className="text-xs text-gray-500">
                      {pet.adoptionRequests || 0}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredPets.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <PawPrint className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No pets found
            </h3>
            <p className="text-gray-500">
              {showArchived
                ? "No archived pets found."
                : "No pets match your current filters. Try adjusting your search criteria."}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EnhancedPetManagement;
