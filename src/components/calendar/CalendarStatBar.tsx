import { CalendarDays, Clock, ArrowRight, Link2 } from 'lucide-react';
import type { CalendarEvent } from './types';
import { toDateKey } from './utils';

interface CalendarStatBarProps {
  allEvents: CalendarEvent[];
  currentMonth: Date;
  googleConnected: boolean;
  googleEvents: CalendarEvent[];
}

export const CalendarStatBar = ({ allEvents, currentMonth, googleConnected, googleEvents }: CalendarStatBarProps) => {
  const todayKey = toDateKey(new Date());
  const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
  const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

  const eventsThisMonth = allEvents.filter((ev) => {
    const d = new Date(ev.date);
    return d >= monthStart && d <= monthEnd;
  }).length;

  const eventsToday = allEvents.filter((ev) => toDateKey(new Date(ev.date)) === todayKey).length;

  const nextUp = allEvents
    .filter((ev) => new Date(ev.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];

  const nextUpLabel = nextUp
    ? `${nextUp.title.length > 20 ? nextUp.title.slice(0, 20) + '...' : nextUp.title}`
    : 'None';

  const stats = [
    { icon: CalendarDays, label: 'This Month', value: String(eventsThisMonth), accent: false },
    { icon: Clock, label: 'Today', value: String(eventsToday), accent: eventsToday > 0 },
    { icon: ArrowRight, label: 'Next Up', value: nextUpLabel, accent: false },
    { icon: Link2, label: 'Google Synced', value: googleConnected ? String(googleEvents.length) : 'Off', accent: googleConnected },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6 stagger-children">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="bg-[#faf7f2]/80 dark:bg-gray-900/60 backdrop-blur-xl rounded-xl border border-amber-200/25 dark:border-gray-800/60 shadow-sm px-4 py-3 transition-all hover:-translate-y-0.5 border-t-2 border-t-transparent hover:border-t-[#D4A84B]/60"
        >
          <div className="flex items-center gap-2 mb-1">
            <stat.icon size={13} className={stat.accent ? 'text-gold dark:text-gold-light' : 'text-gray-400 dark:text-gray-500'} />
            <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{stat.label}</span>
          </div>
          <p className={`text-sm font-bold truncate font-data ${stat.accent ? 'text-gold dark:text-gold-light' : 'text-gray-800 dark:text-gray-100'}`}>
            {stat.value}
          </p>
        </div>
      ))}
    </div>
  );
};
