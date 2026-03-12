import type { CalendarEvent } from './types';
import { toDateKey, getEventAccentColor, getEventDateBoxClass, getEventDateTextClass } from './utils';

interface CalendarSidebarProps {
  next14Days: CalendarEvent[];
  onSelectDay: (day: string) => void;
}

export const CalendarSidebar = ({ next14Days, onSelectDay }: CalendarSidebarProps) => {
  return (
    <div className="bg-[#162b48]/80 dark:bg-gray-900/60 backdrop-blur-xl rounded-xl border border-amber-200/25 dark:border-gray-800/60 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-amber-100/30 dark:border-gray-800/60 flex items-center gap-3">
        <div className="w-1.5 h-5 rounded-full bg-gold" />
        <h2 className="text-sm font-bold text-gray-100 dark:text-gray-100 tracking-tight">Next 14 Days</h2>
        <span className="text-xs font-bold text-gold dark:text-gold-light bg-amber-900/30 dark:bg-amber-900/30 rounded-full px-2.5 py-0.5 font-data">{next14Days.length}</span>
      </div>
      <div className="divide-y divide-amber-100/30 dark:divide-gray-800/60 max-h-[600px] overflow-y-auto">
        {next14Days.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-gray-400">No upcoming events</div>
        ) : (
          next14Days.map((ev) => {
            const date = new Date(ev.date);
            const daysOut = Math.ceil((date.getTime() - Date.now()) / 86400000);
            const accentColor = getEventAccentColor(ev.type);
            const dateBoxClass = getEventDateBoxClass(ev.type);
            const dateTextClass = getEventDateTextClass(ev.type);

            return (
              <button
                key={ev.id}
                onClick={() => onSelectDay(toDateKey(date))}
                className="w-full text-left px-5 py-3.5 hover:bg-amber-900/20 dark:hover:bg-amber-900/10 transition-colors event-accent-bar"
                style={{ '--event-accent-color': accentColor } as React.CSSProperties}
              >
                <div className="flex items-start gap-3 pl-2">
                  <div className={`w-10 h-10 rounded-lg flex flex-col items-center justify-center shrink-0 ${dateBoxClass}`}>
                    <span className={`text-[10px] font-semibold uppercase ${dateTextClass}`}>
                      {date.toLocaleDateString('en-US', { month: 'short' })}
                    </span>
                    <span className={`text-sm font-bold font-data leading-none ${dateTextClass}`}>
                      {date.getDate()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-100 dark:text-gray-100 mb-0.5 truncate">{ev.title}</p>
                    <div className="flex items-center gap-2">
                      {ev.clientName && (
                        <span className="text-xs text-gold dark:text-gold-light font-medium truncate">{ev.clientName}</span>
                      )}
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        daysOut <= 0 ? 'bg-amber-900/30 dark:bg-amber-900/20 text-gold dark:text-gold-light' :
                        daysOut <= 2 ? 'bg-amber-900/30 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400' :
                        'bg-[#1c3050] dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                      }`}>
                        {daysOut <= 0 ? 'Today' : daysOut === 1 ? 'Tomorrow' : `${daysOut}d`}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};
