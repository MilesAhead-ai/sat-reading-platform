import Link from 'next/link';

export default function TermsOfServicePage() {
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
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Terms of Service</h1>

        <div className="prose prose-gray max-w-none space-y-6 text-sm text-gray-600 leading-relaxed">
          <p>Last updated: March 2026</p>

          <h2 className="text-lg font-semibold text-gray-900 mt-8">1. Acceptance of Terms</h2>
          <p>By accessing and using SAT Reading Prep, you agree to be bound by these Terms of Service. If you do not agree, please do not use the platform.</p>

          <h2 className="text-lg font-semibold text-gray-900 mt-8">2. Description of Service</h2>
          <p>SAT Reading Prep provides AI-powered adaptive practice for the SAT Reading & Writing section, including diagnostic assessments, practice exercises, mock tests, and AI coaching.</p>

          <h2 className="text-lg font-semibold text-gray-900 mt-8">3. User Accounts</h2>
          <p>You are responsible for maintaining the confidentiality of your account credentials. You must provide accurate information when creating your account.</p>

          <h2 className="text-lg font-semibold text-gray-900 mt-8">4. Acceptable Use</h2>
          <p>You agree not to misuse the platform, including but not limited to: attempting to access other users&apos; data, reverse-engineering the AI algorithms, or using the service for unauthorized commercial purposes.</p>

          <h2 className="text-lg font-semibold text-gray-900 mt-8">5. Intellectual Property</h2>
          <p>All content, including AI-generated passages and questions, is the property of SAT Reading Prep. SAT is a registered trademark of the College Board, which is not affiliated with this platform.</p>

          <h2 className="text-lg font-semibold text-gray-900 mt-8">6. Disclaimer</h2>
          <p>This platform is an independent study tool and is not affiliated with, endorsed by, or associated with the College Board or ETS. Score projections are estimates and do not guarantee actual SAT performance.</p>

          <h2 className="text-lg font-semibold text-gray-900 mt-8">7. Contact</h2>
          <p>For questions about these terms, please contact us through the platform.</p>
        </div>

        <div className="mt-12 pt-6 border-t border-gray-200">
          <Link href="/" className="text-primary-600 hover:text-primary-700 text-sm font-medium">&larr; Back to Home</Link>
        </div>
      </div>
    </div>
  );
}
