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
  const prevAuthState = useRef({
    isAuthenticated,
    isLoading,
    userRole: user?.role,
  });

  // ✅ FIXED: Efficient debug logging that only runs when values change
  useEffect(() => {
    const currentState = { isAuthenticated, isLoading, userRole: user?.role };
    const prevState = prevAuthState.current;

    // Only log when values actually change to prevent render loops
    if (JSON.stringify(currentState) !== JSON.stringify(prevState)) {
      console.log("ProtectedRoute Debug:", {
        pathname: location.pathname,
        ...currentState,
        requiredRole,
        roleComparison: requiredRole
          ? user?.role === requiredRole
          : "no role required",
        roleType: typeof user?.role,
        requiredRoleType: typeof requiredRole,
      });
      prevAuthState.current = currentState;
    }
  }, [isAuthenticated, isLoading, user?.role, location.pathname, requiredRole]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log("User not authenticated, redirecting to login");
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
