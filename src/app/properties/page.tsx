'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { Building2, MapPin, Bed, Bath, Maximize, ArrowUpRight } from 'lucide-react';
import type { PropertyMatch } from '@/types/client';
import { PROPERTY_TYPE_LABELS } from '@/types/client';
import { MatchScore } from '@/components/ui/MatchScore';
import { useDark } from '@/hooks/useDark';
import * as svc from '@/services/mock-service';

export default function PropertiesPage() {
  const [matches, setMatches] = useState<PropertyMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'new' | 'sent' | 'interested'>('all');
  const dark = useDark();

  useEffect(() => {
    svc.getAllMatches()
      .then((m) => { setMatches(m); setLoading(false); })
      .catch((err) => { console.error('Failed to load properties:', err); setLoading(false); });
  }, []);

  const filtered = filter === 'all' ? matches : matches.filter((m) => m.status === filter);
  const counts = useMemo(() => ({
    all: matches.length,
    new: matches.filter((m) => m.status === 'new').length,
    sent: matches.filter((m) => m.status === 'sent').length,
    interested: matches.filter((m) => m.status === 'interested').length,
  }), [matches]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <p className="text-sm text-gray-400">Loading...</p>
    </div>
  );

  return (
    <div className="px-4 lg:px-8 py-4 lg:py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-gray-900 dark:text-white">Properties</h1>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{matches.length} matched properties</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 mb-5">
        {(['all', 'new', 'sent', 'interested'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filter === f
                ? 'bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400'
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/50'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
            <span className="ml-1.5 text-[10px] font-data">{counts[f]}</span>
          </button>
        ))}
      </div>

      {/* Property cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filtered.map((prop) => (
          <div
            key={prop.id}
            className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl rounded-xl border border-amber-200/25 dark:border-gray-800/60 shadow-sm hover:shadow-md hover:shadow-teal-500/10 dark:hover:shadow-teal-500/5 transition-all overflow-hidden"
          >
            <div className="p-5">
              <div className="flex items-start gap-4">
                <MatchScore score={prop.matchScore} dark={dark} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-bold text-gray-800 dark:text-gray-100">{prop.address}</span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      prop.status === 'new'
                        ? 'bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400 border border-teal-100 dark:border-teal-800/30'
                        : prop.status === 'interested'
                        ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-800/30'
                        : 'bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700'
                    }`}>
                      {prop.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mb-2">
                    <MapPin size={12} />
                    <span>{prop.city}</span>
                    <span className="text-gray-300 dark:text-gray-700">·</span>
                    <span>{PROPERTY_TYPE_LABELS[prop.propertyType]}</span>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-300 mb-3">
                    <span className="flex items-center gap-1"><Bed size={13} /> {prop.bedrooms}</span>
                    <span className="flex items-center gap-1"><Bath size={13} /> {prop.bathrooms}</span>
                    <span className="flex items-center gap-1"><Maximize size={13} /> {prop.sqft.toLocaleString()}sf</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-teal-600 dark:text-teal-400 font-data">
                      ${prop.price.toLocaleString()}{prop.price < 10000 ? '/mo' : ''}
                    </span>
                    <Link
                      href={`/clients/${prop.clientId}`}
                      className="flex items-center gap-1 text-xs text-teal-600 dark:text-teal-400 font-medium hover:text-teal-700 dark:hover:text-teal-300 transition-colors"
                    >
                      {prop.clientName} <ArrowUpRight size={11} />
                    </Link>
                  </div>
                </div>
              </div>

              {/* Match reasons */}
              <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-amber-100/30 dark:border-gray-800/60">
                {prop.matchReasons.map((reason) => (
                  <span key={reason} className="text-xs bg-teal-50/50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400 border border-teal-100/60 dark:border-teal-800/30 px-2 py-0.5 rounded-md">
                    {reason}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12">
          <Building2 size={32} className="text-gray-300 dark:text-gray-700 mx-auto mb-3" />
          <p className="text-sm text-gray-400">No {filter} properties</p>
        </div>
      )}
    </div>
  );
}
