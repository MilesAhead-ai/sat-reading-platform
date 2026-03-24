import Link from 'next/link';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-sm">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342" />
              </svg>
            </div>
            <span className="font-bold text-gray-900">SAT Prep</span>
          </Link>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Privacy Policy</h1>

        <div className="prose prose-gray max-w-none space-y-6 text-sm text-gray-600 leading-relaxed">
          <p>Last updated: March 2026</p>

          <h2 className="text-lg font-semibold text-gray-900 mt-8">1. Information We Collect</h2>
          <p>We collect information you provide when creating an account (email, name) and data generated through your use of the platform (diagnostic results, practice session data, skill estimates).</p>

          <h2 className="text-lg font-semibold text-gray-900 mt-8">2. How We Use Your Information</h2>
          <p>Your data is used to personalize your learning experience, generate adaptive exercises, track your progress, and improve our AI-powered tutoring algorithms.</p>

          <h2 className="text-lg font-semibold text-gray-900 mt-8">3. Data Security</h2>
          <p>We implement industry-standard security measures to protect your personal information. Passwords are hashed, and data is transmitted using encrypted connections.</p>

          <h2 className="text-lg font-semibold text-gray-900 mt-8">4. Data Sharing</h2>
          <p>We do not sell or share your personal information with third parties for marketing purposes. We may use third-party services (AI models, hosting) to deliver our platform features.</p>

          <h2 className="text-lg font-semibold text-gray-900 mt-8">5. Contact</h2>
          <p>If you have questions about this privacy policy, please contact us through the platform.</p>
        </div>

        <div className="mt-12 pt-6 border-t border-gray-200">
          <Link href="/" className="text-primary-600 hover:text-primary-700 text-sm font-medium">&larr; Back to Home</Link>
        </div>
      </div>
    </div>
  );
}
