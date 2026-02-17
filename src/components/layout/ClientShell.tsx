'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, LayoutDashboard, Users, Building2, Calendar, MessageSquare, BarChart3, Download, Home, Settings, Moon, Sun, Menu, X, Mail } from 'lucide-react';
import type { Client } from '@/types/client';
import * as service from '@/services/mock-service';
import { CommandPalette } from '@/components/layout/CommandPalette';

export const ClientShell = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const [dark, setDark] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('clientpulse-dark');
    if (saved === 'true') setDark(true);
    service.getClients().then(setClients).catch((err) => console.error('Failed to load clients for shell:', err));
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
    { id: 'clients', label: 'Clients', icon: Users, href: '/clients', count: 10 },
    { id: 'properties', label: 'Properties', icon: Building2, href: '/properties', count: 24 },
    { id: 'calendar', label: 'Calendar', icon: Calendar, href: '/calendar', badge: '2' },
    { id: 'messages', label: 'Messages', icon: MessageSquare, href: '/messages', count: 3 },
    { id: 'email', label: 'Email', icon: Mail, href: '/email' },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, href: '/analytics' },
  ];

  const toolItems = [
    { label: 'CompAtlas', icon: Download, href: '/comp-atlas', port: ':3001' },
    { label: 'RentAtlas', icon: Home, href: '/rent-atlas', port: ':3002' },
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
        <aside className={`fixed inset-y-0 left-0 z-50 w-64 lg:w-60 bg-white/90 dark:bg-gray-900/95 backdrop-blur-xl border-r border-amber-200/25 dark:border-gray-800 flex flex-col shrink-0 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          {/* Logo */}
          <div className="px-5 py-5 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center shadow-md shadow-teal-500/15">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 2L2 6v4l6 4 6-4V6L8 2z" stroke="white" strokeWidth="1.5" fill="none" />
                <circle cx="8" cy="8" r="2" fill="white" />
              </svg>
            </div>
            <span className="font-bold text-base tracking-tight text-gray-900 dark:text-white">ClientPulse</span>
            <button onClick={() => setSidebarOpen(false)} className="ml-auto p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 lg:hidden transition-colors">
              <X size={18} className="text-gray-500" />
            </button>
          </div>

          {/* Search */}
          <div className="px-4 mb-4">
            <button
              onClick={() => { setCmdOpen(true); setSidebarOpen(false); }}
              className="w-full flex items-center gap-2 bg-amber-50/40 dark:bg-gray-800/50 rounded-lg px-3 py-2 text-sm text-gray-400 border border-amber-200/25 dark:border-gray-700/50 transition-colors hover:bg-amber-50/60 dark:hover:bg-gray-800/70"
            >
              <Search size={14} />
              <span>Search...</span>
              <span className="ml-auto text-xs bg-white dark:bg-gray-800 border border-teal-100 dark:border-gray-700 rounded px-1.5 py-0.5 text-gray-400 font-medium">⌘K</span>
            </button>
          </div>

          {/* Nav */}
          <nav className="px-3 flex-1 overflow-y-auto">
            <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-2 mb-2">Main</p>
            {navItems.map(item => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium mb-0.5 transition-all ${
                    active
                      ? 'bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400'
                      : 'text-gray-500 dark:text-gray-400 hover:bg-teal-50/50 dark:hover:bg-gray-800/50 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  <item.icon size={18} strokeWidth={active ? 2 : 1.5} />
                  {item.label}
                  {item.count && (
                    <span className="ml-auto text-xs text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/30 rounded-full px-2 py-0.5 font-data">{item.count}</span>
                  )}
                  {item.badge && (
                    <span className="ml-auto text-xs text-white bg-teal-500 rounded-full px-1.5 py-0.5 font-data font-bold min-w-[20px] text-center">{item.badge}</span>
                  )}
                </Link>
              );
            })}

            <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-2 mb-2 mt-6">Tools</p>
            {toolItems.map((tool) => {
              const active = isActive(tool.href);
              return (
                <Link
                  key={tool.label}
                  href={tool.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium mb-0.5 transition-all ${
                    active
                      ? 'bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400'
                      : 'text-gray-500 dark:text-gray-400 hover:bg-teal-50/50 dark:hover:bg-gray-800/50 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  <tool.icon size={18} strokeWidth={active ? 2 : 1.5} />
                  {tool.label}
                  <span className="ml-auto text-xs text-gray-400 dark:text-gray-500 font-mono">{tool.port}</span>
                </Link>
              );
            })}
          </nav>

          {/* Bottom */}
          <div className="px-3 py-4 border-t border-amber-200/25 dark:border-gray-800">
            <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-teal-50/50 dark:hover:bg-gray-800/50 hover:text-gray-700 dark:hover:text-gray-300 mb-0.5">
              <Settings size={18} strokeWidth={1.5} /> Settings
            </button>
            <button
              onClick={() => setDark(d => !d)}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-teal-50/50 dark:hover:bg-gray-800/50 hover:text-gray-700 dark:hover:text-gray-300"
            >
              {dark ? <Sun size={18} strokeWidth={1.5} /> : <Moon size={18} strokeWidth={1.5} />}
              {dark ? 'Light Mode' : 'Dark Mode'}
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          {/* Mobile header bar */}
          <div className="sticky top-0 z-10 bg-white/50 dark:bg-gray-900/70 backdrop-blur-xl border-b border-amber-200/25 dark:border-gray-800/60 lg:hidden">
            <div className="px-4 py-3 flex items-center gap-3">
              <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg hover:bg-teal-50 dark:hover:bg-gray-800 transition-colors">
                <Menu size={20} className="text-gray-600 dark:text-gray-400" />
              </button>
              <span className="font-bold text-sm text-gray-900 dark:text-white">ClientPulse</span>
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
