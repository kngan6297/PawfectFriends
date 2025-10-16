import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { userApi } from "@/services/api";
import { toast } from "react-toastify";
import { Link } from "react-router-dom";

interface UserProfile {
  preferences?: {
    species?: string[];
    age?: {
      min: number;
      max: number;
    };
  };
  favoritePets?: string[]; // Array of pet IDs
}

interface UserDashboardProps {}

const UserDashboard: React.FC<UserDashboardProps> = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState<boolean>(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="w-full py-8 px-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Please Log In
          </h1>
          <p className="text-gray-600">
            You need to be logged in to view your dashboard.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full py-8 px-4">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>

        {/* Profile Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Profile</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Name</p>
              <p className="text-lg font-medium">{user.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Email</p>
              <p className="text-lg font-medium">{user.email}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
