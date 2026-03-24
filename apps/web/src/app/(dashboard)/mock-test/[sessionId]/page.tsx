'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import clsx from 'clsx';
import PassageText from '@/components/PassageText';

interface QuestionItem {
  id: string;
  stem: string;
  choices: { label: string; text: string }[];
}

interface PassageGroup {
  passage: { id: string; title: string; text: string; type: string } | null;
  questions: QuestionItem[];
}

interface MockTestData {
  sessionId: string;
  status: string;
  timeLimitSeconds: number;
  startedAt: string;
  totalQuestions: number;
  passageGroups: PassageGroup[];
}

interface MockTestResults {
  sessionId: string;
  score: number;
  totalQuestions: number;
  correctCount: number;
  totalTimeSeconds: number;
  timeLimitSeconds: number;
  sectionScore: number;
  estimatedTotal: number;
  skillProgress: {
    skillId: string; skillName: string; before: number; after: number;
    delta: number; masteryBefore: string; masteryAfter: string;
  }[];
  questionResults: {
    questionId: string; stem: string; isCorrect: boolean;
    chosenAnswer: number; correctAnswer: number; explanation: string | null;
    skills: { id: string; name: string }[];
    passageTitle: string | null; passageType: string | null;
  }[];
  passageBreakdown: { title: string; type: string; correct: number; total: number }[];
}

