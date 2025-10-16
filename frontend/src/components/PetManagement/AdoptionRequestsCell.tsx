import React from "react";
import { Users } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Pet } from "./types";

interface AdoptionRequestsCellProps {
  pet: Pet;
  onOpenModal: () => void;
}

const AdoptionRequestsCell: React.FC<AdoptionRequestsCellProps> = ({
  pet,
  onOpenModal,
}) => {
  const getAdoptionRequestStats = (pet: Pet) => {
    const requests = pet.adoptionRequests || [];
    const pending = requests.filter((r) => r.status === "pending").length;
    const approved = requests.filter((r) => r.status === "approved").length;
    const rejected = requests.filter((r) => r.status === "rejected").length;
    const total = requests.length;

    return { pending, approved, rejected, total };
  };

  const stats = getAdoptionRequestStats(pet);

  if (stats.total === 0) {
    return (
      <div className="text-sm text-gray-500">
        <Users className="h-4 w-4 inline mr-1" />
        No requests
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      <div className="text-sm">
        <div className="font-medium text-gray-900">{stats.total}</div>
        <div className="text-xs text-gray-500">
          {stats.pending > 0 && `${stats.pending} pending`}
        </div>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={onOpenModal}
        className="text-blue-600 hover:text-blue-700"
      >
        View
      </Button>
    </div>
  );
};

export default AdoptionRequestsCell;
