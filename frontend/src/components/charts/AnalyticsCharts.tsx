import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import {
  BarChart,
  LineChart,
  PieChart,
  AreaChart,
  ChartContainer,
  ChartGrid,
} from "./ChartComponents";
import {
  useSystemAnalytics,
  useShelterAnalytics,
  useAnalyticsFilters,
} from "@/hooks/useAnalytics";
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  Calendar,
  Download,
  RefreshCw,
  Eye,
  EyeOff,
} from "lucide-react";
import { toast } from "react-toastify";

interface AnalyticsChartsProps {
  shelterId?: string;
  isAdmin?: boolean;
  showCharts?: boolean;
  compact?: boolean;
}

const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({
  shelterId,
  isAdmin = false,
  showCharts = true,
  compact = false,
}) => {
  const { filters, period, updatePeriod } = useAnalyticsFilters();
  const [showAllCharts, setShowAllCharts] = useState(false);

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

  // Generate chart data based on analytics type
  const generateChartData = () => {
    if (shelterId && shelterAnalytics.data) {
      const data = shelterAnalytics.data;
      return {
        // Pet types distribution
        petTypesData:
          data.demographics?.petTypes.map((item) => ({
            label: item.type,
            value: item.count,
            color: getPetTypeColor(item.type),
          })) || [],

        // Pet ages distribution
        petAgesData:
          data.demographics?.petAges.map((item) => ({
            label: item.age,
            value: item.count,
            color: getPetAgeColor(item.age),
          })) || [],

        // Pet sizes distribution
        petSizesData:
          data.demographics?.petSizes.map((item) => ({
            label: item.size,
            value: item.count,
            color: getPetSizeColor(item.size),
          })) || [],

        // Adoptions over time
        adoptionsOverTime:
          data.trends?.adoptionsOverTime.map((item) => ({
            x: item.date,
            y: item.count,
            label: new Date(item.date).toLocaleDateString(),
          })) || [],

        // Pets over time
        petsOverTime:
          data.trends?.petsOverTime.map((item) => ({
            x: item.date,
            y: item.count,
            label: new Date(item.date).toLocaleDateString(),
          })) || [],

        // Reviews over time
        reviewsOverTime:
          data.trends?.reviewsOverTime.map((item) => ({
            x: item.date,
            y: item.count,
            label: new Date(item.date).toLocaleDateString(),
          })) || [],
      };
    } else if (isAdmin && systemAnalytics.data) {
      const data = systemAnalytics.data;
      return {
        // User growth
        userGrowthData: [
          {
            label: "Total Users",
            value: data.users?.total || 0,
            color: "#3B82F6",
          },
          {
            label: "Active Users",
            value: data.users?.active || 0,
            color: "#10B981",
          },
          {
            label: "Locked Users",
            value: data.users?.locked || 0,
            color: "#EF4444",
          },
        ],

        // Shelter distribution
        shelterDistribution: [
          {
            label: "Approved",
            value: data.shelters?.approved || 0,
            color: "#10B981",
          },
          {
            label: "Pending",
            value: data.shelters?.pending || 0,
            color: "#F59E0B",
          },
          {
            label: "Banned",
            value: data.shelters?.banned || 0,
            color: "#EF4444",
          },
        ],

        // Pet status distribution
        petStatusData: [
          {
            label: "Approved",
            value: data.pets?.approved || 0,
            color: "#10B981",
          },
          {
            label: "Pending",
            value: data.pets?.pending || 0,
            color: "#F59E0B",
          },
          {
            label: "Rejected",
            value: data.pets?.rejected || 0,
            color: "#EF4444",
          },
        ],

        // Adoption status distribution
        adoptionStatusData: [
          {
            label: "Approved",
            value: data.adoptions?.approved || 0,
            color: "#10B981",
          },
          {
            label: "Pending",
            value: data.adoptions?.pending || 0,
            color: "#F59E0B",
          },
          {
            label: "Rejected",
            value: data.adoptions?.rejected || 0,
            color: "#EF4444",
          },
        ],
      };
    }

    return {};
  };

  // Helper functions for colors
  const getPetTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      Dog: "#3B82F6",
      Cat: "#10B981",
      Rabbit: "#F59E0B",
      Bird: "#8B5CF6",
      Other: "#6B7280",
    };
    return colors[type] || "#6B7280";
  };

  const getPetAgeColor = (age: string) => {
    const colors: Record<string, string> = {
      "Puppy/Kitten": "#F59E0B",
      Young: "#10B981",
      Adult: "#3B82F6",
      Senior: "#8B5CF6",
    };
    return colors[age] || "#6B7280";
  };

  const getPetSizeColor = (size: string) => {
    const colors: Record<string, string> = {
      Small: "#10B981",
      Medium: "#3B82F6",
      Large: "#8B5CF6",
    };
    return colors[size] || "#6B7280";
  };

  const chartData = generateChartData();

  if (isLoading) {
    return (
      <div className="space-y-6">
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
      </div>
    );
  }

  if (!showCharts) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Analytics Charts
          </h3>
          <p className="text-sm text-gray-500">
            Visual representation of your data
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAllCharts(!showAllCharts)}
            leftIcon={showAllCharts ? EyeOff : Eye}
          >
            {showAllCharts ? "Hide Charts" : "Show All Charts"}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => currentAnalytics.refetch()}
            leftIcon={RefreshCw}
            disabled={isLoading}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Charts Grid */}
      <ChartGrid columns={compact ? 2 : 3}>
        {/* Pet Types Chart */}
        {shelterId &&
          chartData.petTypesData &&
          chartData.petTypesData.length > 0 && (
            <ChartContainer>
              <PieChart
                data={chartData.petTypesData}
                title="Pet Types Distribution"
                showLegend={true}
                showPercentage={true}
              />
            </ChartContainer>
          )}

        {/* Pet Ages Chart */}
        {shelterId &&
          chartData.petAgesData &&
          chartData.petAgesData.length > 0 && (
            <ChartContainer>
              <BarChart
                data={chartData.petAgesData}
                title="Pet Ages Distribution"
                orientation="horizontal"
                showValues={true}
              />
            </ChartContainer>
          )}

        {/* Pet Sizes Chart */}
        {shelterId &&
          chartData.petSizesData &&
          chartData.petSizesData.length > 0 && (
            <ChartContainer>
              <BarChart
                data={chartData.petSizesData}
                title="Pet Sizes Distribution"
                showValues={true}
              />
            </ChartContainer>
          )}

        {/* Adoptions Over Time */}
        {shelterId &&
          chartData.adoptionsOverTime &&
          chartData.adoptionsOverTime.length > 0 && (
            <ChartContainer>
              <LineChart
                data={chartData.adoptionsOverTime}
                title="Adoptions Over Time"
                showPoints={true}
                showGrid={true}
                color="#10B981"
              />
            </ChartContainer>
          )}

        {/* Pets Over Time */}
        {shelterId &&
          chartData.petsOverTime &&
          chartData.petsOverTime.length > 0 && (
            <ChartContainer>
              <AreaChart
                data={chartData.petsOverTime}
                title="Pets Added Over Time"
                fillOpacity={0.3}
                color="#3B82F6"
              />
            </ChartContainer>
          )}

        {/* Reviews Over Time */}
        {shelterId &&
          chartData.reviewsOverTime &&
          chartData.reviewsOverTime.length > 0 && (
            <ChartContainer>
              <LineChart
                data={chartData.reviewsOverTime}
                title="Reviews Over Time"
                showPoints={true}
                showGrid={true}
                color="#F59E0B"
              />
            </ChartContainer>
          )}

        {/* System Analytics Charts */}
        {isAdmin && !shelterId && (
          <>
            {/* User Growth Chart */}
            {chartData.userGrowthData &&
              chartData.userGrowthData.length > 0 && (
                <ChartContainer>
                  <BarChart
                    data={chartData.userGrowthData}
                    title="User Statistics"
                    showValues={true}
                  />
                </ChartContainer>
              )}

            {/* Shelter Distribution */}
            {chartData.shelterDistribution &&
              chartData.shelterDistribution.length > 0 && (
                <ChartContainer>
                  <PieChart
                    data={chartData.shelterDistribution}
                    title="Shelter Status Distribution"
                    showLegend={true}
                    showPercentage={true}
                  />
                </ChartContainer>
              )}

            {/* Pet Status Distribution */}
            {chartData.petStatusData && chartData.petStatusData.length > 0 && (
              <ChartContainer>
                <BarChart
                  data={chartData.petStatusData}
                  title="Pet Status Distribution"
                  orientation="horizontal"
                  showValues={true}
                />
              </ChartContainer>
            )}

            {/* Adoption Status Distribution */}
            {chartData.adoptionStatusData &&
              chartData.adoptionStatusData.length > 0 && (
                <ChartContainer>
                  <PieChart
                    data={chartData.adoptionStatusData}
                    title="Adoption Status Distribution"
                    showLegend={true}
                    showPercentage={true}
                  />
                </ChartContainer>
              )}
          </>
        )}
      </ChartGrid>

      {/* Advanced Charts Section */}
      {showAllCharts && (
        <div className="space-y-6">
          <div className="border-t pt-6">
            <h4 className="text-md font-semibold text-gray-900 mb-4">
              Advanced Analytics
            </h4>

            <ChartGrid columns={2}>
              {/* Performance Metrics */}
              <ChartContainer>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      Performance Metrics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {shelterId && shelterAnalytics.data ? (
                        <>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">
                              Success Rate
                            </span>
                            <Badge
                              variant="secondary"
                              className="bg-green-100 text-green-800"
                            >
                              {shelterAnalytics.data.overview?.successRate?.toFixed(
                                1
                              )}
                              %
                            </Badge>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">
                              Avg Processing Time
                            </span>
                            <Badge
                              variant="secondary"
                              className="bg-blue-100 text-blue-800"
                            >
                              {shelterAnalytics.data.overview?.avgProcessingTime?.toFixed(
                                1
                              )}{" "}
                              days
                            </Badge>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">
                              Response Time
                            </span>
                            <Badge
                              variant="secondary"
                              className="bg-yellow-100 text-yellow-800"
                            >
                              {shelterAnalytics.data.performance?.responseTime?.toFixed(
                                1
                              )}{" "}
                              hours
                            </Badge>
                          </div>
                        </>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          No performance data available
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </ChartContainer>

              {/* Growth Trends */}
              <ChartContainer>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Growth Trends
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {isAdmin && systemAnalytics.data ? (
                        <>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">
                              User Growth
                            </span>
                            <div className="flex items-center gap-1">
                              <TrendingUp className="h-4 w-4 text-green-500" />
                              <span className="text-sm font-medium text-green-600">
                                +
                                {(
                                  systemAnalytics.data.users?.growth * 100
                                ).toFixed(1)}
                                %
                              </span>
                            </div>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">
                              Shelter Growth
                            </span>
                            <div className="flex items-center gap-1">
                              <TrendingUp className="h-4 w-4 text-green-500" />
                              <span className="text-sm font-medium text-green-600">
                                +
                                {(
                                  systemAnalytics.data.shelters?.growth * 100
                                ).toFixed(1)}
                                %
                              </span>
                            </div>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">
                              Adoption Growth
                            </span>
                            <div className="flex items-center gap-1">
                              <TrendingUp className="h-4 w-4 text-green-500" />
                              <span className="text-sm font-medium text-green-600">
                                +
                                {(
                                  systemAnalytics.data.adoptions?.growth * 100
                                ).toFixed(1)}
                                %
                              </span>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          No growth data available
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </ChartContainer>
            </ChartGrid>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsCharts;
