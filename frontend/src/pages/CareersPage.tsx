import React from "react";
import { Link } from "react-router-dom";

const CareersPage: React.FC = () => {
  const jobOpenings = [
    {
      id: 1,
      title: "Frontend Developer",
      department: "Engineering",
      location: "Remote",
      type: "Full-time",
      description:
        "Join our engineering team to build and improve our pet adoption platform. You'll work with React, TypeScript, and modern web technologies.",
    },
    {
      id: 2,
      title: "Animal Care Specialist",
      department: "Operations",
      location: "Animal City, AC",
      type: "Full-time",
      description:
        "Help ensure the well-being of animals in our care. Experience with animal handling and care required.",
    },
    {
      id: 3,
      title: "Customer Success Manager",
      department: "Support",
      location: "Remote",
      type: "Full-time",
      description:
        "Support our users and partners in their pet adoption journey. Strong communication skills and passion for animal welfare required.",
    },
    {
      id: 4,
      title: "Marketing Coordinator",
      department: "Marketing",
      location: "Hybrid",
      type: "Full-time",
      description:
        "Help spread awareness about pet adoption and manage our social media presence. Experience in digital marketing preferred.",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Join Our Mission
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Help us create a world where every pet has a loving home. Join our
          passionate team and make a difference in the lives of animals and
          their future families.
        </p>
      </div>

      {/* Why Join Us Section */}
      <div className="mb-16">
        <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          Why Join PawfectFriends?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              Make an Impact
            </h3>
            <p className="text-gray-600">
              Every day, you'll help connect loving families with pets in need,
              making a real difference in their lives.
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              Growth & Development
            </h3>
            <p className="text-gray-600">
              We invest in our team's growth with learning opportunities,
              mentorship, and career advancement paths.
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              Work-Life Balance
            </h3>
            <p className="text-gray-600">
              Enjoy flexible work arrangements, competitive benefits, and a
              supportive work environment.
            </p>
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="mb-16">
        <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          Our Benefits
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Health & Wellness
            </h3>
            <p className="text-gray-600">
              Comprehensive health insurance, wellness programs, and mental
              health support
            </p>
          </div>
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Time Off
            </h3>
            <p className="text-gray-600">
              Generous PTO, paid holidays, and flexible work arrangements
            </p>
          </div>
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Learning
            </h3>
            <p className="text-gray-600">
              Professional development budget and learning resources
            </p>
          </div>
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Pet-Friendly
            </h3>
            <p className="text-gray-600">
              Pet-friendly office and pet care benefits
            </p>
          </div>
        </div>
      </div>

      {/* Open Positions Section */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          Open Positions
        </h2>
        <div className="space-y-6">
          {jobOpenings.map((job) => (
            <div
              key={job.id}
              className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    {job.title}
                  </h3>
                  <p className="text-gray-600">{job.department}</p>
                </div>
                <div className="mt-2 md:mt-0 flex flex-wrap gap-2">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                    {job.location}
                  </span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                    {job.type}
                  </span>
                </div>
              </div>
              <p className="text-gray-600 mb-4">{job.description}</p>
              <Link
                to={`/careers/${job.id}`}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
              >
                Learn More
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* Call to Action */}
      <div className="mt-16 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Don't see the right role?
        </h2>
        <p className="text-gray-600 mb-6">
          We're always looking for talented individuals who share our passion
          for animal welfare.
        </p>
        <Link
          to="/contact"
          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
        >
          Contact Us
        </Link>
      </div>
    </div>
  );
};

export default CareersPage;
