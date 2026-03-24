'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import clsx from 'clsx';
import PassageText from '@/components/PassageText';

interface Question {
  id: string;
  stem: string;
  choices: { label: string; text: string }[];
  correctAnswer: number;
  explanation: string | null;
  hint: string | null;
}

interface PassageObj {
  id?: string;
  title: string;
  text: string;
  type?: string;
}

interface PassageGroup {
  passage: PassageObj | null;
  questions: { id: string; stem: string; choices: { label: string; text: string }[] }[];
}

interface ExerciseData {
  exercise: { id: string; title: string; skillsFocus?: string[] };
  passage: PassageObj | null;
  passages?: PassageObj[];
  passageGroups?: PassageGroup[];
  questions: Question[];
  targetedSkills?: { id: string; name: string }[];
}

interface FeedbackObj {
  isCorrect: boolean;
  correctAnswer: number;
  explanation: string | null;
  hint?: string;
}

export default function ExercisePage() {
  const { exerciseId } = useParams<{ exerciseId: string }>();
  const router = useRouter();
  const [data, setData] = useState<ExerciseData | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentQ, setCurrentQ] = useState(0);

  // Per-question state maps
  const [answers, setAnswers] = useState<Map<string, number>>(new Map());
  const [feedbacks, setFeedbacks] = useState<Map<string, FeedbackObj>>(new Map());
  const [hintsShown, setHintsShown] = useState<Set<string>>(new Set());
  const [flagged, setFlagged] = useState<Set<string>>(new Set());

  // Timing
  const questionStartRef = useRef<number>(Date.now());
  const [questionTimeSpent, setQuestionTimeSpent] = useState<Map<string, number>>(new Map());
  const [exerciseStartTime] = useState<number>(Date.now());
  const [elapsed, setElapsed] = useState(0);

  // UI state
  const [results, setResults] = useState<{
    score: number;
    totalQuestions: number;
    correctCount: number;
    totalTimeSeconds?: number;
    skillProgress?: {
      skillId: string; skillName: string; before: number; after: number;
      delta: number; masteryBefore: string; masteryAfter: string;
    }[];
    questionResults?: {
      questionId: string; stem: string; isCorrect: boolean;
      chosenAnswer: number; correctAnswer: number;
      skills: { id: string; name: string }[];
      errorPattern?: string | null; errorReasoning?: string;
      unanswered?: boolean;
    }[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [savedToReview, setSavedToReview] = useState<Set<string>>(new Set());
  const [savingToReview, setSavingToReview] = useState(false);
  const [navWarning, setNavWarning] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      try {
        const exerciseData = await api.get<any>(`/practice/exercises/${exerciseId}`);
        if (ignore) return;
        setData(exerciseData.data || exerciseData);
        const session = await api.post<any>(`/practice/exercises/${exerciseId}/start`);
        if (ignore) return;
        setSessionId((session.data || session).id);
      } catch (err: any) {
        console.error('Exercise load error:', err);
        if (!ignore) setError(err.message || 'Failed to load exercise');
      } finally {
        if (!ignore) {
          setLoading(false);
          questionStartRef.current = Date.now();
        }
      }
    };
    load();
    return () => { ignore = true; };
  }, [exerciseId]);

  useEffect(() => {
    if (loading || results) return;
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - exerciseStartTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [loading, results, exerciseStartTime]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Accumulate time for current question before switching
  const accumulateTime = useCallback(() => {
    if (!data) return;
    const qId = data.questions[currentQ]?.id;
    if (!qId) return;
    const spent = Math.round((Date.now() - questionStartRef.current) / 1000);
    setQuestionTimeSpent((prev) => {
      const next = new Map(prev);
      next.set(qId, (next.get(qId) ?? 0) + spent);
      return next;
    });
  }, [data, currentQ]);

  const navigateTo = useCallback((idx: number) => {
    if (idx === currentQ) return;
    if (data) {
      const qId = data.questions[currentQ]?.id;
      if (qId && answers.has(qId) && !feedbacks.has(qId)) {
        setNavWarning("You haven't submitted your answer");
        setTimeout(() => setNavWarning(null), 3000);
      }
    }
    accumulateTime();
    setCurrentQ(idx);
    questionStartRef.current = Date.now();
  }, [currentQ, accumulateTime, data, answers, feedbacks]);

  const toggleFlag = useCallback((qId: string) => {
    setFlagged((prev) => {
      const next = new Set(prev);
      if (next.has(qId)) next.delete(qId);
      else next.add(qId);
      return next;
    });
  }, []);

  const handleSaveToReview = async (questionId: string) => {
    setSavingToReview(true);
    try {
      await api.post('/review-queue/add', { questionId });
      setSavedToReview((prev) => new Set(prev).add(questionId));
    } catch (err) {
      console.error('Failed to save to review:', err);
    } finally {
      setSavingToReview(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-200 border-t-primary-600"></div>
          <span className="text-sm text-gray-400">Loading exercise...</span>
        </div>
      </div>
    );
  }

  if (!data || !sessionId) {
    return (
      <div className="max-w-md mx-auto text-center py-16">
        <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
        </div>
        <p className="text-lg font-semibold text-gray-900 mb-1">{error || 'Exercise not found'}</p>
        <p className="text-sm text-gray-500 mb-4">Something went wrong loading this exercise.</p>
        <button onClick={() => window.location.reload()} className="btn-primary">
          Try Again
        </button>
      </div>
    );
  }

  // ── Results Screen ──
  if (results) {
    const masteryLabel = (status: string) => {
      const labels: Record<string, string> = { novice: 'Novice', developing: 'Developing', proficient: 'Proficient', mastered: 'Mastered' };
      return labels[status] || status;
    };
    const masteryBadgeClass = (status: string) => {
      const colors: Record<string, string> = {
        novice: 'bg-red-50 text-red-700 border-red-200',
        developing: 'bg-amber-50 text-amber-700 border-amber-200',
        proficient: 'bg-blue-50 text-blue-700 border-blue-200',
        mastered: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      };
      return colors[status] || 'bg-gray-50 text-gray-600 border-gray-200';
    };
    const scoreColor = results.score >= 80 ? 'text-emerald-600' : results.score >= 50 ? 'text-amber-600' : 'text-red-600';

    return (
      <div className="max-w-2xl mx-auto py-12 animate-fade-in">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-primary-50 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-primary-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="page-header">Exercise Complete!</h1>
          <p className="text-gray-500 mt-2">
            {results.score >= 90 ? 'Outstanding! You\'re mastering this material.' :
             results.score >= 70 ? 'Great work! You\'re making solid progress.' :
             results.score >= 50 ? 'Good effort! Keep practicing to improve.' :
             'Every question is a learning opportunity. Keep going!'}
          </p>
        </div>

        <div className="card text-center mb-6">
          <div className={clsx('text-5xl font-bold mb-1', scoreColor)}>{Math.round(results.score)}%</div>
          <p className="text-gray-500">{results.correctCount} of {results.totalQuestions} correct</p>
          {results.totalTimeSeconds != null && results.totalTimeSeconds > 0 && (
            <p className="text-sm text-gray-400 mt-2 flex items-center justify-center gap-1.5">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {formatTime(results.totalTimeSeconds)}
            </p>
          )}
        </div>

        {results.skillProgress && results.skillProgress.length > 0 && (
          <div className="card mb-6">
            <h2 className="section-header mb-4">Skill Progress</h2>
            <div className="space-y-4">
              {results.skillProgress.map((sp) => {
                const improved = sp.delta > 0;
                const declined = sp.delta < 0;
                const leveledUp = sp.masteryBefore !== sp.masteryAfter;
                return (
                  <div key={sp.skillId} className="rounded-lg border border-gray-100 p-4 bg-gray-50/50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">{sp.skillName}</span>
                      <span className={clsx('text-sm font-semibold flex items-center gap-1', improved ? 'text-emerald-600' : declined ? 'text-red-500' : 'text-gray-400')}>
                        {improved && <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" /></svg>}
                        {declined && <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>}
                        {improved ? '+' : ''}{sp.delta.toFixed(3)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                      <div
                        className={clsx('h-2 rounded-full transition-all duration-700', improved ? 'bg-gradient-to-r from-emerald-400 to-emerald-600' : declined ? 'bg-gradient-to-r from-red-300 to-red-500' : 'bg-gradient-to-r from-primary-400 to-primary-600')}
                        style={{ width: `${Math.min(100, Math.max(5, ((sp.after + 2) / 4) * 100))}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={`badge border ${masteryBadgeClass(sp.masteryBefore)}`}>{masteryLabel(sp.masteryBefore)}</span>
                      {leveledUp ? (
                        <span className={`badge border ${masteryBadgeClass(sp.masteryAfter)} font-semibold flex items-center gap-1`}>
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
                          {masteryLabel(sp.masteryAfter)}
                        </span>
                      ) : (
                        <span className={`badge border ${masteryBadgeClass(sp.masteryAfter)}`}>{masteryLabel(sp.masteryAfter)}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {results.questionResults && results.questionResults.length > 0 && (
          <div className="card mb-6">
            <h2 className="section-header mb-4">Question Details</h2>
            <div className="space-y-3">
              {results.questionResults.map((qr, idx) => (
                <div key={qr.questionId} className="flex items-start gap-3 rounded-lg border border-gray-100 p-3.5 bg-gray-50/50">
                  <div className={clsx('w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5', qr.isCorrect ? 'bg-emerald-100 text-emerald-600' : qr.unanswered ? 'bg-gray-200 text-gray-500' : 'bg-red-100 text-red-600')}>
                    {qr.isCorrect ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                    ) : qr.unanswered ? (
                      <span className="text-xs font-bold">—</span>
                    ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700 leading-relaxed line-clamp-2">
                      <span className="font-medium text-gray-500 mr-1.5">Q{idx + 1}.</span>{qr.stem}
                    </p>
                    {qr.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {qr.skills.map((s) => <span key={s.id} className="badge bg-gray-100 text-gray-600 text-[10px]">{s.name}</span>)}
                      </div>
                    )}
                    {qr.unanswered && (
                      <span className="badge bg-gray-200 text-gray-600 text-[10px] font-semibold mt-1.5 inline-block">Unanswered</span>
                    )}
                    {qr.errorPattern && (
                      <div className="mt-2">
                        <span className={clsx('badge text-[10px] font-semibold', {
                          'bg-purple-100 text-purple-700': qr.errorPattern === 'over_inference',
                          'bg-orange-100 text-orange-700': qr.errorPattern === 'polarity_trap',
                          'bg-blue-100 text-blue-700': qr.errorPattern === 'evidence_mismatch',
                          'bg-red-100 text-red-700': qr.errorPattern === 'scope_error',
                        })}>
                          {qr.errorPattern === 'over_inference' && 'Over-Inference'}
                          {qr.errorPattern === 'polarity_trap' && 'Polarity Trap'}
                          {qr.errorPattern === 'evidence_mismatch' && 'Evidence Mismatch'}
                          {qr.errorPattern === 'scope_error' && 'Scope Error'}
                        </span>
                        {qr.errorReasoning && <p className="text-xs text-gray-500 mt-1 leading-relaxed">{qr.errorReasoning}</p>}
                      </div>
                    )}
                  </div>
                  {qr.isCorrect ? (
                    <button onClick={() => handleSaveToReview(qr.questionId)} disabled={savingToReview || savedToReview.has(qr.questionId)}
                      className="shrink-0 p-1.5 rounded-md transition-colors hover:bg-emerald-100" title={savedToReview.has(qr.questionId) ? 'Saved to Review' : 'Save to Review'}>
                      {savedToReview.has(qr.questionId) ? (
                        <svg className="w-4.5 h-4.5 text-emerald-600" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M6.32 2.577a49.255 49.255 0 0111.36 0c1.497.174 2.57 1.46 2.57 2.93V21a.75.75 0 01-1.085.67L12 18.089l-7.165 3.583A.75.75 0 013.75 21V5.507c0-1.47 1.073-2.756 2.57-2.93z" clipRule="evenodd" /></svg>
                      ) : (
                        <svg className="w-4.5 h-4.5 text-gray-400 hover:text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" /></svg>
                      )}
                    </button>
                  ) : (
                    <span className="shrink-0 text-[10px] text-gray-400 font-medium px-1.5">In Review</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {(() => {
          const weakest = results.skillProgress && results.skillProgress.length > 0
            ? [...results.skillProgress].sort((a: any, b: any) => a.after - b.after)[0]
            : null;
          const hasWrongAnswers = results.questionResults?.some((qr) => !qr.isCorrect && !qr.unanswered);
          if (!weakest && !hasWrongAnswers) return null;
          return (
            <div className="card mb-6 bg-primary-50/30 border-primary-100">
              <h2 className="text-sm font-semibold text-primary-800 mb-2">Next Steps</h2>
              <ul className="space-y-1.5 text-sm text-gray-600">
                {weakest && (
                  <li className="flex items-start gap-2">
                    <span className="text-primary-500 mt-0.5">&#8226;</span>
                    Focus on <span className="font-medium text-gray-800">{weakest.skillName}</span> in your next session
                  </li>
                )}
                {hasWrongAnswers && (
                  <li className="flex items-start gap-2">
                    <span className="text-primary-500 mt-0.5">&#8226;</span>
                    Wrong answers have been added to your <button onClick={() => router.push('/review')} className="text-primary-600 hover:text-primary-700 font-medium underline underline-offset-2">Review Queue</button>
                  </li>
                )}
              </ul>
            </div>
          );
        })()}

        <div className="flex gap-3 justify-center">
          <button onClick={() => router.push('/practice')} className="btn-primary flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" /></svg>
            Next Exercise
          </button>
          <button onClick={() => router.push('/dashboard')} className="btn-secondary">Dashboard</button>
        </div>
      </div>
    );
  }

  // ── Active Question Screen ──
  const question = data.questions[currentQ];
  if (!question) return null;

  // Digital SAT: show the passage for the current question
  // Use passageGroups (1:1 question:passage) if available, else fall back to legacy
  const currentPassage: PassageObj | null = (() => {
    if (data.passageGroups && data.passageGroups.length > 0) {
      // Find the passageGroup that contains this question
      const group = data.passageGroups.find((pg) =>
        pg.questions.some((q) => q.id === question.id),
      );
      return group?.passage ?? null;
    }
    // Legacy: single passage or passages array
    if (data.passages && data.passages.length > 0) return data.passages[0];
    return data.passage;
  })();
  const allPassages: PassageObj[] = currentPassage ? [currentPassage] : [];

  const currentAnswer = answers.get(question.id) ?? null;
  const currentFeedback = feedbacks.get(question.id) ?? null;
  const currentHintShown = hintsShown.has(question.id);

  const handleSelect = (idx: number) => {
    if (currentFeedback) return;
    setAnswers((prev) => new Map(prev).set(question.id, idx));
  };

  const handleSubmit = async () => {
    if (currentAnswer === null) return;
    setSubmitting(true);
    accumulateTime();
    const timeSpent = (questionTimeSpent.get(question.id) ?? 0) + Math.round((Date.now() - questionStartRef.current) / 1000);
    questionStartRef.current = Date.now();
    try {
      const res = await api.post<any>(`/practice/sessions/${sessionId}/respond`, {
        questionId: question.id,
        chosenAnswer: currentAnswer,
        timeSpentSeconds: timeSpent,
        hintsUsed: currentHintShown ? 1 : 0,
      });
      const fb = res.data || res;
      setFeedbacks((prev) => new Map(prev).set(question.id, fb));
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleComplete = async () => {
    setCompleting(true);
    accumulateTime();
    try {
      const res = await api.post<any>(`/practice/sessions/${sessionId}/complete`);
      setResults(res.data || res);
    } catch (err) {
      console.error(err);
    } finally {
      setCompleting(false);
      setShowReviewModal(false);
    }
  };

  // Question status helpers
  const getQStatus = (q: Question) => {
    const fb = feedbacks.get(q.id);
    if (fb) return fb.isCorrect ? 'correct' : 'incorrect';
    if (answers.has(q.id)) return 'answered';
    return 'unanswered';
  };

  const answeredCount = data.questions.filter((q) => feedbacks.has(q.id) || answers.has(q.id)).length;
  const submittedCount = data.questions.filter((q) => feedbacks.has(q.id)).length;
  const flaggedCount = data.questions.filter((q) => flagged.has(q.id)).length;
  const unansweredCount = data.questions.length - submittedCount;

  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
      {/* Header bar */}
      <div className="flex justify-between items-center mb-3">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">{data.exercise.title}</h1>
          {data.targetedSkills && data.targetedSkills.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {data.targetedSkills.map((skill) => (
                <span key={skill.id} className="badge bg-blue-50 text-blue-700 border border-blue-200 text-[11px]">{skill.name}</span>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400 font-mono tabular-nums">{formatTime(elapsed)}</span>
          <span className="text-sm font-medium text-gray-500">{currentQ + 1}/{data.questions.length}</span>
        </div>
      </div>

      {/* Question Navigation Bar */}
      <div className="mb-5 overflow-x-auto">
        <div className="flex items-center gap-1.5 pb-1">
          {data.questions.map((q, idx) => {
            const status = getQStatus(q);
            const isCurrent = idx === currentQ;
            const isFlagged = flagged.has(q.id);
            return (
              <button
                key={q.id}
                onClick={() => navigateTo(idx)}
                className={clsx(
                  'relative w-10 h-10 sm:w-8 sm:h-8 rounded-lg text-xs font-semibold transition-all duration-150 shrink-0',
                  isCurrent && 'ring-2 ring-primary-500 ring-offset-1',
                  status === 'correct' && 'bg-emerald-100 text-emerald-700',
                  status === 'incorrect' && 'bg-red-100 text-red-700',
                  status === 'answered' && 'bg-amber-100 text-amber-700',
                  status === 'unanswered' && 'bg-gray-100 text-gray-500',
                  !isCurrent && 'hover:opacity-80',
                )}
              >
                {idx + 1}
                {isFlagged && (
                  <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-orange-400 rounded-full border border-white" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {navWarning && (
        <div className="mb-4 px-4 py-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-sm font-medium flex items-center gap-2 animate-fade-in">
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          {navWarning}
        </div>
      )}

      <div className={clsx('grid gap-6', allPassages.length > 0 ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1 max-w-2xl mx-auto')}>
        {allPassages.length > 0 && (
          <div className="card max-h-[70vh] overflow-y-auto scrollbar-thin lg:sticky lg:top-4">
            {allPassages.map((p, i) => (
              <div key={i} className={i > 0 ? 'mt-6 pt-6 border-t border-gray-200' : ''}>
                <div className="flex items-center gap-2 mb-4">
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                  <h2 className="font-semibold text-gray-900">{p.title}</h2>
                </div>
                <PassageText text={p.text} />
              </div>
            ))}
          </div>
        )}

        <div className="space-y-4">
          <div className="card">
            <div className="flex items-start justify-between mb-5">
              <p className="font-medium text-gray-900 leading-relaxed flex-1">{question.stem}</p>
              <button
                onClick={() => toggleFlag(question.id)}
                className={clsx('shrink-0 ml-3 p-1.5 rounded-md transition-colors', flagged.has(question.id) ? 'text-orange-500 bg-orange-50' : 'text-gray-300 hover:text-orange-400 hover:bg-orange-50')}
                title={flagged.has(question.id) ? 'Remove flag' : 'Flag for review'}
              >
                {flagged.has(question.id) ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M3 2.25a.75.75 0 01.75.75v.54l1.838-.46a9.75 9.75 0 016.725.738l.108.054a8.25 8.25 0 005.58.652l3.109-.732a.75.75 0 01.917.81 47.784 47.784 0 00.005 10.337.75.75 0 01-.574.812l-3.114.733a9.75 9.75 0 01-6.594-.77l-.108-.054a8.25 8.25 0 00-5.69-.625l-1.202.3V21a.75.75 0 01-1.5 0V3A.75.75 0 013 2.25z" clipRule="evenodd" /></svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0l2.77-.693a9 9 0 016.208.682l.108.054a9 9 0 006.086.71l3.114-.732a48.524 48.524 0 01-.005-10.499l-3.114.732a9 9 0 01-6.085-.711l-.108-.054a9 9 0 00-6.208-.682L3 4.5M3 15V4.5" /></svg>
                )}
              </button>
            </div>
            <div className="space-y-2.5">
              {question.choices.map((choice, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelect(idx)}
                  disabled={!!currentFeedback}
                  className={clsx(
                    'w-full text-left p-3.5 rounded-lg border-2 transition-all duration-150 text-sm leading-relaxed',
                    currentFeedback
                      ? idx === question.correctAnswer
                        ? 'border-emerald-400 bg-emerald-50'
                        : idx === currentAnswer && !currentFeedback.isCorrect
                          ? 'border-red-400 bg-red-50'
                          : 'border-gray-100 bg-gray-50/50 opacity-60'
                      : currentAnswer === idx
                        ? 'border-primary-400 bg-primary-50 shadow-sm'
                        : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                  )}
                >
                  <span className={clsx(
                    'inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold mr-3',
                    currentFeedback
                      ? idx === question.correctAnswer
                        ? 'bg-emerald-200 text-emerald-800'
                        : idx === currentAnswer && !currentFeedback.isCorrect
                          ? 'bg-red-200 text-red-800'
                          : 'bg-gray-100 text-gray-500'
                      : currentAnswer === idx
                        ? 'bg-primary-200 text-primary-800'
                        : 'bg-gray-100 text-gray-500'
                  )}>
                    {choice.label}
                  </span>
                  {choice.text}
                </button>
              ))}
            </div>

            {!currentFeedback && question.hint && (
              <div className="mt-3">
                {!currentHintShown ? (
                  <button
                    onClick={() => setHintsShown((prev) => new Set(prev).add(question.id))}
                    className="text-sm text-amber-600 hover:text-amber-700 font-medium flex items-center gap-1.5 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
                    </svg>
                    Get Hint
                  </button>
                ) : (
                  <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 animate-fade-in">
                    <div className="flex items-start gap-2">
                      <svg className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
                      </svg>
                      <p className="text-sm text-amber-800 leading-relaxed">{question.hint}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {currentFeedback && (
            <div className={clsx('card animate-slide-up', currentFeedback.isCorrect ? '!border-emerald-200 !bg-emerald-50' : '!border-red-200 !bg-red-50')}>
              <div className="flex items-center gap-2 mb-2">
                {currentFeedback.isCorrect ? (
                  <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                ) : (
                  <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                )}
                <p className="font-semibold">{currentFeedback.isCorrect ? 'Correct!' : 'Incorrect'}</p>
              </div>
              {currentFeedback.explanation && <p className="text-sm text-gray-700 leading-relaxed">{currentFeedback.explanation}</p>}
              {!currentFeedback.isCorrect && currentFeedback.hint && (
                <p className="text-sm text-gray-600 mt-2 italic flex items-start gap-1.5">
                  <svg className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" /></svg>
                  {currentFeedback.hint}
                </p>
              )}
              {currentFeedback.isCorrect && (
                <button onClick={() => handleSaveToReview(question.id)} disabled={savingToReview || savedToReview.has(question.id)}
                  className={clsx('mt-3 inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-md border transition-colors',
                    savedToReview.has(question.id) ? 'border-emerald-300 bg-emerald-100 text-emerald-700 cursor-default' : 'border-emerald-300 text-emerald-700 hover:bg-emerald-100')}>
                  {savedToReview.has(question.id) ? (
                    <><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M6.32 2.577a49.255 49.255 0 0111.36 0c1.497.174 2.57 1.46 2.57 2.93V21a.75.75 0 01-1.085.67L12 18.089l-7.165 3.583A.75.75 0 013.75 21V5.507c0-1.47 1.073-2.756 2.57-2.93z" clipRule="evenodd" /></svg>Saved</>
                  ) : (
                    <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" /></svg>Save to Review</>
                  )}
                </button>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowReviewModal(true)}
              className="btn-secondary flex items-center gap-1.5 text-sm"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
              </svg>
              Review & Finish
            </button>
            <div className="flex items-center gap-2">
              {currentQ > 0 && (
                <button onClick={() => navigateTo(currentQ - 1)} className="btn-secondary text-sm px-3 py-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>
                </button>
              )}
              {!currentFeedback && currentAnswer !== null && (
                <button onClick={handleSubmit} className={clsx('btn-primary text-sm', !submitting && 'animate-pulse-soft')} disabled={submitting}>
                  {submitting ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                      Submitting...
                    </span>
                  ) : 'Submit Answer'}
                </button>
              )}
              {currentQ < data.questions.length - 1 && (
                <button onClick={() => navigateTo(currentQ + 1)} className="btn-secondary text-sm px-3 py-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Review & Finish Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowReviewModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl max-w-lg w-full mx-4 p-6 animate-fade-in max-h-[85vh] overflow-y-auto">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Review Before Completing</h2>
            <p className="text-sm text-gray-500 mb-4">
              {submittedCount} of {data.questions.length} submitted
              {flaggedCount > 0 && <>, {flaggedCount} flagged</>}
              {unansweredCount > 0 && <>, {unansweredCount} unanswered</>}
            </p>

            {unansweredCount > 0 && (
              <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 mb-4 text-sm text-amber-800">
                Unanswered questions will be marked incorrect.
              </div>
            )}

            <div className="grid grid-cols-8 gap-2 mb-6">
              {data.questions.map((q, idx) => {
                const status = getQStatus(q);
                const isFlagged = flagged.has(q.id);
                return (
                  <button
                    key={q.id}
                    onClick={() => { setShowReviewModal(false); navigateTo(idx); }}
                    className={clsx(
                      'relative w-10 h-10 rounded-lg text-xs font-semibold transition-all',
                      status === 'correct' && 'bg-emerald-100 text-emerald-700',
                      status === 'incorrect' && 'bg-red-100 text-red-700',
                      status === 'answered' && 'bg-amber-100 text-amber-700',
                      status === 'unanswered' && 'bg-gray-100 text-gray-500',
                      'hover:opacity-80',
                    )}
                  >
                    {status === 'correct' && <svg className="w-3.5 h-3.5 mx-auto" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>}
                    {status === 'incorrect' && <svg className="w-3.5 h-3.5 mx-auto" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>}
                    {(status === 'answered' || status === 'unanswered') && (idx + 1)}
                    {isFlagged && <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-orange-400 rounded-full border border-white" />}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-4 text-xs text-gray-500 mb-6">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-100" /> Correct</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-100" /> Incorrect</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-amber-100" /> Answered</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-gray-100" /> Unanswered</span>
            </div>

            <div className="flex justify-end gap-3">
              <button onClick={() => setShowReviewModal(false)} className="btn-secondary">
                Back to Questions
              </button>
              <button onClick={handleComplete} className="btn-primary" disabled={completing}>
                {completing ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                    Completing...
                  </span>
                ) : 'Complete Exercise'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
