import React from "react";
import { PawPrint, Home, Heart, ClipboardList, Shield } from "lucide-react";

const AdoptionGuide: React.FC = () => {
  const steps = [
    {
      title: "Browse Available Pets",
      description:
        "Explore our selection of pets looking for their forever homes. Use our filters to find the perfect match based on species, age, size, and more.",
      icon: <PawPrint className="w-10 h-10 text-primary-600" />,
    },
    {
      title: "Submit an Application",
      description:
        "Fill out our adoption application form with your details, living situation, and experience with pets. This helps us ensure the best match for both you and the pet.",
      icon: <ClipboardList className="w-10 h-10 text-primary-600" />,
    },
    {
      title: "Meet and Greet",
      description:
        "Schedule a visit to meet your potential new family member. This is a crucial step to ensure compatibility and build a connection.",
      icon: <Heart className="w-10 h-10 text-primary-600" />,
    },
    {
      title: "Home Visit",
      description:
        "We may conduct a home visit to ensure your living environment is suitable for the pet you wish to adopt.",
      icon: <Home className="w-10 h-10 text-primary-600" />,
    },
    {
      title: "Final Approval",
      description:
        "Once approved, complete the adoption paperwork and pay the adoption fee, which helps cover medical care and other expenses.",
      icon: <Shield className="w-10 h-10 text-primary-600" />,
    },
  ];

  const requirements = [
    "Be at least 18 years old",
    "Have a stable living situation",
    "Provide proof of identification",
    "Have landlord permission if renting",
    "Be able to provide proper care and attention",
    "Have financial means to support a pet",
    "Be willing to commit to the pet's lifetime",
  ];

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold mb-4">Adoption Guide</h1>
        <p className="text-xl text-gray-600">
          Your journey to finding a perfect companion starts here
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-semibold mb-6">
              The Adoption Process
            </h2>
            <div className="space-y-6">
              {steps.map((step, index) => (
                <div key={index} className="flex items-start gap-4">
                  <div>{step.icon}</div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">
                      {index + 1}. {step.title}
                    </h3>
                    <p className="text-gray-600">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div>
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-semibold mb-6">
              Adoption Requirements
            </h2>
            <ul className="space-y-4">
              {requirements.map((requirement, index) => (
                <li key={index} className="flex items-start gap-3">
                  <svg
                    className="w-6 h-6 text-primary-600 mt-0.5"
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
                  <span>{requirement}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-8 mt-8">
        <h2 className="text-2xl font-semibold mb-4">Ready to Adopt?</h2>
        <p className="text-gray-600 mb-4">
          Start your journey by browsing our available pets. When you find a
          potential match, you can submit an adoption application directly
          through their profile page.
        </p>
        <p className="text-gray-600">
          Remember, adopting a pet is a lifelong commitment. Make sure you're
          ready to provide love, care, and attention for many years to come.
        </p>
      </div>
    </div>
  );
};

export default AdoptionGuide;
