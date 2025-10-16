import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { petApi, shelterApi } from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import { useShelterDataContext } from "@/context/ShelterDataContext";
import { Pet as PetType } from "@/types/pet";
import { format } from "date-fns";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  PlusCircle,
  Settings,
  Calendar,
  BarChart3,
  MessageSquare,
  Users,
  FileText,
  Star,
  TrendingUp,
  Clock,
  CheckCircle,
  PawPrint,
  ChevronDown,
  ChevronUp,
  Eye,
  X,
  AlertTriangle,
  ArrowRight,
  Filter,
  RefreshCw,
  Bell,
  Heart,
  Award,
  Activity,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import SchedulingModal from "@/components/scheduling/SchedulingModal";
import CalendarView from "@/components/scheduling/CalendarView";
import ReminderSystem from "@/components/scheduling/ReminderSystem";
import TrendAnalysis from "../../components/admin/TrendAnalysis";
import AnalyticsDashboard from "../../components/admin/AnalyticsDashboard";
import { RejectionReasonModal } from "@/components/adoption/shelter/RejectionReasonModal";
import { RejectionReasonsAnalytics } from "@/components/admin/RejectionReasonsAnalytics";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";
import { formatDisplayDateTime, formatDisplayDate } from "@/utils/dateUtils";

interface DashboardStats {
  petStats: {
    total: number;
    byStatus: Record<string, { count: number; avgViews: number }>;
    topPets: any[];
    monthlyStats?: any[];
  };
  adoptionStats: {
    byStatus: Record<string, { count: number; avgProcessingTime: number }>;
    successRate: string;
    avgProcessingTime: number;
    monthlyAdoptions?: any[];
  };
  reviewStats: {
    total: number;
    avgRating: number;
    recentReviews: any[];
  };
  recentActivity: {
    recentPets: any[];
    recentRequests: any[];
    recentReviews: any[];
  };
}

interface DashboardAdoptionRequest {
  _id: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  pet?: {
    id: string;
    name: string;
    photos: Array<{ url: string }>;
  } | null;
  status: "pending" | "approved" | "rejected" | "scheduled" | "completed";
  applicationDetails: {
    housingType?: string;
    hasYard?: boolean;
    yardDetails?: {
      isFenced?: boolean;
      size?: string;
    };
    hasOtherPets?: boolean;
    otherPetsDetails?: Array<{
      type: string;
      species: string;
      age: number;
      description: string;
    }>;
    hasChildren?: boolean;
    childrenAges?: number[];
    workSchedule?: string;
    experience?: string;
    reasonForAdopting?: string;
    plannedCareRoutine?: string;
    veterinarianInfo?: {
      name?: string;
      contact?: string;
      clinic?: string;
    };
    references?: Array<{
      name: string;
      relationship: string;
      phone?: string;
      email?: string;
      yearsKnown?: number;
    }>;
  };
  createdAt: string;
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Use the centralized shelter data context
  const {
    stats,
    pets,
    requests,
    meetings: allMeetings,
    isLoading,
    error,
    refreshData,
    updateRequestStatusFilter,
    requestStatusFilter,
  } = useShelterDataContext();

  const [expandedRequests, setExpandedRequests] = useState<Set<string>>(
    new Set()
  );
  const [showSchedulingModal, setShowSchedulingModal] = useState(false);
  const [selectedRequestForScheduling, setSelectedRequestForScheduling] =
    useState<DashboardAdoptionRequest | null>(null);
  const [calendarView, setCalendarView] = useState<"list" | "calendar">("list");
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [selectedRequestForRejection, setSelectedRequestForRejection] =
    useState<DashboardAdoptionRequest | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [profileViews, setProfileViews] = useState<number>(0);

