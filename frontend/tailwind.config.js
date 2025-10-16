/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Pet Adoption Theme Colors - Using standard Tailwind colors
        primary: {
          50: "#eff6ff", // Sky blue (bg-blue-50)
          100: "#dbeafe", // Light blue (bg-blue-100)
          200: "#bfdbfe", // Pastel blue
          300: "#93c5fd", // Medium pastel blue
          400: "#60a5fa", // Blue-400
          500: "#3b82f6", // Blue-500 (primary button)
          600: "#2563eb", // Blue-600
          700: "#1d4ed8", // Blue-700
          800: "#1e40af", // Blue-800
          900: "#1e3a8a", // Blue-900 (text-blue-900)
        },
        secondary: {
          50: "#f8fafc", // Very light gray
          100: "#f1f5f9", // Light gray
          200: "#e2e8f0", // Medium gray
          300: "#cbd5e1", // Gray
          400: "#94a3b8", // Medium dark gray
          500: "#64748b", // Dark gray
          600: "#475569", // Very dark gray
          700: "#334155", // Almost black
          800: "#1e293b", // Gray-800 (text-gray-800)
          900: "#0f172a", // Very dark blue-gray
        },
        // Accent colors using standard Tailwind colors
        accent: {
          yellow: {
            50: "#fffbeb", // Amber-50
            100: "#fef3c7", // Amber-100
            200: "#fde68a", // Amber-200
            300: "#fcd34d", // Amber-300 (accent button)
            400: "#fbbf24", // Amber-400
            500: "#f59e0b", // Amber-500
            600: "#d97706", // Amber-600
            700: "#b45309", // Amber-700
            800: "#92400e", // Amber-800
            900: "#78350f", // Amber-900
          },
          purple: {
            50: "#faf5ff", // Purple-50
            100: "#f3e8ff", // Purple-100 (cards/badges)
            200: "#e9d5ff", // Purple-200
            300: "#d8b4fe", // Purple-300
            400: "#c084fc", // Purple-400
            500: "#a855f7", // Purple-500
            600: "#9333ea", // Purple-600
            700: "#7c3aed", // Purple-700
            800: "#6b21a8", // Purple-800
            900: "#581c87", // Purple-900
          },
          pink: {
            50: "#fdf2f8", // Pink-50
            100: "#fce7f3", // Pink-100
            200: "#fbcfe8", // Pink-200
            300: "#f9a8d4", // Pink-300 (accent button)
            400: "#f472b6", // Pink-400
            500: "#ec4899", // Pink-500
            600: "#db2777", // Pink-600
            700: "#be185d", // Pink-700
            800: "#9d174d", // Pink-800
            900: "#831843", // Pink-900
          },
          green: {
            50: "#f0fdf4", // Green-50
            100: "#dcfce7", // Green-100 (alert/success)
            200: "#bbf7d0", // Green-200
            300: "#86efac", // Green-300
            400: "#4ade80", // Green-400
            500: "#22c55e", // Green-500 (alternative primary)
            600: "#16a34a", // Green-600
            700: "#15803d", // Green-700
            800: "#166534", // Green-800
            900: "#14532d", // Green-900
          },
        },
        // Background colors
        background: {
          primary: "#eff6ff", // Sky blue background (bg-blue-50)
          secondary: "#f8fafc", // Light gray background
          card: "#ffffff", // White card background (bg-white)
        },
        // Text colors
        text: {
          primary: "#1e293b", // Gray-800 (text-gray-800)
          secondary: "#64748b", // Medium gray
          muted: "#94a3b8", // Light gray
          inverse: "#ffffff", // White text
        },
      },
      fontFamily: {
        sans: ["Inter var", "sans-serif"],
      },
      boxShadow: {
        soft: "0 2px 8px rgba(0, 0, 0, 0.06)",
        medium: "0 4px 12px rgba(0, 0, 0, 0.08)",
        sidebar: "2px 0 8px rgba(0, 0, 0, 0.04)",
      },
      keyframes: {
        shake: {
          "0%, 100%": { transform: "translateX(0)" },
          "10%, 30%, 50%, 70%, 90%": { transform: "translateX(-2px)" },
          "20%, 40%, 60%, 80%": { transform: "translateX(2px)" },
        },
      },
      animation: {
        shake: "shake 0.5s ease-in-out",
      },
    },
  },
  plugins: [require("@tailwindcss/forms")],
};
