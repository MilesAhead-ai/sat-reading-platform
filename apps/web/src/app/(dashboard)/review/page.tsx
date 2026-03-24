'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import clsx from 'clsx';
import PassageText from '@/components/PassageText';

interface ReviewItem {
  id: string;
  question: {
    id: string;
    stem: string;
    choices: { label: string; text: string }[];
    correctAnswer: number;
    explanation: string | null;
    passage: { title: string; text: string } | null;
    skills?: { id: string; name: string }[];
  };
  nextReviewDate: string;
  repetitions: number;
}

interface ContextInfo {
  previousAnswer: number;
  isCorrect: boolean;
  timeSpentSeconds: number | null;
  errorPattern: string | null;
}

interface RetryResult {
  isCorrect: boolean;
  previousAnswer: number;
  correctAnswer: number;
  awaitingRating: boolean;
}

interface SimilarQuestion {
  stem: string;
  choices: { label: string; text: string }[];
  correctAnswer: number;
  explanation: string;
}

type View = 'list' | 'detail';
type Mode = 'passive' | 'retry';

export default function ReviewPage() {
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>('list');
  const [activeIdx, setActiveIdx] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [rating, setRating] = useState(false);

  // Deep review state
  const [mode, setMode] = useState<Mode>('retry');
  const [context, setContext] = useState<ContextInfo | null>(null);
  const [retryAnswer, setRetryAnswer] = useState<number | null>(null);
  const [retryResult, setRetryResult] = useState<RetryResult | null>(null);
  const [retrySubmitting, setRetrySubmitting] = useState(false);
  const [retryRated, setRetryRated] = useState(false);
  const [stepByStep, setStepByStep] = useState<string | null>(null);
  const [stepByStepLoading, setStepByStepLoading] = useState(false);
  const [similarQuestion, setSimilarQuestion] = useState<SimilarQuestion | null>(null);
  const [similarLoading, setSimilarLoading] = useState(false);
  const [similarAnswer, setSimilarAnswer] = useState<number | null>(null);
  const [similarRevealed, setSimilarRevealed] = useState(false);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<any>('/review-queue');
      setItems((res.data || res) as ReviewItem[]);
    } catch (err) {
      console.error('Failed to load review queue:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const resetDetailState = () => {
    setShowAnswer(false);
    setMode('passive');
    setContext(null);
    setRetryAnswer(null);
    setRetryResult(null);
    setRetryRated(false);
    setStepByStep(null);
    setSimilarQuestion(null);
    setSimilarAnswer(null);
    setSimilarRevealed(false);
  };

  const openItem = async (idx: number) => {
    setActiveIdx(idx);
    resetDetailState();
    setView('detail');
    // Fetch context
    try {
      const ctx = await api.get<ContextInfo>(`/review-queue/${items[idx].id}/context`);
      setContext(ctx);
    } catch {
      // No previous response — that's ok
    }
  };

  const backToList = () => {
    resetDetailState();
    setView('list');
  };

  const goToItem = async (idx: number) => {
    if (idx >= 0 && idx < items.length) {
      setActiveIdx(idx);
      resetDetailState();
      try {
        const ctx = await api.get<ContextInfo>(`/review-queue/${items[idx].id}/context`);
        setContext(ctx);
      } catch {
        // No previous response
      }
    }
  };

  const handleRate = async (quality: number) => {
    const item = items[activeIdx];
    setRating(true);
    try {
      await api.post(`/review-queue/${item.id}/review`, { quality });
      const remaining = items.filter((_, i) => i !== activeIdx);
      setItems(remaining);
      if (remaining.length === 0) {
        setView('list');
      } else {
        setActiveIdx(Math.min(activeIdx, remaining.length - 1));
        resetDetailState();
        // Fetch context for new active item
        const newIdx = Math.min(activeIdx, remaining.length - 1);
        try {
          const ctx = await api.get<ContextInfo>(`/review-queue/${remaining[newIdx].id}/context`);
          setContext(ctx);
        } catch { /* ok */ }
      }
    } catch (err) {
      console.error('Failed to rate item:', err);
      alert('Failed to submit rating. Please try again.');
    } finally {
      setRating(false);
    }
  };

  const handleRetrySubmit = async () => {
    if (retryAnswer === null) return;
    const item = items[activeIdx];
    setRetrySubmitting(true);
    try {
      const result = await api.post<RetryResult>(`/review-queue/${item.id}/retry`, {
        chosenAnswer: retryAnswer,
      });
      setRetryResult(result);
    } catch (err) {
      console.error('Failed to submit retry:', err);
      alert('Failed to submit retry. Please try again.');
    } finally {
      setRetrySubmitting(false);
    }
  };

  const handleRetryRate = async (quality: number) => {
    const item = items[activeIdx];
    setRetryRated(true);
    try {
      await api.post(`/review-queue/${item.id}/review`, { quality });
      const remaining = items.filter((_, i) => i !== activeIdx);
      setItems(remaining);
      if (remaining.length === 0) {
        setView('list');
      } else {
        setActiveIdx(Math.min(activeIdx, remaining.length - 1));
        resetDetailState();
        const newIdx = Math.min(activeIdx, remaining.length - 1);
        try {
          const ctx = await api.get<ContextInfo>(`/review-queue/${remaining[newIdx].id}/context`);
          setContext(ctx);
        } catch { /* ok */ }
      }
    } catch (err) {
      console.error('Failed to rate retry:', err);
      alert('Failed to submit rating. Please try again.');
      setRetryRated(false);
    }
  };

  const handleShowStepByStep = async () => {
    const item = items[activeIdx];
    setStepByStepLoading(true);
    try {
      const res = await api.get<{ stepByStep: string }>(`/review-queue/${item.id}/step-by-step`);
      setStepByStep(res.stepByStep);
    } catch (err) {
      console.error('Failed to load step-by-step:', err);
      alert('Failed to generate step-by-step reasoning.');
    } finally {
      setStepByStepLoading(false);
    }
  };

  const handleSimilarQuestion = async () => {
    const item = items[activeIdx];
    setSimilarLoading(true);
    try {
      const res = await api.post<SimilarQuestion>(`/review-queue/${item.id}/similar`);
      setSimilarQuestion(res);
      setSimilarAnswer(null);
      setSimilarRevealed(false);
    } catch (err) {
      console.error('Failed to generate similar question:', err);
      alert('Failed to generate a similar question.');
    } finally {
      setSimilarLoading(false);
    }
  };

  // --- Loading ---
  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-200 border-t-primary-600"></div>
          <span className="text-sm text-gray-400">Loading review queue...</span>
        </div>
      </div>
    );
  }

  // --- Empty ---
  if (items.length === 0) {
    return (
      <div className="max-w-lg mx-auto text-center py-16 animate-fade-in">
        <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-5">
          <svg className="w-8 h-8 text-emerald-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="page-header">Review Queue</h1>
        <p className="text-gray-500 mt-2 max-w-sm mx-auto leading-relaxed">
          {view === 'list'
            ? "No items due for review. Practice more and save tricky questions here!"
            : "You've reviewed all due items. Great work!"}
        </p>
        <a href="/practice" className="btn-primary inline-flex items-center gap-2 mt-6">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
          </svg>
          Start Practicing
        </a>
      </div>
    );
  }

  // --- List View ---
  if (view === 'list') {
    return (
      <div className="max-w-3xl mx-auto animate-fade-in">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="page-header">Review Queue</h1>
            <p className="text-sm text-gray-500 mt-1">{items.length} item{items.length !== 1 ? 's' : ''} due for review</p>
          </div>
          <button
            onClick={() => openItem(0)}
            className="btn-primary flex items-center gap-1.5 text-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
            </svg>
            Start Review
          </button>
        </div>

        <div className="space-y-2.5">
          {items.map((item, idx) => {
            const q = item.question;
            return (
              <button
                key={item.id}
                onClick={() => openItem(idx)}
                className="w-full text-left card !p-4 hover:border-primary-200 hover:shadow-sm transition-all group"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center shrink-0 text-sm font-semibold">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800 leading-relaxed line-clamp-2 group-hover:text-gray-900">
                      {q.stem}
                    </p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      {q.passage && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-gray-500 bg-gray-100 rounded px-1.5 py-0.5">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                          </svg>
                          {q.passage.title}
                        </span>
                      )}
                      {q.skills && q.skills.length > 0 && q.skills.map((s) => (
                        <span key={s.id} className="badge bg-blue-50 text-blue-600 text-[10px]">{s.name}</span>
                      ))}
                      {item.repetitions > 0 && (
                        <span className="text-[10px] text-gray-400">
                          reviewed {item.repetitions}x
                        </span>
                      )}
                    </div>
                  </div>
                  <svg className="w-4 h-4 text-gray-300 group-hover:text-primary-400 shrink-0 mt-1 transition-colors" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // --- Detail View ---
  const item = items[activeIdx];
  const q = item.question;
  const answerRevealed = showAnswer || retryResult !== null;

  const errorPatternLabels: Record<string, string> = {
    over_inference: 'Over-Inference',
    polarity_trap: 'Polarity Trap',
    evidence_mismatch: 'Evidence Mismatch',
    scope_error: 'Scope Error',
  };

  const ratingButtons = [
    { quality: 1, label: 'Forgot', color: 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100' },
    { quality: 3, label: 'Hard', color: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100' },
    { quality: 4, label: 'Good', color: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100' },
    { quality: 5, label: 'Easy', color: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' },
  ];

  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
      {/* Header with back + navigation */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={backToList}
            className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
            title="Back to list"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
          </button>
          <div>
            <h1 className="page-header">Review Queue</h1>
            <p className="text-sm text-gray-500 mt-0.5">{q.passage?.title || 'Question Review'}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <button
              onClick={() => goToItem(activeIdx - 1)}
              disabled={activeIdx === 0}
              className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>
            <span className="text-sm font-medium text-gray-500 tabular-nums min-w-[3rem] text-center">
              {activeIdx + 1} / {items.length}
            </span>
            <button
              onClick={() => goToItem(activeIdx + 1)}
              disabled={activeIdx >= items.length - 1}
              className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </div>
          <div className="w-20 bg-gray-100 rounded-full h-1.5">
            <div
              className="bg-primary-500 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${((activeIdx + 1) / items.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Context replay bar */}
      {context && (
        <div className="mb-4 px-4 py-2.5 rounded-lg bg-gray-50 border border-gray-200 flex items-center gap-3 text-sm animate-fade-in">
          <span className="font-medium text-gray-600">Last attempt:</span>
          <span className={clsx(
            'inline-flex items-center gap-1 font-semibold',
            context.isCorrect ? 'text-emerald-600' : 'text-red-600'
          )}>
            [{q.choices[context.previousAnswer]?.label ?? '?'}]
            {context.isCorrect ? ' (correct)' : ' (incorrect)'}
          </span>
          {context.timeSpentSeconds !== null && (
            <span className="text-gray-400">|</span>
          )}
          {context.timeSpentSeconds !== null && (
            <span className="text-gray-500">{context.timeSpentSeconds}s</span>
          )}
          {context.errorPattern && (
            <>
              <span className="text-gray-400">|</span>
              <span className="text-amber-600 font-medium">
                {errorPatternLabels[context.errorPattern] ?? context.errorPattern}
              </span>
            </>
          )}
        </div>
      )}

      {/* Content area */}
      <div className={clsx('grid gap-6', q.passage ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1 max-w-2xl mx-auto')}>
        {q.passage && (
          <div className="card max-h-[70vh] overflow-y-auto scrollbar-thin lg:sticky lg:top-4">
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
              <h2 className="font-semibold text-gray-900">{q.passage.title}</h2>
            </div>
            <PassageText text={q.passage.text} />
          </div>
        )}

        <div className="space-y-4">
          <div className="card">
            <p className="font-medium text-gray-900 mb-5 leading-relaxed">{q.stem}</p>
            <div className="space-y-2.5">
              {q.choices.map((c, i) => {
                const isCorrect = i === q.correctAnswer;
                const isRetrySelected = mode === 'retry' && retryAnswer === i;
                const isRetryCorrect = retryResult && i === retryResult.correctAnswer;
                const isRetryChosen = retryResult && i === retryAnswer;
                const isPreviousAnswer = retryResult && i === retryResult.previousAnswer;

                let borderClass = 'border-gray-100';
                if (retryResult) {
                  if (isRetryCorrect) borderClass = 'border-emerald-400 bg-emerald-50';
                  else if (isRetryChosen && !retryResult.isCorrect) borderClass = 'border-red-300 bg-red-50';
                  else if (isPreviousAnswer) borderClass = 'border-amber-200 bg-amber-50/30';
                } else if (showAnswer && isCorrect) {
                  borderClass = 'border-emerald-400 bg-emerald-50';
                } else if (isRetrySelected) {
                  borderClass = 'border-primary-400 bg-primary-50';
                }

                return (
                  <button
                    key={i}
                    onClick={() => {
                      if (mode === 'retry' && !retryResult) setRetryAnswer(i);
                    }}
                    disabled={mode !== 'retry' || retryResult !== null}
                    className={clsx(
                      'w-full text-left p-3.5 rounded-lg border-2 text-sm leading-relaxed transition-all',
                      borderClass,
                      mode === 'retry' && !retryResult && 'cursor-pointer hover:border-primary-300',
                      (mode !== 'retry' || retryResult !== null) && 'cursor-default'
                    )}
                  >
                    <span className={clsx(
                      'inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold mr-3',
                      retryResult && isRetryCorrect ? 'bg-emerald-200 text-emerald-800' :
                      retryResult && isRetryChosen && !retryResult.isCorrect ? 'bg-red-200 text-red-800' :
                      showAnswer && isCorrect ? 'bg-emerald-200 text-emerald-800' :
                      isRetrySelected ? 'bg-primary-200 text-primary-800' :
                      'bg-gray-100 text-gray-500'
                    )}>
                      {c.label}
                    </span>
                    {c.text}
                    {retryResult && isPreviousAnswer && !isRetryCorrect && !(isRetryChosen && !retryResult.isCorrect) && (
                      <span className="ml-2 text-[10px] text-amber-600 font-medium">(previous answer)</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Mode selector: Show Answer / Try Again */}
          {!answerRevealed && (
            <div className="flex justify-end gap-2">
              {mode === 'retry' ? (
                <>
                  <button
                    onClick={() => { setMode('passive'); setRetryAnswer(null); }}
                    className="px-4 py-2.5 rounded-lg text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRetrySubmit}
                    disabled={retryAnswer === null || retrySubmitting}
                    className={clsx(
                      'btn-primary',
                      (retryAnswer === null || retrySubmitting) && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    {retrySubmitting ? 'Submitting...' : 'Submit'}
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setMode('retry')}
                    className="px-4 py-2.5 rounded-lg text-sm font-medium border border-primary-200 text-primary-700 bg-primary-50 hover:bg-primary-100 transition-colors"
                  >
                    Try Again
                  </button>
                  <button onClick={() => setShowAnswer(true)} className="btn-primary">
                    Show Answer
                  </button>
                </>
              )}
            </div>
          )}

          {/* Retry result comparison */}
          {retryResult && (
            <div className={clsx(
              'card animate-slide-up',
              retryResult.isCorrect ? '!border-emerald-200 !bg-emerald-50/50' : '!border-red-200 !bg-red-50/50'
            )}>
              <div className="flex items-center gap-2 mb-3">
                {retryResult.isCorrect ? (
                  <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                <span className={clsx(
                  'font-semibold text-sm',
                  retryResult.isCorrect ? 'text-emerald-700' : 'text-red-700'
                )}>
                  {retryResult.isCorrect ? 'Correct! Great improvement.' : 'Not quite — review the explanation below.'}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs mb-3">
                <div className="text-center p-2 rounded bg-white/60">
                  <div className="text-gray-400 mb-0.5">Previous</div>
                  <div className="font-semibold text-amber-600">
                    {q.choices[retryResult.previousAnswer]?.label ?? '—'}
                  </div>
                </div>
                <div className="text-center p-2 rounded bg-white/60">
                  <div className="text-gray-400 mb-0.5">Retry</div>
                  <div className={clsx('font-semibold', retryResult.isCorrect ? 'text-emerald-600' : 'text-red-600')}>
                    {retryAnswer !== null ? q.choices[retryAnswer]?.label : '—'}
                  </div>
                </div>
                <div className="text-center p-2 rounded bg-white/60">
                  <div className="text-gray-400 mb-0.5">Correct</div>
                  <div className="font-semibold text-emerald-600">
                    {q.choices[retryResult.correctAnswer]?.label ?? '—'}
                  </div>
                </div>
              </div>
              {q.explanation && (
                <p className="text-sm text-gray-700 leading-relaxed mb-3">{q.explanation}</p>
              )}
              <p className="text-sm font-medium text-gray-600 mb-3">How well did you know this?</p>
              <div className="flex gap-2">
                {ratingButtons.map((btn) => (
                  <button
                    key={btn.quality}
                    onClick={() => handleRetryRate(btn.quality)}
                    disabled={retryRated}
                    className={clsx(
                      'flex-1 px-4 py-2.5 rounded-lg text-sm font-medium border transition-all',
                      btn.color,
                      retryRated && 'opacity-50 cursor-not-allowed',
                      !retryRated && retryResult.isCorrect && btn.quality === 4 && 'ring-2 ring-blue-300',
                      !retryRated && !retryResult.isCorrect && btn.quality === 1 && 'ring-2 ring-red-300',
                    )}
                  >
                    {btn.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Passive mode answer reveal */}
          {showAnswer && !retryResult && (
            <div className="card animate-slide-up !border-emerald-200 !bg-emerald-50/50">
              {q.explanation && (
                <p className="text-sm text-gray-700 leading-relaxed mb-4">{q.explanation}</p>
              )}
              <p className="text-sm font-medium text-gray-600 mb-3">How well did you remember this?</p>
              <div className="flex gap-2">
                {ratingButtons.map((btn) => (
                  <button
                    key={btn.quality}
                    onClick={() => handleRate(btn.quality)}
                    disabled={rating}
                    className={clsx(
                      'flex-1 px-4 py-2.5 rounded-lg text-sm font-medium border transition-all',
                      btn.color,
                      rating && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    {btn.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step-by-step section (shown after answer revealed) */}
          {answerRevealed && (
            <div className="space-y-3">
              {stepByStep === null ? (
                <button
                  onClick={handleShowStepByStep}
                  disabled={stepByStepLoading}
                  className="w-full px-4 py-3 rounded-lg text-sm font-medium border border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors flex items-center justify-center gap-2"
                >
                  {stepByStepLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-300 border-t-blue-600"></div>
                      Generating reasoning...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
                      </svg>
                      Show Step-by-Step Reasoning
                    </>
                  )}
                </button>
              ) : (
                <div className="card animate-slide-up !border-blue-200 !bg-blue-50/30">
                  <h3 className="text-sm font-semibold text-blue-800 mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
                    </svg>
                    Step-by-Step Reasoning
                    <button
                      onClick={() => {
                        if (stepByStep) {
                          navigator.clipboard.writeText(stepByStep);
                          const btn = document.getElementById('copy-sbs-btn');
                          if (btn) { btn.textContent = 'Copied!'; setTimeout(() => { btn.textContent = 'Copy'; }, 2000); }
                        }
                      }}
                      id="copy-sbs-btn"
                      className="ml-auto text-[11px] font-medium text-blue-600 hover:text-blue-800 bg-blue-100 hover:bg-blue-200 px-2 py-0.5 rounded transition-colors"
                    >
                      Copy
                    </button>
                  </h3>
                  <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: stepByStep.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\*(.+?)\*/g, '<em>$1</em>').replace(/^### (.+)$/gm, '<h3 class="font-semibold text-base mt-3 mb-1">$1</h3>').replace(/^## (.+)$/gm, '<h2 class="font-bold text-lg mt-3 mb-1">$1</h2>').replace(/^- (.+)$/gm, '<li class="ml-4 list-disc">$1</li>') }} />
                </div>
              )}

              {/* Similar question */}
              {similarQuestion === null ? (
                <button
                  onClick={handleSimilarQuestion}
                  disabled={similarLoading}
                  className="w-full px-4 py-3 rounded-lg text-sm font-medium border border-purple-200 text-purple-700 bg-purple-50 hover:bg-purple-100 transition-colors flex items-center justify-center gap-2"
                >
                  {similarLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-purple-300 border-t-purple-600"></div>
                      Generating question...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                      </svg>
                      Practice Similar Question
                    </>
                  )}
                </button>
              ) : (
                <div className="card animate-slide-up !border-purple-200 !bg-purple-50/30">
                  <h3 className="text-sm font-semibold text-purple-800 mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    Similar Question
                  </h3>
                  <p className="font-medium text-gray-900 mb-4 text-sm leading-relaxed">{similarQuestion.stem}</p>
                  <div className="space-y-2">
                    {similarQuestion.choices.map((c, i) => {
                      const isSelected = similarAnswer === i;
                      const isCorrectChoice = i === similarQuestion.correctAnswer;

                      let style = 'border-gray-100';
                      if (similarRevealed) {
                        if (isCorrectChoice) style = 'border-emerald-400 bg-emerald-50';
                        else if (isSelected) style = 'border-red-300 bg-red-50';
                      } else if (isSelected) {
                        style = 'border-primary-400 bg-primary-50';
                      }

                      return (
                        <button
                          key={i}
                          onClick={() => { if (!similarRevealed) setSimilarAnswer(i); }}
                          disabled={similarRevealed}
                          className={clsx(
                            'w-full text-left p-3 rounded-lg border-2 text-sm leading-relaxed transition-all',
                            style,
                            !similarRevealed && 'cursor-pointer hover:border-primary-300',
                            similarRevealed && 'cursor-default'
                          )}
                        >
                          <span className={clsx(
                            'inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-semibold mr-2',
                            similarRevealed && isCorrectChoice ? 'bg-emerald-200 text-emerald-800' :
                            isSelected ? 'bg-primary-200 text-primary-800' :
                            'bg-gray-100 text-gray-500'
                          )}>
                            {c.label}
                          </span>
                          {c.text}
                        </button>
                      );
                    })}
                  </div>
                  {!similarRevealed && similarAnswer !== null && (
                    <button
                      onClick={() => setSimilarRevealed(true)}
                      className="btn-primary mt-3 text-sm"
                    >
                      Check Answer
                    </button>
                  )}
                  {similarRevealed && (
                    <div className={clsx(
                      'mt-3 p-3 rounded-lg text-sm',
                      similarAnswer === similarQuestion.correctAnswer
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-red-100 text-red-800'
                    )}>
                      {similarAnswer === similarQuestion.correctAnswer
                        ? 'Correct! You\'ve got this concept down.'
                        : `The correct answer is ${similarQuestion.choices[similarQuestion.correctAnswer]?.label}. `}
                      {similarQuestion.explanation}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
