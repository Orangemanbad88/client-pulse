'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Mail, Send, Star, Archive, Inbox, Clock, Paperclip, Reply, Forward, Trash2 } from 'lucide-react';
import type { Client } from '@/types/client';
import { getInitialsFromName } from '@/lib/utils';
import * as svc from '@/services/mock-service';

interface EmailThread {
  id: string;
  clientId: string;
  clientName: string;
  subject: string;
  preview: string;
  date: string;
  read: boolean;
  starred: boolean;
  hasAttachment: boolean;
  folder: 'inbox' | 'sent' | 'drafts';
}

const mockEmails: EmailThread[] = [
  { id: 'e1', clientId: 'cl_001', clientName: 'Sarah Chen', subject: 'Re: New listings in Dunedin area', preview: 'Hi Tom, thanks for sending those over! I really liked the one on Virginia Ln. Could we schedule a showing this week?', date: '2024-02-14T10:30:00Z', read: false, starred: true, hasAttachment: false, folder: 'inbox' },
  { id: 'e2', clientId: 'cl_003', clientName: 'Marcus Johnson', subject: 'Tour confirmation - 880 Mandalay Ave', preview: 'Confirming our tour tomorrow at 2pm. I\'ll meet you in the lobby. Looking forward to seeing the unit!', date: '2024-02-14T09:15:00Z', read: false, starred: false, hasAttachment: false, folder: 'inbox' },
  { id: 'e3', clientId: 'cl_005', clientName: 'Robert Thompson', subject: 'Investment property analysis - 1580 Alt 19 N', preview: 'Tom, I\'ve been running the numbers on the triplex. The 8.3% cap rate looks solid. Can you pull comps for similar multi-family in the area?', date: '2024-02-13T16:45:00Z', read: true, starred: true, hasAttachment: true, folder: 'inbox' },
  { id: 'e4', clientId: 'cl_002', clientName: 'Ashley Williams', subject: 'Welcome to ClientPulse - Next Steps', preview: 'Hi Ashley, welcome! I\'ve set up your profile and started matching properties based on your preferences. Here are a few to get started...', date: '2024-02-13T14:20:00Z', read: true, starred: false, hasAttachment: true, folder: 'sent' },
  { id: 'e5', clientId: 'cl_004', clientName: 'Jennifer Martinez', subject: 'Lease renewal options', preview: 'Hi Jennifer, your lease at 550 Palm Harbor is coming up for renewal. I wanted to discuss your options — we have some great new listings...', date: '2024-02-12T11:00:00Z', read: true, starred: false, hasAttachment: false, folder: 'sent' },
  { id: 'e6', clientId: 'cl_001', clientName: 'Sarah Chen', subject: 'Pet policy confirmation', preview: 'Just confirmed with the landlord — 725 Virginia Ln does allow dogs up to 50lbs with a $300 pet deposit. Should be perfect for your golden!', date: '2024-02-12T09:30:00Z', read: true, starred: false, hasAttachment: false, folder: 'sent' },
  { id: 'e7', clientId: 'cl_006', clientName: 'David Kim', subject: 'Market update - Clearwater Beach condos', preview: 'Hey David, wanted to share the latest market data for Clearwater Beach condos. Prices have softened slightly...', date: '2024-02-11T15:00:00Z', read: true, starred: false, hasAttachment: true, folder: 'sent' },
];

