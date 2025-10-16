import React, { useState } from "react";
import { Home, HelpCircle } from "lucide-react";
import { RadioGroup } from "@/components/ui/RadioButton";
import { Button } from "@/components/ui/Button";
import { EducationalTipBox } from "./EducationalTipBox";
import { Card } from "@/components/ui/Card";
import { X, Info } from "lucide-react";

interface LifestyleStepProps {
  preferences: any;
  onPreferencesChange: (preferences: any) => void;
  onViewInfo?: (id: string) => void;
  onAckTip?: (id: string) => void;
}

export const LifestyleStep: React.FC<LifestyleStepProps> = ({
  preferences,
  onPreferencesChange,
  onViewInfo,
  onAckTip,
}) => {
  const [showGuide, setShowGuide] = useState<string | null>(null);

  // helpers to support both string | string[]
  const getSingle = (v: any) => (Array.isArray(v) ? v[0] ?? "" : v ?? "");

  const setSingle = (obj: any, key: string, value: string) => {
    const wasArray = Array.isArray(obj[key]);
    return { ...obj, [key]: wasArray ? [value] : value };
  };

  const handleShowGuide = (category: string) => {
    setShowGuide(category);
    // NEW: track view
    if (category === "lifestyle") onViewInfo?.("lifestyle_basics");
    if (category === "experience") onViewInfo?.("experience_basics");
    if (category === "timeAvailable") onViewInfo?.("time_basics");
  };

  const handleAckTradeoff = (
    category: "lifestyle" | "experience" | "timeAvailable"
  ) => {
    if (category === "lifestyle") onAckTip?.("lifestyle_tradeoff_ack");
    if (category === "experience") onAckTip?.("experience_tradeoff_ack");
    if (category === "timeAvailable") onAckTip?.("time_tradeoff_ack");
  };

  const handleCloseGuide = () => {
    setShowGuide(null);
  };

  // Comprehensive lifestyle options from LifestyleChoices
  const lifestyleOptions = [
    {
      value: "homebody",
      label: "Mostly at home - I spend most of my time indoors",
    },
    {
      value: "busy",
      label: "Busy/work long hours - I have a demanding schedule",
    },
    {
      value: "active",
      label: "Very active/outdoorsy - I love outdoor activities",
    },
    {
      value: "traveler",
      label: "Travel frequently - I'm often away from home",
    },
    {
      value: "student",
      label: "Student - I have a flexible but busy schedule",
    },
    { value: "retired", label: "Retired - I have lots of free time" },
  ];

  // Experience options
  const experienceOptions = [
    {
      value: "first-time",
      label: "First-time pet owner - This will be my first pet",
    },
    {
      value: "some",
      label: "Some experience - I've had pets before but not recently",
    },
    {
      value: "experienced",
      label: "Experienced pet owner - I'm very comfortable with pets",
    },
    {
      value: "professional",
      label: "Professional experience - I work with animals",
    },
  ];

  // Time availability options
  const timeAvailableOptions = [
    { value: "minimal", label: "Less than 1 hour daily" },
    { value: "moderate", label: "1-3 hours daily" },
    { value: "significant", label: "3+ hours daily" },
    { value: "wfh", label: "Work from home/always available" },
    { value: "flexible", label: "Flexible schedule - can adjust as needed" },
  ];

  // Guide data from LifestyleGuide
  const guideData = {
    lifestyle: {
      title: "Lifestyle Types",
      description:
        "Understanding how your daily routine affects pet compatibility",
      items: [
        {
          value: "homebody",
          title: "Mostly at Home",
          description:
            "You spend most of your time indoors and prefer quiet activities.",
          petRecommendations: [
            "Cats",
            "Small dogs",
            "Birds",
            "Fish",
            "Guinea pigs",
          ],
          pros: ["Low exercise needs", "Independent pets", "Quiet companions"],
          cons: ["May get lonely if left alone", "Need mental stimulation"],
        },
        {
          value: "busy",
          title: "Busy/Work Long Hours",
          description: "You have a demanding schedule with limited free time.",
          petRecommendations: ["Cats", "Fish", "Reptiles", "Hamsters"],
          pros: [
            "Independent pets",
            "Low maintenance",
            "Can handle alone time",
          ],
          cons: ["Limited bonding time", "May need pet sitters"],
        },
        {
          value: "active",
          title: "Very Active/Outdoorsy",
          description: "You love outdoor activities and have lots of energy.",
          petRecommendations: [
            "High-energy dogs",
            "Sport dogs",
            "Working breeds",
          ],
          pros: [
            "Great exercise partners",
            "Adventure companions",
            "Active play",
          ],
          cons: [
            "Need lots of exercise",
            "Require training",
            "Higher energy costs",
          ],
        },
        {
          value: "traveler",
          title: "Travel Frequently",
          description: "You're often away from home for work or leisure.",
          petRecommendations: ["Cats", "Fish", "Reptiles", "Birds"],
          pros: [
            "Independent pets",
            "Can handle pet sitters",
            "Lower travel stress",
          ],
          cons: [
            "Need reliable pet care",
            "Limited bonding time",
            "Travel planning required",
          ],
        },
        {
          value: "student",
          title: "Student",
          description:
            "You have a flexible but busy schedule with limited resources.",
          petRecommendations: [
            "Cats",
            "Small rodents",
            "Fish",
            "Low-maintenance pets",
          ],
          pros: [
            "Flexible care schedule",
            "Lower costs",
            "Good for small spaces",
          ],
          cons: ["Limited budget", "May need to rehome after graduation"],
        },
        {
          value: "retired",
          title: "Retired",
          description: "You have lots of free time and want companionship.",
          petRecommendations: ["Adult dogs", "Cats", "Birds", "Small pets"],
          pros: [
            "Lots of time for bonding",
            "Can handle special needs",
            "Great companionship",
          ],
          cons: [
            "May need help with physical care",
            "Consider your own health needs",
          ],
        },
      ],
    },
    experience: {
      title: "Experience Levels",
      description:
        "Your pet ownership experience helps determine suitable pets",
      items: [
        {
          value: "first-time",
          title: "First-time Owner",
          description: "This will be your first pet as an adult.",
          petRecommendations: [
            "Adult cats",
            "Adult dogs",
            "Fish",
            "Guinea pigs",
          ],
          pros: [
            "Established personalities",
            "Often already trained",
            "Lower maintenance",
          ],
          cons: [
            "May have existing habits",
            "Less bonding time",
            "May have health issues",
          ],
        },
        {
          value: "some",
          title: "Some Experience",
          description: "You've had pets before but not recently.",
          petRecommendations: ["Adult pets", "Cats", "Small dogs", "Birds"],
          pros: [
            "Basic knowledge",
            "Realistic expectations",
            "Can handle common issues",
          ],
          cons: ["May need refresher", "Pets have changed since your last one"],
        },
        {
          value: "experienced",
          title: "Experienced Owner",
          description: "You're very comfortable with pets and their needs.",
          petRecommendations: [
            "Any pet type",
            "Puppies",
            "Special needs pets",
            "Multiple pets",
          ],
          pros: [
            "Can handle challenges",
            "Understand pet behavior",
            "Confident in care",
          ],
          cons: ["May overestimate abilities", "Higher expectations"],
        },
        {
          value: "professional",
          title: "Professional Experience",
          description: "You work with animals or have extensive training.",
          petRecommendations: [
            "Any pet type",
            "Special needs",
            "Behavioral cases",
            "Exotic pets",
          ],
          pros: [
            "Expert knowledge",
            "Can handle complex cases",
            "Professional resources",
          ],
          cons: ["High expectations", "May bring work home", "Burnout risk"],
        },
      ],
    },
    timeAvailable: {
      title: "Time Availability",
      description: "How much time you can dedicate to pet care daily",
      items: [
        {
          value: "minimal",
          title: "Less than 1 hour daily",
          description: "Very limited time for pet care and interaction.",
          petRecommendations: ["Cats", "Fish", "Reptiles", "Hamsters"],
          pros: [
            "Independent pets",
            "Low maintenance",
            "Minimal time commitment",
          ],
          cons: [
            "Limited bonding",
            "May feel neglected",
            "Health monitoring needed",
          ],
        },
        {
          value: "moderate",
          title: "1-3 hours daily",
          description: "Moderate time for pet care and activities.",
          petRecommendations: ["Adult dogs", "Cats", "Birds", "Small pets"],
          pros: [
            "Good bonding time",
            "Can handle training",
            "Regular exercise",
          ],
          cons: ["Need consistent schedule", "May need help when busy"],
        },
        {
          value: "significant",
          title: "3+ hours daily",
          description: "Lots of time for intensive pet care and activities.",
          petRecommendations: [
            "Puppies",
            "High-energy dogs",
            "Special needs pets",
            "Multiple pets",
          ],
          pros: ["Strong bonding", "Can handle training", "Lots of activities"],
          cons: [
            "High time commitment",
            "May limit other activities",
            "Can be overwhelming",
          ],
        },
        {
          value: "wfh",
          title: "Work from Home/Always Available",
          description:
            "You're home most of the time and can provide constant attention.",
          petRecommendations: [
            "Any pet type",
            "Puppies",
            "Social pets",
            "Multiple pets",
          ],
          pros: [
            "Constant companionship",
            "Can handle needy pets",
            "Easy monitoring",
          ],
          cons: [
            "May become dependent",
            "Separation anxiety risk",
            "Work-life balance",
          ],
        },
        {
          value: "flexible",
          title: "Flexible Schedule",
          description: "You can adjust your schedule to accommodate pet needs.",
          petRecommendations: [
            "Most pet types",
            "Puppies",
            "Training-intensive pets",
          ],
          pros: [
            "Adaptable care",
            "Can handle emergencies",
            "Good for training",
          ],
          cons: [
            "Need planning",
            "May disrupt routine",
            "Requires flexibility",
          ],
        },
      ],
    },
  };

  const currentGuide = showGuide
    ? guideData[showGuide as keyof typeof guideData]
    : null;

  // Trade-off card component that shows based on current selection
  function TradeOffCard({
    section,
    selectedValue,
  }: {
    section: keyof typeof guideData;
    selectedValue: string;
  }) {
    if (!selectedValue) return null;
    const sec = guideData[section];
    const item = sec.items.find((it: any) => it.value === selectedValue);
    if (!item) return null;

    return (
      <div className="mt-3 rounded-xl border p-4 bg-green-50">
        <div className="text-sm text-gray-700 mb-1">
          <strong>Trade-off:</strong> {item.title}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
          <div>
            <div className="font-medium text-gray-900 mb-1">Recommended</div>
            <ul className="list-disc pl-5">
              {item.petRecommendations
                .slice(0, 3)
                .map((p: string, i: number) => (
                  <li key={i}>{p}</li>
                ))}
            </ul>
          </div>
          <div>
            <div className="font-medium text-green-700 mb-1">Pros</div>
            <ul className="list-disc pl-5">
              {item.pros.slice(0, 3).map((p: string, i: number) => (
                <li key={i}>{p}</li>
              ))}
            </ul>
          </div>
          <div>
            <div className="font-medium text-orange-700 mb-1">Consider</div>
            <ul className="list-disc pl-5">
              {item.cons.slice(0, 3).map((c: string, i: number) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-primary-100 rounded-full mb-6">
          <Home className="h-10 w-10 text-primary-600" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Your Lifestyle
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Tell us about your daily routine and experience to find the perfect
          pet match.
        </p>
      </div>

      <div className="space-y-10">
        <fieldset className="space-y-6">
          <legend className="text-lg font-semibold text-gray-800 mb-4 flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-2xl mr-3">🏠</span>
              What's your lifestyle like?
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleShowGuide("lifestyle")}
              className="text-blue-600 hover:text-blue-700"
            >
              <HelpCircle className="w-4 h-4" />
            </Button>
          </legend>
          <RadioGroup
            name="lifestyle"
            value={getSingle(preferences.lifestyle)}
            onChange={(value) =>
              onPreferencesChange(setSingle(preferences, "lifestyle", value))
            }
            options={lifestyleOptions}
          />
          <EducationalTipBox
            title="Why we ask this?"
            content="Your lifestyle determines how much time and energy you can dedicate to a pet. Active pets need more exercise and attention, while low-energy pets are better for busy schedules or homebodies."
          />
          <TradeOffCard
            section="lifestyle"
            selectedValue={getSingle(preferences.lifestyle)}
          />
        </fieldset>

        <fieldset className="space-y-6">
          <legend className="text-lg font-semibold text-gray-800 mb-4 flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-2xl mr-3">🐾</span>
              Experience with pets
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleShowGuide("experience")}
              className="text-blue-600 hover:text-blue-700"
            >
              <HelpCircle className="w-4 h-4" />
            </Button>
          </legend>
          <RadioGroup
            name="experience"
            value={getSingle(preferences.experience)}
            onChange={(value) =>
              onPreferencesChange(setSingle(preferences, "experience", value))
            }
            options={experienceOptions}
          />
          <EducationalTipBox
            title="Why we ask this?"
            content="First-time owners often do better with low-maintenance pets that are forgiving of mistakes. Experienced owners can handle more challenging pets that require special care or training."
          />
          <TradeOffCard
            section="experience"
            selectedValue={getSingle(preferences.experience)}
          />
        </fieldset>

        <fieldset className="space-y-6">
          <legend className="text-lg font-semibold text-gray-800 mb-4 flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-2xl mr-3">⏰</span>
              Time available for pet care daily
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleShowGuide("timeAvailable")}
              className="text-blue-600 hover:text-blue-700"
            >
              <HelpCircle className="w-4 h-4" />
            </Button>
          </legend>
          <RadioGroup
            name="timeAvailable"
            value={getSingle(preferences.timeAvailable)}
            onChange={(value) =>
              onPreferencesChange(
                setSingle(preferences, "timeAvailable", value)
              )
            }
            options={timeAvailableOptions}
          />
          <EducationalTipBox
            title="Why we ask this?"
            content="Pets have different time requirements - dogs need walks and playtime, cats are more independent, and some pets need daily feeding and cleaning. This helps us match you with pets that fit your schedule."
          />
          <TradeOffCard
            section="timeAvailable"
            selectedValue={getSingle(preferences.timeAvailable)}
          />
        </fieldset>
      </div>

      {/* Lifestyle Guide Modal */}
      {showGuide && currentGuide && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="max-w-4xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {currentGuide.title}
                </h2>
                <p className="text-gray-600">{currentGuide.description}</p>
              </div>
              <Button variant="ghost" onClick={handleCloseGuide} size="sm">
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="space-y-6">
              {currentGuide.items.map((item, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <Info className="w-6 h-6 text-blue-600" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {item.title}
                      </h3>
                      <p className="text-gray-600 mb-4">{item.description}</p>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">
                            Recommended Pets
                          </h4>
                          <ul className="space-y-1">
                            {item.petRecommendations.map((pet, petIndex) => (
                              <li
                                key={petIndex}
                                className="text-sm text-gray-600 flex items-center gap-1"
                              >
                                <span className="w-1 h-1 bg-blue-500 rounded-full"></span>
                                {pet}
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <h4 className="font-medium text-green-700 mb-2">
                            Pros
                          </h4>
                          <ul className="space-y-1">
                            {item.pros.map((pro, proIndex) => (
                              <li
                                key={proIndex}
                                className="text-sm text-gray-600 flex items-center gap-1"
                              >
                                <span className="w-1 h-1 bg-green-500 rounded-full"></span>
                                {pro}
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <h4 className="font-medium text-orange-700 mb-2">
                            Considerations
                          </h4>
                          <ul className="space-y-1">
                            {item.cons.map((con, conIndex) => (
                              <li
                                key={conIndex}
                                className="text-sm text-gray-600 flex items-center gap-1"
                              >
                                <span className="w-1 h-1 bg-orange-500 rounded-full"></span>
                                {con}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-end">
              <Button onClick={handleCloseGuide} variant="outline">
                Got it!
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
