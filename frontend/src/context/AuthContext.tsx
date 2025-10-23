import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  ReactNode,
  useCallback,
} from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { handleApiError } from "@/utils/error-handler";
import { normalizePhoneNumber, isPhoneNumber } from "@/utils/phone-formatter";
import { User } from "@/types/user";
import { AuthServiceResponse } from "@/types/auth";
import { useNavigate } from "react-router-dom";
import { authApi, userApi } from "@/services/api";
import { RedirectManager, UserRole } from "@/utils/redirects";
import { useToastContext } from "@/components/ui/ToastProvider";
import { Pet } from "@/types/pet";
import { authService } from "@/services/auth.service";
import { requestDeduplication } from "../services/requestDeduplication";

// Helper function to check if token is about to expire (within 5 minutes)
const isTokenExpiringSoon = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const expirationTime = payload.exp * 1000; // Convert to milliseconds
    const currentTime = Date.now();
    const fiveMinutes = 5 * 60 * 1000; // 5 minutes in milliseconds

    return expirationTime - currentTime < fiveMinutes;
  } catch (error) {
    console.error("Error parsing token:", error);
    return true; // Assume token is expired if we can't parse it
  }
};

// Create axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Flag to prevent multiple refresh attempts
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });

  failedQueue = [];
};

