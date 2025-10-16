import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Menu,
  Bell,
  Search,
  Heart,
  LogOut,
  PawPrint,
  ChevronDown,
  MessageSquare,
  LayoutDashboard,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";
import { RedirectManager, UserRole } from "@/utils/redirects";

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  // Determine if user should see full navigation or dashboard-only navigation
  const isDashboardUser =
    user && (user.role === "shelter" || user.role === "admin");

  return (
    <nav className="bg-white shadow-soft border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center">
              <img
                src="/images/3500_2_03.png"
                alt="PawfectFriends Logo"
                className="h-8 w-8 object-contain"
              />
              <span className="ml-2 text-xl font-bold text-gray-800">
                PawfectFriends
              </span>
            </Link>

            {/* Full Navigation - Only for regular users and unauthenticated users */}
            {!isDashboardUser && (
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link
                  to="/"
                  className="border-transparent text-gray-500 hover:border-blue-500 hover:text-blue-600 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors duration-200"
                >
                  Home
                </Link>
                <Link
                  to="/pets"
                  className="border-transparent text-gray-500 hover:border-blue-500 hover:text-blue-600 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors duration-200"
                >
                  Find Pets
                </Link>
                <Link
                  to="/shelters"
                  className="border-transparent text-gray-500 hover:border-blue-500 hover:text-blue-600 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors duration-200"
                >
                  Shelters
                </Link>
                <Link
                  to="/about"
                  className="border-transparent text-gray-500 hover:border-blue-500 hover:text-blue-600 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors duration-200"
                >
                  About
                </Link>
                <Link
                  to="/recommendations"
                  className="border-transparent text-gray-500 hover:border-blue-500 hover:text-blue-600 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors duration-200"
                >
                  Pet Matcher
                </Link>
                <Link
                  to="/communication"
                  className="border-transparent text-gray-500 hover:border-blue-500 hover:text-blue-600 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors duration-200"
                >
                  Communication
                </Link>
              </div>
            )}

            {/* Dashboard Navigation - For shelter and admin users */}
            {isDashboardUser && (
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link
                  to={
                    user.role === "shelter"
                      ? "/shelter/dashboard"
                      : "/admin/dashboard"
                  }
                  className="border-blue-500 text-blue-600 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  <LayoutDashboard className="h-4 w-4 mr-1" />
                  {user.role === "shelter" ? "Dashboard" : "Admin Dashboard"}
                </Link>
                {user.role === "shelter" && (
                  <>
                    <Link
                      to="/shelter/pets"
                      className="border-transparent text-gray-500 hover:border-blue-500 hover:text-blue-600 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors duration-200"
                    >
                      Pets
                    </Link>
                    <Link
                      to="/shelter/adoption-requests"
                      className="border-transparent text-gray-500 hover:border-blue-500 hover:text-blue-600 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors duration-200"
                    >
                      Adoption Requests
                    </Link>
                    <Link
                      to="/communication"
                      className="border-transparent text-gray-500 hover:border-blue-500 hover:text-blue-600 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors duration-200"
                    >
                      Communication
                    </Link>
                    <Link
                      to="/shelter/settings"
                      className="border-transparent text-gray-500 hover:border-blue-500 hover:text-blue-600 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors duration-200"
                    >
                      Settings
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            <div className="flex items-center space-x-4">
              {/* Refresh - Only on Dashboard */}
              {location.pathname === "/dashboard" && (
                <button
                  className="p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                  title="Refresh dashboard"
                  onClick={() => window.location.reload()}
                >
                  <span className="sr-only">Refresh</span>
                  <RefreshCw className="h-6 w-6" aria-hidden="true" />
                </button>
              )}

              {/* Search - Only for regular users */}
              {!isDashboardUser && (
                <button
                  className="p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                  title="Search pets"
                >
                  <span className="sr-only">Search</span>
                  <Search className="h-6 w-6" aria-hidden="true" />
                </button>
              )}

              {user && (
                <>
                  {/* User-specific features - Only for regular users */}
                  {!isDashboardUser && (
                    <>
                      <Link
                        to="/favorites"
                        className="p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                        title="View favorites"
                      >
                        <span className="sr-only">Favorites</span>
                        <Heart className="h-6 w-6" aria-hidden="true" />
                      </Link>
                    </>
                  )}

                  <NotificationCenter />

                  <div className="relative">
                    <button
                      type="button"
                      className="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                      id="user-menu-button"
                      aria-expanded="false"
                      onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                    >
                      <span className="sr-only">Open user menu</span>
                      {user.avatar ? (
                        <img
                          className="h-8 w-8 rounded-full"
                          src={user.avatar}
                          alt="User avatar"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-blue-500 text-white flex items-center justify-center">
                          {user?.name ? user.name.charAt(0).toUpperCase() : "?"}
                        </div>
                      )}
                      <ChevronDown className="ml-1 h-4 w-4 text-gray-400" />
                    </button>

                    {isProfileMenuOpen && (
                      <div
                        className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-medium py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10"
                        role="menu"
                        aria-orientation="vertical"
                        aria-labelledby="user-menu-button"
                      >
                        <Link
                          to={RedirectManager.getDashboardPath(
                            user.role as UserRole
                          )}
                          className="block px-4 py-2 text-sm text-gray-800 hover:bg-gray-100 transition-colors duration-200"
                          role="menuitem"
                          onClick={() => setIsProfileMenuOpen(false)}
                        >
                          {user.role === "shelter"
                            ? "Shelter Dashboard"
                            : user.role === "admin"
                            ? "Admin Dashboard"
                            : "Dashboard"}
                        </Link>

                        {/* Profile link - Only for regular users */}
                        {!isDashboardUser && (
                          <Link
                            to={RedirectManager.getProfilePath(
                              user.role as UserRole
                            )}
                            className="block px-4 py-2 text-sm text-gray-800 hover:bg-gray-100 transition-colors duration-200"
                            role="menuitem"
                            onClick={() => setIsProfileMenuOpen(false)}
                          >
                            Profile Settings
                          </Link>
                        )}

                        {/* Shelter-specific menu items */}
                        {user.role === "shelter" && (
                          <>
                            <Link
                              to="/shelter/settings"
                              className="block px-4 py-2 text-sm text-gray-800 hover:bg-gray-100 transition-colors duration-200"
                              role="menuitem"
                              onClick={() => setIsProfileMenuOpen(false)}
                            >
                              Settings
                            </Link>
                          </>
                        )}

                        <button
                          className="w-full text-left block px-4 py-2 text-sm text-gray-800 hover:bg-gray-100 transition-colors duration-200"
                          role="menuitem"
                          onClick={() => {
                            logout();
                            setIsProfileMenuOpen(false);
                            navigate("/login");
                          }}
                        >
                          <div className="flex items-center">
                            <LogOut className="mr-2 h-4 w-4" />
                            Sign out
                          </div>
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}

              {!user && (
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate("/login")}
                  >
                    Log in
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => navigate("/register")}
                  >
                    Sign up
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="-mr-2 flex items-center sm:hidden">
            <button
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              aria-expanded="false"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <span className="sr-only">Open main menu</span>
              <Menu className="block h-6 w-6" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <div className="sm:hidden">
          <div className="pt-2 pb-3 space-y-1">
            {/* Mobile navigation - Different for dashboard users */}
            {!isDashboardUser ? (
              <>
                <Link
                  to="/"
                  className="bg-blue-50 border-blue-500 text-blue-700 block pl-3 pr-4 py-2 border-l-4 text-base font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Home
                </Link>
                <Link
                  to="/pets"
                  className="border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700 block pl-3 pr-4 py-2 border-l-4 text-base font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Find Pets
                </Link>
                <Link
                  to="/about"
                  className="border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700 block pl-3 pr-4 py-2 border-l-4 text-base font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  About
                </Link>
                {user && (
                  <Link
                    to="/chat"
                    className="border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700 block pl-3 pr-4 py-2 border-l-4 text-base font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Messages
                  </Link>
                )}
              </>
            ) : (
              <>
                <Link
                  to={
                    user.role === "shelter"
                      ? "/shelter/dashboard"
                      : "/admin/dashboard"
                  }
                  className="bg-blue-50 border-blue-500 text-blue-700 block pl-3 pr-4 py-2 border-l-4 text-base font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {user.role === "shelter"
                    ? "Shelter Dashboard"
                    : "Admin Dashboard"}
                </Link>
                {user.role === "shelter" && (
                  <>
                    <Link
                      to="/shelter/settings"
                      className="border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700 block pl-3 pr-4 py-2 border-l-4 text-base font-medium"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Settings
                    </Link>
                  </>
                )}
              </>
            )}
          </div>

          {user ? (
            <div className="pt-4 pb-3 border-t border-gray-200">
              <div className="flex items-center px-4">
                <div className="flex-shrink-0">
                  {user.avatar ? (
                    <img
                      className="h-10 w-10 rounded-full"
                      src={user.avatar}
                      alt="User avatar"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-blue-500 text-white flex items-center justify-center">
                      {user?.name ? user.name.charAt(0).toUpperCase() : "?"}
                    </div>
                  )}
                </div>
                <div className="ml-3">
                  <div className="text-base font-medium text-gray-800">
                    {user.name}
                  </div>
                  <div className="text-sm font-medium text-gray-500">
                    {user.email}
                  </div>
                </div>
              </div>
              <div className="mt-3 space-y-1">
                <Link
                  to={RedirectManager.getDashboardPath(user.role as UserRole)}
                  className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {user.role === "shelter"
                    ? "Shelter Dashboard"
                    : user.role === "admin"
                    ? "Admin Dashboard"
                    : "Dashboard"}
                </Link>
                {!isDashboardUser && (
                  <Link
                    to={RedirectManager.getProfilePath(user.role as UserRole)}
                    className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Profile Settings
                  </Link>
                )}
                <button
                  className="w-full text-left block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                  onClick={() => {
                    logout();
                    setIsMenuOpen(false);
                  }}
                >
                  Sign out
                </button>
              </div>
            </div>
          ) : (
            <div className="pt-4 pb-3 border-t border-gray-200">
              <div className="flex items-center justify-around px-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    navigate("/login");
                    setIsMenuOpen(false);
                  }}
                >
                  Log in
                </Button>
                <Button
                  variant="primary"
                  onClick={() => {
                    navigate("/register");
                    setIsMenuOpen(false);
                  }}
                >
                  Sign up
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
