import React, { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Heart,
  MessageCircle,
  MapPin,
  ArrowLeft,
  Calendar,
  Check,
  X,
  Shield,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { LegacyTabs } from "@/components/ui/Tabs";
import { Card, CardContent } from "@/components/ui/Card";
import { Pet } from "@/types/pet";
import { useAuth } from "@/context/AuthContext";
import { AdoptionApplicationModal } from "@/components/user/adoption/AdoptionApplicationModal";
import { petApi, userApi } from "@/services/api";

import { useNavigate } from "react-router-dom";
import { useToastContext } from "@/components/ui/ToastProvider";

// Function to scroll to top of the page
const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    left: 0,
    behavior: "smooth",
  });
};

export const PetDetailPage: React.FC = () => {
  const { petId } = useParams<{ petId: string }>();
  const [pet, setPet] = useState<Pet | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);

  const [isFavorited, setIsFavorited] = useState(false);
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToastContext();
  const didLogViewRef = useRef<string | null>(null);

  useEffect(() => {
    const fetchPet = async () => {
      if (!petId) {
        setError("Pet ID is required");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const response = await petApi.getById(petId);

        // Debug: Log pet data to see photos structure
        console.log("🔍 PetDetail Debug - Pet data:", response);
        console.log("🔍 PetDetail Debug - Photos:", response?.photos);

        if (response?.name) {
          setPet(response);
          setError(null);

          // Track viewed pet if user is authenticated (only once per petId)
          if (user && user._id && didLogViewRef.current !== petId) {
            try {
              didLogViewRef.current = petId;
              await userApi.addViewedPet(petId);
              console.log("Pet added to viewed history");
            } catch (viewError) {
              console.error("Failed to add pet to viewed history:", viewError);
              // Don't show error to user as this is not critical
            }
          }

          // Check if pet is already favorited
          if (user && user._id) {
            try {
              const favoritesResponse = await userApi.getFavorites();
              if (favoritesResponse.data.success) {
                const favoritePets = favoritesResponse.data.data;
                const isPetFavorited = favoritePets.some(
                  (favoritePet: any) =>
                    String(favoritePet._id || favoritePet.id) === String(petId)
                );
                setIsFavorited(isPetFavorited);
              }
            } catch (favoriteError) {
              console.error("Failed to check favorite status:", favoriteError);
              // Don't show error to user as this is not critical
            }
          }
        } else {
          console.error("Invalid pet response:", response);
          setError("Pet data is invalid");
        }
      } catch (err: any) {
        console.error("Error details:", {
          message: err.message,
          response: err.response?.data,
          status: err.response?.status,
        });
        setError("Failed to load pet details");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPet();
  }, [petId, user]);

  const handleAdoptionRequest = () => {
    if (!user) {
      navigate(`/login?redirect=/pets/${petId}`);
      return;
    }

    setIsRequestModalOpen(true);
  };

  const handleToggleFavorite = async () => {
    if (!user) {
      navigate(`/login?redirect=/pets/${petId}`);
      return;
    }

    if (!petId) {
      showToast({
        type: "error",
        title: "Error",
        description: "Pet ID is not available.",
      });
      return;
    }

    try {
      setIsTogglingFavorite(true);

      const response = await userApi.toggleFavorite(petId);

      if (response.data.success) {
        const newFavoritedState = response.data.data.isSaved;
        setIsFavorited(newFavoritedState);

        showToast({
          type: "success",
          title: newFavoritedState
            ? "Added to Favorites"
            : "Removed from Favorites",
          description: newFavoritedState
            ? `${pet?.name} has been added to your favorites!`
            : `${pet?.name} has been removed from your favorites.`,
        });
      }
    } catch (error: any) {
      console.error("Failed to toggle favorite:", error);
      showToast({
        type: "error",
        title: "Failed to Update Favorites",
        description: "Unable to update favorites. Please try again.",
      });
    } finally {
      setIsTogglingFavorite(false);
    }
  };

  const handleContactShelter = () => {
    if (!user) {
      navigate(`/login?redirect=/pets/${petId}`);
      return;
    }

    // Navigate to contact page or show contact information
    navigate("/contact");
  };

  if (isLoading) {
    return (
      <div className="flex-grow flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error || !pet) {
    return (
      <div className="flex-grow flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            {error || "No pet information found 😢"}
          </h2>
          <Button variant="primary" onClick={() => window.history.back()}>
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const mainPhoto =
    pet.photos?.[activeImageIndex] ||
    pet.photos?.find((photo) => photo.isMain) ||
    pet.photos?.[0];

  // Debug: Log main photo data
  console.log("🔍 PetDetail Debug - mainPhoto:", mainPhoto);
  console.log("🔍 PetDetail Debug - activeImageIndex:", activeImageIndex);
  console.log("🔍 PetDetail Debug - pet.photos length:", pet.photos?.length);
  const gender = pet?.gender ?? "unknown";
  const genderLabel = gender.charAt(0).toUpperCase() + gender.slice(1);
  const typeLabel = pet?.type
    ? pet.type.charAt(0).toUpperCase() + pet.type.slice(1)
    : "Unknown";
  const ageLabel = pet?.age
    ? typeof pet.age === "string"
      ? pet.age.charAt(0).toUpperCase() + pet.age.slice(1)
      : `${pet.age} year${pet.age !== 1 ? "s" : ""} old`
    : "Unknown";
  const sizeLabel = pet?.size
    ? pet.size.charAt(0).toUpperCase() + pet.size.slice(1)
    : "Unknown";

  // Status mapping for consistent badge styling
  const statusMap: Record<string, { label: string; variant: string }> = {
    adopted: { label: "Adopted", variant: "success" },
    pending: { label: "Pending", variant: "warning" },
    adoptable: { label: "Adoptable", variant: "primary" },
    hidden: { label: "Hidden", variant: "secondary" },
    waiting: { label: "Waiting", variant: "warning" },
    in_treatment: { label: "In Treatment", variant: "warning" },
    fostered: { label: "Fostered", variant: "info" },
    flagged: { label: "Flagged", variant: "error" },
  };

  const badge = statusMap[pet.status] || {
    label: "Unknown",
    variant: "default",
  };

  const tabContent = [
    {
      id: "about",
      label: "About",
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Description</h3>
            <p className="mt-2 text-gray-600">{pet.description}</p>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900">Details</h3>
            <dl className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6">
              <div>
                <dt className="text-sm font-medium text-gray-500">Type</dt>
                <dd className="mt-1 text-gray-900">{typeLabel}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Breed</dt>
                <dd className="mt-1 text-gray-900">
                  {pet.breeds?.primary || "Unknown"}
                  {pet.breeds?.secondary && ` / ${pet.breeds.secondary}`}
                  {pet.breeds?.mixed && " (Mixed)"}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Age</dt>
                <dd className="mt-1 text-gray-900">{ageLabel}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Gender</dt>
                <dd className="mt-1 text-gray-900">{genderLabel}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Size</dt>
                <dd className="mt-1 text-gray-900">{sizeLabel}</dd>
              </div>
              {pet.coat && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Coat</dt>
                  <dd className="mt-1 text-gray-900">{pet.coat}</dd>
                </div>
              )}
              <div>
                <dt className="text-sm font-medium text-gray-500">
                  Medical Status
                </dt>
                <dd className="mt-1 space-y-1">
                  <div className="flex items-center">
                    {pet.health?.vaccinated ? (
                      <Check className="h-4 w-4 text-green-500 mr-1" />
                    ) : (
                      <X className="h-4 w-4 text-red-500 mr-1" />
                    )}
                    <span>Vaccinated</span>
                  </div>
                  <div className="flex items-center">
                    {pet.health?.neutered ? (
                      <Check className="h-4 w-4 text-green-500 mr-1" />
                    ) : (
                      <X className="h-4 w-4 text-red-500 mr-1" />
                    )}
                    <span>Spayed/Neutered</span>
                  </div>
                  {pet.behavior?.training?.includes("leash-trained") && (
                    <div className="flex items-center">
                      <Check className="h-4 w-4 text-green-500 mr-1" />
                      <span>Leash Trained</span>
                    </div>
                  )}
                  {pet.health?.medicalHistory &&
                    pet.health.medicalHistory.length > 0 && (
                      <div className="flex items-center">
                        <Shield className="h-4 w-4 text-blue-500 mr-1" />
                        <span>Medical History Available</span>
                      </div>
                    )}
                </dd>
              </div>
            </dl>
          </div>

          {pet.behavior?.training && pet.behavior.training.length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                Characteristics
              </h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {pet.behavior.training.map((training, index) => (
                  <Badge key={index} variant="secondary">
                    {training}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      ),
    },
    {
      id: "shelter",
      label: "Shelter Info",
      content: (
        <div className="space-y-6">
          <Card>
            <CardContent>
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-16 w-16 rounded-full bg-primary-100 flex items-center justify-center">
                    <span className="text-2xl font-bold text-primary-600">
                      {pet?.shelter?.name?.charAt(0)?.toUpperCase() ?? "?"}
                    </span>
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    {pet.shelter.name}
                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary-100 text-primary-800">
                      <Shield className="mr-1 h-3 w-3" />
                      Verified
                    </span>
                  </h3>
                  <p className="text-gray-500">Registered Animal Shelter</p>
                </div>
              </div>

              {pet.shelter.contact && (
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {pet.shelter.contact.address && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">
                        Address
                      </h4>
                      <p className="mt-1 text-gray-900 flex items-start">
                        <MapPin className="h-5 w-5 text-gray-400 mr-1 flex-shrink-0" />
                        <span>{pet.shelter.contact.address}</span>
                      </p>
                    </div>
                  )}
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">
                      Contact
                    </h4>
                    {pet.shelter.contact.email && (
                      <p className="mt-1 text-gray-900">
                        {pet.shelter.contact.email}
                      </p>
                    )}
                    {pet.shelter.contact.phone && (
                      <p className="text-gray-900">
                        {pet.shelter.contact.phone}
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="mt-6 space-y-3">
                <Button
                  variant="primary"
                  fullWidth
                  leftIcon={Building2}
                  onClick={() => {
                    navigate(`/shelters/${pet.shelter._id}`);
                    scrollToTop();
                  }}
                >
                  View Shelter Profile
                </Button>
                <Button
                  variant="outline"
                  fullWidth
                  leftIcon={MessageCircle}
                  onClick={handleContactShelter}
                >
                  Contact Shelter
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ),
    },
    {
      id: "adoption",
      label: "Adoption Process",
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              Adoption Process
            </h3>
            <p className="mt-2 text-gray-600">
              Here's what to expect when adopting {pet.name} from{" "}
              {pet.shelter.name}:
            </p>
            <ol className="mt-4 space-y-4 list-decimal list-inside text-gray-600">
              <li>
                <span className="font-medium text-gray-900">
                  Submit an application
                </span>
                <p className="mt-1 ml-6">
                  Fill out the adoption request form with your information and
                  why you'd be a good fit for {pet.name}.
                </p>
              </li>
              <li>
                <span className="font-medium text-gray-900">
                  Initial screening
                </span>
                <p className="mt-1 ml-6">
                  The shelter will review your application and may contact you
                  with additional questions.
                </p>
              </li>
              <li>
                <span className="font-medium text-gray-900">
                  Meet {pet.name}
                </span>
                <p className="mt-1 ml-6">
                  Schedule a visit to the shelter to meet {pet.name} in person
                  and see if you're a good match.
                </p>
              </li>
              <li>
                <span className="font-medium text-gray-900">Home check</span>
                <p className="mt-1 ml-6">
                  For some adoptions, a shelter representative may need to visit
                  your home to ensure it's suitable for {pet.name}.
                </p>
              </li>
              <li>
                <span className="font-medium text-gray-900">
                  Adoption fee and paperwork
                </span>
                <p className="mt-1 ml-6">
                  Pay the adoption fee and complete all necessary paperwork.
                </p>
              </li>
              <li>
                <span className="font-medium text-gray-900">
                  Welcome {pet.name} home!
                </span>
                <p className="mt-1 ml-6">
                  Once approved, you can bring {pet.name} to their forever home.
                </p>
              </li>
            </ol>
          </div>

          {pet.adoptionFee > 0 && (
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                Adoption Fee
              </h3>
              <p className="mt-2 text-gray-600">
                The adoption fee for {pet.name} is ${pet.adoptionFee}. This fee
                helps cover the cost of vaccinations, microchipping, spay/neuter
                surgery, and general care while at the shelter.
              </p>
            </div>
          )}
        </div>
      ),
    },
  ];

  return (
    <main className="flex-grow">
      <div className="w-full py-8 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <div className="bg-gray-100 rounded-lg overflow-hidden relative">
              <img
                src={
                  mainPhoto?.full ||
                  mainPhoto?.large ||
                  mainPhoto?.medium ||
                  mainPhoto?.small ||
                  mainPhoto?.url ||
                  "/placeholder-pet.jpg"
                }
                alt={pet.name}
                className="w-full h-96 object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = "/placeholder-pet.jpg";
                }}
              />
              <button
                className="absolute top-4 right-4 p-2 bg-white bg-opacity-80 rounded-full hover:bg-opacity-100 transition-colors"
                aria-label={
                  isFavorited ? "Remove from favorites" : "Add to favorites"
                }
                onClick={handleToggleFavorite}
                disabled={isTogglingFavorite}
              >
                <Heart
                  className={`h-5 w-5 transition-colors ${
                    isFavorited
                      ? "text-red-500 fill-current"
                      : "text-gray-500 hover:text-red-500"
                  }`}
                />
              </button>

              {pet.status !== "adoptable" && (
                <div className="absolute top-0 left-0 right-0 p-4 bg-black bg-opacity-70 text-white text-center">
                  <p className="font-medium">
                    {pet.status === "adopted"
                      ? "This pet has been adopted"
                      : "Adoption pending"}
                  </p>
                </div>
              )}
            </div>

            {pet.photos && pet.photos.length > 0 && (
              <div className="mt-4 grid grid-cols-4 gap-2">
                {pet.photos.map((photo, index) => (
                  <button
                    key={photo._id || photo.id || `photo-${index}`}
                    onClick={() => setActiveImageIndex(index)}
                    className={`rounded-md overflow-hidden border-2 ${
                      index === activeImageIndex
                        ? "border-primary-500"
                        : "border-transparent"
                    }`}
                  >
                    <img
                      src={
                        photo.medium ||
                        photo.small ||
                        photo.url ||
                        "/placeholder-pet.jpg"
                      }
                      alt={`${pet.name} ${index + 1}`}
                      className="w-full h-20 object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "/placeholder-pet.jpg";
                      }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{pet.name}</h1>
                <p className="text-lg text-gray-600">
                  {pet.breeds?.primary || "Unknown"}
                  {pet.breeds?.secondary && ` / ${pet.breeds.secondary}`}
                  {pet.breeds?.mixed && " (Mixed)"}
                </p>
              </div>
              <Badge variant={badge.variant as any} size="md" rounded>
                {badge.label}
              </Badge>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <div className="flex items-center text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                <MapPin className="h-4 w-4 mr-1" />
                {pet.shelter.name}
              </div>
              <div className="flex items-center text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                <Calendar className="h-4 w-4 mr-1" />
                {pet.age}
              </div>
            </div>

            <div className="mt-8">
              <LegacyTabs tabs={tabContent} />
            </div>

            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <Button
                variant="primary"
                fullWidth
                disabled={pet.status !== "adoptable"}
                onClick={() => setIsRequestModalOpen(true)}
              >
                Request to Adopt
              </Button>
              {/* Messaging functionality moved to communication app */}
              <Button
                variant="outline"
                fullWidth
                leftIcon={MessageCircle}
                onClick={() => {
                  // Navigate to communication app for messaging in same window
                  window.location.href = `/communication?petId=${petId}&shelterId=${pet.shelter._id}`;
                }}
              >
                Message Shelter
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Adoption Request Modal */}
      <AdoptionApplicationModal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        petId={petId!}
        petName={pet.name}
      />
    </main>
  );
};

export default PetDetailPage;
