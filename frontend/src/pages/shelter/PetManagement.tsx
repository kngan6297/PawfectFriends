import React from "react";
import { toast } from "react-toastify";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import PetManagement from "@/components/PetManagement";
import { useShelterDataContext } from "@/context/ShelterDataContext";

const ShelterPetManagement: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { pets, isLoading, error, refreshData } = useShelterDataContext();

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
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            onClick={() => navigate("/register?role=shelter")}
          >
            Register as a Shelter
          </button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-red-600">
            Error Loading Pet Management
          </h3>
          <p className="mt-2 text-sm text-gray-500">{error}</p>
          <button
            onClick={refreshData}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full py-8 px-4 sm:px-6 lg:px-8">
      <PetManagement
        pets={pets}
        onPetsChange={refreshData}
        mode="shelter"
        title="Pets"
        description="Manage your shelter's pets and adoption listings"
        showStats={true}
        showAddButton={true}
        onAddPet={() => navigate("/shelter/pets/create")}
        addButtonText="Add New Pet"
      />
    </div>
  );
};

export default ShelterPetManagement;
