'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import clsx from 'clsx';

interface Profile {
  id: string;
  grade: number | null;
  targetScore: number | null;
  targetTestDate: string | null;
  preferences: Record<string, any>;
}

const SCORE_OPTIONS = [600, 650, 700, 750];

const WEAK_AREAS = [
  { id: 'main_idea', label: 'Main Idea & Themes' },
  { id: 'vocabulary', label: 'Vocabulary in Context' },
  { id: 'inference', label: 'Inference & Reasoning' },
  { id: 'evidence', label: 'Evidence-Based Questions' },
  { id: 'structure', label: 'Passage Structure' },
  { id: 'tone', label: 'Tone & Attitude' },
];

export default function SettingsPage() {
  const { user } = useAuthStore();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Form state
  const [targetScore, setTargetScore] = useState<number | ''>('');
  const [testDate, setTestDate] = useState('');
  const [grade, setGrade] = useState<number | ''>('');
  const [weakAreas, setWeakAreas] = useState<string[]>([]);

  useEffect(() => {
    api.get<Profile>('/users/me/profile')
      .then((res) => {
        const p = (res as any).data || res;
        setProfile(p);
        if (p.targetScore) setTargetScore(p.targetScore);
        if (p.targetTestDate) setTestDate(p.targetTestDate.split('T')[0]);
        if (p.grade) setGrade(p.grade);
        if (p.preferences?.weakAreas) setWeakAreas(p.preferences.weakAreas);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const toggleWeak = (id: string) => {
    setWeakAreas((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id],
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const body: Record<string, unknown> = {};
      if (targetScore) body.targetScore = targetScore;
      if (testDate) body.targetTestDate = testDate;
      if (grade) body.grade = grade;
      body.weakAreas = weakAreas;
      await api.put('/users/me/profile', body);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Failed to save settings:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-200 border-t-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <div className="mb-8">
        <h1 className="page-header">Settings</h1>
        <p className="text-gray-500 mt-1">Manage your profile and study preferences</p>
      </div>

      {/* Account Info */}
      <div className="card mb-6">
        <h2 className="section-header mb-4">Account</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-gray-500">Name</span>
            <span className="text-sm font-medium text-gray-900">{user?.name || 'Not set'}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-t border-gray-100">
            <span className="text-sm text-gray-500">Email</span>
            <span className="text-sm font-medium text-gray-900">{user?.email}</span>
          </div>
        </div>
      </div>

      {/* Study Goals */}
      <div className="card mb-6">
        <h2 className="section-header mb-4">Study Goals</h2>

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Target SAT Reading Score</label>
            <div className="flex gap-2">
              {SCORE_OPTIONS.map((score) => (
                <button
                  key={score}
                  onClick={() => setTargetScore(score)}
                  className={clsx(
                    'flex-1 py-2 rounded-lg text-sm font-medium border-2 transition-all',
                    targetScore === score
                      ? 'border-primary-400 bg-primary-50 text-primary-700'
                      : 'border-gray-100 text-gray-600 hover:border-gray-200',
                  )}
                >
                  {score}+
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">SAT Test Date</label>
            <input
              type="date"
              value={testDate}
              onChange={(e) => setTestDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="input w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Grade Level</label>
            <select
              value={grade}
              onChange={(e) => setGrade(e.target.value ? parseInt(e.target.value) : '')}
              className="input w-full"
            >
              <option value="">Select grade</option>
              {[9, 10, 11, 12].map((g) => (
                <option key={g} value={g}>Grade {g}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Weak Areas */}
      <div className="card mb-6">
        <h2 className="section-header mb-2">Focus Areas</h2>
        <p className="text-xs text-gray-500 mb-4">Select areas you find most challenging. We&apos;ll prioritize these in practice recommendations.</p>
        <div className="grid grid-cols-2 gap-2">
          {WEAK_AREAS.map((area) => (
            <button
              key={area.id}
              onClick={() => toggleWeak(area.id)}
              className={clsx(
                'rounded-lg border-2 p-3 text-left text-sm transition-all',
                weakAreas.includes(area.id)
                  ? 'border-primary-400 bg-primary-50 text-primary-700 font-medium'
                  : 'border-gray-100 text-gray-600 hover:border-gray-200',
              )}
            >
              {area.label}
            </button>
          ))}
        </div>
      </div>

      {/* Save */}
      <div className="flex items-center justify-end gap-3">
        {saved && (
          <span className="text-sm text-emerald-600 font-medium flex items-center gap-1 animate-fade-in">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
            Saved
          </span>
        )}
        <button onClick={handleSave} disabled={saving} className="btn-primary">
          {saving ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Saving...
            </span>
          ) : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
