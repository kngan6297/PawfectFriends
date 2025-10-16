import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { shelterApi } from "@/services/api";
import { format } from "date-fns";
import {
  MapPin,
  Star,
  Users,
  Building2,
  Heart,
  Eye,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";

interface Shelter {
  _id: string;
  name: string;
  bio?: string;
  phone: string;
  email: string;
  website?: string;
  avatar?: string;
  photos?: string[];
  isVerified?: boolean;
  location: {
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
  rating: {
    average: number;
    count: number;
  };
  pets: Array<{
    _id: string;
    name: string;
    type: string;
    breed: string;
    age: string;
    status: string;
    photos: Array<{ url: string }>;
  }>;
  profileViews: number;
}

const ShelterList: React.FC = () => {
  const [shelters, setShelters] = useState<Shelter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchShelters();
  }, []);

  const fetchShelters = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await shelterApi.getAllShelters();
      setShelters(response.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load shelters");
      toast.error("Failed to load shelters");
    } finally {
      setLoading(false);
    }
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

  const filteredShelters = shelters;

  const availablePets = (shelter: Shelter) =>
    shelter.pets.filter((pet) => pet.status === "adoptable").length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <Skeleton className="h-8 w-64 mb-4" />
            <Skeleton className="h-4 w-96" />
          </div>
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-center space-x-6 p-6">
                <Skeleton className="w-24 h-24 rounded-lg" />
                <div className="flex-1 space-y-3">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-4 w-64" />
                </div>
                <div className="flex flex-col space-y-2">
                  <Skeleton className="h-8 w-24" />
                  <Skeleton className="h-8 w-24" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">{error}</h1>
            <Button variant="primary" onClick={fetchShelters}>
              Try Again
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Find Animal Shelters
          </h1>
          <p className="text-lg text-gray-600">
            Discover shelters in your area and find your perfect companion
          </p>
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-gray-600">
            Found {filteredShelters.length} shelter
            {filteredShelters.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Shelters List */}
        {filteredShelters.length > 0 ? (
          <div className="space-y-4">
            {filteredShelters.map((shelter) => (
              <Card
                key={shelter._id}
                className="hover:shadow-lg transition-shadow"
              >
                <CardContent className="p-6">
                  <div className="flex items-center space-x-6">
                    {/* Shelter Photo */}
                    <div className="flex-shrink-0">
                      <div className="w-24 h-24 rounded-lg overflow-hidden">
                        {shelter.photos && shelter.photos.length > 0 ? (
                          <img
                            src={shelter.photos[0]}
                            alt={`${shelter.name} photo`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                            <Building2 className="h-12 w-12 text-gray-400" />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Shelter Info - Main Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-xl font-semibold text-gray-900 truncate">
                          {shelter.name}
                        </h3>
                        {shelter.isVerified && (
                          <Badge
                            variant="secondary"
                            className="ml-2 flex-shrink-0"
                          >
                            <Shield className="h-3 w-3 mr-1" />
                            Verified
                          </Badge>
                        )}
                      </div>

                      {/* Rating and Location Row */}
                      <div className="flex items-center space-x-6 mb-2">
                        <div className="flex items-center">
                          {renderStars(shelter.rating.average)}
                          <span className="ml-2 text-sm text-gray-600">
                            {shelter.rating.average.toFixed(1)} (
                            {shelter.rating.count} reviews)
                          </span>
                        </div>
                        <div className="flex items-center text-gray-600">
                          <MapPin className="h-4 w-4 mr-2" />
                          <span className="text-sm">
                            {shelter.location?.district?.name ||
                              shelter.location?.city ||
                              "Unknown"}
                            ,{" "}
                            {shelter.location?.province?.name ||
                              shelter.location?.state ||
                              "Unknown"}
                          </span>
                        </div>
                      </div>

                      {/* Stats Row */}
                      <div className="flex items-center space-x-6 text-sm text-gray-600 mb-3">
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-1" />
                          <span>{shelter.pets.length} total pets</span>
                        </div>
                        <div className="flex items-center">
                          <Heart className="h-4 w-4 mr-1" />
                          <span>{availablePets(shelter)} available</span>
                        </div>
                        <div className="flex items-center">
                          <Eye className="h-4 w-4 mr-1" />
                          <span>{shelter.profileViews} views</span>
                        </div>
                      </div>

                      {/* Description */}
                      {shelter.bio && (
                        <p className="text-gray-600 text-sm line-clamp-2">
                          {shelter.bio}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex-shrink-0 flex flex-col space-y-2">
                      <Link to={`/shelters/${shelter._id}`}>
                        <Button variant="primary" size="sm">
                          View Profile
                        </Button>
                      </Link>
                      <Link to={`/pets?shelter=${shelter._id}`}>
                        <Button variant="outline" size="sm">
                          View Pets
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Building2 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No shelters found
            </h3>
            <p className="text-gray-500">
              Try adjusting your search criteria or check back later.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShelterList;