  // Handle URL parameters for tab selection
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  // Track profile views when dashboard loads
  useEffect(() => {
    if (user?._id) {
      const trackProfileView = async () => {
        try {
          const response = await shelterApi.incrementProfileViews(user._id);
          if (response.data?.profileViews) {
            setProfileViews(response.data.profileViews);
          }
        } catch (error) {
          console.error("Failed to track profile view:", error);
        }
      };

      trackProfileView();
    }
  }, [user?._id]);

  const handleRequestAction = async (
    requestId: string,
    action: "approved" | "rejected",
    rejectionReason?: string,
    rejectionDetails?: string
  ) => {
    try {
      const updateData: any = { status: action };
      if (action === "rejected" && rejectionReason && rejectionDetails) {
        updateData.rejectionReason = rejectionReason;
        updateData.rejectionDetails = rejectionDetails;
      }

      await petApi.updateAdoptionRequest(requestId, updateData);
      toast.success(`Request ${action}ed successfully`);

      // Refresh all data to get the latest state
      await refreshData();
    } catch (error) {
      console.error("Error updating request:", error);
      toast.error(`Failed to ${action} request`);
    }
  };

  const toggleRequestDetails = (requestId: string) => {
    const newExpanded = new Set(expandedRequests);
    if (newExpanded.has(requestId)) {
      newExpanded.delete(requestId);
    } else {
      newExpanded.add(requestId);
    }
    setExpandedRequests(newExpanded);
  };

