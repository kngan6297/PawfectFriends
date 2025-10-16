import React, { useEffect, useMemo } from "react";
import { Heart, MessageSquare, Info, Check } from "lucide-react";
import { EducationalTipBox } from "./EducationalTipBox";
import { Button } from "@/components/ui/Button";

/** NEW: receive callback to nurture Readiness in parent */
interface PetPreferencesStepProps {
  preferences: any;
  onPreferencesChange: (preferences: any) => void;
  onViewInfo?: (id: string) => void; // e.g. 'species_basics'
  onAckTip?: (id: string) => void; // e.g. 'species_tradeoff_ack'
}

/** helpers – standardize string | array */
const getSingle = (v: any) => (Array.isArray(v) ? v[0] ?? "" : v ?? "");
const getArray = (v: any) => (Array.isArray(v) ? v : v ? [v] : []);
const setSingle = (obj: any, key: string, value: string) => {
  const wasArray = Array.isArray(obj[key]);
  return { ...obj, [key]: wasArray ? [value] : value };
};
const uniq = (arr: string[]) => Array.from(new Set(arr));

/** educational data by species */
const speciesGuide: Record<
  string,
  {
    title: string;
    pros: string[];
    cons: string[];
    notes: string[];
    suggestedActivity: "low" | "moderate" | "high";
  }
> = {
  dog: {
    title: "Dogs",
    pros: ["Exercise companion", "Easy to train (most)", "High bonding"],
    cons: [
      "Need walks & training",
      "Higher vet/grooming costs",
      "Separation anxiety risk",
    ],
    notes: [
      "Suitable for homes with yard/regular walks",
      "Need 60-90' activity/day (most)",
    ],
    suggestedActivity: "high",
  },
  cat: {
    title: "Cats",
    pros: ["Independent", "Apartment suitable", "Stable costs"],
    cons: ["Need mental stimulation", "Can be picky with food/litter"],
    notes: ["Regular grooming", "Set up climbing/play areas"],
    suggestedActivity: "moderate",
  },
  rabbit: {
    title: "Rabbits",
    pros: ["Relatively quiet", "Can be litter trained", "No walks needed"],
    cons: ["Sensitive to stress/heat", "Need safe chew toys"],
    notes: [
      "No rough handling (young children)",
      "Well-ventilated cage, regular cleaning",
    ],
    suggestedActivity: "low",
  },
  bird: {
    title: "Birds",
    pros: ["Social, good interaction", "Interesting voice/training"],
    cons: ["Noise", "Messy feathers/seeds", "Need mental stimulation"],
    notes: ["Cover cage at proper sleep time", "Supervise when flying indoors"],
    suggestedActivity: "moderate",
  },
};

