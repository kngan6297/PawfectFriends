import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { PawPrint } from "lucide-react";

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-grow flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full text-center">
          <div className="flex justify-center mb-6">
            <PawPrint className="h-16 w-16 text-primary-500" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Page Not Found
          </h2>
          <p className="text-gray-600 mb-8">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <div className="space-x-4">
            <Button variant="primary" onClick={() => window.history.back()}>
              Go Back
            </Button>
            <Link to="/">
              <Button variant="outline">Go Home</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
