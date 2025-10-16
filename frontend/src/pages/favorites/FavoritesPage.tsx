import React from "react";
import { useAuth } from "@/context/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/Button";
import { Heart } from "lucide-react";
import { PetCard } from "@/components/pet/PetCard";
import { useToastContext } from "@/components/ui/ToastProvider";

export const FavoritesPage: React.FC = () => {
  const { user, favoritePets, toggleFavoritePet, isPetFavorited } = useAuth();
  const { showToast } = useToastContext();

  const handleFavoriteToggle = async (
    petId: string,
    newIsFavorite: boolean
  ) => {
    try {
      await toggleFavoritePet(petId);
    } catch (error) {
      console.error("Failed to toggle favorite:", error);
      showToast({
        type: "error",
        title: "Error",
        description: "Failed to update favorite",
      });
    }
  };

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900">
            Please log in to view your favorites
          </h3>
          <Button
            variant="primary"
            className="mt-4"
            onClick={() => (window.location.href = "/login")}
          >
            Log In
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Favorite Pets</h1>
        <Button
          variant="primary"
          leftIcon={Heart}
          onClick={() => (window.location.href = "/pets")}
        >
          Browse Pets
        </Button>
      </div>

      {favoritePets && favoritePets.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {favoritePets.map((pet) => {
            const petId = pet.id || pet._id;
            if (!pet || !petId) return null;
            return (
              <PetCard
                key={petId}
                pet={pet}
                isFavorite={true}
                onFavoriteToggle={handleFavoriteToggle}
              />
            );
          })}
        </div>
      ) : (
        <Card className="p-6 text-center">
          <p className="text-gray-500">No favorite pets yet</p>
          <p className="text-sm text-gray-400 mt-2">
            Start adding pets to your favorites to see them here
          </p>
        </Card>
      )}
    </div>
  );
};

export default FavoritesPage;
