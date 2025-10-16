import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
  SelectSeparator,
} from "../../components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Calendar, BarChart3, PieChart } from "lucide-react";

interface RejectionReason {
  _id: string;
  count: number;
  percentage: number;
}

interface RejectionReasonsData {
  totalRejections: number;
  rejectionReasons: RejectionReason[];
  topRejectionReasons: RejectionReason[];
  rejectionTrends: any[];
  summary: {
    mostCommonReason: RejectionReason | null;
    averageRejectionsPerDay: number;
  };
}

const REJECTION_REASON_LABELS: Record<string, string> = {
  incomplete_application: "Incomplete Application",
  unsuitable_housing: "Unsuitable Housing",
  no_yard_for_dog: "No Yard for Dog",
  other_pets_conflict: "Other Pets Conflict",
  children_concerns: "Children Concerns",
  work_schedule_issues: "Work Schedule Issues",
  lack_of_experience: "Lack of Experience",
  financial_concerns: "Financial Concerns",
  vet_reference_issues: "Vet Reference Issues",
  home_visit_failed: "Home Visit Failed",
  interview_concerns: "Interview Concerns",
  pet_already_adopted: "Pet Already Adopted",
  other: "Other",
};

interface RejectionReasonsAnalyticsProps {
  // New props for external data
  rejectionData?: RejectionReasonsData;
  loading?: boolean;
  error?: string | null;
  period?: string;
  onPeriodChange?: (period: string) => void;
  onRefresh?: () => void;
}

export const RejectionReasonsAnalytics: React.FC<
  RejectionReasonsAnalyticsProps
> = ({
  rejectionData,
  loading = false,
  error = null,
  period = "30d",
  onPeriodChange,
  onRefresh,
}) => {
  const [chartType, setChartType] = useState<"pie" | "bar">("pie");

  const getRejectionReasonLabel = (reason: string) => {
    return REJECTION_REASON_LABELS[reason] || reason;
  };

  const getRandomColor = (index: number) => {
    const colors = [
      "#3B82F6",
      "#EF4444",
      "#10B981",
      "#F59E0B",
      "#8B5CF6",
      "#06B6D4",
      "#84CC16",
      "#F97316",
      "#EC4899",
      "#6366F1",
      "#14B8A6",
      "#F43F5E",
      "#A855F7",
      "#0EA5E9",
      "#22C55E",
    ];
    return colors[index % colors.length];
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <p>{error}</p>
            {onRefresh && (
              <Button onClick={onRefresh} className="mt-2">
                Retry
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!rejectionData) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            <p>No rejection data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Rejection Reasons Analytics
          </h2>
          <p className="text-gray-600">
            Analysis of adoption request rejections
          </p>
        </div>
        <div className="flex items-center gap-3">
          {onPeriodChange && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <Select
                value={period}
                onValueChange={(value) => onPeriodChange(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                  <SelectItem value="1y">Last year</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="flex items-center gap-2">
            {chartType === "pie" ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setChartType("bar")}
                className="flex items-center gap-1"
              >
                <BarChart3 className="h-4 w-4" />
                Bar
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setChartType("pie")}
                className="flex items-center gap-1"
              >
                <PieChart className="h-4 w-4" />
                Pie
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <BarChart3 className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Total Rejections
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {rejectionData.totalRejections}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <PieChart className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Most Common Reason
                </p>
                <p className="text-lg font-semibold text-gray-900">
                  {rejectionData.summary.mostCommonReason
                    ? getRejectionReasonLabel(
                        rejectionData.summary.mostCommonReason._id
                      )
                    : "N/A"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Avg Rejections/Day
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {rejectionData.summary.averageRejectionsPerDay.toFixed(1)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Rejection Reasons Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          {chartType === "pie" ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Pie Chart Visualization */}
              <div className="flex items-center justify-center">
                <div className="relative w-64 h-64">
                  <svg className="w-full h-full" viewBox="0 0 100 100">
                    {rejectionData.rejectionReasons.map((reason, index) => {
                      const percentage = reason.percentage;
                      const angle = (percentage / 100) * 360;
                      const startAngle = rejectionData.rejectionReasons
                        .slice(0, index)
                        .reduce(
                          (sum, r) => sum + (r.percentage / 100) * 360,
                          0
                        );

                      const x1 =
                        50 + 40 * Math.cos((startAngle * Math.PI) / 180);
                      const y1 =
                        50 + 40 * Math.sin((startAngle * Math.PI) / 180);
                      const x2 =
                        50 +
                        40 * Math.cos(((startAngle + angle) * Math.PI) / 180);
                      const y2 =
                        50 +
                        40 * Math.sin(((startAngle + angle) * Math.PI) / 180);

                      const largeArcFlag = angle > 180 ? 1 : 0;

                      return (
                        <path
                          key={reason._id}
                          d={`M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArcFlag} 1 ${x2} ${y2} Z`}
                          fill={getRandomColor(index)}
                          stroke="white"
                          strokeWidth="0.5"
                        />
                      );
                    })}
                  </svg>
                </div>
              </div>

              {/* Legend */}
              <div className="space-y-2">
                {rejectionData.rejectionReasons.map((reason, index) => (
                  <div key={reason._id} className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: getRandomColor(index) }}
                    />
                    <span className="text-sm font-medium">
                      {getRejectionReasonLabel(reason._id)}
                    </span>
                    <span className="text-sm text-gray-500">
                      ({reason.count} - {reason.percentage.toFixed(1)}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Bar Chart */
            <div className="space-y-4">
              {rejectionData.rejectionReasons.map((reason, index) => (
                <div key={reason._id} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">
                      {getRejectionReasonLabel(reason._id)}
                    </span>
                    <span className="text-gray-500">
                      {reason.count} ({reason.percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="h-3 rounded-full transition-all duration-300"
                      style={{
                        width: `${reason.percentage}%`,
                        backgroundColor: getRandomColor(index),
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top Rejection Reasons Table */}
      <Card>
        <CardHeader>
          <CardTitle>Top Rejection Reasons</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 font-medium">Reason</th>
                  <th className="text-right py-2 font-medium">Count</th>
                  <th className="text-right py-2 font-medium">Percentage</th>
                </tr>
              </thead>
              <tbody>
                {rejectionData.topRejectionReasons.map((reason, index) => (
                  <tr key={reason._id} className="border-b">
                    <td className="py-2">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded"
                          style={{ backgroundColor: getRandomColor(index) }}
                        />
                        {getRejectionReasonLabel(reason._id)}
                      </div>
                    </td>
                    <td className="text-right py-2">{reason.count}</td>
                    <td className="text-right py-2">
                      {reason.percentage.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
