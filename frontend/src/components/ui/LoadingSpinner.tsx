interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizes = {
  sm: "h-4 w-4",
  md: "h-8 w-8",
  lg: "h-12 w-12",
};

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = "md",
  className = "",
}) => {
  return (
    <div className="flex justify-center items-center">
      <div
        className={`animate-spin rounded-full border-4 border-gray-200 ${sizes[size]} ${className}`}
      >
        <div className="h-full w-full rounded-full border-4 border-primary-600 border-t-transparent" />
      </div>
    </div>
  );
};
