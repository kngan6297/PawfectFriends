export interface ActivityLog {
    _id: string;
    petId: string;
    action:
    | "status_change"
    | "created"
    | "updated"
    | "deleted"
    | "visibility_toggle"
    | "document_upload"
    | "adoption_request";
    field?: string;
    oldValue?: string;
    newValue?: string;
    description: string;
    performedBy: {
        _id: string;
        name: string;
        email: string;
        role: string;
    };
    timestamp: string;
    metadata?: {
        requestId?: string;
        documentName?: string;
        reason?: string;
    };
}

export interface AdoptionRequest {
    _id: string;
    user: {
        id: string;
        name: string;
        email: string;
    };
    pet: {
        id: string;
        name: string;
    };
    status: "pending" | "approved" | "rejected" | "scheduled" | "completed";
    applicationDetails: {
        reasonForAdopting: string;
    };
    createdAt: string;
    updatedAt: string;
}

export interface Photo {
    _id?: string;
    url: string;
    caption?: string;
    isMain: boolean;
    uploadedAt: Date;
    uploadedBy: {
        _id: string;
        name: string;
        role: string;
    };
    tags?: string[];
    metadata?: {
        size: number;
        type: string;
        dimensions?: {
            width: number;
            height: number;
        };
    };
}

export interface Evaluation {
    _id: string;
    petId: string;
    adopter: {
        _id: string;
        name: string;
        email: string;
    };
    rating: number;
    comment: string;
    evaluationDate: Date;
    categories: {
        health: number;
        behavior: number;
        training: number;
        compatibility: number;
    };
    followUpRequired: boolean;
    followUpNotes?: string;
    status: "pending" | "completed" | "cancelled";
}

export interface Appointment {
    _id: string;
    petId: string;
    type: "meeting" | "health_check" | "vaccination" | "surgery" | "follow_up" | "adoption_finalization";
    title: string;
    description: string;
    scheduledDate: Date;
    duration: number; // in minutes
    location: string;
    participants: Array<{
        _id: string;
        name: string;
        role: "adopter" | "shelter_staff" | "veterinarian" | "volunteer";
        email: string;
        phone?: string;
    }>;
    status: "scheduled" | "confirmed" | "completed" | "cancelled" | "rescheduled";
    notes?: string;
    reminders: Array<{
        type: "email" | "sms" | "push";
        time: Date;
        sent: boolean;
    }>;
    createdAt: Date;
    updatedAt: Date;
}

export interface SpecialTag {
    _id: string;
    name: string;
    category: "special_needs" | "medical_case" | "environmental" | "behavioral" | "age_related" | "training" | "social";
    description: string;
    icon: string;
    color: string;
    priority: "low" | "medium" | "high" | "critical";
    requiresAttention: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface Pet {
    _id?: string;
    id?: string;
    name: string;
    type: "dog" | "cat" | "bird" | "other";
    breeds?: {
        primary: string;
        secondary?: string;
        mixed?: boolean;
        unknown?: boolean;
    };
    breed?: string;
    age: "baby" | "young" | "adult" | "senior";
    gender: "male" | "female" | "unknown";
    size: "small" | "medium" | "large";
    color: string;
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
    photoAlbum?: Photo[];
    status:
    | "adoptable"
    | "pending"
    | "adopted"
    | "hidden"
    | "waiting"
    | "in_treatment"
    | "fostered";
    views: number;
    savedBy?: string[];
    adoptionRequests?: AdoptionRequest[];
    activityLogs?: ActivityLog[];
    evaluations?: Evaluation[];
    appointments?: Appointment[];
    specialTags?: SpecialTag[];
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
    health?: {
        vaccinated: boolean;
        neutered: boolean;
        medicalHistory?: {
            condition: string;
            treatment: string;
            date: Date;
        }[];
    };
    behavior?: {
        goodWith?: {
            type: "dogs" | "cats" | "children" | "other";
        }[];
        activityLevel?: "low" | "medium" | "high";
        training?: ("house-trained" | "leash-trained" | "obedience-trained")[];
    };
    characteristics?: string[];
    documents?: {
        _id?: string;
        name: string;
        type: "vaccination" | "medical" | "registration" | "other";
        url: string;
        uploadedAt: Date;
    }[];
    createdAt?: Date;
    updatedAt?: Date;
} 