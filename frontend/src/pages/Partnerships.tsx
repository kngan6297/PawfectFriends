import React from "react";
import { Handshake, Users, Heart, Building2, Gift, Star } from "lucide-react";
import { Link } from "react-router-dom";

interface PartnershipType {
  title: string;
  description: string;
  icon: React.ReactNode;
  benefits: string[];
  requirements: string[];
}

const Partnerships: React.FC = () => {
  const partnershipTypes: PartnershipType[] = [
    {
      title: "Corporate Partnerships",
      icon: <Building2 className="w-8 h-8 text-primary-600" />,
      description:
        "Join forces with businesses to create meaningful impact in animal welfare. Corporate partnerships can take many forms, from financial support to employee volunteer programs.",
      benefits: [
        "Access to corporate funding and resources",
        "Employee volunteer programs",
        "Corporate matching donations",
        "Brand visibility and recognition",
        "Networking opportunities",
      ],
      requirements: [
        "Registered non-profit status",
        "Clear mission and impact metrics",
        "Professional communication channels",
        "Transparent financial reporting",
        "Dedicated partnership coordinator",
      ],
    },
    {
      title: "Veterinary Partnerships",
      icon: <Heart className="w-8 h-8 text-primary-600" />,
      description:
        "Collaborate with veterinary clinics and hospitals to provide essential medical care for shelter animals and support for adopters.",
      benefits: [
        "Discounted veterinary services",
        "Priority care for shelter animals",
        "Post-adoption support",
        "Medical expertise and consultation",
        "Community education programs",
      ],
      requirements: [
        "Licensed veterinary facility",
        "Quality care standards",
        "Emergency care availability",
        "Staff training in shelter medicine",
        "Regular communication protocols",
      ],
    },
    {
      title: "Community Partnerships",
      icon: <Users className="w-8 h-8 text-primary-600" />,
      description:
        "Build relationships with local organizations, schools, and community groups to expand your reach and impact.",
      benefits: [
        "Increased community engagement",
        "Volunteer recruitment",
        "Local event opportunities",
        "Educational programs",
        "Resource sharing",
      ],
      requirements: [
        "Active community presence",
        "Event planning capabilities",
        "Volunteer management system",
        "Safety protocols",
        "Community outreach programs",
      ],
    },
    {
      title: "Sponsorship Programs",
      icon: <Gift className="w-8 h-8 text-primary-600" />,
      description:
        "Create sponsorship opportunities for individuals and organizations to support specific animals or programs.",
      benefits: [
        "Dedicated funding streams",
        "Personalized donor relationships",
        "Program-specific support",
        "Recognition opportunities",
        "Long-term sustainability",
      ],
      requirements: [
        "Clear sponsorship tiers",
        "Donor recognition program",
        "Regular impact reporting",
        "Transparent fund allocation",
        "Donor communication system",
      ],
    },
  ];

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="text-center mb-16">
        <div className="flex justify-center mb-4">
          <Handshake className="w-12 h-12 text-primary-600" />
        </div>
        <h1 className="text-4xl font-bold mb-4">Partnership Opportunities</h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Join our network of partners and make a difference in the lives of
          animals. Together, we can create lasting impact in our community.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
        {partnershipTypes.map((type, index) => (
          <div
            key={index}
            className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow"
          >
            <div className="flex items-center gap-4 mb-4">
              {type.icon}
              <h2 className="text-2xl font-semibold">{type.title}</h2>
            </div>
            <p className="text-gray-600 mb-6">{type.description}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Star className="w-5 h-5 text-primary-600" />
                  Benefits
                </h3>
                <ul className="space-y-2">
                  {type.benefits.map((benefit, idx) => (
                    <li key={idx} className="flex items-start gap-2">
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
                      <span className="text-gray-600">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Star className="w-5 h-5 text-primary-600" />
                  Requirements
                </h3>
                <ul className="space-y-2">
                  {type.requirements.map((requirement, idx) => (
                    <li key={idx} className="flex items-start gap-2">
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
                      <span className="text-gray-600">{requirement}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-primary-50 rounded-lg p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Ready to Partner With Us?</h2>
        <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
          We're always looking for new partners who share our passion for animal
          welfare. Whether you're a business, veterinary clinic, or community
          organization, we'd love to explore how we can work together.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/shelter/dashboard"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Become a Partner
          </Link>
          <button className="inline-flex items-center px-6 py-3 border border-primary-600 text-base font-medium rounded-md text-primary-600 bg-white hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
            Download Partnership Guide
          </button>
        </div>
      </div>
    </div>
  );
};

export default Partnerships;
