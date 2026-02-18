'use client';

import { useEffect, useState, useMemo } from 'react';
import { BarChart3, Users, TrendingUp, Clock, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import type { DashboardStats, Client } from '@/types/client';
import { LIFECYCLE_LABELS } from '@/types/client';
import * as svc from '@/services/mock-service';
import { useDark } from '@/hooks/useDark';

const StatCard = ({ label, value, change, positive, icon: Icon }: { label: string; value: string; change: string; positive: boolean; icon: typeof Users }) => (
  <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl rounded-xl border border-amber-200/25 dark:border-gray-800/60 p-5 shadow-sm">
    <div className="flex items-center justify-between mb-3">
      <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">{label}</span>
      <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center">
        <Icon size={16} className="text-teal-600 dark:text-teal-400" />
      </div>
    </div>
    <p className="text-2xl font-bold text-gray-800 dark:text-gray-100 font-data mb-1">{value}</p>
    <div className="flex items-center gap-1">
      {positive ? (
        <ArrowUpRight size={14} className="text-emerald-500" />
      ) : (
        <ArrowDownRight size={14} className="text-red-500" />
      )}
      <span className={`text-xs font-medium ${positive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>{change}</span>
    </div>
  </div>
);

const BarSegment = ({ label, value, max, color }: { label: string; value: number; max: number; color: string }) => (
  <div className="flex items-center gap-3">
    <span className="text-xs text-gray-500 dark:text-gray-400 w-28 shrink-0 truncate">{label}</span>
    <div className="flex-1 h-6 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800">
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{ width: `${Math.max((value / max) * 100, 8)}%`, backgroundColor: color }}
      />
    </div>
    <span className="text-xs font-bold text-gray-800 dark:text-gray-100 font-data w-6 text-right">{value}</span>
  </div>
);

export default function AnalyticsPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const dark = useDark();

  const stageColors = useMemo(() => [
    dark ? '#2dd4bf' : '#0d9488',
    dark ? '#5eead4' : '#14b8a6',
    '#f59e0b',
    '#8b5cf6',
    '#22c55e',
    '#f97316',
    '#94a3b8',
  ], [dark]);

  useEffect(() => {
    Promise.all([svc.getDashboardStats(), svc.getClients()])
      .then(([s, c]) => { setStats(s); setClients(c); setLoading(false); })
      .catch((err) => { console.error('Failed to load analytics data:', err); setLoading(false); });
  }, []);

  if (loading || !stats) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <p className="text-sm text-gray-400">Loading...</p>
    </div>
  );

  // Pipeline counts
  const stageCounts: Record<string, number> = {};
  clients.forEach((c) => {
    const label = LIFECYCLE_LABELS[c.lifecycleStage];
    stageCounts[label] = (stageCounts[label] || 0) + 1;
  });
  const maxStage = Math.max(...Object.values(stageCounts), 1);

  // Client type counts
  const typeCounts: Record<string, number> = {};
  clients.forEach((c) => {
    const label = c.clientType.charAt(0).toUpperCase() + c.clientType.slice(1);
    typeCounts[label] = (typeCounts[label] || 0) + 1;
  });
  const maxType = Math.max(...Object.values(typeCounts), 1);

  return (
    <>
      <header
        className="px-4 lg:px-8 py-3 lg:py-4 border-b border-[#1E293B]/50 flex items-center justify-between"
        style={{ background: 'linear-gradient(135deg, #475569 0%, #1E293B 50%, #475569 100%)' }}
      >
        <div>
          <h1 className="text-lg text-white" style={{ fontWeight: 600, letterSpacing: '-0.025em' }}>Analytics</h1>
          <p className="text-xs text-slate-400 mt-0.5">Performance overview</p>
        </div>
      </header>
      <div className="px-4 lg:px-8 py-4 lg:py-6">

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Active Clients" value={String(stats.totalActiveClients)} change="+2 this week" positive icon={Users} />
        <StatCard label="Conversion Rate" value={`${Math.round(stats.conversionRate * 100)}%`} change="+5% vs last month" positive icon={TrendingUp} />
        <StatCard label="Avg Response" value={stats.avgResponseTime} change="-12min vs last week" positive icon={Clock} />
        <StatCard label="New Leads" value={String(stats.leadsThisWeek)} change="1 this week" positive icon={ArrowUpRight} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pipeline Distribution */}
        <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl rounded-xl border border-amber-200/25 dark:border-gray-800/60 shadow-sm p-5">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-1.5 h-5 rounded-full bg-teal-500" />
            <h2 className="text-sm font-bold text-gray-800 dark:text-gray-100 tracking-tight">Pipeline Distribution</h2>
          </div>
          <div className="space-y-3">
            {Object.entries(stageCounts).map(([label, value], i) => (
              <BarSegment key={label} label={label} value={value} max={maxStage} color={stageColors[i % stageColors.length]} />
            ))}
          </div>
        </div>

        {/* Client Types */}
        <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl rounded-xl border border-amber-200/25 dark:border-gray-800/60 shadow-sm p-5">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-1.5 h-5 rounded-full bg-teal-400" />
            <h2 className="text-sm font-bold text-gray-800 dark:text-gray-100 tracking-tight">Client Types</h2>
          </div>
          <div className="space-y-3">
            {Object.entries(typeCounts).map(([label, value], i) => (
              <BarSegment key={label} label={label} value={value} max={maxType} color={stageColors[i % stageColors.length]} />
            ))}
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
