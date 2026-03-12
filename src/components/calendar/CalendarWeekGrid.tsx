import { useMemo } from 'react';
import { ChevronLeft, ChevronRight, Clock, CalendarDays, MapPin } from 'lucide-react';
import type { CalendarEvent } from './types';
import { DAYS, toDateKey, getEventAccentColor, getEventBgClass } from './utils';

interface CalendarWeekGridProps {
  currentMonth: Date;
  eventsByDate: Record<string, CalendarEvent[]>;
  slideDirection: 'left' | 'right' | null;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onGoToday: () => void;
  onSelectDay: (day: string) => void;
}

export const CalendarWeekGrid = ({
  currentMonth,
  eventsByDate,
  slideDirection,
  onPrevWeek,
  onNextWeek,
  onGoToday,
  onSelectDay,
}: CalendarWeekGridProps) => {
  const todayKey = toDateKey(new Date());

  const weekDays = useMemo(() => {
    const startOfWeek = new Date(currentMonth);
    const day = startOfWeek.getDay();
    startOfWeek.setDate(startOfWeek.getDate() - day);

    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [currentMonth]);

  const weekKey = toDateKey(weekDays[0]);
  const weekLabel = `${weekDays[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekDays[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  const slideClass = slideDirection === 'left' ? 'animate-slide-left' : slideDirection === 'right' ? 'animate-slide-right' : '';

  return (
    <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl rounded-xl border border-amber-200/25 dark:border-gray-800/60 shadow-sm overflow-hidden">
      {/* Week navigation */}
      <div className="px-5 py-4 border-b border-amber-100/30 dark:border-gray-800/60 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onPrevWeek} className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors">
            <ChevronLeft size={16} className="text-gray-500 dark:text-gray-400" />
          </button>
          <h2 className="text-sm font-bold text-gray-800 dark:text-gray-100 tracking-tight min-w-[200px] text-center">
            {weekLabel}
          </h2>
          <button onClick={onNextWeek} className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors">
            <ChevronRight size={16} className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>
        <button onClick={onGoToday} className="text-xs text-gold dark:text-gold-light font-medium hover:text-gold-muted dark:hover:text-gold-light px-2 py-1 rounded hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors">
          Today
        </button>
      </div>

      {/* Week columns */}
      <div key={weekKey} className={slideClass}>
        <div className="grid grid-cols-7 divide-x divide-amber-100/20 dark:divide-gray-800/40">
          {weekDays.map((date, idx) => {
            const key = toDateKey(date);
            const isToday = key === todayKey;
            const dayEvents = eventsByDate[key] || [];

            return (
              <div key={idx} className="min-h-[300px]">
                {/* Day header */}
                <button
                  onClick={() => onSelectDay(key)}
                  className="w-full px-2 py-3 text-center border-b border-amber-100/20 dark:border-gray-800/40 hover:bg-amber-50/20 dark:hover:bg-amber-900/5 transition-colors"
                >
                  <div className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                    {DAYS[idx]}
                  </div>
                  <div className={`text-sm font-bold mt-0.5 inline-flex items-center justify-center w-7 h-7 rounded-full ${
                    isToday ? 'bg-gold text-white' : 'text-gray-700 dark:text-gray-300'
                  }`}>
                    {date.getDate()}
                  </div>
                </button>

                {/* Event cards */}
                <div className="p-1.5 space-y-1.5">
                  {dayEvents.map((ev) => {
                    const accentColor = getEventAccentColor(ev.type);
                    const bgClass = getEventBgClass(ev.type);
                    const time = new Date(ev.date);

                    return (
                      <button
                        key={ev.id}
                        onClick={() => onSelectDay(key)}
                        className={`w-full text-left p-2 rounded-lg ${bgClass} event-accent-bar transition-all hover:scale-[1.02]`}
                        style={{ '--event-accent-color': accentColor } as React.CSSProperties}
                      >
                        <div className="pl-2">
                          <p className="text-[11px] font-semibold text-gray-800 dark:text-gray-100 truncate">{ev.title}</p>
                          <div className="flex items-center gap-1 mt-0.5">
                            {ev.type === 'trigger' ? (
                              <Clock size={9} className="text-amber-500 dark:text-amber-400" />
                            ) : ev.type === 'google' ? (
                              <CalendarDays size={9} className="text-blue-500 dark:text-blue-400" />
                            ) : (
                              <MapPin size={9} className="text-teal-500 dark:text-teal-400" />
                            )}
                            <span className="text-[9px] text-gray-500 dark:text-gray-400 font-data">
                              {time.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
