// Separate status types for semantic clarity
export type ModerationStatus = "approved" | "pending" | "rejected"; // ADMIN
export type AdoptionStatus = "adoptable" | "pending" | "adopted"; // PET-LIFECYCLE

export interface Pet {
    id?: string;
    _id?: string;
    name: string;
    slug?: string;
    type: 'dog' | 'cat' | 'bird' | 'other';
    species?: string;
    breeds?: {
        primary: string;
        secondary?: string;
        mixed?: boolean;
        unknown?: boolean;
    };
    breed?: string;
    age: 'baby' | 'young' | 'adult' | 'senior';
    gender: 'male' | 'female' | 'unknown';
    size: 'small' | 'medium' | 'large';
    coat?: 'short' | 'medium' | 'long' | 'wire' | 'curly' | 'smooth' | 'rough';
    primaryColor?: string;
    secondaryColor?: string;
    description: string;
    photos: {
        _id?: string;
        id?: string;
        url: string;
        caption?: string;
        isMain?: boolean;
        full?: string;
        large?: string;
        medium?: string;
        small?: string;
    }[];
    videos?: {
        title: string;
        url: string;
        description?: string;
        duration?: number;
        thumbnail?: string;
    }[];
    // NEW: Separate status fields for semantic consistency
    moderationStatus: ModerationStatus; // ADMIN: Controls visibility/approval
    adoptionStatus: AdoptionStatus; // PET-LIFECYCLE: Controls adoption state
    // Legacy status field for backward compatibility (will be deprecated)
    status?: 'adoptable' | 'pending' | 'adopted' | 'hidden' | 'waiting' | 'in_treatment' | 'fostered' | 'flagged';
    shelter: {
        _id: string;
        name: string;
        location?: string;
        contact?: {
            email?: string;
            phone?: string;
            address?: string;
        };
    };
    attributes?: {
        houseTrained?: boolean;
        specialNeeds?: boolean;
        declawed?: boolean;
        spayedNeutered?: boolean;
        shotsCurrent?: boolean;
    };
    tags?: string[];
    health: {
        vaccinated: boolean;
        neutered: boolean;
        houseTrained?: boolean;
        medicalHistory?: {
            condition: string;
            treatment: string;
            date: Date;
        }[];
    };
    behavior: {
        goodWith?: {
            type: 'dogs' | 'cats' | 'children' | 'other';
        }[];
        goodWithChildren?: boolean;
        goodWithDogs?: boolean;
        goodWithCats?: boolean;
        activityLevel?: 'low' | 'medium' | 'high';
        training?: ('leash-trained' | 'obedience-trained')[];
    };
    adoptionFee: number;
    views: number;
    savedBy?: string[];
    adoptionRequests?: string[];
    metadata: {
        externalId: string;
        source?: string;
        organizationId?: string;
        originalUrl?: string;
        lastUpdated?: Date;
    };
    createdAt?: Date;
    updatedAt?: Date;
    isFavorite?: boolean;
    matchScore?: number;
    matchFactors?: string[];
    // Additional fields for admin management
    isFlagged?: boolean;
    flagReason?: string;
} 