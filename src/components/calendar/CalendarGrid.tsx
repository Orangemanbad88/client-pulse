import { useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { CalendarEvent } from './types';
import { DAYS, MONTHS, toDateKey } from './utils';
import { CalendarEventBadge } from './CalendarEventBadge';

interface CalendarGridProps {
  currentMonth: Date;
  selectedDay: string | null;
  eventsByDate: Record<string, CalendarEvent[]>;
  slideDirection: 'left' | 'right' | null;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onGoToday: () => void;
  onSelectDay: (day: string | null) => void;
}

export const CalendarGrid = ({
  currentMonth,
  selectedDay,
  eventsByDate,
  slideDirection,
  onPrevMonth,
  onNextMonth,
  onGoToday,
  onSelectDay,
}: CalendarGridProps) => {
  const todayKey = toDateKey(new Date());
  const monthKey = `${currentMonth.getFullYear()}-${currentMonth.getMonth()}`;

  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const days: { date: Date; isCurrentMonth: boolean }[] = [];

    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({ date: new Date(year, month - 1, daysInPrevMonth - i), isCurrentMonth: false });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      days.push({ date: new Date(year, month, d), isCurrentMonth: true });
    }
    const remaining = 42 - days.length;
    for (let d = 1; d <= remaining; d++) {
      days.push({ date: new Date(year, month + 1, d), isCurrentMonth: false });
    }

    return days;
  }, [currentMonth]);

  const slideClass = slideDirection === 'left' ? 'animate-slide-left' : slideDirection === 'right' ? 'animate-slide-right' : '';

  return (
    <div className="bg-[#162b48]/80 dark:bg-gray-900/60 backdrop-blur-xl rounded-xl border border-amber-200/25 dark:border-gray-800/60 shadow-sm overflow-hidden">
      {/* Month navigation */}
      <div className="px-5 py-4 border-b border-amber-100/30 dark:border-gray-800/60 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onPrevMonth} className="p-1.5 rounded-md hover:bg-gray-700/50 dark:hover:bg-gray-700/50 transition-colors">
            <ChevronLeft size={16} className="text-gray-500 dark:text-gray-400" />
          </button>
          <h2 className="text-sm font-bold text-gray-100 dark:text-gray-100 tracking-tight min-w-[160px] text-center">
            {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </h2>
          <button onClick={onNextMonth} className="p-1.5 rounded-md hover:bg-gray-700/50 dark:hover:bg-gray-700/50 transition-colors">
            <ChevronRight size={16} className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>
        <button onClick={onGoToday} className="text-xs text-gold dark:text-gold-light font-medium hover:text-gold-muted dark:hover:text-gold-light px-2 py-1 rounded hover:bg-amber-900/30 dark:hover:bg-amber-900/20 transition-colors">
          Today
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-amber-100/30 dark:border-gray-800/60">
        {DAYS.map((d) => (
          <div key={d} className="py-2 text-center text-xs font-semibold text-gray-400 dark:text-gray-400 uppercase tracking-wider">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar cells with slide animation */}
      <div key={monthKey} className={slideClass}>
        <div className="grid grid-cols-7">
          {calendarDays.map(({ date, isCurrentMonth }, idx) => {
            const key = toDateKey(date);
            const isToday = key === todayKey;
            const isSelected = key === selectedDay;
            const dayEvents = eventsByDate[key] || [];
            const triggerCount = dayEvents.filter((e) => e.type === 'trigger').length;
            const activityCount = dayEvents.filter((e) => e.type === 'activity').length;
            const googleCount = dayEvents.filter((e) => e.type === 'google').length;

            return (
              <button
                key={idx}
                onClick={() => onSelectDay(isSelected ? null : key)}
                className={`relative min-h-[80px] lg:min-h-[90px] p-1.5 border-b border-r border-amber-100/20 dark:border-gray-800/40 text-left transition-colors ${
                  isSelected
                    ? 'bg-amber-900/30 dark:bg-amber-900/20'
                    : 'hover:bg-amber-900/15 dark:hover:bg-amber-900/5'
                } ${!isCurrentMonth ? 'opacity-40' : ''}`}
              >
                <span className={`text-xs font-medium inline-flex items-center justify-center w-6 h-6 rounded-full ${
                  isToday
                    ? 'bg-gold text-white font-bold'
                    : isSelected
                    ? 'text-gold-muted dark:text-gold-light font-bold'
                    : 'text-gray-400 dark:text-gray-400'
                }`}>
                  {date.getDate()}
                </span>
                <div className="mt-0.5 space-y-0.5">
                  <CalendarEventBadge type="trigger" count={triggerCount} />
                  <CalendarEventBadge type="activity" count={activityCount} />
                  <CalendarEventBadge type="google" count={googleCount} />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
