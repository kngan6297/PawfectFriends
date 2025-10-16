import React, { useState, useRef } from "react";
import { toast } from "react-toastify";
import { Upload, X, Camera, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface ImageUploadProps {
  currentImage?: string;
  onImageUpload: (file: File) => Promise<void>;
  onImageDelete?: () => Promise<void>;
  type: "avatar" | "banner";
  disabled?: boolean;
  className?: string;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  currentImage,
  onImageUpload,
  onImageDelete,
  type,
  disabled = false,
  className = "",
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file");
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB");
      return;
    }

    try {
      setIsUploading(true);
      await onImageUpload(file);
      toast.success(
        `${type === "avatar" ? "Avatar" : "Banner"} uploaded successfully!`
      );
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(`Failed to upload ${type}`);
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDelete = async () => {
    if (!onImageDelete) return;

    try {
      setIsDeleting(true);
      await onImageDelete();
      toast.success(
        `${type === "avatar" ? "Avatar" : "Banner"} removed successfully!`
      );
    } catch (error) {
      console.error("Delete error:", error);
      toast.error(`Failed to remove ${type}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const getDefaultImage = () => {
    if (type === "avatar") {
      return "/images/default-avatar.png";
    }
    return "/images/default-banner.png";
  };

  const isAvatar = type === "avatar";

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Current Image Display */}
      <div className="relative">
        {isAvatar ? (
          // Avatar Display
          <div className="relative inline-block">
            <img
              src={currentImage || getDefaultImage()}
              alt={`${type} preview`}
              className={`w-24 h-24 rounded-full object-cover border-2 border-gray-200 ${
                disabled ? "opacity-50" : ""
              }`}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = getDefaultImage();
              }}
            />
            {!currentImage && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-full">
                <Camera className="h-8 w-8 text-gray-400" />
              </div>
            )}
          </div>
        ) : (
          // Banner Display
          <div className="relative">
            <img
              src={currentImage || getDefaultImage()}
              alt={`${type} preview`}
              className={`w-full h-32 object-cover rounded-lg border-2 border-gray-200 ${
                disabled ? "opacity-50" : ""
              }`}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = getDefaultImage();
              }}
            />
            {!currentImage && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
                <ImageIcon className="h-12 w-12 text-gray-400" />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Upload Controls */}
      <div className="flex flex-wrap gap-2">
        {/* Upload Button */}
        <Button
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isUploading}
          variant="outline"
          size="sm"
          leftIcon={isUploading ? undefined : Upload}
          className="flex items-center gap-2"
        >
          {isUploading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              Uploading...
            </>
          ) : (
            `Upload ${type === "avatar" ? "Avatar" : "Banner"}`
          )}
        </Button>

        {/* Delete Button */}
        {currentImage && onImageDelete && (
          <Button
            onClick={handleDelete}
            disabled={disabled || isDeleting}
            variant="outline"
            size="sm"
            leftIcon={isDeleting ? undefined : X}
            className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:border-red-300"
          >
            {isDeleting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                Removing...
              </>
            ) : (
              `Remove ${type === "avatar" ? "Avatar" : "Banner"}`
            )}
          </Button>
        )}
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || isUploading}
        aria-label={`Upload ${type}`}
        title={`Select ${type} image file`}
      />

      {/* Help Text */}
      <div className="text-sm text-gray-500">
        <p>Supported formats: JPG, PNG, GIF</p>
        <p>Maximum file size: 5MB</p>
        {isAvatar && <p>Recommended size: 400x400 pixels</p>}
        {!isAvatar && <p>Recommended size: 1200x400 pixels</p>}
      </div>
    </div>
  );
};

export default ImageUpload;
