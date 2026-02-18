'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { Mail, Phone, MessageSquare, Clock } from 'lucide-react';
import type { Activity, Client } from '@/types/client';
import { formatRelativeDate } from '@/lib/utils';
import * as svc from '@/services/mock-service';

export default function MessagesPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'email' | 'call' | 'text'>('all');

  useEffect(() => {
    Promise.all([svc.getRecentActivities(50), svc.getClients()])
      .then(([a, c]) => { setActivities(a); setClients(c); setLoading(false); })
      .catch((err) => { console.error('Failed to load messages:', err); setLoading(false); });
  }, []);

  const messageTypes = ['email', 'call', 'text'] as const;
  const messages = activities.filter((a) => messageTypes.includes(a.type as typeof messageTypes[number]));
  const filtered = filter === 'all' ? messages : messages.filter((m) => m.type === filter);

  const clientMap = useMemo(() => new Map(clients.map((c) => [c.id, c])), [clients]);

  const getClientName = (clientId: string) => {
    const client = clientMap.get(clientId);
    return client ? `${client.firstName} ${client.lastName}` : 'Unknown';
  };

  const getInitials = (clientId: string) => {
    const client = clientMap.get(clientId);
    return client ? `${(client.firstName || '?')[0]}${(client.lastName || '?')[0]}` : '??';
  };

  const typeIcon = (type: string) => {
    switch (type) {
      case 'email': return <Mail size={14} />;
      case 'call': return <Phone size={14} />;
      case 'text': return <MessageSquare size={14} />;
      default: return <Mail size={14} />;
    }
  };

  const counts = useMemo(() => ({
    all: messages.length,
    email: messages.filter((m) => m.type === 'email').length,
    call: messages.filter((m) => m.type === 'call').length,
    text: messages.filter((m) => m.type === 'text').length,
  }), [messages]);

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
          <h1 className="text-lg text-white" style={{ fontWeight: 600, letterSpacing: '-0.025em' }}>Messages</h1>
          <p className="text-xs text-slate-400 mt-0.5">{messages.length} communications</p>
        </div>
      </header>
      <div className="px-4 lg:px-8 py-4 lg:py-6">

      {/* Filter tabs */}
      <div className="flex items-center gap-1 mb-5">
        {(['all', 'email', 'call', 'text'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filter === f
                ? 'bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400'
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/50'
            }`}
          >
            {f !== 'all' && typeIcon(f)}
            {f.charAt(0).toUpperCase() + f.slice(1)}
            <span className="text-[10px] font-data">{counts[f]}</span>
          </button>
        ))}
      </div>

      {/* Message list */}
      <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl rounded-xl border border-amber-200/25 dark:border-gray-800/60 shadow-sm overflow-hidden">
        <div className="divide-y divide-amber-100/30 dark:divide-gray-800/60">
          {filtered.map((msg) => {
            const timeAgo = formatRelativeDate(msg.timestamp);

            return (
              <div key={msg.id} className="px-5 py-4 hover:bg-teal-50/30 dark:hover:bg-teal-900/10 transition-colors group">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center text-xs font-bold text-teal-600 dark:text-teal-400 shrink-0">
                    {getInitials(msg.clientId)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <Link
                        href={`/clients/${msg.clientId}`}
                        className="text-sm font-semibold text-gray-800 dark:text-gray-100 hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
                      >
                        {getClientName(msg.clientId)}
                      </Link>
                      <span className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                        msg.type === 'email'
                          ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                          : msg.type === 'call'
                          ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                          : 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400'
                      }`}>
                        {typeIcon(msg.type)}
                        {msg.type}
                      </span>
                      <span className="ml-auto flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                        <Clock size={11} /> {timeAgo}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-0.5">{msg.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{msg.description}</p>
                  </div>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="px-5 py-12 text-center">
              <MessageSquare size={32} className="text-gray-300 dark:text-gray-700 mx-auto mb-3" />
              <p className="text-sm text-gray-400">No {filter} messages</p>
            </div>
          )}
        </div>
      </div>
    </div>
    </>
  );
}
