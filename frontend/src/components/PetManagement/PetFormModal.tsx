import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { petApi } from "@/services/api";
import { Pet } from "@/types/pet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";

interface PetFormData {
  name: string;
  type: string;
  breed: string;
  age: string;
  gender: string;
  size: string;
  color: string;
  description: string;
  status: string;
}

interface PetFormModalProps {
  open: boolean;
  onClose: () => void;
  pet?: Pet | null; // null for create, Pet object for edit
  onPetsChange: () => void;
}

const PetFormModal: React.FC<PetFormModalProps> = ({
  open,
  onClose,
  pet,
  onPetsChange,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  const isEditMode = Boolean(pet);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<PetFormData>({
    defaultValues: {
      status: "adoptable",
    },
  });

  // Pre-populate form when editing
  useEffect(() => {
    if (open && pet && isEditMode) {
      setValue("name", pet.name || "");
      setValue("type", pet.type || "");
      setValue("breed", pet.breed || pet.breeds?.primary || "");
      setValue("age", pet.age || "");
      setValue("gender", pet.gender || "");
      setValue("size", pet.size || "");
      setValue("color", pet.primaryColor || "");
      setValue("description", pet.description || "");
      setValue("status", pet.status || "adoptable");

      // Set existing photos as preview URLs
      if (pet.photos && pet.photos.length > 0) {
        const existingPhotoUrls = pet.photos
          .map((photo) => photo.url || photo.full)
          .filter((url): url is string => url !== undefined);
        setPreviewUrls(existingPhotoUrls);
      } else {
        setPreviewUrls([]);
      }
    } else if (open && !isEditMode) {
      // Reset form for create mode
      reset({
        name: "",
        type: "",
        breed: "",
        age: "",
        gender: "",
        size: "",
        color: "",
        description: "",
        status: "adoptable",
      });
      setPreviewUrls([]);
      setSelectedImages([]);
    }
  }, [open, pet, isEditMode, setValue, reset]);

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
    if (!isEditMode && selectedImages.length === 0) {
      toast.error("Please upload at least one image");
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

      if (isEditMode && pet) {
        const petId = pet._id || pet.id;
        if (!petId) {
          throw new Error("Pet ID is required for updating");
        }
        await petApi.updatePet(petId as string, formData);
        toast.success("Pet updated successfully!");
      } else {
        await petApi.createPet(formData);
        toast.success("Pet created successfully!");
      }

      onPetsChange();
      onClose();
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : `Failed to ${isEditMode ? "update" : "create"} pet`;
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getModalTitle = () => {
    return isEditMode ? `Edit Pet: ${pet?.name}` : "Add New Pet";
  };

  const getModalDescription = () => {
    return isEditMode
      ? `Update information for ${pet?.name}.`
      : "Add a new pet to your shelter. Fill in the details below.";
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col rounded-2xl shadow-xl bg-white border border-secondary-200 overflow-hidden">
        {/* HEADER */}
        <DialogHeader className="sticky top-0 bg-white z-30 border-b px-6 pt-6 pb-3 rounded-t-2xl flex-shrink-0">
          <DialogTitle className="text-xl font-semibold">
            {getModalTitle()}
          </DialogTitle>
          <DialogDescription>{getModalDescription()}</DialogDescription>
        </DialogHeader>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto px-6 py-4 min-h-0">
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
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
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
                <Select
                  value={watch("type")}
                  onValueChange={(value) => setValue("type", value)}
                >
                  <SelectTrigger className="w-full h-10 px-3 py-2 text-sm border-2 border-gray-200 rounded-lg bg-white shadow-sm hover:border-primary-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-all duration-200">
                    <SelectValue placeholder="Select a type" />
                  </SelectTrigger>
                  <SelectContent className="border-2 border-gray-200 rounded-lg shadow-lg">
                    <SelectItem
                      value="dog"
                      className="text-sm py-2 px-3 hover:bg-primary-50 focus:bg-primary-50"
                    >
                      Dog
                    </SelectItem>
                    <SelectItem
                      value="cat"
                      className="text-sm py-2 px-3 hover:bg-primary-50 focus:bg-primary-50"
                    >
                      Cat
                    </SelectItem>
                    <SelectItem
                      value="bird"
                      className="text-sm py-2 px-3 hover:bg-primary-50 focus:bg-primary-50"
                    >
                      Bird
                    </SelectItem>
                    <SelectItem
                      value="other"
                      className="text-sm py-2 px-3 hover:bg-primary-50 focus:bg-primary-50"
                    >
                      Other
                    </SelectItem>
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
                  Age *
                </label>
                <Select
                  value={watch("age")}
                  onValueChange={(value) => setValue("age", value)}
                >
                  <SelectTrigger className="w-full h-10 px-3 py-2 text-sm border-2 border-gray-200 rounded-lg bg-white shadow-sm hover:border-primary-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-all duration-200">
                    <SelectValue placeholder="Select age" />
                  </SelectTrigger>
                  <SelectContent className="border-2 border-gray-200 rounded-lg shadow-lg">
                    <SelectItem
                      value="baby"
                      className="text-sm py-2 px-3 hover:bg-primary-50 focus:bg-primary-50"
                    >
                      Baby
                    </SelectItem>
                    <SelectItem
                      value="young"
                      className="text-sm py-2 px-3 hover:bg-primary-50 focus:bg-primary-50"
                    >
                      Young
                    </SelectItem>
                    <SelectItem
                      value="adult"
                      className="text-sm py-2 px-3 hover:bg-primary-50 focus:bg-primary-50"
                    >
                      Adult
                    </SelectItem>
                    <SelectItem
                      value="senior"
                      className="text-sm py-2 px-3 hover:bg-primary-50 focus:bg-primary-50"
                    >
                      Senior
                    </SelectItem>
                  </SelectContent>
                </Select>
                {errors.age && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.age.message}
                  </p>
                )}
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
                  <SelectTrigger className="w-full h-10 px-3 py-2 text-sm border-2 border-gray-200 rounded-lg bg-white shadow-sm hover:border-primary-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-all duration-200">
                    <SelectValue placeholder="Select a gender" />
                  </SelectTrigger>
                  <SelectContent className="border-2 border-gray-200 rounded-lg shadow-lg">
                    <SelectItem
                      value="male"
                      className="text-sm py-2 px-3 hover:bg-primary-50 focus:bg-primary-50"
                    >
                      Male
                    </SelectItem>
                    <SelectItem
                      value="female"
                      className="text-sm py-2 px-3 hover:bg-primary-50 focus:bg-primary-50"
                    >
                      Female
                    </SelectItem>
                    <SelectItem
                      value="unknown"
                      className="text-sm py-2 px-3 hover:bg-primary-50 focus:bg-primary-50"
                    >
                      Unknown
                    </SelectItem>
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
                  <SelectTrigger className="w-full h-10 px-3 py-2 text-sm border-2 border-gray-200 rounded-lg bg-white shadow-sm hover:border-primary-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-all duration-200">
                    <SelectValue placeholder="Select size" />
                  </SelectTrigger>
                  <SelectContent className="border-2 border-gray-200 rounded-lg shadow-lg">
                    <SelectItem
                      value="small"
                      className="text-sm py-2 px-3 hover:bg-primary-50 focus:bg-primary-50"
                    >
                      Small
                    </SelectItem>
                    <SelectItem
                      value="medium"
                      className="text-sm py-2 px-3 hover:bg-primary-50 focus:bg-primary-50"
                    >
                      Medium
                    </SelectItem>
                    <SelectItem
                      value="large"
                      className="text-sm py-2 px-3 hover:bg-primary-50 focus:bg-primary-50"
                    >
                      Large
                    </SelectItem>
                  </SelectContent>
                </Select>
                {errors.size && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.size.message}
                  </p>
                )}
              </div>

              {/* Color */}
              <div>
                <label
                  htmlFor="color"
                  className="block text-sm font-medium text-gray-700"
                >
                  Color *
                </label>
                <input
                  type="text"
                  id="color"
                  {...register("color", { required: "Color is required" })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
                {errors.color && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.color.message}
                  </p>
                )}
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
                  <SelectTrigger className="w-full h-10 px-3 py-2 text-sm border-2 border-gray-200 rounded-lg bg-white shadow-sm hover:border-primary-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-all duration-200">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent className="border-2 border-gray-200 rounded-lg shadow-lg">
                    <SelectItem
                      value="adoptable"
                      className="text-sm py-2 px-3 hover:bg-primary-50 focus:bg-primary-50"
                    >
                      Adoptable
                    </SelectItem>
                    <SelectItem
                      value="pending"
                      className="text-sm py-2 px-3 hover:bg-primary-50 focus:bg-primary-50"
                    >
                      Pending
                    </SelectItem>
                    <SelectItem
                      value="adopted"
                      className="text-sm py-2 px-3 hover:bg-primary-50 focus:bg-primary-50"
                    >
                      Adopted
                    </SelectItem>
                    <SelectItem
                      value="hidden"
                      className="text-sm py-2 px-3 hover:bg-primary-50 focus:bg-primary-50"
                    >
                      Hidden
                    </SelectItem>
                    <SelectItem
                      value="waiting"
                      className="text-sm py-2 px-3 hover:bg-primary-50 focus:bg-primary-50"
                    >
                      Waiting
                    </SelectItem>
                    <SelectItem
                      value="in_treatment"
                      className="text-sm py-2 px-3 hover:bg-primary-50 focus:bg-primary-50"
                    >
                      In Treatment
                    </SelectItem>
                    <SelectItem
                      value="fostered"
                      className="text-sm py-2 px-3 hover:bg-primary-50 focus:bg-primary-50"
                    >
                      Fostered
                    </SelectItem>
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
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
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
                Photos {!isEditMode && "*"}
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
                      <span>
                        {isEditMode
                          ? "Upload additional images"
                          : "Upload images"}
                      </span>
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
                  <p className="text-xs text-gray-500">
                    PNG, JPG up to 5MB each
                  </p>
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
          </form>
        </div>

        {/* FOOTER */}
        <div className="sticky bottom-0 bg-white z-30 border-t px-6 pb-6 pt-4 rounded-b-2xl flex-shrink-0">
          <DialogFooter className="flex justify-end gap-3">
            <Button
              className="bg-secondary-200 text-secondary-700 border-none rounded-2xl px-6 py-2 hover:bg-secondary-300 hover:text-secondary-900 shadow-sm transition-all"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              className="bg-primary-600 text-white rounded-2xl px-6 py-2 hover:bg-primary-700 shadow-md transition-all"
              onClick={handleSubmit(onSubmit)}
              disabled={isSubmitting}
            >
              {isSubmitting
                ? isEditMode
                  ? "Updating..."
                  : "Creating..."
                : isEditMode
                ? "Update Pet"
                : "Create Pet"}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PetFormModal;
