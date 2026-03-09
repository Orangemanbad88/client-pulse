'use client';

import { useState } from 'react';
import type { PropertyMatch } from '@/types/client';
import { PROPERTY_TYPE_LABELS } from '@/types/client';
import { formatCurrency, cn } from '@/lib/utils';
import { MatchScore } from '@/components/ui/MatchScore';
import { Badge, type BadgeVariant } from '@/components/ui/Badge';
import { useDark } from '@/hooks/useDark';

const statusVariant = (status: string): BadgeVariant => {
  if (status === 'new') return 'new';
  if (status === 'sent') return 'sent';
  if (status === 'interested') return 'high';
  return 'default';
};

interface Props {
  matches: PropertyMatch[];
  onSend: (id: string) => Promise<void>;
}

export const DashboardMatches = ({ matches, onSend }: Props) => {
  const dark = useDark();
  const [localMatches, setLocalMatches] = useState(matches);
  const [loading, setLoading] = useState<string | null>(null);

  const handleSend = async (id: string) => {
    setLoading(id);
    try {
      await onSend(id);
      setLocalMatches((prev) =>
        prev.map((m) => (m.id === id ? { ...m, status: 'sent' as const } : m)),
      );
    } catch {
      // keep original status on failure
    } finally {
      setLoading(null);
    }
  };

  const topMatches = localMatches.filter((m) => m.status === 'new' || m.status === 'sent').slice(0, 5);

  return (
    <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl rounded-xl border border-amber-200/25 dark:border-gray-800/60 shadow-sm overflow-hidden flex-1">
      <div className="px-5 py-4 flex items-center justify-between" style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #132a4a 50%, #1e3a5f 100%)' }}>
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-5 rounded-full bg-gold-light" />
          <h2 className="text-sm font-bold text-white tracking-tight">Property Matches</h2>
        </div>
        <button className="text-xs text-slate-300 hover:text-white font-medium transition-colors">View All</button>
      </div>

      <div className="divide-y divide-amber-100/30 dark:divide-gray-800/60">
        {topMatches.length === 0 && (
          <div className="px-5 py-8 text-center">
            <p className="text-sm text-gray-400 dark:text-gray-500">No matches yet</p>
          </div>
        )}
        {topMatches.map((match) => {
          const isWeekly = match.price < 10000;
          return (
            <div key={match.id} className="card-hover-slide px-5 py-4 hover:bg-amber-50/30 dark:hover:bg-amber-900/10 transition-colors">
              <div className="flex items-start gap-3">
                <MatchScore score={match.matchScore} dark={dark} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-bold text-gray-800 dark:text-gray-100">{match.address}</span>
                    <Badge variant={statusVariant(match.status)}>{match.status}</Badge>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                    {match.city} · {match.bedrooms}/{match.bathrooms} · {match.sqft.toLocaleString()}sf · {PROPERTY_TYPE_LABELS[match.propertyType]}
                  </p>
                  <div className="flex items-center gap-2 mb-2.5">
                    <span className="text-sm font-bold text-gold dark:text-gold-light font-data">{formatCurrency(match.price, isWeekly ? '/wk' : undefined)}</span>
                    <span className="text-xs text-gray-400 dark:text-gray-500">{match.clientName}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {match.matchReasons.map((tag) => (
                      <span key={tag} className="text-xs bg-amber-50/50 dark:bg-amber-900/20 text-gold-muted dark:text-gold-light border border-gold-light/60 dark:border-gold-muted/30 px-2 py-0.5 rounded-md">
                        {tag}
                      </span>
                    ))}
                  </div>
                  {match.status === 'new' && (
                    <button
                      disabled={loading === match.id}
                      onClick={() => handleSend(match.id)}
                      className={cn(
                        'flex items-center gap-1.5 text-xs font-medium text-white bg-gold hover:bg-gold-muted px-3 py-1.5 rounded-lg transition-colors shadow-sm shadow-gold/15 active:scale-[0.97]',
                        loading === match.id && 'opacity-50 cursor-wait',
                      )}
                    >
                      {loading === match.id ? 'Sending...' : 'Send to Client'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
