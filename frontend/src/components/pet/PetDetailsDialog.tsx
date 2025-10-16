import React from "react";
import { Info, Camera } from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/Dialog";
import { Pet } from "@/types/pet";
import { getGoodWithTypesString } from "@/utils/petUtils";

interface PetDetailsDialogProps {
  pet: Pet;
  className?: string;
}

// Simple Pet Image Placeholder Component
const PetImagePlaceholder: React.FC<{
  petName: string;
  petType: string;
  size?: "sm" | "md" | "lg";
}> = ({ petName, petType, size = "md" }) => {
  const getPetIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "dog":
        return "🐕";
      case "cat":
        return "🐱";
      case "rabbit":
        return "🐰";
      case "bird":
        return "🐦";
      default:
        return "🐾";
    }
  };

  const sizeClasses = {
    sm: "w-20 h-20",
    md: "w-32 h-32",
    lg: "w-48 h-48",
  };

  return (
    <div
      className={`${sizeClasses[size]} bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex flex-col items-center justify-center`}
    >
      <div className="text-2xl mb-1">{getPetIcon(petType)}</div>
      <div className="text-gray-500 text-xs text-center px-2">
        <Camera className="w-4 h-4 mx-auto mb-1 text-gray-400" />
        <p className="font-medium text-gray-600 text-xs">{petName}</p>
        <p className="text-xs text-gray-400">Photo coming soon</p>
      </div>
    </div>
  );
};

export const PetDetailsDialog: React.FC<PetDetailsDialogProps> = ({
  pet,
  className = "",
}) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className={`w-full ${className}`}>
          <Info className="w-4 h-4 mr-2" />
          View Full Details
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{pet.name}'s Complete Profile</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <PetImagePlaceholder
              petName={pet.name}
              petType={pet.type}
              size="sm"
            />
            <div>
              <h3 className="font-medium text-gray-900">{pet.name}</h3>
              <p className="text-sm text-gray-600">
                {pet.breeds?.primary || "Unknown Breed"} • {pet.age}
              </p>
            </div>
          </div>
          <p className="text-sm text-gray-600">{pet.description}</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">Health Information</h4>
              <ul className="text-sm space-y-1">
                <li>Vaccinated: {pet.health?.vaccinated ? "Yes" : "No"}</li>
                <li>Spayed/Neutered: {pet.health?.neutered ? "Yes" : "No"}</li>
                <li>
                  Health Status:{" "}
                  {pet.health?.medicalHistory?.length
                    ? "Has Medical History"
                    : "Healthy"}
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Behavior & Training</h4>
              <ul className="text-sm space-y-1">
                <li>
                  Good with: {getGoodWithTypesString(pet.behavior?.goodWith)}
                </li>
                <li>
                  Activity Level:{" "}
                  {pet.behavior?.activityLevel || "Not specified"}
                </li>
                <li>
                  Training:{" "}
                  {pet.behavior?.training?.join(", ") || "Not specified"}
                </li>
              </ul>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
