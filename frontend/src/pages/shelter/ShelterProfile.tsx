import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { shelterApi } from "@/services/api";
import { format, formatDistanceToNow } from "date-fns";
import {
  MapPin,
  Phone,
  Mail,
  Globe,
  Star,
  Heart,
  Users,
  Shield,
  Facebook,
  Twitter,
  Instagram,
  ArrowLeft,
  MessageSquare,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { Skeleton } from "@/components/ui/Skeleton";

interface Shelter {
  _id: string;
  name: string;
  bio?: string;
  phone: string;
  email: string;
  website?: string;
  avatar?: string;
  photos?: string[] | null;
  isVerified?: boolean;
  location?: {
    version?: string;
    province?: {
      code: number;
      name: string;
      codename: string;
      division_type: string;
      phone_code: number;
    };
    district?: {
      code: number;
      name: string;
      codename: string;
      division_type: string;
      province_code: number;
    };
    ward?: {
      code: number;
      name: string;
      codename: string;
      division_type: string;
      district_code: number;
    };
    details?: {
      street?: string;
      note?: string;
    };
    postalCode?: string;
    country?: string;
    formatted?: string;
    // Legacy fields for backward compatibility
    address?: {
      street?: string;
      ward?: string;
      district?: string;
    };
    city?: string;
    state?: string;
    zipCode?: string;
  };
  operatingHours?: {
    monday?: { open: string; close: string };
    tuesday?: { open: string; close: string };
    wednesday?: { open: string; close: string };
    thursday?: { open: string; close: string };
    friday?: { open: string; close: string };
    saturday?: { open: string; close: string };
    sunday?: { open: string; close: string };
  };
  adoptionProcess?: string;
  requirements?: string;
  socialMedia?: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
  };
  rating?: {
    average: number;
    count: number;
  };
  pets?: Array<{
    _id: string;
    name: string;
    type: string;
    breed: string;
    age: string;
    status: string;
    photos: Array<{ url: string }>;
  }>;
  reviews?: Array<{
    _id: string;
    rating: number;
    comment: string;
    createdAt: string;
  }>;
  profileViews?: number;
}

