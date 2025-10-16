import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  PawPrint,
  Heart,
  Calendar,
  MapPin,
  Users,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { Pet } from "@/types/pet";

interface PetStatsProps {
  pets: Pet[];
  showShelterStats?: boolean;
}

const PetStats: React.FC<PetStatsProps> = ({
  pets,
  showShelterStats = false,
}) => {
  const stats = React.useMemo(() => {
    const totalPets = pets.length;
    const adoptablePets = pets.filter(
      (pet) => pet.status === "adoptable"
    ).length;
    const pendingPets = pets.filter((pet) => pet.status === "pending").length;
    const adoptedPets = pets.filter((pet) => pet.status === "adopted").length;
    const rejectedPets = pets.filter((pet) => pet.status === "rejected").length;
    const unavailablePets = pets.filter(
      (pet) => pet.status === "unavailable"
    ).length;

    return {
      total: totalPets,
      adoptable: adoptablePets,
      pending: pendingPets,
      adopted: adoptedPets,
      rejected: rejectedPets,
      unavailable: unavailablePets,
    };
  }, [pets]);

  const statCards = [
    {
      label: "Total Pets",
      value: stats.total,
      icon: PawPrint,
      color: "blue",
      bgColor: "bg-blue-100",
      textColor: "text-blue-600",
    },
    {
      label: "Available",
      value: stats.adoptable,
      icon: Heart,
      color: "green",
      bgColor: "bg-green-100",
      textColor: "text-green-600",
    },
    {
      label: "Pending",
      value: stats.pending,
      icon: Clock,
      color: "yellow",
      bgColor: "bg-yellow-100",
      textColor: "text-yellow-600",
    },
    {
      label: "Adopted",
      value: stats.adopted,
      icon: CheckCircle,
      color: "purple",
      bgColor: "bg-purple-100",
      textColor: "text-purple-600",
    },
  ];

  // Add admin-specific stats if needed
  if (showShelterStats) {
    statCards.push(
      {
        label: "Rejected",
        value: stats.rejected,
        icon: XCircle,
        color: "red",
        bgColor: "bg-red-100",
        textColor: "text-red-600",
      },
      {
        label: "Unavailable",
        value: stats.unavailable,
        icon: MapPin,
        color: "gray",
        bgColor: "bg-gray-100",
        textColor: "text-gray-600",
      }
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {statCards.map((stat) => {
        const IconComponent = stat.icon;
        return (
          <Card key={stat.label} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className={`p-2 ${stat.bgColor} rounded-lg`}>
                  <IconComponent className={`h-6 w-6 ${stat.textColor}`} />
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

export default PetStats;
