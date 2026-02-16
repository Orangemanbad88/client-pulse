'use client';

import { useState } from 'react';
import type { Trigger, AIProfile } from '@/types/client';
import { urgencyBadge, cn } from '@/lib/utils';

interface Props { triggers: Trigger[]; aiProfiles: AIProfile[]; }

export const TodaysActions = ({ triggers, aiProfiles }: Props) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [done, setDone] = useState<Set<string>>(new Set());

  type Item = { id: string; client: string; title: string; desc: string; urgency: 'critical' | 'high' | 'medium' | 'low'; draft?: string; };
  const items: Item[] = [];

  triggers.filter((t) => t.status === 'fired').forEach((t) => {
    items.push({ id: t.id, client: t.clientName, title: t.title, desc: t.description, urgency: t.urgency, draft: t.messageDraft });
  });
  aiProfiles.forEach((p) => p.nextActions.filter((a) => !a.completed).forEach((a) => {
    if (!items.find((x) => x.title === a.title)) {
      items.push({ id: a.id, client: '', title: a.title, desc: a.description, urgency: a.urgency });
    }
  }));

  const ord = { critical: 0, high: 1, medium: 2, low: 3 };
  items.sort((a, b) => ord[a.urgency] - ord[b.urgency]);
  const visible = items.filter((i) => !done.has(i.id));

  return (
    <div className="surface overflow-hidden">
      <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
        <h2 className="text-[13px] font-bold" style={{ color: 'var(--text-primary)' }}>Today&apos;s Actions</h2>
        <span className="badge-accent badge text-[10px] font-mono">{visible.length}</span>
      </div>
      <div className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
        {visible.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm" style={{ color: 'var(--text-tertiary)' }}>All caught up ✓</div>
        ) : visible.slice(0, 7).map((item, i) => (
          <div key={item.id} className="px-4 py-3 hover:bg-[var(--surface-hover)] transition-colors animate-in" style={{ animationDelay: `${i * 40}ms` }}>
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={cn('badge', urgencyBadge[item.urgency])}>{item.urgency}</span>
                  {item.client && <span className="text-[11px] font-semibold" style={{ color: 'var(--accent-text)' }}>{item.client}</span>}
                </div>
                <p className="text-[13px] font-semibold" style={{ color: 'var(--text-primary)' }}>{item.title}</p>
                <p className="text-[12px] mt-0.5 line-clamp-2" style={{ color: 'var(--text-tertiary)' }}>{item.desc}</p>
                {item.draft && (
                  <div className="mt-2">
                    <button onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                      className="text-[11px] font-medium hover:underline" style={{ color: 'var(--accent-text)' }}>
                      {expandedId === item.id ? '▾ Hide draft' : '▸ Draft message'}
                    </button>
                    {expandedId === item.id && (
                      <div className="mt-1.5 p-2.5 rounded-lg text-[12px] italic animate-in" style={{ background: 'var(--bg-1)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                        &ldquo;{item.draft}&rdquo;
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-1.5 shrink-0">
                <button onClick={() => setDone((p) => new Set([...Array.from(p), item.id]))} className="btn btn-secondary btn-xs">Done</button>
                {item.draft && <button className="btn btn-primary btn-xs">Send</button>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
