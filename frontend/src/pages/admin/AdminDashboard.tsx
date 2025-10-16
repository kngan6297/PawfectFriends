import React, { useState, useEffect, useMemo, lazy, Suspense } from "react";
import { toast } from "react-toastify";
import { useAuth } from "@/context/AuthContext";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Users,
  Building2,
  PawPrint,
  FileText,
  BarChart3,
  RefreshCw,
  Activity,
  AlertTriangle,
  Settings,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { adminApi } from "@/services/admin.service";

// Lazy load heavy components for better performance
const ReportsManagement = lazy(
  () => import("@/components/admin/ReportsManagement")
);
const AuditLogsManagement = lazy(
  () => import("@/components/admin/AuditLogsManagement")
);
const ShelterManagement = lazy(
  () => import("@/components/admin/ShelterManagement")
);
const UserManagement = lazy(() => import("@/components/admin/UserManagement"));
const AnalyticsDashboard = lazy(
  () => import("@/components/admin/AnalyticsDashboard")
);
const PetManagement = lazy(() => import("@/components/admin/PetManagement"));
const SystemSettings = lazy(() => import("@/components/admin/SystemSettings"));

interface SystemStatsData {
  totalUsers: number;
  totalShelters: number;
  totalPets: number;
  totalAdoptions: number;
  totalReviews: number;
  recentUsers: any[];
  recentShelters: any[];
  recentPets: any[];
  adoptionStats: any[];
  reviewStats: any[];
}

