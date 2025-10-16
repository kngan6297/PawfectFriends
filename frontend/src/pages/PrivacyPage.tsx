import React from "react";

const PrivacyPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="prose prose-lg max-w-none">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Privacy Policy
        </h1>

        <div className="space-y-8">
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Introduction
            </h2>
            <p className="text-gray-600">
              At PawfectFriends, we take your privacy seriously. This Privacy
              Policy explains how we collect, use, disclose, and safeguard your
              information when you use our pet adoption platform. Please read
              this privacy policy carefully. If you do not agree with the terms
              of this privacy policy, please do not access the site.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Information We Collect
            </h2>
            <div className="space-y-4">
              <h3 className="text-xl font-medium text-gray-900">
                Personal Information
              </h3>
              <p className="text-gray-600">
                We may collect personal information that you voluntarily provide
                to us when you:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>Register for an account</li>
                <li>Express interest in adopting a pet</li>
                <li>Contact us for support</li>
                <li>Sign up for our newsletter</li>
                <li>Participate in our surveys or promotions</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              How We Use Your Information
            </h2>
            <p className="text-gray-600 mb-4">
              We use the information we collect to:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>Process and manage pet adoption applications</li>
              <li>
                Communicate with you about your account or adoption requests
              </li>
              <li>
                Send you updates about available pets that match your
                preferences
              </li>
              <li>Improve our website and services</li>
              <li>Send you marketing communications (with your consent)</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Information Sharing
            </h2>
            <p className="text-gray-600">We may share your information with:</p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>
                Animal shelters and rescue organizations for adoption processing
              </li>
              <li>Service providers who assist in our operations</li>
              <li>Legal authorities when required by law</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Data Security
            </h2>
            <p className="text-gray-600">
              We implement appropriate technical and organizational security
              measures to protect your personal information. However, no method
              of transmission over the Internet is 100% secure, and we cannot
              guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Your Rights
            </h2>
            <p className="text-gray-600 mb-4">You have the right to:</p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>Access your personal information</li>
              <li>Correct inaccurate information</li>
              <li>Request deletion of your information</li>
              <li>Opt-out of marketing communications</li>
              <li>Withdraw consent at any time</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Cookies and Tracking
            </h2>
            <p className="text-gray-600">
              We use cookies and similar tracking technologies to improve your
              browsing experience, analyze site traffic, and understand where
              our visitors are coming from. You can control cookies through your
              browser settings.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Children's Privacy
            </h2>
            <p className="text-gray-600">
              Our service is not intended for use by children under the age of
              13. We do not knowingly collect personal information from children
              under 13.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Changes to This Policy
            </h2>
            <p className="text-gray-600">
              We may update this privacy policy from time to time. We will
              notify you of any changes by posting the new privacy policy on
              this page and updating the "Last Updated" date.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Contact Us
            </h2>
            <p className="text-gray-600">
              If you have any questions about this Privacy Policy, please
              contact us at:
            </p>
            <div className="mt-2 text-gray-600">
              <p>Email: privacy@pawfectfriends.com</p>
              <p>Phone: (555) 123-4567</p>
              <p>Address: 123 Pet Street, Animal City, AC 12345</p>
            </div>
          </section>

          <div className="mt-8 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Last Updated: {new Date().toLocaleDateString("en-GB")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPage;
