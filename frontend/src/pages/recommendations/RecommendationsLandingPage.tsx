import React, { useCallback, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card } from "@/components/ui/Card";
import {
  Brain,
  Zap,
  Clock,
  Users,
  ArrowRight,
  Search,
  Compass,
} from "lucide-react";

// Safer gtag typing (matches GA4 `event` signature)
declare global {
  interface Window {
    gtag?: (
      command: "event",
      action: string,
      params?: Record<string, any>
    ) => void;
  }
}

// Small analytics helper
const track = (action: string, params?: Record<string, any>) => {
  window?.gtag?.("event", action, { page: "rec_landing", ...params });
};

export const RecommendationsLandingPage: React.FC = () => {
  const navigate = useNavigate();
  const isNavigatingRef = useRef(false);

  const guardedNavigate = useCallback(
    (path: string, state: Record<string, any>) => {
      if (isNavigatingRef.current) return; // prevent double tap / double click
      isNavigatingRef.current = true;
      navigate(path, { state });
    },
    [navigate]
  );

  const onStartQuick = useCallback(() => {
    track("rec_mode_select", { mode: "ai" });
    guardedNavigate("/recommendations/ai", { source: "ai" });
  }, [guardedNavigate]);

  const onStartWizard = useCallback(() => {
    track("rec_mode_select", { mode: "wizard" });
    guardedNavigate("/recommendations/wizard", { source: "wizard" });
  }, [guardedNavigate]);

  return (
    <main className="min-h-screen flex flex-col" aria-labelledby="page-title">
      <div className="flex-grow">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          {/* Header */}
          <header className="text-center mb-12">
            <h1
              id="page-title"
              className="text-3xl font-bold text-gray-900 flex items-center justify-center gap-2 mb-4"
            >
              <Brain className="w-8 h-8 text-blue-600" aria-hidden />
              Find Your Perfect Pet
            </h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Pick your way to find a new friend
            </p>
          </header>

          <section aria-labelledby="how-title" className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2
                id="how-title"
                className="text-2xl font-semibold text-gray-900 mb-4"
              >
                Two smart ways to find your match — choose the one that fits you
                best
              </h2>
            </div>

            {/* Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Quick AI Version */}
              <Card
                role="region"
                aria-labelledby="quick-title"
                className="p-8 hover:shadow-lg transition-all duration-300 border-2 border-transparent hover:border-blue-400 hover:shadow-blue-100 flex flex-col focus-within:ring-2 focus-within:ring-blue-400 rounded-xl"
              >
                <div className="text-center mb-6">
                  <div
                    className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full mb-4 shadow-sm"
                    aria-hidden
                  >
                    <Search className="h-8 w-8 text-blue-700" />
                  </div>
                  <h3
                    id="quick-title"
                    className="text-xl font-semibold text-gray-900 mb-2"
                  >
                    ⚡ Quick Match (≈ 30–60s)
                  </h3>
                  <p className="text-gray-600">
                    Search engine style — fast, smart, and efficient
                  </p>
                </div>

                <ul className="space-y-4 mb-6 flex-grow">
                  <li className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-green-600" aria-hidden />
                    <span className="text-sm text-gray-700">
                      ≈ 30–60s • see results immediately
                    </span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Zap className="w-5 h-5 text-blue-600" aria-hidden />
                    <span className="text-sm text-gray-700">
                      Instant AI analysis
                    </span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-purple-600" aria-hidden />
                    <span className="text-sm text-gray-700">
                      Best for experienced users
                    </span>
                  </li>
                </ul>

                <div className="space-y-3 mb-6">
                  <h4 className="font-medium text-gray-900">Perfect for:</h4>
                  <ul className="space-y-2 text-sm text-gray-600 list-disc list-inside">
                    <li>I know what I need</li>
                    <li>Experienced pet owners</li>
                    <li>Quick decision making</li>
                    <li>Returning users</li>
                  </ul>
                </div>

                <button
                  onClick={onStartQuick}
                  className="w-full inline-flex items-center justify-center gap-2 mt-auto bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-600"
                  aria-label="Start Quick Match"
                >
                  Start Quick Match
                  <ArrowRight className="w-4 h-4" aria-hidden />
                </button>
              </Card>

              {/* Guided Wizard */}
              <Card
                role="region"
                aria-labelledby="wizard-title"
                className="p-8 hover:shadow-lg transition-all duration-300 border-2 border-transparent hover:border-green-400 hover:shadow-green-100 flex flex-col focus-within:ring-2 focus-within:ring-green-400 rounded-xl"
              >
                <div className="text-center mb-6">
                  <div
                    className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-100 to-green-200 rounded-full mb-4 shadow-sm"
                    aria-hidden
                  >
                    <Compass className="h-8 w-8 text-green-700" />
                  </div>
                  <h3
                    id="wizard-title"
                    className="text-xl font-semibold text-gray-900 mb-2"
                  >
                    🧭 Guided Discovery (≈ 5–8 min)
                  </h3>
                  <p className="text-gray-600">
                    Interactive quiz style — discovery, guidance, and learning
                  </p>
                </div>

                <ul className="space-y-4 mb-6 flex-grow">
                  <li className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-orange-600" aria-hidden />
                    <span className="text-sm text-gray-700">
                      ≈ 5–8 minutes • receive Badges & Plans
                    </span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Zap className="w-5 h-5 text-green-600" aria-hidden />
                    <span className="text-sm text-gray-700">
                      Step-by-step guidance
                    </span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-blue-600" aria-hidden />
                    <span className="text-sm text-gray-700">
                      Best for new users
                    </span>
                  </li>
                </ul>

                <div className="space-y-3 mb-6">
                  <h4 className="font-medium text-gray-900">Perfect for:</h4>
                  <ul className="space-y-2 text-sm text-gray-600 list-disc list-inside">
                    <li>I'm not sure, need guidance</li>
                    <li>First-time pet owners</li>
                    <li>Detailed preference setting</li>
                    <li>Learning about pet care</li>
                  </ul>
                </div>

                <button
                  onClick={onStartWizard}
                  className="w-full inline-flex items-center justify-center gap-2 mt-auto bg-gradient-to-r from-green-50 to-white hover:from-green-100 hover:to-green-50 text-green-800 font-medium py-3 px-4 rounded-lg border-2 border-green-300 hover:border-green-400 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-green-600"
                  aria-label="Start Guided Discovery"
                >
                  Start Guided Discovery
                  <ArrowRight className="w-4 h-4" aria-hidden />
                </button>
              </Card>
            </div>

            {/* Shared Benefits */}
            <section
              aria-label="Shared benefits"
              className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              <div className="text-center">
                <div
                  className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mb-3"
                  aria-hidden
                >
                  <Brain className="h-6 w-6 text-purple-600" />
                </div>
                <h4 className="font-medium text-gray-900 mb-2">
                  AI-Powered Matching
                </h4>
                <p className="text-sm text-gray-600">
                  Advanced algorithms analyze your preferences to find the best
                  possible matches
                </p>
              </div>

              <div className="text-center">
                <div
                  className="inline-flex items-center justify-center w-12 h-12 bg-yellow-100 rounded-full mb-3"
                  aria-hidden
                >
                  <Users className="h-6 w-6 text-yellow-600" />
                </div>
                <h4 className="font-medium text-gray-900 mb-2">
                  Personalized Results
                </h4>
                <p className="text-sm text-gray-600">
                  Get recommendations tailored to your lifestyle, living
                  situation, and preferences
                </p>
              </div>
            </section>

            {/* Quick Links */}
            <nav aria-label="Help links" className="mt-8 text-center">
              <p className="text-sm text-gray-500 mb-4">
                Can't decide? Start with{" "}
                <Link
                  to="/recommendations/wizard"
                  state={{ source: "wizard" }}
                  className="text-primary-600 underline focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary-600 rounded"
                  onClick={() =>
                    track("rec_link_click", { link: "wizard_inline" })
                  }
                >
                  Guided Discovery
                </Link>{" "}
                for our most complete experience.
              </p>
            </nav>
          </section>
        </div>
      </div>
    </main>
  );
};
