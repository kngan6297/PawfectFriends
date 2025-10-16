import React from "react";
import { Heart, UserPlus, LogIn, Star } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { Link } from "react-router-dom";

interface GuestPromptProps {
  type: "favorites" | "adoption" | "chat" | "tracking";
  className?: string;
}

const PROMPT_CONFIG = {
  favorites: {
    title: "Save Your Favorite Pets",
    description:
      "Create an account to save pets you love and get notified when they're available.",
    icon: Heart,
    benefits: [
      "Save unlimited pets to your favorites",
      "Get notifications when pets become available",
      "Track your adoption journey",
      "Access to exclusive pet updates",
    ],
  },
  adoption: {
    title: "Start Your Adoption Journey",
    description:
      "Sign up to apply for adoption and track your application status.",
    icon: Star,
    benefits: [
      "Submit adoption applications",
      "Track application status in real-time",
      "Receive updates from shelters",
      "Access adoption resources and guides",
    ],
  },
  chat: {
    title: "Chat with Shelters",
    description:
      "Create an account to ask questions and get personalized advice about pets.",
    icon: LogIn,
    benefits: [
      "Ask questions about specific pets",
      "Get personalized adoption advice",
      "Connect directly with shelter staff",
      "Receive instant responses",
    ],
  },
  tracking: {
    title: "Track Your Adoption Progress",
    description:
      "Sign up to monitor your adoption applications and stay updated.",
    icon: UserPlus,
    benefits: [
      "Track multiple adoption applications",
      "Receive status updates automatically",
      "Access adoption timeline",
      "Get reminders for next steps",
    ],
  },
};

export const GuestNote: React.FC = () => (
  <div className="text-sm text-center text-gray-600 bg-primary-50 border border-primary-100 rounded-lg p-4 mt-6">
    Want to save your matches or track adoptions?{" "}
    <Link
      to="/register"
      className="text-primary-600 font-medium underline hover:text-primary-800"
    >
      Create an account
    </Link>{" "}
    or{" "}
    <Link
      to="/login"
      className="text-primary-600 font-medium underline hover:text-primary-800"
    >
      log in
    </Link>{" "}
    to unlock full features.
  </div>
);
