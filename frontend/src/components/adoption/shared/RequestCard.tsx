import React from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge, getStatusInfo } from "./StatusBadge";
import { ContractBadge } from "./ContractBadge";
import { Eye, Clock, Image as ImageIcon } from "lucide-react";
import { formatDate, formatRelativeTime } from "@/utils/dateUtils";

interface Pet {
  _id: string;
  name: string;
  type: string;
  breed: string;
  age: number | string;
  photos: any[];
}

interface Shelter {
  _id: string;
  name: string;
  email: string;
}

interface ContractDetails {
  status: "drafted" | "sent" | "signed";
  title?: string;
}

interface AdoptionRequest {
  _id: string;
  user: string;
  pet: Pet;
  shelter: Shelter;
  status: "pending" | "approved" | "scheduled" | "rejected" | "completed";
  createdAt: string;
  updatedAt: string;
  contractDetails?: ContractDetails;
}

interface RequestCardProps {
  request: AdoptionRequest;
  onViewDetails: (requestId: string) => void;
  onViewTimeline?: (requestId: string) => void;
  onViewContract?: (requestId: string) => void;
  showContractInfo?: boolean;
  className?: string;
}

export const RequestCard: React.FC<RequestCardProps> = ({
  request,
  onViewDetails,
  onViewTimeline,
  onViewContract,
  showContractInfo = true,
  className = "",
}) => {
  const statusInfo = getStatusInfo(request.status);
  const StatusIcon = statusInfo.icon;

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't trigger if clicking on buttons or interactive elements
    if (
      (e.target as HTMLElement).closest("button") ||
      (e.target as HTMLElement).closest("a")
    ) {
      return;
    }
    onViewDetails(request._id);
  };

  return (
    <Card
      className={`hover:shadow-md transition-shadow cursor-pointer ${className}`}
      onClick={handleCardClick}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-start gap-4 mb-3">
              {/* Pet Photo Thumbnail */}
              <div className="flex-shrink-0">
                {request.pet?.photos?.[0] ? (
                  <img
                    src={request.pet.photos[0]}
                    alt={`${request.pet?.name || "Pet"} photo`}
                    className="w-16 h-16 rounded-lg object-cover border border-gray-200 hover:opacity-90 transition-opacity"
                    onError={(e) => {
                      // Fallback to placeholder if image fails to load
                      const target = e.target as HTMLImageElement;
                      target.style.display = "none";
                      target.nextElementSibling?.classList.remove("hidden");
                    }}
                  />
                ) : null}
                <div
                  className={`w-16 h-16 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center ${
                    request.pet?.photos?.[0] ? "hidden" : ""
                  }`}
                >
                  <ImageIcon className="h-6 w-6 text-gray-400" />
                </div>
              </div>

              {/* Pet Info and Status */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <StatusIcon className="h-5 w-5 text-gray-500" />
                    <h3 className="text-lg font-semibold text-gray-900 truncate">
                      {request.pet?.name || "Unknown Pet"}
                    </h3>
                  </div>
                  <StatusBadge status={request.status} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600">Pet Details</p>
                    <p className="font-medium">
                      {request.pet?.type} • {request.pet?.breed} •{" "}
                      {request.pet?.age}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Shelter</p>
                    <p className="font-medium">{request.shelter?.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Submitted</p>
                    <p className="font-medium">
                      {formatDate(request.createdAt)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatRelativeTime(request.createdAt)}
                    </p>
                  </div>
                </div>

                <p className="text-sm text-gray-600 mb-4">
                  {statusInfo.description}
                </p>

                {/* Contract Status */}
                {showContractInfo && request.contractDetails && (
                  <ContractBadge
                    contractDetails={request.contractDetails}
                    onViewContract={
                      onViewContract
                        ? () => onViewContract(request._id)
                        : undefined
                    }
                  />
                )}
              </div>
            </div>
          </div>

          <div className="ml-6 flex flex-col gap-2 items-stretch">
            <Button
              onClick={(e) => {
                e.stopPropagation();
                onViewDetails(request._id);
              }}
              className="flex items-center gap-2"
              aria-label="View details"
            >
              <Eye className="h-4 w-4" aria-hidden="true" />
              View details
            </Button>

            {/* Secondary link to timeline (optional) */}
            {onViewTimeline && (
              <button
                className="text-sm text-gray-600 hover:text-gray-900 underline"
                onClick={(e) => {
                  e.stopPropagation();
                  onViewTimeline(request._id);
                }}
                aria-label="View timeline"
              >
                View timeline →
              </button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RequestCard;