// Add request interceptor to automatically add token
api.interceptors.request.use(
  async (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      // Check if token is expiring soon and refresh if needed
      if (isTokenExpiringSoon(token)) {
        try {
          const response = await axios.post(
            `${
              import.meta.env.VITE_API_URL || "http://localhost:5000"
            }/api/auth/refresh-token`,
            {},
            { withCredentials: true }
          );

          if (response.data.success) {
            const { accessToken } = response.data.data;
            localStorage.setItem("token", accessToken);
            api.defaults.headers.common[
              "Authorization"
            ] = `Bearer ${accessToken}`;
            config.headers.Authorization = `Bearer ${accessToken}`;
            return config;
          }
        } catch (error) {
          console.error(
            "Failed to refresh token in request interceptor:",
            error
          );
          // Continue with the original token
        }
      }

      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle token-related errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Attempt to refresh the token
        const response = await axios.post(
          `${
            import.meta.env.VITE_API_URL || "http://localhost:5000"
          }/api/auth/refresh-token`,
          {},
          { withCredentials: true }
        );

        if (response.data.success) {
          const { accessToken } = response.data.data;

          // Update stored token
          localStorage.setItem("token", accessToken);
          api.defaults.headers.common[
            "Authorization"
          ] = `Bearer ${accessToken}`;

          // Update the original request
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;

          processQueue(null, accessToken);
          return api(originalRequest);
        } else {
          throw new Error("Token refresh failed");
        }
      } catch (refreshError) {
        processQueue(refreshError, null);

        // Clear auth state and redirect to login
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        // Note: navigate is not available in this scope, so we'll handle redirect in the component
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  favoritePets: Pet[];
  favoritePetIds: string[];
  isFavoritesLoading: boolean;
  login: (
    emailOrPhone: string,
    password: string
  ) => Promise<AuthServiceResponse>;
  register: (data: any) => Promise<AuthServiceResponse>;
  logout: () => void;
  updateUser: (data: any) => Promise<void>;
  refreshUserProfile: (force?: boolean) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (
    token: string,
    password: string,
    confirmPassword: string
  ) => Promise<void>;
  verifyEmail: (token: string) => Promise<void>;
  toggleFavoritePet: (petId: string) => Promise<boolean>;
  isPetFavorited: (petId: string) => boolean;
  refreshFavoritePets: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
export { AuthContext };

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setAuthenticated] = useState(false);
  const [favoritePets, setFavoritePets] = useState<Pet[]>([]);
  const [favoritePetIds, setFavoritePetIds] = useState<string[]>([]);
  const [isFavoritesLoading, setIsFavoritesLoading] = useState(false);
  const hasLoadedUser = useRef(false);
  const hasLoadedFavorites = useRef(false);
  const isRefreshingProfile = useRef(false);
  const profileRefreshAttempts = useRef(0);
  const MAX_PROFILE_REFRESH_ATTEMPTS = 2;
  const navigate = useNavigate();
  const { showToast } = useToastContext();

  // Helper function to set auth token
  const setAuthToken = (token: string | null) => {
    if (token) {
      localStorage.setItem("token", token);
      localStorage.setItem("wasAuthenticated", "true"); // Mark as authenticated
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    } else {
      localStorage.removeItem("token");
      localStorage.removeItem("wasAuthenticated"); // Clear authenticated flag
      delete api.defaults.headers.common["Authorization"];
    }
  };

  // Handle authentication state changes and redirects
  useEffect(() => {
    if (!isAuthenticated && !isLoading && hasLoadedUser.current) {
      // User is not authenticated and not loading, and we've finished initialization
      // Only redirect to login if we're not in the middle of handling a backend reset
      const isHandlingBackendReset =
        localStorage.getItem("handlingBackendReset") === "true";
      if (!isHandlingBackendReset) {
        RedirectManager.redirectToLogin(navigate);
      }
    }
  }, [isAuthenticated, isLoading, navigate]);

  // Initialize auth state from localStorage - only run once on mount
  useEffect(() => {
    const initializeAuth = async () => {
      // Prevent multiple initializations
      if (hasLoadedUser.current) {
        return;
      }

      const storedToken = localStorage.getItem("token");
      const storedUser = localStorage.getItem("user");

      if (storedToken && storedUser) {
        try {
          const user = JSON.parse(storedUser);
          setToken(storedToken);
          setUser(user);
          setAuthToken(storedToken);

          // Validate token against backend
          try {
            // Use a simple API call to check if user is authenticated
            const key = requestDeduplication.generateKey(
              "GET",
              "/api/users/profile"
            );
            const response = await requestDeduplication.execute(key, () =>
              api.get("/api/users/profile")
            );
            if (response.data.success) {
              setAuthenticated(true);
            } else {
              throw new Error("Token validation failed");
            }
          } catch (validationError) {
            // Set flag to prevent login redirect during backend reset handling
            localStorage.setItem("handlingBackendReset", "true");
            // Clear auth state
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            localStorage.removeItem("wasAuthenticated"); // Clear authenticated flag
            setToken(null);
            setUser(null);
            setAuthToken(null);
            setAuthenticated(false);
            hasLoadedUser.current = true;
            setIsLoading(false);
            // Don't redirect - just clear auth state and let the component handle the redirect
            // The redirect will be handled by the useEffect that watches isAuthenticated
            // Clear the flag after a short delay
            setTimeout(() => {
              localStorage.removeItem("handlingBackendReset");
            }, 1000);
            return;
          }

          // Only fetch fresh profile if stored data is incomplete
          if (!hasLoadedUser.current && !isProfileComplete(user)) {
            try {
              await refreshUserProfile(true); // Force refresh on initialization
            } catch (profileError) {
              console.error(
                "AuthContext: Failed to fetch user profile on init:",
                profileError
              );
              // Keep the stored user data if profile fetch fails
            }
          }
          hasLoadedUser.current = true;
        } catch (error) {
          console.error("Error initializing auth state:", error);
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          setAuthenticated(false);
        }
      } else {
        setAuthenticated(false);
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []); // Remove navigate dependency to prevent re-initialization

  // Load favorite pets when user is authenticated (only once per authentication state)
  useEffect(() => {
    if (isAuthenticated && token && !hasLoadedFavorites.current) {
      const loadFavoritePets = async () => {
        try {
          setIsFavoritesLoading(true);
          setAuthToken(token); // Ensure token is set before making request

          const key = requestDeduplication.generateKey(
            "GET",
            "/api/users/favorite-pets"
          );
          const response = await requestDeduplication.execute(key, () =>
            api.get("/api/users/favorite-pets")
          );

          // Handle the correct response structure: { success: true, data: [...] }
          if (response.data.success && Array.isArray(response.data.data)) {
            const pets = response.data.data;
            const petIds = pets.map((pet: Pet) => String(pet._id || pet.id));

            setFavoritePets(pets);
            setFavoritePetIds(petIds);
            hasLoadedFavorites.current = true;
          } else {
            setFavoritePets([]);
            setFavoritePetIds([]);
            hasLoadedFavorites.current = true;
          }
        } catch (error: any) {
          console.error("Failed to load favorite pets:", error);
          if (error.response?.status === 401) {
            // If unauthorized, clear auth state
            setToken(null);
            setUser(null);
            setAuthToken(null);
            localStorage.removeItem("user");
            setAuthenticated(false);
            // Don't redirect here - let the component-level redirect logic handle it
          }
          setFavoritePets([]);
          setFavoritePetIds([]);
          hasLoadedFavorites.current = true;
        } finally {
          setIsFavoritesLoading(false);
        }
      };
      loadFavoritePets();
    } else if (!isAuthenticated) {
      setFavoritePets([]);
      setFavoritePetIds([]);
      setIsFavoritesLoading(false);
      hasLoadedFavorites.current = false;
    }
  }, [isAuthenticated, token]); // Remove navigate dependency to prevent loops

  const refreshFavoritePets = async () => {
    if (!token || !isAuthenticated) {
      setFavoritePets([]);
      setFavoritePetIds([]);
      return;
    }

    try {
      setIsFavoritesLoading(true);
      setAuthToken(token);

      const key = requestDeduplication.generateKey(
        "GET",
        "/api/users/favorite-pets"
      );
      const response = await requestDeduplication.execute(key, () =>
        api.get("/api/users/favorite-pets")
      );

      if (response.data.success && Array.isArray(response.data.data)) {
        const pets = response.data.data;
        const petIds = pets.map((pet: Pet) => String(pet._id || pet.id));

        setFavoritePets(pets);
        setFavoritePetIds(petIds);
      } else {
        setFavoritePets([]);
        setFavoritePetIds([]);
      }
    } catch (error: any) {
      console.error("Failed to refresh favorite pets:", error);
      if (error.response?.status === 401) {
        logout();
      }
      setFavoritePets([]);
      setFavoritePetIds([]);
    } finally {
      setIsFavoritesLoading(false);
    }
  };

  /**
   * Login function - handles authentication logic only
   * Returns result object - does NOT show toasts or throw errors
   * Let the component decide what UI feedback to display
   */
  const login = async (
    emailOrPhone: string,
    password: string
  ): Promise<any> => {
    try {
      let loginValue = emailOrPhone;

      // Normalize if it is phone number, keep email as is
      if (isPhoneNumber(emailOrPhone)) {
        loginValue = normalizePhoneNumber(emailOrPhone);
      }

      // Use the auth service instead of direct API call
      const result = await authService.login({
        emailOrPhone: loginValue,
        password,
      });

      if (result.success && result.data) {
        const { accessToken, user } = result.data;

        // Update auth state
        setToken(accessToken);
        setAuthToken(accessToken); // This will also set localStorage

        // Fetch complete user profile
        try {
          const profileResponse = await userApi.getProfile();

          if (profileResponse?.data) {
            // Preserve the role from login response, merge other profile data
            const completeUser = {
              ...profileResponse.data,
              role: user.role, // Ensure role from login is preserved
              _id: user._id, // Preserve ID from login
            };
            setUser(completeUser);
            localStorage.setItem("user", JSON.stringify(completeUser));
            setAuthenticated(true);
          } else {
            setUser(user);
            localStorage.setItem("user", JSON.stringify(user));
            setAuthenticated(true);
          }
        } catch (profileError) {
          console.error(
            "AuthContext: Failed to fetch user profile:",
            profileError
          );
          setUser(user);
          localStorage.setItem("user", JSON.stringify(user));
          setAuthenticated(true);
        }

        // Reset favorites loading flag to trigger loading
        hasLoadedFavorites.current = false;

        // Note: No toast here - let the component decide what to display

        // Return the user role for immediate navigation
        return {
          success: true,
          data: { accessToken, user },
          userRole: user.role,
        };
      } else {
        // Handle unsuccessful login - don't throw, just return the result
        // Note: No toast here - let the component decide what to display

        return {
          success: false,
          userMessage: result.userMessage || result.message || "Login failed.",
          message: result.message || "Login failed.",
          status: result.status,
          fieldErrors: result.fieldErrors,
        };
      }
    } catch (error: any) {
      // This should rarely happen now since authService handles most errors
      console.error("Unexpected error in login:", error);

      const message = handleApiError(error, "Login failed. Please try again.");
      // Note: No toast here - let the component decide what to display

      return {
        success: false,
        userMessage: message,
        message: message,
        error: error,
      };
    }
  };

  const register = async (data: any): Promise<any> => {
    try {
      // Use the auth service instead of direct API call
      const result = await authService.register({
        ...data,
        phone: normalizePhoneNumber(data.phone),
      });

      // Return the result directly - let the component handle success/error states
      return result;
    } catch (error: any) {
      // This should rarely happen now since authService handles most errors
      console.error("Unexpected error in register:", error);

      return {
        success: false,
        userMessage:
          "An unexpected error occurred during registration. Please try again.",
        message: "Registration failed. Please try again.",
        error: error,
      };
    }
  };

  const logout = useCallback(async () => {
    try {
      // Call the logout endpoint to invalidate the refresh token
      await api.post("/api/auth/logout");
    } catch (error) {
      console.error("Logout error:", error);
      // Continue with logout even if the API call fails
    } finally {
      // Clear local state regardless of API response
      setToken(null);
      setUser(null);
      setAuthToken(null); // This will also clear localStorage
      localStorage.removeItem("user");
      localStorage.removeItem("wasAuthenticated"); // Clear authenticated flag
      setAuthenticated(false);
      hasLoadedUser.current = false;
      hasLoadedFavorites.current = false;
      isRefreshingProfile.current = false;
      RedirectManager.redirectAfterLogout(navigate);
      showToast({
        type: "success",
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
    }
  }, [navigate, showToast]);

  const updateUser = async (data: any) => {
    try {
      const response = await api.put("/api/users/profile", data);
      if (response.data.success) {
        setUser(response.data.data);
        localStorage.setItem("user", JSON.stringify(response.data.data));
        showToast({
          type: "success",
          title: "Profile updated",
          description: "Your profile has been updated successfully.",
        });
      }
    } catch (error: any) {
      const message = handleApiError(error, "Update failed. Please try again.");
      showToast({
        type: "error",
        title: "Update failed",
        description: message,
      });
      throw error;
    }
  };

  // Helper function to check if user profile data is complete
  const isProfileComplete = (userData: User | null): boolean => {
    if (!userData) return false;
    return !!(userData.name && userData.email && userData._id);
  };

  const refreshUserProfile = async (force: boolean = false): Promise<void> => {
    if (!token || !isAuthenticated) {
      return;
    }

    // Prevent multiple simultaneous profile refreshes
    if (isRefreshingProfile.current) {
      console.log(
        "AuthContext: Profile refresh already in progress, skipping..."
      );
      return;
    }

    // Only refresh if we haven't exceeded max attempts or if forced
    if (
      !force &&
      profileRefreshAttempts.current >= MAX_PROFILE_REFRESH_ATTEMPTS
    ) {
      console.log("Max profile refresh attempts reached, skipping refresh");
      return;
    }

    isRefreshingProfile.current = true;
    profileRefreshAttempts.current += 1;

    try {
      const key = requestDeduplication.generateKey("GET", "/api/users/profile");
      const profileResponse = await requestDeduplication.execute(key, () =>
        userApi.getProfile()
      );

      if (profileResponse?.data) {
        const profileData = profileResponse.data?.data || profileResponse.data;
        // Preserve important fields from current user
        const currentUser = user;
        const completeUser = {
          ...profileData,
          role: currentUser?.role, // Preserve role
          _id: profileData._id || currentUser?._id, // Use profile _id if available, fallback to current user _id
        };
        setUser(completeUser);
        localStorage.setItem("user", JSON.stringify(completeUser));

        // Reset attempts on successful refresh
        profileRefreshAttempts.current = 0;
      }
    } catch (error) {
      console.error("AuthContext: Failed to refresh user profile:", error);
      throw error;
    } finally {
      isRefreshingProfile.current = false;
    }
  };

  const forgotPassword = async (email: string) => {
    try {
      const response = await api.post("/api/auth/forgot-password", { email });
      if (response.data.status === "success") {
        showToast({
          type: "success",
          title: "Reset email sent",
          description:
            "Please check your email for password reset instructions.",
        });
      }
    } catch (error: any) {
      const message = handleApiError(error, "Failed to send reset email.");
      showToast({
        type: "error",
        title: "Reset failed",
        description: message,
      });
      throw error;
    }
  };

  const resetPassword = async (
    token: string,
    password: string,
    confirmPassword: string
  ) => {
    try {
      const response = await api.post("/api/auth/reset-password", {
        token,
        password,
        confirmPassword,
      });
      if (response.data.status === "success") {
        showToast({
          type: "success",
          title: "Password reset",
          description: "Your password has been reset successfully.",
        });
        navigate("/login");
      }
    } catch (error: any) {
      const message = handleApiError(error, "Failed to reset password.");
      showToast({
        type: "error",
        title: "Reset failed",
        description: message,
      });
      throw error;
    }
  };

  const verifyEmail = async (token: string) => {
    try {
      const response = await api.get(`/api/auth/verify-email?token=${token}`);
      if (!response.data.success) {
        throw new Error(response.data.message || "Verification failed");
      }
      // Clear any pending verification data
      localStorage.removeItem("pendingVerificationEmail");
      return response.data;
    } catch (error: any) {
      // Just throw the error, let the component handle the display
      throw error;
    }
  };

  const toggleFavoritePet = async (petId: string) => {
    if (!token || !isAuthenticated) {
      showToast({
        title: "Authentication required",
        description: "Please log in to save pets",
        type: "error",
      });
      return false;
    }

    try {
      setAuthToken(token);
      const response = await api.post(`/api/users/favorite-pets/${petId}`);

      if (response.data.success) {
        const isFavorited = response.data.data.isSaved;

        if (isFavorited) {
          // Add to favorites - we need to fetch the pet details
          try {
            const petResponse = await api.get(`/api/pets/${petId}`);
            if (petResponse.data.success) {
              const newPet = petResponse.data.data;
              setFavoritePets((prev) => [...prev, newPet]);
              setFavoritePetIds((prev) => [...prev, String(petId)]);
            }
          } catch (petError) {
            console.error("Failed to fetch pet details:", petError);
            // Still add the ID even if we can't get full details
            setFavoritePetIds((prev) => [...prev, String(petId)]);
          }
        } else {
          // Remove from favorites
          setFavoritePets((prev) =>
            prev.filter((pet) => String(pet._id || pet.id) !== String(petId))
          );
          setFavoritePetIds((prev) =>
            prev.filter((id) => id !== String(petId))
          );
        }

        showToast({
          title: isFavorited
            ? "Pet added to favorites!"
            : "Pet removed from favorites!",
          description: isFavorited
            ? "The pet has been added to your favorites list."
            : "The pet has been removed from your favorites list.",
          type: "success",
        });
        return isFavorited;
      }
      return false;
    } catch (error: any) {
      console.error("Failed to toggle favorite pet:", error);
      showToast({
        title: "Update failed",
        description: "Failed to update favorites",
        type: "error",
      });
      return false;
    }
  };

  const isPetFavorited = (petId: string) =>
    favoritePetIds.includes(String(petId));

  // Helper function to proactively refresh token
  const refreshTokenIfNeeded = async (): Promise<string | null> => {
    const currentToken = localStorage.getItem("token");

    if (!currentToken) {
      return null;
    }

    if (isTokenExpiringSoon(currentToken)) {
      try {
        const response = await axios.post(
          `${
            import.meta.env.VITE_API_URL || "http://localhost:5000"
          }/api/auth/refresh-token`,
          {},
          { withCredentials: true }
        );

        if (response.data.success) {
          const { accessToken } = response.data.data;
          localStorage.setItem("token", accessToken);
          api.defaults.headers.common[
            "Authorization"
          ] = `Bearer ${accessToken}`;
          setToken(accessToken);

          return accessToken;
        }
      } catch (error) {
        console.error("Failed to refresh token:", error);
        // If refresh fails, clear auth state
        setToken(null);
        setUser(null);
        setAuthToken(null);
        localStorage.removeItem("user");
        setAuthenticated(false);
        RedirectManager.redirectToLogin(navigate);
        return null;
      }
    }

    return currentToken;
  };

  // Set up periodic token refresh (every 45 minutes) - only when authenticated
  useEffect(() => {
    if (isAuthenticated && token) {
      const interval = setInterval(async () => {
        await refreshTokenIfNeeded();
      }, 45 * 60 * 1000); // 45 minutes

      return () => clearInterval(interval);
    }
  }, [isAuthenticated, token]); // Remove navigate dependency to prevent loops

  const value = {
    user,
    token,
    isAuthenticated,
    isLoading,
    error,
    favoritePets,
    favoritePetIds,
    isFavoritesLoading,
    login,
    register,
    logout,
    updateUser,
    refreshUserProfile,
    forgotPassword,
    resetPassword,
    verifyEmail,
    toggleFavoritePet,
    isPetFavorited,
    refreshFavoritePets,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
