import React, { useState } from "react";

interface PetImageProps {
  src?: string;
  alt: string;
  className?: string;
  fallbackText?: string;
}

export const PetImage: React.FC<PetImageProps> = ({
  src,
  alt,
  className = "w-16 h-16 object-cover rounded-lg",
  fallbackText = "🐾",
}) => {
  const [hasError, setHasError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  if (!src || hasError) {
    return (
      <div
        className={`${className} bg-gray-100 flex items-center justify-center text-2xl text-gray-400 border border-gray-200`}
      >
        {fallbackText}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={`${className} ${imageLoaded ? "opacity-100" : "opacity-0"}`}
      onLoad={() => setImageLoaded(true)}
      onError={() => setHasError(true)}
    />
  );
};
