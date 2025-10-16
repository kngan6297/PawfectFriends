import { Pet } from "@/types";

/**
 * Get the appropriate color for a status (success/error)
 */
export const getStatusColor = (value: boolean, colors: any) => {
    return value ? colors.success : colors.error;
};

/**
 * Get formatted age text from age string
 */
export const getAgeText = (age: string): string => {
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

/**
 * Get gender icon name from gender string
 */
export const getGenderIcon = (gender: string): "male" | "female" | "help" => {
    return gender === "male" ? "male" : gender === "female" ? "female" : "help";
};

/**
 * Get formatted shelter address from pet data
 */
export const getShelterAddress = (pet: Pet): string | null => {
    if (!pet.shelter.location) return null;

    if (typeof pet.shelter.location === "string") {
        return pet.shelter.location;
    }

    // Handle formatted location object
    const location = pet.shelter.location as any;
    if (location.formatted) {
        return location.formatted;
    }

    // Build address from components
    const parts = [];
    if (location.street) parts.push(location.street);
    if (location.city) parts.push(location.city);
    if (location.state) parts.push(location.state);
    if (location.zipCode) parts.push(location.zipCode);

    return parts.length > 0 ? parts.join(", ") : "Location not available";
};

/**
 * Create share message for pet
 */
export const createShareMessage = (pet: Pet): string => {
    const location = getShelterAddress(pet);
    const shortDescription = pet.description
        ? pet.description.length > 100
            ? pet.description.substring(0, 100) + "..."
            : pet.description
        : "A wonderful pet looking for a loving home";

    return `🐾 Meet ${pet.name}!

${pet.breed ? `Breed: ${pet.breed}` : ""}
${location ? `Location: ${location}` : ""}

${shortDescription}

Find more pets like ${pet.name} on PawfectFriends! 🐕🐱`;
};

/**
 * Get pet chips data for display
 */
export const getPetChips = (pet: Pet, colors: any) => {
    return [
        {
            icon: "male" as const,
            label: "Gender",
            value: pet.gender,
            color: colors.textSecondary,
        },
        {
            icon: "time" as const,
            label: "Age",
            value: getAgeText(pet.age),
            color: colors.textSecondary,
        },
        {
            icon: "resize-outline" as const,
            label: "Size",
            value: pet.size,
            color: colors.textSecondary,
        },
        {
            icon: "paw" as const,
            label: "Breed",
            value: pet.breed,
            color: colors.textSecondary,
        },
        {
            icon: "color-filter-outline" as const,
            label: "Color",
            value: (pet as any).color || "Unknown",
            color: colors.textSecondary,
        },
        {
            icon: "checkmark-circle" as const,
            label: "Vaccinated",
            value: pet.health?.vaccinated,
            color: getStatusColor(pet.health?.vaccinated || false, colors),
        },
        {
            icon: "medical" as const,
            label: "Neutered",
            value: pet.health?.neutered,
            color: getStatusColor(pet.health?.neutered || false, colors),
        },
        {
            icon: "home" as const,
            label: "House Trained",
            value: pet.health?.houseTrained,
            color: getStatusColor(pet.health?.houseTrained || false, colors),
        },
        {
            icon: "people" as const,
            label: "Good with Kids",
            value: pet.behavior?.goodWithChildren,
            color: getStatusColor(pet.behavior?.goodWithChildren || false, colors),
        },
        {
            icon: "paw" as const,
            label: "Good with Dogs",
            value: pet.behavior?.goodWithDogs,
            color: getStatusColor(pet.behavior?.goodWithDogs || false, colors),
        },
        {
            icon: "paw" as const,
            label: "Good with Cats",
            value: pet.behavior?.goodWithCats,
            color: getStatusColor(pet.behavior?.goodWithCats || false, colors),
        },
    ];
};

/**
 * Get health items data for Section component
 */
export const getHealthItems = (pet: Pet) => {
    return [
        {
            label: "Vaccinated",
            value: pet.health?.vaccinated,
            icon: "medical-outline" as const,
        },
        {
            label: "Neutered/Spayed",
            value: pet.health?.neutered,
            icon: "cut-outline" as const,
        },
        {
            label: "House Trained",
            value: pet.health?.houseTrained,
            icon: "home-outline" as const,
        },
    ];
};

/**
 * Get behavior items data for Section component
 */
export const getBehaviorItems = (pet: Pet) => {
    return [
        {
            label: "Good with Children",
            value: pet.behavior?.goodWithChildren,
            icon: "people-outline" as const,
        },
        {
            label: "Good with Dogs",
            value: pet.behavior?.goodWithDogs,
            icon: "paw-outline" as const,
        },
        {
            label: "Good with Cats",
            value: pet.behavior?.goodWithCats,
            icon: "paw-outline" as const,
        },
    ];
};
