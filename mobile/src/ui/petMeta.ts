import { Pet } from "@/types";

/**
 * Generates a standardized meta string for pet cards
 * Format: "Breed • Age • Gender"
 */
export const metaOf = (pet: Pet): string => {
    const breed = (pet as any).breed ?? (pet as any).breeds?.primary;
    const parts = [breed, pet.age, pet.gender].filter(Boolean);
    return parts.join(" • ");
};

/**
 * Gets the appropriate icon for pet type
 */
export const getPetTypeIcon = (type: string): string => {
    switch (type) {
        case "dog":
            return "paw";
        case "cat":
            return "paw";
        case "other":
            return "paw";
        default:
            return "paw";
    }
};

/**
 * Gets the appropriate color for pet type
 */
export const getPetTypeColor = (type: string, colors: any): string => {
    switch (type) {
        case "dog":
            return colors.dog || "#8B4513";
        case "cat":
            return colors.cat || "#FFA500";
        case "other":
            return colors.other || "#9370DB";
        default:
            return colors.textSecondary;
    }
};
