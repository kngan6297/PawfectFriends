import React from "react";
import { Route, Routes, Outlet } from "react-router-dom";
import { RouteConfig, RouteGroupConfig } from "@/types/routes";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { AuthLayout } from "@/components/layouts/AuthLayout";
import { MainLayout } from "@/components/layouts/MainLayout";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { ShelterDataProvider } from "@/context/ShelterDataContext";

interface DynamicRouteRendererProps {
  routeConfig: RouteConfig;
  userRole?: string;
}

/**
 * Dynamic route renderer that renders routes based on configuration
 * This eliminates duplicate code and makes route management scalable
 */
export const DynamicRouteRenderer: React.FC<DynamicRouteRendererProps> = ({
  routeConfig,
  userRole,
}) => {
  const { user } = useAuth();

  /**
   * Render a single route with protection if needed
   */
  const renderRoute = (routeDef: any, groupConfig: RouteGroupConfig) => {
    const { path, component: Component } = routeDef;
    const { requiredRole, customRoleCheck, fallbackRoute, showUnauthorized } =
      groupConfig;

    // If no protection needed, render directly
    if (!requiredRole && !customRoleCheck) {
      return <Route key={path} path={path} element={<Component />} />;
    }

    // Render with protection
    return (
      <Route
        key={path}
        path={path}
        element={
          <ProtectedRoute
            requiredRole={requiredRole}
            customRoleCheck={customRoleCheck}
            fallbackRoute={fallbackRoute}
            showUnauthorized={showUnauthorized}
          >
            <Component />
          </ProtectedRoute>
        }
      />
    );
  };

  /**
   * Render a group of routes with the appropriate layout
   */
  const renderRouteGroup = (
    groupKey: string,
    groupConfig: RouteGroupConfig
  ) => {
    const { layout, routes } = groupConfig;

    // Render routes without layout wrapper
    if (!layout) {
      return routes.map((routeDef) => renderRoute(routeDef, groupConfig));
    }

    // Render routes with layout wrapper
    const routeElements = routes.map((routeDef) =>
      renderRoute(routeDef, groupConfig)
    );

    switch (layout) {
      case "auth":
        return (
          <Route key={groupKey} element={<AuthLayout />}>
            {routeElements}
          </Route>
        );

      case "main":
        return (
          <Route key={groupKey} element={<MainLayout />}>
            {routeElements}
          </Route>
        );

      case "shelter":
        return (
          <Route
            key={groupKey}
            element={
              <ShelterDataProvider>
                <DashboardLayout role="shelter">
                  <Outlet />
                </DashboardLayout>
              </ShelterDataProvider>
            }
          >
            {routeElements}
          </Route>
        );

      case "dashboard":
        return (
          <Route
            key={groupKey}
            element={
              <DashboardLayout>
                <Outlet />
              </DashboardLayout>
            }
          >
            {routeElements}
          </Route>
        );

      default:
        return routeElements;
    }
  };

  /**
   * Render all route groups
   */
  const renderAllRoutes = () => {
    const routeElements: React.ReactElement[] = [];

    Object.entries(routeConfig).forEach(([groupKey, groupConfig]) => {
      if (groupConfig) {
        const elements = renderRouteGroup(groupKey, groupConfig);
        if (Array.isArray(elements)) {
          routeElements.push(...elements);
        } else {
          routeElements.push(elements);
        }
      }
    });

    return routeElements;
  };

  return <Routes>{renderAllRoutes()}</Routes>;
};

/**
 * Hook to get filtered routes based on user role
 */
export const useFilteredRoutes = (
  routeConfig: RouteConfig,
  userRole?: string
) => {
  const filteredConfig: RouteConfig = {};

  // Always include public routes
  if (routeConfig.auth) filteredConfig.auth = routeConfig.auth;
  if (routeConfig.public) filteredConfig.public = routeConfig.public;
  if (routeConfig.standalone)
    filteredConfig.standalone = routeConfig.standalone;

  // Add role-specific routes
  if (userRole) {
    switch (userRole) {
      case "user":
        if (routeConfig.user) filteredConfig.user = routeConfig.user;
        if (routeConfig.shared) filteredConfig.shared = routeConfig.shared;
        break;
      case "shelter":
        if (routeConfig.shelter) filteredConfig.shelter = routeConfig.shelter;
        if (routeConfig.shared) filteredConfig.shared = routeConfig.shared;
        break;
      case "admin":
        if (routeConfig.admin) filteredConfig.admin = routeConfig.admin;
        if (routeConfig.shelter) filteredConfig.shelter = routeConfig.shelter;
        if (routeConfig.shared) filteredConfig.shared = routeConfig.shared;
        if (routeConfig.user) filteredConfig.user = routeConfig.user; // Admins can access user routes
        break;
    }
  }

  return filteredConfig;
};

/**
 * Enhanced route renderer with role-based filtering
 */
export const EnhancedRouteRenderer: React.FC<{ routeConfig: RouteConfig }> = ({
  routeConfig,
}) => {
  const { user } = useAuth();
  const userRole = user?.role;
  const filteredConfig = useFilteredRoutes(routeConfig, userRole);

  return (
    <DynamicRouteRenderer routeConfig={filteredConfig} userRole={userRole} />
  );
};
