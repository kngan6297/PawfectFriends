import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ConfettiAnimationProps {
  isVisible: boolean;
  duration?: number;
  particleCount?: number;
  sparkleCount?: number;
  onComplete?: () => void;
}

export const ConfettiAnimation: React.FC<ConfettiAnimationProps> = ({
  isVisible,
  duration = 3000,
  particleCount = 100,
  sparkleCount = 30,
  onComplete,
}) => {
  const [particles, setParticles] = useState<
    Array<{
      id: number;
      left: number;
      top: number;
      size: number;
      color: string;
      delay: number;
      duration: number;
      rotation: number;
      isRound: boolean;
    }>
  >([]);

  const [sparkles, setSparkles] = useState<
    Array<{
      id: number;
      left: number;
      top: number;
      color: string;
      delay: number;
      duration: number;
    }>
  >([]);

  // Generate particles on mount
  useEffect(() => {
    if (isVisible) {
      const newParticles = Array.from({ length: particleCount }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 100,
        size: Math.random() * 8 + 4,
        color: [
          "bg-pink-400",
          "bg-yellow-400",
          "bg-blue-400",
          "bg-green-400",
          "bg-purple-400",
          "bg-red-400",
          "bg-indigo-400",
          "bg-orange-400",
        ][i % 8],
        delay: Math.random() * 3,
        duration: 1.5 + Math.random() * 2,
        rotation: Math.random() * 360,
        isRound: Math.random() > 0.5,
      }));

      const newSparkles = Array.from({ length: sparkleCount }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 100,
        color: ["#FFD700", "#FF69B4", "#00CED1", "#FF6347"][i % 4],
        delay: Math.random() * 2,
        duration: 0.5 + Math.random() * 1,
      }));

      setParticles(newParticles);
      setSparkles(newSparkles);

      // Call onComplete after animation duration
      const timer = setTimeout(() => {
        onComplete?.();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isVisible, particleCount, sparkleCount, duration, onComplete]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      <AnimatePresence>
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className={`absolute ${particle.color}`}
            style={{
              left: `${particle.left}%`,
              top: `${particle.top}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              borderRadius: particle.isRound ? "50%" : "0%",
            }}
            initial={{
              opacity: 0,
              scale: 0,
              y: -20,
            }}
            animate={{
              opacity: [0, 1, 1, 0],
              scale: [0, 1, 1, 0],
              y: [-20, 0, 20, 40],
              rotate: [0, particle.rotation],
            }}
            transition={{
              duration: particle.duration,
              delay: particle.delay,
              ease: "easeOut",
            }}
            exit={{
              opacity: 0,
              scale: 0,
            }}
          />
        ))}
      </AnimatePresence>

      <AnimatePresence>
        {sparkles.map((sparkle) => (
          <motion.div
            key={`sparkle-${sparkle.id}`}
            className="absolute animate-pulse"
            style={{
              left: `${sparkle.left}%`,
              top: `${sparkle.top}%`,
              width: "2px",
              height: "2px",
              backgroundColor: sparkle.color,
            }}
            initial={{
              opacity: 0,
              scale: 0,
            }}
            animate={{
              opacity: [0, 1, 1, 0],
              scale: [0, 1, 1.5, 0],
            }}
            transition={{
              duration: sparkle.duration,
              delay: sparkle.delay,
              ease: "easeInOut",
            }}
            exit={{
              opacity: 0,
              scale: 0,
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

export default ConfettiAnimation;
