import React from "react";
import { cn } from "@/utils/cn";

interface AvatarProps {
  src?: string;
  alt: string;
  fallback: string;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt,
  fallback,
  className = "",
  size = "md",
}) => {
  const [imageError, setImageError] = React.useState(false);
  const [imageLoaded, setImageLoaded] = React.useState(false);

  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base",
    xl: "w-16 h-16 text-lg",
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  const showImage = src && !imageError && imageLoaded;

  return (
    <div
      className={cn(
        "relative rounded-full bg-gray-200 flex items-center justify-center overflow-hidden",
        sizeClasses[size],
        className
      )}
    >
      {src && !imageError && (
        <img
          src={src}
          alt={alt}
          className={cn(
            "w-full h-full object-cover transition-opacity duration-200",
            imageLoaded ? "opacity-100" : "opacity-0"
          )}
          onError={handleImageError}
          onLoad={handleImageLoad}
        />
      )}

      {!showImage && (
        <div className="w-full h-full flex items-center justify-center bg-primary-500 text-white font-medium">
          {fallback.charAt(0).toUpperCase()}
        </div>
      )}
    </div>
  );
};
