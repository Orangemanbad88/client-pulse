'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, LayoutDashboard, Users, Building2, Calendar, MessageSquare, BarChart3, Download, Home, Settings, Moon, Sun, Menu, X, Mail } from 'lucide-react';
import type { Client } from '@/types/client';
import * as service from '@/services';
import { CommandPalette } from '@/components/layout/CommandPalette';

export const ClientShell = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const [dark, setDark] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [matchCount, setMatchCount] = useState(0);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('clientpulse-dark');
    if (saved === 'true') setDark(true);
    service.getClients().then(setClients).catch((err) => console.error('Failed to load clients for shell:', err));
    service.getAllMatches().then((m) => setMatchCount(m.length)).catch((err) => console.error('Failed to load matches count:', err));
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('clientpulse-dark', String(dark));
  }, [dark]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      setCmdOpen((p) => !p);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/' },
    { id: 'clients', label: 'Clients', icon: Users, href: '/clients', count: clients.length || undefined },
    { id: 'properties', label: 'Properties', icon: Building2, href: '/properties', count: matchCount || undefined },
    { id: 'calendar', label: 'Calendar', icon: Calendar, href: '/calendar', badge: '2' },
    { id: 'messages', label: 'Messages', icon: MessageSquare, href: '/messages', count: 3 },
    { id: 'email', label: 'Email', icon: Mail, href: '/email' },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, href: '/analytics' },
  ];

  const toolItems = [
    { label: 'CompAtlas', icon: Download, href: '/comp-atlas' },
    { label: 'RentAtlas', icon: Home, href: '/rent-atlas' },
  ];

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <>
      <div className={`flex h-screen bg-dot-grid text-gray-800 dark:text-gray-200`} style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", background: dark ? undefined : 'linear-gradient(145deg, #faf8f5 0%, #f5f0e8 40%, #faf5ee 70%, #f7f5f0 100%)' }}>
        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-40 lg:hidden" onClick={() => setSidebarOpen(false)}>
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          </div>
        )}

        {/* Sidebar */}
        <aside className={`fixed inset-y-0 left-0 z-50 w-64 lg:w-60 border-r border-[#334155] dark:border-[#1e293b] flex flex-col shrink-0 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`} style={{ background: dark ? 'linear-gradient(180deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)' : 'linear-gradient(180deg, #334155 0%, #1E293B 50%, #334155 100%)' }}>
          {/* Logo */}
          <div className="px-5 py-5 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gold to-gold-muted flex items-center justify-center shadow-md shadow-gold/15">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 2L2 6v4l6 4 6-4V6L8 2z" stroke="white" strokeWidth="1.5" fill="none" />
                <circle cx="8" cy="8" r="2" fill="white" />
              </svg>
            </div>
            <span className="font-bold text-base tracking-tight text-white">ClientPulse</span>
            <button onClick={() => setSidebarOpen(false)} className="ml-auto p-1.5 rounded-lg hover:bg-white/10 lg:hidden transition-colors">
              <X size={18} className="text-slate-400" />
            </button>
          </div>

          {/* Search */}
          <div className="px-4 mb-4">
            <button
              onClick={() => { setCmdOpen(true); setSidebarOpen(false); }}
              className="w-full flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2 text-sm text-slate-400 border border-white/10 transition-colors hover:bg-white/10"
            >
              <Search size={14} />
              <span>Search...</span>
              <span className="ml-auto text-xs bg-white/10 border border-white/10 rounded px-1.5 py-0.5 text-slate-500 font-medium">⌘K</span>
            </button>
          </div>

          {/* Nav */}
          <nav className="px-3 flex-1 overflow-y-auto">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-2 mb-2">Main</p>
            {navItems.map(item => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium mb-0.5 transition-all ${
                    active
                      ? 'bg-gold/15 text-gold-light'
                      : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                  }`}
                >
                  <item.icon size={18} strokeWidth={active ? 2 : 1.5} />
                  {item.label}
                  {item.count && (
                    <span className="ml-auto text-xs text-gold-light bg-gold/15 rounded-full px-2 py-0.5 font-data">{item.count}</span>
                  )}
                  {item.badge && (
                    <span className="ml-auto text-xs text-white bg-gold rounded-full px-1.5 py-0.5 font-data font-bold min-w-[20px] text-center">{item.badge}</span>
                  )}
                </Link>
              );
            })}

            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-2 mb-2 mt-6">Tools</p>
            {toolItems.map((tool) => {
              const active = isActive(tool.href);
              return (
                <Link
                  key={tool.label}
                  href={tool.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium mb-0.5 transition-all ${
                    active
                      ? 'bg-gold/15 text-gold-light'
                      : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                  }`}
                >
                  <tool.icon size={18} strokeWidth={active ? 2 : 1.5} />
                  {tool.label}
                </Link>
              );
            })}
          </nav>

          {/* Bottom */}
          <div className="px-3 py-4 border-t border-white/10">
            <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:bg-white/5 hover:text-slate-200 mb-0.5">
              <Settings size={18} strokeWidth={1.5} /> Settings
            </button>
            <button
              onClick={() => setDark(d => !d)}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:bg-white/5 hover:text-slate-200"
            >
              {dark ? <Sun size={18} strokeWidth={1.5} /> : <Moon size={18} strokeWidth={1.5} />}
              {dark ? 'Light Mode' : 'Dark Mode'}
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          {/* Mobile header bar */}
          <div className="sticky top-0 z-10 backdrop-blur-xl border-b border-[#334155] lg:hidden" style={{ background: dark ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)' : 'linear-gradient(135deg, #334155 0%, #1E293B 50%, #334155 100%)' }}>
            <div className="px-4 py-3 flex items-center gap-3">
              <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
                <Menu size={20} className="text-slate-400" />
              </button>
              <span className="font-bold text-sm text-white">ClientPulse</span>
            </div>
          </div>
          <div className={`${mounted ? '' : 'opacity-0'}`}>
            {children}
          </div>
        </main>
      </div>
      <CommandPalette isOpen={cmdOpen} onClose={() => setCmdOpen(false)} clients={clients} />
    </>
  );
};
