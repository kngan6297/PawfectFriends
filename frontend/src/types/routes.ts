import { ComponentType } from "react";
import { UserRole } from "@/utils/redirects";

/**
 * Individual route definition
 */
export interface RouteDefinition {
    path: string;
    component: ComponentType<any>;
    exact?: boolean;
}

/**
 * Route group configuration
 */
export interface RouteGroupConfig {
    layout: "auth" | "main" | "shelter" | "dashboard" | null;
    requiredRole?: UserRole | UserRole[];
    customRoleCheck?: (userRole: UserRole | undefined) => boolean;
    fallbackRoute?: string;
    showUnauthorized?: boolean;
    routes: RouteDefinition[];
}

/**
 * Complete route configuration
 */
export interface RouteConfig {
    auth?: RouteGroupConfig;
    public?: RouteGroupConfig;
    user?: RouteGroupConfig;
    shared?: RouteGroupConfig;
    shelter?: RouteGroupConfig;
    admin?: RouteGroupConfig;
    standalone?: RouteGroupConfig;
    [key: string]: RouteGroupConfig | undefined;
}

/**
 * Route group for role-based filtering
 */
export interface RouteGroup {
    name: string;
    roles: UserRole[];
    routeKeys: string[];
    description?: string;
}

/**
 * Route rendering options
 */
export interface RouteRenderOptions {
    showProtectedRoutes?: boolean;
    showPublicRoutes?: boolean;
    customRoleCheck?: (userRole: UserRole | undefined) => boolean;
    fallbackRoute?: string;
    showUnauthorized?: boolean;
}

/**
 * Route metadata for navigation and breadcrumbs
 */
export interface RouteMetadata {
    title: string;
    description?: string;
    icon?: string;
    breadcrumb?: string;
    requiresAuth?: boolean;
    roles?: UserRole[];
    category?: string;
    order?: number;
}

/**
 * Extended route definition with metadata
 */
export interface ExtendedRouteDefinition extends RouteDefinition {
    metadata?: RouteMetadata;
}

/**
 * Route group with metadata
 */
export interface RouteGroupWithMetadata extends RouteGroupConfig {
    metadata?: {
        title: string;
        description?: string;
        icon?: string;
        category?: string;
    };
    routes: ExtendedRouteDefinition[];
}
