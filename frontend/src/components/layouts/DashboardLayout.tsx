import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import {
  BarChart3,
  PawPrint,
  FileText,
  Calendar,
  TrendingUp,
  Star,
  Settings,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  PlusCircle,
  Clock,
  CheckCircle,
  AlertTriangle,
  Users,
  Bell,
  Activity,
  LogOut,
  LayoutDashboard,
  Shield,
  Building2,
  MessageSquare,
  MessageCircle,
  Heart,
  Image,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  subItems?: NavItem[];
}

interface DashboardLayoutProps {
  children: React.ReactNode;
  role?: "shelter" | "admin" | "user";
  title?: string;
  subtitle?: string;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  role,
  title,
  subtitle,
}) => {
  const { user, logout, refreshUserProfile } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [isRefreshingProfile, setIsRefreshingProfile] = useState(false);

  // Debug user data
  console.log("DashboardLayout - User data:", user);

  // Refresh user profile if name or email is missing
  useEffect(() => {
    if (user && (!user.name || !user.email)) {
      console.log(
        "DashboardLayout - User data incomplete, refreshing profile..."
      );
      setIsRefreshingProfile(true);
      refreshUserProfile(true)
        .then(() => {
          console.log("DashboardLayout - Profile refreshed successfully");
        })
        .catch((error) => {
          console.error(
            "DashboardLayout - Failed to refresh user profile:",
            error
          );
        })
        .finally(() => {
          setIsRefreshingProfile(false);
        });
    }
  }, [user, refreshUserProfile]);

  const userRole = role || user?.role;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const toggleExpanded = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  const isActive = (path: string) => {
    return (
      location.pathname === path || location.pathname.startsWith(path + "/")
    );
  };

  const isSubItemActive = (item: NavItem) => {
    if (!item.subItems) return false;
    return item.subItems.some((subItem) => isActive(subItem.path));
  };

  // Role-based navigation configuration
  const getNavigationItems = (): NavItem[] => {
    switch (userRole) {
      case "shelter":
        return [
          {
            id: "dashboard",
            label: "Dashboard",
            icon: BarChart3,
            path: "/shelter/dashboard",
          },
          {
            id: "pets",
            label: "Manage Pets",
            icon: PawPrint,
            path: "/shelter/pets",
            subItems: [
              {
                id: "all-pets",
                label: "View All Pets",
                icon: PawPrint,
                path: "/shelter/pets",
              },
              {
                id: "archived-pets",
                label: "Archived Pets",
                icon: PawPrint,
                path: "/shelter/pets/archived",
              },
            ],
          },
          {
            id: "adoption-requests",
            label: "Adoption Requests",
            icon: FileText,
            path: "/shelter/adoption-requests",
            subItems: [
              {
                id: "all-requests",
                label: "View All Requests",
                icon: FileText,
                path: "/shelter/adoption-requests",
              },
              {
                id: "pending",
                label: "Pending Review",
                icon: Clock,
                path: "/shelter/adoption-requests?status=pending",
              },
              {
                id: "approved",
                label: "Approved",
                icon: CheckCircle,
                path: "/shelter/adoption-requests?status=approved",
              },
              {
                id: "scheduled",
                label: "Scheduled",
                icon: Calendar,
                path: "/shelter/adoption-requests?status=scheduled",
              },
              {
                id: "completed",
                label: "Completed",
                icon: CheckCircle,
                path: "/shelter/adoption-requests?status=completed",
              },
              {
                id: "rejected",
                label: "Rejected",
                icon: X,
                path: "/shelter/adoption-requests?status=rejected",
              },
            ],
          },
          {
            id: "scheduling",
            label: "Scheduling & Interviews",
            icon: Calendar,
            path: "/shelter/scheduling",
            subItems: [
              {
                id: "calendar",
                label: "Calendar View",
                icon: Calendar,
                path: "/shelter/scheduling",
              },
              {
                id: "meetings",
                label: "All Meetings",
                icon: Users,
                path: "/shelter/scheduling?view=meetings",
              },
              {
                id: "reminders",
                label: "Reminders",
                icon: Bell,
                path: "/shelter/scheduling?view=reminders",
              },
            ],
          },
          {
            id: "reports",
            label: "Reports & Analytics",
            icon: TrendingUp,
            path: "/shelter/reports",
            subItems: [
              {
                id: "overview",
                label: "Overview",
                icon: BarChart3,
                path: "/shelter/reports",
              },
              {
                id: "trends",
                label: "Trend Analysis",
                icon: TrendingUp,
                path: "/shelter/reports?tab=trends",
              },
              {
                id: "performance",
                label: "Performance",
                icon: Activity,
                path: "/shelter/reports?tab=performance",
              },
            ],
          },
          {
            id: "reviews",
            label: "Reviews & Feedback",
            icon: Star,
            path: "/shelter/reviews",
            subItems: [
              {
                id: "all-reviews",
                label: "All Reviews",
                icon: Star,
                path: "/shelter/reviews",
              },
              {
                id: "recent-reviews",
                label: "Recent Reviews",
                icon: Clock,
                path: "/shelter/reviews?filter=recent",
              },
              {
                id: "low-ratings",
                label: "Low Ratings",
                icon: AlertTriangle,
                path: "/shelter/reviews?filter=low",
              },
            ],
          },
          {
            id: "communication",
            label: "Communication",
            icon: MessageCircle,
            path: "/communication",
          },
          {
            id: "settings",
            label: "Settings",
            icon: Settings,
            path: "/shelter/settings",
            subItems: [
              {
                id: "profile",
                label: "Shelter Profile",
                icon: Settings,
                path: "/shelter/settings",
              },
              {
                id: "account",
                label: "Account Settings",
                icon: Settings,
                path: "/shelter/settings?tab=account",
              },
              {
                id: "notifications",
                label: "Notifications",
                icon: Bell,
                path: "/shelter/settings?tab=notifications",
              },
            ],
          },
        ];

      case "admin":
        return [
          {
            id: "dashboard",
            label: "Dashboard",
            icon: Shield,
            path: "/admin/dashboard",
          },
          {
            id: "users",
            label: "User Management",
            icon: Users,
            path: "/admin/dashboard?tab=users",
          },
          {
            id: "shelters",
            label: "Shelter Management",
            icon: Building2,
            path: "/admin/dashboard?tab=shelters",
          },
          {
            id: "pets",
            label: "Pet Management",
            icon: PawPrint,
            path: "/admin/dashboard?tab=pets",
          },
          {
            id: "reports",
            label: "Reports & Violations",
            icon: AlertTriangle,
            path: "/admin/dashboard?tab=reports",
          },
          {
            id: "analytics",
            label: "Analytics",
            icon: BarChart3,
            path: "/admin/dashboard?tab=analytics",
          },
          {
            id: "logs",
            label: "Audit Logs",
            icon: Activity,
            path: "/admin/dashboard?tab=logs",
          },
          {
            id: "settings",
            label: "System Settings",
            icon: Settings,
            path: "/admin/dashboard?tab=settings",
          },
        ];

      case "user":
        return [
          {
            id: "dashboard",
            label: "Dashboard",
            icon: LayoutDashboard,
            path: "/dashboard",
          },
          {
            id: "favorites",
            label: "My Favorites",
            icon: Heart,
            path: "/favorites",
          },

          {
            id: "recommendations",
            label: "Recommendations",
            icon: TrendingUp,
            path: "/recommendations",
          },
          {
            id: "communication",
            label: "Communication",
            icon: MessageCircle,
            path: "/communication",
          },
          {
            id: "profile",
            label: "Profile",
            icon: Users,
            path: "/dashboard/profile",
          },
        ];

      default:
        return [];
    }
  };

  const navigationItems = getNavigationItems();

  const renderNavItem = (item: NavItem) => {
    const active = isActive(item.path) || isSubItemActive(item);
    const expanded = expandedItems.has(item.id);
    const hasSubItems = item.subItems && item.subItems.length > 0;

    return (
      <div key={item.id}>
        <Link
          to={item.path}
          className={`flex items-center justify-between px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200 ${
            active
              ? "bg-blue-100 text-blue-700 border-r-2 border-blue-500"
              : "text-gray-800 hover:bg-blue-50"
          }`}
          onClick={() => {
            if (hasSubItems) {
              toggleExpanded(item.id);
            }
            setSidebarOpen(false);
          }}
        >
          <div className="flex items-center">
            <item.icon className="h-5 w-5 mr-3" />
            <span>{item.label}</span>
          </div>
          {hasSubItems && (
            <div className="flex items-center">
              {expanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </div>
          )}
        </Link>

        {hasSubItems && expanded && item.subItems && (
          <div className="ml-6 mt-1 space-y-1">
            {item.subItems.map((subItem) => (
              <Link
                key={subItem.id}
                to={subItem.path}
                className={`flex items-center px-4 py-2 text-sm rounded-lg transition-colors duration-200 ${
                  isActive(subItem.path)
                    ? "bg-blue-50 text-blue-600"
                    : "text-gray-500 hover:bg-blue-50"
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                <subItem.icon className="h-4 w-4 mr-3" />
                <span>{subItem.label}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  };

  const getDashboardTitle = () => {
    if (title) return title;
    switch (userRole) {
      case "shelter":
        return "Shelter Dashboard";
      case "admin":
        return "Admin Dashboard";
      case "user":
        return "User Dashboard";
      default:
        return "Dashboard";
    }
  };

  const getDashboardSubtitle = () => {
    if (subtitle) return subtitle;
    return user?.name || "";
  };

  return (
    <div className="min-h-screen flex bg-blue-50">
      {/* Sidebar */}
      <div
        className={`
          hidden lg:flex flex-col w-64 bg-white shadow-sidebar border-r border-gray-100
        `}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <PawPrint className="h-8 w-8 text-blue-500" />
            <div className="ml-3">
              <h1 className="text-lg font-semibold text-gray-800">
                PawfectFriends
              </h1>
              <p className="text-sm text-gray-500">{getDashboardTitle()}</p>
            </div>
          </div>
          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {navigationItems.map(renderNavItem)}
          </nav>
          {/* Footer */}
          <div className="sticky bottom-0 left-0 bg-white border-t border-gray-200 p-4 z-40">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-sm font-medium text-blue-600">
                    {user?.name?.[0] || user?.email?.[0] || "U"}
                  </span>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-800">
                    {isRefreshingProfile ? (
                      <span className="text-gray-400">Loading...</span>
                    ) : (
                      user?.name || user?.email || "User"
                    )}
                  </p>
                  <p className="text-xs text-gray-500">
                    {isRefreshingProfile ? (
                      <span className="text-gray-400">Loading...</span>
                    ) : (
                      user?.email || "No email"
                    )}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-gray-500 hover:text-gray-800"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen bg-blue-50">
        {/* Top bar mobile */}
        <div className="sticky top-0 z-30 bg-white border-b border-gray-200 lg:hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-md text-gray-400 hover:text-gray-500 transition-colors duration-200"
              aria-label="Open sidebar"
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="flex items-center">
              <PawPrint className="h-6 w-6 text-blue-500" />
              <span className="ml-2 text-lg font-semibold text-gray-800">
                {getDashboardTitle()}
              </span>
            </div>
            <div className="w-10" /> {/* Spacer for centering */}
          </div>
        </div>
        {/* Page content */}
        <main className="flex-1 py-6 w-full">{children}</main>
      </div>
    </div>
  );
};

export default DashboardLayout;
