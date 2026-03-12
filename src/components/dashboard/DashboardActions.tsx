'use client';

import { useState } from 'react';
import type { Trigger } from '@/types/client';
import { urgencyBadge, cn } from '@/lib/utils';
import { Avatar } from '@/components/ui/Avatar';
import { Badge, type BadgeVariant } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Send, Check, ChevronRight, Phone, Mail, MessageSquare, Filter } from 'lucide-react';

const urgencyToBadgeVariant = (urgency: string): BadgeVariant => {
  if (urgency === 'critical') return 'critical';
  if (urgency === 'high') return 'high';
  if (urgency === 'medium') return 'medium';
  return 'default';
};

interface Props {
  triggers: Trigger[];
  onComplete: (id: string) => Promise<void>;
}

export const DashboardActions = ({ triggers, onComplete }: Props) => {
  const [localTriggers, setLocalTriggers] = useState(triggers);
  const [loading, setLoading] = useState<string | null>(null);

  const firedTriggers = localTriggers.filter((t) => t.status === 'fired');

  const handleDone = async (id: string) => {
    setLoading(id);
    try {
      await onComplete(id);
      setLocalTriggers((prev) => prev.filter((t) => t.id !== id));
    } catch {
      // keep in list on failure
    } finally {
      setLoading(null);
    }
  };

  const daysLeft = (fireDate: string) => {
    const diff = Math.ceil((new Date(fireDate).getTime() - Date.now()) / 86400000);
    return Math.max(0, diff);
  };

  return (
    <div className="bg-[#faf7f2]/80 dark:bg-gray-900/60 backdrop-blur-xl rounded-xl border border-amber-200/25 dark:border-gray-800/60 shadow-sm overflow-hidden">
      <div className="px-5 py-4 flex items-center justify-between rounded-t-xl" style={{ background: '#1e3a5f' }}>
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-5 rounded-full bg-gold-light" />
          <h2 className="text-sm font-bold text-white tracking-tight">Today&apos;s Actions</h2>
          <span className="text-xs font-bold text-gold-light bg-white/10 rounded-full px-2.5 py-0.5 font-data">{firedTriggers.length}</span>
        </div>
        <button className="text-xs text-slate-300 hover:text-white flex items-center gap-1 px-2 py-1 rounded hover:bg-white/10 transition-colors">
          <Filter size={12} /> Filter
        </button>
      </div>

      <div className="divide-y divide-amber-100/30 dark:divide-gray-800/60">
        {firedTriggers.length === 0 && (
          <div className="px-5 py-8 text-center">
            <p className="text-sm text-gray-400 dark:text-gray-500">No pending actions</p>
          </div>
        )}
        {firedTriggers.map((trigger) => {
          const variant = urgencyToBadgeVariant(trigger.urgency);
          const days = daysLeft(trigger.fireDate);
          return (
            <div key={trigger.id} className="card-hover-slide px-5 py-4 hover:bg-amber-50/30 dark:hover:bg-amber-900/10 transition-colors group">
              <div className="flex items-start gap-3">
                <Avatar name={trigger.clientName} size={38} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={variant}>{trigger.urgency}</Badge>
                    <span className="text-sm font-semibold text-gold-muted dark:text-gold-light">{trigger.clientName}</span>
                    <div className="ml-auto flex items-center gap-1.5 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                      <button className="p-1.5 rounded-md hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"><Phone size={13} className="text-gray-400" /></button>
                      <button className="p-1.5 rounded-md hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"><Mail size={13} className="text-gray-400" /></button>
                      <button className="p-1.5 rounded-md hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"><MessageSquare size={13} className="text-gray-400" /></button>
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-1">{trigger.title}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-2.5">{trigger.description}</p>

                  <div className="flex items-center gap-2 mb-3">
                    <ProgressBar
                      current={Math.max(1, 7 - days)}
                      total={7}
                      color={trigger.urgency === 'critical' ? '#ef4444' : trigger.urgency === 'high' ? '#f59e0b' : '#B8860B'}
                    />
                    <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap font-data">{days}d left</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button className="flex items-center gap-1.5 text-xs font-medium text-white bg-gold hover:bg-gold-muted px-3 py-1.5 rounded-lg transition-colors shadow-sm shadow-gold/15 active:scale-[0.97]">
                      <Send size={11} /> Send
                    </button>
                    <button
                      disabled={loading === trigger.id}
                      onClick={() => handleDone(trigger.id)}
                      className={cn(
                        'flex items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 px-3 py-1.5 rounded-lg transition-colors active:scale-[0.97]',
                        loading === trigger.id && 'opacity-50 cursor-wait',
                      )}
                    >
                      <Check size={11} /> {loading === trigger.id ? 'Saving...' : 'Done'}
                    </button>
                    {trigger.messageDraft && (
                      <button className="flex items-center gap-1 text-xs text-gold dark:text-gold-light hover:text-gold-muted dark:hover:text-gold-light font-medium ml-1">
                        <ChevronRight size={12} /> Draft message
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
