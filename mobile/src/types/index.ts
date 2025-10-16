// Auth Types
export interface LoginFormData {
    emailOrPhone: string;
    password: string;
}

export interface RegisterFormData {
    name: string;
    email: string;
    phone: string;
    password: string;
    confirmPassword: string;
}

export interface User {
    id: string;
    email: string;
    name: string;
    role: 'user' | 'shelter' | 'admin';
    emailVerified: boolean;
    avatar?: string;
    phone: string;
    bio?: string;
    createdAt?: string;
    updatedAt?: string;
    preferences?: {
        petTypes: string[];
        ageRange: {
            min: number;
            max: number;
        };
        distance: number;
    };
}

export interface AuthResponse {
    success: boolean;
    message?: string;
    data?: {
        user: User;
        token?: string;
        accessToken?: string;
    };
    fieldErrors?: Record<string, string>;
}

// Pet Types
export type PetType = 'dog' | 'cat' | 'other';
export type Species = 'all' | 'dog' | 'cat' | 'other';
export type PetAge = 'baby' | 'young' | 'adult' | 'senior';
export type PetGender = 'male' | 'female' | 'unknown';
export type PetSize = 'small' | 'medium' | 'large';
export type AdoptionStatus = 'adoptable' | 'pending' | 'adopted';

export interface Pet {
    id: string;
    name: string;
    slug?: string;
    type: PetType;
    species?: string;
    breeds?: {
        primary: string;
        secondary?: string;
        mixed?: boolean;
        unknown?: boolean;
    };
    breed?: string;
    age: PetAge;
    gender: PetGender;
    size: PetSize;
    coat?: string;
    primaryColor?: string;
    secondaryColor?: string;
    description: string;
    photos: {
        id: string;
        url: string;
        caption?: string;
        isMain?: boolean;
    }[];
    videos?: {
        title: string;
        url: string;
        description?: string;
        duration?: number;
        thumbnail?: string;
    }[];
    status: AdoptionStatus;
    shelter: {
        id: string;
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
    createdAt?: Date;
    updatedAt?: Date;
    isFavorite?: boolean;
}

// Adoption Types
export type AdoptionRequestStatus = 'pending' | 'approved' | 'scheduled' | 'completed' | 'rejected';

export interface AdoptionApplicationDetails {
    housingType: 'house' | 'apartment' | 'condo' | 'other';
    hasYard: boolean;
    yardDetails?: {
        isFenced: boolean;
        size: string;
    };
    hasOtherPets: boolean;
    otherPetsDetails?: Array<{
        type: string;
        species: string;
        age: number;
        description: string;
    }>;
    hasChildren: boolean;
    childrenAges?: number[];
    workSchedule: string;
    experience?: string;
    reasonForAdopting: string;
    plannedCareRoutine: string;
    veterinarianInfo: {
        name: string;
        contact: string;
        clinic: string;
    };
    references: Array<{
        name: string;
        relationship: string;
        phone: string;
        email: string;
        yearsKnown: number;
    }>;
}

export interface AdoptionRequest {
    id: string;
    user: string;
    pet: string;
    shelter: string;
    status: AdoptionRequestStatus;
    applicationDetails: AdoptionApplicationDetails;
    notes?: Array<{
        content: string;
        author: string;
        isInternal: boolean;
        timestamp: Date;
    }>;
    timeline?: Array<{
        status: string;
        date: Date;
        note?: string;
    }>;
    meetings?: Array<{
        id: string;
        type: 'phone_call' | 'text_message' | 'facebook_chat' | 'zalo_chat' | 'in_person';
        scheduledDate: Date;
        status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';
        notes?: string;
        location: string;
    }>;
    createdAt: Date;
    updatedAt: Date;
    // Populated fields
    userDetails?: User;
    petDetails?: Pet;
    shelterDetails?: {
        id: string;
        name: string;
        email: string;
    };
}

// API Response Types
export interface ApiResponse<T = any> {
    success: boolean;
    message?: string;
    data?: T;
    error?: string;
    fieldErrors?: Record<string, string>;
}

export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
    };
}

// Navigation Types
export type RootStackParamList = {
    '(tabs)': undefined;
    '(auth)': undefined;
    'pet/[id]': { id: string };
    'adoption/[id]': { id: string };
    'profile/edit': undefined;
};

export type AuthStackParamList = {
    login: undefined;
    register: undefined;
    'forgot-password': undefined;
    'reset-password': { token: string };
    'verify-email': { token: string };
};

export type TabsParamList = {
    home: undefined;
    search: undefined;
    favorites: undefined;
    adoptions: undefined;
    profile: undefined;
};
