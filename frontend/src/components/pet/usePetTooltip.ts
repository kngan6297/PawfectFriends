import { useEffect } from "react";
import { usePetTooltip } from "./PetTooltipProvider";

interface UsePetTooltipOptions {
  petId: string;
  tooltipId: string;
  content: string;
}

export const usePetTooltipRegistration = ({ petId, tooltipId, content }: UsePetTooltipOptions) => {
  const { registerTooltip, unregisterTooltip } = usePetTooltip();
  
  const fullTooltipId = `${tooltipId}-${petId}`;
  
  useEffect(() => {
    registerTooltip(fullTooltipId, content);
    
    return () => {
      unregisterTooltip(fullTooltipId);
    };
  }, [fullTooltipId, content, registerTooltip, unregisterTooltip]);
  
  return fullTooltipId;
};

// Predefined tooltip content for common pet attributes
export const PET_TOOLTIPS = {
  vaccinated: "This pet has received all necessary vaccinations for their age and species.",
  neutered: "This pet has been spayed/neutered, which helps with behavior and health.",
  houseTrained: "This pet is already house-trained and knows where to go to the bathroom.",
  matchScore: (score: number) => `This pet matched ${score}% of your preferences.`,
  matchInsights: (insights: string[]) => `Matched: ${insights.join(" + ")}`,
  imageNav: (current: number, total: number, petName: string) => 
    `Image ${current} of ${total} for ${petName || "pet"}`,
} as const; 