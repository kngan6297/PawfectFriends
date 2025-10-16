import React from "react";
import {
  PawPrint,
  Heart,
  Utensils,
  Home,
  Stethoscope,
  Dog,
  Cat,
  Bird,
  Fish,
  Rabbit,
} from "lucide-react";

const PetCare: React.FC = () => {
  const petTypes = [
    {
      title: "Dogs",
      icon: <Dog className="w-8 h-8 text-primary-600" />,
      tips: [
        "Regular exercise and daily walks",
        "Balanced diet with proper portions",
        "Regular grooming and dental care",
        "Training and socialization",
        "Annual veterinary check-ups",
      ],
    },
    {
      title: "Cats",
      icon: <Cat className="w-8 h-8 text-primary-600" />,
      tips: [
        "Clean litter box maintenance",
        "Regular grooming and nail trimming",
        "Indoor enrichment and playtime",
        "Proper nutrition and fresh water",
        "Regular veterinary care",
      ],
    },
    {
      title: "Birds",
      icon: <Bird className="w-8 h-8 text-primary-600" />,
      tips: [
        "Spacious cage with proper perches",
        "Fresh food and water daily",
        "Regular cage cleaning",
        "Social interaction and mental stimulation",
        "Safe environment free from hazards",
      ],
    },
    {
      title: "Fish",
      icon: <Fish className="w-8 h-8 text-primary-600" />,
      tips: [
        "Regular water changes and tank cleaning",
        "Proper filtration and temperature control",
        "Appropriate feeding schedule",
        "Tank size suitable for species",
        "Regular water quality testing",
      ],
    },
    {
      title: "Small Pets",
      icon: <Rabbit className="w-8 h-8 text-primary-600" />,
      tips: [
        "Proper habitat size and setup",
        "Species-specific diet",
        "Regular exercise and playtime",
        "Clean living environment",
        "Regular health check-ups",
      ],
    },
  ];

  const generalCare = [
    {
      title: "Health & Wellness",
      icon: <Stethoscope className="w-8 h-8 text-primary-600" />,
      content: [
        "Schedule regular veterinary check-ups",
        "Keep vaccinations up to date",
        "Monitor for any changes in behavior",
        "Maintain proper dental care",
        "Follow preventive care guidelines",
      ],
    },
    {
      title: "Nutrition",
      icon: <Utensils className="w-8 h-8 text-primary-600" />,
      content: [
        "Provide species-appropriate diet",
        "Follow recommended feeding guidelines",
        "Ensure fresh water is always available",
        "Avoid harmful human foods",
        "Monitor weight and adjust portions as needed",
      ],
    },
    {
      title: "Environment",
      icon: <Home className="w-8 h-8 text-primary-600" />,
      content: [
        "Create a safe and comfortable living space",
        "Maintain appropriate temperature",
        "Provide proper bedding and shelter",
        "Keep the environment clean",
        "Remove potential hazards",
      ],
    },
    {
      title: "Love & Attention",
      icon: <Heart className="w-8 h-8 text-primary-600" />,
      content: [
        "Spend quality time daily",
        "Provide mental stimulation",
        "Show affection appropriately",
        "Respect their boundaries",
        "Build trust through positive interactions",
      ],
    },
  ];

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="text-center mb-16">
        <div className="flex justify-center mb-4">
          <PawPrint className="w-12 h-12 text-primary-600" />
        </div>
        <h1 className="text-4xl font-bold mb-4">Pet Care Resources</h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Essential information and tips to help you provide the best care for
          your furry, feathered, or finned friends
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
        {generalCare.map((section, index) => (
          <div
            key={index}
            className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow"
          >
            <div className="flex items-center gap-4 mb-4">
              {section.icon}
              <h2 className="text-2xl font-semibold">{section.title}</h2>
            </div>
            <ul className="space-y-3">
              {section.content.map((item, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <svg
                    className="w-5 h-5 text-primary-600 mt-0.5 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <h2 className="text-3xl font-bold text-center mb-8">
        Species-Specific Care Guides
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {petTypes.map((pet, index) => (
          <div
            key={index}
            className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow"
          >
            <div className="flex items-center gap-4 mb-4">
              {pet.icon}
              <h3 className="text-xl font-semibold">{pet.title}</h3>
            </div>
            <ul className="space-y-3">
              {pet.tips.map((tip, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <svg
                    className="w-5 h-5 text-primary-600 mt-0.5 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-16 bg-primary-50 rounded-lg p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Need More Help?</h2>
        <p className="text-gray-600 mb-6">
          Our team of pet care experts is here to help you provide the best care
          for your pets. Don't hesitate to reach out with any questions or
          concerns.
        </p>
        <button className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
          Contact Support
        </button>
      </div>
    </div>
  );
};

export default PetCare;
