import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { adoptionApi } from "@/services/api";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/Button";
import { PawPrint } from "lucide-react";
import AdoptionRequestsList from "@/components/adoption/shared/AdoptionRequestsList";

// Unified interface that matches the shared component
interface UnifiedAdoptionRequest {
  _id?: string;
  id?: string;
  user?: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
  };
  pet?: {
    _id: string;
    name: string;
    photos: string[];
    type?: string;
    breed?: string;
    age?: number;
    description?: string;
  };
  status: "pending" | "approved" | "rejected" | "scheduled" | "completed";
  createdAt: string;
  updatedAt?: string;
  reason?: string;
  experience?: string;
  livingSituation?: string;
  applicationDetails?: {
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
  notes?: any[];
  documents?: any[];
  reminderSent?: boolean;
  reminders?: { sentAt: string }[];
}

// Transform function to convert API response to UnifiedAdoptionRequest
const transformToUnifiedRequest = (request: any): UnifiedAdoptionRequest => {
  return {
    _id: request._id || request.id,
    id: request.id || request._id,
    user: request.userDetails
      ? {
          _id: request.userDetails._id,
          name: request.userDetails.name,
          email: request.userDetails.email,
          phone: request.userDetails.phone,
        }
      : undefined,
    pet: request.petDetails
      ? {
          _id: request.petDetails._id,
          name: request.petDetails.name,
          photos: request.petDetails.photos || [],
          type: request.petDetails.type,
          breed: request.petDetails.breed,
          age: request.petDetails.age,
          description: request.petDetails.description,
        }
      : undefined,
    status: request.status,
    createdAt: request.createdAt,
    updatedAt: request.updatedAt,
    reason: request.reason,
    experience: request.experience,
    livingSituation: request.livingSituation,
    applicationDetails: request.applicationDetails,
    notes: request.notes,
    documents: request.documents,
    reminderSent: request.reminderSent,
    reminders: request.reminders,
  };
};

const UserAdoptionRequestsPage: React.FC = () => {
  const { user } = useAuth();
  const [adoptionRequests, setAdoptionRequests] = useState<
    UnifiedAdoptionRequest[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchAdoptionRequests();
    }
  }, [user]);

  const fetchAdoptionRequests = async () => {
    try {
      setLoading(true);

      // Get all requests without status filter
      const response = await adoptionApi.getUserRequests({
        page: 1,
        limit: 50, // Get more requests to show all statuses
      });

      console.log("📡 API Response:", response);

      // The getUserRequests method already returns the current user's requests
      const userRequests = response.data || [];
      console.log("📋 Fetched adoption requests:", userRequests);
      console.log("📊 Number of requests:", userRequests.length);

      // Transform the requests to match the unified interface
      const transformedRequests = userRequests.map(transformToUnifiedRequest);
      setAdoptionRequests(transformedRequests);
    } catch (error) {
      console.error("❌ Error fetching adoption requests:", error);
      console.error("❌ Error details:", {
        message: error instanceof Error ? error.message : "Unknown error",
        response: error instanceof Error ? (error as any).response?.data : null,
        status: error instanceof Error ? (error as any).response?.status : null,
      });
      setError("Failed to fetch adoption requests");
      toast.error("Failed to fetch adoption requests");
    } finally {
      setLoading(false);
    }
  };

  // Calculate stats for the user's requests
  const stats = {
    total: adoptionRequests.length,
    pending: adoptionRequests.filter((r) => r.status === "pending").length,
    approved: adoptionRequests.filter((r) => r.status === "approved").length,
    rejected: adoptionRequests.filter((r) => r.status === "rejected").length,
    completed: adoptionRequests.filter((r) => r.status === "completed").length,
  };

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Please log in to track your adoptions
          </h2>
          <p className="text-gray-600 mb-6">
            You need to be logged in to view and track your adoption requests.
          </p>
          <Button
            variant="primary"
            onClick={() =>
              (window.location.href = "/login?redirect=/adoptions")
            }
          >
            Log in
          </Button>
        </div>
      </div>
    );
  }

  if (adoptionRequests.length === 0 && !loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Adoption Request Tracker
          </h1>
          <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500">
            Track the status of your pet adoption requests
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <PawPrint className="h-12 w-12 text-gray-400 mx-auto" />
          <h2 className="mt-2 text-xl font-semibold text-gray-900">
            No adoption requests yet
          </h2>
          <p className="mt-1 text-gray-500 mb-6">
            When you request to adopt a pet, you'll be able to track the status
            of your request here. Start by browsing adoptable pets and
            submitting an adoption application.
          </p>
          <div className="bg-primary-50 rounded-lg p-4 mb-6">
            <p className="text-primary-700 italic text-sm">
              "Every adoption begins with a little hope 🐾"
            </p>
          </div>
          <div className="space-y-3">
            <Button
              variant="primary"
              onClick={() => (window.location.href = "/pets")}
            >
              Browse Adoptable Pets
            </Button>
            <div className="text-sm text-gray-500">
              <p>
                Don't see your requests? Make sure you're logged in with the
                correct account.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
          Adoption Request Tracker
        </h1>
        <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500">
          Track the status of your pet adoption requests
        </p>
      </div>

      <AdoptionRequestsList
        viewMode="user"
        showStats={true}
        showQuickActions={false}
        showFilters={true}
        layout="cards"
        requests={adoptionRequests}
        stats={stats}
        loading={loading}
        error={error}
        onRefresh={fetchAdoptionRequests}
      />
    </div>
  );
};

export default UserAdoptionRequestsPage;