  const getStatusColor = (status: string) => {
    const colors = {
      adoptable: "bg-green-100 text-green-800",
      pending: "bg-yellow-100 text-yellow-800",
      adopted: "bg-blue-100 text-blue-800",
      hidden: "bg-gray-100 text-gray-800",
      waiting: "bg-orange-100 text-orange-800",
      in_treatment: "bg-red-100 text-red-800",
      fostered: "bg-purple-100 text-purple-800",
    };
    return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  const handleScheduleMeeting = (request: DashboardAdoptionRequest) => {
    console.log("Scheduling meeting for request:", request);
    console.log("Request ID:", request._id);

    if (!request._id) {
      console.error("Request missing _id:", request);
      return;
    }

    setSelectedRequestForScheduling(request);
    setShowSchedulingModal(true);
  };

  const handleSchedulingComplete = () => {
    // Refresh all data to get the latest state
    refreshData();
  };

  const handleEventClick = (event: any) => {
    // Handle calendar event click - could open meeting details
    console.log("Event clicked:", event);
  };

  const handleDateClick = (date: Date) => {
    // Handle date click - could open scheduling modal for that date
    console.log("Date clicked:", date);
  };

  const handleRejectRequest = (request: DashboardAdoptionRequest) => {
    setSelectedRequestForRejection(request);
    setShowRejectionModal(true);
  };

  const handleRejectionConfirm = async (
    rejectionReason: string,
    rejectionDetails: string
  ) => {
    if (selectedRequestForRejection) {
      await handleRequestAction(
        selectedRequestForRejection._id,
        "rejected",
        rejectionReason,
        rejectionDetails
      );
    }
  };

  // Quick Action Cards Component
  const QuickActionCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <Card
        className="hover:shadow-lg transition-shadow cursor-pointer"
        onClick={() => navigate("/shelter/pets")}
      >
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <PawPrint className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Manage Pets</p>
                <p className="text-lg font-bold text-gray-900">{pets.length}</p>
              </div>
            </div>
            <ArrowRight className="h-5 w-5 text-gray-400" />
          </div>
        </CardContent>
      </Card>

      <Card
        className="hover:shadow-lg transition-shadow cursor-pointer"
        onClick={() => navigate("/shelter/adoption-requests")}
      >
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <FileText className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Adoption Requests
                </p>
                <p className="text-lg font-bold text-gray-900">
                  {stats?.adoptionStats?.byStatus?.pending?.count || 0} pending
                </p>
              </div>
            </div>
            <ArrowRight className="h-5 w-5 text-gray-400" />
          </div>
        </CardContent>
      </Card>

      <Card
        className="hover:shadow-lg transition-shadow cursor-pointer"
        onClick={() => navigate("/shelter/scheduling")}
      >
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Calendar className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Scheduling</p>
                <p className="text-lg font-bold text-gray-900">
                  {allMeetings.length} meetings
                </p>
              </div>
            </div>
            <ArrowRight className="h-5 w-5 text-gray-400" />
          </div>
        </CardContent>
      </Card>

      <Card
        className="hover:shadow-lg transition-shadow cursor-pointer"
        onClick={() => navigate("/shelter/reports")}
      >
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="p-3 bg-orange-100 rounded-lg">
                <BarChart3 className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Reports</p>
                <p className="text-lg font-bold text-gray-900">
                  {stats?.adoptionStats?.successRate || "0%"} success
                </p>
              </div>
            </div>
            <ArrowRight className="h-5 w-5 text-gray-400" />
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Overview Stats Cards
  const OverviewStats = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Pets</p>
              <p className="text-2xl font-bold text-gray-900">{pets.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Available</p>
              <p className="text-2xl font-bold text-gray-900">
                {pets.filter((pet) => pet.status === "adoptable").length}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Pending Requests
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {stats?.adoptionStats?.byStatus?.pending?.count || 0}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Star className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg Rating</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats?.reviewStats.avgRating?.toFixed(1) || "0.0"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Eye className="h-6 w-6 text-indigo-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Profile Views</p>
              <p className="text-2xl font-bold text-gray-900">{profileViews}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Recent Activity Section
  const RecentActivity = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <Card>
        <CardHeader className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Recent Pets</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/shelter/pets")}
            className="text-blue-600 hover:text-blue-700"
          >
            View All <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats?.recentActivity.recentPets?.slice(0, 5).map((pet: any) => (
              <div
                key={pet._id}
                className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer"
                onClick={() => navigate(`/shelter/pets/${pet._id}`)}
              >
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                    <span className="text-sm font-medium">
                      {pet.name?.[0] || "?"}
                    </span>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">
                      {pet.name || "Unknown Pet"}
                    </p>
                    <p className="text-sm text-gray-500">
                      {pet.breeds?.primary || pet.breed || "Unknown Breed"} •{" "}
                      {pet.age}
                    </p>
                  </div>
                </div>
                <Badge
                  variant={pet.status === "adoptable" ? "success" : "secondary"}
                >
                  {pet.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Recent Reviews</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/shelter/reviews")}
            className="text-blue-600 hover:text-blue-700"
          >
            View All <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats?.recentActivity.recentReviews
              ?.slice(0, 5)
              .map((review: any) => (
                <div
                  key={review._id}
                  className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer"
                  onClick={() => navigate("/shelter/reviews")}
                >
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                      <span className="text-sm font-medium">
                        {review.user?.name?.[0] || "?"}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-medium text-gray-900">
                        {review.user.name || "Unknown User"}
                      </p>
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < review.rating
                                ? "text-yellow-400 fill-current"
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 truncate">
                      {review.comment}
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Alerts Section
  const AlertsSection = () => {
    const alerts = [];

    if (
      stats?.adoptionStats?.byStatus?.pending?.count &&
      stats.adoptionStats.byStatus.pending.count > 5
    ) {
      alerts.push({
        type: "warning",
        message: `${stats.adoptionStats.byStatus.pending.count} pending adoption requests need attention`,
        action: () => navigate("/shelter/adoption-requests?status=pending"),
      });
    }

    if (pets.filter((pet) => pet.status === "adoptable").length < 5) {
      alerts.push({
        type: "info",
        message: "Low inventory of available pets. Consider adding more pets.",
        action: () => navigate("/shelter/pets/create"),
      });
    }

    if (stats?.reviewStats?.avgRating && stats.reviewStats.avgRating < 4.0) {
      alerts.push({
        type: "warning",
        message: "Average rating is below 4.0. Review recent feedback.",
        action: () => navigate("/shelter/reviews"),
      });
    }

    if (alerts.length === 0) {
      return (
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-900">
                  All systems running smoothly!
                </p>
                <p className="text-sm text-gray-500">
                  No urgent alerts at this time.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className="mb-8">
        <CardHeader>
          <h3 className="text-lg font-semibold flex items-center">
            <Bell className="h-5 w-5 mr-2 text-orange-500" />
            Alerts & Notifications
          </h3>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {alerts.map((alert, index) => (
              <div
                key={index}
                className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                  alert.type === "warning"
                    ? "bg-orange-50 border border-orange-200 hover:bg-orange-100"
                    : "bg-blue-50 border border-blue-200 hover:bg-blue-100"
                }`}
                onClick={alert.action}
              >
                <div className="flex items-center">
                  <AlertTriangle
                    className={`h-5 w-5 mr-3 ${
                      alert.type === "warning"
                        ? "text-orange-500"
                        : "text-blue-500"
                    }`}
                  />
                  <p className="text-sm font-medium text-gray-900">
                    {alert.message}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-gray-400" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  const tabContent = [
    {
      id: "overview",
      label: "Overview",
      icon: BarChart3,
      content: (
        <div className="space-y-6">
          {/* Quick Action Cards */}
          <QuickActionCards />

          {/* Alerts Section */}
          <AlertsSection />

          {/* Overview Stats */}
          <OverviewStats />

          {/* Recent Activity */}
          <RecentActivity />
        </div>
      ),
    },
    {
      id: "reports",
      label: "Analytics",
      icon: TrendingUp,
      content: (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Analytics
          </h2>

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="trends">Trend Analysis</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Analytics Dashboard */}
              <AnalyticsDashboard />

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <h3 className="text-lg font-semibold">
                      Adoption Success Rate
                    </h3>
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
                              (sum: any, stat: any) => sum + stat.count,
                              0
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Successful Adoptions</span>
                          <span className="font-medium">
                            {stats?.adoptionStats?.byStatus?.completed?.count ||
                              0}
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
              </div>
            </TabsContent>

            <TabsContent value="trends" className="space-y-6">
              <TrendAnalysis />
            </TabsContent>

            <TabsContent value="performance" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <h3 className="text-lg font-semibold">
                      Monthly Performance
                    </h3>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {stats?.petStats.monthlyStats
                        ?.slice(0, 6)
                        .map((month: any) => (
                          <div
                            key={`pet-stats-${month._id.year}-${month._id.month}-${month._id.status}`}
                            className="flex items-center justify-between"
                          >
                            <div>
                              <p className="font-medium">
                                {formatDisplayDateTime(
                                  new Date(month._id.year, month._id.month - 1)
                                )}
                              </p>
                              <p className="text-sm text-gray-500">
                                {month._id.status}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">{month.count} pets</p>
                            </div>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <h3 className="text-lg font-semibold">Monthly Adoptions</h3>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {stats?.adoptionStats.monthlyAdoptions
                        ?.slice(0, 6)
                        .map((month: any) => (
                          <div
                            key={`adoption-stats-${month._id.year}-${month._id.month}`}
                            className="flex items-center justify-between"
                          >
                            <div>
                              <p className="font-medium">
                                {formatDisplayDateTime(
                                  new Date(month._id.year, month._id.month - 1)
                                )}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">
                                {month.count} adoptions
                              </p>
                            </div>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold">Review Statistics</h3>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-yellow-600">
                        {stats?.reviewStats.avgRating?.toFixed(1) || "0.0"}
                      </div>
                      <p className="text-gray-500">Average Rating</p>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600">
                        {stats?.reviewStats.total || 0}
                      </div>
                      <p className="text-gray-500">Total Reviews</p>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600">
                        {stats?.reviewStats.recentReviews?.length || 0}
                      </div>
                      <p className="text-gray-500">Recent Reviews</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      ),
    },
    {
      id: "feedback",
      label: "Feedback/Reviews",
      icon: Star,
      content: (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Feedback & Reviews
            </h2>
            <Button
              variant="outline"
              onClick={() => navigate("/shelter/reviews")}
              className="text-blue-600 hover:text-blue-700"
            >
              View All Reviews <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Recent Reviews</h3>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats?.recentActivity.recentReviews?.map((review: any) => (
                    <div
                      key={review._id}
                      className="border-b pb-4 last:border-b-0"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                            <span className="text-sm font-medium">
                              {review.user?.name?.[0] || "?"}
                            </span>
                          </div>
                          <span className="font-medium">
                            {review.user.name || "Unknown User"}
                          </span>
                        </div>
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < review.rating
                                  ? "text-yellow-400 fill-current"
                                  : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-gray-600 text-sm">{review.comment}</p>
                      <p className="text-gray-400 text-xs mt-2">
                        {formatDisplayDate(new Date(review.createdAt))}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Review Statistics</h3>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-yellow-600">
                      {stats?.reviewStats.avgRating?.toFixed(1) || "0.0"}
                    </div>
                    <p className="text-gray-500">Average Rating</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Total Reviews</span>
                      <span className="font-medium">
                        {stats?.reviewStats.total || 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>5-Star Reviews</span>
                      <span className="font-medium">
                        {(() => {
                          const fiveStarRating =
                            stats?.reviewStats?.ratingBreakdown?.find(
                              (rating: any) => rating._id === 5
                            );
                          return fiveStarRating?.count || 0;
                        })()}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ),
    },
  ];

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
      <div className="w-full py-8 px-4 sm:px-6 lg:px-10">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-red-600">
            Error Loading Dashboard
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
    <div className="w-full py-8 px-4 sm:px-6 lg:px-10">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {user.name} Dashboard
          </h1>
          <p className="text-gray-600">
            Manage your pets, adoption requests, and shelter profile
          </p>
        </div>
        <div className="flex space-x-4 mt-4 md:mt-0">
          <NotificationCenter />
          <Button
            variant="outline"
            leftIcon={Settings}
            onClick={() => navigate("/shelter/settings")}
          >
            Settings
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="grid w-full grid-cols-3">
          {tabContent.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id}>
              <tab.icon className="h-4 w-4 mr-2" />
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {tabContent.map((tab) => (
          <TabsContent key={tab.id} value={tab.id}>
            {tab.content}
          </TabsContent>
        ))}
      </Tabs>

      {/* Scheduling Modal */}
      {showSchedulingModal && selectedRequestForScheduling && (
        <SchedulingModal
          isOpen={showSchedulingModal}
          onClose={() => {
            setShowSchedulingModal(false);
            setSelectedRequestForScheduling(null);
          }}
          requestId={selectedRequestForScheduling._id}
          requestData={{
            user: {
              id: selectedRequestForScheduling.user.id,
              name: selectedRequestForScheduling.user.name,
              email: selectedRequestForScheduling.user.email,
            },
            pet: selectedRequestForScheduling.pet
              ? {
                  id: selectedRequestForScheduling.pet.id,
                  name: selectedRequestForScheduling.pet.name,
                }
              : undefined,
          }}
          onScheduled={handleSchedulingComplete}
        />
      )}

      {/* Rejection Reason Modal */}
      {showRejectionModal && selectedRequestForRejection && (
        <RejectionReasonModal
          isOpen={showRejectionModal}
          onClose={() => {
            setShowRejectionModal(false);
            setSelectedRequestForRejection(null);
          }}
          onConfirm={handleRejectionConfirm}
          requestId={selectedRequestForRejection._id}
          petName={selectedRequestForRejection.pet?.name || "Unknown Pet"}
          userName={selectedRequestForRejection.user.name}
        />
      )}
    </div>
  );
};

export default Dashboard;
