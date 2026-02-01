import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <div className="prose prose-lg dark:prose-invert max-w-none">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Terms of Service of The Ad Agent</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">Last updated: December 2025</p>

          <p className="text-gray-700 dark:text-gray-300">
            These Terms of Service ("Terms") govern your use of the Services provided by The Ad Agent. By accessing or using our Services, you agree to be bound by these Terms.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">1. Acceptance of Terms</h2>
          <p className="text-gray-700 dark:text-gray-300">
            By using our Services, you confirm that you have read, understood, and agreed to these Terms.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">2. User Eligibility</h2>
          <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
            <li>You must be at least 16 years old to use the Services</li>
            <li>You must provide accurate and complete information when registering</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">3. Account Responsibilities</h2>
          <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
            <li>You are responsible for maintaining the confidentiality of your account credentials</li>
            <li>You are responsible for all activities performed under your account</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">4. Prohibited Activities</h2>
          <p className="text-gray-700 dark:text-gray-300">You agree not to:</p>
          <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
            <li>Violate any applicable law or regulation</li>
            <li>Use the Services to harm others or interfere with the Services</li>
            <li>Attempt to gain unauthorized access to other accounts or systems</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">5. Service Availability</h2>
          <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
            <li>Services are provided "as-is" and "as-available"</li>
            <li>
              The Ad Agent reserves the right to suspend, modify, or discontinue Services at any time without prior
              notice
            </li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">6. Limitation of Liability</h2>
          <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
            <li>
              The Ad Agent is not liable for indirect, incidental, or consequential damages arising from use of the
              Services
            </li>
            <li>Liability is limited to the maximum extent permitted by law</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">7. Termination</h2>
          <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
            <li>We may terminate or suspend accounts for violations of these Terms</li>
            <li>You may terminate your account at any time by contacting support</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">8. Changes to Terms</h2>
          <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
            <li>We may update these Terms periodically</li>
            <li>Continued use of the Services after changes constitutes acceptance of the new Terms</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">9. Governing Law</h2>
          <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
            <li>These Terms are governed by the laws of your jurisdiction</li>
            <li>Any disputes will be resolved in accordance with applicable law</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">10. Contact Information</h2>
          <p className="text-gray-700 dark:text-gray-300">For questions regarding these Terms:</p>
          <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg mt-4">
            <p className="font-semibold text-gray-900 dark:text-white">The Ad Agent</p>
            <p className="text-gray-700 dark:text-gray-300">Email: support@ad-startup.com</p>
          </div>
        </div>
      </div>
    </div>
  );
}