export default function EmailPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [folder, setFolder] = useState<'inbox' | 'sent' | 'drafts' | 'all'>('inbox');
  const [selectedEmail, setSelectedEmail] = useState<EmailThread | null>(null);
  const [emails, setEmails] = useState(mockEmails);

  useEffect(() => {
    svc.getClients()
      .then((c) => { setClients(c); setLoading(false); })
      .catch((err) => { console.error('Failed to load email data:', err); setLoading(false); });
  }, []);

  const filtered = folder === 'all' ? emails : emails.filter((e) => e.folder === folder);
  const unreadCount = emails.filter((e) => !e.read && e.folder === 'inbox').length;

  const getInitials = getInitialsFromName;

  const toggleStar = (id: string) => {
    setEmails((prev) => prev.map((e) => e.id === id ? { ...e, starred: !e.starred } : e));
  };

  const folders = [
    { id: 'inbox' as const, label: 'Inbox', icon: Inbox, count: unreadCount },
    { id: 'sent' as const, label: 'Sent', icon: Send, count: 0 },
    { id: 'all' as const, label: 'All Mail', icon: Mail, count: 0 },
  ];

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <p className="text-sm text-gray-400">Loading...</p>
    </div>
  );

  return (
    <>
      <header
        className="px-4 lg:px-8 py-3 lg:py-4 border-b border-[#1E293B]/50 flex items-center justify-between"
        style={{ background: 'linear-gradient(135deg, #475569 0%, #1E293B 50%, #475569 100%)' }}
      >
        <div>
          <h1 className="text-lg text-white" style={{ fontWeight: 600, letterSpacing: '-0.025em' }}>Email</h1>
          <p className="text-xs text-slate-400 mt-0.5">{unreadCount} unread</p>
        </div>
        <button className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors shadow-sm shadow-teal-600/20 active:scale-[0.97]">
          <Mail size={14} /> Compose
        </button>
      </header>
      <div className="px-4 lg:px-8 py-4 lg:py-6">

      <div className="flex gap-6">
        {/* Folder sidebar */}
        <div className="w-40 shrink-0 hidden lg:block">
          <div className="space-y-1">
            {folders.map((f) => (
              <button
                key={f.id}
                onClick={() => { setFolder(f.id); setSelectedEmail(null); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  folder === f.id
                    ? 'bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/50'
                }`}
              >
                <f.icon size={16} strokeWidth={folder === f.id ? 2 : 1.5} />
                {f.label}
                {f.count > 0 && (
                  <span className="ml-auto text-xs font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/30 rounded-full px-1.5 py-0.5 font-data">{f.count}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Mobile folder tabs */}
        <div className="flex items-center gap-1 mb-4 lg:hidden w-full">
          {folders.map((f) => (
            <button
              key={f.id}
              onClick={() => { setFolder(f.id); setSelectedEmail(null); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                folder === f.id
                  ? 'bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              {f.label}
              {f.count > 0 && <span className="text-[10px] font-data">{f.count}</span>}
            </button>
          ))}
        </div>

        {/* Email list / detail */}
        <div className="flex-1 min-w-0">
          {selectedEmail ? (
            /* Email detail view */
            <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl rounded-xl border border-amber-200/25 dark:border-gray-800/60 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-amber-100/30 dark:border-gray-800/60 flex items-center justify-between">
                <button
                  onClick={() => setSelectedEmail(null)}
                  className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 font-medium"
                >
                  ← Back to list
                </button>
                <div className="flex items-center gap-1.5">
                  <button className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    <Reply size={14} className="text-gray-400" />
                  </button>
                  <button className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    <Forward size={14} className="text-gray-400" />
                  </button>
                  <button className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    <Archive size={14} className="text-gray-400" />
                  </button>
                  <button className="p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                    <Trash2 size={14} className="text-gray-400 hover:text-red-500" />
                  </button>
                </div>
              </div>
              <div className="p-5">
                <h2 className="text-base font-bold text-gray-800 dark:text-gray-100 mb-3">{selectedEmail.subject}</h2>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 rounded-full bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center text-xs font-bold text-teal-600 dark:text-teal-400">
                    {getInitials(selectedEmail.clientName)}
                  </div>
                  <div>
                    <Link href={`/clients/${selectedEmail.clientId}`} className="text-sm font-semibold text-gray-800 dark:text-gray-100 hover:text-teal-600 dark:hover:text-teal-400">
                      {selectedEmail.clientName}
                    </Link>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      {new Date(selectedEmail.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
                    </p>
                  </div>
                  {selectedEmail.hasAttachment && (
                    <span className="ml-auto flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                      <Paperclip size={12} /> Attachment
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                  <p>{selectedEmail.preview}</p>
                </div>
              </div>
              <div className="px-5 py-3 border-t border-amber-100/30 dark:border-gray-800/60">
                <button className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-medium px-4 py-2 rounded-lg transition-colors">
                  <Reply size={13} /> Reply
                </button>
              </div>
            </div>
          ) : (
            /* Email list */
            <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl rounded-xl border border-amber-200/25 dark:border-gray-800/60 shadow-sm overflow-hidden">
              <div className="divide-y divide-amber-100/30 dark:divide-gray-800/60">
                {filtered.map((email) => {
                  const date = new Date(email.date);
                  const isToday = new Date().toDateString() === date.toDateString();
                  const timeStr = isToday
                    ? date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
                    : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

                  return (
                    <button
                      key={email.id}
                      onClick={() => setSelectedEmail(email)}
                      className={`w-full text-left px-5 py-4 hover:bg-teal-50/30 dark:hover:bg-teal-900/10 transition-colors ${
                        !email.read ? 'bg-teal-50/20 dark:bg-teal-900/5' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-full bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center text-xs font-bold text-teal-600 dark:text-teal-400 shrink-0 mt-0.5">
                          {getInitials(email.clientName)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className={`text-sm truncate ${!email.read ? 'font-bold text-gray-900 dark:text-white' : 'font-medium text-gray-700 dark:text-gray-300'}`}>
                              {email.clientName}
                            </span>
                            <div className="ml-auto flex items-center gap-2 shrink-0">
                              {email.hasAttachment && <Paperclip size={12} className="text-gray-400" />}
                              <button
                                onClick={(e) => { e.stopPropagation(); toggleStar(email.id); }}
                                className="p-0.5"
                              >
                                <Star size={13} className={email.starred ? 'text-amber-400 fill-amber-400' : 'text-gray-300 dark:text-gray-700'} />
                              </button>
                              <span className="text-xs text-gray-400 dark:text-gray-500 font-data">{timeStr}</span>
                            </div>
                          </div>
                          <p className={`text-sm truncate mb-0.5 ${!email.read ? 'font-semibold text-gray-800 dark:text-gray-100' : 'text-gray-600 dark:text-gray-400'}`}>
                            {email.subject}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-500 truncate">{email.preview}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
                {filtered.length === 0 && (
                  <div className="px-5 py-12 text-center">
                    <Mail size={32} className="text-gray-300 dark:text-gray-700 mx-auto mb-3" />
                    <p className="text-sm text-gray-400">No emails in {folder}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
    </>
  );
}
