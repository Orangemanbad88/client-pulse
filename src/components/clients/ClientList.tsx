'use client';

import { useState, useMemo } from 'react';
import type { Client, ClientType, LifecycleStage } from '@/types/client';
import { LIFECYCLE_LABELS } from '@/types/client';
import { getInitials, getClientName, formatRelativeDate, cn, stageBadge } from '@/lib/utils';
import Link from 'next/link';

export const ClientList = ({ clients }: { clients: Client[] }) => {
  const [search, setSearch] = useState('');
  const [typeF, setTypeF] = useState<ClientType | 'all'>('all');
  const [stageF, setStageF] = useState<LifecycleStage | 'all'>('all');

  const filtered = useMemo(() => clients.filter((c) => {
    const s = search.toLowerCase();
    const matchSearch = !s || getClientName(c).toLowerCase().includes(s) || c.email.toLowerCase().includes(s) || c.phone.includes(s);
    return matchSearch && (typeF === 'all' || c.clientType === typeF) && (stageF === 'all' || c.lifecycleStage === stageF);
  }), [clients, search, typeF, stageF]);

  return (
    <div>
      <div className="surface p-3 mb-3">
        <div className="flex gap-2">
          <input className="input flex-1" placeholder="Search clients..." value={search} onChange={(e) => setSearch(e.target.value)} />
          <select className="select w-auto" style={{ minWidth: 120 }} value={typeF} onChange={(e) => setTypeF(e.target.value as ClientType | 'all')}>
            <option value="all">All Types</option>
            <option value="rental">Rental</option>
            <option value="buyer">Buyer</option>
            <option value="investor">Investor</option>
          </select>
          <select className="select w-auto" style={{ minWidth: 140 }} value={stageF} onChange={(e) => setStageF(e.target.value as LifecycleStage | 'all')}>
            <option value="all">All Stages</option>
            {Object.entries(LIFECYCLE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
      </div>

      <div className="surface overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b" style={{ borderColor: 'var(--border)', background: 'var(--bg-1)' }}>
              {['Client', 'Type', 'Stage', 'Phone', 'Source', 'Last Contact'].map((h, i) => (
                <th key={h} className={cn('text-[11px] font-bold uppercase tracking-wider p-3', i === 0 ? 'text-left pl-4' : i === 5 ? 'text-right pr-4' : 'text-left')}
                  style={{ color: 'var(--text-tertiary)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((c, i) => (
              <tr key={c.id} className="border-b hover:bg-[var(--surface-hover)] transition-colors animate-in"
                style={{ borderColor: 'var(--border-subtle)', animationDelay: `${i * 25}ms` }}>
                <td className="p-3 pl-4">
                  <Link href={`/clients/${c.id}`} className="flex items-center gap-2.5 group">
                    <div className="w-8 h-8 rounded-full bg-[var(--accent-muted)] flex items-center justify-center text-[11px] font-bold shrink-0"
                      style={{ color: 'var(--accent-text)' }}>
                      {getInitials(c.firstName, c.lastName)}
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold group-hover:text-[var(--accent-text)] transition-colors" style={{ color: 'var(--text-primary)' }}>
                        {getClientName(c)}
                      </p>
                      <p className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>{c.email}</p>
                    </div>
                  </Link>
                </td>
                <td className="p-3"><span className="text-[12px] capitalize" style={{ color: 'var(--text-secondary)' }}>{c.clientType}</span></td>
                <td className="p-3"><span className={cn('badge text-[10px]', stageBadge[c.lifecycleStage])}>{LIFECYCLE_LABELS[c.lifecycleStage]}</span></td>
                <td className="p-3"><span className="text-[12px] font-mono" style={{ color: 'var(--text-secondary)' }}>{c.phone}</span></td>
                <td className="p-3"><span className="text-[12px]" style={{ color: 'var(--text-tertiary)' }}>{c.source}</span></td>
                <td className="p-3 pr-4 text-right"><span className="text-[11px] font-mono" style={{ color: 'var(--text-quaternary)' }}>{formatRelativeDate(c.lastContact)}</span></td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="p-8 text-center text-sm" style={{ color: 'var(--text-tertiary)' }}>No clients match your filters.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
