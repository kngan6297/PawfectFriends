import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Pet } from "@/types/pet";
import { PetCard } from "@/components/pet/PetCard";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import { useFavoritePets } from "@/hooks/useFavoritePets";
import { useToastContext } from "@/components/ui/ToastProvider";
import { Search, Heart, MessageCircle, Shield, PawPrint } from "lucide-react";
import { useLatestPets } from "@/hooks/useApiQueries";
import { scrollToTop } from "@/utils/scrollUtils";

// Responsive limit function based on screen size
const getResponsiveLimit = () => {
  if (typeof window === "undefined") return 8; // SSR fallback

  const width = window.innerWidth;
  if (width >= 1024) return 8; // lg and xl: 4 columns × 2 rows = 8 pets
  if (width >= 768) return 6; // md: 3 columns × 2 rows = 6 pets
  if (width >= 640) return 4; // sm: 2 columns × 2 rows = 4 pets
  return 2; // xs: 1 column × 2 rows = 2 pets
};

export const HomePage: React.FC = () => {
  const [limit, setLimit] = useState(8);
  const { user } = useAuth();
  const { toggleFavoritePet, isPetFavorited } = useFavoritePets();
  const { showToast } = useToastContext();

  // Use React Query for latest pets
  const {
    data: latestPets = [],
    isLoading: loading,
    error,
  } = useLatestPets(limit);

  // Update limit on window resize
  useEffect(() => {
    const updateLimit = () => {
      setLimit(getResponsiveLimit());
    };

    updateLimit(); // Set initial limit
    window.addEventListener("resize", updateLimit);

    return () => window.removeEventListener("resize", updateLimit);
  }, []);

  const handleFavoriteToggle = async (
    petId: string,
    newIsFavorite: boolean
  ) => {
    if (!user) {
      showToast({
        type: "error",
        title: "Error",
        description: "Please login to add favorites",
      });
      return;
    }

    // If user data seems incomplete, try to refresh it first
    if (!user.name || !user.email) {
      showToast({
        type: "error",
        title: "Error",
        description: "Please refresh the page and try again",
      });
      return;
    }

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

  return (
    <div className="min-h-screen bg-blue-50">
      {/* Hero Section */}
      <section className="relative bg-blue-700 text-white">
        <div className="absolute inset-0 overflow-hidden">
          <img
            src="https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
            alt="Hero background"
            className="w-full h-full object-cover opacity-20"
          />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="md:w-2/3">
            <h1 className="text-4xl font-extrabold sm:text-5xl md:text-6xl">
              <span className="block">Find your perfect</span>
              <span className="block text-blue-200">pet companion</span>
            </h1>
            <p className="mt-6 text-xl text-blue-100 max-w-3xl">
              PawfectFriends connects loving homes with pets in need. Browse
              thousands of adoptable pets from shelters nationwide.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <Button
                variant="accent-amber"
                size="lg"
                className="font-semibold shadow-medium"
                onClick={() => (window.location.href = "/pets")}
              >
                Start Your Search
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="bg-blue-600 border-blue-600 text-white hover:bg-blue-700 hover:border-blue-700 font-semibold shadow-medium"
                onClick={() => (window.location.href = "/shelters")}
              >
                Browse Shelters
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="bg-blue-600 border-blue-600 text-white hover:bg-blue-700 hover:border-blue-700 font-semibold shadow-medium"
                onClick={() => (window.location.href = "/about")}
              >
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Latest Pets Section */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-800 sm:text-4xl">
            Latest Pets
          </h2>
          <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 sm:mt-4">
            Meet some of our newest pets looking for their forever homes
          </p>
        </div>

        <div className="mt-12 grid gap-8 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {loading ? (
            Array.from({ length: limit }).map((_, idx) => (
              <div
                key={idx}
                className="animate-pulse rounded-xl bg-gray-50 h-80 flex flex-col justify-between p-4 shadow-soft"
              >
                <div className="h-36 bg-gray-200 rounded-lg mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
              </div>
            ))
          ) : latestPets?.length > 0 ? (
            latestPets.map((pet: Pet) => (
              <PetCard
                key={pet._id || pet.id}
                pet={pet}
                isFavorite={isPetFavorited(pet._id || pet.id || "")}
                onFavoriteToggle={handleFavoriteToggle}
              />
            ))
          ) : (
            <div className="col-span-full text-center text-gray-500 py-16">
              No featured pets found.
            </div>
          )}
        </div>

        <div className="mt-10 text-center">
          <Link
            to="/pets"
            onClick={scrollToTop}
            className="btn-primary inline-flex items-center px-6 py-3 text-base font-medium"
          >
            View All Pets
          </Link>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-800 sm:text-4xl">
              How PawfectFriends Works
            </h2>
            <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 sm:mt-4">
              Your journey to finding the perfect pet companion made simple
            </p>
          </div>

          <div className="mt-12 grid gap-8 grid-cols-1 md:grid-cols-3">
            <div className="bg-white p-6 rounded-lg shadow-soft overflow-hidden border border-gray-100 text-center">
              <div className="bg-blue-100 w-16 h-16 mx-auto rounded-full flex items-center justify-center">
                <Search className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="mt-4 text-xl font-medium text-gray-800">
                Browse Pets
              </h3>
              <p className="mt-2 text-gray-600">
                Search through thousands of pets from shelters nationwide.
                Filter by species, age, size, and more.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-soft overflow-hidden border border-gray-100 text-center">
              <div className="bg-blue-100 w-16 h-16 mx-auto rounded-full flex items-center justify-center">
                <Heart className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="mt-4 text-xl font-medium text-gray-800">
                Find Your Match
              </h3>
              <p className="mt-2 text-gray-600">
                Connect with pets that match your lifestyle. Save favorites and
                get notified about new matches.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-soft overflow-hidden border border-gray-100 text-center">
              <div className="bg-blue-100 w-16 h-16 mx-auto rounded-full flex items-center justify-center">
                <MessageCircle className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="mt-4 text-xl font-medium text-gray-800">
                Connect & Adopt
              </h3>
              <p className="mt-2 text-gray-600">
                Connect directly with shelters, schedule visits, and complete
                the adoption process.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-800 sm:text-4xl">
            Success Stories
          </h2>
          <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 sm:mt-4">
            Hear from pet parents who found their perfect companions through
            PawfectFriends
          </p>
        </div>

        <div className="mt-12 grid gap-8 grid-cols-1 lg:grid-cols-2">
          <div className="bg-gray-50 p-8 rounded-lg shadow-sm border border-gray-100">
            <div className="flex items-center">
              <img
                className="h-12 w-12 rounded-full"
                src="https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
                alt="Testimonial author"
              />
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-800">
                  Michael Johnson
                </h3>
                <p className="text-gray-600">Adopted Max (Golden Retriever)</p>
              </div>
            </div>
            <p className="mt-4 text-gray-600 italic">
              "Finding Max through PawfectFriends changed my life. The platform
              made it so easy to connect with the shelter and the entire
              adoption process was smooth. Max is now the happiest member of our
              family!"
            </p>
          </div>

          <div className="bg-gray-50 p-8 rounded-lg shadow-sm border border-gray-100">
            <div className="flex items-center">
              <img
                className="h-12 w-12 rounded-full"
                src="https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
                alt="Testimonial author"
              />
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-800">
                  Sarah Williams
                </h3>
                <p className="text-gray-600">Adopted Luna (Siamese Cat)</p>
              </div>
            </div>
            <p className="mt-4 text-gray-600 italic">
              "As a first-time pet parent, I was nervous about adoption.
              PawfectFriends not only helped me find Luna but also provided
              resources that prepared me for cat ownership. Luna and I couldn't
              be happier!"
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-700 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-extrabold sm:text-4xl">
            Ready to find your new best friend?
          </h2>
          <p className="mt-4 text-xl text-blue-100 max-w-3xl mx-auto">
            Thousands of pets are waiting for their forever homes. Start your
            search today!
          </p>
          <div className="mt-8 flex justify-center">
            <Button
              variant="primary"
              size="lg"
              className="bg-white text-blue-700 hover:bg-blue-50"
              onClick={() => (window.location.href = "/pets")}
            >
              Browse Adoptable Pets
            </Button>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-800">
            Why Choose PawfectFriends
          </h2>
        </div>

        <div className="mt-12 grid gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          <div className="text-center">
            <div className="bg-blue-100 w-16 h-16 mx-auto rounded-full flex items-center justify-center">
              <Shield className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-800">
              Trusted Partners
            </h3>
            <p className="mt-2 text-gray-600">
              We partner with verified shelters and rescue organizations.
            </p>
          </div>

          <div className="text-center">
            <div className="bg-blue-100 w-16 h-16 mx-auto rounded-full flex items-center justify-center">
              <PawPrint className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-800">
              Pet-First Approach
            </h3>
            <p className="mt-2 text-gray-600">
              We prioritize animal welfare and responsible adoption practices.
            </p>
          </div>

          <div className="text-center">
            <div className="bg-blue-100 w-16 h-16 mx-auto rounded-full flex items-center justify-center">
              <MessageCircle className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-800">
              Direct Communication
            </h3>
            <p className="mt-2 text-gray-600">
              Connect directly with shelters and get answers to your questions.
            </p>
          </div>

          <div className="text-center">
            <div className="bg-blue-100 w-16 h-16 mx-auto rounded-full flex items-center justify-center">
              <Heart className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-800">
              Lifetime Support
            </h3>
            <p className="mt-2 text-gray-600">
              Get ongoing support and resources for your pet's lifetime.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