/** Trade-off for selected species list */
function SpeciesTradeOff({
  selected,
  onAck,
}: {
  selected: string[];
  onAck?: () => void;
}) {
  if (!selected.length) return null;
  return (
    <div className="mt-4 rounded-xl border p-4 bg-green-50">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {selected.map((s) => {
          const g = speciesGuide[s];
          if (!g) return null;
          return (
            <div key={s} className="rounded-lg border bg-white p-4">
              <div className="font-semibold text-gray-900 mb-1">
                {g.title} – Trade-off
              </div>
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div>
                  <div className="font-medium text-green-700 mb-1">Pros</div>
                  <ul className="list-disc pl-5">
                    {g.pros.slice(0, 3).map((p, i) => (
                      <li key={i}>{p}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div className="font-medium text-orange-700 mb-1">
                    Consider
                  </div>
                  <ul className="list-disc pl-5">
                    {g.cons.slice(0, 3).map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div className="font-medium text-gray-900 mb-1">
                    Care notes
                  </div>
                  <ul className="list-disc pl-5">
                    {g.notes.slice(0, 3).map((n, i) => (
                      <li key={i}>{n}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Safety preview – based on species + selected context (no data changes) */
function SafetyPreview({
  species,
  livingSpace,
  hasChildren,
}: {
  species: string[];
  livingSpace: string;
  hasChildren: string;
}) {
  const hints: string[] = [];
  const apt = livingSpace.startsWith("apartment-");

  if (apt && species.includes("dog")) {
    hints.push(
      "🏢 Apartment + dogs: prioritize low/medium energy breeds; fixed walking schedule."
    );
  }
  if (species.includes("bird") && hasChildren === "yes") {
    hints.push(
      "👶 Young children + birds: supervise interactions, avoid pulling/hitting cage."
    );
  }
  if (species.includes("rabbit") && hasChildren === "yes") {
    hints.push(
      "🐰 Rabbits are quite sensitive: guide children on proper handling & avoid rough play."
    );
  }

  if (!hints.length) return null;
  return (
    <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
      <div className="font-medium mb-1">Safety preview</div>
      <ul className="list-disc pl-5 space-y-1">
        {hints.map((h, i) => (
          <li key={i}>{h}</li>
        ))}
      </ul>
    </div>
  );
}

/** Activity level suggestion from species (not forced, with Apply button) */
function ActivitySuggestion({
  species,
  current,
  onApply,
}: {
  species: string[];
  current: string;
  onApply: (val: "low" | "moderate" | "high") => void;
}) {
  const suggestion = useMemo<"low" | "moderate" | "high" | null>(() => {
    if (!species.length) return null;
    if (species.includes("dog")) return "high";
    if (species.includes("cat") || species.includes("bird")) return "moderate";
    if (species.includes("rabbit")) return "low";
    return null;
  }, [species]);

  if (!suggestion || current === suggestion) return null;

  return (
    <div className="mt-3 rounded-lg border bg-blue-50 border-blue-200 p-3 text-sm text-blue-800 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <Info className="w-4 h-4" />
        <span>
          Suggested activity level: <strong>{suggestion}</strong> (based on
          selected species)
        </span>
      </div>
      <Button size="sm" variant="outline" onClick={() => onApply(suggestion)}>
        Apply suggestion
      </Button>
    </div>
  );
}

export const PetPreferencesStep: React.FC<PetPreferencesStepProps> = ({
  preferences,
  onPreferencesChange,
  onViewInfo,
  onAckTip,
}) => {
  const preferredSpecies: string[] = uniq(
    getArray(preferences.preferredSpecies)
  );
  const livingSpace = getSingle(preferences.livingSpace);
  const hasChildren = getSingle(preferences.hasChildren);
  const activityLevel = getSingle(preferences.activityLevel);

  useEffect(() => {
    // user has seen species step → slightly increase readiness
    onViewInfo?.("species_basics");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleSpecies = (
    key: "dog" | "cat" | "rabbit" | "bird",
    suggested: "low" | "moderate" | "high"
  ) => {
    const exists = preferredSpecies.includes(key);
    const nextSpecies = exists
      ? preferredSpecies.filter((s) => s !== key)
      : uniq([...preferredSpecies, key]);

    // DON'T force activityLevel if user has chosen; only auto-fill when empty
    let next = { ...preferences, preferredSpecies: nextSpecies };
    if (!activityLevel && !exists) {
      next = setSingle(next, "activityLevel", suggested);
    }
    onPreferencesChange(next);

    onViewInfo?.(`species_selected_${key}`);
  };

  return (
    <div className="space-y-8">
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-primary-100 rounded-full mb-6">
          <Heart className="h-10 w-10 text-primary-600" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Pet Preferences
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Tell us about your ideal pet and any specific requirements.
        </p>
      </div>

      <div className="space-y-8">
        {/* Species cards */}
        <div>
          <label className="block text-lg font-semibold text-gray-800 mb-6 flex items-center">
            <span className="text-2xl mr-3">🐕</span>
            Preferred species & activity level
          </label>

          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* DOG */}
              <div
                className={`border rounded-lg p-6 hover:border-primary-300 transition-colors ${
                  preferredSpecies.includes("dog")
                    ? "border-primary-300"
                    : "border-gray-200"
                }`}
              >
                <label className="flex items-center space-x-4">
                  <input
                    type="checkbox"
                    checked={preferredSpecies.includes("dog")}
                    onChange={(e) => toggleSpecies("dog", "high")}
                    className="h-5 w-5 text-primary-600 focus:ring-primary-500 border-gray-300"
                  />
                  <div>
                    <span className="text-base font-medium text-gray-700 flex items-center">
                      <span className="text-lg mr-2">🐕</span> Dogs
                    </span>
                    <p className="text-sm text-gray-500 mt-1">
                      High energy, active pets
                    </p>
                  </div>
                </label>
              </div>

              {/* CAT */}
              <div
                className={`border rounded-lg p-6 hover:border-primary-300 transition-colors ${
                  preferredSpecies.includes("cat")
                    ? "border-primary-300"
                    : "border-gray-200"
                }`}
              >
                <label className="flex items-center space-x-4">
                  <input
                    type="checkbox"
                    checked={preferredSpecies.includes("cat")}
                    onChange={() => toggleSpecies("cat", "moderate")}
                    className="h-5 w-5 text-primary-600 focus:ring-primary-500 border-gray-300"
                  />
                  <div>
                    <span className="text-base font-medium text-gray-700 flex items-center">
                      <span className="text-lg mr-2">🐱</span> Cats
                    </span>
                    <p className="text-sm text-gray-500 mt-1">
                      Independent, moderate energy
                    </p>
                  </div>
                </label>
              </div>

              {/* RABBIT */}
              <div
                className={`border rounded-lg p-6 hover:border-primary-300 transition-colors ${
                  preferredSpecies.includes("rabbit")
                    ? "border-primary-300"
                    : "border-gray-200"
                }`}
              >
                <label className="flex items-center space-x-4">
                  <input
                    type="checkbox"
                    checked={preferredSpecies.includes("rabbit")}
                    onChange={() => toggleSpecies("rabbit", "low")}
                    className="h-5 w-5 text-primary-600 focus:ring-primary-500 border-gray-300"
                  />
                  <div>
                    <span className="text-base font-medium text-gray-700 flex items-center">
                      <span className="text-lg mr-2">🐰</span> Rabbits
                    </span>
                    <p className="text-sm text-gray-500 mt-1">
                      Calm, low maintenance
                    </p>
                  </div>
                </label>
              </div>

              {/* BIRD */}
              <div
                className={`border rounded-lg p-6 hover:border-primary-300 transition-colors ${
                  preferredSpecies.includes("bird")
                    ? "border-primary-300"
                    : "border-gray-200"
                }`}
              >
                <label className="flex items-center space-x-4">
                  <input
                    type="checkbox"
                    checked={preferredSpecies.includes("bird")}
                    onChange={() => toggleSpecies("bird", "moderate")}
                    className="h-5 w-5 text-primary-600 focus:ring-primary-500 border-gray-300"
                  />
                  <div>
                    <span className="text-base font-medium text-gray-700 flex items-center">
                      <span className="text-lg mr-2">🦜</span> Birds
                    </span>
                    <p className="text-sm text-gray-500 mt-1">
                      Social, moderate energy
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Original tip */}
            <EducationalTipBox
              title="Why we ask this?"
              content="Different species have different care requirements, energy levels, and lifespans. Dogs need daily exercise and training, cats are more independent, while rabbits and birds have specific dietary and environmental needs."
            />

            {/* NEW: Trade-off based on selected species + ack */}
            <SpeciesTradeOff
              selected={preferredSpecies}
              onAck={() => onAckTip?.("species_tradeoff_ack")}
            />

            {/* NEW: Activity level suggestion from species (not forced) */}
            <ActivitySuggestion
              species={preferredSpecies}
              current={activityLevel}
              onApply={(val) => {
                onPreferencesChange(
                  setSingle(preferences, "activityLevel", val)
                );
                onAckTip?.("species_activity_apply");
              }}
            />
          </div>
        </div>

        {/* NEW: Safety preview based on existing context */}
        <SafetyPreview
          species={preferredSpecies}
          livingSpace={getSingle(preferences.livingSpace || "")}
          hasChildren={getSingle(preferences.hasChildren || "")}
        />
      </div>
    </div>
  );
};