const ShelterProfile: React.FC = () => {
  const { shelterId } = useParams<{ shelterId: string }>();
  const navigate = useNavigate();
  const [shelter, setShelter] = useState<Shelter | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  // Filter and pagination state
  const [filters, setFilters] = useState({
    species: "",
    status: "",
    search: "",
  });
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);

  useEffect(() => {
    if (shelterId) {
      fetchShelterProfile();
    }
  }, [shelterId]);

  const fetchShelterProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("Fetching shelter profile for ID:", shelterId);
      const response = await shelterApi.getProfile(shelterId!);
      console.log("API Response:", response);
      console.log("Shelter data:", response.data);
      setShelter(response.data);
    } catch (err: any) {
      console.error("Error fetching shelter profile:", err);
      setError(err.response?.data?.message || "Failed to load shelter profile");
      toast.error("Failed to load shelter profile");
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number) => {
    // Clamp rating between 0-5 and round to nearest integer
    const clampedRating = Math.max(0, Math.min(5, Math.round(rating)));

    return [...Array(5)].map((_, i) => {
      const isFilled = i < clampedRating;
      const isHalf = i === Math.floor(rating) && rating % 1 >= 0.5;

      return (
        <Star
          key={i}
          className={`h-4 w-4 ${
            isFilled ? "text-yellow-400 fill-current" : "text-gray-300"
          }`}
          aria-hidden="true"
        />
      );
    });
  };

  // Image error fallback handler
  const handleImageError = (
    event: React.SyntheticEvent<HTMLImageElement, Event>
  ) => {
    const target = event.target as HTMLImageElement;
    target.src = PLACEHOLDER_IMAGE;
    target.onerror = null; // Prevent infinite loop
  };

  // Placeholder image for fallbacks
  const PLACEHOLDER_IMAGE = "/placeholder-pet.jpg";

  // Responsive image sizes for different contexts
  const getImageSizes = (context: "grid" | "preview" | "main") => {
    switch (context) {
      case "grid":
        return "(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw";
      case "preview":
        return "(max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw";
      case "main":
        return "(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw";
      default:
        return "100vw";
    }
  };

  const renderStarsWithLabel = (rating: number, showCount = false) => {
    const clampedRating = Math.max(0, Math.min(5, Math.round(rating)));
    const ariaLabel = `${clampedRating} out of 5 stars`;

    return (
      <div className="flex items-center" role="img" aria-label={ariaLabel}>
        {renderStars(rating)}
        {showCount && (
          <span className="ml-2 text-sm text-gray-600">
            {clampedRating.toFixed(1)} ({clampedRating} stars)
          </span>
        )}
      </div>
    );
  };

  const getOperatingHours = (day: string) => {
    if (!shelter?.operatingHours) return "Closed";
    const hours =
      shelter.operatingHours[day as keyof typeof shelter.operatingHours];
    if (!hours || !hours.open || !hours.close) return "Closed";
    return `${hours.open} - ${hours.close}`;
  };

  const getDayName = (day: string) => {
    if (!day) return "";
    return day.charAt(0).toUpperCase() + day.slice(1);
  };

  // Filter and sort pets
  const filteredPets = React.useMemo(() => {
    if (!shelter?.pets) return [];

    let filtered = [...shelter.pets];

    // Apply filters
    if (filters.species) {
      filtered = filtered.filter(
        (pet) => pet.type.toLowerCase() === filters.species.toLowerCase()
      );
    }
    if (filters.status) {
      filtered = filtered.filter((pet) => pet.status === filters.status);
    }
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (pet) =>
          pet.name.toLowerCase().includes(searchLower) ||
          pet.breed.toLowerCase().includes(searchLower)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortBy) {
        case "name":
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case "age":
          aValue = parseInt(a.age) || 0;
          bValue = parseInt(b.age) || 0;
          break;
        case "status":
          aValue = a.status;
          bValue = b.status;
          break;
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }

      if (sortOrder === "asc") {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return filtered;
  }, [shelter?.pets, filters, sortBy, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(filteredPets.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedPets = filteredPets.slice(startIndex, endIndex);

  // Pet statistics with useMemo to avoid recalculation
  const petStats = React.useMemo(() => {
    if (!shelter?.pets) {
      return {
        totalPets: 0,
        availablePets: [],
        pendingPets: [],
        adoptedPets: [],
        inTreatmentPets: [],
        fosteredPets: [],
      };
    }

    const pets = shelter.pets;
    return {
      totalPets: pets.length,
      availablePets: pets.filter((pet) => pet.status === "adoptable"),
      pendingPets: pets.filter((pet) => pet.status === "pending"),
      adoptedPets: pets.filter((pet) => pet.status === "adopted"),
      inTreatmentPets: pets.filter((pet) => pet.status === "in_treatment"),
      fosteredPets: pets.filter((pet) => pet.status === "fostered"),
    };
  }, [shelter?.pets]);

  const {
    totalPets,
    availablePets,
    pendingPets,
    adoptedPets,
    inTreatmentPets,
    fosteredPets,
  } = petStats;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <Skeleton className="h-8 w-64 mb-4" />
            <Skeleton className="h-4 w-96" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Skeleton className="h-96 w-full mb-6" />
              <Skeleton className="h-32 w-full mb-6" />
              <Skeleton className="h-64 w-full" />
            </div>
            <div>
              <Skeleton className="h-64 w-full mb-6" />
              <Skeleton className="h-48 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !shelter) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              {error || "Shelter not found"}
            </h1>
            <Button variant="primary" onClick={() => navigate("/pets")}>
              Browse Pets
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {shelter.name || "Shelter"}
              </h1>
              <div className="flex items-center space-x-4 text-gray-600">
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-1" />
                  <span>
                    {shelter.location?.district?.name ||
                      shelter.location?.city ||
                      "Unknown"}
                    ,{" "}
                    {shelter.location?.province?.name ||
                      shelter.location?.state ||
                      "Unknown"}
                  </span>
                </div>
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-1" />
                  <span>{totalPets} pets</span>
                </div>
                <div className="flex items-center">
                  <Eye className="h-4 w-4 mr-1" />
                  <span>{shelter.profileViews || 0} profile views</span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {renderStarsWithLabel(shelter.rating?.average || 0, true)}
              <span className="text-sm text-gray-600">
                ({shelter.rating?.count || 0} reviews)
              </span>
              {shelter.isVerified && (
                <Badge variant="secondary" className="ml-2">
                  <Shield className="h-3 w-3 mr-1" />
                  Verified
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <Tabs defaultValue={activeTab} onTabChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="pets">
                  Adoptable Pets ({availablePets.length})
                </TabsTrigger>
                <TabsTrigger value="all-pets">
                  All Pets ({totalPets})
                </TabsTrigger>
                <TabsTrigger value="reviews">Reviews</TabsTrigger>
                <TabsTrigger value="contact">Contact</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                {/* Quick Stats Summary */}
                <Card>
                  <CardHeader>
                    <h3 className="text-lg font-semibold">Quick Overview</h3>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {totalPets}
                        </div>
                        <div className="text-sm text-gray-600">Total Pets</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {availablePets.length}
                        </div>
                        <div className="text-sm text-gray-600">Adoptable</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-600">
                          {pendingPets.length}
                        </div>
                        <div className="text-sm text-gray-600">Pending</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {adoptedPets.length}
                        </div>
                        <div className="text-sm text-gray-600">Adopted</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Photos */}
                {shelter.photos &&
                  Array.isArray(shelter.photos) &&
                  shelter.photos.length > 0 && (
                    <Card>
                      <CardHeader>
                        <h3 className="text-lg font-semibold">
                          Shelter Photos
                        </h3>
                      </CardHeader>
                      <CardContent className="p-0">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 p-4">
                          {shelter.photos.slice(0, 6).map((photo, index) => (
                            <div
                              key={index}
                              className="aspect-square rounded-lg overflow-hidden"
                            >
                              <img
                                src={photo}
                                alt={`${shelter.name} photo ${index + 1}`}
                                className="w-full h-full object-cover"
                                loading="lazy"
                                sizes={getImageSizes("grid")}
                                onError={handleImageError}
                              />
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                {/* About */}
                {shelter.bio ? (
                  <Card>
                    <CardHeader>
                      <h3 className="text-lg font-semibold">About</h3>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700">{shelter.bio}</p>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardHeader>
                      <h3 className="text-lg font-semibold">About</h3>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-500 italic">
                        No description available for this shelter yet.
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Adoption Process */}
                {shelter.adoptionProcess ? (
                  <Card>
                    <CardHeader>
                      <h3 className="text-lg font-semibold">
                        Adoption Process
                      </h3>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700">{shelter.adoptionProcess}</p>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardHeader>
                      <h3 className="text-lg font-semibold">
                        Adoption Process
                      </h3>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-500 italic">
                        Contact the shelter directly to learn about their
                        adoption process.
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Requirements */}
                {shelter.requirements ? (
                  <Card>
                    <CardHeader>
                      <h3 className="text-lg font-semibold">Requirements</h3>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700">{shelter.requirements}</p>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardHeader>
                      <h3 className="text-lg font-semibold">Requirements</h3>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-500 italic">
                        Contact the shelter to learn about adoption
                        requirements.
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Recent Pets Preview */}
                {shelter.pets && shelter.pets.length > 0 && (
                  <Card>
                    <CardHeader>
                      <h3 className="text-lg font-semibold">Recent Pets</h3>
                      <p className="text-sm text-gray-600">
                        Showing {Math.min(6, shelter.pets.length)} of{" "}
                        {shelter.pets.length} pets
                      </p>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {shelter.pets.slice(0, 6).map((pet) => (
                          <div key={pet._id} className="text-center">
                            <div className="w-16 h-16 mx-auto mb-2 rounded-full overflow-hidden bg-gray-200">
                              {pet.photos && pet.photos.length > 0 ? (
                                <img
                                  src={pet.photos[0].url}
                                  alt={pet.name}
                                  className="w-full h-full object-cover"
                                  loading="lazy"
                                  sizes={getImageSizes("preview")}
                                  onError={handleImageError}
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                  <Heart className="h-6 w-6" />
                                </div>
                              )}
                            </div>
                            <div className="text-sm font-medium text-gray-900">
                              {pet.name}
                            </div>
                            <div className="text-xs text-gray-600">
                              {pet.breed}
                            </div>
                            <Badge
                              variant={
                                pet.status === "adoptable"
                                  ? "primary"
                                  : "secondary"
                              }
                              size="sm"
                              className="mt-1"
                            >
                              {pet.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                      {shelter.pets.length > 6 && (
                        <div className="text-center mt-4">
                          <Button
                            variant="outline"
                            onClick={() => setActiveTab("all-pets")}
                            className="text-sm"
                          >
                            View All {shelter.pets.length} Pets
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="pets" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {availablePets.map((pet) => (
                    <Card
                      key={pet._id}
                      className="cursor-pointer hover:shadow-md transition-shadow"
                    >
                      <CardContent className="p-0">
                        <div className="aspect-square overflow-hidden">
                          <img
                            src={pet.photos[0]?.url || PLACEHOLDER_IMAGE}
                            alt={pet.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                            sizes={getImageSizes("grid")}
                            onError={handleImageError}
                          />
                        </div>
                        <div className="p-4">
                          <h4 className="font-semibold text-gray-900 mb-1">
                            {pet.name}
                          </h4>
                          <p className="text-sm text-gray-600 mb-2">
                            {pet.breed} • {pet.age}
                          </p>
                          <Badge variant="primary" size="sm">
                            {pet.status}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {availablePets.length === 0 && (
                  <div className="text-center py-12">
                    <Heart className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No pets currently adoptable
                    </h3>
                    <p className="text-lg text-gray-600 mb-2">
                      This shelter has {totalPets} pets total
                    </p>
                    <p className="text-gray-500">
                      All pets may be pending adoption, in treatment, or already
                      adopted. Check back later or contact the shelter directly
                      for more information.
                    </p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="all-pets" className="space-y-6">
                {/* Filter Controls */}
                <Card>
                  <CardContent className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* Search */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Search
                        </label>
                        <input
                          type="text"
                          placeholder="Name or breed..."
                          value={filters.search}
                          onChange={(e) => {
                            setFilters((prev) => ({
                              ...prev,
                              search: e.target.value,
                            }));
                            setCurrentPage(1);
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      {/* Species Filter */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Species
                        </label>
                        <select
                          value={filters.species}
                          onChange={(e) => {
                            setFilters((prev) => ({
                              ...prev,
                              species: e.target.value,
                            }));
                            setCurrentPage(1);
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          aria-label="Filter by species"
                        >
                          <option value="">All Species</option>
                          <option value="dog">Dog</option>
                          <option value="cat">Cat</option>
                          <option value="bird">Bird</option>
                          <option value="rabbit">Rabbit</option>
                          <option value="other">Other</option>
                        </select>
                      </div>

                      {/* Status Filter */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Status
                        </label>
                        <select
                          value={filters.status}
                          onChange={(e) => {
                            setFilters((prev) => ({
                              ...prev,
                              status: e.target.value,
                            }));
                            setCurrentPage(1);
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          aria-label="Filter by status"
                        >
                          <option value="">All Statuses</option>
                          <option value="adoptable">Adoptable</option>
                          <option value="pending">Pending</option>
                          <option value="adopted">Adopted</option>
                          <option value="in_treatment">In Treatment</option>
                          <option value="fostered">Fostered</option>
                        </select>
                      </div>

                      {/* Sort */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Sort By
                        </label>
                        <div className="flex gap-2">
                          <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            aria-label="Sort by field"
                          >
                            <option value="name">Name</option>
                            <option value="age">Age</option>
                            <option value="status">Status</option>
                          </select>
                          <button
                            onClick={() =>
                              setSortOrder((prev) =>
                                prev === "asc" ? "desc" : "asc"
                              )
                            }
                            className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 focus:ring-2 focus:ring-blue-500"
                          >
                            {sortOrder === "asc" ? "↑" : "↓"}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Results Summary */}
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">
                          Showing {startIndex + 1}-
                          {Math.min(endIndex, filteredPets.length)} of{" "}
                          {filteredPets.length} pets
                        </span>
                        <button
                          onClick={() => {
                            setFilters({ species: "", status: "", search: "" });
                            setSortBy("name");
                            setSortOrder("asc");
                            setCurrentPage(1);
                          }}
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          Clear Filters
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {paginatedPets.map((pet) => (
                    <Card
                      key={pet._id}
                      className="cursor-pointer hover:shadow-md transition-shadow"
                    >
                      <CardContent className="p-0">
                        <div className="aspect-square overflow-hidden">
                          <img
                            src={pet.photos[0]?.url || PLACEHOLDER_IMAGE}
                            alt={pet.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                            sizes={getImageSizes("grid")}
                            onError={handleImageError}
                          />
                        </div>
                        <div className="p-4">
                          <h4 className="font-semibold text-gray-900 mb-1">
                            {pet.name}
                          </h4>
                          <p className="text-sm text-gray-600 mb-2">
                            {pet.breed} • {pet.age}
                          </p>
                          <div className="flex items-center justify-between">
                            <Badge
                              variant={
                                pet.status === "adoptable"
                                  ? "primary"
                                  : "secondary"
                              }
                              size="sm"
                            >
                              {pet.status}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Pagination Controls */}
                {filteredPets.length > itemsPerPage && (
                  <>
                    {/* Load More Button */}
                    <div className="text-center">
                      <button
                        onClick={() => setCurrentPage((prev) => prev + 1)}
                        disabled={currentPage >= totalPages}
                        className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {currentPage >= totalPages
                          ? "All Pets Loaded"
                          : `Load More (${Math.min(
                              itemsPerPage,
                              filteredPets.length - endIndex
                            )} more)`}
                      </button>
                    </div>

                    {/* Traditional Pagination */}
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() =>
                                setCurrentPage((prev) => Math.max(1, prev - 1))
                              }
                              disabled={currentPage === 1}
                              className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Previous
                            </button>

                            <div className="flex items-center space-x-1">
                              {/* First page */}
                              <button
                                onClick={() => setCurrentPage(1)}
                                className={`px-3 py-2 text-sm border rounded-md ${
                                  currentPage === 1
                                    ? "bg-blue-600 text-white border-blue-600"
                                    : "border-gray-300 hover:bg-gray-50"
                                }`}
                              >
                                1
                              </button>

                              {/* Ellipsis after first page if needed */}
                              {currentPage > 4 && (
                                <span className="px-2 py-2 text-gray-500">
                                  ...
                                </span>
                              )}

                              {/* Pages around current page */}
                              {(() => {
                                const startPage = Math.max(2, currentPage - 2);
                                const endPage = Math.min(
                                  totalPages - 1,
                                  currentPage + 2
                                );
                                const pages = [];

                                for (let i = startPage; i <= endPage; i++) {
                                  pages.push(
                                    <button
                                      key={i}
                                      onClick={() => setCurrentPage(i)}
                                      className={`px-3 py-2 text-sm border rounded-md ${
                                        currentPage === i
                                          ? "bg-blue-600 text-white border-blue-600"
                                          : "border-gray-300 hover:bg-gray-50"
                                      }`}
                                    >
                                      {i}
                                    </button>
                                  );
                                }

                                return pages;
                              })()}

                              {/* Ellipsis before last page if needed */}
                              {currentPage < totalPages - 3 && (
                                <span className="px-2 py-2 text-gray-500">
                                  ...
                                </span>
                              )}

                              {/* Last page (if different from first) */}
                              {totalPages > 1 && (
                                <button
                                  onClick={() => setCurrentPage(totalPages)}
                                  className={`px-3 py-2 text-sm border rounded-md ${
                                    currentPage === totalPages
                                      ? "bg-blue-600 text-white border-blue-600"
                                      : "border-gray-300 hover:bg-gray-50"
                                  }`}
                                >
                                  {totalPages}
                                </button>
                              )}
                            </div>

                            <button
                              onClick={() =>
                                setCurrentPage((prev) =>
                                  Math.min(totalPages, prev + 1)
                                )
                              }
                              disabled={currentPage === totalPages}
                              className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Next
                            </button>
                          </div>

                          <div className="text-sm text-gray-600">
                            Page {currentPage} of {totalPages}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}

                {(!shelter.pets || shelter.pets.length === 0) && (
                  <div className="text-center py-12">
                    <Heart className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No pets found
                    </h3>
                    <p className="text-gray-500">
                      This shelter doesn't have any pets listed yet.
                    </p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="reviews" className="space-y-6">
                <div className="space-y-4">
                  {shelter.reviews && shelter.reviews.length > 0 ? (
                    shelter.reviews.map((review) => (
                      <Card key={review._id}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center">
                              {renderStarsWithLabel(review.rating)}
                              <span className="ml-2 text-sm font-medium text-gray-900">
                                {review.rating}/5
                              </span>
                            </div>
                            <span
                              className="text-sm text-gray-500 cursor-help"
                              title={format(
                                new Date(review.createdAt),
                                "MMM d, yyyy 'at' h:mm a"
                              )}
                            >
                              {formatDistanceToNow(new Date(review.createdAt), {
                                addSuffix: true,
                              })}
                            </span>
                          </div>
                          <p className="text-gray-700">{review.comment}</p>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        No reviews yet
                      </h3>
                      <p className="text-gray-500">
                        Be the first to leave a review for this shelter.
                      </p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="contact" className="space-y-6">
                {/* Contact Information */}
                <Card>
                  <CardHeader>
                    <h3 className="text-lg font-semibold">
                      Contact Information
                    </h3>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center">
                      <Phone className="h-5 w-5 text-gray-400 mr-3" />
                      <span className="text-gray-700">{shelter.phone}</span>
                    </div>
                    <div className="flex items-center">
                      <Mail className="h-5 w-5 text-gray-400 mr-3" />
                      <span className="text-gray-700">{shelter.email}</span>
                    </div>
                    {shelter.website && (
                      <div className="flex items-center">
                        <Globe className="h-5 w-5 text-gray-400 mr-3" />
                        <a
                          href={shelter.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800"
                        >
                          {shelter.website}
                        </a>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Address */}
                <Card>
                  <CardHeader>
                    <h3 className="text-lg font-semibold">Address</h3>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-start">
                      <MapPin className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                      <div className="text-gray-700">
                        {(shelter.location?.details?.street ||
                          shelter.location?.address?.street) && (
                          <p>
                            {shelter.location.details?.street ||
                              shelter.location.address?.street}
                          </p>
                        )}
                        <p>
                          {shelter.location?.district?.name ||
                            shelter.location?.city ||
                            "Unknown"}
                          ,{" "}
                          {shelter.location?.province?.name ||
                            shelter.location?.state ||
                            "Unknown"}{" "}
                          {shelter.location?.postalCode ||
                            shelter.location?.zipCode}
                        </p>
                        <p>{shelter.location?.country}</p>

                        {/* Google Maps Link */}
                        {(shelter.location?.district?.name ||
                          shelter.location?.city) &&
                          (shelter.location?.province?.name ||
                            shelter.location?.state) && (
                            <div className="mt-3">
                              <a
                                href={`https://maps.google.com/?q=${encodeURIComponent(
                                  `${
                                    shelter.location.details?.street ||
                                    shelter.location.address?.street ||
                                    ""
                                  } ${
                                    shelter.location.district?.name ||
                                    shelter.location.city
                                  }, ${
                                    shelter.location.province?.name ||
                                    shelter.location.state
                                  } ${
                                    shelter.location.postalCode ||
                                    shelter.location.zipCode ||
                                    ""
                                  } ${shelter.location.country || ""}`
                                ).trim()}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors"
                              >
                                <MapPin className="h-4 w-4 mr-2" />
                                <span className="text-sm">
                                  Open in Google Maps
                                </span>
                              </a>
                            </div>
                          )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Operating Hours */}
                {shelter.operatingHours &&
                  Object.keys(shelter.operatingHours).length > 0 && (
                    <Card>
                      <CardHeader>
                        <h3 className="text-lg font-semibold">
                          Operating Hours
                        </h3>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {Object.keys(shelter.operatingHours).map((day) => (
                            <div key={day} className="flex justify-between">
                              <span className="font-medium text-gray-700">
                                {getDayName(day)}
                              </span>
                              <span className="text-gray-600">
                                {getOperatingHours(day)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                {/* Social Media */}
                {shelter.socialMedia && (
                  <Card>
                    <CardHeader>
                      <h3 className="text-lg font-semibold">Follow Us</h3>
                    </CardHeader>
                    <CardContent>
                      <div className="flex space-x-4">
                        {shelter.socialMedia.facebook && (
                          <a
                            href={shelter.socialMedia.facebook}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <Facebook className="h-6 w-6" />
                          </a>
                        )}
                        {shelter.socialMedia.twitter && (
                          <a
                            href={shelter.socialMedia.twitter}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-600"
                          >
                            <Twitter className="h-6 w-6" />
                          </a>
                        )}
                        {shelter.socialMedia.instagram && (
                          <a
                            href={shelter.socialMedia.instagram}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-pink-600 hover:text-pink-800"
                          >
                            <Instagram className="h-6 w-6" />
                          </a>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Quick Actions</h3>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="primary"
                  className="w-full"
                  onClick={() => navigate(`/pets?shelter=${shelter._id}`)}
                >
                  <Heart className="h-4 w-4 mr-2" />
                  View All Pets
                </Button>
                <a
                  href={`tel:${shelter.phone}`}
                  className="inline-flex items-center justify-center w-full px-4 py-2 text-sm font-medium border border-gray-300 bg-white text-gray-800 hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200 rounded-md"
                >
                  <Phone className="h-4 w-4 mr-2" />
                  Call Shelter
                </a>
                <a
                  href={`mailto:${shelter.email}`}
                  className="inline-flex items-center justify-center w-full px-4 py-2 text-sm font-medium border border-gray-300 bg-white text-gray-800 hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200 rounded-md"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Send Email
                </a>
              </CardContent>
            </Card>

            {/* Stats */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Shelter Stats</h3>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Pets</span>
                  <span className="font-semibold text-gray-900">
                    {totalPets}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Available Pets</span>
                  <span className="font-semibold text-green-600">
                    {availablePets.length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Average Rating</span>
                  <div className="flex items-center">
                    {renderStarsWithLabel(shelter.rating?.average || 0)}
                    <span className="ml-2 font-semibold text-gray-900">
                      {(shelter.rating?.average || 0).toFixed(1)}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Reviews</span>
                  <span className="font-semibold text-gray-900">
                    {shelter.rating?.count || 0}
                  </span>
                </div>

                {/* Pet Status Breakdown */}
                <div className="pt-4 border-t border-gray-200">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">
                    Pet Status Breakdown
                  </h4>
                  <div className="space-y-2">
                    {shelter.pets && shelter.pets.length > 0 && (
                      <>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-600">Adoptable</span>
                          <span className="font-semibold text-green-600">
                            {availablePets.length}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-600">Pending</span>
                          <span className="font-semibold text-yellow-600">
                            {pendingPets.length}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-600">Adopted</span>
                          <span className="font-semibold text-blue-600">
                            {adoptedPets.length}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-600">In Treatment</span>
                          <span className="font-semibold text-orange-600">
                            {inTreatmentPets.length}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShelterProfile;
