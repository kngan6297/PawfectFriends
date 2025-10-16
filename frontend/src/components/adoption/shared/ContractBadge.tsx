import React from "react";
import { FileText, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface ContractDetails {
  status: "drafted" | "sent" | "signed";
  title?: string;
}

interface ContractBadgeProps {
  contractDetails: ContractDetails;
  variant?: "badge" | "section";
  onViewContract?: () => void;
  className?: string;
}

export const ContractBadge: React.FC<ContractBadgeProps> = ({
  contractDetails,
  variant = "badge",
  onViewContract,
  className = "",
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "signed":
        return "bg-green-100 text-green-800";
      case "sent":
        return "bg-blue-100 text-blue-800";
      case "drafted":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (variant === "section") {
    return (
      <div className={`mt-6 pt-6 border-t border-gray-200 ${className}`}>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Contract Information
        </h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">Contract Status:</span>
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                contractDetails.status
              )}`}
            >
              {contractDetails.status || "Unknown"}
            </span>
          </div>
          {contractDetails.title && (
            <div className="flex justify-between">
              <span className="text-gray-600">Title:</span>
              <span className="font-medium">{contractDetails.title}</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`mb-4 p-3 bg-blue-50 rounded-lg ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-blue-600" />
          <span className="text-sm font-medium text-blue-800">
            Contract: {contractDetails.status}
          </span>
        </div>
        {onViewContract && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onViewContract();
            }}
            className="text-xs text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 transition-colors"
          >
            View contract
            <ExternalLink className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  );
};

export default ContractBadge;
