'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface SessionHistory {
  id: string;
  startTime: string;
  endTime: string | null;
  exercisesCompleted: number;
  totalQuestions: number;
  correctCount: number;
}

interface ErrorPatternData {
  pattern: string;
  count: number;
  percentage: number;
}

interface TimeAnalyticsData {
  timeByDifficulty: { difficulty: number; isCorrect: boolean; avgTime: number; count: number }[];
  counterfactuals: { questionId: string; stem: string; timeSpent: number; difficulty: number; potentialQuestionsRecoverable: number; message: string }[];
  fatigueData: { windowMinutes: string; accuracy: number; totalQuestions: number }[];
  optimalThresholds: { difficulty: number; avgCorrectTime: number; avgIncorrectTime: number; recommendedMax: number }[];
}

type Tab = 'overview' | 'patterns' | 'time';

const patternConfig: Record<string, { label: string; color: string; barColor: string; description: string }> = {
  over_inference: { label: 'Over-Inference', color: 'text-purple-700', barColor: 'bg-purple-500', description: 'Reading too much into the text beyond what evidence supports' },
  polarity_trap: { label: 'Polarity Trap', color: 'text-orange-700', barColor: 'bg-orange-500', description: 'Picking answers with opposite meaning or direction' },
  evidence_mismatch: { label: 'Evidence Mismatch', color: 'text-blue-700', barColor: 'bg-blue-500', description: 'Using different evidence than what the question asks about' },
  scope_error: { label: 'Scope Error', color: 'text-red-700', barColor: 'bg-red-500', description: 'Confusing main ideas with details (too broad or narrow)' },
};

