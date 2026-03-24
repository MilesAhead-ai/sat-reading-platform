'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import clsx from 'clsx';

interface DiagnosticLevel {
  level: number;
  name: string;
  unlockScore: number;
  status: 'locked' | 'available' | 'in_progress' | 'completed';
  sessionId: string | null;
  completedAt: string | null;
  currentScore: number;
}

const levelDescriptions: Record<number, string> = {
  1: 'Establish your baseline reading skills across all SAT domains.',
  2: 'Re-assess your abilities after initial practice and growth.',
  3: 'Test higher-order skills at increased difficulty.',
  4: 'Final calibration before the real SAT exam.',
};

const levelColors: Record<string, { gradient: string; bg: string; text: string; border: string }> = {
  locked: { gradient: 'from-gray-300 to-gray-400', bg: 'bg-gray-50', text: 'text-gray-400', border: 'border-gray-200' },
  available: { gradient: 'from-primary-400 to-primary-600', bg: 'bg-primary-50', text: 'text-primary-600', border: 'border-primary-200' },
  in_progress: { gradient: 'from-amber-400 to-orange-500', bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200' },
  completed: { gradient: 'from-emerald-400 to-emerald-600', bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200' },
};

export default function DiagnosticHubPage() {
  const router = useRouter();
  const [levels, setLevels] = useState<DiagnosticLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get<any>('/diagnostic/levels')
      .then((res) => {
        setLevels((res.data || res) as DiagnosticLevel[]);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load diagnostic levels.');
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-56 bg-gray-200 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-48 bg-white rounded-xl border border-gray-100" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto text-center py-16 animate-fade-in">
        <p className="text-red-600 mb-4">{error}</p>
        <button onClick={() => router.push('/dashboard')} className="btn-primary">
          Go to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <div className="mb-8">
        <h1 className="page-header">Diagnostic Tests</h1>
        <p className="text-sm text-gray-500 mt-1">
          Complete diagnostic tests to measure your progress. New levels unlock as your score improves.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {levels.map((lvl) => {
          const colors = levelColors[lvl.status];
          const isLocked = lvl.status === 'locked';
          const isCompleted = lvl.status === 'completed';
          const isInProgress = lvl.status === 'in_progress';

          return (
            <div
              key={lvl.level}
              className={clsx(
                'card relative overflow-hidden transition-all duration-200',
                isLocked ? 'opacity-60' : 'hover:shadow-md',
                colors.border,
                'border',
              )}
            >
              <div className={clsx('absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r rounded-t-xl', colors.gradient)} />

              <div className="flex items-start justify-between pt-3">
                <div className="flex items-center gap-3">
                  <div className={clsx(
                    'w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold',
                    colors.bg, colors.text,
                  )}>
                    {lvl.level}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{lvl.name}</h3>
                    {lvl.unlockScore > 0 && (
                      <span className="text-xs text-gray-400">Unlocks at {lvl.unlockScore}+</span>
                    )}
                  </div>
                </div>

                {isCompleted && (
                  <span className="badge bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <svg className="w-3 h-3 mr-1 inline" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    Completed
                  </span>
                )}
                {isInProgress && (
                  <span className="badge bg-amber-50 text-amber-700 border border-amber-200">
                    In Progress
                  </span>
                )}
                {isLocked && (
                  <span className="badge bg-gray-100 text-gray-500 border border-gray-200">
                    <svg className="w-3 h-3 mr-1 inline" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                    </svg>
                    Locked
                  </span>
                )}
              </div>

              <p className="text-sm text-gray-500 mt-3 leading-relaxed">
                {levelDescriptions[lvl.level]}
              </p>

              {isCompleted && lvl.completedAt && (
                <p className="text-xs text-gray-400 mt-2">
                  Completed on {new Date(lvl.completedAt).toLocaleDateString()}
                </p>
              )}

              {isLocked && (
                <div className="mt-4 p-3 rounded-lg bg-gray-50 border border-gray-100">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75z" />
                    </svg>
                    <span>
                      Your score: <strong>{lvl.currentScore || 'N/A'}</strong> / {lvl.unlockScore} needed
                    </span>
                  </div>
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
                    <div
                      className="bg-gray-400 h-1.5 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, lvl.currentScore > 0 ? (lvl.currentScore / lvl.unlockScore) * 100 : 0)}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="mt-4">
                {isCompleted && lvl.sessionId && (
                  <button
                    onClick={() => router.push(`/diagnostic/${lvl.level}/results`)}
                    className="btn-secondary w-full text-sm flex items-center justify-center gap-1.5"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    View Results
                  </button>
                )}
                {isInProgress && (
                  <button
                    onClick={() => router.push(`/diagnostic/${lvl.level}`)}
                    className="btn-primary w-full text-sm flex items-center justify-center gap-1.5"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
                    </svg>
                    Resume Test
                  </button>
                )}
                {lvl.status === 'available' && (
                  <button
                    onClick={() => router.push(`/diagnostic/${lvl.level}`)}
                    className="btn-primary w-full text-sm flex items-center justify-center gap-1.5"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
                    </svg>
                    Start Test
                  </button>
                )}
                {isLocked && (
                  <button
                    disabled
                    className="btn-secondary w-full text-sm opacity-50 cursor-not-allowed flex items-center justify-center gap-1.5"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                    </svg>
                    Locked
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
