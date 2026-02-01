import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPolicy() {
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
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Privacy Policy of The Ad Agent</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">Last updated: December 2025</p>

          <p className="text-gray-700 dark:text-gray-300">
            At The Ad Agent, your privacy is our priority. This Privacy Policy explains how we
            collect, use, and protect your information when you use our website, dashboard, or services (collectively,
            "Services").
          </p>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">1. Information We Collect</h2>

          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-6 mb-3">Personal Information:</h3>
          <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
            <li>Name</li>
            <li>Email address</li>
            <li>User ID (for authentication)</li>
            <li>Account activity and preferences</li>
          </ul>

          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-6 mb-3">Non-Personal Information:</h3>
          <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
            <li>Usage data (pages visited, clicks, timestamps)</li>
            <li>Device and browser information</li>
            <li>Cookies and analytics</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">
            2. How We Use Your Information
          </h2>
          <p className="text-gray-700 dark:text-gray-300">We use the information we collect to:</p>
          <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
            <li>Provide and improve our Services</li>
            <li>Communicate updates or notifications</li>
            <li>Analyze usage trends and performance</li>
            <li>Ensure account security</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">3. Data Sharing</h2>
          <p className="text-gray-700 dark:text-gray-300">
            We do not sell or rent your personal information. We may share your data only:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
            <li>With service providers necessary for operating the Services (e.g., hosting, webhooks)</li>
            <li>As required by law or legal requests</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">4. Data Storage & Security</h2>
          <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
            <li>Your data is securely stored in our backend (e.g., Supabase)</li>
            <li>Access is restricted to authorized personnel</li>
            <li>We implement industry-standard security measures to protect your information</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">5. Your Rights</h2>
          <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
            <li>Access and review your personal data</li>
            <li>Request corrections to inaccurate information</li>
            <li>Delete your account and personal data (subject to applicable law)</li>
            <li>Withdraw consent where applicable</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">6. Cookies & Tracking</h2>
          <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
            <li>We may use cookies or similar technologies for analytics and performance</li>
            <li>You can manage cookies via your browser settings</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">7. Policy Updates</h2>
          <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
            <li>We may update this Privacy Policy from time to time</li>
            <li>Users will be notified of material changes</li>
            <li>Continued use of the Services constitutes acceptance of updated policy</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">8. Contact Information</h2>
          <p className="text-gray-700 dark:text-gray-300">For any privacy-related inquiries, please contact:</p>
          <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg mt-4">
            <p className="font-semibold text-gray-900 dark:text-white">The Ad Agent</p>
            <p className="text-gray-700 dark:text-gray-300">Email: support@ad-startup.com</p>
          </div>
        </div>
      </div>
    </div>
  );
}
