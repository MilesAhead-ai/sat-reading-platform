'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { api } from '@/lib/api';

interface KBEntry {
  id: string;
  type: string;
  title: string;
  content: string;
  tags: string[];
}

const typeLabels: Record<string, string> = { strategy: 'Strategy', guide: 'Guide', vocabulary: 'Vocabulary', tip_template: 'Tip Template' };
const typeColors: Record<string, string> = {
  strategy: 'bg-blue-50 text-blue-700 border-blue-200',
  guide: 'bg-purple-50 text-purple-700 border-purple-200',
  vocabulary: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  tip_template: 'bg-amber-50 text-amber-700 border-amber-200',
};

export default function KnowledgeBasePage() {
  const [entries, setEntries] = useState<KBEntry[]>([]);
  const [query, setQuery] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const search = useCallback(async (q?: string, type?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      const searchQuery = q ?? query;
      const searchType = type ?? selectedType;
      if (searchQuery) params.set('q', searchQuery);
      if (searchType) params.set('type', searchType);
      const res = await api.get<any>(`/knowledge-base/search?${params}`);
      setEntries((res.data || res) as KBEntry[]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [query, selectedType]);

  // Initial load
  useEffect(() => { search(); }, []);

  // Auto-search when type filter changes
  useEffect(() => { search(); }, [selectedType]);

  // Debounced auto-search on query input
  const debounceRef = useRef<NodeJS.Timeout>();
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { search(); }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-header">Knowledge Base</h1>
        <p className="text-sm text-gray-500 mt-1">Strategies, guides, and vocabulary for SAT Reading</p>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            className="input !pl-10"
            placeholder="Search strategies, guides, vocabulary..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && search()}
          />
        </div>
        <select className="input !w-40" value={selectedType} onChange={(e) => setSelectedType(e.target.value)}>
          <option value="">All Types</option>
          <option value="strategy">Strategy</option>
          <option value="guide">Guide</option>
          <option value="vocabulary">Vocabulary</option>
        </select>
        <button onClick={() => search()} className="btn-primary">Search</button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-white rounded-xl border border-gray-100 animate-pulse" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
          </div>
          <p className="text-sm text-gray-500">
            {query
              ? `No results for "${query}"${selectedType ? ` in ${typeLabels[selectedType] || selectedType}` : ''}`
              : selectedType
                ? `No ${typeLabels[selectedType] || selectedType} entries found`
                : 'No entries found. Try a different search.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-gray-500 font-medium">
            {query
              ? `${entries.length} result${entries.length !== 1 ? 's' : ''} for "${query}"${selectedType ? ` in ${typeLabels[selectedType] || selectedType}` : ''}`
              : `Showing ${entries.length} entries${selectedType ? ` in ${typeLabels[selectedType] || selectedType}` : ''}`}
          </p>
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="card-hover cursor-pointer"
              onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className={`badge border ${typeColors[entry.type] || 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                    {typeLabels[entry.type] || entry.type}
                  </span>
                  <h3 className="font-medium text-gray-900">{entry.title}</h3>
                </div>
                <svg
                  className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${expandedId === entry.id ? 'rotate-180' : ''}`}
                  fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </div>
              {expandedId === entry.id && (
                <div className="mt-4 text-sm text-gray-700 whitespace-pre-wrap border-t border-gray-100 pt-4 leading-relaxed animate-fade-in">
                  {entry.content}
                </div>
              )}
              {entry.tags.length > 0 && (
                <div className="flex gap-1.5 mt-3">
                  {entry.tags.map((tag) => (
                    <span key={tag} className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-md">{tag}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
