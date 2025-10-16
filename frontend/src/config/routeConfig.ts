import { RouteConfig, RouteGroup } from "@/types/routes";
import { UserRole } from "@/utils/redirects";
import { createLazyComponent } from "@/components/common/SuspenseWrapper";

// Lazy load all page components for better performance
const Login = createLazyComponent(() => import("@/pages/auth/Login"));
const Register = createLazyComponent(() => import("@/pages/auth/Register"));
const ForgotPassword = createLazyComponent(() => import("@/pages/auth/ForgotPassword"));
const ResetPassword = createLazyComponent(() => import("@/pages/auth/ResetPassword"));
const VerifyEmail = createLazyComponent(() => import("@/pages/auth/VerifyEmail"));
const Home = createLazyComponent(() => import("@/pages/Home"));
const PetList = createLazyComponent(() => import("@/pages/pets/PetList"));
const PetDetailPage = createLazyComponent(() => import("@/pages/pets/PetDetail").then(m => ({ default: m.PetDetailPage })));
const Dashboard = createLazyComponent(() => import("@/pages/Dashboard"));
const AdminDashboard = createLazyComponent(() => import("@/pages/admin/AdminDashboard"));
const ShelterDashboard = createLazyComponent(() => import("@/pages/shelter/Dashboard"));
const ShelterSettings = createLazyComponent(() => import("@/pages/shelter/Settings"));
const ShelterPetManagement = createLazyComponent(() => import("@/pages/shelter/PetManagement"));
const ShelterAdoptionRequests = createLazyComponent(() => import("@/pages/shelter/AdoptionRequests"));
const AdoptionRequestDetailPage = createLazyComponent(() => import("@/pages/shelter/adoption/AdoptionRequestDetailPage"));
const ShelterReports = createLazyComponent(() => import("@/pages/shelter/Reports"));
const ShelterReviews = createLazyComponent(() => import("@/pages/shelter/Reviews"));
const ShelterScheduling = createLazyComponent(() => import("@/pages/shelter/SchedulingPage"));
const AdoptionRequests = createLazyComponent(() => import("@/pages/adoption/AdoptionRequests"));
const UserAdoptionRequestsPage = createLazyComponent(() => import("@/pages/user/adoption/UserAdoptionRequestsList"));
const UserAdoptionRequestDetailPage = createLazyComponent(() => import("@/pages/user/adoption/UserAdoptionRequestDetail"));
const EditApplicationPage = createLazyComponent(() => import("@/pages/adoption/EditApplicationPage").then(m => ({ default: m.EditApplicationPage })));
const Unauthorized = createLazyComponent(() => import("@/pages/Unauthorized"));




const DashboardProfilePage = createLazyComponent(() => import("@/pages/dashboard/ProfilePage"));
const FavoritesPage = createLazyComponent(() => import("@/pages/favorites/FavoritesPage").then(m => ({ default: m.FavoritesPage })));
const AboutPage = createLazyComponent(() => import("@/pages/AboutPage").then(m => ({ default: m.AboutPage })));
const NotFoundPage = createLazyComponent(() => import("@/pages/NotFoundPage").then(m => ({ default: m.NotFoundPage })));
const AdoptionGuide = createLazyComponent(() => import("@/pages/AdoptionGuide"));
const PetCare = createLazyComponent(() => import("@/pages/PetCare"));
const SuccessStories = createLazyComponent(() => import("@/pages/SuccessStories"));
const Partnerships = createLazyComponent(() => import("@/pages/Partnerships"));
const PrivacyPage = createLazyComponent(() => import("@/pages/PrivacyPage"));
const TermsPage = createLazyComponent(() => import("@/pages/TermsPage"));
const AccessibilityPage = createLazyComponent(() => import("@/pages/AccessibilityPage"));
const CareersPage = createLazyComponent(() => import("@/pages/CareersPage"));
const ContactPage = createLazyComponent(() => import("@/pages/ContactPage"));
const AiRecommendationsPage = createLazyComponent(() => import("@/pages/recommendations/AiRecommendationsPage").then(m => ({ default: m.AiRecommendationsPage })));
const WizardRecommendationsPage = createLazyComponent(() => import("@/pages/recommendations/WizardRecommendationsPage").then(m => ({ default: m.WizardRecommendationsPage })));
const RecommendationsLandingPage = createLazyComponent(() => import("@/pages/recommendations/RecommendationsLandingPage").then(m => ({ default: m.RecommendationsLandingPage })));
const CreatePetForm = createLazyComponent(() => import("@/pages/pets/CreatePetForm"));

/**
 * Centralized route configuration
 * This eliminates duplicate code and makes route management scalable
 */
