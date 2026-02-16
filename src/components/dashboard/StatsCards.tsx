'use client';
import type { DashboardStats } from '@/types/client';

const cards = [
  { key: 'totalActiveClients' as const, label: 'Active Clients', accent: 'var(--accent)' },
  { key: 'pendingFollowUps' as const, label: 'Pending Actions', accent: 'var(--warning)' },
  { key: 'leaseExpirationsThisMonth' as const, label: 'Lease Expirations', accent: 'var(--danger)' },
  { key: 'matchesPending' as const, label: 'New Matches', accent: 'var(--success)' },
  { key: 'leadsThisWeek' as const, label: 'Leads This Week', accent: 'var(--info)' },
];

export const StatsCards = ({ stats }: { stats: DashboardStats }) => (
  <div className="grid grid-cols-5 gap-3 stagger">
    {cards.map((c) => (
      <div key={c.key} className="surface p-4 group hover:border-[var(--border-strong)] transition-all">
        <p className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-tertiary)' }}>{c.label}</p>
        <p className="text-2xl font-bold tracking-tight" style={{ color: c.accent, fontFamily: 'var(--font-mono)' }}>
          {stats[c.key]}
        </p>
      </div>
    ))}
  </div>
);
