import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  Eye,
  Edit,
  Trash2,
  Heart,
  Eye as EyeIcon,
  Calendar,
  User,
  Star,
  Tag,
  SortAsc,
  SortDesc,
  ChevronDown,
  ChevronUp,
  Plus,
  EyeOff,
  FileText,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  History,
  Image,
  MessageSquare,
  CalendarDays,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";
import { petApi } from "@/services/api";
import { useNavigate } from "react-router-dom";
import PetRow from "./PetRow";
import PetDetailModal from "./PetDetailModal";
import PetFormModal from "./PetFormModal";
import { Pet } from "@/types/pet";
import { PetManagementMode } from "./index";
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

interface PetTableProps {
  pets: Pet[];
  mode?: PetManagementMode;
  customActions?: {
    label: string;
    action: (pet: Pet) => void;
    variant?: "primary" | "secondary" | "outline" | "danger";
    icon?: React.ReactNode;
    condition?: (pet: Pet) => boolean;
  }[];
  onCustomAction?: (action: any, pet: Pet) => void;
  loading: boolean;
}

type SortField = "name" | "views" | "createdAt" | "status";
type SortDirection = "asc" | "desc";

const PetTable: React.FC<PetTableProps> = ({
  pets,
  mode = "generic",
  customActions = [],
  onCustomAction,
  loading,
}) => {
  const navigate = useNavigate();
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [selectedPets, setSelectedPets] = useState<string[]>([]);
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("");
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingPet, setEditingPet] = useState<Pet | null>(null);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ChevronDown className="h-4 w-4 text-gray-400" />;
    }
    return sortDirection === "asc" ? (
      <ChevronUp className="h-4 w-4 text-blue-600" />
    ) : (
      <ChevronDown className="h-4 w-4 text-blue-600" />
    );
  };

  const handleBulkSelection = (petId: string) => {
    setSelectedPets((prev) =>
      prev.includes(petId)
        ? prev.filter((id) => id !== petId)
        : [...prev, petId]
    );
  };

  const handleSelectAll = () => {
    if (selectedPets.length === pets.length) {
      setSelectedPets([]);
    } else {
      setSelectedPets(
        pets
          .map((pet) => pet._id || pet.id)
          .filter((id): id is string => Boolean(id) && id !== "new")
      );
    }
  };

  const handleBulkStatusChange = async (newStatus: string) => {
    try {
      const promises = selectedPets.map((petId) =>
        petApi.updatePetStatus(petId, newStatus)
      );
      await Promise.all(promises);
      toast.success(`Updated status for ${selectedPets.length} pets`);
      setSelectedPets([]);
    } catch (error) {
      console.error("Bulk status change error:", error);
      toast.error("Failed to update some pets");
    }
  };

  const handleBulkDelete = async () => {
    if (
      window.confirm(
        `Are you sure you want to delete ${selectedPets.length} pets?`
      )
    ) {
      try {
        const promises = selectedPets.map((petId) => petApi.deletePet(petId));
        await Promise.all(promises);
        toast.success(`Deleted ${selectedPets.length} pets`);
        setSelectedPets([]);
      } catch (error) {
        console.error("Bulk delete error:", error);
        toast.error("Failed to delete some pets");
      }
    }
  };

  const openModal = (type: string, pet: Pet) => {
    setModalType(type);
    setSelectedPet(pet);
    setShowModal(true);
  };

  const openFormModal = (pet?: Pet) => {
    setEditingPet(pet || null);
    setShowFormModal(true);
  };

  const closeFormModal = () => {
    setShowFormModal(false);
    setEditingPet(null);
  };

  const handleQuickAction = async (action: string, pet: Pet) => {
    try {
      switch (action) {
        case "edit":
          openFormModal(pet);
          return;
        case "delete":
          const deletePetId = pet._id || pet.id;
          if (
            !deletePetId ||
            deletePetId === "new" ||
            typeof deletePetId !== "string"
          ) {
            toast.error("Invalid pet ID for deletion");
            return;
          }
          if (window.confirm(`Are you sure you want to delete ${pet.name}?`)) {
            await petApi.deletePet(deletePetId);
            toast.success("Pet deleted successfully");
          }
          break;
        default:
          return;
      }
    } catch (error) {
      console.error("Quick action error:", error);
      toast.error("Failed to perform action");
    }
  };

  const sortedPets = [...pets].sort((a, b) => {
    let aValue: any;
    let bValue: any;

    switch (sortField) {
      case "name":
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
        break;
      case "views":
        aValue = a.views || 0;
        bValue = b.views || 0;
        break;
      case "createdAt":
        aValue = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        bValue = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        break;
      case "status":
        aValue = a.status;
        bValue = b.status;
        break;
      default:
        return 0;
    }

    if (sortDirection === "asc") {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  // Show empty state if no pets
  if (pets.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500">
          <svg
            className="h-12 w-12 mx-auto mb-4 text-gray-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No pets found
          </h3>
          <p className="text-gray-600">No pets have been added yet</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center space-x-1">
                      <input
                        type="checkbox"
                        checked={
                          selectedPets.length === pets.length && pets.length > 0
                        }
                        onChange={handleSelectAll}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        title="Select all pets"
                        aria-label="Select all pets"
                      />
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort("name")}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Pet</span>
                      {getSortIcon("name")}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  {mode === "admin" && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Shelter
                    </th>
                  )}
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort("status")}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Status</span>
                      {getSortIcon("status")}
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort("createdAt")}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Listed</span>
                      {getSortIcon("createdAt")}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedPets.map((pet) => (
                  <PetRow
                    key={pet._id || pet.id}
                    pet={pet}
                    mode={mode}
                    customActions={customActions}
                    onCustomAction={onCustomAction}
                    isSelected={selectedPets.includes(pet._id || pet.id || "")}
                    onSelectionChange={handleBulkSelection}
                    onQuickAction={handleQuickAction}
                    onViewDetails={() => openModal("view_pet", pet)}
                    loading={loading}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedPets.length > 0 && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm text-blue-700">
              {selectedPets.length} pet{selectedPets.length !== 1 ? "s" : ""}{" "}
              selected
            </span>
            <div className="flex space-x-2">
              <Select onValueChange={(value) => handleBulkStatusChange(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="adopted">Adopted</SelectItem>
                  <SelectItem value="hidden">Hidden</SelectItem>
                  <SelectItem value="waiting">Waiting</SelectItem>
                  <SelectItem value="in_treatment">In Treatment</SelectItem>
                  <SelectItem value="fostered">Fostered</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkDelete}
                className="text-red-600 hover:text-red-700"
              >
                Delete Selected
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <PetDetailModal
        open={showModal}
        onClose={() => setShowModal(false)}
        pet={selectedPet}
        modalType={modalType}
        onPetsChange={() => {}} // This will be handled by parent
      />

      <PetFormModal
        open={showFormModal}
        onClose={closeFormModal}
        pet={editingPet}
        onPetsChange={() => {}}
      />
    </>
  );
};

export default PetTable;
