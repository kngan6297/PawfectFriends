import React from "react";
import { Link } from "react-router-dom";
import { PawPrint, Instagram, Twitter, Facebook, Youtube } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <Link to="/" className="flex items-center">
              <img
                src="/images/3500_2_03.png"
                alt="PawfectFriends Logo"
                className="h-8 w-8 object-contain"
              />
              <span className="ml-2 text-xl font-bold">PawfectFriends</span>
            </Link>
            <p className="mt-2 text-sm text-gray-300">
              Finding loving homes for pets in need. Join our community of pet
              lovers and make a difference.
            </p>
            <div className="mt-4 flex space-x-3">
              <a href="#" className="text-gray-400 hover:text-white">
                <span className="sr-only">Facebook</span>
                <Facebook size={20} />
              </a>
              <a href="#" className="text-gray-400 hover:text-white">
                <span className="sr-only">Instagram</span>
                <Instagram size={20} />
              </a>
              <a href="#" className="text-gray-400 hover:text-white">
                <span className="sr-only">Twitter</span>
                <Twitter size={20} />
              </a>
              <a href="#" className="text-gray-400 hover:text-white">
                <span className="sr-only">YouTube</span>
                <Youtube size={20} />
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
              For Pet Lovers
            </h3>
            <ul className="mt-4 space-y-2">
              <li>
                <Link
                  to="/pets"
                  className="text-base text-gray-300 hover:text-white"
                >
                  Find a Pet
                </Link>
              </li>
              <li>
                <Link
                  to="/recommendations"
                  className="text-base text-gray-300 hover:text-white"
                >
                  Pet Matcher
                </Link>
              </li>
              <li>
                <Link
                  to="/adoption-guide"
                  className="text-base text-gray-300 hover:text-white"
                >
                  Adoption Guide
                </Link>
              </li>
              <li>
                <Link
                  to="/pet-care"
                  className="text-base text-gray-300 hover:text-white"
                >
                  Pet Care Resources
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
              For Shelters
            </h3>
            <ul className="mt-4 space-y-2">
              <li>
                <Link
                  to="/register?role=shelter"
                  className="text-base text-gray-300 hover:text-white"
                >
                  Register as a Shelter
                </Link>
              </li>
              <li>
                <Link
                  to="/shelter/dashboard"
                  className="text-base text-gray-300 hover:text-white"
                >
                  Shelter Dashboard
                </Link>
              </li>
              <li>
                <Link
                  to="/success-stories"
                  className="text-base text-gray-300 hover:text-white"
                >
                  Success Stories
                </Link>
              </li>
              <li>
                <Link
                  to="/partnerships"
                  className="text-base text-gray-300 hover:text-white"
                >
                  Partnership Opportunities
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
              About Us
            </h3>
            <ul className="mt-4 space-y-2">
              <li>
                <Link
                  to="/about"
                  className="text-base text-gray-300 hover:text-white"
                >
                  Our Mission
                </Link>
              </li>
              <li>
                <Link
                  to="/team"
                  className="text-base text-gray-300 hover:text-white"
                >
                  Our Team
                </Link>
              </li>
              <li>
                <Link
                  to="/contact"
                  className="text-base text-gray-300 hover:text-white"
                >
                  Contact Us
                </Link>
              </li>
              <li>
                <Link
                  to="/careers"
                  className="text-base text-gray-300 hover:text-white"
                >
                  Careers
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-gray-700 pt-8 flex flex-col md:flex-row justify-between">
          <p className="text-base text-gray-400">
            &copy; {new Date().getFullYear()} PawfectFriends. All rights
            reserved.
          </p>
          <div className="mt-4 md:mt-0 flex space-x-6">
            <Link
              to="/privacy"
              className="text-sm text-gray-400 hover:text-white"
            >
              Privacy Policy
            </Link>
            <Link
              to="/terms"
              className="text-sm text-gray-400 hover:text-white"
            >
              Terms of Service
            </Link>
            <Link
              to="/accessibility"
              className="text-sm text-gray-400 hover:text-white"
            >
              Accessibility
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
