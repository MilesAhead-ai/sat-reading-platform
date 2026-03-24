'use client';

import { useState, useRef, useEffect } from 'react';
import { api } from '@/lib/api';

interface Message {
  role: 'student' | 'tutor';
  content: string;
  timestamp: string;
}

interface SuggestedTopic {
  skillId: string;
  skillName: string;
  prompt: string;
}

interface PastSession {
  id: string;
  createdAt: string;
  endedAt: string;
  focusSkillId: string | null;
}

export default function CoachingPage() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [suggestedTopics, setSuggestedTopics] = useState<SuggestedTopic[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [studentHasReplied, setStudentHasReplied] = useState(false);
  const [pastSessions, setPastSessions] = useState<PastSession[]>([]);
  const [viewingPastSession, setViewingPastSession] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.get<any>('/coaching/sessions')
      .then((res) => setPastSessions((res.data || res) as PastSession[]))
      .catch(() => {});
  }, []);

  const viewPastSession = async (id: string) => {
    setLoading(true);
    try {
      const res = await api.get<any>(`/coaching/sessions/${id}`);
      const data = res.data || res;
      setSessionId(id);
      setMessages(data.messages || []);
      setViewingPastSession(true);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const endCurrentSession = async () => {
    if (sessionId) {
      await api.post(`/coaching/session/${sessionId}/end`);
      // Refresh past sessions list
      api.get<any>('/coaching/sessions')
        .then((res) => setPastSessions((res.data || res) as PastSession[]))
        .catch(() => {});
    }
    setSessionId(null);
    setMessages([]);
    setViewingPastSession(false);
  };

  const startSession = async () => {
    setLoading(true);
    try {
      const res = await api.post<any>('/coaching/session/start');
      const data = res.data || res;
      setSessionId(data.id);
      setSuggestedTopics(data.suggestedTopics || []);
      setStudentHasReplied(false);

      const openingMessages: Message[] = (data.messages || []).map(
        (m: any) => ({
          role: m.role,
          content: m.content,
          timestamp: m.timestamp,
        }),
      );
      setMessages(openingMessages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (content?: string) => {
    const text = content || input.trim();
    if (!text || !sessionId) return;
    const userMsg: Message = {
      role: 'student',
      content: text,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setStudentHasReplied(true);
    setLoading(true);
    try {
      const res = await api.post<any>(
        `/coaching/session/${sessionId}/message`,
        { content: text },
      );
      const data = res.data || res;
      setMessages((prev) => [
        ...prev,
        {
          role: 'tutor',
          content: data.reply,
          timestamp: new Date().toISOString(),
        },
      ]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!sessionId) {
    return (
      <div className="max-w-lg mx-auto text-center py-16 animate-fade-in">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-violet-600 flex items-center justify-center mx-auto mb-5 shadow-lg">
          <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
          </svg>
        </div>
        <h1 className="page-header">AI Reading Coach</h1>
        <p className="text-gray-500 mt-2 max-w-sm mx-auto leading-relaxed">
          Chat with your personal AI tutor about SAT Reading strategies, get help with specific question types, or ask for advice on your weak areas.
        </p>
        <button
          onClick={startSession}
          className="btn-primary text-lg px-8 py-3 mt-8 flex items-center gap-2 mx-auto"
          disabled={loading}
        >
          {loading ? (
            <>
              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Starting...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
              Start Coaching Session
            </>
          )}
        </button>

        {pastSessions.length > 0 && (
          <div className="mt-10 w-full max-w-md mx-auto text-left">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Past Sessions</h3>
            <div className="space-y-2">
              {pastSessions.map((s) => (
                <button
                  key={s.id}
                  onClick={() => viewPastSession(s.id)}
                  className="w-full card-hover !p-4 flex items-center justify-between text-left group"
                >
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {new Date(s.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {new Date(s.createdAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                      {s.endedAt && ` - ${new Date(s.endedAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`}
                    </div>
                  </div>
                  <svg className="w-4 h-4 text-gray-300 group-hover:text-gray-400 transition-colors" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto flex flex-col h-[calc(100vh-10rem)] animate-fade-in">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-violet-600 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
          </div>
          <h1 className="text-lg font-semibold text-gray-900">AI Reading Coach</h1>
        </div>
        <button
          onClick={viewingPastSession ? () => { setSessionId(null); setMessages([]); setViewingPastSession(false); } : endCurrentSession}
          className="btn-ghost !py-1.5 !px-3 text-sm flex items-center gap-1.5 text-gray-500"
        >
          {viewingPastSession ? (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
              Back
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
              </svg>
              End Session
            </>
          )}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 mb-4 scrollbar-thin rounded-xl bg-gray-50/50 border border-gray-100 p-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'student' ? 'justify-end' : 'justify-start'} animate-fade-in`}
          >
            {msg.role === 'tutor' && (
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-500 to-violet-600 flex items-center justify-center shrink-0 mr-2 mt-1">
                <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
              </div>
            )}
            <div
              className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                msg.role === 'student'
                  ? 'bg-primary-600 text-white rounded-br-md'
                  : 'bg-white border border-gray-200 text-gray-800 shadow-sm rounded-bl-md'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {!studentHasReplied && suggestedTopics.length > 0 && !loading && (
          <div className="flex flex-wrap gap-2 px-1 pt-2">
            {suggestedTopics.map((topic) => (
              <button
                key={topic.skillId}
                onClick={() => sendMessage(topic.prompt)}
                className="rounded-full border border-primary-200 bg-white px-4 py-2 text-sm text-primary-700 hover:bg-primary-50 hover:border-primary-300 transition-all shadow-sm"
              >
                {topic.skillName}
              </button>
            ))}
          </div>
        )}

        {loading && (
          <div className="flex justify-start animate-fade-in">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-500 to-violet-600 flex items-center justify-center shrink-0 mr-2 mt-1">
              <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
              <div className="flex gap-1.5">
                <div className="w-2 h-2 bg-gray-300 rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-gray-300 rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-gray-300 rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {viewingPastSession ? (
        <div className="text-center text-sm text-gray-400 py-2">
          This is a read-only view of a past session.
        </div>
      ) : (
        <div className="flex gap-2">
          <input
            type="text"
            className="input flex-1 !rounded-xl"
            placeholder="Ask about SAT Reading strategies..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            disabled={loading}
          />
          <button
            onClick={() => sendMessage()}
            className="btn-primary !rounded-xl !px-4 flex items-center gap-1.5"
            disabled={loading || !input.trim()}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
            </svg>
            Send
          </button>
        </div>
      )}
    </div>
  );
}
