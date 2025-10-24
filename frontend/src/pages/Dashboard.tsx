import React, { useState, useEffect } from "react";
import { formatDisplayDate } from "@/utils/dateUtils";
import { useNavigate, Link } from "react-router-dom";
import { userApi, adoptionApi, petApi } from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import {
  LayoutDashboard,
  Heart,
  FileText,
  MessageSquare,
  TrendingUp,
  Users,
  PawPrint,
  Calendar,
  Bell,
  Settings,
  ArrowRight,
  Clock,
  CheckCircle,
  AlertCircle,
  Star,
  Eye,
  Plus,
  Search,
  MapPin,
  Phone,
  Mail,
  User,
  Award,
  BarChart3,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { PetCard } from "@/components/pet/PetCard";
import { useRecommendations } from "@/hooks/useRecommendations";
import { useFavoritePets } from "@/hooks/useFavoritePets";
import { useToastContext } from "@/components/ui/ToastProvider";

interface DashboardStats {
  totalFavorites: number;
  totalAdoptionRequests: number;
  pendingRequests: number;
  approvedRequests: number;
  completedAdoptions: number;
  totalViewedPets: number;
  lastActivity: string;
}

interface AdoptionRequest {
  _id: string;
  pet: {
    _id: string;
    name: string;
    photos: Array<{ url: string; isMain: boolean }>;
    breed: string;
    type: string;
  };
  shelter: {
    name: string;
    location: string;
  };
  status: "pending" | "approved" | "rejected" | "completed";
  createdAt: string;
  updatedAt: string;
}

const Dashboard: React.FC = () => {
  const { user, refreshUserProfile } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToastContext();
  const { toggleFavoritePet, isPetFavorited, favoritePets } = useFavoritePets();
  const { recommendations, loading: recommendationsLoading } =
    useRecommendations();

  // Debug logging for recommendations
  useEffect(() => {
    if (recommendations && recommendations.length > 0) {
      console.log("🐾 Dashboard - Recommendations received:", recommendations);
      console.log(
        "🐾 Dashboard - First recommendation structure:",
        recommendations[0]
      );
    }
  }, [recommendations]);

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentAdoptionRequests, setRecentAdoptionRequests] = useState<
    AdoptionRequest[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch data in parallel
      const [profileResponse, adoptionResponse] = await Promise.all([
        userApi.getProfile(),
        adoptionApi.getUserRequests({ limit: 5 }),
      ]);

      // Process profile data for stats
      const profileData = profileResponse.data?.data || profileResponse.data;
      const adoptionData = adoptionResponse.data;

      console.log("🐾 Dashboard - Profile data:", profileData);
      console.log("🐾 Dashboard - Adoption data:", adoptionData);

      const dashboardStats: DashboardStats = {
        totalFavorites: profileData.favoritePets?.length || 0,
        totalAdoptionRequests: adoptionData.length || 0,
        pendingRequests: adoptionData.filter(
          (req: any) => req.status === "pending"
        ).length,
        approvedRequests: adoptionData.filter(
          (req: any) => req.status === "approved"
        ).length,
        completedAdoptions: adoptionData.filter(
          (req: any) => req.status === "completed"
        ).length,
        totalViewedPets: profileData.viewedPets?.length || 0,
        lastActivity: profileData.updatedAt || new Date().toISOString(),
      };

      setStats(dashboardStats);

      // Transform adoption data to match the expected interface
      const transformedAdoptionRequests = adoptionData
        .slice(0, 3)
        .map((req: any) => {
          console.log("🐾 Processing adoption request:", req);
          // Use petDetails (populated from backend) instead of pet
          const petData = req.petDetails || req.pet;
          const shelterData = req.shelterDetails || req.shelter;

          return {
            _id: req._id || "",
            pet: {
              _id: petData?._id || petData?.id || "",
              name: petData?.name || "Unknown Pet",
              photos: petData?.photos || [],
              breed: petData?.breed || "Unknown Breed",
              type: petData?.type || "Unknown Type",
            },
            shelter: {
              name: shelterData?.name || "Unknown Shelter",
              location: shelterData?.location || "Unknown Location",
            },
            status: req.status || "unknown",
            createdAt: req.createdAt || new Date().toISOString(),
            updatedAt:
              req.updatedAt || req.createdAt || new Date().toISOString(),
          };
        });

      console.log(
        "🐾 Dashboard - Transformed adoption requests:",
        transformedAdoptionRequests
      );
      setRecentAdoptionRequests(transformedAdoptionRequests);

      // Recent activity will be updated by the useEffect hook
    } catch (err: any) {
      console.error("Failed to fetch dashboard data:", err);
      setError(err.message || "Failed to load dashboard data");
      showToast({
        type: "error",
        title: "Error",
        description: "Failed to load dashboard data",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFavoriteToggle = async (petId: string) => {
    try {
      await toggleFavoritePet(petId);
      // Refresh dashboard data to update stats
      fetchDashboardData();
    } catch (error) {
      showToast({
        type: "error",
        title: "Error",
        description: "Failed to update favorite",
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "approved":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "rejected":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case "completed":
        return <Award className="h-4 w-4 text-blue-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="w-full py-8 px-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Please Log In
          </h1>
          <p className="text-gray-600">
            You need to be logged in to view your dashboard.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full py-8 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome back, {user?.name || "User"}!
            </h1>
            <p className="text-gray-600 mt-2">
              Your pet adoption dashboard - track your journey and discover your
              perfect companion
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Stats & Quick Actions - Combined */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card
            key="browse-pets"
            className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => navigate("/pets")}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Search className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      Browse Pets
                    </p>
                    <p className="text-lg font-bold text-gray-900">
                      Find your match
                    </p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-400" />
              </div>
            </CardContent>
          </Card>

          <Card
            key="my-favorites"
            className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => navigate("/favorites")}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="p-3 bg-pink-100 rounded-lg">
                    <Heart className="h-6 w-6 text-pink-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      My Favorites
                    </p>
                    <p className="text-lg font-bold text-gray-900">
                      {stats.totalFavorites} saved
                    </p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-400" />
              </div>
            </CardContent>
          </Card>

          <Card
            key="adoption-requests"
            className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => navigate("/adoptions")}
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
                      {stats.totalAdoptionRequests} total
                    </p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-400" />
              </div>
            </CardContent>
          </Card>

          <Card
            key="profile"
            className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => navigate("/dashboard/profile")}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <Settings className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Profile</p>
                    <p className="text-lg font-bold text-gray-900">
                      Manage settings
                    </p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-400" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Quick Favorites Carousel */}
      {stats && stats.totalFavorites > 0 && (
        <Card key="quick-favorites" className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-pink-600" />
                Your Favorites
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/favorites")}
                className="text-sm"
              >
                View All ({stats.totalFavorites})
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-4 overflow-x-auto pb-2">
              {favoritePets.slice(0, 5).map((pet, index) => (
                <div
                  key={pet._id || `favorite-${index}`}
                  className="flex-shrink-0 w-48 cursor-pointer group"
                  onClick={() => navigate(`/pets/${pet._id}`)}
                >
                  <div className="bg-white border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                    <img
                      src={
                        (pet.photos && pet.photos[0]?.url) ||
                        "/placeholder-pet.jpg"
                      }
                      alt={pet.name || "Pet"}
                      className="w-full h-32 object-cover"
                    />
                    <div className="p-3">
                      <h4 className="font-semibold text-gray-900 text-sm truncate">
                        {pet.name || "Unknown Pet"}
                      </h4>
                      <p className="text-xs text-gray-500 truncate">
                        {pet.breed || "Unknown Breed"} •{" "}
                        {pet.age || "Unknown Age"}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-gray-400">
                          {pet.type || "Unknown Type"}
                        </span>
                        <div className="flex items-center text-pink-500">
                          <Heart className="h-3 w-3 fill-current" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {favoritePets.length === 0 && (
              <div className="text-center py-6">
                <Heart className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">No favorites yet</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("/pets")}
                  className="mt-2"
                >
                  Browse Pets
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Requests Overview */}
      {stats && (
        <Card key="requests-overview" className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Requests Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Pending Requests */}
              <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Clock className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      Pending Requests
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.pendingRequests}
                    </p>
                    {stats.pendingRequests === 0 && (
                      <p className="text-xs text-gray-500 mt-1">
                        No pending requests
                      </p>
                    )}
                  </div>
                </div>
                {stats.pendingRequests === 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate("/pets")}
                    className="text-xs"
                  >
                    Browse Pets
                  </Button>
                )}
              </div>

              {/* Approved Requests */}
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      Approved Requests
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.approvedRequests}
                    </p>
                    {stats.approvedRequests === 0 && (
                      <p className="text-xs text-gray-500 mt-1">
                        No approved requests yet
                      </p>
                    )}
                  </div>
                </div>
                {stats.approvedRequests === 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate("/pets")}
                    className="text-xs"
                  >
                    Explore Pets
                  </Button>
                )}
              </div>

              {/* Completed Adoptions */}
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Award className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      Completed Adoptions
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.completedAdoptions}
                    </p>
                    {stats.completedAdoptions === 0 && (
                      <p className="text-xs text-gray-500 mt-1">
                        No adoptions completed yet
                      </p>
                    )}
                  </div>
                </div>
                {stats.completedAdoptions === 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate("/pets")}
                    className="text-xs"
                  >
                    Explore Pets
                  </Button>
                )}
              </div>
            </div>

            {/* Additional Stats Row */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Pets Viewed */}
                <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="flex items-center">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Eye className="h-6 w-6 text-purple-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">
                        Pets Viewed
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {stats.totalViewedPets}
                      </p>
                      {stats.totalViewedPets === 0 && (
                        <p className="text-xs text-gray-500 mt-1">
                          Start browsing to see pets
                        </p>
                      )}
                    </div>
                  </div>
                  {stats.totalViewedPets === 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate("/pets")}
                      className="text-xs"
                    >
                      Browse Now
                    </Button>
                  )}
                </div>

                {/* Total Requests Summary */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <FileText className="h-6 w-6 text-gray-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">
                        Total Requests
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {stats.totalAdoptionRequests}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        All time requests
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate("/adoptions")}
                    className="text-xs"
                  >
                    View All
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Adoption Requests */}
        <Card key="recent-adoption-requests">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Recent Adoption Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentAdoptionRequests.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No adoption requests yet</p>
                <Button variant="outline" onClick={() => navigate("/pets")}>
                  <Plus className="h-4 w-4 mr-2" />
                  Browse Pets
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Adoption Process Timeline */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">
                    Adoption Process
                  </h4>
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center mb-2">
                        <Clock className="h-4 w-4 text-yellow-600" />
                      </div>
                      <span className="text-xs text-gray-600">Pending</span>
                    </div>
                    <div className="flex-1 h-0.5 bg-gray-300 mx-2"></div>
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mb-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      </div>
                      <span className="text-xs text-gray-600">Approved</span>
                    </div>
                    <div className="flex-1 h-0.5 bg-gray-300 mx-2"></div>
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mb-2">
                        <Award className="h-4 w-4 text-blue-600" />
                      </div>
                      <span className="text-xs text-gray-600">Completed</span>
                    </div>
                  </div>
                </div>

                {/* Enhanced Request Cards */}
                {recentAdoptionRequests.map((request, index) => (
                  <div
                    key={request._id || `request-${index}`}
                    className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                  >
                    <div className="p-4">
                      <div className="flex items-start space-x-4">
                        {/* Larger Pet Image */}
                        <img
                          src={
                            (request.pet.photos &&
                              request.pet.photos[0]?.url) ||
                            "/placeholder-pet.jpg"
                          }
                          alt={request.pet.name || "Pet"}
                          className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                        />

                        {/* Pet Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h4 className="font-semibold text-gray-900 text-lg">
                                {request.pet.name || "Unknown Pet"}
                              </h4>
                              <p className="text-sm text-gray-600">
                                {request.pet.breed || "Unknown Breed"} •{" "}
                                {request.pet.type || "Unknown Type"}
                              </p>
                            </div>
                            <div className="flex items-center space-x-2">
                              {getStatusIcon(request.status)}
                              <Badge
                                className={`${getStatusColor(
                                  request.status
                                )} font-semibold text-sm px-3 py-1`}
                              >
                                {request.status.charAt(0).toUpperCase() +
                                  request.status.slice(1)}
                              </Badge>
                            </div>
                          </div>

                          {/* Shelter Info */}
                          <div className="flex items-center text-sm text-gray-500 mb-2">
                            <MapPin className="h-4 w-4 mr-1" />
                            <span>
                              {request.shelter.name || "Unknown Shelter"}
                            </span>
                            <span className="mx-2">•</span>
                            <span>
                              {typeof request.shelter.location === "string"
                                ? request.shelter.location
                                : (request.shelter.location as any)
                                    ?.formatted ||
                                  (request.shelter.location as any)?.details ||
                                  "Unknown Location"}
                            </span>
                          </div>

                          {/* Request Timeline */}
                          <div className="flex items-center justify-between text-xs text-gray-400">
                            <span>
                              Requested: {formatDisplayDate(request.createdAt)}
                            </span>
                            <span>
                              Updated: {formatDisplayDate(request.updatedAt)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Status-specific next steps */}
                      <div className="mt-4 pt-3 border-t border-gray-100">
                        {request.status === "pending" && (
                          <div className="flex items-center text-sm text-yellow-700 bg-yellow-50 rounded-lg p-3">
                            <Clock className="h-4 w-4 mr-2" />
                            <span>
                              Your request is under review. The shelter will
                              contact you soon.
                            </span>
                          </div>
                        )}
                        {request.status === "approved" && (
                          <div className="flex items-center text-sm text-green-700 bg-green-50 rounded-lg p-3">
                            <CheckCircle className="h-4 w-4 mr-2" />
                            <span>
                              Congratulations! Your request has been approved.
                              Contact the shelter to arrange pickup.
                            </span>
                          </div>
                        )}
                        {request.status === "completed" && (
                          <div className="flex items-center text-sm text-blue-700 bg-blue-50 rounded-lg p-3">
                            <Award className="h-4 w-4 mr-2" />
                            <span>
                              Adoption completed! Thank you for giving this pet
                              a loving home.
                            </span>
                          </div>
                        )}
                        {request.status === "rejected" && (
                          <div className="flex items-center text-sm text-red-700 bg-red-50 rounded-lg p-3">
                            <AlertCircle className="h-4 w-4 mr-2" />
                            <span>
                              This request was not approved. Consider browsing
                              other available pets.
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {recentAdoptionRequests.length > 0 && (
                  <div className="pt-4">
                    <Button
                      variant="outline"
                      onClick={() => navigate("/adoptions")}
                      className="w-full"
                    >
                      View All Requests
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Personalized Recommendations */}
        <Card key="personalized-recommendations">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Recommended for You
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recommendationsLoading ? (
              <div className="flex items-center justify-center py-8">
                <LoadingSpinner />
              </div>
            ) : recommendations && recommendations.length > 0 ? (
              <div className="space-y-4">
                {recommendations.slice(0, 3).map((recommendation, index) => {
                  // Handle both direct pet objects and recommendation objects
                  const pet = (recommendation as any).pet || recommendation;
                  const score =
                    (recommendation as any).score ||
                    (recommendation as any).matchScore;

                  // Helper function to calculate distance (if location data available)
                  const calculateDistance = (
                    petLocation: any,
                    userLocation: any
                  ) => {
                    if (!petLocation || !userLocation) return null;
                    // Simple distance calculation - you might want to use a proper geolocation library
                    return "2.3 miles away"; // Placeholder - implement actual distance calculation
                  };

                  return (
                    <div
                      key={pet._id || pet.id || `pet-${index}`}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <img
                          src={
                            (pet.photos && pet.photos[0]?.url) ||
                            "/placeholder-pet.jpg"
                          }
                          alt={pet.name || "Pet"}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-gray-900 text-base">
                              {pet.name || "Unknown Pet"}
                            </h4>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                pet._id && handleFavoriteToggle(pet._id);
                              }}
                              className={`p-1 h-6 w-6 ${
                                pet._id && isPetFavorited(pet._id)
                                  ? "text-pink-500 hover:text-pink-600 hover:bg-pink-50"
                                  : "text-gray-400 hover:text-pink-500 hover:bg-pink-50"
                              }`}
                            >
                              <Heart
                                className={`h-4 w-4 ${
                                  pet._id && isPetFavorited(pet._id)
                                    ? "fill-current"
                                    : ""
                                }`}
                              />
                            </Button>
                            <div className="flex items-center space-x-1">
                              <Star className="h-3 w-3 text-yellow-400" />
                              <span className="text-xs text-gray-500 font-medium">
                                {score
                                  ? `${Math.round(score * 100)}% match`
                                  : "Recommended"}
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mb-2">
                            <div className="flex items-center gap-1">
                              <span className="font-medium">Breed:</span>
                              <span>{pet.breed || "Unknown"}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="font-medium">Age:</span>
                              <span>{pet.age || "Unknown"}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="font-medium">Gender:</span>
                              <span className="capitalize">
                                {pet.gender || "Unknown"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() =>
                            pet._id && navigate(`/pets/${pet._id}`)
                          }
                          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2"
                        >
                          View Profile
                        </Button>
                      </div>
                    </div>
                  );
                })}
                <div className="pt-4">
                  <Button
                    variant="outline"
                    onClick={() => navigate("/recommendations")}
                    className="w-full"
                  >
                    View All Recommendations
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No recommendations yet</p>
                <p className="text-sm text-gray-400">
                  Start browsing pets to get personalized recommendations
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
