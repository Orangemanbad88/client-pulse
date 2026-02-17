'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { Client } from '@/types/client';
import { getInitials, getClientName } from '@/lib/utils';
import { LIFECYCLE_LABELS } from '@/types/client';
import { Search } from 'lucide-react';

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
    { id: 'nav-comp', label: 'Go to CompAtlas', sublabel: 'Sales comparables', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>, action: () => { router.push('/comp-atlas'); onClose(); } },
    { id: 'nav-rent', label: 'Go to RentAtlas', sublabel: 'Rental comparables', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>, action: () => { router.push('/rent-atlas'); onClose(); } },
    { id: 'new-client', label: 'New Client', sublabel: 'Open intake form', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>, action: () => { router.push('/clients?new=true'); onClose(); } },
    ...clients.map((c) => ({
      id: c.id,
      label: getClientName(c),
      sublabel: `${c.clientType} · ${LIFECYCLE_LABELS[c.lifecycleStage]}`,
      icon: <div className="w-5 h-5 rounded-full bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center text-[9px] font-bold text-teal-600 dark:text-teal-400">{getInitials(c.firstName, c.lastName)}</div>,
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
        className="relative w-[520px] max-h-[380px] bg-white dark:bg-gray-900 border border-amber-200/25 dark:border-gray-800 rounded-xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 px-4 border-b border-amber-100/30 dark:border-gray-800">
          <Search size={15} className="text-gray-400" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search clients, navigate..."
            className="flex-1 py-3 bg-transparent text-sm outline-none text-gray-800 dark:text-gray-100 placeholder:text-gray-400"
          />
          <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-400 border border-gray-200 dark:border-gray-700">ESC</kbd>
        </div>
        <div className="max-h-[310px] overflow-y-auto p-1.5">
          {filtered.length === 0 && (
            <div className="px-3 py-8 text-center text-sm text-gray-400">
              No results for &ldquo;{query}&rdquo;
            </div>
          )}
          {filtered.map((item, idx) => (
            <button
              key={item.id}
              onClick={item.action}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                idx === activeIdx
                  ? 'bg-teal-50 dark:bg-teal-900/20'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
              }`}
            >
              <span className={idx === activeIdx ? 'text-teal-600 dark:text-teal-400' : 'text-gray-400'}>{item.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium truncate text-gray-800 dark:text-gray-100">{item.label}</p>
                <p className="text-[11px] truncate text-gray-400 dark:text-gray-500">{item.sublabel}</p>
              </div>
              {idx === activeIdx && (
                <span className="text-[10px] font-mono text-gray-400">↵</span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
