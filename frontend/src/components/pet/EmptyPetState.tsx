import React from "react";
import { Search, RefreshCw, Heart } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";

interface EmptyPetStateProps {
  onTryAgain?: () => void;
  onBrowsePets?: () => void;
  message?: string;
}

export const EmptyPetState: React.FC<EmptyPetStateProps> = ({
  onTryAgain,
  onBrowsePets,
  message = "No perfect matches found",
}) => {
  return (
    <Card className="max-w-md mx-auto">
      <CardBody className="text-center py-12">
        {/* Cute 404 Image */}
        <div className="mb-6">
          <div className="relative w-32 h-32 mx-auto">
            {/* Pet Silhouette */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center">
                <Heart className="h-12 w-12 text-gray-400" />
              </div>
            </div>

            {/* Question Mark */}
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">?</span>
            </div>

            {/* Paws */}
            <div className="absolute -bottom-2 -left-2 w-6 h-6 bg-primary-300 rounded-full"></div>
            <div className="absolute -bottom-4 right-4 w-4 h-4 bg-primary-200 rounded-full"></div>
          </div>
        </div>

        <h3 className="text-xl font-semibold text-gray-900 mb-2">{message}</h3>

        <p className="text-gray-600 mb-6">
          Don't worry! We couldn't find a perfect match with your current
          preferences, but there are still many wonderful pets waiting for a
          home.
        </p>

        <div className="space-y-3">
          {onTryAgain && (
            <Button
              variant="primary"
              size="lg"
              leftIcon={RefreshCw}
              onClick={onTryAgain}
              className="w-full"
            >
              Try Different Preferences
            </Button>
          )}

          {onBrowsePets && (
            <Button
              variant="outline"
              size="lg"
              leftIcon={Search}
              onClick={onBrowsePets}
              className="w-full"
            >
              Browse All Pets
            </Button>
          )}
        </div>

        <div className="mt-6 p-4 bg-primary-50 rounded-lg">
          <h4 className="font-medium text-primary-900 mb-2">
            💡 Tips for better matches:
          </h4>
          <ul className="text-sm text-primary-700 space-y-1 text-left">
            <li>• Try selecting multiple pet species</li>
            <li>• Consider different activity levels</li>
            <li>• Adjust your budget range</li>
            <li>• Be flexible with age preferences</li>
          </ul>
        </div>
      </CardBody>
    </Card>
  );
};
