import React from "react";
import { Badge } from "@/components/ui/Badge";
import {
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  LucideIcon,
} from "lucide-react";

export interface StatusInfo {
  icon: LucideIcon;
  label: string;
  color: string;
  description: string;
}

export const getStatusInfo = (status: string): StatusInfo => {
  switch (status) {
    case "pending":
      return {
        icon: Clock,
        label: "Pending Review",
        color: "bg-yellow-100 text-yellow-800",
        description: "Your application is being reviewed by the shelter",
      };
    case "approved":
      return {
        icon: CheckCircle2,
        label: "Approved",
        color: "bg-green-100 text-green-800",
        description: "Congratulations! Your application has been approved",
      };
    case "scheduled":
      return {
        icon: Calendar,
        label: "Scheduled",
        color: "bg-blue-100 text-blue-800",
        description: "Meeting scheduled with the shelter",
      };
    case "rejected":
      return {
        icon: XCircle,
        label: "Not Selected",
        color: "bg-red-100 text-red-800",
        description: "This application was not selected",
      };
    case "completed":
      return {
        icon: CheckCircle2,
        label: "Completed",
        color: "bg-green-100 text-green-800",
        description: "Adoption process completed successfully",
      };
    default:
      return {
        icon: Clock,
        label: "Unknown",
        color: "bg-gray-100 text-gray-800",
        description: "Status unknown",
      };
  }
};

interface StatusBadgeProps {
  status: string;
  showIcon?: boolean;
  showDescription?: boolean;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  showIcon = false,
  showDescription = false,
  className = "",
}) => {
  const statusInfo = getStatusInfo(status);
  const StatusIcon = statusInfo.icon;

  return (
    <div className={className}>
      <div className="flex items-center gap-2">
        {showIcon && <StatusIcon className="h-4 w-4" />}
        <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
      </div>
      {showDescription && (
        <p className="text-sm text-gray-600 mt-1">{statusInfo.description}</p>
      )}
    </div>
  );
};

export default StatusBadge;
