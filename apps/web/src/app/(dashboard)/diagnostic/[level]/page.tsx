'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { api } from '@/lib/api';
import clsx from 'clsx';
import PassageText from '@/components/PassageText';

interface DiagnosticQuestion {
  id: string;
  stem: string;
  choices: { label: string; text: string }[];
  difficulty: number;
  passage?: { title: string; text: string } | null;
}

interface SkillEstimate {
  skillId: string;
  abilityEstimate: number;
  standardError: number;
  skill: { id: string; name: string; parentId: string | null };
}

interface DiagnosticResults {
  skillEstimates: SkillEstimate[];
  projectedScore: number;
  totalQuestions: number;
  correctCount: number;
}

const abilityLabel = (val: number): { text: string; color: string } => {
  if (val >= 1.5) return { text: 'Excellent', color: 'text-green-600' };
  if (val >= 0.5) return { text: 'Good', color: 'text-emerald-600' };
  if (val >= -0.5) return { text: 'Developing', color: 'text-amber-600' };
  if (val >= -1.5) return { text: 'Emerging', color: 'text-orange-600' };
  return { text: 'Beginning', color: 'text-red-600' };
};

export default function DiagnosticTestPage() {
  const router = useRouter();
  const params = useParams();
  const level = Number(params.level);

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [question, setQuestion] = useState<DiagnosticQuestion | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState({ current: 0, total: 15 });
  const [resumeBanner, setResumeBanner] = useState<string | null>(null);
  const [results, setResults] = useState<DiagnosticResults | null>(null);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const diagnosticStartTimeRef = useRef<number>(Date.now());
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (isNaN(level) || level < 1 || level > 4) {
      router.push('/diagnostic');
      return;
    }
    startDiagnostic();
  }, [level]);

  useEffect(() => {
    if (loading || error || results) return;
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - diagnosticStartTimeRef.current) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [loading, error, results]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const startDiagnostic = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post<any>('/diagnostic/start', { level });
      const data = res.data || res;
      setSessionId(data.session.id);
      setQuestion(data.question);
      const prog = data.progress ?? { current: 0, total: 15 };
      setProgress(prog);
      const serverElapsed = data.elapsedSeconds ?? 0;
      diagnosticStartTimeRef.current = Date.now() - serverElapsed * 1000;
      setElapsed(serverElapsed);
      setStartTime(Date.now());
      if (data.resumed && prog.current > 0) {
        setResumeBanner(`Resuming from question ${prog.current + 1} of ${prog.total}`);
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err.message || 'Failed to start diagnostic.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (selected === null || !sessionId || !question) return;
    setSubmitting(true);
    const timeSpent = Math.round((Date.now() - startTime) / 1000);
    try {
      const res = await api.post<any>('/diagnostic/respond', {
        sessionId,
        questionId: question.id,
        chosenAnswer: selected,
        timeSpentSeconds: timeSpent,
      });
      const data = res.data || res;

      if (data.isComplete) {
        setResults(data.results);
        setQuestion(null);
      } else {
        setQuestion(data.nextQuestion);
        setProgress(data.progress);
        setSelected(null);
        setStartTime(Date.now());
      }
    } catch (err: any) {
      setError(err.message || 'Failed to submit answer.');
    } finally {
      setSubmitting(false);
    }
  };

  const levelNames: Record<number, string> = {
    1: 'Initial Assessment',
    2: 'Intermediate Check',
    3: 'Advanced Assessment',
    4: 'Pre-Test Assessment',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-200 border-t-primary-600"></div>
          <span className="text-sm text-gray-400">Starting {levelNames[level] || 'diagnostic test'}...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto text-center py-16 animate-fade-in">
        <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
        </div>
        <h1 className="page-header mb-2">{levelNames[level] || 'Diagnostic Test'}</h1>
        <p className="text-red-600 mb-6">{error}</p>
        <button onClick={() => router.push('/diagnostic')} className="btn-primary">
          Back to Diagnostics
        </button>
      </div>
    );
  }

  if (results) {
    const accuracy = results.totalQuestions > 0
      ? Math.round((results.correctCount / results.totalQuestions) * 100)
      : 0;

    const domains = results.skillEstimates.filter(e => e.skill.parentId === null);
    const skills = results.skillEstimates.filter(e => e.skill.parentId !== null);

    return (
      <div className="max-w-3xl mx-auto py-8 animate-fade-in">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-primary-50 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-primary-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="page-header">{levelNames[level]} Results</h1>
          <p className="text-gray-500 mt-1">Level {level} diagnostic complete</p>
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
          <button onClick={() => router.push('/practice')} className="btn-secondary flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
            </svg>
            Start Practicing
          </button>
        </div>
      </div>
    );
  }

  if (!question) return null;

  const progressPercent = ((progress.current + 1) / progress.total) * 100;

  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">{levelNames[level] || 'Diagnostic Test'}</h1>
          <p className="text-sm text-gray-400 mt-0.5">Level {level} - Assessing your reading skills</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-400 font-mono tabular-nums">{formatTime(elapsed)}</span>
          <span className="text-sm font-medium text-gray-500">
            {progress.current + 1} of {progress.total}
          </span>
          <div className="w-32 bg-gray-100 rounded-full h-1.5">
            <div
              className="bg-primary-500 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {resumeBanner && (
        <div className="mb-4 flex items-center gap-2.5 bg-amber-50 border border-amber-200 text-amber-800 px-4 py-2.5 rounded-lg text-sm animate-fade-in">
          <svg className="w-4 h-4 text-amber-500 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
          </svg>
          <span>{resumeBanner}</span>
          <button onClick={() => setResumeBanner(null)} className="ml-auto text-amber-400 hover:text-amber-600 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {question.passage && (
          <div className="card max-h-[70vh] overflow-y-auto scrollbar-thin lg:sticky lg:top-4">
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
              <h2 className="font-semibold text-gray-900">{question.passage.title}</h2>
            </div>
            <PassageText text={question.passage.text} />
          </div>
        )}

        <div className={clsx('space-y-4', !question.passage && 'lg:col-span-2 max-w-2xl mx-auto w-full')}>
          <div className="card">
            <p className="font-medium text-gray-900 mb-5 leading-relaxed">{question.stem}</p>
            <div className="space-y-2.5">
              {question.choices.map((choice, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelected(idx)}
                  className={clsx(
                    'w-full text-left p-3.5 rounded-lg border-2 transition-all duration-150 text-sm leading-relaxed',
                    selected === idx
                      ? 'border-primary-400 bg-primary-50 shadow-sm'
                      : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                  )}
                >
                  <span className={clsx(
                    'inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold mr-3',
                    selected === idx
                      ? 'bg-primary-200 text-primary-800'
                      : 'bg-gray-100 text-gray-500'
                  )}>
                    {choice.label}
                  </span>
                  {choice.text}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleSubmit}
              className="btn-primary flex items-center gap-1.5"
              disabled={selected === null || submitting}
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Submitting...
                </span>
              ) : (
                <>
                  {progress.current + 1 < progress.total ? 'Next' : 'Finish'}
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
