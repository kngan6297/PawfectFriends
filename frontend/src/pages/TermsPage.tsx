import React from "react";

const TermsPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="prose prose-lg max-w-none">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Terms of Service
        </h1>

        <div className="space-y-8">
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              1. Acceptance of Terms
            </h2>
            <p className="text-gray-600">
              By accessing and using PawfectFriends, you agree to be bound by
              these Terms of Service and all applicable laws and regulations. If
              you do not agree with any of these terms, you are prohibited from
              using or accessing this site.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              2. Use License
            </h2>
            <p className="text-gray-600 mb-4">
              Permission is granted to temporarily use PawfectFriends for
              personal, non-commercial purposes. This license does not include:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>Modifying or copying the materials</li>
              <li>Using the materials for any commercial purpose</li>
              <li>
                Attempting to decompile or reverse engineer any software
                contained on PawfectFriends
              </li>
              <li>
                Removing any copyright or other proprietary notations from the
                materials
              </li>
              <li>
                Transferring the materials to another person or "mirror" the
                materials on any other server
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              3. User Accounts
            </h2>
            <p className="text-gray-600 mb-4">
              To use certain features of PawfectFriends, you must register for
              an account. You agree to:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>Provide accurate and complete information</li>
              <li>Maintain the security of your account and password</li>
              <li>
                Accept responsibility for all activities under your account
              </li>
              <li>
                Notify us immediately of any unauthorized use of your account
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              4. Pet Adoption Process
            </h2>
            <p className="text-gray-600 mb-4">
              When using our pet adoption services, you agree to:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>
                Provide accurate information about your living situation and
                ability to care for a pet
              </li>
              <li>Complete all required adoption procedures and paperwork</li>
              <li>Pay any applicable adoption fees</li>
              <li>Provide proper care and attention to adopted pets</li>
              <li>
                Comply with all local laws and regulations regarding pet
                ownership
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              5. Shelter Responsibilities
            </h2>
            <p className="text-gray-600 mb-4">
              Shelters using our platform agree to:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>Provide accurate information about available pets</li>
              <li>Maintain proper documentation and medical records</li>
              <li>Follow ethical adoption practices</li>
              <li>Respond promptly to adoption inquiries</li>
              <li>
                Comply with all applicable animal welfare laws and regulations
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              6. Content Guidelines
            </h2>
            <p className="text-gray-600 mb-4">
              Users agree not to post content that:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>Is illegal, harmful, threatening, abusive, or harassing</li>
              <li>Infringes on intellectual property rights</li>
              <li>Contains false or misleading information</li>
              <li>Is spam or unauthorized advertising</li>
              <li>Contains viruses or malicious code</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              7. Intellectual Property
            </h2>
            <p className="text-gray-600">
              The content on PawfectFriends, including text, graphics, logos,
              and software, is the property of PawfectFriends or its content
              suppliers and is protected by international copyright laws. You
              may not use, reproduce, or distribute any content from this site
              without our permission.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              8. Limitation of Liability
            </h2>
            <p className="text-gray-600">
              PawfectFriends shall not be liable for any damages arising out of
              the use or inability to use our services. We do not guarantee the
              accuracy of information provided by shelters or users, and we are
              not responsible for the actions of any users or third parties.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              9. Termination
            </h2>
            <p className="text-gray-600">
              We reserve the right to terminate or suspend access to our
              services for any user who violates these Terms of Service. We may
              also terminate or suspend accounts that are inactive for an
              extended period.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              10. Changes to Terms
            </h2>
            <p className="text-gray-600">
              We reserve the right to modify these terms at any time. We will
              notify users of any material changes by posting the new Terms of
              Service on this page and updating the "Last Updated" date.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              11. Governing Law
            </h2>
            <p className="text-gray-600">
              These terms shall be governed by and construed in accordance with
              the laws of the jurisdiction in which PawfectFriends operates,
              without regard to its conflict of law provisions.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              12. Contact Information
            </h2>
            <p className="text-gray-600">
              If you have any questions about these Terms of Service, please
              contact us at:
            </p>
            <div className="mt-2 text-gray-600">
              <p>Email: legal@pawfectfriends.com</p>
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

export default TermsPage;
