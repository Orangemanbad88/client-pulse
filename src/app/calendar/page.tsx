'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Clock, MapPin } from 'lucide-react';
import type { Trigger, Activity } from '@/types/client';
import * as svc from '@/services/mock-service';

export default function CalendarPage() {
  const [triggers, setTriggers] = useState<Trigger[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([svc.getAllTriggers(), svc.getRecentActivities(20)])
      .then(([t, a]) => { setTriggers(t); setActivities(a); setLoading(false); })
      .catch((err) => { console.error('Failed to load calendar data:', err); setLoading(false); });
  }, []);

  const today = new Date();
  const upcomingTriggers = triggers
    .filter((t) => t.status === 'pending' || t.status === 'fired')
    .sort((a, b) => new Date(a.fireDate).getTime() - new Date(b.fireDate).getTime());

  const showings = activities.filter((a) => a.type === 'showing');

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <p className="text-sm text-gray-400">Loading...</p>
    </div>
  );

  return (
    <>
      <header
        className="px-4 lg:px-8 py-3 lg:py-4 border-b border-[#1E293B]/50 flex items-center justify-between"
        style={{ background: 'linear-gradient(135deg, #475569 0%, #1E293B 50%, #475569 100%)' }}
      >
        <div>
          <h1 className="text-lg text-white" style={{ fontWeight: 600, letterSpacing: '-0.025em' }}>Calendar</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
      </header>
      <div className="px-4 lg:px-8 py-4 lg:py-6">

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Events */}
        <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl rounded-xl border border-amber-200/25 dark:border-gray-800/60 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-amber-100/30 dark:border-gray-800/60 flex items-center gap-3">
            <div className="w-1.5 h-5 rounded-full bg-teal-500" />
            <h2 className="text-sm font-bold text-gray-800 dark:text-gray-100 tracking-tight">Upcoming Events</h2>
            <span className="text-xs font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/30 rounded-full px-2.5 py-0.5 font-data">{upcomingTriggers.length}</span>
          </div>
          <div className="divide-y divide-amber-100/30 dark:divide-gray-800/60">
            {upcomingTriggers.map((trigger) => {
              const date = new Date(trigger.fireDate);
              const daysOut = Math.ceil((date.getTime() - Date.now()) / 86400000);
              return (
                <div key={trigger.id} className="px-5 py-4 hover:bg-teal-50/30 dark:hover:bg-teal-900/10 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-teal-50 dark:bg-teal-900/30 flex flex-col items-center justify-center shrink-0">
                      <span className="text-[10px] font-semibold text-teal-600 dark:text-teal-400 uppercase">{date.toLocaleDateString('en-US', { month: 'short' })}</span>
                      <span className="text-sm font-bold text-teal-700 dark:text-teal-300 font-data leading-none">{date.getDate()}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-0.5">{trigger.title}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1.5">{trigger.description}</p>
                      <div className="flex items-center gap-3">
                        <Link
                          href={`/clients/${trigger.clientId}`}
                          className="text-xs text-teal-600 dark:text-teal-400 font-medium hover:text-teal-700 dark:hover:text-teal-300"
                        >
                          {trigger.clientName}
                        </Link>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          trigger.urgency === 'critical'
                            ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                            : trigger.urgency === 'high'
                            ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400'
                            : 'bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                        }`}>
                          {daysOut <= 0 ? 'Today' : daysOut === 1 ? 'Tomorrow' : `${daysOut}d`}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            {upcomingTriggers.length === 0 && (
              <div className="px-5 py-8 text-center text-sm text-gray-400">No upcoming events</div>
            )}
          </div>
        </div>

        {/* Recent Showings */}
        <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl rounded-xl border border-amber-200/25 dark:border-gray-800/60 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-amber-100/30 dark:border-gray-800/60 flex items-center gap-3">
            <div className="w-1.5 h-5 rounded-full bg-teal-400" />
            <h2 className="text-sm font-bold text-gray-800 dark:text-gray-100 tracking-tight">Showings</h2>
            <span className="text-xs font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/30 rounded-full px-2.5 py-0.5 font-data">{showings.length}</span>
          </div>
          <div className="divide-y divide-amber-100/30 dark:divide-gray-800/60">
            {showings.map((showing) => {
              const date = new Date(showing.timestamp);
              return (
                <div key={showing.id} className="px-5 py-4 hover:bg-teal-50/30 dark:hover:bg-teal-900/10 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center shrink-0">
                      <MapPin size={16} className="text-amber-600 dark:text-amber-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-0.5">{showing.title}</p>
                      {showing.propertyAddress && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{showing.propertyAddress}</p>
                      )}
                      <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
                        <Clock size={11} />
                        <span>{date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at {date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            {showings.length === 0 && (
              <div className="px-5 py-8 text-center text-sm text-gray-400">No showings scheduled</div>
            )}
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
