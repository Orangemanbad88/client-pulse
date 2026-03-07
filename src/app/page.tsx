'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Users, Clock, AlertTriangle, TrendingUp, ArrowUpRight, Bell, Plus, Filter } from "lucide-react";
import { useDark } from '@/hooks/useDark';
import { SparkLine } from '@/components/ui/SparkLine';
import { MiniDonut } from '@/components/ui/MiniDonut';
import { DashboardActions } from '@/components/dashboard/DashboardActions';
import { DashboardMatches } from '@/components/dashboard/DashboardMatches';
import type { DashboardStats, Trigger, PropertyMatch } from '@/types/client';

const useCountUp = (target: number, duration = 1200) => {
  const [value, setValue] = useState(0);
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const start = performance.now();
    const step = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration]);
  return value;
};

const AnimatedNumber = ({ value }: { value: number }) => {
  const count = useCountUp(value);
  return <span className="font-data animate-count-up">{count}</span>;
};

export default function DashboardPage() {
  const [time, setTime] = useState(new Date());
  const [mounted, setMounted] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [triggers, setTriggers] = useState<Trigger[]>([]);
  const [matches, setMatches] = useState<PropertyMatch[]>([]);
  const [error, setError] = useState(false);
  const dark = useDark();

  useEffect(() => {
    setMounted(true);
    const t = setInterval(() => setTime(new Date()), 60000);

    const loadData = async () => {
      try {
        const svc = await import('@/services');
        const [s, tr, ma] = await Promise.all([
          svc.getDashboardStats(),
          svc.getAllTriggers(),
          svc.getAllMatches(),
        ]);
        setStats(s);
        setTriggers(tr);
        setMatches(ma);
      } catch {
        setError(true);
      }
    };
    loadData();

    return () => clearInterval(t);
  }, []);

  const handleTriggerComplete = useCallback(async (id: string) => {
    const svc = await import('@/services');
    await svc.updateTriggerStatus(id, 'completed');
  }, []);

  const handleMatchSend = useCallback(async (id: string) => {
    const svc = await import('@/services');
    await svc.updateMatchStatus(id, 'sent');
  }, []);

  const greeting = time.getHours() < 12 ? "Good morning" : time.getHours() < 17 ? "Good afternoon" : "Good evening";

  const metricCards = useMemo(() => {
    if (!stats) return [];
    return [
      { label: "Active Clients", value: stats.totalActiveClients, change: `${stats.leadsThisWeek} new this week`, icon: Users, sparkData: [4, 5, 5, 6, 6, 7, stats.totalActiveClients] },
      { label: "Pending Actions", value: stats.pendingFollowUps, change: `${stats.pendingFollowUps} to review`, icon: Clock, sparkData: [5, 4, 6, 3, 4, 3, stats.pendingFollowUps] },
      { label: "Lease Expirations", value: stats.leaseExpirationsThisMonth, change: "this month", icon: AlertTriangle, sparkData: [3, 2, 2, 1, 2, 1, stats.leaseExpirationsThisMonth] },
      { label: "New Matches", value: stats.matchesPending, change: "pending review", icon: TrendingUp, sparkData: [1, 0, 2, 1, 3, 2, stats.matchesPending] },
      { label: "Leads This Week", value: stats.leadsThisWeek, change: `${stats.conversionRate ? Math.round(stats.conversionRate * 100) : 0}% conversion`, icon: ArrowUpRight, sparkData: [2, 1, 3, 2, 1, 0, stats.leadsThisWeek] },
    ];
  }, [stats]);

  const donutSegments = useMemo(() => [
    { label: "Active", value: stats?.totalActiveClients || 0, color: dark ? "#D4A84B" : "#B8860B" },
    { label: "Searching", value: stats?.matchesPending || 0, color: "#C9A227" },
    { label: "Pending", value: stats?.pendingFollowUps || 0, color: dark ? "#8B6914" : "#FDE8B8" },
  ], [dark, stats]);

  if (error && !stats) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <TrendingUp size={32} className="text-gray-300 dark:text-gray-700 mx-auto mb-3" />
        <p className="text-sm text-gray-400 mb-1">Unable to load dashboard</p>
        <p className="text-xs text-gray-400/60">Check your connection and try refreshing</p>
      </div>
    </div>
  );

  return (
    <>
      {/* Header */}
      <header className="sticky top-0 z-10 hidden lg:block border-b border-[#1E293B]/50" style={{ background: 'linear-gradient(135deg, #334155 0%, #1E293B 50%, #334155 100%)' }}>
        <div className="px-4 lg:px-8 py-3 lg:py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold to-gold-muted flex items-center justify-center shadow-sm shadow-gold/15 shrink-0">
              <span className="text-white font-bold text-sm">TM</span>
            </div>
            <div className="min-w-0">
              <h1 className="text-lg text-white truncate" style={{ fontWeight: 600, letterSpacing: '-0.025em' }}>{greeting}, <span className="font-bold">Tom</span></h1>
              <p className="text-xs text-slate-400">
                {time.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            <button className="relative p-2.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 transition-colors">
              <Bell size={16} className="text-gold-light" />
              {triggers.filter((t) => t.status === 'fired').length > 0 && (
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full ring-2 ring-slate-800 animate-soft-pulse" />
              )}
            </button>
            <a href="/clients?new=true" className="flex items-center gap-2 bg-gold hover:bg-gold-muted text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors shadow-sm shadow-gold/20 active:scale-[0.97]">
              <Plus size={14} /> Add Client
            </a>
          </div>
        </div>
      </header>

      <div className="px-4 lg:px-8 py-4 lg:py-6">
        {/* Metric Cards */}
        <div className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 lg:gap-4 mb-4 lg:mb-6 ${mounted ? 'stagger-children' : ''}`}>
          {metricCards.map((card) => (
            <div key={card.label} className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl rounded-xl border border-amber-200/25 dark:border-gray-800/60 p-4 shadow-sm shadow-gold/5 dark:shadow-none hover:shadow-md hover:shadow-gold/10 dark:hover:shadow-gold/5 hover:scale-[1.02] transition-all duration-200 cursor-default">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">{card.label}</span>
                <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center">
                  <card.icon size={14} className="text-gold dark:text-gold-light" />
                </div>
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <span className="text-2xl lg:text-3xl font-bold text-gold-muted dark:text-gold-light">
                    <AnimatedNumber value={card.value} />
                  </span>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{card.change}</p>
                </div>
                <SparkLine data={card.sparkData} color={dark ? "#D4A84B" : "#B8860B"} />
              </div>
            </div>
          ))}
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
          {/* Today's Actions */}
          <div className={`lg:col-span-7 ${mounted ? 'animate-fade-slide-up' : ''}`} style={{ animationDelay: '300ms', animationFillMode: 'backwards' }}>
            <DashboardActions triggers={triggers} onComplete={handleTriggerComplete} />
          </div>

          {/* Right Column */}
          <div className={`lg:col-span-5 flex flex-col gap-4 lg:gap-6 ${mounted ? 'animate-fade-slide-up' : ''}`} style={{ animationDelay: '400ms', animationFillMode: 'backwards' }}>
            {/* Client Overview Donut */}
            <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl rounded-xl border border-amber-200/25 dark:border-gray-800/60 shadow-sm overflow-hidden">
              <div className="px-5 py-4 flex items-center gap-3" style={{ background: 'linear-gradient(135deg, #334155 0%, #1E293B 50%, #334155 100%)' }}>
                <div className="w-1.5 h-5 rounded-full bg-gold-light" />
                <h2 className="text-sm font-bold text-white tracking-tight">Client Overview</h2>
              </div>
              <div className="p-5 flex items-center gap-6">
                <MiniDonut segments={donutSegments} dark={dark} />
                <div className="flex-1 space-y-3">
                  {donutSegments.map((seg) => (
                    <div key={seg.label} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: seg.color }} />
                        <span className="text-sm text-gray-600 dark:text-gray-400">{seg.label}</span>
                      </div>
                      <span className="text-sm font-bold text-gray-800 dark:text-gray-100 font-data">{seg.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Property Matches */}
            <DashboardMatches matches={matches} onSend={handleMatchSend} />
          </div>
        </div>
      </div>
    </>
  );
}
