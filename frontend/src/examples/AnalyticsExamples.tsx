import React, { useState } from "react";
import ComprehensiveAnalytics from "../components/analytics/ComprehensiveAnalytics";
import AnalyticsDashboard from "../components/admin/AnalyticsDashboard";
import AnalyticsCharts from "../components/charts/AnalyticsCharts";
import { useSystemAnalytics } from "../hooks/useAnalytics";
import { analyticsExportService } from "../services/analyticsExport.service";

/**
 * Example usage of the Analytics functionality
 * This file demonstrates how to use the various analytics components
 */

// Example 1: Basic Analytics Dashboard (existing component enhanced)
export const BasicAnalyticsExample = () => {
  return (
    <AnalyticsDashboard
      shelterId="shelter123"
      isAdmin={false}
      showFilters={true}
      showExport={true}
      showRefresh={true}
      compact={false}
    />
  );
};

// Example 2: System-wide Analytics for Admin
export const SystemAnalyticsExample = () => {
  return (
    <ComprehensiveAnalytics
      isAdmin={true}
      showCharts={true}
      showExport={true}
      showFilters={true}
      showRefresh={true}
      title="System Analytics Dashboard"
      description="Comprehensive platform analytics"
    />
  );
};

// Example 3: Shelter-specific Analytics
export const ShelterAnalyticsExample = ({
  shelterId,
}: {
  shelterId: string;
}) => {
  return (
    <ComprehensiveAnalytics
      shelterId={shelterId}
      isAdmin={false}
      showCharts={true}
      showExport={true}
      showFilters={true}
      showRefresh={true}
      title="Shelter Performance Dashboard"
      description={`Analytics for shelter ${shelterId}`}
    />
  );
};

// Example 4: Charts Only
export const ChartsOnlyExample = () => {
  return (
    <AnalyticsCharts
      shelterId="shelter123"
      isAdmin={false}
      showCharts={true}
      compact={false}
    />
  );
};

// Example 5: Compact Analytics
export const CompactAnalyticsExample = () => {
  return (
    <ComprehensiveAnalytics
      shelterId="shelter123"
      isAdmin={false}
      showCharts={true}
      showExport={false}
      showFilters={false}
      showRefresh={false}
      compact={true}
      title="Quick Stats"
    />
  );
};

// Example 6: Using Analytics Hooks Directly
export const CustomAnalyticsExample = () => {
  const { data: systemData, loading, error, refetch } = useSystemAnalytics();

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>Custom Analytics</h2>
      <p>Total Users: {systemData?.users?.total}</p>
      <p>Total Shelters: {systemData?.shelters?.total}</p>
      <button onClick={refetch}>Refresh</button>
    </div>
  );
};

// Example 7: Export Functionality
export const ExportExample = () => {
  const handleExport = async () => {
    try {
      await analyticsExportService.exportSystemAnalytics({
        format: "json",
        includeMetadata: true,
        includeCharts: true,
      });
    } catch (error) {
      console.error("Export failed:", error);
    }
  };

  return (
    <div>
      <h2>Export Analytics</h2>
      <button onClick={handleExport}>Export as JSON</button>
    </div>
  );
};

/**
 * Main Analytics Page Component
 * This shows how to integrate analytics into a full page
 */
export const AnalyticsPage = () => {
  const [selectedShelter, setSelectedShelter] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setIsAdmin(!isAdmin)}
            className={`px-4 py-2 rounded ${
              isAdmin ? "bg-blue-600 text-white" : "bg-gray-200"
            }`}
          >
            {isAdmin ? "Admin View" : "User View"}
          </button>
        </div>
      </div>

      {isAdmin ? (
        <SystemAnalyticsExample />
      ) : selectedShelter ? (
        <ShelterAnalyticsExample shelterId={selectedShelter} />
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500">Select a shelter to view analytics</p>
        </div>
      )}
    </div>
  );
};

export default AnalyticsPage;
