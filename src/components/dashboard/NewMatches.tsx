'use client';

import { useState } from 'react';
import type { PropertyMatch } from '@/types/client';
import { PROPERTY_TYPE_LABELS } from '@/types/client';
import { formatCurrency, scoreColor, scoreBg, cn } from '@/lib/utils';

export const NewMatches = ({ matches }: { matches: PropertyMatch[] }) => {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const visible = matches.filter((m) => !dismissed.has(m.id));

  return (
    <div className="surface overflow-hidden">
      <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
        <h2 className="text-[13px] font-bold" style={{ color: 'var(--text-primary)' }}>Property Matches</h2>
        <span className="text-[11px] font-mono" style={{ color: 'var(--text-tertiary)' }}>{visible.length}</span>
      </div>
      <div className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
        {visible.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm" style={{ color: 'var(--text-tertiary)' }}>No new matches</div>
        ) : visible.map((m, i) => (
          <div key={m.id} className="px-4 py-3 hover:bg-[var(--surface-hover)] transition-colors animate-in" style={{ animationDelay: `${i * 40}ms` }}>
            <div className="flex items-start gap-3">
              <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center text-[13px] font-bold font-mono', scoreBg(m.matchScore), scoreColor(m.matchScore))}>
                {m.matchScore}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[13px] font-semibold" style={{ color: 'var(--text-primary)' }}>{m.address}</span>
                  <span className={cn('badge text-[10px]', m.status === 'new' ? 'badge-success' : m.status === 'sent' ? 'badge-info' : 'badge-neutral')}>
                    {m.status}
                  </span>
                </div>
                <p className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
                  {m.city} · {m.bedrooms}/{m.bathrooms} · {m.sqft.toLocaleString()}sf · {PROPERTY_TYPE_LABELS[m.propertyType]}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[12px] font-bold font-mono" style={{ color: 'var(--accent-text)' }}>
                    {formatCurrency(m.price, m.price < 10000)}
                  </span>
                  <span className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>→ {m.clientName}</span>
                </div>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {m.matchReasons.slice(0, 4).map((r) => (
                    <span key={r} className="pill text-[10px]">{r}</span>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-1.5 shrink-0">
                <button className="btn btn-primary btn-xs">Send</button>
                <button onClick={() => setDismissed((p) => new Set([...Array.from(p), m.id]))} className="btn btn-ghost btn-xs">Skip</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
