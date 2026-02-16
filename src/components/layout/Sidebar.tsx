'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from '@/components/ThemeProvider';
import { cn } from '@/lib/utils';

const nav = [
  { label: 'Dashboard', href: '/', icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
  )},
  { label: 'Clients', href: '/clients', icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
  )},
];

const bottomNav = [
  { label: 'Settings', href: '#', icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
  )},
];

export const Sidebar = ({ onCommandOpen }: { onCommandOpen: () => void }) => {
  const pathname = usePathname();
  const { theme, toggle } = useTheme();

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="px-4 h-14 flex items-center border-b" style={{ borderColor: 'var(--sidebar-border)' }}>
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-7 h-7 rounded-lg bg-[var(--accent)] flex items-center justify-center transition-transform group-hover:scale-105">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
            </svg>
          </div>
          <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
            ClientPulse
          </span>
        </Link>
      </div>

      {/* Search trigger - Linear Cmd+K style */}
      <div className="px-3 pt-3 pb-1">
        <button
          onClick={onCommandOpen}
          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-colors"
          style={{ background: 'var(--sidebar-hover)', color: 'var(--text-tertiary)' }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <span className="flex-1 text-left">Search...</span>
          <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ background: 'var(--bg-2)', color: 'var(--text-tertiary)', border: '1px solid var(--border)' }}>⌘K</kbd>
        </button>
      </div>

      {/* Main Nav */}
      <nav className="flex-1 px-3 py-2 space-y-0.5">
        <p className="text-label px-2.5 pt-3 pb-1.5">Main</p>
        {nav.map((item) => {
          const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-2.5 px-2.5 py-[7px] rounded-lg text-[13px] font-medium transition-all',
                active
                  ? 'font-semibold'
                  : 'hover:bg-[var(--sidebar-hover)]'
              )}
              style={{
                color: active ? 'var(--sidebar-text-active)' : 'var(--sidebar-text)',
                background: active ? 'var(--sidebar-active)' : undefined,
              }}
            >
              <span style={{ color: active ? 'var(--accent)' : 'var(--text-tertiary)' }}>{item.icon}</span>
              {item.label}
              {item.label === 'Clients' && (
                <span className="ml-auto text-[11px] font-mono" style={{ color: 'var(--text-tertiary)' }}>10</span>
              )}
            </Link>
          );
        })}

        <p className="text-label px-2.5 pt-5 pb-1.5">Tools</p>
        <Link
          href="#"
          className="flex items-center gap-2.5 px-2.5 py-[7px] rounded-lg text-[13px] font-medium transition-all hover:bg-[var(--sidebar-hover)]"
          style={{ color: 'var(--sidebar-text)' }}
        >
          <span style={{ color: 'var(--text-tertiary)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          </span>
          CompAtlas
          <span className="ml-auto text-[10px] pill">:3001</span>
        </Link>
        <Link
          href="#"
          className="flex items-center gap-2.5 px-2.5 py-[7px] rounded-lg text-[13px] font-medium transition-all hover:bg-[var(--sidebar-hover)]"
          style={{ color: 'var(--sidebar-text)' }}
        >
          <span style={{ color: 'var(--text-tertiary)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          </span>
          RentAtlas
          <span className="ml-auto text-[10px] pill">:3002</span>
        </Link>
      </nav>

      {/* Bottom */}
      <div className="px-3 pb-3 space-y-0.5 border-t pt-2" style={{ borderColor: 'var(--sidebar-border)' }}>
        {bottomNav.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="flex items-center gap-2.5 px-2.5 py-[7px] rounded-lg text-[13px] font-medium transition-all hover:bg-[var(--sidebar-hover)]"
            style={{ color: 'var(--sidebar-text)' }}
          >
            <span style={{ color: 'var(--text-tertiary)' }}>{item.icon}</span>
            {item.label}
          </Link>
        ))}
        <button
          onClick={toggle}
          className="w-full flex items-center gap-2.5 px-2.5 py-[7px] rounded-lg text-[13px] font-medium transition-all hover:bg-[var(--sidebar-hover)]"
          style={{ color: 'var(--sidebar-text)' }}
        >
          <span style={{ color: 'var(--text-tertiary)' }}>
            {theme === 'dark' ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
            )}
          </span>
          {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
        </button>
      </div>
    </aside>
  );
};
