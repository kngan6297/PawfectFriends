import React from "react";
import { toast } from "react-toastify";
import { useAuth } from "@/context/AuthContext";
import { format } from "date-fns";
import {
  TrendingUp,
  BarChart3,
  Download,
  RefreshCw,
  Calendar,
  Users,
  PawPrint,
  Star,
  FileText,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import AnalyticsDashboard from "@/components/admin/AnalyticsDashboard";
import TrendAnalysis from "@/components/admin/TrendAnalysis";
import { RejectionReasonsAnalytics } from "@/components/admin/RejectionReasonsAnalytics";
import { useNavigate } from "react-router-dom";
import { useShelterDataContext } from "@/context/ShelterDataContext";

const ShelterReports: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { stats, isLoading, error, refreshData } = useShelterDataContext();

  if (!user || user.role !== "shelter") {
    return (
      <div className="w-full py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Access Denied
          </h2>
          <p className="text-gray-600 mb-6">
            This page is only accessible to registered shelters.
          </p>
          <Button
            variant="primary"
            onClick={() => navigate("/register?role=shelter")}
          >
            Register as a Shelter
          </Button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-red-600">
            Error Loading Reports
          </h3>
          <p className="mt-2 text-sm text-gray-500">{error}</p>
          <button
            onClick={refreshData}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full py-8 px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600">
            View detailed reports and analytics for your shelter
          </p>
        </div>
        <div className="flex space-x-4 mt-4 md:mt-0">
          <Button
            variant="outline"
            leftIcon={Download}
            onClick={() => {
              /* Export functionality */
              toast.info("Export feature coming soon");
            }}
          >
            Export Report
          </Button>
          <Button variant="outline" leftIcon={RefreshCw} onClick={refreshData}>
            Refresh
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trends">Trend Analysis</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="rejections">Rejection Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Analytics Dashboard */}
          <AnalyticsDashboard />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Adoption Success Rate</h3>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">
                      {stats?.adoptionStats?.successRate || "0%"}
                    </div>
                    <p className="text-gray-500">Success Rate</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Total Requests</span>
                      <span className="font-medium">
                        {Object.values(
                          stats?.adoptionStats?.byStatus || {}
                        ).reduce(
                          (sum: number, status: any) =>
                            sum + (status.count || 0),
                          0
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Successful Adoptions</span>
                      <span className="font-medium">
                        {stats?.adoptionStats?.byStatus?.approved?.count || 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Average Processing Time</span>
                      <span className="font-medium">
                        {stats?.adoptionStats?.avgProcessingTime || 0} days
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Pet Performance</h3>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats?.petStats?.topPets?.map((pet: any) => (
                    <div
                      key={pet._id}
                      className="flex items-center justify-between"
                    >
                      <div>
                        <p className="font-medium">{pet.name}</p>
                        <p className="text-sm text-gray-500">{pet.breed}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{pet.views} views</p>
                        <Badge variant="secondary" className="ml-2">
                          {pet.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends">
          <TrendAnalysis />
        </TabsContent>

        <TabsContent value="performance">
          <AnalyticsDashboard />
        </TabsContent>

        <TabsContent value="rejections">
          <RejectionReasonsAnalytics
            rejectionData={{
              totalRejections:
                stats?.adoptionStats?.byStatus?.rejected?.count || 0,
              rejectionReasons: [
                { _id: "incomplete_application", count: 5, percentage: 25 },
                { _id: "unsuitable_housing", count: 4, percentage: 20 },
                { _id: "no_yard_for_dog", count: 3, percentage: 15 },
                { _id: "other_pets_conflict", count: 3, percentage: 15 },
                { _id: "children_concerns", count: 2, percentage: 10 },
                { _id: "other", count: 3, percentage: 15 },
              ],
              topRejectionReasons: [
                { _id: "incomplete_application", count: 5, percentage: 25 },
                { _id: "unsuitable_housing", count: 4, percentage: 20 },
                { _id: "no_yard_for_dog", count: 3, percentage: 15 },
              ],
              rejectionTrends: [],
              summary: {
                mostCommonReason: {
                  _id: "incomplete_application",
                  count: 5,
                  percentage: 25,
                },
                averageRejectionsPerDay: 0.5,
              },
            }}
            loading={isLoading}
            error={error}
            onRefresh={refreshData}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ShelterReports;
