import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { petApi } from "@/services/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/Select";

interface PetFormData {
  name: string;
  type: string;
  species: string;
  breed: string;
  age: string | number;
  gender: string;
  size: string;
  coat?: string;
  primaryColor: string;
  secondaryColor?: string;
  description: string;
  status: string;
}

const CreatePetForm: React.FC = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [ageType, setAgeType] = useState<"string" | "number">("string");

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PetFormData>({
    defaultValues: {
      status: "adoptable",
      age: "adult",
      size: "medium",
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    // Validate file types
    const validFiles = files.filter(
      (file) =>
        file.type.startsWith("image/") &&
        ["image/jpeg", "image/png", "image/jpg"].includes(file.type)
    );

    if (validFiles.length !== files.length) {
      toast.error("Please select only image files (JPEG, PNG)");
      return;
    }

    // Validate file size (max 5MB per file)
    const oversizedFiles = validFiles.filter(
      (file) => file.size > 5 * 1024 * 1024
    );
    if (oversizedFiles.length > 0) {
      toast.error("Each image must be less than 5MB");
      return;
    }

    setSelectedImages((prev) => [...prev, ...validFiles]);

    // Create preview URLs
    const newPreviewUrls = validFiles.map((file) => URL.createObjectURL(file));
    setPreviewUrls((prev) => [...prev, ...newPreviewUrls]);
  };

  const removeImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
    setPreviewUrls((prev) => {
      const newUrls = [...prev];
      URL.revokeObjectURL(newUrls[index]);
      return newUrls.filter((_, i) => i !== index);
    });
  };

  const handleAgeTypeChange = (type: "string" | "number") => {
    setAgeType(type);
    if (type === "string") {
      setValue("age", "adult");
    } else {
      setValue("age", 2);
    }
  };

  const handleTypeChange = (type: string) => {
    setValue("type", type);
    // Auto-populate species based on type selection
    if (type === "dog") {
      setValue("species", "Dog");
    } else if (type === "cat") {
      setValue("species", "Cat");
    } else if (type === "bird") {
      setValue("species", "Bird");
    } else if (type === "other") {
      setValue("species", ""); // Clear species for "other" type
    }
  };

  // Ensure age is always a valid value before submission
  const validateAge = (value: string | number): string | number => {
    if (ageType === "number") {
      const numValue = Number(value);
      return isNaN(numValue) ? 2 : numValue; // Default to 2 if invalid
    }
    return value || "adult"; // Default to 'adult' if empty string
  };

  const onSubmit = async (data: PetFormData) => {
    if (selectedImages.length === 0) {
      toast.error("Please upload at least one image");
      return;
    }

    try {
      setIsSubmitting(true);
      const formData = new FormData();

      // Validate and prepare data
      const validatedData = {
        ...data,
        age: validateAge(data.age),
      };

      // Append pet data
      Object.entries(validatedData).forEach(([key, value]) => {
        formData.append(key, value.toString());
      });

      // Append images
      selectedImages.forEach((image, index) => {
        formData.append("images", image);
      });

      await petApi.createPet(formData);
      toast.success("Pet created successfully!");
      navigate("/pets");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to create pet";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Add New Pet</h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Name */}
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700"
              >
                Name *
              </label>
              <input
                type="text"
                id="name"
                {...register("name", { required: "Name is required" })}
                className="h-10 w-full px-3 py-2 text-sm border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.name.message}
                </p>
              )}
            </div>

            {/* Type */}
            <div>
              <label
                htmlFor="type"
                className="block text-sm font-medium text-gray-700"
              >
                Type *
              </label>
              <Select value={watch("type")} onValueChange={handleTypeChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dog">Dog</SelectItem>
                  <SelectItem value="cat">Cat</SelectItem>
                  <SelectItem value="bird">Bird</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              {errors.type && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.type.message}
                </p>
              )}
            </div>

            {/* Breed */}
            <div>
              <label
                htmlFor="breed"
                className="block text-sm font-medium text-gray-700"
              >
                Breed *
              </label>
              <input
                type="text"
                id="breed"
                {...register("breed", { required: "Breed is required" })}
                placeholder="e.g., Golden Retriever, Persian, etc."
                className="h-10 w-full px-3 py-2 text-sm border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              />
              {errors.breed && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.breed.message}
                </p>
              )}
            </div>

            {/* Age */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Age *
              </label>
              <div className="mt-1 space-y-2">
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="ageType"
                      checked={ageType === "string"}
                      onChange={() => handleAgeTypeChange("string")}
                      className="mr-2"
                    />
                    Age Category
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="ageType"
                      checked={ageType === "number"}
                      onChange={() => handleAgeTypeChange("number")}
                      className="mr-2"
                    />
                    Exact Age (years)
                  </label>
                </div>

                {ageType === "string" ? (
                  <Select
                    value={String(watch("age"))}
                    onValueChange={(value) => setValue("age", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select age category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="baby">Baby</SelectItem>
                      <SelectItem value="young">Young</SelectItem>
                      <SelectItem value="adult">Adult</SelectItem>
                      <SelectItem value="senior">Senior</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="30"
                    {...register("age", {
                      required: "Age is required",
                      min: { value: 0, message: "Age must be positive" },
                      max: { value: 30, message: "Age must be 30 or less" },
                      valueAsNumber: true,
                    })}
                    placeholder="e.g., 2.5"
                    className="h-10 w-full px-3 py-2 text-sm border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  />
                )}
                {errors.age && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.age.message}
                  </p>
                )}
              </div>
            </div>

            {/* Gender */}
            <div>
              <label
                htmlFor="gender"
                className="block text-sm font-medium text-gray-700"
              >
                Gender *
              </label>
              <Select
                value={watch("gender")}
                onValueChange={(value) => setValue("gender", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="unknown">Unknown</SelectItem>
                </SelectContent>
              </Select>
              {errors.gender && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.gender.message}
                </p>
              )}
            </div>

            {/* Size */}
            <div>
              <label
                htmlFor="size"
                className="block text-sm font-medium text-gray-700"
              >
                Size *
              </label>
              <Select
                value={watch("size")}
                onValueChange={(value) => setValue("size", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Small</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="large">Large</SelectItem>
                </SelectContent>
              </Select>
              {errors.size && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.size.message}
                </p>
              )}
            </div>

            {/* Species */}
            <div>
              <label
                htmlFor="species"
                className="block text-sm font-medium text-gray-700"
              >
                Species *
              </label>
              <input
                type="text"
                id="species"
                {...register("species", { required: "Species is required" })}
                placeholder="e.g., Dog, Cat, Bird, Rabbit, Hamster, etc."
                className="h-10 w-full px-3 py-2 text-sm border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              />
              <p className="mt-1 text-xs text-gray-500">
                Enter the specific species name (e.g., "Dog" for dogs, "Rabbit"
                for rabbits)
              </p>
              {errors.species && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.species.message}
                </p>
              )}
            </div>

            {/* Coat */}
            <div>
              <label
                htmlFor="coat"
                className="block text-sm font-medium text-gray-700"
              >
                Coat Type
              </label>
              <Select
                value={watch("coat") || ""}
                onValueChange={(value) => setValue("coat", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select coat type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="short">Short</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="long">Long</SelectItem>
                  <SelectItem value="wire">Wire</SelectItem>
                  <SelectItem value="curly">Curly</SelectItem>
                  <SelectItem value="smooth">Smooth</SelectItem>
                  <SelectItem value="rough">Rough</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Primary Color */}
            <div>
              <label
                htmlFor="primaryColor"
                className="block text-sm font-medium text-gray-700"
              >
                Primary Color *
              </label>
              <input
                type="text"
                id="primaryColor"
                {...register("primaryColor", {
                  required: "Primary color is required",
                })}
                placeholder="e.g., Golden, Black, White, etc."
                className="h-10 w-full px-3 py-2 text-sm border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              />
              {errors.primaryColor && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.primaryColor.message}
                </p>
              )}
            </div>

            {/* Secondary Color */}
            <div>
              <label
                htmlFor="secondaryColor"
                className="block text-sm font-medium text-gray-700"
              >
                Secondary Color
              </label>
              <input
                type="text"
                id="secondaryColor"
                {...register("secondaryColor")}
                placeholder="e.g., White, Brown, etc."
                className="h-10 w-full px-3 py-2 text-sm border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              />
            </div>

            {/* Status */}
            <div>
              <label
                htmlFor="status"
                className="block text-sm font-medium text-gray-700"
              >
                Status *
              </label>
              <Select
                value={watch("status")}
                onValueChange={(value) => setValue("status", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="adoptable">Adoptable</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="adopted">Adopted</SelectItem>
                  <SelectItem value="hidden">Hidden</SelectItem>
                  <SelectItem value="waiting">Waiting</SelectItem>
                  <SelectItem value="in_treatment">In Treatment</SelectItem>
                  <SelectItem value="fostered">Fostered</SelectItem>
                </SelectContent>
              </Select>
              {errors.status && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.status.message}
                </p>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700"
            >
              Description *
            </label>
            <textarea
              id="description"
              rows={4}
              {...register("description", {
                required: "Description is required",
                minLength: {
                  value: 10,
                  message: "Description must be at least 10 characters",
                },
              })}
              placeholder="Describe the pet's personality, behavior, special needs, etc."
              className="w-full px-3 py-2 text-sm border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">
                {errors.description.message}
              </p>
            )}
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Photos *
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
              <div className="space-y-1 text-center">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  stroke="currentColor"
                  fill="none"
                  viewBox="0 0 48 48"
                  aria-hidden="true"
                >
                  <path
                    d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <div className="flex text-sm text-gray-600">
                  <label
                    htmlFor="file-upload"
                    className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
                  >
                    <span>Upload images</span>
                    <input
                      id="file-upload"
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageChange}
                      className="sr-only"
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">PNG, JPG up to 5MB each</p>
              </div>
            </div>
          </div>

          {/* Image Previews */}
          {previewUrls.length > 0 && (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {previewUrls.map((url, index) => (
                <div key={url} className="relative">
                  <img
                    src={url}
                    alt={`Preview ${index + 1}`}
                    className="h-24 w-24 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    aria-label={`Remove image ${index + 1}`}
                  >
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate("/pets")}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {isSubmitting ? "Creating..." : "Create Pet"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePetForm;
