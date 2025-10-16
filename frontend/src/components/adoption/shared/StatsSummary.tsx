import React from "react";
import { Card, CardContent } from "@/components/ui/Card";
import {
  Calendar,
  FileText,
  PawPrint,
  Clock,
  CheckCircle2,
} from "lucide-react";

interface AdoptionRequest {
  _id: string;
  status: "pending" | "approved" | "scheduled" | "rejected" | "completed";
  createdAt: string;
  updatedAt: string;
}

interface StatsSummaryProps {
  adoptionRequests: AdoptionRequest[];
  className?: string;
}

export const StatsSummary: React.FC<StatsSummaryProps> = ({
  adoptionRequests,
  className = "",
}) => {
  const stats = [
    {
      icon: FileText,
      label: "Total Requests",
      value: adoptionRequests.length,
      color: "bg-blue-100 text-blue-600",
    },
    {
      icon: Clock,
      label: "Pending",
      value: adoptionRequests.filter((req) => req.status === "pending").length,
      color: "bg-yellow-100 text-yellow-600",
    },
    {
      icon: CheckCircle2,
      label: "Approved",
      value: adoptionRequests.filter((req) => req.status === "approved").length,
      color: "bg-green-100 text-green-600",
    },
    {
      icon: PawPrint,
      label: "Completed",
      value: adoptionRequests.filter((req) => req.status === "completed")
        .length,
      color: "bg-purple-100 text-purple-600",
    },
  ];

  return (
    <div className={`grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 ${className}`}>
      {stats.map((stat) => {
        const IconComponent = stat.icon;
        return (
          <Card key={stat.label}>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className={`p-2 rounded-lg ${stat.color}`}>
                  <IconComponent className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    {stat.label}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stat.value}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default StatsSummary;