export default function ProgressPage() {
  const [tab, setTab] = useState<Tab>('overview');
  const [sessions, setSessions] = useState<SessionHistory[]>([]);
  const [scoreProjection, setScoreProjection] = useState<{ low: number; mid: number; high: number } | null>(null);
  const [errorPatterns, setErrorPatterns] = useState<ErrorPatternData[]>([]);
  const [timeAnalytics, setTimeAnalytics] = useState<TimeAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<any>('/progress/sessions'),
      api.get<any>('/progress/score'),
      api.get<any>('/progress/error-patterns'),
      api.get<any>('/progress/time-analytics'),
    ]).then(([s, p, ep, ta]) => {
      const sessData = s.data || s;
      setSessions(sessData.items || sessData);
      setScoreProjection(p.data || p);
      setErrorPatterns((ep.data || ep) as ErrorPatternData[]);
      setTimeAnalytics((ta.data || ta) as TimeAnalyticsData);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-8 w-32 bg-gray-200 rounded-lg" />
        <div className="h-48 bg-white rounded-xl border border-gray-100" />
        <div className="h-64 bg-white rounded-xl border border-gray-100" />
      </div>
    );
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'patterns', label: 'Error Patterns' },
    { key: 'time', label: 'Time Analytics' },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="page-header">Progress</h1>
        <p className="text-sm text-gray-500 mt-1">Track your SAT Reading preparation over time</p>
      </div>

      {/* Tab navigation */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 text-sm font-medium py-2 px-4 rounded-md transition-all ${
              tab === t.key
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Overview tab */}
      {tab === 'overview' && (
        <>
          {scoreProjection && (
            <div className="card">
              <h2 className="section-header mb-6">Score Projection</h2>
              <div className="flex items-end justify-center gap-12">
                <div className="text-center">
                  <div className="text-2xl font-semibold text-gray-400">{scoreProjection.low}</div>
                  <div className="text-xs text-gray-400 mt-1">Low</div>
                </div>
                <div className="text-center">
                  <div className="text-5xl font-bold text-primary-600">{scoreProjection.mid}</div>
                  <div className="text-xs font-medium text-primary-500 mt-1">Estimated</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-semibold text-gray-400">{scoreProjection.high}</div>
                  <div className="text-xs text-gray-400 mt-1">High</div>
                </div>
              </div>
              <div className="mt-6 mx-auto max-w-sm">
                <div className="bg-gray-100 rounded-full h-3 relative overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-primary-400 to-primary-600 h-3 rounded-full absolute transition-all"
                    style={{
                      left: `${((scoreProjection.low - 200) / 600) * 100}%`,
                      width: `${((scoreProjection.high - scoreProjection.low) / 600) * 100}%`,
                    }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-400 mt-1.5 font-mono">
                  <span>200</span>
                  <span>500</span>
                  <span>800</span>
                </div>
              </div>
            </div>
          )}

          <div className="card">
            <h2 className="section-header mb-5">Session History</h2>
            {sessions.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-sm text-gray-500">No sessions yet. Start practicing!</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="pb-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="pb-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Exercises</th>
                      <th className="pb-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Questions</th>
                      <th className="pb-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Accuracy</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {sessions.map((s) => {
                      const accuracy = s.totalQuestions > 0 ? Math.round((s.correctCount / s.totalQuestions) * 100) : 0;
                      const accColor = accuracy >= 80 ? 'text-emerald-600 bg-emerald-50' : accuracy >= 50 ? 'text-amber-600 bg-amber-50' : 'text-red-600 bg-red-50';
                      return (
                        <tr key={s.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="py-3 text-gray-700">{new Date(s.startTime).toLocaleDateString()}</td>
                          <td className="py-3 text-gray-700">{s.exercisesCompleted}</td>
                          <td className="py-3 text-gray-700">
                            <span className="text-gray-900 font-medium">{s.correctCount}</span>
                            <span className="text-gray-400">/{s.totalQuestions}</span>
                          </td>
                          <td className="py-3">
                            <span className={`badge ${accColor}`}>{accuracy}%</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* Error Patterns tab */}
      {tab === 'patterns' && (
        <div className="card">
          <h2 className="section-header mb-5">Error Patterns</h2>
          {errorPatterns.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
                </svg>
              </div>
              <p className="text-sm text-gray-500">Complete more exercises to see your error pattern analysis</p>
            </div>
          ) : (
            <div className="space-y-3">
              {errorPatterns.map((ep) => {
                const config = patternConfig[ep.pattern] || { label: ep.pattern, color: 'text-gray-700', barColor: 'bg-gray-500', description: '' };
                return (
                  <div key={ep.pattern} className="rounded-lg border border-gray-100 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-sm font-semibold ${config.color}`}>{config.label}</span>
                      <span className="text-sm text-gray-500">{ep.count} ({ep.percentage}%)</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2 mb-2">
                      <div className={`${config.barColor} h-2 rounded-full transition-all`} style={{ width: `${ep.percentage}%` }} />
                    </div>
                    <p className="text-xs text-gray-500">{config.description}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Time Analytics tab */}
      {tab === 'time' && (
        <>
          {!timeAnalytics || (timeAnalytics.timeByDifficulty.length === 0 && timeAnalytics.counterfactuals.length === 0) ? (
            <div className="card text-center py-8">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-sm text-gray-500">Complete more exercises to see your time analytics</p>
            </div>
          ) : (
            <>
              {/* Time vs Difficulty */}
              {timeAnalytics.optimalThresholds.length > 0 && (
                <div className="card">
                  <h2 className="section-header mb-4">Time vs Difficulty</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100">
                          <th className="pb-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Difficulty</th>
                          <th className="pb-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Avg Time (Correct)</th>
                          <th className="pb-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Avg Time (Incorrect)</th>
                          <th className="pb-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Recommended Max</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {timeAnalytics.optimalThresholds.map((t) => (
                          <tr key={t.difficulty} className="hover:bg-gray-50/50 transition-colors">
                            <td className="py-3">
                              <span className="badge bg-gray-100 text-gray-700 font-mono">{t.difficulty}</span>
                            </td>
                            <td className="py-3 text-emerald-600 font-medium">{t.avgCorrectTime}s</td>
                            <td className="py-3 text-red-500 font-medium">{t.avgIncorrectTime}s</td>
                            <td className="py-3">
                              <span className="badge bg-primary-50 text-primary-700 font-semibold">{t.recommendedMax}s</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Biggest Time Drains */}
              {timeAnalytics.counterfactuals.length > 0 && (
                <div className="card">
                  <h2 className="section-header mb-4">Biggest Time Drains</h2>
                  <p className="text-xs text-gray-500 mb-4">Wrong answers where you spent the most time. Knowing when to move on is a key test-taking skill.</p>
                  <div className="space-y-3">
                    {timeAnalytics.counterfactuals.map((cf, idx) => (
                      <div key={idx} className="rounded-lg border border-gray-100 p-4 bg-gray-50/50">
                        <div className="flex items-start gap-3">
                          <div className="shrink-0 mt-0.5">
                            <span className="badge bg-amber-100 text-amber-700 font-mono text-xs">{cf.timeSpent}s</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-700 line-clamp-2">{cf.stem}</p>
                            <div className="flex items-center gap-2 mt-1.5">
                              <span className="badge bg-gray-100 text-gray-600 text-[10px]">Difficulty {cf.difficulty}</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1.5">{cf.message}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Fatigue Curve */}
              {timeAnalytics.fatigueData.length > 0 && (
                <div className="card">
                  <h2 className="section-header mb-4">Fatigue Curve</h2>
                  {(() => {
                    const avgAccuracy = timeAnalytics.fatigueData.length > 0
                      ? Math.round(timeAnalytics.fatigueData.reduce((sum, d) => sum + d.accuracy, 0) / timeAnalytics.fatigueData.length)
                      : 0;
                    return (
                      <p className="text-xs text-gray-500 mb-4">
                        Your average accuracy is {avgAccuracy}%. Windows highlighted in red show where accuracy drops below average.
                      </p>
                    );
                  })()}
                  <div className="space-y-2">
                    {timeAnalytics.fatigueData.map((fd) => {
                      const avgAcc = timeAnalytics.fatigueData.reduce((sum, d) => sum + d.accuracy, 0) / timeAnalytics.fatigueData.length;
                      const isBelowAvg = fd.accuracy < avgAcc;
                      return (
                        <div key={fd.windowMinutes} className="flex items-center gap-3">
                          <span className="text-xs text-gray-500 w-20 shrink-0 font-mono">{fd.windowMinutes}m</span>
                          <div className="flex-1 bg-gray-100 rounded-full h-5 relative overflow-hidden">
                            <div
                              className={`h-5 rounded-full transition-all ${isBelowAvg ? 'bg-red-400' : 'bg-emerald-400'}`}
                              style={{ width: `${fd.accuracy}%` }}
                            />
                          </div>
                          <span className={`text-xs font-medium w-12 text-right ${isBelowAvg ? 'text-red-600' : 'text-emerald-600'}`}>
                            {fd.accuracy}%
                          </span>
                          <span className="text-[10px] text-gray-400 w-8 text-right">n={fd.totalQuestions}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Time Thresholds */}
              {timeAnalytics.optimalThresholds.length > 0 && (
                <div className="card">
                  <h2 className="section-header mb-4">Time Thresholds</h2>
                  <p className="text-xs text-gray-500 mb-4">Recommended maximum time per question, based on your performance data.</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {timeAnalytics.optimalThresholds.map((t) => (
                      <div key={t.difficulty} className="rounded-lg border border-gray-100 p-4 text-center">
                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Difficulty {t.difficulty}</div>
                        <div className="text-2xl font-bold text-primary-600">{t.recommendedMax}s</div>
                        <div className="text-[10px] text-gray-400 mt-1">
                          Correct avg: {t.avgCorrectTime}s | Wrong avg: {t.avgIncorrectTime}s
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
