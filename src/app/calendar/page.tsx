'use client';

import { useEffect, useState, useMemo, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { CalendarDays, Link2, Plus } from 'lucide-react';
import type { Trigger, Activity } from '@/types/client';
import type { CalendarEvent, NewEvent, CalendarViewMode } from '@/components/calendar/types';
import { toDateKey } from '@/components/calendar/utils';
import { CalendarStatBar } from '@/components/calendar/CalendarStatBar';
import { CalendarViewToggle } from '@/components/calendar/CalendarViewToggle';
import { CalendarGrid } from '@/components/calendar/CalendarGrid';
import { CalendarWeekGrid } from '@/components/calendar/CalendarWeekGrid';
import { CalendarDayDetail } from '@/components/calendar/CalendarDayDetail';
import { CalendarSidebar } from '@/components/calendar/CalendarSidebar';
import { AddEventModal } from '@/components/calendar/AddEventModal';

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
  const [error, setError] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [localEvents, setLocalEvents] = useState<CalendarEvent[]>([]);
  const [googleConnected, setGoogleConnected] = useState(false);
  const [googleEvents, setGoogleEvents] = useState<CalendarEvent[]>([]);
  const [googleStatus, setGoogleStatus] = useState<'idle' | 'loading' | 'loaded' | 'error'>('idle');
  const [googleError, setGoogleError] = useState('');
  const [newEvent, setNewEvent] = useState<NewEvent>({ title: '', date: '', time: '09:00', clientName: '', description: '' });
  const [viewMode, setViewMode] = useState<CalendarViewMode>('month');
  const [slideDirection, setSlideDirection] = useState<'left' | 'right' | null>(null);

  useEffect(() => {
    import('@/services').then((svc) =>
      Promise.all([svc.getAllTriggers(), svc.getRecentActivities(50)])
    )
      .then(([t, a]) => { setTriggers(t); setActivities(a); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });
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

  const navigate = useCallback((direction: 'prev' | 'next') => {
    setSlideDirection(direction === 'next' ? 'left' : 'right');
    setCurrentMonth((m) => {
      const offset = viewMode === 'month' ? (direction === 'next' ? 1 : -1) : 0;
      const dayOffset = viewMode === 'week' ? (direction === 'next' ? 7 : -7) : 0;
      const next = new Date(m);
      if (viewMode === 'month') {
        next.setMonth(next.getMonth() + offset);
        next.setDate(1);
      } else {
        next.setDate(next.getDate() + dayOffset);
      }
      return next;
    });
    setSelectedDay(null);
  }, [viewMode]);

  const prevNav = useCallback(() => navigate('prev'), [navigate]);
  const nextNav = useCallback(() => navigate('next'), [navigate]);

  const goToday = useCallback(() => {
    setSlideDirection(null);
    setCurrentMonth(new Date());
    setSelectedDay(toDateKey(new Date()));
  }, []);

  const handleAddEvent = useCallback(() => {
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
  }, [newEvent]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <p className="text-sm text-gray-400">Loading...</p>
    </div>
  );

  if (error) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <CalendarDays size={32} className="text-gray-300 dark:text-gray-400 mx-auto mb-3" />
        <p className="text-sm text-gray-400 mb-1">Unable to load calendar</p>
        <p className="text-xs text-gray-400/60">Check your connection and try refreshing</p>
      </div>
    </div>
  );

  return (
    <>
      {/* Header */}
      <header
        className="sticky top-3 z-10 mx-4 lg:mx-6 px-4 lg:px-6 py-3 lg:py-4 rounded-xl border border-[#D4A84B]/20 shadow-lg shadow-black/20 flex items-center justify-between"
        style={{ background: '#1e3a5f' }}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold to-gold-muted flex items-center justify-center shadow-sm shadow-gold/15">
            <CalendarDays size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg text-white" style={{ fontWeight: 600, letterSpacing: '-0.025em' }}>Calendar</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <CalendarViewToggle viewMode={viewMode} onViewChange={setViewMode} />
          {googleConnected ? (
            <div className="flex items-center gap-2">
              {googleStatus === 'loading' && (
                <span className="text-[10px] text-slate-400">Syncing...</span>
              )}
              {googleStatus === 'loaded' && (
                <span className="text-[10px] text-gold-light">{googleError}</span>
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
                className="flex items-center gap-1.5 text-xs text-gold-light hover:text-red-400 font-medium px-3 py-2 bg-amber-900/20 hover:bg-red-900/20 rounded-lg border border-gold-muted/30 hover:border-red-800/30 transition-colors"
              >
                <Link2 size={13} /> Unlink
              </button>
            </div>
          ) : (
            <a
              href="/api/auth/google"
              className="flex items-center gap-1.5 text-xs text-white font-medium px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg border border-white/10 transition-colors"
            >
              <CalendarDays size={13} /> Connect Google
            </a>
          )}
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-gold hover:bg-gold-muted text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors shadow-sm shadow-gold/20 active:scale-[0.97]"
          >
            <Plus size={14} /> Add Event
          </button>
        </div>
      </header>

      <div className="px-4 lg:px-8 py-4 lg:py-6">
        {/* Stat Bar */}
        <CalendarStatBar
          allEvents={allEvents}
          currentMonth={currentMonth}
          googleConnected={googleConnected}
          googleEvents={googleEvents}
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Calendar Grid */}
          <div className="lg:col-span-8">
            {viewMode === 'month' ? (
              <CalendarGrid
                currentMonth={currentMonth}
                selectedDay={selectedDay}
                eventsByDate={eventsByDate}
                slideDirection={slideDirection}
                onPrevMonth={prevNav}
                onNextMonth={nextNav}
                onGoToday={goToday}
                onSelectDay={setSelectedDay}
              />
            ) : (
              <CalendarWeekGrid
                currentMonth={currentMonth}
                eventsByDate={eventsByDate}
                slideDirection={slideDirection}
                onPrevWeek={prevNav}
                onNextWeek={nextNav}
                onGoToday={goToday}
                onSelectDay={(day) => setSelectedDay(day)}
              />
            )}

            {/* Day Detail Panel */}
            {selectedDay && (
              <CalendarDayDetail selectedDay={selectedDay} events={selectedDayEvents} />
            )}
          </div>

          {/* Right sidebar */}
          <div className="lg:col-span-4">
            <CalendarSidebar next14Days={next14Days} onSelectDay={setSelectedDay} />
          </div>
        </div>
      </div>

      {/* Add Event Modal */}
      {showAddModal && (
        <AddEventModal
          newEvent={newEvent}
          onChangeEvent={setNewEvent}
          onAdd={handleAddEvent}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </>
  );
}
