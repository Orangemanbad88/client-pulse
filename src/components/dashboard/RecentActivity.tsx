'use client';

import type { Activity } from '@/types/client';
import { ACTIVITY_ICONS } from '@/types/client';
import { formatRelativeDate } from '@/lib/utils';

export const RecentActivity = ({ activities }: { activities: Activity[] }) => (
  <div className="surface overflow-hidden">
    <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
      <h2 className="text-[13px] font-bold" style={{ color: 'var(--text-primary)' }}>Recent Activity</h2>
    </div>
    <div className="divide-y max-h-[360px] overflow-y-auto" style={{ borderColor: 'var(--border-subtle)' }}>
      {activities.map((a, i) => (
        <div key={a.id} className="px-4 py-2.5 hover:bg-[var(--surface-hover)] transition-colors animate-in" style={{ animationDelay: `${i * 30}ms` }}>
          <div className="flex items-start gap-2.5">
            <span className="text-sm mt-0.5">{ACTIVITY_ICONS[a.type]}</span>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-medium" style={{ color: 'var(--text-primary)' }}>{a.title}</p>
              <p className="text-[11px] mt-0.5 line-clamp-1" style={{ color: 'var(--text-tertiary)' }}>{a.description}</p>
              {a.propertyAddress && <p className="text-[11px] mt-0.5 font-mono" style={{ color: 'var(--accent-text)' }}>{a.propertyAddress}</p>}
            </div>
            <span className="text-[10px] font-mono shrink-0" style={{ color: 'var(--text-quaternary)' }}>{formatRelativeDate(a.timestamp)}</span>
          </div>
        </div>
      ))}
    </div>
  </div>
);
