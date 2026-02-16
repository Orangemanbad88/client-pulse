'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { Client } from '@/types/client';
import { getInitials, getClientName, cn } from '@/lib/utils';
import { LIFECYCLE_LABELS } from '@/types/client';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  clients: Client[];
}

type CmdItem = { id: string; label: string; sublabel: string; icon: React.ReactNode; action: () => void; };

export const CommandPalette = ({ isOpen, onClose, clients }: CommandPaletteProps) => {
  const [query, setQuery] = useState('');
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const items: CmdItem[] = [
    { id: 'nav-dash', label: 'Go to Dashboard', sublabel: 'View overview', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>, action: () => { router.push('/'); onClose(); } },
    { id: 'nav-clients', label: 'Go to Clients', sublabel: 'View all clients', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>, action: () => { router.push('/clients'); onClose(); } },
    { id: 'new-client', label: 'New Client', sublabel: 'Open intake form', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>, action: () => { router.push('/clients?new=true'); onClose(); } },
    ...clients.map((c) => ({
      id: c.id,
      label: getClientName(c),
      sublabel: `${c.clientType} · ${LIFECYCLE_LABELS[c.lifecycleStage]}`,
      icon: <div className="w-5 h-5 rounded-full bg-[var(--accent-muted)] flex items-center justify-center text-[9px] font-bold" style={{ color: 'var(--accent-text)' }}>{getInitials(c.firstName, c.lastName)}</div>,
      action: () => { router.push(`/clients/${c.id}`); onClose(); },
    })),
  ];

  const filtered = query
    ? items.filter((i) => i.label.toLowerCase().includes(query.toLowerCase()) || i.sublabel.toLowerCase().includes(query.toLowerCase()))
    : items;

  useEffect(() => { setActiveIdx(0); }, [query]);
  useEffect(() => { if (isOpen) { setQuery(''); inputRef.current?.focus(); } }, [isOpen]);

  const onKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx((i) => Math.min(i + 1, filtered.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx((i) => Math.max(i - 1, 0)); }
    if (e.key === 'Enter' && filtered[activeIdx]) { filtered[activeIdx].action(); }
    if (e.key === 'Escape') onClose();
  }, [filtered, activeIdx, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[18vh]" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative w-[520px] max-h-[380px] surface-elevated overflow-hidden animate-slide-down"
        style={{ borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-lg)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 px-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search clients, navigate..."
            className="flex-1 py-3 bg-transparent text-sm outline-none"
            style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-sans)' }}
          />
          <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ background: 'var(--bg-2)', color: 'var(--text-tertiary)', border: '1px solid var(--border)' }}>ESC</kbd>
        </div>
        <div className="max-h-[310px] overflow-y-auto p-1.5">
          {filtered.length === 0 && (
            <div className="px-3 py-8 text-center text-sm" style={{ color: 'var(--text-tertiary)' }}>
              No results for &ldquo;{query}&rdquo;
            </div>
          )}
          {filtered.map((item, idx) => (
            <button
              key={item.id}
              onClick={item.action}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors',
                idx === activeIdx ? 'bg-[var(--accent-muted)]' : 'hover:bg-[var(--surface-hover)]'
              )}
            >
              <span style={{ color: idx === activeIdx ? 'var(--accent-text)' : 'var(--text-tertiary)' }}>{item.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium truncate" style={{ color: 'var(--text-primary)' }}>{item.label}</p>
                <p className="text-[11px] truncate" style={{ color: 'var(--text-tertiary)' }}>{item.sublabel}</p>
              </div>
              {idx === activeIdx && (
                <span className="text-[10px] font-mono" style={{ color: 'var(--text-tertiary)' }}>↵</span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
