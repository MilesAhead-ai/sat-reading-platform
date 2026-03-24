import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="max-w-6xl mx-auto px-4 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-sm">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342" />
            </svg>
          </div>
          <span className="font-bold text-gray-900 text-lg tracking-tight">SAT Prep</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors px-3 py-2">
            Sign In
          </Link>
          <Link href="/register" className="btn-primary !py-2 !px-4 text-sm">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-violet-50" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary-200/30 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-violet-200/20 rounded-full blur-3xl" />
        <div className="relative max-w-6xl mx-auto px-4 py-24 md:py-32 text-center">
          <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-primary-100 rounded-full px-4 py-1.5 mb-6 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-soft" />
            <span className="text-sm font-medium text-gray-600">AI-powered adaptive learning</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-5 tracking-tight leading-tight">
            Ace the SAT Reading<br className="hidden sm:block" /> Section
          </h1>
          <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto leading-relaxed">
            Adaptive diagnostics, AI-generated exercises, and personalized coaching that targets your exact weaknesses to maximize your score improvement.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/register" className="btn-primary text-lg px-8 py-3.5 shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40 transition-shadow">
              Start Free
            </Link>
            <Link href="/demo" className="btn-secondary text-lg px-8 py-3.5">
              Try a Sample Question
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Everything you need to improve</h2>
          <p className="text-gray-500 max-w-xl mx-auto">A complete SAT Reading preparation platform built with proven learning science and modern AI.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link href="/register" className="card-hover group cursor-pointer">
            <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center mb-4 group-hover:bg-primary-100 transition-colors">
              <svg className="w-6 h-6 text-primary-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
              </svg>
            </div>
            <h3 className="font-semibold text-lg mb-2 text-gray-900">Adaptive Diagnostic</h3>
            <p className="text-gray-500 text-sm leading-relaxed">Take a 30-question adaptive assessment that identifies your exact strengths and weaknesses across all SAT Reading skills.</p>
          </Link>
          <Link href="/register" className="card-hover group cursor-pointer">
            <div className="w-12 h-12 rounded-xl bg-violet-50 flex items-center justify-center mb-4 group-hover:bg-violet-100 transition-colors">
              <svg className="w-6 h-6 text-violet-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
            </div>
            <h3 className="font-semibold text-lg mb-2 text-gray-900">AI Coaching</h3>
            <p className="text-gray-500 text-sm leading-relaxed">Chat with a personal AI tutor, get targeted study tips, and practice with AI-generated exercises tailored to your skill gaps.</p>
          </Link>
          <Link href="/register" className="card-hover group cursor-pointer">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center mb-4 group-hover:bg-emerald-100 transition-colors">
              <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
              </svg>
            </div>
            <h3 className="font-semibold text-lg mb-2 text-gray-900">Track Progress</h3>
            <p className="text-gray-500 text-sm leading-relaxed">Watch your skills improve with detailed analytics, SAT score projections, streak tracking, and skill mastery badges.</p>
          </Link>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-gray-50 border-y border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-primary-600 mb-1">16</div>
              <div className="text-sm text-gray-500">SAT Reading Skills</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary-600 mb-1">4</div>
              <div className="text-sm text-gray-500">Diagnostic Levels</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary-600 mb-1">AI</div>
              <div className="text-sm text-gray-500">Generated Exercises</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary-600 mb-1">IRT</div>
              <div className="text-sm text-gray-500">Adaptive Algorithm</div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-14">How it works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center mx-auto mb-4 text-white font-bold text-xl shadow-lg">1</div>
            <h3 className="font-semibold text-gray-900 mb-2">Take the Diagnostic</h3>
            <p className="text-sm text-gray-500 leading-relaxed">A 30-question adaptive test pinpoints your skill levels across all SAT Reading categories.</p>
          </div>
          <div className="text-center">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center mx-auto mb-4 text-white font-bold text-xl shadow-lg">2</div>
            <h3 className="font-semibold text-gray-900 mb-2">Practice Smart</h3>
            <p className="text-sm text-gray-500 leading-relaxed">The system selects exercises targeting your weakest skills at the right difficulty level.</p>
          </div>
          <div className="text-center">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center mx-auto mb-4 text-white font-bold text-xl shadow-lg">3</div>
            <h3 className="font-semibold text-gray-900 mb-2">Watch Your Score Rise</h3>
            <p className="text-sm text-gray-500 leading-relaxed">Track detailed progress, earn mastery badges, and see your projected SAT score improve.</p>
          </div>
        </div>
        <div className="text-center mt-12">
          <Link href="/register" className="btn-primary text-lg px-10 py-3.5">
            Get Started for Free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342" />
                </svg>
              </div>
              <span className="font-semibold text-white text-sm">SAT Reading Prep</span>
            </div>
            <div className="flex gap-6 text-sm">
              <Link href="/login" className="hover:text-white transition-colors">Sign In</Link>
              <Link href="/register" className="hover:text-white transition-colors">Get Started</Link>
              <Link href="/knowledge-base" className="hover:text-white transition-colors">Knowledge Base</Link>
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
            </div>
            <p className="text-sm text-gray-500">Built with adaptive learning and AI.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
