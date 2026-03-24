'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import clsx from 'clsx';

interface ExerciseItem {
  id: string;
  shortId: string;
  title: string;
  type: string;
  difficulty: number;
  estimatedMinutes: number;
  isAiGenerated: boolean;
  passageType: string | null;
  attempts: { completedAt: string; score: number | null }[];
}

type FilterTab = 'all' | 'literature' | 'history' | 'science' | 'social_science';

const filterTabs: { key: FilterTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'literature', label: 'Literature' },
  { key: 'history', label: 'History' },
  { key: 'science', label: 'Science' },
  { key: 'social_science', label: 'Social Science' },
];

const typeColors: Record<string, string> = {
  practice: 'bg-primary-50 text-primary-700 border-primary-200',
  diagnostic: 'bg-amber-50 text-amber-700 border-amber-200',
  review: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

export default function PracticePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [exercises, setExercises] = useState<ExerciseItem[]>([]);
  const [exercisesLoading, setExercisesLoading] = useState(true);
  const [filter, setFilter] = useState<FilterTab>('all');

  useEffect(() => {
    api.get<ExerciseItem[]>('/practice/exercises')
      .then((res) => setExercises((res as any).data || res))
      .catch(console.error)
      .finally(() => setExercisesLoading(false));
  }, []);

  const startPractice = async () => {
    setLoading(true);
    setError('');
    try {
      const exercise = await api.get<any>('/practice/next');
      const ex = exercise.data || exercise;
      router.push(`/practice/${ex.shortId}`);
    } catch (err: any) {
      setError(err.message || 'No exercises available');
      setLoading(false);
    }
  };

  const generateAndStart = async () => {
    setGenerating(true);
    setError('');
    try {
      const result = await api.post<any>('/content/generate-exercise');
      const data = result.data || result;
      router.push(`/practice/${data.exercise.shortId}`);
    } catch (err: any) {
      setError(err.message || 'Failed to generate exercise');
      setGenerating(false);
    }
  };

  const filtered = filter === 'all'
    ? exercises
    : exercises.filter((e) => e.passageType === filter);

  const bestScore = (attempts: ExerciseItem['attempts']) => {
    if (attempts.length === 0) return null;
    const scores = attempts.map((a) => a.score).filter((s): s is number => s !== null);
    return scores.length > 0 ? Math.max(...scores) : null;
  };

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      <div className="text-center mb-10">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center mx-auto mb-5 shadow-lg">
          <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
          </svg>
        </div>
        <h1 className="page-header">Practice</h1>
        <p className="text-gray-500 mt-2 max-w-sm mx-auto leading-relaxed">
          The system selects exercises targeting your weakest skills at the right difficulty level.
        </p>
      </div>

      {error && (
        error.toLowerCase().includes('no exercises') || error.toLowerCase().includes('not found') ? (
          <div className="bg-primary-50 border border-primary-100 text-primary-800 p-5 rounded-xl mb-6 text-sm">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-primary-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
                </svg>
              </div>
              <div>
                <p className="font-medium mb-1">No exercises available yet</p>
                <p className="text-primary-600 leading-relaxed">
                  Take the <a href="/diagnostic" className="font-semibold underline underline-offset-2 hover:text-primary-800">Diagnostic Test</a> first to calibrate your skill level, or generate an AI exercise below.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-danger-50 border border-danger-100 text-danger-700 p-3.5 rounded-lg mb-6 text-sm flex items-start gap-2">
            <svg className="w-5 h-5 text-danger-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            {error}
          </div>
        )
      )}

      <div className="space-y-4 mb-10">
        <button
          onClick={startPractice}
          className="w-full card-hover !p-5 flex items-center gap-4 text-left group"
          disabled={loading || generating}
        >
          <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center shrink-0 group-hover:bg-primary-100 transition-colors">
            <svg className="w-6 h-6 text-primary-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-gray-900">
              {loading ? 'Finding exercise...' : 'Start Next Exercise'}
            </div>
            <div className="text-sm text-gray-500 mt-0.5">Continue with an adaptive exercise from the question bank</div>
          </div>
          <svg className="w-5 h-5 text-gray-300 group-hover:text-gray-400 transition-colors shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </button>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">or</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        <button
          onClick={generateAndStart}
          className="w-full card-hover !p-5 flex items-center gap-4 text-left group"
          disabled={loading || generating}
        >
          <div className="w-12 h-12 rounded-xl bg-violet-50 flex items-center justify-center shrink-0 group-hover:bg-violet-100 transition-colors">
            {generating ? (
              <svg className="animate-spin h-6 w-6 text-violet-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg className="w-6 h-6 text-violet-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-gray-900 flex items-center gap-2">
              {generating ? 'Generating new exercise...' : 'Generate AI Exercise'}
              <span className="badge bg-violet-50 text-violet-600 border border-violet-200 text-[10px]">AI</span>
            </div>
            <div className="text-sm text-gray-500 mt-0.5">Create a brand-new passage and questions tailored to your weak areas</div>
          </div>
          <svg className="w-5 h-5 text-gray-300 group-hover:text-gray-400 transition-colors shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </button>
      </div>

      {/* Practice types guide */}
      <div className="card mb-6">
        <h2 className="section-header mb-3">Practice Types</h2>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="rounded-lg border border-primary-100 bg-primary-50/50 p-3">
            <span className="font-semibold text-primary-700">Practice</span>
            <p className="text-gray-600 mt-1">Adaptive exercises targeting your weak skills. The system picks the right difficulty.</p>
          </div>
          <div className="rounded-lg border border-amber-100 bg-amber-50/50 p-3">
            <span className="font-semibold text-amber-700">Diagnostic</span>
            <p className="text-gray-600 mt-1">Placement test that measures your starting level across all skills.</p>
          </div>
          <div className="rounded-lg border border-violet-100 bg-violet-50/50 p-3">
            <span className="font-semibold text-violet-700">Drill</span>
            <p className="text-gray-600 mt-1">Focused repetition on a single skill to build speed and accuracy.</p>
          </div>
          <div className="rounded-lg border border-emerald-100 bg-emerald-50/50 p-3">
            <span className="font-semibold text-emerald-700">Review</span>
            <p className="text-gray-600 mt-1">Revisit questions you got wrong using spaced repetition for long-term retention.</p>
          </div>
        </div>
      </div>

      {/* Exercise list */}
      <div className="card">
        <h2 className="section-header mb-4">All Exercises</h2>

        <div className="flex gap-2 mb-5 flex-wrap">
          {filterTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={clsx(
                'px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                filter === tab.key
                  ? 'bg-primary-50 text-primary-700 border-primary-200'
                  : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {exercisesLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-50 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">No exercises found.</p>
        ) : (
          <div className="space-y-2">
            {filtered.map((ex) => {
              const best = bestScore(ex.attempts);
              const completed = ex.attempts.length > 0;
              return (
                <Link
                  key={ex.id}
                  href={`/practice/${ex.shortId}`}
                  className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:border-gray-200 hover:bg-gray-50/50 transition-colors group"
                >
                  {completed ? (
                    <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                      <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center shrink-0">
                      <svg className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
                      </svg>
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-800 truncate">{ex.title}</span>
                      {ex.isAiGenerated && (
                        <span className="badge bg-violet-50 text-violet-600 border border-violet-200 text-[10px]">AI</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className={clsx('badge text-[10px]', typeColors[ex.type] || 'bg-gray-50 text-gray-600 border-gray-200')}>
                        {ex.type}
                      </span>
                      <span className="text-xs text-gray-400">
                        {'●'.repeat(ex.difficulty)}{'○'.repeat(5 - ex.difficulty)}
                      </span>
                      <span className="text-xs text-gray-400">{ex.estimatedMinutes}m</span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    {completed ? (
                      <div>
                        <div className="text-sm font-semibold text-emerald-600">{Math.round(best!)}%</div>
                        <div className="text-[10px] text-gray-400">{ex.attempts.length} attempt{ex.attempts.length !== 1 ? 's' : ''}</div>
                      </div>
                    ) : (
                      <span className="text-xs font-medium text-primary-600 group-hover:text-primary-700">Start</span>
                    )}
                  </div>

                  <svg className="w-4 h-4 text-gray-300 group-hover:text-gray-400 transition-colors shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
