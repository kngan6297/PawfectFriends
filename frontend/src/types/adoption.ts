import { Pet } from "./pet";
import { User } from "./user";
import {
    AdoptionStatus,
    TimelineStatus,
    MeetingStatus,
    MeetingType,
    DocumentStatus,
    DocumentType,
    HousingType,
    FinalDecisionStatus,
    FollowUpStatus,
    FollowUpType,
} from "../constants/adoptionStatuses";

export type AdoptionRequestStatus = AdoptionStatus;

export interface YardDetails {
    isFenced: boolean;
    size: string;
}

export interface OtherPetDetails {
    type: string;
    species: string;
    age: number;
    description: string;
}

export interface VeterinarianInfo {
    name: string;
    contact: string;
    clinic: string;
}

export interface Reference {
    name: string;
    relationship: string;
    phone?: string;
    email?: string;
    yearsKnown?: number;
}

export interface ApplicationDetails {
    housingType: HousingType;
    hasYard: boolean;
    yardDetails?: YardDetails;
    hasOtherPets: boolean;
    otherPetsDetails?: OtherPetDetails[];
    hasChildren: boolean;
    childrenAges?: number[];
    workSchedule: string;
    experience: string;
    reasonForAdopting: string;
    plannedCareRoutine: string;
    veterinarianInfo?: VeterinarianInfo;
    references: Reference[];
}

export interface Note {
    content: string;
    author: string; // User ID
    isInternal: boolean;
    timestamp: Date;
}

export interface TimelineEvent {
    status: TimelineStatus;
    date: Date;
    note?: string;
}

export interface Meeting {
    type: MeetingType;
    scheduledDate: Date;
    status: MeetingStatus;
    notes?: string;
    location?: string;
    participants: string[]; // User IDs
}

export interface Document {
    name: string;
    url: string;
    type: DocumentType;
    status: DocumentStatus;
    uploadedAt: Date;
    verifiedAt?: Date;
    verifiedBy?: string; // User ID
}

export interface FinalDecision {
    status: FinalDecisionStatus;
    date: Date;
    reason: string;
    decidedBy: string; // User ID
    conditions: string[];
}

export interface FollowUp {
    scheduledDate: Date;
    completedDate?: Date;
    type: FollowUpType;
    notes?: string;
    status: FollowUpStatus;
}

export interface ContractDetails {
    status?: "drafted" | "sent" | "signed";
    title?: string;
    description?: string;
    terms?: string;
    content?: string; // Generated contract content
    generated?: boolean; // Indicates if contract is auto-generated
    uploadedAt?: string;
    sentAt?: string;
    signedAt?: string;
    file?: {
        originalName?: string;
        mimetype?: string;
        size?: number;
        url?: string;
    };
}

export interface HandoverDetails {
    method: string;
    location: string;
    notes?: string;
    completedAt?: string;
    completedBy?: string;
}

export interface Reminder {
    sentAt: Date;
    method?: string;
    by?: string;
}

export interface AdoptionRequest {
    id: string;
    user: string; // User ID
    pet: string; // Pet ID
    shelter: string; // User ID
    status: AdoptionRequestStatus;
    applicationDetails: ApplicationDetails;
    notes: Note[];
    timeline: TimelineEvent[];
    meetings: Meeting[];
    documents: Document[];
    finalDecision?: FinalDecision;
    followUp: FollowUp[];
    contractDetails?: ContractDetails;
    handoverDetails?: HandoverDetails;
    reminderSent?: boolean;
    reminders?: Reminder[];
    createdAt: Date;
    updatedAt: Date;
    // Populated fields from backend
    userDetails?: {
        _id: string;
        name: string;
        email: string;
        phone?: string;
    };
    petDetails?: {
        _id: string;
        name: string;
        photos: string[];
        type: string;
        breed: string;
        age: number | string;
        description: string;
    };
    shelterDetails?: {
        _id: string;
        name: string;
        email: string;
    };
}

export interface AdoptionRequestFilters {
    status?: AdoptionRequestStatus;
    petId?: string;
    userId?: string;
    shelterId?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
    sortBy?: 'createdAt' | 'updatedAt' | 'status';
    sortOrder?: 'asc' | 'desc';
}

export interface AdoptionRequestStats {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    completed: number;
}

export interface NotificationPreferences {
    emailNotifications: boolean;
    statusChanges: boolean;
    meetAndGreetReminders: boolean;
    adoptionUpdates: boolean;
    marketingEmails: boolean;
} 