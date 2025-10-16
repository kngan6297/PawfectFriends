import React from "react";
import { Badge } from "@/components/ui/Badge";
import { Pet } from "@/types/pet";
import { usePetTooltipRegistration, PET_TOOLTIPS } from "./usePetTooltip";

interface PetHealthBadgesProps {
  pet: Pet;
  className?: string;
}

export const PetHealthBadges: React.FC<PetHealthBadgesProps> = ({
  pet,
  className = "",
}) => {
  const petId = (pet._id || pet.id) as string;

  // Register tooltips
  const vaccinatedTooltipId = usePetTooltipRegistration({
    petId,
    tooltipId: "vaccinated",
    content: PET_TOOLTIPS.vaccinated,
  });

  const neuteredTooltipId = usePetTooltipRegistration({
    petId,
    tooltipId: "neutered",
    content: PET_TOOLTIPS.neutered,
  });

  const houseTrainedTooltipId = usePetTooltipRegistration({
    petId,
    tooltipId: "house-trained",
    content: PET_TOOLTIPS.houseTrained,
  });

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {pet.health?.vaccinated && (
        <Badge
          key="vaccinated"
          variant="accent-blue"
          size="sm"
          data-tooltip-id={vaccinatedTooltipId}
        >
          Vaccinated
        </Badge>
      )}
      {pet.health?.neutered && (
        <Badge
          key="neutered"
          variant="accent-purple"
          size="sm"
          data-tooltip-id={neuteredTooltipId}
        >
          Neutered
        </Badge>
      )}
      {pet.behavior?.training?.includes("house-trained") && (
        <Badge
          key="house-trained"
          variant="accent-green"
          size="sm"
          data-tooltip-id={houseTrainedTooltipId}
        >
          House Trained
        </Badge>
      )}
    </div>
  );
};