// Tab configuration for quick navigation
const tabs: Array<{ key: string; label: string; icon: LucideIcon }> = [
  { key: "overview", label: "Overview", icon: Activity },
  { key: "users", label: "Users", icon: Users },
  { key: "shelters", label: "Shelters", icon: Building2 },
  { key: "pets", label: "Pets", icon: PawPrint },
  { key: "reports", label: "Reports", icon: FileText },
  { key: "analytics", label: "Analytics", icon: BarChart3 },
  { key: "logs", label: "Logs", icon: AlertTriangle },
  { key: "settings", label: "Settings", icon: Settings },
];

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [sheltersLoading, setSheltersLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<SystemStatsData | null>(null);
  const [shelters, setShelters] = useState<any[]>([]);

  // Derive activeTab from URL searchParams as source of truth
  const activeTab = useMemo(
    () => searchParams.get("tab") || "overview",
    [searchParams]
  );

  // Function to update tab by changing URL searchParams
  const setTab = (tab: string) => setSearchParams({ tab });

  // Vietnamese locale formatters
  const nf = new Intl.NumberFormat("vi-VN"); // Standard number formatting
  const nfc = new Intl.NumberFormat("vi-VN", { notation: "compact" }); // Compact notation (e.g., 1.2K, 3.4M)
  const dfd = new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }); // Format: 27/08/2025

  // Global refresh handler - refreshes data for current tab
  const handleRefresh = () => {
    if (activeTab === "overview") return fetchDashboardData();
    if (activeTab === "shelters") return fetchShelterData();
    if (activeTab === "users") return fetchDashboardData(); // UserManagement uses onRefresh prop
    if (activeTab === "pets") return fetchDashboardData(); // PetManagement will be refreshed
    if (activeTab === "reports") return fetchDashboardData(); // ReportsManagement will be refreshed
    if (activeTab === "logs") return fetchDashboardData(); // AuditLogsManagement will be refreshed
    if (activeTab === "analytics") return fetchDashboardData(); // AnalyticsDashboard uses showRefresh prop
    // Other tabs can be added as needed
  };

  // Prefetch shelters data on hover
  const handleSheltersHover = () => {
    if (shelters.length === 0) {
      fetchShelterData();
    }
  };

  useEffect(() => {
    if (!user) {
      return;
    }

    if (user.role !== "admin") {
      navigate("/unauthorized");
      return;
    }

    fetchDashboardData();
  }, [user, navigate]);

  // Early return guards to avoid content flickering
  if (!user) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  if (user.role !== "admin") {
    navigate("/unauthorized");
    return null;
  }

  // Fetch shelter data when switching to shelters tab
  useEffect(() => {
    if (activeTab === "shelters") {
      fetchShelterData();
    }
  }, [activeTab]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await adminApi.getSystemStats();

      if (response.data.success) {
        setStats(response.data.data);
      } else {
        throw new Error(
          response.data.message || "Failed to fetch system stats"
        );
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setError(
        error instanceof Error ? error.message : "Failed to load dashboard data"
      );
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const fetchShelterData = async () => {
    try {
      setSheltersLoading(true);
      const sheltersResponse = await adminApi.getAllShelters();
      if (sheltersResponse.data.success) {
        setShelters(sheltersResponse.data.data || []);
      } else {
        throw new Error(
          sheltersResponse.data.message || "Failed to fetch shelters"
        );
      }
    } catch (error) {
      console.error("Error fetching shelter data:", error);
      toast.error("Failed to load shelter data");
    } finally {
      setSheltersLoading(false);
    }
  };

  const handleShelterAction = async (
    action: string,
    shelterId: string,
    data?: any
  ) => {
    try {
      let response;
      switch (action) {
        case "ban_shelter":
          response = await adminApi.banShelter(shelterId, data.reason);
          break;
        case "unban_shelter":
          response = await adminApi.unbanShelter(shelterId);
          break;
        case "delete_shelter":
          response = await adminApi.deleteShelter(shelterId);
          break;
        default:
          throw new Error("Unknown action");
      }

      toast.success(response.data.message || "Action completed successfully");
      fetchDashboardData(); // Refresh data
    } catch (error) {
      console.error("Shelter action error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to perform action";
      toast.error(errorMessage);
    }
  };

  // Skeleton components
  const StatsSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="h-10 w-10 rounded-lg bg-gray-100 animate-pulse" />
              <div className="ml-4 w-full">
                <div className="h-4 w-24 bg-gray-100 rounded animate-pulse" />
                <div className="h-6 w-16 bg-gray-100 rounded mt-2 animate-pulse" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const RecentListsSkeleton = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {Array.from({ length: 2 }).map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <div className="h-6 w-32 bg-gray-100 rounded animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, j) => (
                <div
                  key={j}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="flex items-center">
                    <div className="h-8 w-8 rounded-full bg-gray-100 animate-pulse" />
                    <div className="ml-3">
                      <div className="h-4 w-24 bg-gray-100 rounded animate-pulse" />
                      <div className="h-3 w-32 bg-gray-100 rounded mt-1 animate-pulse" />
                    </div>
                  </div>
                  <div className="h-3 w-16 bg-gray-100 rounded animate-pulse" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case "overview":
        return loading || !stats ? (
          <div className="space-y-6">
            <StatsSkeleton />
            <RecentListsSkeleton />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Users className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">
                        Total Users
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {nfc.format(stats?.totalUsers || 0)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Building2 className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">
                        Total Shelters
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {nfc.format(stats?.totalShelters || 0)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <PawPrint className="h-6 w-6 text-purple-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">
                        Total Pets
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {nfc.format(stats?.totalPets || 0)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <FileText className="h-6 w-6 text-orange-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">
                        Total Adoptions
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {nfc.format(stats?.totalAdoptions || 0)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Recent Users</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {stats?.recentUsers && stats.recentUsers.length > 0 ? (
                      stats.recentUsers.slice(0, 5).map((user: any) => (
                        <div
                          key={user._id}
                          className="flex items-center justify-between p-3 rounded-lg border"
                        >
                          <div className="flex items-center">
                            <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                              {user.name?.charAt(0).toUpperCase() || "?"}
                            </div>
                            <div className="ml-3">
                              <p className="text-sm font-medium text-gray-900">
                                {user.name}
                              </p>
                              <p className="text-sm text-gray-500">
                                <a
                                  href={`mailto:${user.email}`}
                                  className="hover:text-blue-600 hover:underline"
                                  aria-label={`Send email to ${user.name}`}
                                >
                                  {user.email}
                                </a>
                              </p>
                            </div>
                          </div>
                          <span className="text-xs text-gray-400">
                            {dfd.format(new Date(user.createdAt))}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 text-sm mb-2">
                          No recent users
                        </p>
                        <p className="text-gray-400 text-xs">
                          Users will appear here as they register
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Recent Shelters</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {stats?.recentShelters &&
                    stats.recentShelters.length > 0 ? (
                      stats.recentShelters.slice(0, 5).map((shelter: any) => (
                        <div
                          key={shelter._id}
                          className="flex items-center justify-between p-3 rounded-lg border"
                        >
                          <div className="flex items-center">
                            <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                              {shelter.name?.charAt(0).toUpperCase() || "?"}
                            </div>
                            <div className="ml-3">
                              <p className="text-sm font-medium text-gray-900">
                                {shelter.name}
                              </p>
                              <p className="text-sm text-gray-500">
                                <a
                                  href={`mailto:${shelter.email}`}
                                  className="hover:text-blue-600 hover:underline"
                                  aria-label={`Send email to ${shelter.name}`}
                                >
                                  {shelter.email}
                                </a>
                              </p>
                            </div>
                          </div>
                          <span className="text-xs text-gray-400">
                            {dfd.format(new Date(shelter.createdAt))}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 text-sm mb-2">
                          No recent shelters
                        </p>
                        <p className="text-gray-400 text-xs">
                          Shelters will appear here as they register
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="mt-8">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Button
                      variant="outline"
                      onClick={() => setTab("users")}
                      className="h-20 flex flex-col items-center justify-center focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      aria-label="Navigate to Users management"
                    >
                      <Users className="h-4 w-4 mb-2" />
                      <span>Manage Users</span>
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setTab("shelters")}
                      onMouseEnter={handleSheltersHover}
                      className="h-20 flex flex-col items-center justify-center focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      aria-label="Navigate to Shelters management"
                    >
                      <Building2 className="h-4 w-4 mb-2" />
                      <span>Manage Shelters</span>
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setTab("analytics")}
                      className="h-20 flex flex-col items-center justify-center focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      aria-label="Navigate to Analytics view"
                    >
                      <BarChart3 className="h-4 w-4 mb-2" />
                      <span>View Analytics</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case "users":
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <UserManagement onRefresh={fetchDashboardData} />
          </Suspense>
        );

      case "shelters":
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <ShelterManagement
              shelters={shelters}
              onShelterAction={handleShelterAction}
              onRefresh={fetchShelterData}
              loading={sheltersLoading}
            />
          </Suspense>
        );

      case "pets":
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <PetManagement />
          </Suspense>
        );

      case "reports":
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <ReportsManagement />
          </Suspense>
        );

      case "analytics":
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <AnalyticsDashboard
              isAdmin={true}
              showFilters={true}
              showExport={true}
              showRefresh={true}
              compact={false}
            />
          </Suspense>
        );

      case "logs":
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <AuditLogsManagement />
          </Suspense>
        );

      case "settings":
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <SystemSettings />
          </Suspense>
        );

      default:
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">
                Page Not Found
              </h2>
            </div>
            <Card>
              <CardContent className="p-6">
                <p className="text-gray-600">
                  The requested page could not be found.
                </p>
              </CardContent>
            </Card>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-red-600">
            Error Loading Dashboard
          </h3>
          <p className="mt-2 text-sm text-gray-500">{error}</p>
          <Button
            variant="primary"
            onClick={fetchDashboardData}
            className="mt-4"
            aria-label="Retry loading dashboard data"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Sticky Header */}
      <header className="sticky top-0 z-10 bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-b">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 py-3 px-4 sm:px-6 lg:px-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Admin Dashboard
            </h1>
            <p className="text-gray-600">
              {activeTab === "overview"
                ? "System overview."
                : `Managing ${
                    activeTab.charAt(0).toUpperCase() + activeTab.slice(1)
                  }`}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="primary"
              leftIcon={RefreshCw}
              onClick={handleRefresh}
              aria-label="Refresh current section"
            >
              Refresh
            </Button>
          </div>
        </div>
      </header>

      {/* Quick Tabbar */}
      <div className="mt-3 overflow-x-auto">
        <div className="flex gap-2 pb-2 px-4 sm:px-6 lg:px-8">
          {tabs.map((t) => (
            <Button
              key={t.key}
              variant={activeTab === t.key ? "primary" : "outline"}
              onClick={() => setTab(t.key)}
              className="shrink-0"
              leftIcon={t.icon}
              aria-label={`Open tab ${t.label}`}
            >
              {t.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <main className="py-8 px-4 sm:px-6 lg:px-8">
        <section aria-label={`${activeTab} management section`}>
          {renderTabContent()}
        </section>
      </main>
    </div>
  );
};

export default AdminDashboard;
