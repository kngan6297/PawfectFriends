import { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import { API_BASE_URL } from "@/services/api";

interface AdoptionRequest {
  _id: string;
  pet: {
    _id: string;
    name: string;
    type: string;
    breed: string;
    images: string[];
  };
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  updatedAt: string;
}

export default function AdoptionHistory() {
  const [requests, setRequests] = useState<AdoptionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAdoptionHistory = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/adoption-requests/user`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch adoption history");
        }

        const data = await response.json();
        setRequests(data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to fetch adoption history"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchAdoptionHistory();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-500 border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <div className="text-sm text-red-700">{error}</div>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No adoption requests yet.</p>
      </div>
    );
  }

  const PET_PLACEHOLDER =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Crect width='200' height='200' fill='%23f3f4f6'/%3E%3Cpath d='M100 60c-22.1 0-40 17.9-40 40s17.9 40 40 40 40-17.9 40-40-17.9-40-40-40zm0 60c-11 0-20-9-20-20s9-20 20-20 20 9 20 20-9 20-20 20z' fill='%239ca3af'/%3E%3C/svg%3E";

  return (
    <div className="space-y-4">
      {requests.map((request) => (
        <div
          key={request._id}
          className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg"
        >
          <div className="flex-shrink-0">
            <img
              src={request.pet.images?.[0] || PET_PLACEHOLDER}
              alt={request.pet.name}
              className="h-16 w-16 rounded-lg object-cover"
              onError={(e) => {
                e.currentTarget.src = PET_PLACEHOLDER;
              }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-900">
                {request.pet.name}
              </h3>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  request.status === "approved"
                    ? "bg-green-100 text-green-800"
                    : request.status === "rejected"
                    ? "bg-red-100 text-red-800"
                    : "bg-yellow-100 text-yellow-800"
                }`}
              >
                {request.status.charAt(0).toUpperCase() +
                  request.status.slice(1)}
              </span>
            </div>
            <p className="text-sm text-gray-500">
              {request.pet.breed} • {request.pet.type}
            </p>
            <p className="text-xs text-gray-400">
              Requested {formatDistanceToNow(new Date(request.createdAt))} ago
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
