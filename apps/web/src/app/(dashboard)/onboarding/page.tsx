'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import clsx from 'clsx';

const SCORE_OPTIONS = [
  { value: 600, label: '600+', desc: 'Solid foundation' },
  { value: 650, label: '650+', desc: 'Above average' },
  { value: 700, label: '700+', desc: 'Competitive' },
  { value: 750, label: '750+', desc: 'Top scorer' },
];

const WEAK_AREAS = [
  { id: 'main_idea', label: 'Main Idea & Themes', icon: '📖' },
  { id: 'vocabulary', label: 'Vocabulary in Context', icon: '📝' },
  { id: 'inference', label: 'Inference & Reasoning', icon: '🔍' },
  { id: 'evidence', label: 'Evidence-Based Questions', icon: '📊' },
  { id: 'structure', label: 'Passage Structure', icon: '🏗️' },
  { id: 'tone', label: 'Tone & Attitude', icon: '🎭' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [targetScore, setTargetScore] = useState<number | null>(null);
  const [testDate, setTestDate] = useState('');
  const [weakAreas, setWeakAreas] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const toggleWeak = (id: string) => {
    setWeakAreas((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id],
    );
  };

  const handleFinish = async () => {
    setSaving(true);
    try {
      const body: Record<string, unknown> = {};
      if (targetScore) body.targetScore = targetScore;
      if (testDate) body.targetTestDate = testDate;
      if (weakAreas.length > 0) body.weakAreas = weakAreas;
      if (Object.keys(body).length > 0) {
        await api.put('/users/me/profile', body);
      }
    } catch (err) {
      console.error('Failed to save onboarding:', err);
    } finally {
      router.push('/dashboard');
    }
  };

  const steps = [
    // Step 0: Target score
    <div key="score" className="animate-fade-in">
      <h2 className="text-xl font-bold text-gray-900 mb-2">What&apos;s your target SAT Reading score?</h2>
      <p className="text-sm text-gray-500 mb-6">This helps us set the right difficulty and track your progress toward your goal.</p>
      <div className="grid grid-cols-2 gap-3">
        {SCORE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setTargetScore(opt.value)}
            className={clsx(
              'rounded-xl border-2 p-4 text-left transition-all',
              targetScore === opt.value
                ? 'border-primary-400 bg-primary-50 shadow-sm'
                : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50',
            )}
          >
            <div className="text-2xl font-bold text-gray-900">{opt.label}</div>
            <div className="text-xs text-gray-500 mt-0.5">{opt.desc}</div>
          </button>
        ))}
      </div>
    </div>,

    // Step 1: Test date
    <div key="date" className="animate-fade-in">
      <h2 className="text-xl font-bold text-gray-900 mb-2">When are you taking the SAT?</h2>
      <p className="text-sm text-gray-500 mb-6">We&apos;ll help you plan your study schedule accordingly.</p>
      <input
        type="date"
        value={testDate}
        onChange={(e) => setTestDate(e.target.value)}
        min={new Date().toISOString().split('T')[0]}
        className="input w-full text-lg"
      />
      <div className="flex gap-2 mt-4 flex-wrap">
        {[1, 2, 3, 6].map((months) => {
          const d = new Date();
          d.setMonth(d.getMonth() + months);
          const val = d.toISOString().split('T')[0];
          return (
            <button
              key={months}
              onClick={() => setTestDate(val)}
              className={clsx(
                'px-3 py-1.5 rounded-lg text-sm border transition-colors',
                testDate === val
                  ? 'border-primary-400 bg-primary-50 text-primary-700'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-50',
              )}
            >
              In {months} month{months > 1 ? 's' : ''}
            </button>
          );
        })}
      </div>
    </div>,

    // Step 2: Weak areas
    <div key="weak" className="animate-fade-in">
      <h2 className="text-xl font-bold text-gray-900 mb-2">Which areas feel most challenging?</h2>
      <p className="text-sm text-gray-500 mb-6">Select all that apply. We&apos;ll prioritize these in your practice sessions.</p>
      <div className="grid grid-cols-2 gap-3">
        {WEAK_AREAS.map((area) => (
          <button
            key={area.id}
            onClick={() => toggleWeak(area.id)}
            className={clsx(
              'rounded-xl border-2 p-4 text-left transition-all',
              weakAreas.includes(area.id)
                ? 'border-primary-400 bg-primary-50 shadow-sm'
                : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50',
            )}
          >
            <span className="text-lg">{area.icon}</span>
            <div className="text-sm font-medium text-gray-900 mt-1">{area.label}</div>
          </button>
        ))}
      </div>
    </div>,
  ];

  return (
    <div className="max-w-lg mx-auto py-12 px-4">
      {/* Progress */}
      <div className="flex items-center gap-2 mb-8">
        {steps.map((_, idx) => (
          <div
            key={idx}
            className={clsx(
              'h-1.5 rounded-full flex-1 transition-all duration-300',
              idx <= step ? 'bg-primary-500' : 'bg-gray-200',
            )}
          />
        ))}
      </div>

      <div className="text-xs text-gray-400 mb-1">Step {step + 1} of {steps.length}</div>

      {steps[step]}

      {/* Navigation */}
      <div className="flex items-center justify-between mt-8">
        <div>
          {step > 0 && (
            <button onClick={() => setStep(step - 1)} className="btn-secondary text-sm">
              Back
            </button>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleFinish}
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            Skip for now
          </button>
          {step < steps.length - 1 ? (
            <button onClick={() => setStep(step + 1)} className="btn-primary flex items-center gap-1.5">
              Continue
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </button>
          ) : (
            <button onClick={handleFinish} disabled={saving} className="btn-primary flex items-center gap-1.5">
              {saving ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Saving...
                </>
              ) : (
                <>
                  Get Started
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
