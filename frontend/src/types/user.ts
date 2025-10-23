import { Pet } from "./pet";

export type UserRole = "user" | "shelter" | "admin";

export interface Location {
  version?: string;
  province?: {
    code: number;
    name: string;
    codename?: string;
    division_type?: string;
    phone_code?: number;
  };
  district?: {
    code: number;
    name: string;
    codename?: string;
    division_type?: string;
    province_code: number;
  };
  ward?: {
    code: number;
    name: string;
    codename?: string;
    division_type?: string;
    district_code: number;
  };
  details?: {
    street?: string;
    note?: string;
  };
  postalCode?: string;
  country?: string;
  formatted?: string;
}

export interface UserPreferences {
  notifications: {
    adoptionUpdates: boolean;
    matchSuggestions: boolean;
    [key: string]: boolean;
  };
  privacy: {
    showEmail: boolean;
    showPhone: boolean;
    [key: string]: boolean;
  };
  preferences?: {
    species?: string[];
    age?: {
      min: number;
      max: number;
    };
  };
}

// Enhanced user requirements for pet matching
export interface UserRequirements {
  // Basic pet preferences
  petType?: 'dog' | 'cat' | 'bird' | 'other';
  gender?: 'male' | 'female' | 'unknown';
  size?: 'small' | 'medium' | 'large';
  age?: 'baby' | 'young' | 'adult' | 'senior';

  // Experience level
  experienceLevel?: 'first-time' | 'experienced' | 'expert';

  // Living situation
  livingSituation?: 'apartment' | 'house' | 'condo' | 'farm';

  // Lifestyle preferences
  activityLevel?: 'low' | 'medium' | 'high';

  // Time availability
  timeAvailability?: 'low' | 'medium' | 'high';

  // Budget considerations
  budgetRange?: 'low' | 'medium' | 'high';

  // Allergy considerations
  allergyFriendly?: boolean;

  // Special needs
  openToSpecialNeeds?: boolean;

  // Family considerations
  hasChildren?: boolean;
  childrenAgeRange?: {
    min: number;
    max: number;
  };

  // Other pets
  hasOtherPets?: boolean;
  otherPetTypes?: string[];

  // Training preferences
  trainingPreference?: 'none' | 'basic' | 'advanced';

  // Grooming preferences
  groomingPreference?: 'minimal' | 'moderate' | 'high';

  // Exercise preferences
  exercisePreference?: 'low' | 'medium' | 'high';

  // Social preferences
  socialPreference?: 'low' | 'medium' | 'high';

  // Independence preferences
  independencePreference?: 'low' | 'medium' | 'high';

  // Medical care preferences
  medicalCarePreference?: 'basic' | 'moderate' | 'advanced';

  // Patience level
  patienceLevel?: 'low' | 'medium' | 'high';

  // Travel frequency
  travelFrequency?: 'rarely' | 'occasionally' | 'frequently';

  // Work schedule
  workSchedule?: 'flexible' | 'part-time' | 'full-time' | 'shift-work';

  // Home environment
  homeEnvironment?: 'quiet' | 'moderate' | 'busy';

  // Yard availability
  hasYard?: boolean;
  yardSize?: 'none' | 'small' | 'medium' | 'large';

  // Climate considerations
  climate?: 'cold' | 'moderate' | 'hot' | 'variable';

  // Commitment level
  commitmentLevel?: 'short-term' | 'medium-term' | 'long-term';

  // Specific breed preferences
  preferredBreeds?: string[];

  // Deal breakers
  dealBreakers?: string[];

  // Additional notes
  additionalNotes?: string;

  // Requirements last updated
  lastUpdated?: Date;

  // Requirements completion percentage
  completionPercentage?: number;
}

export interface AdoptionRecord {
  pet: string;
  status: "pending" | "approved" | "rejected" | "completed";
  date: Date;
}

export interface User {
  _id: string;
  email: string;
  name: string;
  phone: string;
  role: UserRole;

  avatar?: string;
  bio?: string;
  location?: Location;
  preferences: UserPreferences;
  requirements?: UserRequirements; // Add requirements field
  favoritePets?: Pet[];
  viewedPets?: string[];
  adoptionHistory: AdoptionRecord[];
  emailVerified: boolean;
  googleId?: string;
  facebookId?: string;
  resetPasswordToken?: string;
  resetPasswordExpire?: Date;
  twoFactorEnabled?: boolean;
  loginNotifications?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile extends User {
  // Extend if needed in the future
}

/**
 * Utility function for getting full name
 */
export function getFullName(user: Pick<User, "name">): string {
  return user.name;
}
