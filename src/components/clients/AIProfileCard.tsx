'use client';

import { useState } from 'react';
import type { AIProfile } from '@/types/client';
import { urgencyBadge, formatRelativeDate, cn } from '@/lib/utils';

export const AIProfileCard = ({ profile }: { profile: AIProfile | null }) => {
  const [completed, setCompleted] = useState<Set<string>>(new Set());

  if (!profile) return (
    <div className="surface p-6 text-center">
      <div className="w-8 h-8 rounded-lg bg-[var(--accent-muted)] flex items-center justify-center mx-auto mb-2">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-text)" strokeWidth="2"><path d="M12 2a4 4 0 0 1 4 4v2a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z"/><path d="M18 14a6 6 0 0 1-12 0"/></svg>
      </div>
      <p className="text-[12px]" style={{ color: 'var(--text-tertiary)' }}>AI profile generating...</p>
    </div>
  );

  return (
    <div className="surface overflow-hidden">
      <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-[var(--accent-muted)] flex items-center justify-center">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--accent-text)" strokeWidth="2.5"><path d="M12 2l2 7h7l-6 4 2 7-5-4-5 4 2-7-6-4h7z"/></svg>
          </div>
          <h3 className="text-[13px] font-bold" style={{ color: 'var(--text-primary)' }}>AI Insights</h3>
        </div>
        <span className="text-[10px] font-mono" style={{ color: 'var(--text-quaternary)' }}>{formatRelativeDate(profile.updatedAt)}</span>
      </div>
      <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
        <p className="text-[12px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{profile.summary}</p>
      </div>
      <div className="p-4">
        <p className="text-[11px] font-bold uppercase tracking-wider mb-2.5" style={{ color: 'var(--text-tertiary)' }}>Actions</p>
        <div className="space-y-2">
          {profile.nextActions.map((a) => {
            const isDone = completed.has(a.id);
            return (
              <div key={a.id} className={cn('p-2.5 rounded-lg border transition-all', isDone ? 'opacity-40' : 'hover:border-[var(--border-strong)]')}
                style={{ borderColor: 'var(--border)' }}>
                <div className="flex items-start gap-2">
                  <button onClick={() => setCompleted((p) => { const n = new Set(Array.from(p)); isDone ? n.delete(a.id) : n.add(a.id); return n; })}
                    className={cn('w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all',
                      isDone ? 'border-[var(--success)] bg-[var(--success)]' : 'border-[var(--border-strong)]')}>
                    {isDone && <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className={cn('badge text-[10px]', urgencyBadge[a.urgency])}>{a.urgency}</span>
                    </div>
                    <p className={cn('text-[12px] font-medium', isDone && 'line-through')} style={{ color: isDone ? 'var(--text-tertiary)' : 'var(--text-primary)' }}>{a.title}</p>
                    <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{a.description}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
