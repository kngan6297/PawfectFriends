import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import AdoptionRequestsList from "@/components/adoption/shared/AdoptionRequestsList";
import { useShelterDataContext } from "@/context/ShelterDataContext";

const ShelterAdoptionRequests: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { requests, stats, isLoading, error, refreshData } =
    useShelterDataContext();

  if (!user || user.role !== "shelter") {
    return (
      <div className="w-full py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Access Denied
          </h2>
          <p className="text-gray-600 mb-6">
            This page is only accessible to registered shelters.
          </p>
          <Button
            variant="primary"
            onClick={() => navigate("/register?role=shelter")}
          >
            Register as a Shelter
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full py-8 px-4 sm:px-6 lg:px-8">
      <AdoptionRequestsList
        viewMode="shelter"
        showStats={true}
        showQuickActions={true}
        showFilters={true}
        layout="cards"
        requests={requests}
        stats={stats}
        loading={isLoading}
        error={error}
        onRefresh={refreshData}
      />
    </div>
  );
};

export default ShelterAdoptionRequests;
