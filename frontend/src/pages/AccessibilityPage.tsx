import React from "react";

const AccessibilityPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="prose prose-lg max-w-none">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Accessibility Statement
        </h1>

        <div className="space-y-8">
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Our Commitment
            </h2>
            <p className="text-gray-600">
              PawfectFriends is committed to ensuring digital accessibility for
              people of all abilities. We strive to continually improve the user
              experience for everyone and apply relevant accessibility
              standards.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Accessibility Features
            </h2>
            <div className="space-y-4">
              <h3 className="text-xl font-medium text-gray-900">
                Navigation and Structure
              </h3>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>Clear and consistent navigation structure</li>
                <li>Proper heading hierarchy for content organization</li>
                <li>Skip navigation links for keyboard users</li>
                <li>Logical tab order for keyboard navigation</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-900 mt-6">
                Visual Design
              </h3>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>High contrast color combinations</li>
                <li>Resizable text without loss of functionality</li>
                <li>Clear and readable typography</li>
                <li>Alternative text for images</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-900 mt-6">
                Interactive Elements
              </h3>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>Keyboard-accessible forms and controls</li>
                <li>Clear focus indicators</li>
                <li>Descriptive link text</li>
                <li>Error messages and form validation</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Standards Compliance
            </h2>
            <p className="text-gray-600 mb-4">
              We aim to conform to the following accessibility standards:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>Web Content Accessibility Guidelines (WCAG) 2.1 Level AA</li>
              <li>Americans with Disabilities Act (ADA) requirements</li>
              <li>Section 508 of the Rehabilitation Act</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Assistive Technologies
            </h2>
            <p className="text-gray-600 mb-4">
              Our website is designed to work with:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>Screen readers (NVDA, JAWS, VoiceOver)</li>
              <li>Screen magnifiers</li>
              <li>Speech recognition software</li>
              <li>Keyboard-only navigation</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Ongoing Improvements
            </h2>
            <p className="text-gray-600">
              We regularly review our website to identify and fix accessibility
              issues. Our development process includes:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2 mt-4">
              <li>Regular accessibility audits</li>
              <li>User testing with people with disabilities</li>
              <li>Training for our development team</li>
              <li>Continuous monitoring and updates</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Feedback and Support
            </h2>
            <p className="text-gray-600 mb-4">
              We welcome your feedback on the accessibility of our website. If
              you encounter any accessibility barriers or have suggestions for
              improvement, please contact us:
            </p>
            <div className="mt-2 text-gray-600">
              <p>Email: accessibility@pawfectfriends.com</p>
              <p>Phone: (555) 123-4567</p>
              <p>Address: 123 Pet Street, Animal City, AC 12345</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Browser Compatibility
            </h2>
            <p className="text-gray-600">
              Our website is designed to work with the following browsers and
              their latest versions:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2 mt-4">
              <li>Google Chrome</li>
              <li>Mozilla Firefox</li>
              <li>Microsoft Edge</li>
              <li>Safari</li>
            </ul>
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

export default AccessibilityPage;
