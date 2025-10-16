import React from "react";
import { Card } from "@/components/ui/card";
import { PawPrint, Heart, Users } from "lucide-react";

export const AboutPage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-12">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              About PawfectFriends
            </h1>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Connecting loving homes with pets in need. Our mission is to make
              pet adoption accessible, transparent, and joyful for everyone
              involved.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3 mb-12">
            <Card className="p-6 text-center">
              <div className="flex justify-center mb-4">
                <PawPrint className="h-12 w-12 text-primary-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Our Mission
              </h3>
              <p className="text-gray-600">
                To provide every pet with a loving home and every family with
                their perfect companion.
              </p>
            </Card>

            <Card className="p-6 text-center">
              <div className="flex justify-center mb-4">
                <Heart className="h-12 w-12 text-primary-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Our Values
              </h3>
              <p className="text-gray-600">
                Compassion, transparency, and dedication to animal welfare guide
                everything we do.
              </p>
            </Card>

            <Card className="p-6 text-center">
              <div className="flex justify-center mb-4">
                <Users className="h-12 w-12 text-primary-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Our Community
              </h3>
              <p className="text-gray-600">
                A network of shelters, volunteers, and pet lovers working
                together for a better future.
              </p>
            </Card>
          </div>

          <Card className="p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              How It Works
            </h2>
            <div className="space-y-6">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary-100 text-primary-600">
                    1
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Browse Available Pets
                  </h3>
                  <p className="mt-2 text-gray-600">
                    Explore our extensive database of pets looking for homes.
                    Filter by type, breed, age, and more.
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary-100 text-primary-600">
                    2
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Connect with Shelters
                  </h3>
                  <p className="mt-2 text-gray-600">
                    Reach out to shelters directly through our platform to learn
                    more about the pets you're interested in.
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary-100 text-primary-600">
                    3
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Complete the Adoption
                  </h3>
                  <p className="mt-2 text-gray-600">
                    Work with the shelter to complete the adoption process and
                    welcome your new family member home.
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