export const routeConfig: RouteConfig = {
    // Auth routes (no protection needed)
    auth: {
        layout: "auth",
        routes: [
            { path: "/login", component: Login },
            { path: "/register", component: Register },
            { path: "/forgot-password", component: ForgotPassword },
            { path: "/reset-password/:token", component: ResetPassword },
            { path: "/reset-password", component: ResetPassword },
            { path: "/verify-email", component: VerifyEmail },
        ],
    },

    // Public routes (no protection needed)
    public: {
        layout: "main",
        routes: [
            { path: "/", component: Home },
            { path: "/pets", component: PetList },
            { path: "/pets/:petId", component: PetDetailPage },
            { path: "/about", component: AboutPage },
            { path: "/adoption-guide", component: AdoptionGuide },
            { path: "/pet-care", component: PetCare },
            { path: "/success-stories", component: SuccessStories },
            { path: "/partnerships", component: Partnerships },
            { path: "/privacy", component: PrivacyPage },
            { path: "/terms", component: TermsPage },
            { path: "/accessibility", component: AccessibilityPage },
            { path: "/careers", component: CareersPage },
            { path: "/contact", component: ContactPage },
        ],
    },

    // User routes (protected)
    user: {
        layout: "main",
        requiredRole: "user",
        routes: [
            { path: "/dashboard", component: Dashboard },
            { path: "/dashboard/profile", component: DashboardProfilePage },
            { path: "/favorites", component: FavoritesPage },
            { path: "/adoptions", component: UserAdoptionRequestsPage },
            { path: "/adoptions/:requestId", component: UserAdoptionRequestDetailPage },
            { path: "/edit-application/:requestId", component: EditApplicationPage },
        ],
    },

    // Multi-role routes (accessible by multiple user types)
    shared: {
        layout: "main",
        requiredRole: ["user", "shelter", "admin"],
        routes: [
            { path: "/recommendations", component: RecommendationsLandingPage },
            { path: "/recommendations/ai", component: AiRecommendationsPage },
            { path: "/recommendations/wizard", component: WizardRecommendationsPage },
        ],
    },

    // Shelter routes (protected)
    shelter: {
        layout: "shelter",
        requiredRole: "shelter",
        routes: [
            { path: "/shelter", component: ShelterDashboard },
            { path: "/shelter/dashboard", component: ShelterDashboard },
            { path: "/shelter/pets", component: ShelterPetManagement },
            { path: "/shelter/pets/archived", component: ShelterPetManagement },
            { path: "/shelter/adoption-requests", component: ShelterAdoptionRequests },
            { path: "/shelter/adoption-requests/:requestId", component: AdoptionRequestDetailPage },
            { path: "/shelter/scheduling", component: ShelterScheduling },
            { path: "/shelter/reports", component: ShelterReports },
            { path: "/shelter/reviews", component: ShelterReviews },
            { path: "/shelter/settings", component: ShelterSettings },
            { path: "/shelter/pets/create", component: CreatePetForm },
        ],
    },

    // Admin routes (protected)
    admin: {
        layout: "dashboard",
        requiredRole: "admin",
        routes: [
            { path: "/admin/dashboard", component: AdminDashboard },
        ],
    },

    // Standalone routes (no layout wrapper)
    standalone: {
        layout: null,
        routes: [
            { path: "/unauthorized", component: Unauthorized },
            { path: "*", component: NotFoundPage },
        ],
    },
};

/**
 * Route group definitions for different user types
 * This allows for easy role-based route filtering
 */
export const routeGroups: Record<string, RouteGroup> = {
    // Routes accessible by all authenticated users
    allAuthenticated: {
        name: "All Authenticated Users",
        roles: ["user", "shelter", "admin"],
        routeKeys: ["shared"],
    },

    // Routes accessible by shelter staff and admins
    shelterAndAdmin: {
        name: "Shelter Staff & Admins",
        roles: ["shelter", "admin"],
        routeKeys: ["shelter"],
    },

    // Routes accessible only by admins
    adminOnly: {
        name: "Administrators Only",
        roles: ["admin"],
        routeKeys: ["admin"],
    },

    // Routes accessible only by regular users
    userOnly: {
        name: "Regular Users Only",
        roles: ["user"],
        routeKeys: ["user"],
    },

    // Public routes (no authentication required)
    public: {
        name: "Public Access",
        roles: [],
        routeKeys: ["auth", "public", "standalone"],
    },
};

/**
 * Get routes for a specific user role
 */
export const getRoutesForRole = (role: UserRole | undefined): RouteConfig => {
    if (!role) {
        return {
            auth: routeConfig.auth,
            public: routeConfig.public,
            standalone: routeConfig.standalone,
        };
    }

    const filteredConfig: RouteConfig = {};

    // Always include public routes
    filteredConfig.auth = routeConfig.auth;
    filteredConfig.public = routeConfig.public;
    filteredConfig.standalone = routeConfig.standalone;

    // Add role-specific routes
    switch (role) {
        case "user":
            filteredConfig.user = routeConfig.user;
            filteredConfig.shared = routeConfig.shared;
            break;
        case "shelter":
            filteredConfig.shelter = routeConfig.shelter;
            filteredConfig.shared = routeConfig.shared;
            break;
        case "admin":
            filteredConfig.admin = routeConfig.admin;
            filteredConfig.shelter = routeConfig.shelter; // Admins can access shelter routes
            filteredConfig.shared = routeConfig.shared;
            break;
    }

    return filteredConfig;
};

/**
 * Get all routes for a user (including inherited routes)
 */
export const getAllRoutesForUser = (role: UserRole | undefined): RouteConfig => {
    const baseConfig = getRoutesForRole(role);

    // Add inherited routes based on role hierarchy
    if (role === "admin") {
        // Admins inherit all routes
        return {
            ...baseConfig,
            user: routeConfig.user, // Admins can access user routes too
        };
    }

    return baseConfig;
};
