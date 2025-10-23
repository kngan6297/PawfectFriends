import React, { useEffect, useRef } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { RedirectManager, UserRole } from "@/utils/redirects";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: "user" | "shelter" | "admin";
  allowedRoles?: ("user" | "shelter" | "admin")[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  allowedRoles,
}) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  console.log("🔍 ProtectedRoute - Component mounted");
  console.log("🔍 ProtectedRoute - Location:", location.pathname);
  console.log("🔍 ProtectedRoute - User:", user);
  console.log("🔍 ProtectedRoute - IsAuthenticated:", isAuthenticated);
  console.log("🔍 ProtectedRoute - IsLoading:", isLoading);
  console.log("🔍 ProtectedRoute - RequiredRole:", requiredRole);
  console.log("🔍 ProtectedRoute - AllowedRoles:", allowedRoles);

  const prevAuthState = useRef({
    isAuthenticated,
    isLoading,
    userRole: user?.role,
  });

  // Track auth state changes efficiently
  useEffect(() => {
    const currentState = { isAuthenticated, isLoading, userRole: user?.role };
    const prevState = prevAuthState.current;

    // Only update when values actually change to prevent render loops
    if (JSON.stringify(currentState) !== JSON.stringify(prevState)) {
      prevAuthState.current = currentState;
    }
  }, [isAuthenticated, isLoading, user?.role]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // Check role requirements
  if (requiredRole || allowedRoles) {
    const userRole = user?.role;
    let hasAccess = false;

    if (requiredRole) {
      hasAccess = userRole === requiredRole;
    } else if (allowedRoles) {
      hasAccess = allowedRoles.includes(userRole as any);
    }

    if (!hasAccess) {
      console.log(
        `Role mismatch: user role is "${
          user?.role
        }" (type: ${typeof user?.role}), required role is "${requiredRole}" (type: ${typeof requiredRole}), allowed roles: ${allowedRoles}`
      );

      // Redirect to appropriate fallback based on user's actual role
      if (user?.role) {
        const fallbackRoute = RedirectManager.getFallbackRoute(
          user.role as UserRole
        );
        return <Navigate to={fallbackRoute} replace />;
      }

      return <Navigate to="/unauthorized" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
