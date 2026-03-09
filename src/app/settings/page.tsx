'use client';

import { useEffect, useState } from 'react';
import { Settings, User, Palette, Calendar, Database, Mail, Check, Save, Bell, LogOut } from 'lucide-react';

interface ConnectedAccount {
  id: string;
  provider: 'gmail' | 'outlook';
  email: string;
  isPrimary: boolean;
}

export default function SettingsPage() {
  const [agentName, setAgentName] = useState('');
  const [saved, setSaved] = useState(false);
  const [calendarConnected, setCalendarConnected] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [autoAlerts, setAutoAlerts] = useState(true);
  const [alertsToggling, setAlertsToggling] = useState(false);
  const [emailAccounts, setEmailAccounts] = useState<ConnectedAccount[]>([]);
  const [connectingProvider, setConnectingProvider] = useState<string | null>(null);

  const dataSource = process.env.NEXT_PUBLIC_DATA_SOURCE || 'mock';
  const resendConfigured = !!process.env.NEXT_PUBLIC_RESEND_CONFIGURED;

  const fetchEmailAccounts = async () => {
    try {
      const res = await fetch('/api/email/accounts');
      const data = await res.json();
      if (data.success) {
        setEmailAccounts(data.accounts);
      }
    } catch {
      // Non-critical
    }
  };

  useEffect(() => {
    setMounted(true);
    const name = localStorage.getItem('clientpulse-agent-name') || '';
    setAgentName(name);
    const tokens = localStorage.getItem('google_calendar_tokens');
    setCalendarConnected(!!tokens);

    // Load auto-alerts setting
    fetch('/api/settings?key=autoAlertsEnabled')
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.value !== null) {
          setAutoAlerts(d.value === 'true');
        }
      })
      .catch(() => {});

    fetchEmailAccounts();
  }, []);

  const handleToggleAlerts = async () => {
    setAlertsToggling(true);
    const newVal = !autoAlerts;
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'autoAlertsEnabled', value: String(newVal) }),
      });
      const result = await res.json();
      if (result.success) {
        setAutoAlerts(newVal);
      }
    } catch {
      // keep original on failure
    } finally {
      setAlertsToggling(false);
    }
  };

  const handleSaveName = () => {
    localStorage.setItem('clientpulse-agent-name', agentName);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleConnect = async (provider: 'gmail' | 'outlook') => {
    setConnectingProvider(provider);
    try {
      const endpoint = provider === 'gmail'
        ? '/api/auth/gmail/connect'
        : '/api/auth/outlook/connect';
      const res = await fetch(endpoint);
      const data = await res.json();
      if (data.success && data.url) {
        window.location.href = data.url;
      }
    } catch {
      setConnectingProvider(null);
    }
  };

  const handleDisconnect = async (id: string) => {
    try {
      const res = await fetch('/api/email/accounts', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (data.success) {
        setEmailAccounts((prev) => prev.filter((a) => a.id !== id));
      }
    } catch {
      // Non-critical
    }
  };

  const gmailAccount = emailAccounts.find((a) => a.provider === 'gmail');
  const outlookAccount = emailAccounts.find((a) => a.provider === 'outlook');

  if (!mounted) return null;

  return (
    <>
      <header
        className="sticky top-0 z-10 px-4 lg:px-8 py-3 lg:py-4 border-b border-[#132a4a]/50 flex items-center justify-between"
        style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #132a4a 50%, #1e3a5f 100%)' }}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold to-gold-muted flex items-center justify-center shadow-sm shadow-gold/15">
            <Settings size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg text-white" style={{ fontWeight: 600, letterSpacing: '-0.025em' }}>Settings</h1>
            <p className="text-xs text-slate-400 mt-0.5">App configuration</p>
          </div>
        </div>
      </header>
      <div className="px-4 lg:px-8 py-4 lg:py-6 space-y-6 max-w-3xl">

        {/* Integrations */}
        <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl rounded-xl border border-amber-200/25 dark:border-gray-800/60 shadow-sm p-5">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-1.5 h-5 rounded-full bg-gold" />
            <h2 className="text-sm font-bold text-gray-800 dark:text-gray-100 tracking-tight">Integrations</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center">
                  <Calendar size={16} className="text-gold dark:text-gold-light" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-100">Google Calendar</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">Sync showings and appointments</p>
                </div>
              </div>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                calendarConnected
                  ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500'
              }`}>
                {calendarConnected ? 'Connected' : 'Not connected'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center">
                  <Database size={16} className="text-gold dark:text-gold-light" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-100">Data Source</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">Current backend connection</p>
                </div>
              </div>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                dataSource === 'supabase'
                  ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400'
                  : 'bg-amber-50 dark:bg-amber-900/20 text-gold-muted dark:text-gold-light'
              }`}>
                {dataSource === 'supabase' ? 'Supabase' : 'Mock Data'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center">
                  <Mail size={16} className="text-gold dark:text-gold-light" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-100">Email (Resend)</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">Fallback transactional email delivery</p>
                </div>
              </div>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                resendConfigured
                  ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500'
              }`}>
                {resendConfigured ? 'Configured' : 'Not configured'}
              </span>
            </div>

            {/* Gmail Account */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center">
                  <Mail size={16} className="text-gold dark:text-gold-light" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-100">Gmail</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    {gmailAccount ? gmailAccount.email : 'Send emails from your Gmail account'}
                  </p>
                </div>
              </div>
              {gmailAccount ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400">
                    Connected
                  </span>
                  <button
                    onClick={() => handleDisconnect(gmailAccount.id)}
                    className="p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    title="Disconnect Gmail"
                  >
                    <LogOut size={14} className="text-gray-400 hover:text-red-500" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => handleConnect('gmail')}
                  disabled={connectingProvider === 'gmail'}
                  className="text-xs font-medium px-3 py-1.5 rounded-lg bg-gold hover:bg-gold-muted text-white transition-colors shadow-sm shadow-gold/20 disabled:opacity-50"
                >
                  {connectingProvider === 'gmail' ? 'Connecting...' : 'Connect'}
                </button>
              )}
            </div>

            {/* Outlook Account */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center">
                  <Mail size={16} className="text-gold dark:text-gold-light" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-100">Outlook</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    {outlookAccount ? outlookAccount.email : 'Send emails from your Outlook account'}
                  </p>
                </div>
              </div>
              {outlookAccount ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400">
                    Connected
                  </span>
                  <button
                    onClick={() => handleDisconnect(outlookAccount.id)}
                    className="p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    title="Disconnect Outlook"
                  >
                    <LogOut size={14} className="text-gray-400 hover:text-red-500" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => handleConnect('outlook')}
                  disabled={connectingProvider === 'outlook'}
                  className="text-xs font-medium px-3 py-1.5 rounded-lg bg-gold hover:bg-gold-muted text-white transition-colors shadow-sm shadow-gold/20 disabled:opacity-50"
                >
                  {connectingProvider === 'outlook' ? 'Connecting...' : 'Connect'}
                </button>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center">
                  <Bell size={16} className="text-gold dark:text-gold-light" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-100">Auto-Alerts</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">Email clients when new matches are found</p>
                </div>
              </div>
              <button
                onClick={handleToggleAlerts}
                disabled={alertsToggling}
                className={`text-xs font-medium px-2.5 py-1 rounded-full cursor-pointer transition-colors disabled:opacity-50 ${
                  autoAlerts
                    ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {alertsToggling ? '...' : autoAlerts ? 'Enabled' : 'Disabled'}
              </button>
            </div>
          </div>
        </div>

        {/* Agent Profile */}
        <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl rounded-xl border border-amber-200/25 dark:border-gray-800/60 shadow-sm p-5">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-1.5 h-5 rounded-full bg-gold-light" />
            <h2 className="text-sm font-bold text-gray-800 dark:text-gray-100 tracking-tight">Agent Profile</h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center">
              <User size={16} className="text-gold dark:text-gold-light" />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Agent Name</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={agentName}
                  onChange={(e) => setAgentName(e.target.value)}
                  placeholder="e.g. Tom McCarthy"
                  className="flex-1 px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold"
                />
                <button
                  onClick={handleSaveName}
                  className="flex items-center gap-1.5 text-xs font-medium text-white bg-gold hover:bg-gold-muted px-3 py-2 rounded-lg transition-colors shadow-sm shadow-gold/20 active:scale-[0.97]"
                >
                  {saved ? <Check size={13} /> : <Save size={13} />}
                  {saved ? 'Saved' : 'Save'}
                </button>
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">Used in email signatures and templates</p>
            </div>
          </div>
        </div>

        {/* Display */}
        <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl rounded-xl border border-amber-200/25 dark:border-gray-800/60 shadow-sm p-5">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-1.5 h-5 rounded-full bg-gold" />
            <h2 className="text-sm font-bold text-gray-800 dark:text-gray-100 tracking-tight">Display</h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center">
              <Palette size={16} className="text-gold dark:text-gold-light" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-800 dark:text-gray-100">Theme</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                Dark navy/charcoal + gold/amber accent on warm cream. Toggle dark mode from the sidebar.
              </p>
            </div>
          </div>
        </div>

      </div>
    </>
  );
}
