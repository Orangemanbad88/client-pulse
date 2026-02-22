'use client';

import { useEffect, useState, useMemo, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Clock, MapPin, Plus, X, CalendarDays, Link2 } from 'lucide-react';
import type { Trigger, Activity } from '@/types/client';
import { getInitialsFromName } from '@/lib/utils';
import * as svc from '@/services/mock-service';

interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  type: 'trigger' | 'activity' | 'google';
  clientName?: string;
  clientId?: string;
  description?: string;
  urgency?: string;
}

interface NewEvent {
  title: string;
  date: string;
  time: string;
  clientName: string;
  description: string;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const toDateKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export default function CalendarPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]"><p className="text-sm text-gray-400">Loading...</p></div>}>
      <CalendarContent />
    </Suspense>
  );
}

function CalendarContent() {
  const searchParams = useSearchParams();
  const [triggers, setTriggers] = useState<Trigger[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [localEvents, setLocalEvents] = useState<CalendarEvent[]>([]);
  const [googleConnected, setGoogleConnected] = useState(false);
  const [googleEvents, setGoogleEvents] = useState<CalendarEvent[]>([]);
  const [googleStatus, setGoogleStatus] = useState<'idle' | 'loading' | 'loaded' | 'error'>('idle');
  const [googleError, setGoogleError] = useState('');
  const [newEvent, setNewEvent] = useState<NewEvent>({ title: '', date: '', time: '09:00', clientName: '', description: '' });

  useEffect(() => {
    Promise.all([svc.getAllTriggers(), svc.getRecentActivities(50)])
      .then(([t, a]) => { setTriggers(t); setActivities(a); setLoading(false); })
      .catch((err) => { console.error('Failed to load calendar data:', err); setLoading(false); });
  }, []);

  useEffect(() => {
    const connected = searchParams.get('connected') === 'true';
    if (connected) {
      localStorage.setItem('google_calendar_connected', 'true');
      setGoogleConnected(true);
    } else {
      setGoogleConnected(localStorage.getItem('google_calendar_connected') === 'true');
    }
  }, [searchParams]);

  // Fetch Google Calendar events when connected
  useEffect(() => {
    if (!googleConnected) return;
    const fetchGoogleEvents = async () => {
      setGoogleStatus('loading');
      try {
        const res = await fetch('/api/calendar/events');
        const result = await res.json();
        if (result.success && result.data) {
          const mapped: CalendarEvent[] = result.data.map((ev: { id: string; summary: string; start: string; description?: string }) => ({
            id: `g_${ev.id}`,
            title: ev.summary,
            date: ev.start,
            type: 'google' as const,
            description: ev.description || undefined,
          }));
          setGoogleEvents(mapped);
          setGoogleStatus('loaded');
          setGoogleError(`${mapped.length} events fetched`);
        } else {
          setGoogleStatus('error');
          setGoogleError(result.error || 'Unknown error');
        }
      } catch (err) {
        setGoogleStatus('error');
        setGoogleError(err instanceof Error ? err.message : 'Fetch failed');
      }
    };
    fetchGoogleEvents();
  }, [googleConnected]);

  const allEvents = useMemo<CalendarEvent[]>(() => {
    const triggerEvents: CalendarEvent[] = triggers
      .filter((t) => t.status === 'pending' || t.status === 'fired')
      .map((t) => ({
        id: t.id,
        title: t.title,
        date: t.fireDate,
        type: 'trigger' as const,
        clientName: t.clientName,
        clientId: t.clientId,
        description: t.description,
        urgency: t.urgency,
      }));

    const activityEvents: CalendarEvent[] = activities.map((a) => ({
      id: a.id,
      title: a.title,
      date: a.timestamp,
      type: 'activity' as const,
      clientName: a.agentName,
      description: a.description,
    }));

    if (googleConnected && googleEvents.length >= 0) {
      return [...googleEvents, ...localEvents];
    }
    return [...triggerEvents, ...activityEvents, ...localEvents];
  }, [triggers, activities, localEvents, googleEvents, googleConnected]);

  const eventsByDate = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    for (const ev of allEvents) {
      const key = toDateKey(new Date(ev.date));
      if (!map[key]) map[key] = [];
      map[key].push(ev);
    }
    return map;
  }, [allEvents]);

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

  const next14Days = useMemo(() => {
    const today = new Date();
    const events: CalendarEvent[] = [];
    for (let i = 0; i < 14; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      const key = toDateKey(d);
      if (eventsByDate[key]) events.push(...eventsByDate[key]);
    }
    return events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [eventsByDate]);

  const selectedDayEvents = selectedDay ? (eventsByDate[selectedDay] || []) : [];

  const prevMonth = useCallback(() => {
    setCurrentMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1));
    setSelectedDay(null);
  }, []);

  const nextMonth = useCallback(() => {
    setCurrentMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1));
    setSelectedDay(null);
  }, []);

  const goToday = useCallback(() => {
    setCurrentMonth(new Date());
    setSelectedDay(toDateKey(new Date()));
  }, []);

  const handleAddEvent = () => {
    if (!newEvent.title || !newEvent.date) return;
    const dateStr = `${newEvent.date}T${newEvent.time}:00`;
    const ev: CalendarEvent = {
      id: `local_${Date.now()}`,
      title: newEvent.title,
      date: dateStr,
      type: 'activity',
      clientName: newEvent.clientName || undefined,
      description: newEvent.description || undefined,
    };
    setLocalEvents((prev) => [...prev, ev]);
    setNewEvent({ title: '', date: '', time: '09:00', clientName: '', description: '' });
    setShowAddModal(false);
  };

  const todayKey = toDateKey(new Date());

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
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {googleConnected ? (
            <div className="flex items-center gap-2">
              {googleStatus === 'loading' && (
                <span className="text-[10px] text-slate-400">Syncing...</span>
              )}
              {googleStatus === 'loaded' && (
                <span className="text-[10px] text-teal-400">{googleError}</span>
              )}
              {googleStatus === 'error' && (
                <span className="text-[10px] text-red-400">{googleError}</span>
              )}
              <button
                onClick={async () => {
                  await fetch('/api/auth/google/disconnect', { method: 'POST' });
                  localStorage.removeItem('google_calendar_connected');
                  setGoogleConnected(false);
                  setGoogleEvents([]);
                  setGoogleStatus('idle');
                  setGoogleError('');
                }}
                className="flex items-center gap-1.5 text-xs text-teal-400 hover:text-red-400 font-medium px-3 py-2 bg-teal-900/20 hover:bg-red-900/20 rounded-lg border border-teal-800/30 hover:border-red-800/30 transition-colors"
              >
                <Link2 size={13} /> Unlink
              </button>
            </div>
          ) : (
            <a
              href="/api/auth/google"
              className="flex items-center gap-1.5 text-xs text-white font-medium px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg border border-white/10 transition-colors"
            >
              <CalendarDays size={13} /> Connect Google Calendar
            </a>
          )}
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors shadow-sm shadow-teal-600/20 active:scale-[0.97]"
          >
            <Plus size={14} /> Add Event
          </button>
        </div>
      </header>

      <div className="px-4 lg:px-8 py-4 lg:py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Calendar Grid */}
          <div className="lg:col-span-8">
            <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl rounded-xl border border-amber-200/25 dark:border-gray-800/60 shadow-sm overflow-hidden">
              {/* Month navigation */}
              <div className="px-5 py-4 border-b border-amber-100/30 dark:border-gray-800/60 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button onClick={prevMonth} className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    <ChevronLeft size={16} className="text-gray-500 dark:text-gray-400" />
                  </button>
                  <h2 className="text-sm font-bold text-gray-800 dark:text-gray-100 tracking-tight min-w-[160px] text-center">
                    {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                  </h2>
                  <button onClick={nextMonth} className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    <ChevronRight size={16} className="text-gray-500 dark:text-gray-400" />
                  </button>
                </div>
                <button onClick={goToday} className="text-xs text-teal-600 dark:text-teal-400 font-medium hover:text-teal-700 dark:hover:text-teal-300 px-2 py-1 rounded hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-colors">
                  Today
                </button>
              </div>

              {/* Day headers */}
              <div className="grid grid-cols-7 border-b border-amber-100/30 dark:border-gray-800/60">
                {DAYS.map((d) => (
                  <div key={d} className="py-2 text-center text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                    {d}
                  </div>
                ))}
              </div>

              {/* Calendar cells */}
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
                      onClick={() => setSelectedDay(isSelected ? null : key)}
                      className={`relative min-h-[80px] lg:min-h-[90px] p-1.5 border-b border-r border-amber-100/20 dark:border-gray-800/40 text-left transition-colors ${
                        isSelected
                          ? 'bg-teal-50/50 dark:bg-teal-900/20'
                          : 'hover:bg-teal-50/20 dark:hover:bg-teal-900/5'
                      } ${!isCurrentMonth ? 'opacity-40' : ''}`}
                    >
                      <span className={`text-xs font-medium inline-flex items-center justify-center w-6 h-6 rounded-full ${
                        isToday
                          ? 'bg-teal-600 text-white font-bold'
                          : isSelected
                          ? 'text-teal-700 dark:text-teal-400 font-bold'
                          : 'text-gray-600 dark:text-gray-400'
                      }`}>
                        {date.getDate()}
                      </span>
                      <div className="mt-0.5 space-y-0.5">
                        {triggerCount > 0 && (
                          <div className="flex items-center gap-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium truncate">{triggerCount} trigger{triggerCount > 1 ? 's' : ''}</span>
                          </div>
                        )}
                        {activityCount > 0 && (
                          <div className="flex items-center gap-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                            <span className="text-[10px] text-teal-600 dark:text-teal-400 font-medium truncate">{activityCount} activit{activityCount > 1 ? 'ies' : 'y'}</span>
                          </div>
                        )}
                        {googleCount > 0 && (
                          <div className="flex items-center gap-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                            <span className="text-[10px] text-blue-600 dark:text-blue-400 font-medium truncate">{googleCount} google</span>
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Day detail panel */}
            {selectedDay && (
              <div className="mt-4 bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl rounded-xl border border-amber-200/25 dark:border-gray-800/60 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-amber-100/30 dark:border-gray-800/60 flex items-center gap-3">
                  <div className="w-1.5 h-5 rounded-full bg-teal-500" />
                  <h2 className="text-sm font-bold text-gray-800 dark:text-gray-100 tracking-tight">
                    {new Date(selectedDay + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                  </h2>
                  <span className="text-xs font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/30 rounded-full px-2.5 py-0.5 font-data">{selectedDayEvents.length}</span>
                </div>
                <div className="divide-y divide-amber-100/30 dark:divide-gray-800/60">
                  {selectedDayEvents.length === 0 ? (
                    <div className="px-5 py-8 text-center text-sm text-gray-400">No events this day</div>
                  ) : (
                    selectedDayEvents.map((ev) => {
                      const date = new Date(ev.date);
                      return (
                        <div key={ev.id} className="px-5 py-4 hover:bg-teal-50/30 dark:hover:bg-teal-900/10 transition-colors">
                          <div className="flex items-start gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                              ev.type === 'trigger'
                                ? 'bg-amber-50 dark:bg-amber-900/20'
                                : ev.type === 'google'
                                ? 'bg-blue-50 dark:bg-blue-900/20'
                                : 'bg-teal-50 dark:bg-teal-900/30'
                            }`}>
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
                                    className="text-xs text-teal-600 dark:text-teal-400 font-medium hover:text-teal-700 dark:hover:text-teal-300"
                                  >
                                    {ev.clientName}
                                  </Link>
                                ) : ev.clientName ? (
                                  <span className="text-xs text-gray-500 dark:text-gray-400">{ev.clientName}</span>
                                ) : null}
                                <span className="text-xs text-gray-400 dark:text-gray-500 font-data">
                                  {date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                                </span>
                                {ev.urgency && (
                                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                                    ev.urgency === 'critical'
                                      ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                                      : ev.urgency === 'high'
                                      ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400'
                                      : 'bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
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
            )}
          </div>

          {/* Right sidebar — Next 14 Days */}
          <div className="lg:col-span-4">
            <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl rounded-xl border border-amber-200/25 dark:border-gray-800/60 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-amber-100/30 dark:border-gray-800/60 flex items-center gap-3">
                <div className="w-1.5 h-5 rounded-full bg-teal-500" />
                <h2 className="text-sm font-bold text-gray-800 dark:text-gray-100 tracking-tight">Next 14 Days</h2>
                <span className="text-xs font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/30 rounded-full px-2.5 py-0.5 font-data">{next14Days.length}</span>
              </div>
              <div className="divide-y divide-amber-100/30 dark:divide-gray-800/60 max-h-[600px] overflow-y-auto">
                {next14Days.length === 0 ? (
                  <div className="px-5 py-8 text-center text-sm text-gray-400">No upcoming events</div>
                ) : (
                  next14Days.map((ev) => {
                    const date = new Date(ev.date);
                    const daysOut = Math.ceil((date.getTime() - Date.now()) / 86400000);
                    return (
                      <button
                        key={ev.id}
                        onClick={() => setSelectedDay(toDateKey(date))}
                        className="w-full text-left px-5 py-3.5 hover:bg-teal-50/30 dark:hover:bg-teal-900/10 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-lg bg-teal-50 dark:bg-teal-900/30 flex flex-col items-center justify-center shrink-0">
                            <span className="text-[10px] font-semibold text-teal-600 dark:text-teal-400 uppercase">{date.toLocaleDateString('en-US', { month: 'short' })}</span>
                            <span className="text-sm font-bold text-teal-700 dark:text-teal-300 font-data leading-none">{date.getDate()}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-0.5 truncate">{ev.title}</p>
                            <div className="flex items-center gap-2">
                              {ev.clientName && (
                                <span className="text-xs text-teal-600 dark:text-teal-400 font-medium truncate">{ev.clientName}</span>
                              )}
                              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                                daysOut <= 0 ? 'bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400' :
                                daysOut <= 2 ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400' :
                                'bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
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
          </div>
        </div>
      </div>

      {/* Add Event Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowAddModal(false)} />
          <div className="relative bg-white dark:bg-gray-900 rounded-xl border border-amber-200/25 dark:border-gray-800/60 shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-5 py-4 border-b border-amber-100/30 dark:border-gray-800/60 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-5 rounded-full bg-teal-500" />
                <h2 className="text-sm font-bold text-gray-800 dark:text-gray-100 tracking-tight">Add Event</h2>
              </div>
              <button onClick={() => setShowAddModal(false)} className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <X size={16} className="text-gray-400" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Title *</label>
                <input
                  type="text"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
                  placeholder="e.g. Property showing"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Date *</label>
                  <input
                    type="date"
                    value={newEvent.date}
                    onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Time</label>
                  <input
                    type="time"
                    value={newEvent.time}
                    onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Client Name</label>
                <input
                  type="text"
                  value={newEvent.clientName}
                  onChange={(e) => setNewEvent({ ...newEvent, clientName: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
                  placeholder="Optional"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Description</label>
                <textarea
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 resize-none"
                  placeholder="Optional"
                />
              </div>
            </div>
            <div className="px-5 py-4 border-t border-amber-100/30 dark:border-gray-800/60 flex items-center justify-end gap-2">
              <button
                onClick={() => setShowAddModal(false)}
                className="text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 px-4 py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddEvent}
                disabled={!newEvent.title || !newEvent.date}
                className="flex items-center gap-1.5 text-xs font-medium text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded-lg transition-colors shadow-sm shadow-teal-600/20 active:scale-[0.97]"
              >
                <Plus size={13} /> Add Event
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
