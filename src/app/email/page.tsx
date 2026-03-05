'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Mail, Send, Star, Archive, Inbox, Clock, Paperclip, Reply, Forward, Trash2, X, FileText, Users, CheckCircle } from 'lucide-react';
import type { Client, Activity } from '@/types/client';
import { getInitialsFromName } from '@/lib/utils';

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

interface EmailTemplate {
  name: string;
  subject: string;
  body: string;
}

const EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    name: 'New Listing Match',
    subject: 'New property match: {{address}}',
    body: 'Hi {{firstName}},\n\nI found a new listing that matches your criteria and wanted to share it with you right away.\n\nProperty: {{address}}\n\nI think this could be a great fit based on your preferences. Would you like to schedule a showing?\n\nBest,\nTom',
  },
  {
    name: 'Showing Confirmation',
    subject: 'Showing confirmed — {{address}}',
    body: 'Hi {{firstName}},\n\nThis is to confirm your showing:\n\nProperty: {{address}}\nDate: {{date}}\nTime: {{time}}\n\nI\'ll meet you at the property. Please let me know if anything changes.\n\nBest,\nTom',
  },
  {
    name: 'Lease Expiring',
    subject: 'Your lease is expiring soon — let\'s plan ahead',
    body: 'Hi {{firstName}},\n\nI wanted to reach out because your current lease is coming up for renewal. I\'d love to help you explore your options — whether that\'s renewing, finding a new place, or even looking at purchasing.\n\nWould you have time for a quick call this week to discuss?\n\nBest,\nTom',
  },
  {
    name: 'General Follow-up',
    subject: 'Checking in — how\'s your search going?',
    body: 'Hi {{firstName}},\n\nJust wanted to check in and see how things are going. Have you had a chance to think about the properties we discussed?\n\nI\'m here if you have any questions or want to see more options.\n\nBest,\nTom',
  },
  {
    name: 'Offer Submitted',
    subject: 'Offer submitted on {{address}}',
    body: 'Hi {{firstName}},\n\nGreat news — I\'ve submitted your offer on {{address}}. Here are the details:\n\nOffer Amount: {{amount}}\n\nThe seller typically responds within 24-48 hours. I\'ll keep you updated as soon as I hear back.\n\nBest,\nTom',
  },
];

const activityToEmailThread = (
  activity: Activity,
  clientMap: Map<string, Client>,
): EmailThread => {
  const client = clientMap.get(activity.clientId);
  const clientName = client
    ? `${client.firstName} ${client.lastName}`
    : 'Unknown';
  return {
    id: activity.id,
    clientId: activity.clientId,
    clientName,
    subject: activity.title.replace(/^Email sent: /, ''),
    preview: activity.description,
    date: activity.timestamp,
    read: true,
    starred: false,
    hasAttachment: false,
    folder: 'sent',
  };
};

