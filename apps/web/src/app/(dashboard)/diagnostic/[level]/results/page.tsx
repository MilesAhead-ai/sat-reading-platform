'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { api } from '@/lib/api';

interface SkillEstimate {
  skillId: string;
  abilityEstimate: number;
  standardError: number;
  skill: { id: string; name: string; parentId: string | null };
}

interface DiagnosticResultsData {
  session: { id: string; level: number; completedAt: string };
  skillEstimates: SkillEstimate[];
  projectedScore: number;
  totalQuestions: number;
  correctCount: number;
  scoreNote?: string;
}

const levelNames: Record<number, string> = {
  1: 'Initial Assessment',
  2: 'Intermediate Check',
  3: 'Advanced Assessment',
  4: 'Pre-Test Assessment',
};

const abilityLabel = (val: number): { text: string; color: string } => {
  if (val >= 1.5) return { text: 'Excellent', color: 'text-green-600' };
  if (val >= 0.5) return { text: 'Good', color: 'text-emerald-600' };
  if (val >= -0.5) return { text: 'Developing', color: 'text-amber-600' };
  if (val >= -1.5) return { text: 'Emerging', color: 'text-orange-600' };
  return { text: 'Beginning', color: 'text-red-600' };
};

export default function DiagnosticResultsPage() {
  const router = useRouter();
  const params = useParams();
  const level = Number(params.level);

  const [results, setResults] = useState<DiagnosticResultsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isNaN(level) || level < 1 || level > 4) {
      router.push('/diagnostic');
      return;
    }

    // First get the levels to find the sessionId for this level
    api.get<any>('/diagnostic/levels')
      .then((res) => {
        const levels = (res.data || res) as any[];
        const lvl = levels.find((l: any) => l.level === level);
        if (!lvl || !lvl.sessionId || lvl.status !== 'completed') {
          setError('No completed diagnostic found for this level.');
          setLoading(false);
          return;
        }
        return api.get<any>(`/diagnostic/results/${lvl.sessionId}`);
      })
      .then((res) => {
        if (res) {
          setResults((res.data || res) as DiagnosticResultsData);
        }
      })
      .catch((err) => {
        setError(err.message || 'Failed to load results.');
      })
      .finally(() => setLoading(false));
  }, [level]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-200 border-t-primary-600"></div>
          <span className="text-sm text-gray-400">Loading results...</span>
        </div>
      </div>
    );
  }

  if (error || !results) {
    return (
      <div className="max-w-md mx-auto text-center py-16 animate-fade-in">
        <p className="text-red-600 mb-4">{error || 'Results not found.'}</p>
        <button onClick={() => router.push('/diagnostic')} className="btn-primary">
          Back to Diagnostics
        </button>
      </div>
    );
  }

  const accuracy = results.totalQuestions > 0
    ? Math.round((results.correctCount / results.totalQuestions) * 100)
    : 0;

  const domains = results.skillEstimates.filter(e => e.skill.parentId === null);
  const skills = results.skillEstimates.filter(e => e.skill.parentId !== null);

  return (
    <div className="max-w-3xl mx-auto py-8 animate-fade-in">
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="page-header">{levelNames[level]} Results</h1>
        <p className="text-gray-500 mt-1">
          Level {level} - Completed on {new Date(results.session.completedAt).toLocaleDateString()}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="card relative overflow-hidden text-center">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-400 to-primary-600 rounded-t-xl" />
          <div className="text-4xl font-bold text-primary-600 pt-2">{results.projectedScore}</div>
          <div className="text-sm text-gray-500 mt-1">Projected Score</div>
        </div>
        <div className="card relative overflow-hidden text-center">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-t-xl" />
          <div className="text-4xl font-bold text-emerald-600 pt-2">{accuracy}%</div>
          <div className="text-sm text-gray-500 mt-1">Accuracy</div>
        </div>
        <div className="card relative overflow-hidden text-center">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-400 to-purple-600 rounded-t-xl" />
          <div className="text-4xl font-bold text-violet-600 pt-2">
            {results.correctCount}/{results.totalQuestions}
          </div>
          <div className="text-sm text-gray-500 mt-1">Correct</div>
        </div>
      </div>

      {results.scoreNote && (
        <p className="text-xs text-gray-400 text-center -mt-4 mb-6">{results.scoreNote}</p>
      )}

      {domains.length > 0 && (
        <div className="card mb-6">
          <h2 className="section-header mb-5">Domain Breakdown</h2>
          <div className="space-y-4">
            {domains.map((est) => (
              <div key={est.skillId}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium text-gray-700">{est.skill.name}</span>
                  <span className={`text-xs font-medium ${abilityLabel(est.abilityEstimate).color}`}>{abilityLabel(est.abilityEstimate).text}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-primary-400 to-primary-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(3, (est.abilityEstimate + 2) * 25))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {skills.length > 0 && (
        <div className="card mb-6">
          <h2 className="section-header mb-5">Skill Breakdown</h2>
          <div className="space-y-4">
            {skills.map((est) => (
              <div key={est.skillId}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium text-gray-700">{est.skill.name}</span>
                  <span className={`text-xs font-medium ${abilityLabel(est.abilityEstimate).color}`}>{abilityLabel(est.abilityEstimate).text}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-primary-400 to-primary-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(3, (est.abilityEstimate + 2) * 25))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-3 justify-center">
        <button onClick={() => router.push('/diagnostic')} className="btn-primary flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
          </svg>
          Back to Diagnostics
        </button>
        <button onClick={() => router.push('/practice')} className="btn-secondary">
          Start Practicing
        </button>
      </div>
    </div>
  );
}
