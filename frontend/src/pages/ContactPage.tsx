import React, { useState } from "react";
import { toast } from "react-toastify";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
  SelectSeparator,
} from "../components/ui/Select";
import { Mail, Phone, MapPin, Clock } from "lucide-react";

const ContactPage: React.FC = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement form submission logic
    console.log("Form submitted:", formData);
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Contact Us</h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Have questions about pet adoption or need assistance? We're here to
          help! Reach out to us through any of the following channels.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Contact Information */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-8">
            Get in Touch
          </h2>
          <div className="space-y-6">
            <div className="flex items-start">
              <Mail className="h-6 w-6 text-primary-600 mt-1" />
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">Email</h3>
                <p className="text-gray-600">info@pawfectfriends.com</p>
                <p className="text-gray-600">support@pawfectfriends.com</p>
              </div>
            </div>

            <div className="flex items-start">
              <Phone className="h-6 w-6 text-primary-600 mt-1" />
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">Phone</h3>
                <p className="text-gray-600">Main: (555) 123-4567</p>
                <p className="text-gray-600">Support: (555) 987-6543</p>
              </div>
            </div>

            <div className="flex items-start">
              <MapPin className="h-6 w-6 text-primary-600 mt-1" />
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">Address</h3>
                <p className="text-gray-600">
                  123 Pet Street
                  <br />
                  Animal City, AC 12345
                  <br />
                  United States
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <Clock className="h-6 w-6 text-primary-600 mt-1" />
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Business Hours
                </h3>
                <p className="text-gray-600">
                  Monday - Friday: 9:00 AM - 6:00 PM
                  <br />
                  Saturday: 10:00 AM - 4:00 PM
                  <br />
                  Sunday: Closed
                </p>
              </div>
            </div>
          </div>

          {/* Social Media Links */}
          <div className="mt-12">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Follow Us
            </h3>
            <div className="flex space-x-4">
              <a
                href="#"
                className="text-gray-600 hover:text-primary-600 transition-colors"
              >
                Facebook
              </a>
              <a
                href="#"
                className="text-gray-600 hover:text-primary-600 transition-colors"
              >
                Twitter
              </a>
              <a
                href="#"
                className="text-gray-600 hover:text-primary-600 transition-colors"
              >
                Instagram
              </a>
              <a
                href="#"
                className="text-gray-600 hover:text-primary-600 transition-colors"
              >
                LinkedIn
              </a>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Send us a Message
          </h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700"
              >
                Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              />
            </div>

            <div>
              <label
                htmlFor="subject"
                className="block text-sm font-medium text-gray-700"
              >
                Subject
              </label>
              <Select
                value={formData.subject}
                onValueChange={(value) => setFormData({ ...formData, subject: value })}
              >
                <SelectTrigger className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500">
                  <SelectValue placeholder="Select a subject" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General Inquiry</SelectItem>
                  <SelectItem value="adoption">Adoption Process</SelectItem>
                  <SelectItem value="support">Technical Support</SelectItem>
                  <SelectItem value="partnership">Partnership Opportunities</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label
                htmlFor="message"
                className="block text-sm font-medium text-gray-700"
              >
                Message
              </label>
              <textarea
                id="message"
                name="message"
                rows={4}
                value={formData.message}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              />
            </div>

            <button
              type="submit"
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Send Message
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
