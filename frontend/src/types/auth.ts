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

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  phone: string;
  role: 'user' | 'shelter' | 'admin';
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
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

export interface RegisterResponse {
  success: boolean;
  message?: string;
  data?: {
    user: User | null;
  };
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  favoritePets: Pet[];
  favoritePetIds: string[];
  isFavoritesLoading: boolean;
  login: (emailOrPhone: string, password: string) => Promise<any>;
  register: (data: any) => Promise<any>;
  logout: () => void;
  updateUser: (data: any) => Promise<void>;
  refreshUserProfile: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, password: string, confirmPassword: string) => Promise<void>;
  verifyEmail: (token: string) => Promise<void>;
  toggleFavoritePet: (petId: string) => Promise<boolean>;
  isPetFavorited: (petId: string) => boolean;
  refreshFavoritePets: () => Promise<void>;
}

// Validation constants
export const EMAIL_REGEX = /^\S+@\S+\.\S+$/;
export const PASSWORD_MIN_LENGTH = 8;

// New consistent response structure for auth service
export interface AuthServiceResponse {
  success: boolean;
  status?: number;
  userMessage?: string;
  message?: string;
  fieldErrors?: Record<string, string>;
  data?: any;
  error?: any;
  userRole?: string; // For login responses
}
