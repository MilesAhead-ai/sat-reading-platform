'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/store';

interface DashboardData {
  totalQuestions: number;
  correctCount: number;
  accuracy: number;
  totalSessions: number;
  currentStreak: number;
  estimatedScoreRange: { low: number; mid: number; high: number };
}

interface TipData {
  id: string;
  content: string;
  category: string;
  createdAt: string;
}

interface SkillData {
  skillId: string;
  skillName: string;
  level: string;
  abilityEstimate: number;
  masteryStatus: string;
  trend: string;
}

interface RecommendationData {
  weakSkills: { skillId: string; skillName: string; masteryStatus: string }[];
  articles: { id: string; title: string; type: string; skills: string[] }[];
}

interface ProfileData {
  targetTestDate: string | null;
  targetScore: number | null;
}

const masteryColors: Record<string, string> = {
  novice: 'bg-red-50 text-red-700 border border-red-200',
  developing: 'bg-amber-50 text-amber-700 border border-amber-200',
  proficient: 'bg-blue-50 text-blue-700 border border-blue-200',
  mastered: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
};

const trendIcons: Record<string, JSX.Element> = {
  improving: (
    <span className="flex items-center gap-1 text-emerald-600">
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
      </svg>
      <span className="text-xs font-medium">Up</span>
    </span>
  ),
  declining: (
    <span className="flex items-center gap-1 text-red-500">
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6L9 12.75l4.286-4.286a11.948 11.948 0 014.306 6.43l.776 2.898m0 0l3.182-5.511m-3.182 5.51l-5.511-3.181" />
      </svg>
      <span className="text-xs font-medium">Down</span>
    </span>
  ),
  stable: (
    <span className="flex items-center gap-1 text-gray-400">
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
      </svg>
      <span className="text-xs font-medium">Stable</span>
    </span>
  ),
};

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [skills, setSkills] = useState<SkillData[]>([]);
  const [tips, setTips] = useState<TipData[]>([]);
  const [recommendations, setRecommendations] = useState<RecommendationData | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [tipsLoading, setTipsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reviewCount, setReviewCount] = useState(0);

  useEffect(() => {
    Promise.all([
      api.get<any>('/progress/dashboard'),
      api.get<any>('/progress/skills'),
      api.get<any>('/tips/latest?limit=3'),
      api.get<any>('/progress/recommendations'),
      api.get<any>('/review-queue/count').catch(() => ({ count: 0 })),
      api.get<any>('/users/me/profile').catch(() => null),
    ]).then(([d, s, t, r, rc, p]) => {
      setDashboard(d.data || d);
      setSkills((s.data || s) as SkillData[]);
      setTips((t.data || t) as TipData[]);
      setRecommendations((r.data || r) as RecommendationData);
      const countData = rc.data || rc;
      setReviewCount(countData.count ?? 0);
      if (p) setProfile((p.data || p) as ProfileData);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const generateNewTip = async () => {
    setTipsLoading(true);
    try {
      const result = await api.post<any>('/tips/generate');
      const newTip = (result.data || result) as TipData;
      setTips((prev) => [newTip, ...prev].slice(0, 3));
    } catch (err) {
      console.error('Failed to generate tip:', err);
    } finally {
      setTipsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="flex justify-between items-center">
          <div className="h-8 w-40 bg-gray-200 rounded-lg" />
          <div className="h-10 w-36 bg-gray-200 rounded-lg" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-white rounded-xl border border-gray-100" />)}
        </div>
        <div className="h-64 bg-white rounded-xl border border-gray-100" />
      </div>
    );
  }

  const isNewUser = dashboard && dashboard.totalSessions === 0 && dashboard.totalQuestions === 0;

  const daysUntilTest = profile?.targetTestDate
    ? Math.ceil((new Date(profile.targetTestDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;
  const showCountdown = daysUntilTest !== null && daysUntilTest > 0;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="page-header">{user?.name ? `Welcome, ${user.name}` : 'Dashboard'}</h1>
          <p className="text-sm text-gray-500 mt-1">Your SAT Reading preparation at a glance</p>
        </div>
        <Link href="/practice" className="btn-primary flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
          </svg>
          Start Practicing
        </Link>
      </div>

      {isNewUser && (
        <div className="bg-gradient-to-r from-primary-500 to-violet-600 rounded-2xl p-6 text-white shadow-lg">
          <h2 className="text-xl font-bold mb-2">Welcome to SAT Reading Prep!</h2>
          <p className="text-primary-100 mb-5 leading-relaxed">Get started in three simple steps to begin improving your SAT Reading score.</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link href="/diagnostic" className="bg-white/15 backdrop-blur-sm rounded-xl p-4 hover:bg-white/25 transition-colors group">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold">1</div>
                <span className="font-semibold">Take Diagnostic</span>
              </div>
              <p className="text-sm text-primary-100">Identify your strengths and weaknesses with a quick assessment.</p>
            </Link>
            <Link href="/practice" className="bg-white/15 backdrop-blur-sm rounded-xl p-4 hover:bg-white/25 transition-colors group">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold">2</div>
                <span className="font-semibold">Practice</span>
              </div>
              <p className="text-sm text-primary-100">Work on adaptive exercises targeting your weak areas.</p>
            </Link>
            <Link href="/progress" className="bg-white/15 backdrop-blur-sm rounded-xl p-4 hover:bg-white/25 transition-colors group">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold">3</div>
                <span className="font-semibold">Review Progress</span>
              </div>
              <p className="text-sm text-primary-100">Track your improvement with detailed skill analytics.</p>
            </Link>
          </div>
        </div>
      )}

      {dashboard && (
        <div className={`grid grid-cols-2 gap-4 ${showCountdown ? 'md:grid-cols-5' : 'md:grid-cols-4'}`}>
          <div className="card relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-400 to-primary-600 rounded-t-xl" />
            <div className="flex flex-col items-center pt-2">
              <div className="text-3xl font-bold text-primary-600">{dashboard.estimatedScoreRange.mid}</div>
              <div className="text-sm font-medium text-gray-500 mt-1">Est. SAT Score</div>
              <div className="text-xs text-gray-400 mt-0.5">{dashboard.estimatedScoreRange.low} - {dashboard.estimatedScoreRange.high}</div>
            </div>
          </div>
          <div className="card relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-t-xl" />
            <div className="flex flex-col items-center pt-2">
              <div className="text-3xl font-bold text-emerald-600">{dashboard.accuracy}%</div>
              <div className="text-sm font-medium text-gray-500 mt-1">Accuracy</div>
              <div className="text-xs text-gray-400 mt-0.5">{dashboard.correctCount}/{dashboard.totalQuestions} correct</div>
            </div>
          </div>
          <div className="card relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 to-orange-500 rounded-t-xl" />
            <div className="flex flex-col items-center pt-2">
              <div className="text-3xl font-bold text-amber-600">{dashboard.currentStreak}</div>
              <div className="text-sm font-medium text-gray-500 mt-1">Day Streak</div>
              {dashboard.currentStreak > 0 && <div className="text-xs text-amber-500 mt-0.5">Keep it up!</div>}
            </div>
          </div>
          <div className="card relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-400 to-purple-600 rounded-t-xl" />
            <div className="flex flex-col items-center pt-2">
              <div className="text-3xl font-bold text-violet-600">{dashboard.totalSessions}</div>
              <div className="text-sm font-medium text-gray-500 mt-1">Sessions</div>
            </div>
          </div>
          {showCountdown && (
            <div className="card relative overflow-hidden col-span-2 md:col-span-1">
              <div className={`absolute top-0 left-0 right-0 h-1 rounded-t-xl bg-gradient-to-r ${
                daysUntilTest! <= 7 ? 'from-red-400 to-red-600' : daysUntilTest! <= 30 ? 'from-amber-400 to-orange-500' : 'from-blue-400 to-blue-600'
              }`} />
              <div className="flex flex-col items-center pt-2">
                <div className={`text-3xl font-bold ${
                  daysUntilTest! <= 7 ? 'text-red-600' : daysUntilTest! <= 30 ? 'text-amber-600' : 'text-blue-600'
                }`}>{daysUntilTest}</div>
                <div className="text-sm font-medium text-gray-500 mt-1">Days Until Test</div>
                <div className="text-xs text-gray-400 mt-0.5">{new Date(profile!.targetTestDate!).toLocaleDateString()}</div>
              </div>
            </div>
          )}
        </div>
      )}

      {reviewCount > 0 && (
        <Link href="/review" className="block card !border-amber-200 !bg-amber-50/50 hover:!bg-amber-50 transition-colors group">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-amber-800">{reviewCount} item{reviewCount !== 1 ? 's' : ''} due for review</p>
                <p className="text-xs text-amber-600">Spaced repetition keeps knowledge fresh</p>
              </div>
            </div>
            <span className="text-sm font-medium text-amber-700 group-hover:text-amber-800 flex items-center gap-1">
              Review Now
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </span>
          </div>
        </Link>
      )}

      <div className="card">
        <div className="flex items-center justify-between mb-5">
          <h2 className="section-header">Skill Breakdown</h2>
          <Link href="/progress" className="text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors">
            View Progress
          </Link>
        </div>
        <div className="space-y-4">
          {skills.filter(s => s.level === 'skill').map((skill) => (
            <div key={skill.skillId} className="group">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2.5">
                  <span className="text-sm font-medium text-gray-700">{skill.skillName}</span>
                  <span className={`badge text-[11px] ${masteryColors[skill.masteryStatus] || 'bg-gray-50 text-gray-600'}`}>
                    {skill.masteryStatus}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  {trendIcons[skill.trend] || null}
                </div>
              </div>
              <div className="relative w-full bg-gray-100 rounded-full h-2 group/bar">
                <div
                  className="bg-gradient-to-r from-primary-400 to-primary-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(3, (skill.abilityEstimate + 2) * 25))}%` }}
                />
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover/bar:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                  Ability: {skill.abilityEstimate.toFixed(2)}
                </div>
              </div>
            </div>
          ))}
          {skills.filter(s => s.level === 'skill').length === 0 && (
            <p className="text-sm text-gray-400 text-center py-4">Complete the diagnostic test to see your skill breakdown.</p>
          )}
        </div>
      </div>

      {recommendations && recommendations.articles.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <h2 className="section-header">Recommended for You</h2>
              <span className="badge bg-amber-50 text-amber-700 border border-amber-200">
                {recommendations.articles.length} article{recommendations.articles.length !== 1 ? 's' : ''}
              </span>
            </div>
            <Link href="/knowledge-base" className="text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors">
              Browse All
            </Link>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            Based on your weak skills: {recommendations.weakSkills.map((s) => s.skillName).join(', ')}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {recommendations.articles.map((article) => (
              <Link
                key={article.id}
                href={`/knowledge-base?id=${article.id}`}
                className="rounded-lg border border-gray-100 p-4 hover:border-primary-200 hover:bg-primary-50/30 transition-colors group"
              >
                <span className={`badge text-[11px] mb-2 inline-block ${
                  article.type === 'strategy'
                    ? 'bg-violet-50 text-violet-700 border border-violet-200'
                    : article.type === 'guide'
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'bg-gray-50 text-gray-600 border border-gray-200'
                }`}>
                  {article.type}
                </span>
                <h3 className="text-sm font-medium text-gray-800 group-hover:text-primary-700 transition-colors">
                  {article.title}
                </h3>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="card">
        <div className="flex justify-between items-center mb-5">
          <div className="flex items-center gap-2.5">
            <h2 className="section-header">AI Study Tips</h2>
            <span className="badge bg-primary-50 text-primary-600 border border-primary-100">AI</span>
          </div>
          <button
            onClick={generateNewTip}
            disabled={tipsLoading}
            className="btn-secondary text-sm !py-2 !px-3.5 flex items-center gap-1.5"
          >
            {tipsLoading ? (
              <>
                <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Generating...
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
                Get New Tip
              </>
            )}
          </button>
        </div>
        {tips.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
              </svg>
            </div>
            <p className="text-sm text-gray-500">
              Click &quot;Get New Tip&quot; for personalized study advice based on your performance.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {tips.map((tip, idx) => (
              <div key={tip.id} className="rounded-lg border border-gray-100 p-4 bg-gray-50/50 hover:bg-gray-50 transition-colors animate-fade-in" style={{ animationDelay: `${idx * 100}ms` }}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="badge bg-primary-50 text-primary-700 border border-primary-100">
                    {tip.category.replace('_', ' ')}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(tip.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">{tip.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
