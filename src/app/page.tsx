'use client';

import { useState, useEffect, useRef, useMemo } from "react";
import { Users, Clock, AlertTriangle, TrendingUp, ArrowUpRight, Send, Check, ChevronRight, Phone, Mail, MessageSquare, Filter, Bell, Plus } from "lucide-react";
import { useDark } from '@/hooks/useDark';
import { MatchScore } from '@/components/ui/MatchScore';

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

const Avatar = ({ name, size = 36 }: { name: string; size?: number }) => {
  const initials = name.split(" ").map(n => n[0]).join("");
  return (
    <div
      className="bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 rounded-full flex items-center justify-center font-semibold shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {initials}
    </div>
  );
};

type BadgeVariant = 'critical' | 'high' | 'medium' | 'new' | 'sent' | 'default';
const Badge = ({ children, variant = "default" }: { children: React.ReactNode; variant?: BadgeVariant }) => {
  const styles: Record<BadgeVariant, string> = {
    critical: "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-800/30 animate-badge-pulse",
    high: "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-800/30",
    medium: "bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400 border border-teal-100 dark:border-teal-800/30",
    new: "bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400 border border-teal-100 dark:border-teal-800/30",
    sent: "bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700",
    default: "bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700",
  };
  return (
    <span className={`${styles[variant]} text-xs font-medium px-2 py-0.5 rounded-full`}>
      {children}
    </span>
  );
};

const MiniDonut = ({ segments, size = 120, dark }: { segments: { label: string; value: number; color: string }[]; size?: number; dark: boolean }) => {
  const total = segments.reduce((s, seg) => s + seg.value, 0) || 1;
  const r = 42;
  const circ = 2 * Math.PI * r;
  let accum = 0;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={r} fill="none" stroke={dark ? "#134e4a" : "#f0fdfa"} strokeWidth="14" />
        {segments.map((seg) => {
          const pct = seg.value / total;
          const dashLen = pct * circ;
          const dashOff = -accum * circ;
          accum += pct;
          return (
            <circle key={seg.label} cx="60" cy="60" r={r} fill="none" stroke={seg.color}
              strokeWidth="14" strokeDasharray={`${dashLen} ${circ - dashLen}`}
              strokeDashoffset={dashOff}
              style={{ transform: "rotate(-90deg)", transformOrigin: "center" }}
            />
          );
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold font-data text-gray-800 dark:text-gray-100">{total}</span>
        <span className="text-xs text-gray-400 dark:text-gray-500">total</span>
      </div>
    </div>
  );
};

const ProgressBar = ({ current, total, color = "#0d9488" }: { current: number; total: number; color?: string }) => {
  const pct = Math.min((current / total) * 100, 100);
  return (
    <div className="w-full h-1.5 bg-teal-50 dark:bg-teal-900/20 rounded-full overflow-hidden">
      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: color }} />
    </div>
  );
};

