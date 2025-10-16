import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { petApi } from "@/services/api";
import { Pet } from "@/types/pet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
  SelectSeparator,
} from "@/components/ui/Select";

interface PetFormData {
  name: string;
  type: string;
  species: string;
  breed: string;
  age: string;
  gender: string;
  size: string;
  coat?: string;
  primaryColor: string;
  secondaryColor?: string;
  description: string;
  status: string;
}

const EditPetForm: React.FC = () => {
  const navigate = useNavigate();
  const { petId } = useParams<{ petId: string }>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [pet, setPet] = useState<Pet | null>(null);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<PetFormData>();

  // Fetch pet data on component mount
  useEffect(() => {
    const fetchPet = async () => {
      if (!petId) {
        toast.error("Pet ID is required");
        navigate("/pets");
        return;
      }

      try {
        setIsLoading(true);
        const petData = await petApi.getById(petId);
        setPet(petData);

        // Pre-populate form with existing data
        reset({
          name: petData.name || "",
          type: petData.type || "",
          species: petData.species || "",
          breed: petData.breed || petData.breeds?.primary || "",
          age: petData.age || "",
          gender: petData.gender || "",
          size: petData.size || "",
          coat: petData.coat || "",
          primaryColor: petData.primaryColor || "",
          secondaryColor: petData.secondaryColor || "",
          description: petData.description || "",
          status: petData.status || "adoptable",
        });

        // Set existing photos as preview URLs
        if (petData.photos && petData.photos.length > 0) {
          const existingPhotoUrls = petData.photos
            .map((photo) => photo.url || photo.full)
            .filter((url): url is string => url !== undefined);
          setPreviewUrls(existingPhotoUrls);
        }
      } catch (error) {
        console.error("Error fetching pet:", error);
        toast.error("Failed to load pet data");
        navigate("/pets");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPet();
  }, [petId, navigate, reset]);

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

  const onSubmit = async (data: PetFormData) => {
    if (!petId) {
      toast.error("Pet ID is required");
      return;
    }

    try {
      setIsSubmitting(true);
      const formData = new FormData();

      // Append pet data
      Object.entries(data).forEach(([key, value]) => {
        formData.append(key, value.toString());
      });

      // Append new images
      selectedImages.forEach((image, index) => {
        formData.append("images", image);
      });

      await petApi.updatePet(petId, formData);
      toast.success("Pet updated successfully!");
      navigate(`/pets/${petId}`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to update pet";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <span className="ml-2">Loading pet data...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!pet) {
    return (
      <div className="w-full py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="text-center">
            <h1 className="text-xl font-semibold text-gray-900 mb-4">
              Pet Not Found
            </h1>
            <p className="text-gray-600 mb-4">
              The pet you're looking for doesn't exist or has been removed.
            </p>
            <button
              onClick={() => navigate("/pets")}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Back to Pets
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full py-8 px-4 sm:px-6 lg:px-8">
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          Edit Pet: {pet.name}
        </h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Name */}
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700"
            >
              Name
            </label>
            <input
              type="text"
              id="name"
              {...register("name", { required: "Name is required" })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          {/* Type */}
          <div>
            <label
              htmlFor="type"
              className="block text-sm font-medium text-gray-700"
            >
              Type
            </label>
            <Select
              value={watch("type")}
              onValueChange={(value) => setValue("type", value)}
            >
              <SelectTrigger className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
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
              <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>
            )}
          </div>

          {/* Breed */}
          <div>
            <label
              htmlFor="breed"
              className="block text-sm font-medium text-gray-700"
            >
              Breed
            </label>
            <input
              type="text"
              id="breed"
              {...register("breed", { required: "Breed is required" })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
            {errors.breed && (
              <p className="mt-1 text-sm text-red-600">
                {errors.breed.message}
              </p>
            )}
          </div>

          {/* Age */}
          <div>
            <label
              htmlFor="age"
              className="block text-sm font-medium text-gray-700"
            >
              Age
            </label>
            <Select
              value={watch("age")}
              onValueChange={(value) => setValue("age", value)}
            >
              <SelectTrigger className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                <SelectValue placeholder="Select age" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="baby">Baby</SelectItem>
                <SelectItem value="young">Young</SelectItem>
                <SelectItem value="adult">Adult</SelectItem>
                <SelectItem value="senior">Senior</SelectItem>
              </SelectContent>
            </Select>
            {errors.age && (
              <p className="mt-1 text-sm text-red-600">{errors.age.message}</p>
            )}
          </div>

          {/* Gender */}
          <div>
            <label
              htmlFor="gender"
              className="block text-sm font-medium text-gray-700"
            >
              Gender
            </label>
            <Select
              value={watch("gender")}
              onValueChange={(value) => setValue("gender", value)}
            >
              <SelectTrigger className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
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
              Size
            </label>
            <Select
              value={watch("size")}
              onValueChange={(value) => setValue("size", value)}
            >
              <SelectTrigger className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                <SelectValue placeholder="Select size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="small">Small</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="large">Large</SelectItem>
              </SelectContent>
            </Select>
            {errors.size && (
              <p className="mt-1 text-sm text-red-600">{errors.size.message}</p>
            )}
          </div>

          {/* Species */}
          <div>
            <label
              htmlFor="species"
              className="block text-sm font-medium text-gray-700"
            >
              Species
            </label>
            <input
              type="text"
              id="species"
              {...register("species", { required: "Species is required" })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="e.g., Golden Retriever, Persian, etc."
            />
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
            <select
              id="coat"
              {...register("coat")}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="">Select coat type</option>
              <option value="short">Short</option>
              <option value="medium">Medium</option>
              <option value="long">Long</option>
              <option value="wire">Wire</option>
              <option value="curly">Curly</option>
              <option value="smooth">Smooth</option>
              <option value="rough">Rough</option>
            </select>
          </div>

          {/* Primary Color */}
          <div>
            <label
              htmlFor="primaryColor"
              className="block text-sm font-medium text-gray-700"
            >
              Primary Color
            </label>
            <input
              type="text"
              id="primaryColor"
              {...register("primaryColor", {
                required: "Primary color is required",
              })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="e.g., Golden, Black, White, etc."
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
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="e.g., White, Brown, etc."
            />
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700"
            >
              Description
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
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">
                {errors.description.message}
              </p>
            )}
          </div>

          {/* Status */}
          <div>
            <label
              htmlFor="status"
              className="block text-sm font-medium text-gray-700"
            >
              Status
            </label>
            <select
              id="status"
              {...register("status", { required: "Status is required" })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="adoptable">Adoptable</option>
              <option value="pending">Pending</option>
              <option value="adopted">Adopted</option>
              <option value="hidden">Hidden</option>
              <option value="waiting">Waiting</option>
              <option value="in_treatment">In Treatment</option>
              <option value="fostered">Fostered</option>
            </select>
            {errors.status && (
              <p className="mt-1 text-sm text-red-600">
                {errors.status.message}
              </p>
            )}
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Photos
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
                    <span>Upload additional images</span>
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
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
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

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => navigate(`/pets/${petId}`)}
              className="mr-4 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {isSubmitting ? "Updating..." : "Update Pet"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditPetForm;
