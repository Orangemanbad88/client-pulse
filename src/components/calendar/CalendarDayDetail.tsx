import Link from 'next/link';
import { Clock, CalendarDays, MapPin } from 'lucide-react';
import type { CalendarEvent } from './types';
import { getEventAccentColor, getEventBgClass } from './utils';

interface CalendarDayDetailProps {
  selectedDay: string;
  events: CalendarEvent[];
}

export const CalendarDayDetail = ({ selectedDay, events }: CalendarDayDetailProps) => {
  return (
    <div key={selectedDay} className="mt-4 bg-[#faf7f2]/80 dark:bg-gray-900/60 backdrop-blur-xl rounded-xl border border-amber-200/25 dark:border-gray-800/60 shadow-sm overflow-hidden animate-slide-up-fade">
      <div className="px-5 py-4 border-b border-amber-100/30 dark:border-gray-800/60 flex items-center gap-3">
        <div className="w-1.5 h-5 rounded-full bg-gold" />
        <h2 className="text-sm font-bold text-gray-800 dark:text-gray-100 tracking-tight">
          {new Date(selectedDay + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </h2>
        <span className="text-xs font-bold text-gold dark:text-gold-light bg-amber-50 dark:bg-amber-900/30 rounded-full px-2.5 py-0.5 font-data">{events.length}</span>
      </div>
      <div className="divide-y divide-amber-100/30 dark:divide-gray-800/60 stagger">
        {events.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-gray-400">No events this day</div>
        ) : (
          events.map((ev) => {
            const date = new Date(ev.date);
            const accentColor = getEventAccentColor(ev.type);
            const bgClass = getEventBgClass(ev.type);

            return (
              <div
                key={ev.id}
                className="px-5 py-4 hover:bg-amber-50/30 dark:hover:bg-amber-900/10 transition-colors event-accent-bar"
                style={{ '--event-accent-color': accentColor } as React.CSSProperties}
              >
                <div className="flex items-start gap-3 pl-2">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${bgClass}`}>
                    {ev.type === 'trigger' ? (
                      <Clock size={16} className="text-amber-600 dark:text-amber-400" />
                    ) : ev.type === 'google' ? (
                      <CalendarDays size={16} className="text-blue-600 dark:text-blue-400" />
                    ) : (
                      <MapPin size={16} className="text-teal-600 dark:text-teal-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-0.5">{ev.title}</p>
                    {ev.description && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1.5">{ev.description}</p>
                    )}
                    <div className="flex items-center gap-3">
                      {ev.clientId ? (
                        <Link
                          href={`/clients/${ev.clientId}`}
                          className="text-xs text-gold dark:text-gold-light font-medium hover:text-gold-muted dark:hover:text-gold-light"
                        >
                          {ev.clientName}
                        </Link>
                      ) : ev.clientName ? (
                        <span className="text-xs text-gray-500 dark:text-gray-400">{ev.clientName}</span>
                      ) : null}
                      <span className="text-xs text-gray-400 dark:text-gray-400 font-data">
                        {date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                      </span>
                      {ev.urgency && (
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          ev.urgency === 'critical'
                            ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                            : ev.urgency === 'high'
                            ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400'
                            : 'bg-[#f5f0e8] dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                        }`}>
                          {ev.urgency}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
