import { Pet } from "@/types/pet";
import { formatDisplayDate } from "@/utils/dateUtils";
import { getGoodWithTypes } from "@/utils/petUtils";

// Status badge variants
export const getStatusBadgeVariant = (status: string) => {
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

// Type badge variants
export const getTypeBadgeVariant = (type: string) => {
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

// Age text formatting
export const getAgeText = (age: string | number) => {
    if (typeof age === 'number') {
        return `${age} year${age !== 1 ? 's' : ''} old`;
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

// Age order for sorting
export const getAgeOrder = (age: string) => {
    switch (age) {
        case "baby":
            return 1;
        case "young":
            return 2;
        case "adult":
            return 3;
        case "senior":
            return 4;
        default:
            return 0;
    }
};

// Health status calculation
export const getHealthStatus = (pet: Pet) => {
    const conditions = [];
    if (pet.health?.medicalHistory?.length) {
        conditions.push("Medical History");
    }
    if (pet.characteristics?.length) {
        conditions.push(...pet.characteristics);
    }
    return conditions.length > 0 ? conditions.join(", ") : "Healthy";
};

// Featured tags extraction
export const getFeaturedTags = (pet: Pet) => {
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

// Pet photo URL helper
export const getPetPhotoUrl = (pet: Pet) => {
    return (
        pet.photos?.[0]?.url ||
        pet.photos?.[0]?.full ||
        "/placeholder-pet.jpg"
    );
};

// Pet breed display helper
export const getPetBreed = (pet: Pet) => {
    return pet.breeds?.primary || pet.breed || "Unknown Breed";
};

// Date formatting helper - now uses centralized utility
export const formatDate = formatDisplayDate;

// Status options for dropdowns
export const getStatusOptions = (currentStatus?: string) => {
    const allOptions = [
        { value: "adoptable", label: "Adoptable" },
        { value: "pending", label: "Pending" },
        { value: "adopted", label: "Adopted" },
        { value: "hidden", label: "Hidden" },
        { value: "waiting", label: "Waiting" },
        { value: "in_treatment", label: "In Treatment" },
        { value: "fostered", label: "Fostered" },
    ];

    if (currentStatus) {
        return allOptions.filter((option) => option.value !== currentStatus);
    }

    return allOptions;
}; 