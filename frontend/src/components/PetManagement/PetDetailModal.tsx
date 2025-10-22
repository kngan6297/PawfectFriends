import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { petApi } from "@/services/api";
import { petService } from "@/services/pet.service";
import { Pet } from "@/types/pet";
import { ActivityLog } from "./types";
import {
  Eye,
  Edit,
  Trash2,
  Heart,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  Calendar,
  FileText,
  Upload,
  Download,
  X,
  History,
  UserCheck,
  Activity,
  BarChart3,
  TrendingUp,
  TrendingDown,
  PieChart,
  Target,
  Award,
  Zap,
  Image,
  Camera,
  MessageSquare,
  CalendarDays,
  Clock as ClockIcon,
  MapPin,
  Phone,
  Mail,
  AlertCircle,
  Shield,
  Home,
  Baby,
  Stethoscope,
  Heart as HeartIcon,
  Zap as ZapIcon,
  Sun,
  Moon,
  Cloud,
  Wind,
  Star,
  Tag,
  Plus,
} from "lucide-react";
import { getGoodWithTypes } from "@/utils/petUtils";
import { formatDisplayDate } from "@/utils/dateUtils";

interface PetDetailModalProps {
  open: boolean;
  onClose: () => void;
  pet: Pet | null;
  modalType: string;
  onPetsChange: () => void;
}

