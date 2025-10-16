import React, { useState } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
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
import { Button } from "../ui/Button";
import { format, subDays, subMonths, subYears } from "date-fns";
import DateRangeFilter from "./DateRangeFilter";

interface TrendData {
  trends: Array<{
    date: string;
    count: number;
    avgProcessingTime: number;
  }>;
  summary: {
    totalAdoptions: number;
    avgProcessingTime: number;
  };
}

interface RatesByAttributes {
  byType: Array<{
    _id: string;
    adoptions: number;
    avgProcessingTime: number;
  }>;
  byBreed: Array<{
    _id: string;
    adoptions: number;
    avgProcessingTime: number;
  }>;
  byAge: Array<{
    _id: string;
    adoptions: number;
    avgProcessingTime: number;
  }>;
}

interface TimeStats {
  summary: {
    avgTimeToAdoption: number;
    medianTimeToAdoption: number;
    minTimeToAdoption: number;
    maxTimeToAdoption: number;
    totalAdoptions: number;
  };
  timeDistribution: Array<{
    _id: string;
    count: number;
  }>;
}

interface TrendAnalysisProps {
  // New props for external data
  trendData?: TrendData;
  ratesData?: RatesByAttributes;
  timeStats?: TimeStats;
  loading?: boolean;
  error?: string | null;
  filters?: {
    period: "7d" | "30d" | "90d" | "1y";
    groupBy: "day" | "week" | "month";
    startDate: string;
    endDate: string;
  };
  onFiltersChange?: (filters: any) => void;
  onRefresh?: () => void;
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

const TrendAnalysis: React.FC<TrendAnalysisProps> = ({
  trendData,
  ratesData,
  timeStats,
  loading = false,
  error = null,
  filters = {
    period: "30d",
    groupBy: "month",
    startDate: "",
    endDate: "",
  },
  onFiltersChange,
  onRefresh,
}) => {
  const handleDateRangeChange = (startDate: string, endDate: string) => {
    if (onFiltersChange) {
      onFiltersChange({
        ...filters,
        startDate,
        endDate,
        period: "custom" as any,
      });
    }
  };

  const handlePeriodChange = (period: "7d" | "30d" | "90d" | "1y") => {
    if (onFiltersChange) {
      onFiltersChange({
        ...filters,
        period,
        startDate: "",
        endDate: "",
      });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    switch (filters.groupBy) {
      case "day":
        return format(date, "MMM dd");
      case "week":
        return format(date, "MMM dd");
      case "month":
        return format(date, "MMM yyyy");
      default:
        return format(date, "MMM dd");
    }
  };

  const getPeriodLabel = () => {
    switch (filters.period) {
      case "7d":
        return "Last 7 Days";
      case "30d":
        return "Last 30 Days";
      case "90d":
        return "Last 90 Days";
      case "1y":
        return "Last Year";
      default:
        return "Last 30 Days";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading trend analysis...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600">
        <p>{error}</p>
        {onRefresh && (
          <Button onClick={onRefresh} className="mt-2">
            Retry
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Time Period
          </label>
          <Select
            value={filters.period}
            onValueChange={(e: any) =>
              handlePeriodChange(e.target.value as "7d" | "30d" | "90d" | "1y")
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="90d">Last 90 Days</SelectItem>
              <SelectItem value="1y">Last Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Group By
          </label>
          <Select
            value={filters.groupBy}
            onValueChange={(e: any) =>
              onFiltersChange &&
              onFiltersChange({ ...filters, groupBy: e.target.value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a group by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Daily</SelectItem>
              <SelectItem value="week">Weekly</SelectItem>
              <SelectItem value="month">Monthly</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-end">
          {onRefresh && (
            <Button onClick={onRefresh} variant="outline" className="w-full">
              Refresh
            </Button>
          )}
        </div>
      </div>

      {/* Date Range Filter */}
      <DateRangeFilter onDateRangeChange={handleDateRangeChange} />

      {/* Charts will be rendered here when data is available */}
      {trendData && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Adoption Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trendData.trends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#8884d8"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {!trendData && !loading && (
        <div className="text-center text-gray-500">
          <p>No trend data available</p>
        </div>
      )}
    </div>
  );
};

export default TrendAnalysis;
