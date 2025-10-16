import React, { useState } from "react";
import { toast } from "react-toastify";
import {
  Eye,
  Edit,
  Trash2,
  Heart,
  Eye as EyeIcon,
  Users,
  Image,
  MessageSquare,
  CalendarDays,
  Tag,
  FileText,
  History,
  EyeOff,
  MoreHorizontal,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
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
import { Pet } from "@/types/pet";
import { PetManagementMode } from "./index";
import { formatDisplayDate } from "@/utils/dateUtils";

interface PetRowProps {
  pet: Pet;
  mode?: PetManagementMode;
  customActions?: {
    label: string;
    action: (pet: Pet) => void;
    variant?:
      | "primary"
      | "secondary"
      | "outline"
      | "ghost"
      | "accent-amber"
      | "accent-pink"
      | "accent-green";
    icon?: React.ReactNode;
    condition?: (pet: Pet) => boolean;
  }[];
  onCustomAction?: (action: any, pet: Pet) => void;
  isSelected: boolean;
  onSelectionChange: (petId: string) => void;
  onQuickAction: (action: string, pet: Pet) => void;
  onViewDetails: () => void;
  loading: boolean;
}

const PetRow: React.FC<PetRowProps> = ({
  pet,
  mode = "generic",
  customActions = [],
  onCustomAction,
  isSelected,
  onSelectionChange,
  onQuickAction,
  onViewDetails,
  loading,
}) => {
  const [showQuickActions, setShowQuickActions] = useState(false);

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "adoptable":
        return "success";
      case "pending":
        return "warning";
      case "adopted":
        return "primary";
      case "rejected":
        return "danger";
      case "hidden":
        return "secondary";
      case "waiting":
        return "warning";
      case "in_treatment":
        return "danger";
      case "fostered":
        return "secondary";
      case "flagged":
        return "danger";
      default:
        return "default";
    }
  };

  const getTypeBadgeVariant = (type: string) => {
    switch (type) {
      case "dog":
        return "primary";
      case "cat":
        return "secondary";
      default:
        return "default";
    }
  };

  const getAgeText = (age: string | number) => {
    if (typeof age === "number") {
      return `${age} year${age !== 1 ? "s" : ""} old`;
    }

    switch (age) {
      case "baby":
        return "Baby";
      case "young":
        return "Young";
      case "adult":
        return "Adult";
      case "senior":
        return "Senior";
      default:
        return age;
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus && newStatus !== pet.status) {
      await onQuickAction("change_status", {
        ...pet,
        status: newStatus as "adoptable" | "pending" | "adopted",
      });
    }
  };

  const handleRowClick = (e: React.MouseEvent) => {
    // Don't open modal if clicking on interactive elements
    if (
      (e.target as HTMLElement).closest(
        'button, input, select, [role="button"]'
      )
    ) {
      return;
    }
    onViewDetails();
  };

  const petId = pet._id || pet.id || "";

  return (
    <tr
      className="hover:bg-gray-50 cursor-pointer group"
      onClick={handleRowClick}
    >
      <td
        className="px-6 py-4 whitespace-nowrap"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center space-x-1">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onSelectionChange(petId)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            title={`Select ${pet.name}`}
            aria-label={`Select ${pet.name}`}
          />
        </div>
      </td>

      {/* Pet Info */}
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10">
            <img
              className="h-10 w-10 rounded-md object-cover"
              src={
                pet.photos?.[0]?.url ||
                pet.photos?.[0]?.full ||
                "/placeholder-pet.jpg"
              }
              alt={pet.name}
            />
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
              {pet.name}
            </div>
            <div className="text-sm text-gray-500">
              {pet.breeds?.primary || pet.breed || "Unknown Breed"}
            </div>
            {pet.age && (
              <div className="text-sm text-gray-500">
                {getAgeText(pet.age)} • {pet.gender}
              </div>
            )}
          </div>
        </div>
      </td>

      {/* Type */}
      <td className="px-6 py-4 whitespace-nowrap">
        <Badge variant={getTypeBadgeVariant(pet.type)}>{pet.type}</Badge>
      </td>

      {/* Shelter (Admin mode only) */}
      {mode === "admin" && (
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="text-sm text-gray-900">
            {pet.shelter?.name || "Unknown Shelter"}
          </div>
          <div className="text-sm text-gray-500">
            {pet.shelter?.contact?.email || "No email"}
          </div>
        </td>
      )}

      {/* Status */}
      <td className="px-6 py-4 whitespace-nowrap">
        <Badge variant={getStatusBadgeVariant(pet.status)}>
          {pet.status.replace("_", " ")}
        </Badge>
      </td>

      {/* Listed Date */}
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {pet.createdAt ? formatDisplayDate(new Date(pet.createdAt)) : "N/A"}
      </td>

      {/* Actions */}
      <td
        className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-end space-x-2">
          {/* View Details */}
          <Button
            variant="outline"
            size="sm"
            onClick={onViewDetails}
            title="View Details"
          >
            <Eye className="h-4 w-4" />
          </Button>

          {/* Custom Actions */}
          {customActions.map((action, index) => {
            // Check if action should be shown based on condition
            if (action.condition && !action.condition(pet)) {
              return null;
            }

            return (
              <Button
                key={index}
                variant={action.variant || "primary"}
                size="sm"
                onClick={() => onCustomAction?.(action, pet)}
                disabled={loading}
                title={action.label}
              >
                {action.icon || action.label}
              </Button>
            );
          })}

          {/* Edit Action */}
          {(mode === "shelter" || mode === "admin") && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onQuickAction("edit", pet)}
              title="Edit Pet"
              disabled={loading}
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}

          {/* Delete Action */}
          {(mode === "shelter" || mode === "admin") && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onQuickAction("delete", pet)}
              title="Delete Pet"
              disabled={loading}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </td>
    </tr>
  );
};

export default PetRow;
