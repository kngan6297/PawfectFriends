import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { petApi } from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import { useShelterDataContext } from "@/context/ShelterDataContext";
import { format } from "date-fns";
import {
  Star,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Filter,
  RefreshCw,
  TrendingUp,
  Users,
  Heart,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
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
import { useNavigate } from "react-router-dom";
import { formatDisplayDate } from "@/utils/dateUtils";

interface Review {
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
  rating: number;
  comment: string;
  createdAt: string;
  helpful: number;
  notHelpful: number;
}

const ShelterReviews: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { stats, isLoading, error, refreshData } = useShelterDataContext();
  const [ratingFilter, setRatingFilter] = useState<string>("all");
  const [reviews, setReviews] = useState<Review[]>([]);

  // Use reviews from context if available, otherwise fetch separately
  useEffect(() => {
    console.log("Reviews useEffect triggered:", {
      hasStats: !!stats,
      hasReviewStats: !!stats?.reviewStats,
      hasRecentReviews: !!stats?.reviewStats?.recentReviews,
      recentReviewsLength: stats?.reviewStats?.recentReviews?.length,
      recentReviews: stats?.reviewStats?.recentReviews,
    });

    // Debug: Log the first review structure if available
    if (
      stats?.reviewStats?.recentReviews &&
      stats.reviewStats.recentReviews.length > 0
    ) {
      console.log("First review raw data:", stats.reviewStats.recentReviews[0]);
      console.log(
        "First review adoption data:",
        stats.reviewStats.recentReviews[0]?.adoption
      );
      console.log(
        "First review pet data:",
        stats.reviewStats.recentReviews[0]?.adoption?.pet
      );
    }

    if (
      stats?.reviewStats?.recentReviews &&
      stats.reviewStats.recentReviews.length > 0
    ) {
      // Transform the reviews from context to match the Review interface
      const transformedReviews = stats.reviewStats.recentReviews.map(
        (review: any) => ({
          _id: review._id,
          user: {
            id: review.user?._id || review.user?.id || "unknown",
            name: review.user?.name || "Unknown User",
            email: review.user?.email || "No email",
          },
          pet: review.adoption?.pet
            ? {
                id: review.adoption.pet._id || review.adoption.pet.id,
                name: review.adoption.pet.name || "Unknown Pet",
                photos: review.adoption.pet.photos || [],
              }
            : null,
          rating: review.rating,
          comment: review.comment,
          createdAt: review.createdAt,
          helpful: review.helpfulCount || 0,
          notHelpful: 0, // Not implemented yet
        })
      );
      console.log("Transformed reviews:", transformedReviews);
      setReviews(transformedReviews);
    } else {
      console.log("No recent reviews in context, fetching separately...");
      // Fallback to fetching reviews separately
      fetchReviews();
    }
  }, [stats?.reviewStats?.recentReviews]);

  // For now, we'll keep reviews as local state since they're not in the context yet
  // In the future, this could be moved to the context as well
  const fetchReviews = async () => {
    try {
      if (!user?._id) {
        toast.error("User not authenticated");
        return;
      }
      console.log("Fetching reviews for shelter:", user._id);
      const response = await petApi.getShelterReviews(user._id);
      console.log("Reviews API response:", response.data);
      console.log("Reviews API response type:", typeof response.data);
      console.log(
        "Reviews API response keys:",
        Object.keys(response.data || {})
      );

      // Handle different response structures
      let reviewsData = response.data;
      if (response.data?.data) {
        reviewsData = response.data.data; // If response is wrapped in data property
        console.log("Found nested data property:", reviewsData);
      }

      // Ensure we have an array
      if (Array.isArray(reviewsData)) {
        console.log("Setting reviews array with", reviewsData.length, "items");
        setReviews(reviewsData);
      } else {
        console.error("Reviews data is not an array:", reviewsData);
        console.error("Reviews data type:", typeof reviewsData);
        setReviews([]);
        toast.error("Invalid reviews data format");
      }
    } catch (err: any) {
      console.error("Error fetching reviews:", err);
      toast.error("Failed to load reviews");
      setReviews([]); // Set empty array on error
    }
  };

  // Ensure reviews is always an array
  const reviewsArray = Array.isArray(reviews) ? reviews : [];

  const filteredReviews = reviewsArray.filter((review) => {
    if (ratingFilter === "all") return true;
    return review.rating === parseInt(ratingFilter);
  });

  // Calculate positive and negative reviews based on rating
  const positiveReviews = reviewsArray.filter(
    (review) => review.rating >= 4
  ).length;
  const negativeReviews = reviewsArray.filter(
    (review) => review.rating <= 2
  ).length;

  // Get rating breakdown from context if available
  const ratingBreakdown = stats?.reviewStats?.ratingBreakdown || [];

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return "text-green-600";
    if (rating >= 3) return "text-yellow-600";
    return "text-red-600";
  };

  const renderStars = (rating: number) => {
    return [...Array(5)].map((_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating ? "text-yellow-400 fill-current" : "text-gray-300"
        }`}
      />
    ));
  };

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
            Error Loading Reviews
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
          <h1 className="text-2xl font-bold text-gray-900">Reviews</h1>
          <p className="text-gray-600">View and manage reviews from adopters</p>
        </div>
        <div className="flex space-x-4 mt-4 md:mt-0">
          <Button
            variant="outline"
            leftIcon={RefreshCw}
            onClick={() => {
              refreshData();
              fetchReviews();
            }}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Star className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Average Rating
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.reviewStats?.avgRating?.toFixed(1) || "0.0"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <MessageSquare className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Total Reviews
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.reviewStats?.total || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <ThumbsUp className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Positive Reviews
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {positiveReviews}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <ThumbsDown className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Negative Reviews
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {negativeReviews}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rating Distribution */}
      <Card className="mb-8">
        <CardHeader>
          <h3 className="text-lg font-semibold">Rating Distribution</h3>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[5, 4, 3, 2, 1].map((rating) => {
              const ratingItem = ratingBreakdown.find(
                (item: any) => item._id === rating
              );
              const count = ratingItem?.count || 0;
              const percentage =
                stats?.reviewStats?.total > 0
                  ? (count / stats.reviewStats.total) * 100
                  : 0;

              return (
                <div key={rating} className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2 w-20">
                    <span className="text-sm font-medium">{rating}</span>
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                  </div>
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-yellow-400 h-2 rounded-full"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <div className="w-16 text-right">
                    <span className="text-sm font-medium">{count}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div>
              <label
                htmlFor="rating-filter"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Filter by Rating
              </label>
              <Select
                value={ratingFilter}
                onValueChange={(value: any) => setRatingFilter(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select rating" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Ratings</SelectItem>
                  <SelectItem value="5">5 Stars</SelectItem>
                  <SelectItem value="4">4 Stars</SelectItem>
                  <SelectItem value="3">3 Stars</SelectItem>
                  <SelectItem value="2">2 Stars</SelectItem>
                  <SelectItem value="1">1 Star</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="text-sm text-gray-500">
            {filteredReviews.length} of {reviewsArray.length} reviews
          </div>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-6">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading reviews...</p>
          </div>
        ) : filteredReviews.length > 0 ? (
          filteredReviews.map((review) => (
            <Card key={review._id}>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row">
                  <div className="flex-shrink-0">
                    <img
                      src={
                        review.pet?.photos?.[0]?.url || "/placeholder-pet.jpg"
                      }
                      alt={review.pet?.name || "Pet"}
                      className="h-24 w-24 rounded-lg object-cover"
                    />
                  </div>
                  <div className="md:ml-6 mt-4 md:mt-0 flex-grow">
                    <div className="flex flex-col md:flex-row md:justify-between md:items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="text-lg font-medium text-gray-900">
                            {review.pet?.name || "Pet Not Available"}
                          </h3>
                          <Badge variant="secondary">
                            {review.pet?.name ? "Pet Review" : "General Review"}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-500 mb-2">
                          Review by: {review.user?.name || "Unknown User"}
                        </p>
                        <p className="text-sm text-gray-500 mb-3">
                          {formatDisplayDate(new Date(review.createdAt))}
                        </p>

                        {/* Rating */}
                        <div className="flex items-center space-x-2 mb-3">
                          <div className="flex items-center space-x-1">
                            {renderStars(review.rating)}
                          </div>
                          <span
                            className={`text-sm font-medium ${getRatingColor(
                              review.rating
                            )}`}
                          >
                            {review.rating}/5
                          </span>
                        </div>

                        {/* Comment */}
                        <p className="text-gray-700 mb-4">{review.comment}</p>

                        {/* Helpful/Not Helpful */}
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <div className="flex items-center space-x-1">
                            <ThumbsUp className="h-4 w-4" />
                            <span>{review.helpful || 0} helpful</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <ThumbsDown className="h-4 w-4" />
                            <span>{review.notHelpful || 0} not helpful</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 md:mt-0 flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            review.user?.id
                              ? (window.location.href = `/chat/${review.user.id}`)
                              : toast.error("User information not available")
                          }
                          disabled={!review.user?.id}
                        >
                          Respond
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-12">
            <Star className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No reviews found
            </h3>
            <p className="text-gray-500">
              When users leave reviews for your shelter, they will appear here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShelterReviews;
