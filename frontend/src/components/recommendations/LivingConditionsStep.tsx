import React, { useEffect } from "react";
import { Building } from "lucide-react";
import { RadioGroup } from "@/components/ui/RadioButton";
import { Toggle } from "@/components/ui/Toggle";
import { EducationalTipBox } from "./EducationalTipBox";
import { Card } from "@/components/ui/Card";

/** NEW: receive callback to nurture Readiness in parent */
interface LivingConditionsStepProps {
  preferences: any;
  onPreferencesChange: (preferences: any) => void;
  onViewInfo?: (id: string) => void; // e.g. 'space_basics', 'budget_basics'
  onAckTip?: (id: string) => void; // e.g. 'space_tradeoff_ack', 'budget_tradeoff_ack'
}

/** helpers: standardize string | array */
const getSingle = (v: any) => (Array.isArray(v) ? v[0] ?? "" : v ?? "");
const setSingle = (obj: any, key: string, value: string) => {
  const wasArray = Array.isArray(obj[key]);
  return { ...obj, [key]: wasArray ? [value] : value };
};

/** NEW: Compact trade-off based on current selection */
function TradeOffCard({
  kind,
  value,
}: {
  kind: "livingSpace" | "budget";
  value: string;
}) {
  if (!value) return null;

  const livingSpaceMap: Record<
    string,
    { recs: string[]; pros: string[]; cons: string[] }
  > = {
    "apartment-limited": {
      recs: ["Cats", "Small dogs", "Fish/Birds"],
      pros: ["Easy to care for", "Quiet", "Takes up little space"],
      cons: ["Limited exercise space", "Needs mental stimulation"],
    },
    "apartment-moderate": {
      recs: ["Cats", "Small-Medium dogs"],
      pros: ["Suitable for medium pets", "Flexible setup"],
      cons: ["Still limited for long running"],
    },
    "house-no-yard": {
      recs: ["Cats", "Medium dogs (regular walks)"],
      pros: ["Good indoor space", "Easy to control"],
      cons: ["No yard → need walking schedule"],
    },
    "house-yard": {
      recs: ["Active dogs", "Multiple pets"],
      pros: ["Natural exercise", "Outdoor play"],
      cons: ["More cleaning/yard work", "Safe fencing needed"],
    },
    "rural-spacious": {
      recs: ["Working/High-energy dogs", "Multiple pets"],
      pros: ["Super spacious", "High-intensity activities"],
      cons: ["Cost/distance from city", "Safety supervision needed"],
    },
  };

  const budgetMap: Record<
    string,
    { recs: string[]; pros: string[]; cons: string[] }
  > = {
    low: {
      recs: ["Cats", "Small rodents", "Fish"],
      pros: ["Low cost", "Basic supplies"],
      cons: ["Limited high-grooming breeds", "Limited vet emergency funds"],
    },
    medium: {
      recs: ["Cats", "Small-Medium dogs", "Birds"],
      pros: ["Balanced cost", "Can afford regular grooming"],
      cons: ["Still need vet emergency funds ~$"],
    },
    high: {
      recs: ["High-grooming breeds", "Working/Sport dogs"],
      pros: ["Comfortable care budget", "Equipment/professionals"],
      cons: ["High long-term commitment", "Grooming/training time intensive"],
    },
  };

  const data =
    kind === "livingSpace" ? livingSpaceMap[value] : budgetMap[value];
  if (!data) return null;

  return (
    <div className="mt-3 rounded-xl border p-4 bg-green-50">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
        <div>
          <div className="font-medium text-gray-900 mb-1">Recommended</div>
          <ul className="list-disc pl-5">
            {data.recs.slice(0, 3).map((p, i) => (
              <li key={i}>{p}</li>
            ))}
          </ul>
        </div>
        <div>
          <div className="font-medium text-green-700 mb-1">Pros</div>
          <ul className="list-disc pl-5">
            {data.pros.slice(0, 3).map((p, i) => (
              <li key={i}>{p}</li>
            ))}
          </ul>
        </div>
        <div>
          <div className="font-medium text-orange-700 mb-1">Consider</div>
          <ul className="list-disc pl-5">
            {data.cons.slice(0, 3).map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

/** NEW: Safety preview – gentle warnings based on current selection (no score gating here) */
function SafetyPreview({
  livingSpace,
  budget,
  hasChildren,
}: {
  livingSpace: string;
  budget: string;
  hasChildren: string;
}) {
  const hints: string[] = [];
  if (livingSpace.startsWith("apartment-")) {
    hints.push(
      "🏢 Limited space: prioritize low/medium energy breeds & small sizes."
    );
  }
  if (budget === "low") {
    hints.push(
      "💸 Low budget: consider breeds with minimal grooming and low vet costs."
    );
  }
  if (hasChildren === "yes") {
    hints.push(
      "👶 Have young children: prioritize gentle, mature & well-socialized breeds."
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

export const LivingConditionsStep: React.FC<LivingConditionsStepProps> = ({
  preferences,
  onPreferencesChange,
  onViewInfo,
  onAckTip,
}) => {
  // mount: consider user has seen info block (slightly increase readiness)
  useEffect(() => {
    onViewInfo?.("space_basics");
    onViewInfo?.("budget_basics");
    onViewInfo?.("family_basics");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Set default values (maintain array type if parent is using arrays)
  useEffect(() => {
    let updated = { ...preferences };
    let changed = false;

    const hc = getSingle(preferences.hasChildren);
    const hop = getSingle(preferences.hasOtherPets);

    if (!hc) {
      updated = setSingle(updated, "hasChildren", "no");
      changed = true;
    }
    if (!hop) {
      updated = setSingle(updated, "hasOtherPets", "no");
      changed = true;
    }
    if (changed) onPreferencesChange(updated);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const livingSpaceVal = getSingle(preferences.livingSpace);
  const budgetVal = getSingle(preferences.budget); // expect 'low' | 'medium' | 'high'
  const hasChildrenVal = getSingle(preferences.hasChildren);

  return (
    <div className="space-y-8">
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-primary-100 rounded-full mb-6">
          <Building className="h-10 w-10 text-primary-600" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Living Conditions
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Help us understand your home environment and family situation.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 gap-10">
        {/* Left Column */}
        <div className="space-y-8">
          {/* Living Space */}
          <div className="pt-4 pb-4">
            <label className="block text-lg font-semibold text-gray-800 mb-6 flex items-center">
              <span className="text-2xl mr-3">🏠</span>
              Living Space
            </label>

            <RadioGroup
              name="livingSpace"
              value={livingSpaceVal}
              onChange={(value) => {
                // split "homeType-spaceAvailable"
                const [homeType, spaceAvailable] = value.split("-");
                let hasYard = "no";
                if (value === "house-yard" || value === "rural-spacious")
                  hasYard = "yes";

                let next = setSingle(preferences, "livingSpace", value);
                next = setSingle(next, "homeType", homeType || value);
                next = setSingle(
                  next,
                  "spaceAvailable",
                  spaceAvailable || value
                );
                next = setSingle(next, "hasYard", hasYard);

                onPreferencesChange(next);
                onViewInfo?.("space_selected");
              }}
              options={[
                {
                  value: "apartment-limited",
                  label: "Apartment - Limited space",
                  description:
                    "Small apartments, studios, or shared spaces. Best for low-energy pets like cats, small dogs, or quiet pets.",
                },
                {
                  value: "apartment-moderate",
                  label: "Apartment - Moderate space",
                  description:
                    "1-2 bedroom apartments with some room to move. Good for medium-sized pets with moderate energy levels.",
                },
                {
                  value: "house-no-yard",
                  label: "House without yard",
                  description:
                    "House with indoor space but no outdoor area. Suitable for pets that don't require extensive outdoor exercise.",
                },
                {
                  value: "house-yard",
                  label: "House with yard",
                  description:
                    "Ideal for energetic pets who need outdoor space to run and play. Perfect for active dogs and outdoor-loving pets.",
                },
                {
                  value: "rural-spacious",
                  label: "Rural property - Spacious",
                  description:
                    "Large properties with plenty of space. Excellent for high-energy pets, working dogs, or multiple pets.",
                },
              ]}
              className="space-y-4"
            />

            <EducationalTipBox
              title="Why we ask this?"
              content="Small apartments are usually better for cats or small dogs. Large dogs and high-energy pets need more space to exercise and play. Your living space directly impacts which pets will be happy and healthy in your home."
            />

            {/* NEW: trade-off based on selection */}
            <TradeOffCard kind="livingSpace" value={livingSpaceVal} />
          </div>

          {/* Budget */}
          <div className="pt-4 pb-4">
            <label className="block text-lg font-semibold text-gray-800 mb-6 flex items-center">
              <span className="text-2xl mr-3">💰</span>
              Monthly Budget for Pet Care
            </label>

            {/* NOTE: use 'low' | 'medium' | 'high' to match computeReadiness */}
            <RadioGroup
              name="budget"
              value={budgetVal}
              onChange={(value) => {
                // Map 'mid' -> 'medium' if old data exists
                const normalized = value === "mid" ? "medium" : value;
                const next = setSingle(preferences, "budget", normalized);
                onPreferencesChange(next);
                onViewInfo?.("budget_selected");
              }}
              options={[
                { value: "low", label: "$0 - $100" },
                { value: "medium", label: "$100 - $500" }, // CHANGED from "mid" -> "medium"
                { value: "high", label: "$500+" },
              ]}
              className="space-y-4"
            />

            <EducationalTipBox
              title="Why we ask this?"
              content="Different pets have varying costs for food, vet care, grooming, and supplies. Larger pets and certain breeds often have higher ongoing costs. This helps ensure you can provide proper care for your chosen pet."
            />

            <TradeOffCard kind="budget" value={budgetVal} />
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-8">
          {/* Family & Pets */}
          <div className="pt-4 pb-4">
            <label className="block text-lg font-semibold text-gray-800 mb-6 flex items-center">
              <span className="text-2xl mr-3">👨‍👩‍👧‍👦</span>
              Family & Pets
            </label>

            <div className="space-y-8">
              <div>
                <div className="flex justify-between items-center">
                  <label className="block text-base font-medium text-gray-700 flex items-center">
                    <span className="text-lg mr-2">👶</span>
                    Do you have children?
                  </label>
                  <Toggle
                    checked={getSingle(preferences.hasChildren) === "yes"}
                    onChange={(checked) =>
                      onPreferencesChange(
                        setSingle(
                          preferences,
                          "hasChildren",
                          checked ? "yes" : "no"
                        )
                      )
                    }
                    label={
                      getSingle(preferences.hasChildren) === "yes"
                        ? "Yes"
                        : "No"
                    }
                    size="md"
                  />
                </div>
                <EducationalTipBox
                  title="Why we ask this?"
                  content="Some pets are better with children than others. Family-friendly pets are typically patient, gentle, and can handle the energy and sometimes rough play that comes with kids."
                  className="mt-3"
                />
              </div>

              <div>
                <div className="flex justify-between items-center">
                  <label className="block text-base font-medium text-gray-700 flex items-center">
                    <span className="text-lg mr-2">🐾</span>
                    Do you have other pets?
                  </label>
                  <Toggle
                    checked={getSingle(preferences.hasOtherPets) === "yes"}
                    onChange={(checked) =>
                      onPreferencesChange(
                        setSingle(
                          preferences,
                          "hasOtherPets",
                          checked ? "yes" : "no"
                        )
                      )
                    }
                    label={
                      getSingle(preferences.hasOtherPets) === "yes"
                        ? "Yes"
                        : "No"
                    }
                    size="md"
                  />
                </div>
                <EducationalTipBox
                  title="Why we ask this?"
                  content="Some pets get along better with others, while some prefer to be the only pet. We'll match you with pets that are known to be social and compatible with your existing pets."
                  className="mt-3"
                />
              </div>

              {/* NEW: preview appropriate warnings (no additional questions) */}
              <SafetyPreview
                livingSpace={livingSpaceVal}
                budget={budgetVal}
                hasChildren={getSingle(preferences.hasChildren)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
