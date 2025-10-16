import React from "react";
import { motion } from "framer-motion";

interface PawSpinnerProps {
  size?: "sm" | "md" | "lg";
  color?: string;
  className?: string;
}

export const PawSpinner: React.FC<PawSpinnerProps> = ({
  size = "md",
  color = "currentColor",
  className = "",
}) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  };

  return (
    <motion.div
      className={`${sizeClasses[size]} ${className}`}
      animate={{
        rotate: [0, 360],
        scale: [1, 1.1, 1],
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      <svg viewBox="0 0 24 24" fill={color} className="w-full h-full">
        {/* Main paw pad */}
        <motion.circle
          cx="12"
          cy="14"
          r="4"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.8, 1, 0.8],
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Top left toe */}
        <motion.circle
          cx="8"
          cy="10"
          r="2"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.6, 1, 0.6],
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.2,
          }}
        />

        {/* Top right toe */}
        <motion.circle
          cx="16"
          cy="10"
          r="2"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.6, 1, 0.6],
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.4,
          }}
        />

        {/* Bottom left toe */}
        <motion.circle
          cx="6"
          cy="16"
          r="2"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.6, 1, 0.6],
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.6,
          }}
        />

        {/* Bottom right toe */}
        <motion.circle
          cx="18"
          cy="16"
          r="2"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.6, 1, 0.6],
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.8,
          }}
        />
      </svg>
    </motion.div>
  );
};