const SparkLine = ({ data, color = "#0d9488", width = 80, height = 28 }: { data: number[]; color?: string; width?: number; height?: number }) => {
  if (data.length < 2) return <svg width={width} height={height} className="shrink-0" />;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg width={width} height={height} className="shrink-0">
      <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

const metricCards = [
  { label: "Active Clients", value: 8, change: "+2 this week", icon: Users, sparkData: [4, 5, 5, 6, 6, 7, 8] },
  { label: "Pending Actions", value: 3, change: "2 critical", icon: Clock, sparkData: [5, 4, 6, 3, 4, 3, 3] },
  { label: "Lease Expirations", value: 1, change: "29 days out", icon: AlertTriangle, sparkData: [3, 2, 2, 1, 2, 1, 1] },
  { label: "New Matches", value: 3, change: "2 high score", icon: TrendingUp, sparkData: [1, 0, 2, 1, 3, 2, 3] },
  { label: "Leads This Week", value: 1, change: "via referral", icon: ArrowUpRight, sparkData: [2, 1, 3, 2, 1, 0, 1] },
];

const actions = [
  { priority: "critical" as BadgeVariant, client: "Sarah Chen", title: "Lease expires in 29 days", desc: "Sarah\u2019s lease at 412 Main St expires March 15. She hasn\u2019t secured a new place yet.", daysLeft: 29, totalDays: 60 },
  { priority: "critical" as BadgeVariant, client: "Ashley Williams", title: "New client \u2014 24hr follow-up", desc: "Ashley signed up 2 days ago and needs immediate housing. Follow up with property matches.", daysLeft: 1, totalDays: 1 },
  { priority: "high" as BadgeVariant, client: "Marcus Johnson", title: "Property tour confirmation", desc: "Marcus has a tour scheduled for 880 Mandalay Ave #210 tomorrow at 2pm. Confirm attendance.", daysLeft: 1, totalDays: 3 },
  { priority: "medium" as BadgeVariant, client: "Robert Thompson", title: "Investment property follow-up", desc: "Robert viewed 1580 Alt 19 N last week. Check if he wants to proceed with an offer.", daysLeft: 4, totalDays: 7 },
];

const properties = [
  { score: 92, address: "725 Virginia Ln", status: "new" as BadgeVariant, details: "Dunedin \u00b7 3/2 \u00b7 1,520sf \u00b7 Single Family", price: "$2,350/mo", client: "Sarah Chen", tags: ["Pet-friendly", "Fenced yard", "W/D hookups", "3BR/2BA match"] },
  { score: 90, address: "880 Mandalay Ave #210", status: "sent" as BadgeVariant, details: "Clearwater Beach \u00b7 2/2 \u00b7 1,150sf \u00b7 Condo", price: "$2,200/mo", client: "Marcus Johnson", tags: ["Pool access", "2BR/2BA match", "Clearwater Beach", "Under budget"] },
  { score: 88, address: "1580 Alt 19 N", status: "sent" as BadgeVariant, details: "Dunedin \u00b7 6/3 \u00b7 2,800sf \u00b7 Triplex", price: "$375,000", client: "Robert Thompson", tags: ["Investment", "Multi-family", "8.3% cap rate"] },
];

export default function DashboardPage() {
  const [time, setTime] = useState(new Date());
  const [mounted, setMounted] = useState(false);
  const dark = useDark();

  useEffect(() => {
    setMounted(true);
    const t = setInterval(() => setTime(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  const greeting = time.getHours() < 12 ? "Good morning" : time.getHours() < 17 ? "Good afternoon" : "Good evening";

  const donutSegments = useMemo(() => [
    { label: "Active", value: 5, color: dark ? "#2dd4bf" : "#0d9488" },
    { label: "Searching", value: 3, color: "#5eead4" },
    { label: "Pending", value: 2, color: dark ? "#134e4a" : "#99f6e4" },
  ], [dark]);

  return (
    <>
      {/* Header */}
      <header className="sticky top-0 z-10 hidden lg:block border-b border-[#1E293B]/50" style={{ background: 'linear-gradient(135deg, #475569 0%, #1E293B 50%, #475569 100%)' }}>
        <div className="px-4 lg:px-8 py-3 lg:py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center shadow-sm shadow-teal-500/15 shrink-0">
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
              <Bell size={16} className="text-teal-400" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full ring-2 ring-slate-800 animate-soft-pulse" />
            </button>
            <a href="/clients?new=true" className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors shadow-sm shadow-teal-600/20 active:scale-[0.97]">
              <Plus size={14} /> Add Client
            </a>
          </div>
        </div>
      </header>

      <div className="px-4 lg:px-8 py-4 lg:py-6">
        {/* Metric Cards */}
        <div className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 lg:gap-4 mb-4 lg:mb-6 ${mounted ? 'stagger-children' : ''}`}>
          {metricCards.map((card) => (
            <div key={card.label} className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl rounded-xl border border-amber-200/25 dark:border-gray-800/60 p-4 shadow-sm shadow-teal-500/5 dark:shadow-none hover:shadow-md hover:shadow-teal-500/10 dark:hover:shadow-teal-500/5 hover:scale-[1.02] transition-all duration-200 cursor-default">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">{card.label}</span>
                <div className="w-7 h-7 rounded-lg bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center">
                  <card.icon size={14} className="text-teal-600 dark:text-teal-400" />
                </div>
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <span className="text-2xl lg:text-3xl font-bold text-teal-700 dark:text-teal-400">
                    <AnimatedNumber value={card.value} />
                  </span>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{card.change}</p>
                </div>
                <SparkLine data={card.sparkData} color={dark ? "#2dd4bf" : "#0d9488"} />
              </div>
            </div>
          ))}
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
          {/* Today's Actions */}
          <div className={`lg:col-span-7 ${mounted ? 'animate-fade-slide-up' : ''}`} style={{ animationDelay: '300ms', animationFillMode: 'backwards' }}>
            <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl rounded-xl border border-amber-200/25 dark:border-gray-800/60 shadow-sm overflow-hidden">
              <div className="px-5 py-4 flex items-center justify-between rounded-t-xl" style={{ background: 'linear-gradient(135deg, #475569 0%, #1E293B 50%, #475569 100%)' }}>
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-5 rounded-full bg-teal-400" />
                  <h2 className="text-sm font-bold text-white tracking-tight">Today&apos;s Actions</h2>
                  <span className="text-xs font-bold text-teal-300 bg-white/10 rounded-full px-2.5 py-0.5 font-data">{actions.length}</span>
                </div>
                <button className="text-xs text-slate-300 hover:text-white flex items-center gap-1 px-2 py-1 rounded hover:bg-white/10 transition-colors">
                  <Filter size={12} /> Filter
                </button>
              </div>

              <div className="divide-y divide-amber-100/30 dark:divide-gray-800/60">
                {actions.map((action) => (
                  <div key={action.client} className="card-hover-slide px-5 py-4 hover:bg-teal-50/30 dark:hover:bg-teal-900/10 transition-colors group">
                    <div className="flex items-start gap-3">
                      <Avatar name={action.client} size={38} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant={action.priority}>{action.priority}</Badge>
                          <span className="text-sm font-semibold text-teal-700 dark:text-teal-400">{action.client}</span>
                          <div className="ml-auto flex items-center gap-1.5 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                            <button className="p-1.5 rounded-md hover:bg-teal-50 dark:hover:bg-gray-800 transition-colors"><Phone size={13} className="text-gray-400" /></button>
                            <button className="p-1.5 rounded-md hover:bg-teal-50 dark:hover:bg-gray-800 transition-colors"><Mail size={13} className="text-gray-400" /></button>
                            <button className="p-1.5 rounded-md hover:bg-teal-50 dark:hover:bg-gray-800 transition-colors"><MessageSquare size={13} className="text-gray-400" /></button>
                          </div>
                        </div>
                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-1">{action.title}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-2.5">{action.desc}</p>

                        <div className="flex items-center gap-2 mb-3">
                          <ProgressBar
                            current={action.totalDays - action.daysLeft}
                            total={action.totalDays}
                            color={action.priority === "critical" ? "#ef4444" : action.priority === "high" ? "#f59e0b" : "#0d9488"}
                          />
                          <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap font-data">{action.daysLeft}d left</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button className="flex items-center gap-1.5 text-xs font-medium text-white bg-teal-600 hover:bg-teal-700 px-3 py-1.5 rounded-lg transition-colors shadow-sm shadow-teal-600/15 active:scale-[0.97]">
                            <Send size={11} /> Send
                          </button>
                          <button className="flex items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 px-3 py-1.5 rounded-lg transition-colors active:scale-[0.97]">
                            <Check size={11} /> Done
                          </button>
                          <button className="flex items-center gap-1 text-xs text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 font-medium ml-1">
                            <ChevronRight size={12} /> Draft message
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className={`lg:col-span-5 flex flex-col gap-4 lg:gap-6 ${mounted ? 'animate-fade-slide-up' : ''}`} style={{ animationDelay: '400ms', animationFillMode: 'backwards' }}>
            {/* Client Overview Donut */}
            <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl rounded-xl border border-amber-200/25 dark:border-gray-800/60 shadow-sm overflow-hidden">
              <div className="px-5 py-4 flex items-center gap-3" style={{ background: 'linear-gradient(135deg, #475569 0%, #1E293B 50%, #475569 100%)' }}>
                <div className="w-1.5 h-5 rounded-full bg-teal-400" />
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
            <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl rounded-xl border border-amber-200/25 dark:border-gray-800/60 shadow-sm overflow-hidden flex-1">
              <div className="px-5 py-4 flex items-center justify-between" style={{ background: 'linear-gradient(135deg, #475569 0%, #1E293B 50%, #475569 100%)' }}>
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-5 rounded-full bg-teal-400" />
                  <h2 className="text-sm font-bold text-white tracking-tight">Property Matches</h2>
                </div>
                <button className="text-xs text-slate-300 hover:text-white font-medium transition-colors">View All</button>
              </div>

              <div className="divide-y divide-amber-100/30 dark:divide-gray-800/60">
                {properties.map((prop) => (
                  <div key={prop.address} className="card-hover-slide px-5 py-4 hover:bg-teal-50/30 dark:hover:bg-teal-900/10 transition-colors">
                    <div className="flex items-start gap-3">
                      <MatchScore score={prop.score} dark={dark} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-sm font-bold text-gray-800 dark:text-gray-100">{prop.address}</span>
                          <Badge variant={prop.status}>{prop.status}</Badge>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{prop.details}</p>
                        <div className="flex items-center gap-2 mb-2.5">
                          <span className="text-sm font-bold text-teal-600 dark:text-teal-400 font-data">{prop.price}</span>
                          <span className="text-xs text-gray-400 dark:text-gray-500">{prop.client}</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {prop.tags.map((tag) => (
                            <span key={tag} className="text-xs bg-teal-50/50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400 border border-teal-100/60 dark:border-teal-800/30 px-2 py-0.5 rounded-md">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