export default function EmailPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [folder, setFolder] = useState<'inbox' | 'sent' | 'drafts' | 'all'>('sent');
  const [selectedEmail, setSelectedEmail] = useState<EmailThread | null>(null);
  const [emails, setEmails] = useState<EmailThread[]>([]);
  const [showCompose, setShowCompose] = useState(false);
  const [composeTo, setComposeTo] = useState('');
  const [composeToClientId, setComposeToClientId] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const [sendSuccess, setSendSuccess] = useState(false);

  useEffect(() => {
    import('@/services').then((svc) =>
      Promise.all([svc.getClients(), svc.getRecentActivities(100)])
    )
      .then(([c, activities]) => {
        setClients(c);
        const clientMap = new Map(c.map((cl) => [cl.id, cl]));
        const emailActivities = activities
          .filter((a) => a.type === 'email')
          .map((a) => activityToEmailThread(a, clientMap));
        setEmails(emailActivities);
        setLoading(false);
      })
      .catch((err) => { console.error('Failed to load email data:', err); setLoading(false); });
  }, []);

  const filtered = folder === 'all' ? emails : emails.filter((e) => e.folder === folder);
  const unreadCount = emails.filter((e) => !e.read && e.folder === 'inbox').length;

  const getInitials = getInitialsFromName;

  const toggleStar = (id: string) => {
    setEmails((prev) => prev.map((e) => e.id === id ? { ...e, starred: !e.starred } : e));
  };

  const folders = [
    { id: 'sent' as const, label: 'Sent', icon: Send, count: emails.filter((e) => e.folder === 'sent').length },
    { id: 'all' as const, label: 'All Mail', icon: Mail, count: emails.length },
  ];

  const openCompose = (clientName?: string, clientId?: string) => {
    setComposeTo(clientName || '');
    setComposeToClientId(clientId || '');
    setComposeSubject('');
    setComposeBody('');
    setSelectedTemplate(null);
    setSendError('');
    setSendSuccess(false);
    setShowCompose(true);
  };

  const applyTemplate = (template: EmailTemplate) => {
    const client = clients.find((c) => `${c.firstName} ${c.lastName}` === composeTo);
    let subject = template.subject;
    let body = template.body;
    if (client) {
      subject = subject.replace(/\{\{firstName\}\}/g, client.firstName);
      body = body.replace(/\{\{firstName\}\}/g, client.firstName);
    }
    setComposeSubject(subject);
    setComposeBody(body);
    setSelectedTemplate(template.name);
  };

  const handleSendEmail = async () => {
    if (!composeTo || !composeSubject) return;
    const client = clients.find((c) => `${c.firstName} ${c.lastName}` === composeTo);
    const recipientEmail = client?.email;

    if (!recipientEmail) {
      setSendError('No email address found for this client');
      return;
    }

    setSending(true);
    setSendError('');

    try {
      const res = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: recipientEmail,
          subject: composeSubject,
          body: composeBody,
          clientId: client?.id || composeToClientId || undefined,
        }),
      });
      const result = await res.json();
      if (!result.success) {
        setSendError(result.error || 'Failed to send email');
        setSending(false);
        return;
      }
    } catch {
      setSendError('Network error — email not sent');
      setSending(false);
      return;
    }

    // Add to local sent list
    const newEmail: EmailThread = {
      id: `e_${Date.now()}`,
      clientId: client?.id || composeToClientId || 'unknown',
      clientName: composeTo,
      subject: composeSubject,
      preview: composeBody.slice(0, 120),
      date: new Date().toISOString(),
      read: true,
      starred: false,
      hasAttachment: false,
      folder: 'sent',
    };
    setEmails((prev) => [newEmail, ...prev]);
    setSending(false);
    setSendSuccess(true);

    // Auto-close after showing success
    setTimeout(() => {
      setShowCompose(false);
      setComposeTo('');
      setComposeToClientId('');
      setComposeSubject('');
      setComposeBody('');
      setSelectedTemplate(null);
      setSendSuccess(false);
    }, 1500);
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <p className="text-sm text-gray-400">Loading...</p>
    </div>
  );

  return (
    <>
      <header
        className="px-4 lg:px-8 py-3 lg:py-4 border-b border-[#1E293B]/50 flex items-center justify-between"
        style={{ background: 'linear-gradient(135deg, #334155 0%, #1E293B 50%, #334155 100%)' }}
      >
        <div>
          <h1 className="text-lg text-white" style={{ fontWeight: 600, letterSpacing: '-0.025em' }}>Email</h1>
          <p className="text-xs text-slate-400 mt-0.5">{unreadCount > 0 ? `${unreadCount} unread` : `${emails.length} sent`}</p>
        </div>
        <button
          onClick={() => openCompose()}
          className="flex items-center gap-2 bg-gold hover:bg-gold-muted text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors shadow-sm shadow-gold/20 active:scale-[0.97]"
        >
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
                    ? 'bg-amber-50 dark:bg-amber-900/20 text-gold-muted dark:text-gold-light'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/50'
                }`}
              >
                <f.icon size={16} strokeWidth={folder === f.id ? 2 : 1.5} />
                {f.label}
                {f.count > 0 && (
                  <span className="ml-auto text-xs font-bold text-gold dark:text-gold-light bg-amber-50 dark:bg-amber-900/30 rounded-full px-1.5 py-0.5 font-data">{f.count}</span>
                )}
              </button>
            ))}
          </div>

          {/* Quick Email */}
          <div className="mt-6">
            <div className="flex items-center gap-2 mb-2 px-1">
              <Users size={13} className="text-gray-400 dark:text-gray-500" />
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Quick Email</span>
            </div>
            <div className="space-y-0.5">
              {clients.slice(0, 8).map((client) => (
                <button
                  key={client.id}
                  onClick={() => openCompose(`${client.firstName} ${client.lastName}`, client.id)}
                  className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-gray-600 dark:text-gray-400 hover:bg-amber-50/50 dark:hover:bg-amber-900/10 transition-colors"
                >
                  <div className="w-5 h-5 rounded-full bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center text-[9px] font-bold text-gold dark:text-gold-light shrink-0">
                    {getInitials(`${client.firstName} ${client.lastName}`)}
                  </div>
                  <span className="truncate">{client.firstName} {client.lastName}</span>
                </button>
              ))}
            </div>
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
                  ? 'bg-amber-50 dark:bg-amber-900/20 text-gold-muted dark:text-gold-light'
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
                  <div className="w-9 h-9 rounded-full bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center text-xs font-bold text-gold dark:text-gold-light">
                    {getInitials(selectedEmail.clientName)}
                  </div>
                  <div>
                    <Link href={`/clients/${selectedEmail.clientId}`} className="text-sm font-semibold text-gray-800 dark:text-gray-100 hover:text-gold dark:hover:text-gold-light">
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
                <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                  {selectedEmail.preview}
                </div>
              </div>
              <div className="px-5 py-3 border-t border-amber-100/30 dark:border-gray-800/60">
                <button className="flex items-center gap-2 bg-gold hover:bg-gold-muted text-white text-xs font-medium px-4 py-2 rounded-lg transition-colors">
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
                      className={`w-full text-left px-5 py-4 hover:bg-amber-50/30 dark:hover:bg-amber-900/10 transition-colors ${
                        !email.read ? 'bg-amber-50/20 dark:bg-amber-900/5' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-full bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center text-xs font-bold text-gold dark:text-gold-light shrink-0 mt-0.5">
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
                    <p className="text-sm text-gray-400 mb-3">No emails yet</p>
                    <button
                      onClick={() => openCompose()}
                      className="text-xs font-medium text-gold hover:text-gold-muted transition-colors"
                    >
                      Send your first email →
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>

    {/* Compose Modal */}
    {showCompose && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => !sending && setShowCompose(false)} />
        <div className="relative bg-white dark:bg-gray-900 rounded-xl border border-amber-200/25 dark:border-gray-800/60 shadow-xl w-full max-w-2xl overflow-hidden">
          {sendSuccess ? (
            <div className="px-5 py-12 text-center">
              <CheckCircle size={40} className="text-green-500 mx-auto mb-3" />
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">Email sent successfully!</p>
            </div>
          ) : (
            <>
              <div className="px-5 py-4 border-b border-amber-100/30 dark:border-gray-800/60 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-5 rounded-full bg-gold" />
                  <h2 className="text-sm font-bold text-gray-800 dark:text-gray-100 tracking-tight">New Email</h2>
                </div>
                <button onClick={() => setShowCompose(false)} className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  <X size={16} className="text-gray-400" />
                </button>
              </div>

              {/* Templates */}
              <div className="px-5 py-3 border-b border-amber-100/30 dark:border-gray-800/60">
                <div className="flex items-center gap-2 mb-2">
                  <FileText size={12} className="text-gray-400" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Templates</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {EMAIL_TEMPLATES.map((tpl) => (
                    <button
                      key={tpl.name}
                      onClick={() => applyTemplate(tpl)}
                      className={`text-xs font-medium px-2.5 py-1 rounded-lg transition-colors ${
                        selectedTemplate === tpl.name
                          ? 'bg-amber-50 dark:bg-amber-900/20 text-gold-muted dark:text-gold-light border border-gold-light dark:border-gold-muted/30'
                          : 'bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      {tpl.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-5 space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">To</label>
                  <input
                    type="text"
                    value={composeTo}
                    onChange={(e) => {
                      setComposeTo(e.target.value);
                      const match = clients.find((c) => `${c.firstName} ${c.lastName}` === e.target.value);
                      if (match) setComposeToClientId(match.id);
                    }}
                    list="client-list"
                    className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold"
                    placeholder="Client name"
                  />
                  <datalist id="client-list">
                    {clients.map((c) => (
                      <option key={c.id} value={`${c.firstName} ${c.lastName}`} />
                    ))}
                  </datalist>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Subject</label>
                  <input
                    type="text"
                    value={composeSubject}
                    onChange={(e) => setComposeSubject(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold"
                    placeholder="Email subject"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Message</label>
                  <textarea
                    value={composeBody}
                    onChange={(e) => setComposeBody(e.target.value)}
                    rows={10}
                    className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold resize-none"
                    placeholder="Write your message..."
                  />
                </div>
              </div>

              <div className="px-5 py-4 border-t border-amber-100/30 dark:border-gray-800/60 flex items-center justify-between">
                {sendError ? (
                  <p className="text-xs text-red-500 dark:text-red-400">{sendError}</p>
                ) : (
                  <div />
                )}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowCompose(false)}
                    disabled={sending}
                    className="text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 px-4 py-2 rounded-lg transition-colors"
                  >
                    Discard
                  </button>
                  <button
                    onClick={handleSendEmail}
                    disabled={!composeTo || !composeSubject || sending}
                    className="flex items-center gap-1.5 text-xs font-medium text-white bg-gold hover:bg-gold-muted disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded-lg transition-colors shadow-sm shadow-gold/20 active:scale-[0.97]"
                  >
                    <Send size={13} /> {sending ? 'Sending...' : 'Send Email'}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    )}
    </>
  );
}
