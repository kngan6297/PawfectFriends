import { UserRole } from "./redirects";

/**
 * Utility functions for flexible role checking
 */
export class RoleUtils {
    /**
     * Check if user has any of the specified roles
     */
    static hasAnyRole(userRole: UserRole | undefined, allowedRoles: UserRole[]): boolean {
        if (!userRole) return false;
        return allowedRoles.includes(userRole);
    }

    /**
     * Check if user has all of the specified roles (useful for admin scenarios)
     */
    static hasAllRoles(userRole: UserRole | undefined, requiredRoles: UserRole[]): boolean {
        if (!userRole) return false;
        return requiredRoles.includes(userRole);
    }

    /**
     * Check if user is admin (highest privilege)
     */
    static isAdmin(userRole: UserRole | undefined): boolean {
        return userRole === "admin";
    }

    /**
     * Check if user is shelter or admin (shelter-level access)
     */
    static isShelterOrAdmin(userRole: UserRole | undefined): boolean {
        return userRole === "shelter" || userRole === "admin";
    }

    /**
     * Check if user is user or shelter (non-admin access)
     */
    static isUserOrShelter(userRole: UserRole | undefined): boolean {
        return userRole === "user" || userRole === "shelter";
    }

    /**
     * Check if user can access shelter features
     */
    static canAccessShelterFeatures(userRole: UserRole | undefined): boolean {
        return userRole === "shelter" || userRole === "admin";
    }

    /**
     * Check if user can access admin features
     */
    static canAccessAdminFeatures(userRole: UserRole | undefined): boolean {
        return userRole === "admin";
    }

    /**
     * Check if user can manage pets (shelter staff or admin)
     */
    static canManagePets(userRole: UserRole | undefined): boolean {
        return userRole === "shelter" || userRole === "admin";
    }

    /**
     * Check if user can view adoption requests (shelter staff or admin)
     */
    static canViewAdoptionRequests(userRole: UserRole | undefined): boolean {
        return userRole === "shelter" || userRole === "admin";
    }

    /**
     * Check if user can manage users (admin only)
     */
    static canManageUsers(userRole: UserRole | undefined): boolean {
        return userRole === "admin";
    }

    /**
     * Check if user can access chat features (any authenticated user)
     */
    static canAccessChat(userRole: UserRole | undefined): boolean {
        return userRole === "user" || userRole === "shelter" || userRole === "admin";
    }

    /**
     * Check if user can access recommendations (any authenticated user)
     */
    static canAccessRecommendations(userRole: UserRole | undefined): boolean {
        return userRole === "user" || userRole === "shelter" || userRole === "admin";
    }

    /**
     * Custom role check for complex scenarios
     */
    static createCustomRoleCheck(
        checkFunction: (userRole: UserRole | undefined) => boolean
    ): (userRole: UserRole | undefined) => boolean {
        return checkFunction;
    }

    /**
     * Role hierarchy check (admin > shelter > user)
     */
    static hasMinimumRole(userRole: UserRole | undefined, minimumRole: UserRole): boolean {
        if (!userRole) return false;

        const roleHierarchy: Record<UserRole, number> = {
            "user": 1,
            "shelter": 2,
            "admin": 3
        };

        return roleHierarchy[userRole] >= roleHierarchy[minimumRole];
    }
}
