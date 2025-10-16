import React, { useEffect, useMemo } from "react";
import {
  CheckCircle,
  Edit,
  ClipboardList,
  Shield,
  AlertTriangle,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";

interface ReviewStepProps {
  preferences: any;
  onEditStep: (step: number) => void;

  /** optional: hook readiness with parent (if available) */
  onViewInfo?: (id: string) => void; // e.g. 'review_preflight_seen'
  onAckTip?: (id: string) => void; // e.g. 'review_ready_ack'
  readinessScoreOverride?: number;
  policyFlagsOverride?: {
    id: string;
    severity: "warn" | "deprioritize" | "block";
    reason: string;
  }[];
}

/* helpers: standardize string | array */
const getSingle = (v: any) => (Array.isArray(v) ? v[0] ?? "" : v ?? "");
const getArray = (v: any) => (Array.isArray(v) ? v : v ? [v] : []);

/* calculate local readiness (fallback if parent doesn't send override) */
function computeReadiness(preferences: any) {
  const time = getSingle(preferences.timeAvailable)?.toLowerCase();
  const budget = getSingle(preferences.budget)?.toLowerCase();
  const living = getSingle(preferences.livingSpace)?.toLowerCase();
  const exp = getSingle(preferences.experience)?.toLowerCase();

  let timeScore = 60;
  if (["significant", "wfh", "flexible"].some((k) => time.includes(k)))
    timeScore = 90;
  else if (time.includes("moderate")) timeScore = 75;
  else if (time.includes("minimal")) timeScore = 55;

  let budgetScore = 70;
  if (budget.includes("high")) budgetScore = 90;
  else if (budget.includes("medium") || budget.includes("mid"))
    budgetScore = 75;
  else if (budget.includes("low")) budgetScore = 55;

  let spaceScore = 70;
  if (living.includes("rural-spacious")) spaceScore = 95;
  else if (living.includes("house-yard")) spaceScore = 85;
  else if (living.includes("house-no-yard")) spaceScore = 75;
  else if (living.includes("apartment-moderate")) spaceScore = 70;
  else if (living.includes("apartment-limited")) spaceScore = 60;

  let expScore = 70;
  if (exp.includes("professional")) expScore = 95;
  else if (exp.includes("experienced") || exp.includes("some")) expScore = 80;
  else if (exp.includes("first")) expScore = 60;

  const score = Math.min(
    100,
    Math.round((timeScore + budgetScore + spaceScore + expScore) / 4)
  );
  const badge = score >= 75;

  const flags: string[] = [];
  if (timeScore < 65) flags.push("Low daily time");
  if (budgetScore < 65) flags.push("Tight monthly budget");
  if (spaceScore < 70) flags.push("Limited living space");
  if (expScore < 65) flags.push("First-time owner");

  return {
    score,
    badge,
    bars: {
      time: timeScore,
      budget: budgetScore,
      space: spaceScore,
      experience: expScore,
    },
    flags,
  };
}

/* safety preview (suitability checks) – no gating, just warnings */
function computePolicyGates(preferences: any) {
  const gates: {
    id: string;
    severity: "warn" | "deprioritize" | "block";
    reason: string;
  }[] = [];

  const living = getSingle(preferences.livingSpace)?.toLowerCase();
  const act = getSingle(preferences.activityLevel)?.toLowerCase();
  const time = getSingle(preferences.timeAvailable)?.toLowerCase();
  const budget = getSingle(preferences.budget)?.toLowerCase();
  const kids = getSingle(preferences.hasChildren)?.toLowerCase();
  const sizes = getArray(preferences.preferredSizes).map((s: string) =>
    s?.toLowerCase()
  );

  if (
    living.startsWith("apartment-") &&
    act.includes("high") &&
    time.includes("minimal")
  ) {
    gates.push({
      id: "high_energy_small_space",
      severity: "deprioritize",
      reason:
        "Apartment + high energy + limited time: consider low/medium energy pets.",
    });
  }
  if (
    budget.includes("low") &&
    getSingle(preferences.groomingPreference)?.toLowerCase().includes("high")
  ) {
    gates.push({
      id: "grooming_cost",
      severity: "warn",
      reason:
        "High grooming preference but low budget: costs may exceed expectations.",
    });
  }
  if (kids === "yes" && sizes.includes("large")) {
    gates.push({
      id: "kids_vs_large",
      severity: "warn",
      reason:
        "Young children + large pets need supervision & careful training.",
    });
  }

  return gates;
}

export const ReviewStep: React.FC<ReviewStepProps> = ({
  preferences,
  onEditStep,
  onViewInfo,
  onAckTip,
  readinessScoreOverride,
  policyFlagsOverride,
}) => {
  useEffect(() => {
    onViewInfo?.("review_preflight_seen");
  }, [onViewInfo]);

  const rLocal = useMemo(() => computeReadiness(preferences), [preferences]);
  const r = {
    ...rLocal,
    score: readinessScoreOverride ?? rLocal.score,
    badge: (readinessScoreOverride ?? rLocal.score) >= 75,
  };

  const gatesLocal = useMemo(
    () => computePolicyGates(preferences),
    [preferences]
  );
  const gates = policyFlagsOverride ?? gatesLocal;

  const formatValue = (value: any): string => {
    if (Array.isArray(value)) return value.join(", ");
    if (typeof value === "object" && value !== null)
      return value[0]?.toString() || "";
    return value?.toString() || "Not specified";
  };

  const getStepData = () => [
    {
      title: "Lifestyle",
      icon: "🏠",
      stepNumber: 1,
      fields: [
        { label: "Lifestyle", value: preferences.lifestyle },
        { label: "Experience", value: preferences.experience },
        { label: "Time Available", value: preferences.timeAvailable },
        { label: "Activity Level", value: preferences.activityLevel },
      ],
    },
    {
      title: "Living Conditions",
      icon: "🏡",
      stepNumber: 2,
      fields: [
        { label: "Living Space", value: preferences.livingSpace },
        { label: "Has Children", value: preferences.hasChildren },
        { label: "Has Other Pets", value: preferences.hasOtherPets },
        ...(getSingle(preferences.hasYard) === "yes" ||
        getSingle(preferences.livingSpace) === "house-yard" ||
        getSingle(preferences.livingSpace) === "rural-spacious"
          ? [{ label: "Has Yard", value: "Yes" }]
          : []),
        { label: "Budget", value: preferences.budget },
      ],
    },
    {
      title: "Pet Preferences",
      icon: "🐾",
      stepNumber: 3,
      fields: [
        { label: "Preferred Species", value: preferences.preferredSpecies },
        { label: "Activity Level", value: preferences.activityLevel },
        {
          label: "Additional Info",
          value: preferences.additionalInfo || "None",
        },
      ],
    },
  ];

  const getSummaryInsights = () => {
    const insights: string[] = [];
    if (
      getSingle(preferences.lifestyle) === "active" &&
      getSingle(preferences.livingSpace)?.includes("yard")
    ) {
      insights.push(
        "Perfect match for high-energy dogs that need garden space!"
      );
    }
    if (
      getSingle(preferences.livingSpace)?.includes("apartment") &&
      getArray(preferences.preferredSpecies).includes("cat")
    ) {
      insights.push("Great choice! Cats are perfect for apartment living.");
    }
    if (
      getSingle(preferences.experience) === "first-time" &&
      getArray(preferences.preferredSpecies).includes("dog")
    ) {
      insights.push(
        "Suggestion: start with low-maintenance dog breeds for your first experience."
      );
    }
    if (
      getSingle(preferences.timeAvailable) === "minimal" &&
      getArray(preferences.preferredSpecies).includes("cat")
    ) {
      insights.push(
        "Cats fit busy schedules: independent and low maintenance."
      );
    }
    return insights;
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
          <CheckCircle className="h-10 w-10 text-green-600" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Quiz Complete! 🎉
        </h2>
        <p className="text-gray-600 text-lg">
          Review your answers before we find your perfect pet match
        </p>
      </div>

      {/* NEW: Preflight Readiness */}
      <div className="bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-xl p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="h-6 w-6 text-emerald-600" />
          <h3 className="text-lg font-semibold text-emerald-900">
            Preflight Readiness
          </h3>
          <Badge
            className={
              r.badge
                ? "bg-emerald-600 text-white"
                : "bg-gray-200 text-gray-800"
            }
          >
            {r.badge ? "🎖️ Ready badge" : "Keep improving"}
          </Badge>
          <span className="text-emerald-800 font-medium ml-auto">
            Score: {r.score}/100
          </span>
        </div>

        {/* bars */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            ["Time", r.bars.time],
            ["Budget", r.bars.budget],
            ["Space", r.bars.space],
            ["Experience", r.bars.experience],
          ].map(([label, val]) => (
            <div key={label as string}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-700">{label}</span>
                <span className="text-gray-500">{val as number}/100</span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full">
                <div
                  className="h-2 bg-emerald-500 rounded-full"
                  style={{ width: `${val as number}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* flags */}
        {(rLocal.flags?.length ?? 0) > 0 && (
          <div className="mt-4 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-3">
            <div className="flex items-center gap-2 font-medium">
              <AlertTriangle className="w-4 h-4" /> Attention
            </div>
            <ul className="list-disc pl-5 mt-1">
              {rLocal.flags.map((f: string) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* NEW: Suitability (Safety) checks */}
      {gates.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle className="h-6 w-6 text-amber-600" />
            <h3 className="text-lg font-semibold text-amber-900">
              Suitability checks
            </h3>
          </div>
          <ul className="text-sm text-amber-800 space-y-1">
            {gates.map((g) => (
              <li key={g.id}>
                <strong className="uppercase">{g.severity}</strong>: {g.reason}
              </li>
            ))}
          </ul>
          <p className="text-xs text-amber-700 mt-2">
            * These points are for your consideration only; the Wizard algorithm
            will prioritize safety/suitability when ranking.
          </p>
        </div>
      )}

      {/* Existing Summary Card */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 mb-8">
        <div className="flex items-center mb-4">
          <ClipboardList className="h-6 w-6 text-blue-600 mr-3" />
          <h3 className="text-xl font-semibold text-blue-900">
            Your Pet Profile Summary
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="text-center p-3 bg-white rounded-lg border border-blue-100">
            <div className="text-2xl mb-2">🏠</div>
            <div className="text-sm font-medium text-blue-900">Lifestyle</div>
            <div className="text-xs text-blue-600 capitalize">
              {getSingle(preferences.lifestyle) || "Not set"}
            </div>
          </div>
          <div className="text-center p-3 bg-white rounded-lg border border-blue-100">
            <div className="text-2xl mb-2">🏡</div>
            <div className="text-sm font-medium text-blue-900">
              Living Space
            </div>
            <div className="text-xs text-blue-600">
              {getSingle(preferences.livingSpace)?.split("-")[0] || "Not set"}
            </div>
          </div>
          <div className="text-center p-3 bg-white rounded-lg border border-blue-100">
            <div className="text-2xl mb-2">🐾</div>
            <div className="text-sm font-medium text-blue-900">
              Preferred Pets
            </div>
            <div className="text-xs text-blue-600">
              {getArray(preferences.preferredSpecies)?.length || 0} species
            </div>
          </div>
        </div>

        {(() => {
          const insights = getSummaryInsights();
          return insights.length > 0 ? (
            <div className="bg-blue-100 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">
                💡 What we learned about you:
              </h4>
              <ul className="text-sm text-blue-800 space-y-1">
                {insights.map((insight, index) => (
                  <li key={index}>• {insight}</li>
                ))}
              </ul>
            </div>
          ) : null;
        })()}
      </div>

      {/* Step details + Edit buttons */}
      <div className="space-y-6">
        {getStepData().map((step) => (
          <div
            key={step.title}
            className="border border-gray-200 rounded-lg p-6 hover:border-gray-300 transition-colors"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="flex items-center justify-center w-8 h-8 bg-primary-100 rounded-full mr-3">
                  <span className="text-sm font-semibold text-primary-600">
                    {step.stepNumber}
                  </span>
                </div>
                <span className="text-2xl mr-3">{step.icon}</span>
                <h3 className="text-lg font-semibold text-gray-900">
                  {step.title}
                </h3>
              </div>
              <button
                onClick={() => onEditStep(step.stepNumber)}
                className="flex items-center text-sm text-primary-600 hover:text-primary-700 hover:bg-primary-50 px-3 py-2 rounded-md transition-colors"
              >
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {step.fields.map((field, idx) => (
                <div key={idx} className="space-y-1">
                  <dt className="text-sm font-medium text-gray-500">
                    {field.label}
                  </dt>
                  <dd className="text-sm text-gray-900">
                    {field.value ? (
                      <Badge variant="accent-blue" className="text-xs">
                        {formatValue(field.value)}
                      </Badge>
                    ) : (
                      <span className="text-gray-400 italic">
                        Not specified
                      </span>
                    )}
                  </dd>
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-start">
            <CheckCircle className="h-6 w-6 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-lg font-medium text-green-900 mb-2">
                Ready to find your perfect match! 🎯
              </h4>
              <p className="text-green-700">
                Our matching system will analyze your preferences and find pets
                that best match your lifestyle, living conditions, and
                preferences. You can always adjust your answers later if needed.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
