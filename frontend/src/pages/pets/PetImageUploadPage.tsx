import React, { useState } from "react";
import {
  Upload,
  AlertCircle,
  CheckCircle2,
  Camera,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export const PetImageUploadPage: React.FC = () => {
  const [uploadState, setUploadState] = useState<
    "idle" | "uploading" | "analyzing" | "complete"
  >("idle");
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Mock analysis results
  const [analysisResults, setAnalysisResults] = useState<{
    species: string;
    breed: string;
    confidence: number;
    age: string;
    features: string[];
  } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Create a preview URL
      const reader = new FileReader();
      reader.onload = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Start the upload process
      handleUpload(file);
    }
  };

  const handleUpload = (file: File) => {
    setUploadState("uploading");

    // Simulate upload delay
    setTimeout(() => {
      setUploadState("analyzing");

      // Simulate analysis delay
      setTimeout(() => {
        // Mock results
        setAnalysisResults({
          species: "Dog",
          breed: "Golden Retriever",
          confidence: 92,
          age: "2-4 years",
          features: [
            "Friendly",
            "Good with children",
            "Active",
            "Requires regular exercise",
          ],
        });
        setUploadState("complete");
      }, 3000);
    }, 2000);
  };

  const resetUpload = () => {
    setUploadState("idle");
    setPreviewImage(null);
    setAnalysisResults(null);
  };

  return (
    <div className="w-full py-8 px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
          Pet Image Analyzer
        </h1>
        <p className="mt-3 text-xl text-gray-500">
          Upload a photo of a pet to identify its breed, age, and more using our
          AI technology
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <Card>
            <CardBody>
              {uploadState === "idle" ? (
                <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-lg">
                  <Camera className="h-16 w-16 text-gray-400 mb-4" />
                  <p className="text-lg font-medium text-gray-900 mb-1">
                    Upload a pet photo
                  </p>
                  <p className="text-sm text-gray-500 mb-6 text-center">
                    Drag and drop an image, or click to browse. We accept JPG,
                    PNG, and HEIC formats.
                  </p>
                  <input
                    type="file"
                    id="pet-image"
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileChange}
                    aria-label="Upload pet photo"
                  />
                  <Button
                    variant="primary"
                    leftIcon={<Upload className="h-5 w-5" />}
                    onClick={() =>
                      document.getElementById("pet-image")?.click()
                    }
                  >
                    Choose File
                  </Button>
                </div>
              ) : (
                <div>
                  <div className="relative rounded-lg overflow-hidden">
                    {previewImage && (
                      <img
                        src={previewImage}
                        alt="Preview"
                        className="w-full h-64 object-cover"
                      />
                    )}
                    <div
                      className={`absolute inset-0 flex flex-col items-center justify-center ${
                        uploadState !== "complete"
                          ? "bg-black bg-opacity-50"
                          : ""
                      }`}
                    >
                      {uploadState === "uploading" && (
                        <div className="text-center text-white">
                          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mx-auto"></div>
                          <p className="mt-4 text-lg font-medium">
                            Uploading image...
                          </p>
                        </div>
                      )}
                      {uploadState === "analyzing" && (
                        <div className="text-center text-white">
                          <div className="animate-pulse">
                            <AlertCircle className="h-12 w-12 mx-auto" />
                          </div>
                          <p className="mt-4 text-lg font-medium">
                            Analyzing pet image...
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 flex justify-between items-center">
                    <Button variant="outline" size="sm" onClick={resetUpload}>
                      Upload a different image
                    </Button>
                    {uploadState === "complete" && (
                      <Badge variant="success" size="lg">
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        Analysis complete
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </CardBody>
          </Card>

          {uploadState === "idle" && (
            <div className="mt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Tips for best results:
              </h3>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-success-500 mr-2 flex-shrink-0" />
                  Use a clear, well-lit photo of the pet
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-success-500 mr-2 flex-shrink-0" />
                  Ensure the pet's face is visible and not obscured
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-success-500 mr-2 flex-shrink-0" />
                  Front-facing or profile views work best
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-success-500 mr-2 flex-shrink-0" />
                  Avoid using filters or heavily edited photos
                </li>
              </ul>
            </div>
          )}
        </div>

        <div>
          {uploadState === "complete" && analysisResults ? (
            <Card>
              <CardBody>
                <h2 className="text-xl font-bold text-gray-900 mb-6">
                  Analysis Results
                </h2>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">
                      Pet Type
                    </h3>
                    <p className="mt-1 text-lg font-medium text-gray-900">
                      {analysisResults.species}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500">
                      Breed Identification
                    </h3>
                    <div className="mt-1 flex items-center">
                      <span className="text-lg font-medium text-gray-900">
                        {analysisResults.breed}
                      </span>
                      <Badge variant="primary" className="ml-2">
                        {analysisResults.confidence}% confidence
                      </Badge>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500">
                      Estimated Age
                    </h3>
                    <p className="mt-1 text-lg font-medium text-gray-900">
                      {analysisResults.age}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500">
                      Temperament & Features
                    </h3>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {analysisResults.features.map((feature, index) => (
                        <Badge key={index} variant="secondary">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="bg-primary-50 rounded-lg p-4 border border-primary-200">
                    <h3 className="text-sm font-medium text-primary-800">
                      Looking for this pet?
                    </h3>
                    <p className="mt-1 text-primary-700">
                      We have 8 {analysisResults.breed}s available for adoption
                      within 50 miles of your location.
                    </p>
                    <Button
                      variant="primary"
                      size="sm"
                      className="mt-3"
                      rightIcon={<ArrowRight className="h-4 w-4" />}
                      onClick={() =>
                        (window.location.href =
                          "/pets?breed=" +
                          encodeURIComponent(analysisResults.breed))
                      }
                    >
                      Find Similar Pets
                    </Button>
                  </div>
                </div>

                <div className="mt-6 border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Breed Information
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {analysisResults.species === "Dog" &&
                      analysisResults.breed === "Golden Retriever" && (
                        <>
                          Golden Retrievers are intelligent, friendly dogs known
                          for their gentle temperament and loyalty. They
                          typically live 10-12 years and require regular
                          exercise. They're excellent family pets and are good
                          with children and other animals.
                        </>
                      )}
                  </p>
                  <Button variant="outline">Learn More About This Breed</Button>
                </div>
              </CardBody>
            </Card>
          ) : (
            <Card>
              <CardBody>
                <h2 className="text-xl font-bold text-gray-900 mb-6">
                  How It Works
                </h2>

                <div className="space-y-8">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary-500 text-white">
                        1
                      </div>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-medium text-gray-900">
                        Upload a Photo
                      </h3>
                      <p className="mt-1 text-gray-600">
                        Take or upload a clear photo of a pet. Make sure the
                        pet's face is visible and the image is well-lit.
                      </p>
                    </div>
                  </div>

                  <div className="flex">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary-500 text-white">
                        2
                      </div>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-medium text-gray-900">
                        AI Analysis
                      </h3>
                      <p className="mt-1 text-gray-600">
                        Our advanced AI processes the image, identifying the
                        pet's species, breed, and estimating its age based on
                        visual characteristics.
                      </p>
                    </div>
                  </div>

                  <div className="flex">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary-500 text-white">
                        3
                      </div>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-medium text-gray-900">
                        Get Results
                      </h3>
                      <p className="mt-1 text-gray-600">
                        Review the analysis results, including breed
                        identification, age estimation, and temperament
                        assessment.
                      </p>
                    </div>
                  </div>

                  <div className="flex">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary-500 text-white">
                        4
                      </div>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-medium text-gray-900">
                        Find Similar Pets
                      </h3>
                      <p className="mt-1 text-gray-600">
                        Use the results to find similar adoptable pets in your
                        area or learn more about the identified breed.
                      </p>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default PetImageUploadPage;
