'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export default function MockTestStartPage() {
  const router = useRouter();
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStart = async () => {
    setStarting(true);
    setError(null);
    try {
      const res = await api.post<any>('/mock-test/start');
      const data = res.data || res;
      router.push(`/mock-test/${data.sessionId}`);
    } catch (err: any) {
      setError(err.message || 'Failed to start mock test');
      setStarting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-12 animate-fade-in">
      <div className="text-center mb-10">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center mx-auto mb-5 shadow-lg">
          <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Digital SAT Mock Test</h1>
        <p className="text-gray-500">Simulate a real Digital SAT Reading & Writing section under timed conditions</p>
        <p className="text-xs text-gray-400 mt-1">54 questions, each with its own short passage — matching the 2024+ format</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="card text-center">
          <div className="text-3xl font-bold text-primary-600 mb-1">54</div>
          <div className="text-sm text-gray-500">Questions</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold text-primary-600 mb-1">64</div>
          <div className="text-sm text-gray-500">Minutes</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold text-primary-600 mb-1">800</div>
          <div className="text-sm text-gray-500">Scale Score</div>
        </div>
      </div>

      <div className="card mb-8">
        <h2 className="font-semibold text-gray-900 mb-4">Test Rules</h2>
        <ul className="space-y-3">
          {[
            { icon: 'clock', text: 'You have 65 minutes to complete all 54 questions. A countdown timer will be displayed.' },
            { icon: 'eye-off', text: 'No feedback during the test. You will see your results only after submission.' },
            { icon: 'nav', text: 'You can navigate freely between questions, flag questions for review, and change answers.' },
            { icon: 'alert', text: 'The test auto-submits when time runs out. Unanswered questions count as incorrect.' },
            { icon: 'chart', text: 'You will receive an estimated SAT section score and detailed skill breakdown.' },
          ].map((rule, idx) => (
            <li key={idx} className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary-50 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-primary-600 text-xs font-bold">{idx + 1}</span>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">{rule.text}</p>
            </li>
          ))}
        </ul>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-3 mb-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="text-center">
        <button
          onClick={handleStart}
          disabled={starting}
          className="btn-primary text-lg px-8 py-3"
        >
          {starting ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Assembling Test...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
              </svg>
              Start Mock Test
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
