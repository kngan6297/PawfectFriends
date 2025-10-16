import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import {
  TrendingUp,
  TrendingDown,
  Users,
  PawPrint,
  Clock,
  Award,
  Download,
  RefreshCw,
  BarChart3,
  PieChart,
  Activity,
  Eye,
  Calendar,
  Filter,
  Settings,
  FileText,
  Share2,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { toast } from "react-toastify";
import {
  useSystemAnalytics,
  useShelterAnalytics,
  useAnalyticsFilters,
} from "@/hooks/useAnalytics";
import {
  analyticsExportService,
  ExportOptions,
} from "@/services/analyticsExport.service";
import AnalyticsCharts from "../charts/AnalyticsCharts";

interface ComprehensiveAnalyticsProps {
  shelterId?: string;
  isAdmin?: boolean;
  showCharts?: boolean;
  showExport?: boolean;
  showFilters?: boolean;
  showRefresh?: boolean;
  compact?: boolean;
  title?: string;
  description?: string;
}

/**
 * Comprehensive Analytics Component
 * Combines all analytics functionality into a single, powerful component
 */
const ComprehensiveAnalytics: React.FC<ComprehensiveAnalyticsProps> = ({
  shelterId,
  isAdmin = false,
  showCharts = true,
  showExport = true,
  showFilters = true,
  showRefresh = true,
  compact = false,
  title,
  description,
}) => {
  const { filters, period, updatePeriod } = useAnalyticsFilters({
    period: { period: "30d" },
  });

  // Use analytics hooks
  const systemAnalytics = useSystemAnalytics(filters, {
    autoFetch: isAdmin && !shelterId,
    onError: (error) => toast.error(`System analytics error: ${error.message}`),
  });

  const shelterAnalytics = useShelterAnalytics(shelterId || "", filters, {
    autoFetch: !!shelterId,
    onError: (error) =>
      toast.error(`Shelter analytics error: ${error.message}`),
  });

  const currentAnalytics = shelterId ? shelterAnalytics : systemAnalytics;
  const isLoading = currentAnalytics.loading;
  const data = currentAnalytics.data;

  // Handle period change
  const handlePeriodChange = (newPeriod: "7d" | "30d" | "90d" | "1y") => {
    updatePeriod(newPeriod);
  };

  // Handle data export
  const handleExport = async (format: "json" | "csv" = "json") => {
    try {
      if (!data) {
        toast.error("No data available to export");
        return;
      }

      const options: ExportOptions = {
        format,
        includeMetadata: true,
        includeCharts: showCharts,
        filters: filters,
      };

      if (shelterId) {
        await analyticsExportService.exportShelterAnalytics(shelterId, options);
      } else if (isAdmin) {
        await analyticsExportService.exportSystemAnalytics(options);
      } else {
        await analyticsExportService.exportAnalytics(data, options);
      }
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export analytics data");
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    currentAnalytics.refetch();
  };

  // Safe render metrics function
  const safeMetric = (value?: number, digits = 0) => {
    if (typeof value === "number" && !isNaN(value)) {
      return digits === 0 ? value : value.toFixed(digits);
    }
    return "-";
  };

  const getMetricIcon = (metric: string) => {
    switch (metric) {
      case "adoptions":
        return <PawPrint className="h-4 w-4" />;
      case "time":
        return <Clock className="h-4 w-4" />;
      case "success":
        return <Award className="h-4 w-4" />;
      case "users":
        return <Users className="h-4 w-4" />;
      default:
        return <TrendingUp className="h-4 w-4" />;
    }
  };

  const getMetricColor = (metric: string) => {
    switch (metric) {
      case "adoptions":
        return "text-blue-600 bg-blue-100";
      case "time":
        return "text-green-600 bg-green-100";
      case "success":
        return "text-purple-600 bg-purple-100";
      case "users":
        return "text-orange-600 bg-orange-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  // Generate metrics based on the data type
  const metrics = React.useMemo(() => {
    if (shelterId && shelterAnalytics.data) {
      // Shelter-specific metrics
      const shelterData = shelterAnalytics.data;
      return [
        {
          title: "Total Pets",
          value: safeMetric(shelterData.overview?.totalPets),
          icon: "adoptions",
          description: "Pets in shelter",
          trend: "+8%",
          trendDirection: "up" as "up" | "down",
        },
        {
          title: "Total Adoptions",
          value: safeMetric(shelterData.overview?.totalAdoptions),
          icon: "adoptions",
          description: "Completed adoptions",
          trend: "+12%",
          trendDirection: "up" as "up" | "down",
        },
        {
          title: "Success Rate",
          value: shelterData.overview?.successRate
            ? `${shelterData.overview.successRate.toFixed(1)}%`
            : "0%",
          icon: "success",
          description: "Adoption success rate",
          trend: "+3%",
          trendDirection: "up" as "up" | "down",
        },
        {
          title: "Avg Processing Time",
          value: `${safeMetric(
            shelterData.overview?.avgProcessingTime,
            1
          )} days`,
          icon: "time",
          description: "Time to complete adoption",
          trend: "-5%",
          trendDirection: "down" as "up" | "down",
        },
      ];
    } else if (isAdmin && systemAnalytics.data) {
      // System-wide metrics
      const systemData = systemAnalytics.data;
      return [
        {
          title: "Total Users",
          value: safeMetric(systemData.users?.total),
          icon: "users",
          description: "Registered users",
          trend: `+${(systemData.users?.growth * 100).toFixed(1)}%`,
          trendDirection: "up" as "up" | "down",
        },
        {
          title: "Total Shelters",
          value: safeMetric(systemData.shelters?.total),
          icon: "adoptions",
          description: "Active shelters",
          trend: `+${(systemData.shelters?.growth * 100).toFixed(1)}%`,
          trendDirection: "up" as "up" | "down",
        },
        {
          title: "Total Pets",
          value: safeMetric(systemData.pets?.total),
          icon: "adoptions",
          description: "Available pets",
          trend: `+${(systemData.pets?.growth * 100).toFixed(1)}%`,
          trendDirection: "up" as "up" | "down",
        },
        {
          title: "Total Adoptions",
          value: safeMetric(systemData.adoptions?.total),
          icon: "success",
          description: "Completed adoptions",
          trend: `+${(systemData.adoptions?.growth * 100).toFixed(1)}%`,
          trendDirection: "up" as "up" | "down",
        },
      ];
    } else {
      // Fallback metrics
      return [
        {
          title: "No Data",
          value: "0",
          icon: "adoptions",
          description: "No analytics data available",
          trend: "0%",
          trendDirection: "up" as "up" | "down",
        },
      ];
    }
  }, [shelterId, shelterAnalytics.data, systemAnalytics.data]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="h-10 w-full bg-gray-100 animate-pulse rounded" />

        {/* Metrics Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts Skeleton */}
        {showCharts && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                    <div className="h-32 bg-gray-200 rounded"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (currentAnalytics.error) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <p className="text-red-600 mb-4">{currentAnalytics.error}</p>
        <Button onClick={handleRefresh} variant="outline" leftIcon={RefreshCw}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {title || (isAdmin ? "System Analytics" : "Shelter Analytics")}
          </h3>
          <p className="text-sm text-gray-500">
            {description ||
              (shelterId
                ? `Analytics for shelter ${shelterId}`
                : "Platform-wide analytics")}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {showRefresh && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              leftIcon={RefreshCw}
              disabled={isLoading}
            >
              Refresh
            </Button>
          )}

          {showExport && (
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport("json")}
                leftIcon={Download}
                disabled={!data}
              >
                JSON
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport("csv")}
                leftIcon={Download}
                disabled={!data}
              >
                CSV
              </Button>
            </div>
          )}

          {showFilters && (
            <div className="flex gap-2">
              {(["7d", "30d", "90d", "1y"] as const).map((p) => (
                <Button
                  key={p}
                  variant={period === p ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => handlePeriodChange(p)}
                  disabled={isLoading}
                >
                  {p === "7d" && "7D"}
                  {p === "30d" && "30D"}
                  {p === "90d" && "90D"}
                  {p === "1y" && "1Y"}
                </Button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div
                    className={`p-2 rounded-lg ${getMetricColor(metric.icon)}`}
                  >
                    {getMetricIcon(metric.icon)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      {metric.title}
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {metric.value}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center space-x-1">
                    {metric.trendDirection === "up" ? (
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-500" />
                    )}
                    <span
                      className={`text-sm font-medium ${
                        metric.trendDirection === "up"
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {metric.trend}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">{metric.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Section */}
      {showCharts && data && (
        <AnalyticsCharts
          shelterId={shelterId}
          isAdmin={isAdmin}
          showCharts={true}
          compact={compact}
        />
      )}

      {/* Performance Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Performance Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {shelterId && shelterAnalytics.data ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      Processing Efficiency
                    </span>
                    <Badge
                      variant="secondary"
                      className="bg-green-100 text-green-800"
                    >
                      {shelterAnalytics.data.overview?.avgProcessingTime &&
                      shelterAnalytics.data.overview.avgProcessingTime < 7
                        ? "Excellent"
                        : shelterAnalytics.data.overview?.avgProcessingTime &&
                          shelterAnalytics.data.overview.avgProcessingTime < 14
                        ? "Good"
                        : "Average"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      Adoption Success
                    </span>
                    <Badge
                      variant="secondary"
                      className="bg-blue-100 text-blue-800"
                    >
                      {shelterAnalytics.data.overview?.successRate &&
                      shelterAnalytics.data.overview.successRate > 80
                        ? "Excellent"
                        : shelterAnalytics.data.overview?.successRate &&
                          shelterAnalytics.data.overview.successRate > 60
                        ? "Good"
                        : "Average"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Response Time</span>
                    <Badge
                      variant="secondary"
                      className="bg-yellow-100 text-yellow-800"
                    >
                      {shelterAnalytics.data.performance?.responseTime &&
                      shelterAnalytics.data.performance.responseTime < 2
                        ? "Fast"
                        : shelterAnalytics.data.performance?.responseTime &&
                          shelterAnalytics.data.performance.responseTime < 4
                        ? "Average"
                        : "Slow"}
                    </Badge>
                  </div>
                </>
              ) : isAdmin && systemAnalytics.data ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">User Growth</span>
                    <Badge
                      variant="secondary"
                      className="bg-green-100 text-green-800"
                    >
                      +{(systemAnalytics.data.users?.growth * 100).toFixed(1)}%
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      Shelter Growth
                    </span>
                    <Badge
                      variant="secondary"
                      className="bg-blue-100 text-blue-800"
                    >
                      +
                      {(systemAnalytics.data.shelters?.growth * 100).toFixed(1)}
                      %
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      Adoption Growth
                    </span>
                    <Badge
                      variant="secondary"
                      className="bg-purple-100 text-purple-800"
                    >
                      +
                      {(systemAnalytics.data.adoptions?.growth * 100).toFixed(
                        1
                      )}
                      %
                    </Badge>
                  </div>
                </>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  No performance data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button
                onClick={() => {
                  toast.info("Detailed reports feature coming soon!");
                }}
                variant="outline"
                className="w-full justify-start"
                leftIcon={FileText}
              >
                View Detailed Reports
              </Button>

              <Button
                onClick={() => handleExport("json")}
                variant="outline"
                className="w-full justify-start"
                leftIcon={Download}
                disabled={!data}
              >
                Export Analytics Data
              </Button>

              <Button
                onClick={() => {
                  toast.info("Sharing feature coming soon!");
                }}
                variant="outline"
                className="w-full justify-start"
                leftIcon={Share2}
                disabled={!data}
              >
                Share Analytics
              </Button>

              <Button
                onClick={() => {
                  toast.info("Alert configuration feature coming soon!");
                }}
                variant="outline"
                className="w-full justify-start"
                leftIcon={AlertCircle}
              >
                Configure Alerts
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ComprehensiveAnalytics;