const PetDetailModal: React.FC<PetDetailModalProps> = ({
  open,
  onClose,
  pet,
  modalType,
  onPetsChange,
}) => {
  const [loading, setLoading] = useState(false);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [selectedPhotos, setSelectedPhotos] = useState<any[]>([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Fetch activity logs when modal opens
  useEffect(() => {
    if (open && pet?._id) {
      fetchActivityLogs();
    }
  }, [open, pet?._id]);

  const fetchActivityLogs = async () => {
    try {
      const response = await petService.getPetActivityLogs(pet!._id);
      setActivityLogs(response.data.data || []);
    } catch (error) {
      console.error("Error fetching activity logs:", error);
      // Don't show error toast for activity logs as it's not critical
    }
  };

  if (!pet) return null;

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "adoptable":
        return "success";
      case "pending":
        return "warning";
      case "adopted":
        return "primary";
      case "hidden":
        return "secondary";
      case "waiting":
        return "warning";
      case "in_treatment":
        return "danger";
      case "fostered":
        return "secondary";
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
      case "bird":
        return "warning";
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

  const getHealthStatus = (pet: Pet) => {
    const conditions = [];
    if (pet.health?.medicalHistory?.length) {
      conditions.push("Medical History");
    }
    if (pet.characteristics?.length) {
      conditions.push(...pet.characteristics);
    }
    return conditions.length > 0 ? conditions.join(", ") : "Healthy";
  };

  const getFeaturedTags = (pet: Pet) => {
    const tags = [];
    if (pet.health?.medicalHistory?.length) {
      tags.push("Medical Case");
    }
    const goodWithTypes = getGoodWithTypes(pet.behavior?.goodWith);
    if (goodWithTypes.includes("children")) {
      tags.push("Good with Kids");
    }
    if (pet.behavior?.training?.includes("house-trained")) {
      tags.push("House Trained");
    }
    if (pet.health?.neutered) {
      tags.push("Neutered");
    }
    if (pet.health?.vaccinated) {
      tags.push("Vaccinated");
    }
    return tags;
  };

  const getAdoptionRequestStats = (pet: Pet) => {
    const requests = pet.adoptionRequests || [];
    // Since adoptionRequests is string[], we can't filter by status
    // For now, return basic stats
    return { pending: 0, approved: 0, rejected: 0, total: requests.length };
  };

  const handleAction = async (action: string, data?: any) => {
    try {
      setLoading(true);
      let response;

      switch (action) {
        case "delete_pet":
          const petId = pet._id || pet.id;
          if (!petId || petId === "new" || typeof petId !== "string") {
            throw new Error("Invalid pet ID for deletion");
          }
          response = await petApi.deletePet(petId);
          break;
        case "update_adoption_request":
          response = await petApi.updateAdoptionRequest(data.requestId, {
            status: data.newStatus,
          });
          break;
        default:
          throw new Error("Unknown action");
      }

      toast.success(response.data.message || "Action completed successfully");
      onPetsChange();
      onClose();
    } catch (error) {
      console.error("Action error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to perform action";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const renderPetDetails = () => (
    <div className="space-y-6">
      <div className="border-b pb-4 mb-4 last:border-b-0 last:mb-0 bg-slate-50 rounded-lg p-4">
        <div className="flex items-start space-x-4">
          <img
            src={
              pet.photos?.[0]?.url ||
              pet.photos?.[0]?.full ||
              "/placeholder-pet.jpg"
            }
            alt={pet.name}
            className="h-32 w-32 rounded-lg object-cover"
          />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">{pet.name}</h3>
            <p className="text-gray-600">{pet.breeds?.primary || pet.breed}</p>
            <div className="flex items-center space-x-2 mt-4">
              <Badge
                variant={getTypeBadgeVariant(pet.type)}
                className="text-base px-3 py-1 rounded-xl"
              >
                {pet.type}
              </Badge>
              <Badge
                variant={getStatusBadgeVariant(pet.status)}
                className="text-base px-3 py-1 rounded-xl"
              >
                {pet.status.replace("_", " ")}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="border-b pb-4 mb-4 last:border-b-0 last:mb-0 bg-zinc-50 rounded-lg p-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-base font-medium text-slate-500">
              Age & Gender
            </label>
            <p className="mt-4 text-lg font-semibold text-slate-900">
              {getAgeText(pet.age)} • {pet.gender}
            </p>
          </div>
          <div>
            <label className="block text-base font-medium text-slate-500">
              Size & Color
            </label>
            <p className="mt-4 text-lg font-semibold text-slate-900">
              {pet.size} • {pet.color}
            </p>
          </div>
          <div>
            <label className="block text-base font-medium text-slate-500">
              Views & Likes
            </label>
            <p className="mt-4 text-lg font-semibold text-slate-900">
              {pet.views || 0} views • {pet.savedBy?.length || 0} likes
            </p>
          </div>
          <div>
            <label className="block text-base font-medium text-slate-500">
              Listed Date
            </label>
            <p className="mt-4 text-lg font-semibold text-slate-900">
              {pet.createdAt
                ? formatDisplayDate(new Date(pet.createdAt))
                : "N/A"}
            </p>
          </div>
        </div>
      </div>

      {pet.description && (
        <div className="border-b pb-4 mb-4 last:border-b-0 last:mb-0 bg-slate-50 rounded-lg p-4">
          <label className="block text-base font-medium text-slate-500">
            Description
          </label>
          <p className="mt-4 text-lg font-semibold text-slate-900">
            {pet.description}
          </p>
        </div>
      )}

      <div className="border-b pb-4 mb-4 last:border-b-0 last:mb-0 bg-zinc-50 rounded-lg p-4">
        <label className="block text-base font-medium text-slate-500 mb-4">
          Health Status
        </label>
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center px-3 py-2 rounded-lg bg-gray-100 text-gray-800 text-sm font-medium">
            {getHealthStatus(pet)}
          </span>
        </div>
      </div>

      {getFeaturedTags(pet).length > 0 && (
        <div className="border-b pb-4 mb-4 last:border-b-0 last:mb-0 bg-slate-50 rounded-lg p-4">
          <label className="block text-base font-medium text-slate-500 mb-4">
            Featured Tags
          </label>
          <div className="flex flex-wrap gap-2">
            {getFeaturedTags(pet).map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center px-3 py-2 rounded-lg bg-blue-50 text-blue-700 text-sm font-medium"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderAdoptionRequests = () => {
    const stats = getAdoptionRequestStats(pet);

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between bg-slate-50 rounded-lg p-4">
          <h4 className="text-lg font-medium">
            Adoption Requests for {pet.name}
          </h4>
          <div className="flex space-x-2">
            <Badge variant="warning" className="text-base px-3 py-1 rounded-xl">
              {stats.pending} Pending
            </Badge>
            <Badge variant="success" className="text-base px-3 py-1 rounded-xl">
              {stats.approved} Approved
            </Badge>
            <Badge variant="danger" className="text-base px-3 py-1 rounded-xl">
              {stats.rejected} Rejected
            </Badge>
          </div>
        </div>

        <div className="space-y-3 max-h-96 overflow-y-auto">
          {pet.adoptionRequests && pet.adoptionRequests.length > 0 ? (
            <div className="text-center py-8 text-gray-500 bg-slate-50 rounded-lg">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>{pet.adoptionRequests.length} adoption request(s) found</p>
              <p className="text-sm">
                Detailed view not available in current format
              </p>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 bg-slate-50 rounded-lg">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No adoption requests yet for this pet</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderDocuments = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center bg-slate-50 rounded-lg p-4">
        <h4 className="text-lg font-medium">Documents for {pet.name}</h4>
        <Button
          variant="outline"
          size="sm"
          leftIcon={Upload}
          onClick={() => {
            const input = document.createElement("input");
            input.type = "file";
            input.accept = ".pdf,.doc,.docx,.jpg,.jpeg,.png";
            input.onchange = (e) => {
              const file = (e.target as HTMLInputElement).files?.[0];
              if (file) {
                toast.info("Document upload feature would be implemented here");
              }
            };
            input.click();
          }}
        >
          Upload Document
        </Button>
      </div>

      <div className="space-y-2">
        <div className="text-center py-8 text-gray-500 bg-slate-50 rounded-lg">
          <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>Document management not available in current Pet type</p>
          <p className="text-sm">Documents feature would be implemented here</p>
        </div>
      </div>
    </div>
  );

  const renderActivityHistory = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between bg-slate-50 rounded-lg p-4">
        <h4 className="text-lg font-medium">Activity History for {pet.name}</h4>
        <div className="flex items-center space-x-2">
          <Activity className="h-5 w-5 text-gray-400" />
          <span className="text-sm text-gray-500">
            {activityLogs.length} activities
          </span>
        </div>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {activityLogs.length > 0 ? (
          activityLogs.map((log, index) => (
            <div
              key={log._id}
              className={`border rounded-lg p-4 ${
                index % 2 === 0 ? "bg-slate-50" : "bg-zinc-50"
              }`}
            >
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 p-2 rounded-full bg-gray-100">
                  <Activity className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-gray-900">
                      {log.description}
                    </p>
                    <span className="text-xs text-gray-500">
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <UserCheck className="h-3 w-3" />
                    <span>{log.performedBy.name}</span>
                    <span>•</span>
                    <span>{log.performedBy.role}</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-500 bg-slate-50 rounded-lg">
            <History className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No activity history available for this pet</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderPhotoAlbum = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between bg-slate-50 rounded-lg p-4">
        <h4 className="text-lg font-medium">Photo Album for {pet.name}</h4>
        <Button
          variant="outline"
          size="sm"
          leftIcon={Upload}
          onClick={() => {
            const input = document.createElement("input");
            input.type = "file";
            input.accept = "image/*";
            input.multiple = true;
            input.onchange = (e) => {
              const files = (e.target as HTMLInputElement).files;
              if (files && files.length > 0) {
                toast.info("Photo upload feature would be implemented here");
              }
            };
            input.click();
          }}
        >
          Upload Photos
        </Button>
      </div>

      <div className="space-y-4">
        {pet.photos && pet.photos.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {pet.photos.map((photo, index) => (
              <div key={index} className="relative group">
                <img
                  src={photo.url || photo.full}
                  alt={`${pet.name} photo ${index + 1}`}
                  className="w-full h-32 object-cover rounded-lg"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all rounded-lg flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-white hover:bg-white hover:text-black"
                      onClick={() =>
                        toast.info(
                          "View full size feature would be implemented here"
                        )
                      }
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-white hover:bg-white hover:text-black"
                      onClick={() =>
                        toast.info(
                          "Delete photo feature would be implemented here"
                        )
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 bg-slate-50 rounded-lg">
            <Image className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No photos available for this pet</p>
            <p className="text-sm">Upload photos to create a photo album</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderEvaluations = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between bg-slate-50 rounded-lg p-4">
        <h4 className="text-lg font-medium">Evaluations for {pet.name}</h4>
        <Button
          variant="outline"
          size="sm"
          leftIcon={Plus}
          onClick={() =>
            toast.info("Add evaluation feature would be implemented here")
          }
        >
          Add Evaluation
        </Button>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        <div className="text-center py-8 text-gray-500 bg-slate-50 rounded-lg">
          <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>No evaluations available for this pet</p>
          <p className="text-sm">
            Evaluations feature would be implemented here
          </p>
        </div>
      </div>
    </div>
  );

  const renderAppointments = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between bg-slate-50 rounded-lg p-4">
        <h4 className="text-lg font-medium">Appointments for {pet.name}</h4>
        <Button
          variant="outline"
          size="sm"
          leftIcon={Plus}
          onClick={() =>
            toast.info("Schedule appointment feature would be implemented here")
          }
        >
          Schedule Appointment
        </Button>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        <div className="text-center py-8 text-gray-500 bg-slate-50 rounded-lg">
          <CalendarDays className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>No appointments scheduled for this pet</p>
          <p className="text-sm">
            Appointments feature would be implemented here
          </p>
        </div>
      </div>
    </div>
  );

  const renderSpecialTags = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between bg-slate-50 rounded-lg p-4">
        <h4 className="text-lg font-medium">Special Tags for {pet.name}</h4>
        <Button
          variant="outline"
          size="sm"
          leftIcon={Plus}
          onClick={() =>
            toast.info("Add special tag feature would be implemented here")
          }
        >
          Add Tag
        </Button>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        <div className="text-center py-8 text-gray-500 bg-slate-50 rounded-lg">
          <Tag className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>No special tags assigned to this pet</p>
          <p className="text-sm">
            Special tags feature would be implemented here
          </p>
        </div>
      </div>
    </div>
  );

  const renderModalContent = () => {
    switch (modalType) {
      case "view_pet":
        return renderPetDetails();
      case "adoption_requests":
        return renderAdoptionRequests();
      case "documents":
        return renderDocuments();
      case "activity_history":
        return renderActivityHistory();
      case "photo_album":
        return renderPhotoAlbum();
      case "evaluations":
        return renderEvaluations();
      case "appointments":
        return renderAppointments();
      case "special_tags":
        return renderSpecialTags();
      case "delete_pet":
        return (
          <div>
            <p className="text-sm text-gray-600">
              Are you sure you want to delete pet "{pet.name}"? This action
              cannot be undone.
            </p>
          </div>
        );
      default:
        return <div>Unknown modal type</div>;
    }
  };

  const getModalTitle = () => {
    switch (modalType) {
      case "view_pet":
        return "Pet Details";
      case "adoption_requests":
        return "Adoption Requests";
      case "documents":
        return "Manage Documents";
      case "activity_history":
        return "Activity History";
      case "photo_album":
        return "Photo Album";
      case "evaluations":
        return "Evaluations";
      case "appointments":
        return "Appointments";
      case "special_tags":
        return "Special Tags";
      case "delete_pet":
        return "Confirm Delete";
      default:
        return "Pet Management";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col rounded-2xl shadow-xl bg-white border border-secondary-200 overflow-hidden">
        {/* HEADER */}
        <DialogHeader className="sticky top-0 bg-white z-30 border-b px-6 pt-6 pb-3 rounded-t-2xl flex-shrink-0">
          <div>
            <DialogTitle>{getModalTitle()}</DialogTitle>
            <DialogDescription>
              {(() => {
                switch (modalType) {
                  case "view_pet":
                    return `Detailed information about ${pet.name}.`;
                  case "adoption_requests":
                    return `View and manage adoption requests for ${pet.name}.`;
                  case "documents":
                    return `Manage documents for ${pet.name}.`;
                  case "activity_history":
                    return `View activity history for ${pet.name}.`;
                  case "photo_album":
                    return `Manage photos and create a photo album for ${pet.name}.`;
                  case "evaluations":
                    return `View and manage evaluations for ${pet.name}.`;
                  case "appointments":
                    return `Schedule and manage appointments for ${pet.name}.`;
                  case "special_tags":
                    return `Manage special tags and attributes for ${pet.name}.`;
                  case "delete_pet":
                    return `Confirm deletion of ${pet.name}. This action cannot be undone.`;
                  default:
                    return `Pet management dialog.`;
                }
              })()}
            </DialogDescription>
          </div>
        </DialogHeader>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto px-6 py-4 min-h-0">
          {renderModalContent()}
        </div>

        {/* FOOTER */}
        <div className="sticky bottom-0 bg-white z-30 border-t px-6 pb-6 pt-4 rounded-b-2xl flex-shrink-0">
          <DialogFooter className="flex justify-end gap-3">
            <Button
              className="bg-secondary-200 text-secondary-700 border-none rounded-2xl px-6 py-2 hover:bg-secondary-300 hover:text-secondary-900 shadow-sm transition-all"
              onClick={onClose}
              disabled={loading}
            >
              Close
            </Button>
            {modalType === "delete_pet" && (
              <Button
                className="bg-primary-600 text-white rounded-2xl px-6 py-2 hover:bg-primary-700 shadow-md transition-all"
                onClick={() => handleAction("delete_pet")}
                disabled={loading}
              >
                {loading ? "Deleting..." : "Delete"}
              </Button>
            )}
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PetDetailModal;