export default function MockTestSessionPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const router = useRouter();

  const [data, setData] = useState<MockTestData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Flatten questions from passage groups for navigation
  const [flatQuestions, setFlatQuestions] = useState<{ question: QuestionItem; passageGroup: PassageGroup; globalIdx: number }[]>([]);
  const [currentQ, setCurrentQ] = useState(0);

  // Answer state (local until submit)
  const [answers, setAnswers] = useState<Map<string, number>>(new Map());
  const [flagged, setFlagged] = useState<Set<string>>(new Set());

  // Timer
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [timerWarning, setTimerWarning] = useState<string | null>(null);

  // UI
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState<MockTestResults | null>(null);
  const [showQuestionReview, setShowQuestionReview] = useState(false);

  // Timing per question
  const questionStartRef = useRef<number>(Date.now());
  const [questionTimeSpent, setQuestionTimeSpent] = useState<Map<string, number>>(new Map());

  // Auto-submit ref
  const autoSubmitRef = useRef(false);

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      try {
        const res = await api.get<any>(`/mock-test/${sessionId}`);
        const d: MockTestData = res.data || res;
        if (ignore) return;
        setData(d);

        // Flatten
        const flat: typeof flatQuestions = [];
        let idx = 0;
        for (const pg of d.passageGroups) {
          for (const q of pg.questions) {
            flat.push({ question: q, passageGroup: pg, globalIdx: idx++ });
          }
        }
        setFlatQuestions(flat);

        // Calculate remaining time
        const elapsed = (Date.now() - new Date(d.startedAt).getTime()) / 1000;
        const remaining = Math.max(0, (d.timeLimitSeconds || 3900) - elapsed);
        setTimeRemaining(Math.floor(remaining));
      } catch (err: any) {
        if (!ignore) setError(err.message || 'Failed to load mock test');
      } finally {
        if (!ignore) {
          setLoading(false);
          questionStartRef.current = Date.now();
        }
      }
    };
    load();
    return () => { ignore = true; };
  }, [sessionId]);

  // Countdown timer
  useEffect(() => {
    if (loading || results || timeRemaining <= 0) return;
    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        const next = prev - 1;
        if (next <= 0) {
          clearInterval(interval);
          return 0;
        }
        if (next === 300) setTimerWarning('5 minutes remaining');
        else if (next === 60) setTimerWarning('1 minute remaining!');
        else if (next > 60 && timerWarning === '5 minutes remaining') {
          // Clear after a few seconds
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [loading, results, timeRemaining > 0]);

  // Clear timer warning after 3s
  useEffect(() => {
    if (!timerWarning) return;
    const t = setTimeout(() => setTimerWarning(null), 3000);
    return () => clearTimeout(t);
  }, [timerWarning]);

  // Auto-submit when time runs out
  useEffect(() => {
    if (timeRemaining <= 0 && data && !results && !autoSubmitRef.current && !loading) {
      autoSubmitRef.current = true;
      handleSubmitAll();
    }
  }, [timeRemaining, data, results, loading]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const accumulateTime = useCallback(() => {
    if (flatQuestions.length === 0) return;
    const qId = flatQuestions[currentQ]?.question.id;
    if (!qId) return;
    const spent = Math.round((Date.now() - questionStartRef.current) / 1000);
    setQuestionTimeSpent((prev) => {
      const next = new Map(prev);
      next.set(qId, (next.get(qId) ?? 0) + spent);
      return next;
    });
  }, [flatQuestions, currentQ]);

  const navigateTo = useCallback((idx: number) => {
    if (idx === currentQ) return;
    accumulateTime();
    setCurrentQ(idx);
    questionStartRef.current = Date.now();
  }, [currentQ, accumulateTime]);

  const toggleFlag = useCallback((qId: string) => {
    setFlagged((prev) => {
      const next = new Set(prev);
      if (next.has(qId)) next.delete(qId);
      else next.add(qId);
      return next;
    });
  }, []);

  const handleSubmitAll = async () => {
    if (submitting) return;
    setSubmitting(true);
    accumulateTime();
    try {
      const answersArr = Array.from(answers.entries()).map(([questionId, chosenAnswer]) => ({
        questionId,
        chosenAnswer,
        timeSpentSeconds: questionTimeSpent.get(questionId) ?? 0,
      }));
      const totalTime = data ? Math.floor((Date.now() - new Date(data.startedAt).getTime()) / 1000) : 0;
      const res = await api.post<any>(`/mock-test/${sessionId}/submit-all`, {
        answers: answersArr,
        totalTimeSeconds: totalTime,
      });
      setResults(res.data || res);
    } catch (err: any) {
      console.error('Submit failed:', err);
      setError(err.message || 'Failed to submit mock test');
    } finally {
      setSubmitting(false);
      setShowReviewModal(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-200 border-t-primary-600"></div>
          <span className="text-sm text-gray-400">Loading mock test...</span>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="max-w-md mx-auto text-center py-16">
        <p className="text-lg font-semibold text-gray-900 mb-1">{error}</p>
        <button onClick={() => router.push('/mock-test')} className="btn-primary mt-4">Back to Mock Test</button>
      </div>
    );
  }

  if (!data || flatQuestions.length === 0) return null;

  // ── Results Screen ──
  if (results) {
    const scoreColor = results.score >= 80 ? 'text-emerald-600' : results.score >= 50 ? 'text-amber-600' : 'text-red-600';
    const masteryLabel = (s: string) => ({ novice: 'Novice', developing: 'Developing', proficient: 'Proficient', mastered: 'Mastered' }[s] || s);
    const masteryBadgeClass = (s: string) => ({
      novice: 'bg-red-50 text-red-700 border-red-200',
      developing: 'bg-amber-50 text-amber-700 border-amber-200',
      proficient: 'bg-blue-50 text-blue-700 border-blue-200',
      mastered: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    }[s] || 'bg-gray-50 text-gray-600 border-gray-200');

    return (
      <div className="max-w-3xl mx-auto py-12 animate-fade-in">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-primary-50 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-primary-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Mock Test Complete!</h1>
          <p className="text-gray-500">Here are your results</p>
        </div>

        {/* Score cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="card text-center">
            <div className="text-3xl font-bold text-primary-600 mb-0.5">{results.sectionScore}</div>
            <div className="text-xs text-gray-500">Section Score (10-40)</div>
          </div>
          <div className="card text-center">
            <div className="text-3xl font-bold text-primary-700 mb-0.5">{results.estimatedTotal}</div>
            <div className="text-xs text-gray-500">Est. Total (200-800)</div>
          </div>
          <div className="card text-center">
            <div className={clsx('text-3xl font-bold mb-0.5', scoreColor)}>{results.correctCount}/{results.totalQuestions}</div>
            <div className="text-xs text-gray-500">Correct</div>
          </div>
          <div className="card text-center">
            <div className="text-3xl font-bold text-gray-700 mb-0.5">{formatTime(results.totalTimeSeconds)}</div>
            <div className="text-xs text-gray-500">Time Used</div>
          </div>
        </div>

        {/* Passage Breakdown */}
        {results.passageBreakdown.length > 0 && (
          <div className="card mb-6">
            <h2 className="section-header mb-4">Performance by Passage Type</h2>
            <div className="space-y-2">
              {results.passageBreakdown.map((pb, idx) => (
                <div key={idx} className="flex items-center justify-between rounded-lg border border-gray-100 p-3 bg-gray-50/50">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-700 truncate">{pb.title}</p>
                    <span className="badge bg-gray-100 text-gray-500 text-[10px] capitalize">{pb.type.replace('_', ' ')}</span>
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <span className={clsx('text-sm font-semibold', pb.correct / pb.total >= 0.8 ? 'text-emerald-600' : pb.correct / pb.total >= 0.5 ? 'text-amber-600' : 'text-red-600')}>
                      {pb.correct}/{pb.total}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Skill Progress */}
        {results.skillProgress && results.skillProgress.length > 0 && (
          <div className="card mb-6">
            <h2 className="section-header mb-4">Skill Progress</h2>
            <div className="space-y-3">
              {results.skillProgress.map((sp) => {
                const improved = sp.delta > 0;
                const declined = sp.delta < 0;
                return (
                  <div key={sp.skillId} className="flex items-center justify-between rounded-lg border border-gray-100 p-3 bg-gray-50/50">
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-gray-700">{sp.skillName}</span>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`badge border text-[10px] ${masteryBadgeClass(sp.masteryBefore)}`}>{masteryLabel(sp.masteryBefore)}</span>
                        {sp.masteryBefore !== sp.masteryAfter && (
                          <>
                            <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
                            <span className={`badge border text-[10px] ${masteryBadgeClass(sp.masteryAfter)}`}>{masteryLabel(sp.masteryAfter)}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <span className={clsx('text-sm font-semibold', improved ? 'text-emerald-600' : declined ? 'text-red-500' : 'text-gray-400')}>
                      {improved ? '+' : ''}{sp.delta.toFixed(3)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Question review toggle */}
        <div className="card mb-6">
          <button onClick={() => setShowQuestionReview(!showQuestionReview)} className="flex items-center justify-between w-full">
            <h2 className="section-header">Question-by-Question Review</h2>
            <svg className={clsx('w-5 h-5 text-gray-400 transition-transform', showQuestionReview && 'rotate-180')} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </button>
          {showQuestionReview && (
            <div className="mt-4 space-y-3">
              {results.questionResults.map((qr, idx) => (
                <div key={qr.questionId} className={clsx('rounded-lg border p-3.5', qr.isCorrect ? 'border-emerald-200 bg-emerald-50/50' : 'border-red-200 bg-red-50/50')}>
                  <div className="flex items-start gap-3">
                    <div className={clsx('w-7 h-7 rounded-full flex items-center justify-center shrink-0', qr.isCorrect ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600')}>
                      {qr.isCorrect ? (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-700 leading-relaxed">
                        <span className="font-medium text-gray-500 mr-1.5">Q{idx + 1}.</span>{qr.stem}
                      </p>
                      {!qr.isCorrect && (
                        <p className="text-xs text-gray-500 mt-1">
                          Your answer: {String.fromCharCode(65 + qr.chosenAnswer)} | Correct: {String.fromCharCode(65 + qr.correctAnswer)}
                        </p>
                      )}
                      {qr.explanation && <p className="text-xs text-gray-600 mt-2 leading-relaxed">{qr.explanation}</p>}
                      {qr.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {qr.skills.map((s) => <span key={s.id} className="badge bg-gray-100 text-gray-500 text-[10px]">{s.name}</span>)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-3 justify-center">
          <button onClick={() => router.push('/mock-test')} className="btn-primary flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" /></svg>
            Try Another Mock Test
          </button>
          <button onClick={() => router.push('/dashboard')} className="btn-secondary">Dashboard</button>
        </div>
      </div>
    );
  }

  // ── Test Taking Screen ──
  const currentItem = flatQuestions[currentQ];
  if (!currentItem) return null;
  const { question, passageGroup } = currentItem;
  const currentAnswer = answers.get(question.id) ?? null;
  const answeredCount = flatQuestions.filter((fq) => answers.has(fq.question.id)).length;
  const flaggedCount = flatQuestions.filter((fq) => flagged.has(fq.question.id)).length;
  const unansweredCount = flatQuestions.length - answeredCount;
  const timerDanger = timeRemaining <= 60;
  const timerWarn = timeRemaining <= 300 && !timerDanger;

  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center mb-3">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Digital SAT Reading & Writing</h1>
          <p className="text-xs text-gray-400">Question {currentQ + 1} of {flatQuestions.length}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className={clsx(
            'text-lg font-mono tabular-nums font-semibold px-3 py-1 rounded-lg',
            timerDanger ? 'bg-red-100 text-red-600 animate-pulse' : timerWarn ? 'bg-amber-100 text-amber-600' : 'text-gray-600',
          )}>
            {formatTime(timeRemaining)}
          </div>
        </div>
      </div>

      {/* Timer warning banner */}
      {timerWarning && (
        <div className={clsx('rounded-lg p-2 mb-3 text-center text-sm font-medium animate-fade-in', timeRemaining <= 60 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700')}>
          {timerWarning}
        </div>
      )}

      {/* Navigation bar */}
      <div className="mb-5 overflow-x-auto">
        <div className="flex items-center gap-1 pb-1">
          {flatQuestions.map((fq, idx) => {
            const isCurrent = idx === currentQ;
            const isAnswered = answers.has(fq.question.id);
            const isFlagged = flagged.has(fq.question.id);
            return (
              <div key={fq.question.id} className="flex items-center">
                <button
                  onClick={() => navigateTo(idx)}
                  className={clsx(
                    'relative w-9 h-9 sm:w-7 sm:h-7 rounded text-[10px] font-semibold transition-all shrink-0',
                    isCurrent && 'ring-2 ring-primary-500 ring-offset-1',
                    isAnswered ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-400',
                    !isCurrent && 'hover:opacity-80',
                  )}
                >
                  {idx + 1}
                  {isFlagged && <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-orange-400 rounded-full border border-white" />}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {passageGroup.passage && (
          <div className="card max-h-[70vh] overflow-y-auto scrollbar-thin">
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
              <h2 className="font-semibold text-gray-900">{passageGroup.passage.title}</h2>
              <span className="badge bg-gray-100 text-gray-500 text-[10px] capitalize">{passageGroup.passage.type.replace('_', ' ')}</span>
            </div>
            <PassageText text={passageGroup.passage.text} />
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
                  onClick={() => setAnswers((prev) => new Map(prev).set(question.id, idx))}
                  className={clsx(
                    'w-full text-left p-3.5 rounded-lg border-2 transition-all duration-150 text-sm leading-relaxed',
                    currentAnswer === idx
                      ? 'border-primary-400 bg-primary-50 shadow-sm'
                      : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                  )}
                >
                  <span className={clsx(
                    'inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold mr-3',
                    currentAnswer === idx ? 'bg-primary-200 text-primary-800' : 'bg-gray-100 text-gray-500'
                  )}>
                    {choice.label}
                  </span>
                  {choice.text}
                </button>
              ))}
            </div>
          </div>

          {/* Navigation + actions */}
          <div className="flex items-center justify-between">
            <button onClick={() => setShowReviewModal(true)} className="btn-secondary flex items-center gap-1.5 text-sm">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
              </svg>
              Review & Submit
            </button>
            <div className="flex items-center gap-2">
              {currentQ > 0 && (
                <button onClick={() => navigateTo(currentQ - 1)} className="btn-secondary text-sm px-3 py-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>
                </button>
              )}
              {currentQ < flatQuestions.length - 1 && (
                <button onClick={() => navigateTo(currentQ + 1)} className="btn-secondary text-sm px-3 py-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Review & Submit Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowReviewModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl max-w-lg w-full mx-4 p-6 animate-fade-in max-h-[85vh] overflow-y-auto">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Review Before Submitting</h2>
            <p className="text-sm text-gray-500 mb-1">
              {answeredCount} of {flatQuestions.length} answered
              {flaggedCount > 0 && <>, {flaggedCount} flagged</>}
            </p>
            <p className="text-sm text-gray-400 mb-4">Time remaining: {formatTime(timeRemaining)}</p>

            {unansweredCount > 0 && (
              <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 mb-4 text-sm text-amber-800">
                {unansweredCount} unanswered question{unansweredCount > 1 ? 's' : ''} will be marked incorrect.
              </div>
            )}

            <div className="grid grid-cols-9 gap-1.5 mb-6">
              {flatQuestions.map((fq, idx) => {
                const isAnswered = answers.has(fq.question.id);
                const isFlagged = flagged.has(fq.question.id);
                return (
                  <button
                    key={fq.question.id}
                    onClick={() => { setShowReviewModal(false); navigateTo(idx); }}
                    className={clsx(
                      'relative w-9 h-9 rounded text-[10px] font-semibold transition-all hover:opacity-80',
                      isAnswered ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-400',
                    )}
                  >
                    {idx + 1}
                    {isFlagged && <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-orange-400 rounded-full border border-white" />}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-4 text-xs text-gray-500 mb-6">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-primary-100" /> Answered</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-gray-100" /> Unanswered</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-orange-400" /> Flagged</span>
            </div>

            <div className="flex justify-end gap-3">
              <button onClick={() => setShowReviewModal(false)} className="btn-secondary">Back to Test</button>
              <button onClick={handleSubmitAll} className="btn-primary" disabled={submitting}>
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                    Submitting...
                  </span>
                ) : 'Submit Test'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
