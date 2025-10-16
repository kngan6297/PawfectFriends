import React, { useMemo, useState } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import {
  RefreshCw,
  Users,
  Building2,
  PawPrint,
  FileText,
  AlertCircle,
  UserPlus,
  Home,
  Heart,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { DeltaBadge } from "@/components/ui/DeltaBadge";
import { ExportDropdown } from "@/components/ui/ExportDropdown";
import { QuickFilters } from "@/components/ui/QuickFilters";
import { EmptyState } from "@/components/ui/EmptyState";
import { InlineError } from "@/components/ui/InlineError";
import {
  SkeletonCard,
  SkeletonKPI,
  SkeletonList,
  SkeletonPending,
  SkeletonButton,
} from "@/components/ui/Skeleton";
import { formatInt } from "@/utils/format";
import {
  getStatusColor,
  getStarColor,
  getChartAriaLabel,
  chartFormatters,
} from "@/utils/chart";
import {
  ResponsiveContainer,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";

/*************************
 * Types
 *************************/
export interface AdoptionStat {
  _id: string; // e.g. "pending" | "approved" | "completed" | "rejected"
  count: number;
}

export interface ReviewStat {
  _id: number; // star rating (1..5)
  count: number;
}

export interface LightweightUser {
  _id?: string;
  name?: string;
  email?: string;
  createdAt?: string;
}

export interface LightweightShelter {
  _id?: string;
  name?: string;
  email?: string;
  createdAt?: string;
}

export interface LightweightPet {
  _id?: string;
  name?: string;
  species?: string;
  status?: string; // e.g. "available", "pending", "adopted"
  createdAt?: string;
}

export interface SystemStats {
  totalUsers: number;
  totalShelters: number;
  totalPets: number;
  totalAdoptions: number;
  totalReviews: number;
  pendingShelters: number;
  pendingPets: number;
  // Delta fields for trend indicators (% change from previous period)
  totalUsersDelta?: number;
  totalSheltersDelta?: number;
  totalPetsDelta?: number;
  totalAdoptionsDelta?: number;
  totalReviewsDelta?: number;
  pendingSheltersDelta?: number;
  pendingPetsDelta?: number;
  recentUsers: LightweightUser[];
  recentShelters: LightweightShelter[];
  recentPets?: LightweightPet[];
  adoptionStats: AdoptionStat[];
  reviewStats: ReviewStat[];
}

interface SystemReportsProps {
  stats: Partial<SystemStats> | undefined;
  onRefresh: () => void | Promise<void>;
  onExport?: (
    format: string,
    type: string,
    period: string
  ) => Promise<void> | void;
  error?: string | null;
}

/*************************
 * Helpers
 *************************/
const getInitial = (name?: string, fallback: string = "?") =>
  (name?.trim()?.[0] || fallback).toUpperCase();

const statusPretty: Record<string, string> = {
  pending: "Pending",
  approved: "Approved",
  completed: "Completed",
  rejected: "Rejected",
};

// Stable order for charts to prevent jumping
const STATUS_ORDER = ["pending", "approved", "completed", "rejected"];
const STAR_ORDER = [1, 2, 3, 4, 5];

// Chart colors are now handled by CSS variables in utils/chart.ts

function toCSV(rows: Record<string, any>[], filename: string) {
  if (!rows || rows.length === 0) {
    toast.info("No data to export");
    return;
  }
  const headers = Array.from(
    rows.reduce((set: Set<string>, r) => {
      Object.keys(r).forEach((k) => set.add(k));
      return set;
    }, new Set<string>())
  );
  const esc = (v: any) =>
    `"${String(v ?? "")
      .replace(/"/g, '""')
      .replace(/\n/g, " ")}"`;
  const csv = [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => esc(r[h])).join(",")),
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function toJSON(data: any, filename: string) {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".json") ? filename : `${filename}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/*************************
 * Component
 *************************/
const SystemReports: React.FC<SystemReportsProps> = ({
  stats,
  onRefresh,
  onExport,
  error,
}) => {
  const navigate = useNavigate();
  const [reportPeriod, setReportPeriod] = useState<string>("30d");
  const [loading, setLoading] = useState<boolean>(false);

  // Check for reduced motion preference
  const reduceMotion = useReducedMotion();

  // Navigation utilities
  const navigationActions = {
    goToPendingShelters: () => navigate("/admin/shelters?tab=pending"),
    goToPendingPets: () => navigate("/admin/pets?tab=pending"),
    goToUserManagement: () => navigate("/admin/users"),
    goToShelterManagement: () => navigate("/admin/shelters"),
    goToPetManagement: () => navigate("/admin/pets"),
    goToAdoptionManagement: () => navigate("/admin/adoptions"),
  };

  const adoptionChartData = useMemo(() => {
    const raw = stats?.adoptionStats || [];
    const map = Object.fromEntries(raw.map((s) => [s._id, s.count]));
    return STATUS_ORDER.map((k) => ({
      key: k,
      status: statusPretty[k] || k,
      count: map[k] ?? 0,
    }));
  }, [stats?.adoptionStats]);

  const reviewChartData = useMemo(() => {
    const raw = stats?.reviewStats || [];
    const map = Object.fromEntries(raw.map((s) => [s._id, s.count]));
    return STAR_ORDER.map((k) => ({
      key: k.toString(),
      stars: `${k}★`,
      count: map[k] ?? 0,
    }));
  }, [stats?.reviewStats]);

  const handleRefresh = async () => {
    try {
      setLoading(true);
      await Promise.resolve(onRefresh());
      toast.success("Refreshed");
    } catch (e) {
      console.error(e);
      toast.error("Failed to refresh");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: "csv" | "json", type: string) => {
    try {
      setLoading(true);
      if (onExport) {
        await Promise.resolve(onExport(format, type, reportPeriod));
        toast.success(`${type} report exported as ${format.toUpperCase()}`);
        return;
      }

      // Default CSV exports (fallback)
      if (format === "csv") {
        if (type === "adoption_success") {
          const rows = (stats?.adoptionStats || []).map((s) => ({
            period: reportPeriod,
            status: statusPretty[s._id] || s._id,
            count: s.count || 0,
          }));
          toCSV(rows, `adoption_success_${reportPeriod}`);
        } else if (type === "user_engagement") {
          const rows = (stats?.recentUsers || []).map((u) => ({
            name: u.name || "",
            email: u.email || "",
            createdAt: u.createdAt || "",
            period: reportPeriod,
          }));
          toCSV(rows, `user_engagement_${reportPeriod}`);
        } else if (type === "pet_performance") {
          const rows = (stats?.recentPets || []).map((p) => ({
            name: p.name || "",
            species: p.species || "",
            status: p.status || "",
            createdAt: p.createdAt || "",
            period: reportPeriod,
          }));
          toCSV(rows, `pet_performance_${reportPeriod}`);
        } else {
          toCSV(
            [
              { metric: "totalUsers", value: stats?.totalUsers ?? 0 },
              { metric: "totalShelters", value: stats?.totalShelters ?? 0 },
              { metric: "totalPets", value: stats?.totalPets ?? 0 },
              { metric: "totalAdoptions", value: stats?.totalAdoptions ?? 0 },
              { metric: "totalReviews", value: stats?.totalReviews ?? 0 },
            ],
            `system_overview_${reportPeriod}`
          );
        }
      } else if (format === "json") {
        // JSON export functionality
        let data: any = {};

        if (type === "adoption_success") {
          data = {
            type: "adoption_success",
            period: reportPeriod,
            data: stats?.adoptionStats || [],
            generatedAt: new Date().toISOString(),
          };
        } else if (type === "user_engagement") {
          data = {
            type: "user_engagement",
            period: reportPeriod,
            data: stats?.recentUsers || [],
            generatedAt: new Date().toISOString(),
          };
        } else if (type === "pet_performance") {
          data = {
            type: "pet_performance",
            period: reportPeriod,
            data: stats?.recentPets || [],
            generatedAt: new Date().toISOString(),
          };
        } else {
          data = {
            type: "system_overview",
            period: reportPeriod,
            data: {
              totalUsers: stats?.totalUsers ?? 0,
              totalShelters: stats?.totalShelters ?? 0,
              totalPets: stats?.totalPets ?? 0,
              totalAdoptions: stats?.totalAdoptions ?? 0,
              totalReviews: stats?.totalReviews ?? 0,
            },
            generatedAt: new Date().toISOString(),
          };
        }

        toJSON(data, `${type}_${reportPeriod}`);
      }

      toast.success(`${type} report exported as ${format.toUpperCase()}`);
    } catch (e) {
      console.error("Export error", e);
      toast.error("Failed to export report");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Skip link for keyboard navigation */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded-md z-50 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
      >
        Skip to main content
      </a>

      {/* Header: Title + Period + Refresh */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
          <h2
            className="text-xl font-semibold text-gray-900"
            id="reports-heading"
          >
            Reports & Analytics
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Period:</span>
            <QuickFilters
              value={reportPeriod}
              onChange={setReportPeriod}
              className="flex-shrink-0"
            />
          </div>
        </div>
        <Button
          variant="outline"
          onClick={handleRefresh}
          disabled={loading}
          aria-label={
            loading
              ? "Refreshing data..."
              : "Refresh reports and analytics data"
          }
          aria-busy={loading}
          className="focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
        >
          <RefreshCw
            className={`h-4 w-4 mr-2 ${
              loading && !reduceMotion ? "animate-spin" : ""
            }`}
            aria-hidden="true"
          />
          Refresh
        </Button>
      </div>

      {/* Key metrics */}
      <Card id="main-content" role="main" aria-labelledby="reports-heading">
        <CardHeader>
          <h3 className="text-lg font-semibold">System Overview</h3>
        </CardHeader>
        <CardContent>
          {error ? (
            <InlineError
              message="System overview data could not be loaded."
              onRetry={onRefresh}
            />
          ) : loading ? (
            <SkeletonKPI />
          ) : (
            <div className="grid gap-4 grid-auto-fit-kpi">
              <StatTile
                icon={<Users className="h-6 w-6 text-blue-600" />}
                bg="bg-blue-100"
                label="Total Users"
                value={stats?.totalUsers ?? 0}
                delta={stats?.totalUsersDelta}
              />
              <StatTile
                icon={<Building2 className="h-6 w-6 text-green-600" />}
                bg="bg-green-100"
                label="Total Shelters"
                value={stats?.totalShelters ?? 0}
                delta={stats?.totalSheltersDelta}
              />
              <StatTile
                icon={<PawPrint className="h-6 w-6 text-purple-600" />}
                bg="bg-purple-100"
                label="Total Pets"
                value={stats?.totalPets ?? 0}
                delta={stats?.totalPetsDelta}
              />
              <StatTile
                icon={<FileText className="h-6 w-6 text-yellow-600" />}
                bg="bg-yellow-100"
                label="Total Adoptions"
                value={stats?.totalAdoptions ?? 0}
                delta={stats?.totalAdoptionsDelta}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Adoption by Status</h3>
            <p
              className="text-sm text-gray-600"
              id="adoption-chart-description"
            >
              Distribution of adoption applications by current status
            </p>
          </CardHeader>
          <CardContent>
            {error ? (
              <InlineError
                message="Adoption data could not be loaded."
                onRetry={onRefresh}
              />
            ) : loading ? (
              <SkeletonCard height={288} lines={8} />
            ) : adoptionChartData.length > 0 ? (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={adoptionChartData}
                    margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
                    role="img"
                    aria-label={getChartAriaLabel("bar", "Adoption by Status")}
                    aria-describedby="adoption-chart-description"
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="status" tick={{ fontSize: 12 }} />
                    <YAxis
                      allowDecimals={false}
                      tickFormatter={chartFormatters.axisTick}
                    />
                    <Tooltip
                      formatter={(value) =>
                        chartFormatters.tooltipValue(value as number)
                      }
                      labelFormatter={(label) =>
                        chartFormatters.tooltipLabel(label as string, "Status")
                      }
                    />
                    <Legend />
                    <Bar dataKey="count" name="Quantity">
                      {adoptionChartData.map((e, i) => (
                        <Cell
                          key={`cell-${e.key}-${i}`}
                          fill={getStatusColor(e.key)}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyState
                text="No adoption data available"
                icon={<AlertCircle />}
                ctaLabel="View All Adoptions"
                onCta={navigationActions.goToAdoptionManagement}
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Review Distribution</h3>
            <p className="text-sm text-gray-600" id="review-chart-description">
              Distribution of user reviews by star rating
            </p>
          </CardHeader>
          <CardContent>
            {error ? (
              <InlineError
                message="Review data could not be loaded."
                onRetry={onRefresh}
              />
            ) : loading ? (
              <SkeletonCard height={288} lines={8} />
            ) : reviewChartData.length > 0 ? (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart
                    role="img"
                    aria-label={getChartAriaLabel("pie", "Review Distribution")}
                    aria-describedby="review-chart-description"
                  >
                    <Pie
                      data={reviewChartData}
                      dataKey="count"
                      nameKey="stars"
                      outerRadius={100}
                      label
                    >
                      {reviewChartData.map((e, i) => (
                        <Cell
                          key={`cell-r-${e.key}-${i}`}
                          fill={getStarColor(Number(e.key))}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) =>
                        chartFormatters.tooltipValue(value as number)
                      }
                      labelFormatter={(label) =>
                        chartFormatters.tooltipLabel(label as string, "Rating")
                      }
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyState
                text="No review data available"
                icon={<Heart />}
                ctaLabel="View All Reviews"
                onCta={() => navigate("/admin/reviews")}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Pending items */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Pending Items</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/admin/shelters?tab=pending")}
              className="text-blue-600 hover:text-blue-700 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            >
              Go to browse
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {error ? (
            <InlineError
              message="Pending items data could not be loaded."
              onRetry={onRefresh}
            />
          ) : loading ? (
            <SkeletonPending />
          ) : (
            <div className="grid gap-4 grid-auto-fit-pending">
              <PendingTile
                icon={<Building2 className="h-5 w-5 text-yellow-600 mr-3" />}
                title="Pending Shelters"
                subtitle="Awaiting approval"
                value={stats?.pendingShelters ?? 0}
                delta={stats?.pendingSheltersDelta}
              />
              <PendingTile
                icon={<PawPrint className="h-5 w-5 text-yellow-600 mr-3" />}
                title="Pending Pets"
                subtitle="Awaiting approval"
                value={stats?.pendingPets ?? 0}
                delta={stats?.pendingPetsDelta}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Export row */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Generate Reports</h3>
        </CardHeader>
        <CardContent>
          {error ? (
            <InlineError
              message="Export functionality is currently unavailable."
              onRetry={onRefresh}
            />
          ) : loading ? (
            <SkeletonButton />
          ) : (
            <div className="grid gap-4 grid-auto-fit-buttons">
              <ExportDropdown
                type="adoption_success"
                onClick={handleExport}
                disabled={loading || !stats?.adoptionStats?.length}
              />
              <ExportDropdown
                type="pet_performance"
                onClick={handleExport}
                disabled={loading || !stats?.recentPets?.length}
              />
              <ExportDropdown
                type="user_engagement"
                onClick={handleExport}
                disabled={loading || !stats?.recentUsers?.length}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Recent Users</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/admin/users")}
                className="text-blue-600 hover:text-blue-700 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              >
                View all
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {error ? (
              <InlineError
                message="Recent users data could not be loaded."
                onRetry={onRefresh}
              />
            ) : loading ? (
              <SkeletonList rows={5} />
            ) : stats?.recentUsers && stats.recentUsers.length > 0 ? (
              <ul
                className="divide-y divide-gray-100"
                role="list"
                aria-label="Recent users"
              >
                {stats.recentUsers.map((user, idx) => (
                  <li
                    key={user._id || idx}
                    className="flex items-center gap-3 py-3"
                    role="listitem"
                  >
                    <div
                      className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center font-medium"
                      aria-hidden="true"
                    >
                      {getInitial(user.name, "U")}
                    </div>
                    <span className="sr-only">{user.name}</span>
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {user.name || "Unnamed"}
                      </div>
                      <div className="text-xs text-gray-500">
                        {user.email || "N/A"}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                text="No recent users"
                icon={<UserPlus />}
                ctaLabel="View All Users"
                onCta={navigationActions.goToUserManagement}
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Recent Shelters</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/admin/shelters")}
                className="text-blue-600 hover:text-blue-700 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              >
                View all
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {error ? (
              <InlineError
                message="Recent shelters data could not be loaded."
                onRetry={onRefresh}
              />
            ) : loading ? (
              <SkeletonList rows={5} />
            ) : stats?.recentShelters && stats.recentShelters.length > 0 ? (
              <ul
                className="divide-y divide-gray-100"
                role="list"
                aria-label="Recent shelters"
              >
                {stats.recentShelters.map((shelter, idx) => (
                  <li
                    key={shelter._id || idx}
                    className="flex items-center gap-3 py-3"
                    role="listitem"
                  >
                    <div
                      className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center font-medium"
                      aria-hidden="true"
                    >
                      {getInitial(shelter.name, "S")}
                    </div>
                    <span className="sr-only">{shelter.name}</span>
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {shelter.name || "Unnamed Shelter"}
                      </div>
                      <div className="text-xs text-gray-500">
                        {shelter.email || "N/A"}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                text="No recent shelters"
                icon={<Home />}
                ctaLabel="Go to Approvals"
                onCta={navigationActions.goToPendingShelters}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Optional: Recent Pets */}
      {(loading || stats?.recentPets) && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Recent Pets</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/admin/pets")}
                className="text-blue-600 hover:text-blue-700 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              >
                View all
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {error ? (
              <InlineError
                message="Recent pets data could not be loaded."
                onRetry={onRefresh}
              />
            ) : loading ? (
              <div className="grid gap-3 grid-auto-fit-pets">
                {Array.from({ length: 6 }).map((_, idx) => (
                  <div key={idx} className="p-3 border rounded-xl bg-white">
                    <div className="h-4 w-20 bg-gray-200 rounded mb-2 animate-pulse" />
                    <div className="h-3 w-16 bg-gray-200 rounded mb-2 animate-pulse" />
                    <div className="h-5 w-12 bg-gray-200 rounded animate-pulse" />
                  </div>
                ))}
              </div>
            ) : stats?.recentPets && stats.recentPets.length > 0 ? (
              <ul
                className="grid gap-3 grid-auto-fit-pets"
                role="list"
                aria-label="Recent pets"
              >
                {stats.recentPets.map((pet, idx) => (
                  <li
                    key={pet._id || idx}
                    className="p-3 border rounded-xl bg-white"
                    role="listitem"
                  >
                    <div className="text-sm font-medium text-gray-900">
                      {pet.name || "Unnamed"}
                    </div>
                    <div className="text-xs text-gray-500">
                      {pet.species || ""}
                    </div>
                    <div className="mt-1">
                      <Badge
                        variant={
                          pet.status === "adopted"
                            ? "default"
                            : pet.status === "pending"
                            ? "warning"
                            : "secondary"
                        }
                      >
                        {pet.status || "unknown"}
                      </Badge>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                text="No recent pets"
                icon={<PawPrint />}
                ctaLabel="View All Pets"
                onCta={navigationActions.goToPetManagement}
              />
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

/*************************
 * Subcomponents
 *************************/
const StatTile: React.FC<{
  icon: React.ReactNode;
  bg: string;
  label: string;
  value: number;
  delta?: number;
}> = ({ icon, bg, label, value, delta }) => (
  <div className="text-center">
    <div
      className={`flex items-center justify-center w-12 h-12 rounded-lg mx-auto mb-2 ${bg}`}
    >
      {icon}
    </div>
    <div className="text-2xl font-bold text-gray-900">{formatInt(value)}</div>
    <div className="text-sm text-gray-500 inline-flex items-center justify-center">
      {label} {typeof delta === "number" && <DeltaBadge delta={delta} />}
    </div>
  </div>
);

const PendingTile: React.FC<{
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  value: number;
  delta?: number;
}> = ({ icon, title, subtitle, value, delta }) => (
  <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
    <div className="flex items-center">
      {icon}
      <div>
        <div className="font-medium text-gray-900 flex items-center">
          {title} {typeof delta === "number" && <DeltaBadge delta={delta} />}
        </div>
        <div className="text-sm text-gray-500">{subtitle}</div>
      </div>
    </div>
    <Badge variant="warning">{formatInt(value)}</Badge>
  </div>
);

export default SystemReports;
