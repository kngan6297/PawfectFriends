import { NavigateFunction } from "react-router-dom";

export type UserRole = "user" | "shelter" | "admin";

/**
 * Centralized redirect utility for role-based navigation
 * Ensures consistent redirect behavior across the application
 */
export class RedirectManager {
    /**
     * Get the appropriate dashboard path based on user role
     */
    static getDashboardPath(role: UserRole): string {
        switch (role) {
            case "admin":
                return "/admin/dashboard";
            case "shelter":
                return "/shelter/dashboard";
            case "user":
            default:
                return "/dashboard";
        }
    }

    /**
     * Get the appropriate profile path based on user role
     */
    static getProfilePath(role: UserRole): string {
        switch (role) {
            case "admin":
                return "/admin/dashboard?tab=profile";
            case "shelter":
                return "/shelter/settings";
            case "user":
            default:
                return "/dashboard/profile";
        }
    }

    /**
     * Redirect user to appropriate page after login based on role
     */
    static redirectAfterLogin(navigate: NavigateFunction, role: UserRole): void {
        switch (role) {
            case "admin":
                navigate("/admin/dashboard", { replace: true });
                break;
            case "shelter":
                navigate("/shelter/dashboard", { replace: true });
                break;
            case "user":
            default:
                navigate("/", { replace: true });
                break;
        }
    }

    /**
     * Redirect user to appropriate page after logout
     */
    static redirectAfterLogout(navigate: NavigateFunction): void {
        navigate("/login", { replace: true });
    }

    /**
     * Redirect user to unauthorized page if they don't have required role
     */
    static redirectToUnauthorized(navigate: NavigateFunction): void {
        navigate("/unauthorized", { replace: true });
    }

    /**
     * Redirect user to login page if not authenticated
     */
    static redirectToLogin(navigate: NavigateFunction, from?: string): void {
        const state = from ? { from } : undefined;
        navigate("/login", { state, replace: true });
    }

    /**
     * Redirect user to home page
     */
    static redirectToHome(navigate: NavigateFunction): void {
        navigate("/", { replace: true });
    }

    /**
     * Check if user has access to a specific route based on role
     */
    static hasRouteAccess(userRole: UserRole, requiredRole?: UserRole): boolean {
        if (!requiredRole) return true;
        return userRole === requiredRole;
    }

    /**
     * Get fallback route for unauthorized access
     */
    static getFallbackRoute(userRole: UserRole): string {
        return this.getDashboardPath(userRole);
    }

    /**
     * Redirect to fallback route for unauthorized access
     */
    static redirectToFallback(navigate: NavigateFunction, userRole: UserRole): void {
        const fallbackRoute = this.getFallbackRoute(userRole);
        navigate(fallbackRoute, { replace: true });
    }
}

/**
 * Hook for consistent redirect behavior
 */
export const useRedirects = () => {
    return {
        redirectAfterLogin: RedirectManager.redirectAfterLogin,
        redirectAfterLogout: RedirectManager.redirectAfterLogout,
        redirectToUnauthorized: RedirectManager.redirectToUnauthorized,
        redirectToLogin: RedirectManager.redirectToLogin,
        redirectToHome: RedirectManager.redirectToHome,
        redirectToFallback: RedirectManager.redirectToFallback,
        getDashboardPath: RedirectManager.getDashboardPath,
        getProfilePath: RedirectManager.getProfilePath,
        hasRouteAccess: RedirectManager.hasRouteAccess,
    };
}; 