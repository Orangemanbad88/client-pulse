'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Mail, Send, Star, Inbox, Paperclip, Reply,
  X, FileText, Users, CheckCircle, AlertTriangle, RefreshCw,
} from 'lucide-react';
import type { Client, Activity, EmailThread as InboxThread, EmailMessage } from '@/types/client';
import { getInitialsFromName } from '@/lib/utils';

// ---- Local type for sent-log items (activity-based) ----
interface SentEmailItem {
  id: string;
  clientId: string;
  clientName: string;
  subject: string;
  preview: string;
  date: string;
  read: boolean;
  starred: boolean;
  hasAttachment: boolean;
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
    name: 'Rental Season Reminder',
    subject: 'Shore rental season is coming — let\'s lock in your spot',
    body: 'Hi {{firstName}},\n\nRental season is right around the corner and the best properties go fast. I wanted to reach out early so we can start looking at options that match your preferences — whether you\'re renewing your current place or exploring something new.\n\nWould you have time for a quick call this week to go over what\'s available?\n\nBest,\nTom',
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
  {
    name: 'Weekly Match Digest',
    subject: 'Your weekly property matches — {{date}}',
    body: 'Hi {{firstName}},\n\nHere\'s your weekly roundup of new properties that match your criteria. I\'ve highlighted the ones I think are the strongest fit:\n\n{{matchList}}\n\nWant to schedule showings for any of these? Just reply to this email or give me a call.\n\nBest,\nTom',
  },
  {
    name: 'Property Available This Week',
    subject: 'Just listed — {{address}} is available now',
    body: 'Hi {{firstName}},\n\nA property just came on the market that I think you\'ll want to see:\n\n{{address}}\n\nThis one checks a lot of your boxes and I expect it to move quickly. Would you like to set up a showing this week?\n\nBest,\nTom',
  },
];

const activityToSentItem = (
  activity: Activity,
  clientMap: Map<string, Client>,
): SentEmailItem => {
  const client = clientMap.get(activity.clientId);
  const clientName = client
    ? `${client.firstName} ${client.lastName}`
    : 'Unknown';
  return {
    id: activity.id,
    clientId: activity.clientId,
    clientName,
    subject: activity.title.replace(/^Email sent: /, '').replace(/^Reply sent: /, ''),
    preview: activity.description,
    date: activity.timestamp,
    read: true,
    starred: false,
    hasAttachment: false,
  };
};

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  const now = new Date();
  const isToday = now.toDateString() === date.toDateString();
  if (isToday) return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (yesterday.toDateString() === date.toDateString()) return 'Yesterday';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const formatFullDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
  });

export default function EmailPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [folder, setFolder] = useState<'inbox' | 'sent' | 'all'>('inbox');

  // Inbox state
  const [inboxThreads, setInboxThreads] = useState<InboxThread[]>([]);
  const [inboxLoading, setInboxLoading] = useState(false);
  const [inboxError, setInboxError] = useState('');
  const [inboxMessage, setInboxMessage] = useState('');
  const [needsReconnect, setNeedsReconnect] = useState(false);
  const [selectedThread, setSelectedThread] = useState<InboxThread | null>(null);

  // Sent state
  const [sentEmails, setSentEmails] = useState<SentEmailItem[]>([]);
  const [selectedSentItem, setSelectedSentItem] = useState<SentEmailItem | null>(null);

  // Reply state
  const [replyBody, setReplyBody] = useState('');
  const [replySending, setReplySending] = useState(false);
  const [replyError, setReplyError] = useState('');

  // Compose state
  const [showCompose, setShowCompose] = useState(false);
  const [composeTo, setComposeTo] = useState('');
  const [composeToClientId, setComposeToClientId] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const [sendSuccess, setSendSuccess] = useState(false);
  const [sendingAs, setSendingAs] = useState<{ provider: string; email: string } | null>(null);

  const getInitials = getInitialsFromName;

  // Fetch connected account info
  useEffect(() => {
    fetch('/api/email/accounts')
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.accounts?.length > 0) {
          const primary = d.accounts.find((a: { isPrimary: boolean }) => a.isPrimary) || d.accounts[0];
          setSendingAs({ provider: primary.provider, email: primary.email });
        }
      })
      .catch(() => {});
  }, []);

  // Fetch clients + sent activities
  useEffect(() => {
    import('@/services').then((svc) =>
      Promise.all([svc.getClients(), svc.getRecentActivities(100)])
    )
      .then(([c, activities]) => {
        setClients(c);
        const clientMap = new Map(c.map((cl) => [cl.id, cl]));
        const emailActivities = activities
          .filter((a) => a.type === 'email')
          .map((a) => activityToSentItem(a, clientMap));
        setSentEmails(emailActivities);
        setLoading(false);
      })
      .catch(() => { setLoadError(true); setLoading(false); });
  }, []);

  // Fetch inbox
  const fetchInbox = useCallback(async () => {
    setInboxLoading(true);
    setInboxError('');
    setInboxMessage('');
    setNeedsReconnect(false);

    try {
      const res = await fetch('/api/email/inbox');
      const data = await res.json();

      if (!data.success) {
        if (data.needsReconnect) {
          setNeedsReconnect(true);
          setInboxError(data.error);
        } else {
          setInboxError(data.error || 'Failed to load inbox');
        }
      } else {
        setInboxThreads(data.threads || []);
        if (data.message) setInboxMessage(data.message);
      }
    } catch {
      setInboxError('Network error loading inbox');
    } finally {
      setInboxLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInbox();
  }, [fetchInbox]);

  // ---- Reply handler ----
  const handleReply = async () => {
    if (!selectedThread || !replyBody.trim()) return;

    const lastMsg = selectedThread.messages[selectedThread.messages.length - 1];

    // Determine who to reply to
    const myEmail = sendingAs?.email?.toLowerCase();
    let replyTo = lastMsg.from.email;
    if (myEmail && lastMsg.from.email.toLowerCase() === myEmail) {
      // Last message was from us — reply to the other participant
      const other = selectedThread.participants.find(
        (p) => p.email.toLowerCase() !== myEmail,
      );
      if (other) replyTo = other.email;
    }

    setReplySending(true);
    setReplyError('');

    try {
      const res = await fetch('/api/email/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: selectedThread.provider,
          inReplyToMessageId: lastMsg.id,
          messageIdHeader: lastMsg.messageIdHeader,
          referencesHeader: lastMsg.referencesHeader,
          threadId: selectedThread.id,
          to: replyTo,
          subject: selectedThread.subject,
          body: replyBody,
          clientId: selectedThread.clientId,
        }),
      });

      const result = await res.json();
      if (!result.success) {
        setReplyError(result.error || 'Failed to send reply');
        setReplySending(false);
        return;
      }

      // Optimistically append reply to thread
      const newMsg: EmailMessage = {
        id: `reply_${Date.now()}`,
        threadId: selectedThread.id,
        subject: selectedThread.subject,
        from: { name: 'Me', email: sendingAs?.email || '' },
        to: [{ name: replyTo, email: replyTo }],
        date: new Date().toISOString(),
        bodyText: replyBody,
        bodyHtml: '',
        snippet: replyBody.slice(0, 120),
        isRead: true,
        hasAttachments: false,
        provider: selectedThread.provider,
        messageIdHeader: '',
        referencesHeader: '',
      };

      setSelectedThread((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          messages: [...prev.messages, newMsg],
          messageCount: prev.messageCount + 1,
          lastMessageDate: newMsg.date,
          snippet: newMsg.snippet,
        };
      });

      // Update in the list too
      setInboxThreads((prev) =>
        prev.map((t) =>
          t.id === selectedThread.id
            ? { ...t, messages: [...t.messages, newMsg], messageCount: t.messageCount + 1, lastMessageDate: newMsg.date, snippet: newMsg.snippet }
            : t,
        ),
      );

      setReplyBody('');
    } catch {
      setReplyError('Network error — reply not sent');
    } finally {
      setReplySending(false);
    }
  };

  // ---- Connect handlers ----
  const handleConnectGmail = async () => {
    try {
      const res = await fetch('/api/auth/gmail/connect');
      const data = await res.json();
      if (data.success && data.url) {
        window.location.href = data.url;
      }
    } catch {
      // Silently fail — user can try again
    }
  };

  const handleConnectOutlook = async () => {
    try {
      const res = await fetch('/api/auth/outlook/connect');
      const data = await res.json();
      if (data.success && data.url) {
        window.location.href = data.url;
      }
    } catch {
      // Silently fail — user can try again
    }
  };

  // ---- Compose helpers ----
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

    const newSent: SentEmailItem = {
      id: `e_${Date.now()}`,
      clientId: client?.id || composeToClientId || 'unknown',
      clientName: composeTo,
      subject: composeSubject,
      preview: composeBody.slice(0, 120),
      date: new Date().toISOString(),
      read: true,
      starred: false,
      hasAttachment: false,
    };
    setSentEmails((prev) => [newSent, ...prev]);
    setSending(false);
    setSendSuccess(true);

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

  const toggleStar = (id: string) => {
    setSentEmails((prev) => prev.map((e) => e.id === id ? { ...e, starred: !e.starred } : e));
  };

  // ---- Folder config ----
  const folders = [
    { id: 'inbox' as const, label: 'Inbox', icon: Inbox, count: inboxThreads.filter((t) => !t.isRead).length },
    { id: 'sent' as const, label: 'Sent', icon: Send, count: sentEmails.length },
    { id: 'all' as const, label: 'All Mail', icon: Mail, count: inboxThreads.length + sentEmails.length },
  ];

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <p className="text-sm text-gray-400">Loading...</p>
    </div>
  );

  if (loadError) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <Mail size={32} className="text-gray-300 dark:text-gray-400 mx-auto mb-3" />
        <p className="text-sm text-gray-400 mb-1">Unable to load email</p>
        <p className="text-xs text-gray-400/60">Check your connection and try refreshing</p>
      </div>
    </div>
  );

  // ---- Render inbox thread detail ----
  const renderThreadDetail = () => {
    if (!selectedThread) return null;
    return (
      <div className="bg-[#faf7f2]/80 dark:bg-gray-900/60 backdrop-blur-xl rounded-xl border border-amber-200/25 dark:border-gray-800/60 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-amber-100/30 dark:border-gray-800/60 flex items-center justify-between">
          <button
            onClick={() => setSelectedThread(null)}
            className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 font-medium"
          >
            ← Back to list
          </button>
          {selectedThread.clientId && (
            <Link
              href={`/clients/${selectedThread.clientId}`}
              className="text-xs font-medium text-gold hover:text-gold-muted transition-colors"
            >
              View Client →
            </Link>
          )}
        </div>

        {/* Subject */}
        <div className="px-5 py-3 border-b border-amber-100/30 dark:border-gray-800/60">
          <h2 className="text-base font-bold text-gray-800 dark:text-gray-100">{selectedThread.subject}</h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-gray-400">{selectedThread.messageCount} message{selectedThread.messageCount !== 1 ? 's' : ''}</span>
            {selectedThread.clientName && (
              <>
                <span className="text-gray-300 dark:text-gray-600">·</span>
                <span className="text-xs font-medium text-gold dark:text-gold-light">{selectedThread.clientName}</span>
              </>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="divide-y divide-amber-100/20 dark:divide-gray-800/40 max-h-[50vh] overflow-y-auto">
          {selectedThread.messages.map((msg, idx) => (
            <div key={msg.id} className="px-5 py-4">
              <div className="flex items-start gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center text-[10px] font-bold text-gold dark:text-gold-light shrink-0">
                  {getInitials(msg.from.name || msg.from.email)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">
                      {msg.from.name || msg.from.email}
                    </span>
                    <span className="text-xs text-gray-400 shrink-0">{formatFullDate(msg.date)}</span>
                  </div>
                  <p className="text-xs text-gray-400 truncate">
                    to {msg.to.map((t) => t.name || t.email).join(', ')}
                  </p>
                </div>
                {msg.hasAttachments && (
                  <Paperclip size={12} className="text-gray-400 shrink-0" />
                )}
              </div>
              <div className="pl-11 text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                {msg.bodyText || msg.snippet || '(no content)'}
              </div>
              {idx === selectedThread.messages.length - 1 && !msg.isRead && (
                <div className="pl-11 mt-2">
                  <span className="inline-block text-[10px] font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-1.5 py-0.5 rounded">New</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Reply box */}
        <div className="px-5 py-4 border-t border-amber-100/30 dark:border-gray-800/60 bg-gray-50/50 dark:bg-gray-900/80">
          <div className="flex items-center gap-2 mb-2">
            <Reply size={13} className="text-gray-400" />
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Reply</span>
          </div>
          <textarea
            value={replyBody}
            onChange={(e) => setReplyBody(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold resize-none"
            placeholder="Type your reply..."
          />
          {replyError && <p className="text-xs text-red-500 mt-1">{replyError}</p>}
          <div className="flex items-center justify-end gap-2 mt-2">
            <button
              onClick={handleReply}
              disabled={!replyBody.trim() || replySending}
              className="flex items-center gap-1.5 text-xs font-medium text-white bg-gold hover:bg-gold-muted disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded-lg transition-colors shadow-sm shadow-gold/20 active:scale-[0.97]"
            >
              <Send size={13} /> {replySending ? 'Sending...' : 'Send Reply'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ---- Render sent detail ----
  const renderSentDetail = () => {
    if (!selectedSentItem) return null;
    return (
      <div className="bg-[#faf7f2]/80 dark:bg-gray-900/60 backdrop-blur-xl rounded-xl border border-amber-200/25 dark:border-gray-800/60 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-amber-100/30 dark:border-gray-800/60 flex items-center justify-between">
          <button
            onClick={() => setSelectedSentItem(null)}
            className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 font-medium"
          >
            ← Back to list
          </button>
        </div>
        <div className="p-5">
          <h2 className="text-base font-bold text-gray-800 dark:text-gray-100 mb-3">{selectedSentItem.subject}</h2>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-full bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center text-xs font-bold text-gold dark:text-gold-light">
              {getInitials(selectedSentItem.clientName)}
            </div>
            <div>
              <Link href={`/clients/${selectedSentItem.clientId}`} className="text-sm font-semibold text-gray-800 dark:text-gray-100 hover:text-gold dark:hover:text-gold-light">
                {selectedSentItem.clientName}
              </Link>
              <p className="text-xs text-gray-400">{formatFullDate(selectedSentItem.date)}</p>
            </div>
          </div>
          <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
            {selectedSentItem.preview}
          </div>
        </div>
      </div>
    );
  };

  // ---- Render inbox list ----
  const renderInboxList = () => {
    if (inboxLoading) {
      return (
        <div className="bg-[#faf7f2]/80 dark:bg-gray-900/60 backdrop-blur-xl rounded-xl border border-amber-200/25 dark:border-gray-800/60 shadow-sm overflow-hidden">
          <div className="divide-y divide-amber-100/30 dark:divide-gray-800/60">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="px-5 py-4 animate-pulse">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-gray-700 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3.5 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
                    <div className="h-2.5 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (needsReconnect) {
      return (
        <div className="bg-[#faf7f2]/80 dark:bg-gray-900/60 backdrop-blur-xl rounded-xl border border-amber-200/25 dark:border-gray-800/60 shadow-sm overflow-hidden">
          <div className="px-5 py-12 text-center">
            <AlertTriangle size={32} className="text-amber-400 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Session expired</p>
            <p className="text-xs text-gray-400 mb-4">Your email account needs to be reconnected.</p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={handleConnectGmail}
                className="flex items-center gap-2 text-xs font-medium text-white bg-gold hover:bg-gold-muted px-4 py-2 rounded-lg transition-colors shadow-sm shadow-gold/20"
              >
                <Mail size={13} /> Reconnect Gmail
              </button>
              <button
                onClick={handleConnectOutlook}
                className="flex items-center gap-2 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 px-4 py-2 rounded-lg transition-colors"
              >
                <Mail size={13} /> Reconnect Outlook
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (inboxError && !needsReconnect) {
      return (
        <div className="bg-[#faf7f2]/80 dark:bg-gray-900/60 backdrop-blur-xl rounded-xl border border-amber-200/25 dark:border-gray-800/60 shadow-sm overflow-hidden">
          <div className="px-5 py-12 text-center">
            <AlertTriangle size={32} className="text-red-400 mx-auto mb-3" />
            <p className="text-sm text-gray-400 mb-3">{inboxError}</p>
            <button
              onClick={fetchInbox}
              className="text-xs font-medium text-gold hover:text-gold-muted transition-colors"
            >
              Try again →
            </button>
          </div>
        </div>
      );
    }

    if (inboxMessage && inboxThreads.length === 0) {
      return (
        <div className="bg-[#faf7f2]/80 dark:bg-gray-900/60 backdrop-blur-xl rounded-xl border border-amber-200/25 dark:border-gray-800/60 shadow-sm overflow-hidden">
          <div className="px-5 py-12 text-center">
            <Inbox size={32} className="text-gray-300 dark:text-gray-400 mx-auto mb-3" />
            <p className="text-sm text-gray-400 mb-3">{inboxMessage}</p>
            {!sendingAs && (
              <div className="flex items-center justify-center gap-3 mt-4">
                <button
                  onClick={handleConnectGmail}
                  className="flex items-center gap-2 text-xs font-medium text-white bg-gold hover:bg-gold-muted px-4 py-2 rounded-lg transition-colors shadow-sm shadow-gold/20"
                >
                  <Mail size={13} /> Connect Gmail
                </button>
                <button
                  onClick={handleConnectOutlook}
                  className="flex items-center gap-2 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 px-4 py-2 rounded-lg transition-colors"
                >
                  <Mail size={13} /> Connect Outlook
                </button>
              </div>
            )}
          </div>
        </div>
      );
    }

    if (inboxThreads.length === 0) {
      return (
        <div className="bg-[#faf7f2]/80 dark:bg-gray-900/60 backdrop-blur-xl rounded-xl border border-amber-200/25 dark:border-gray-800/60 shadow-sm overflow-hidden">
          <div className="px-5 py-12 text-center">
            <Inbox size={32} className="text-gray-300 dark:text-gray-400 mx-auto mb-3" />
            <p className="text-sm text-gray-400">No client emails found</p>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-[#faf7f2]/80 dark:bg-gray-900/60 backdrop-blur-xl rounded-xl border border-amber-200/25 dark:border-gray-800/60 shadow-sm overflow-hidden">
        <div className="divide-y divide-amber-100/30 dark:divide-gray-800/60">
          {inboxThreads.map((thread) => (
            <button
              key={thread.id}
              onClick={() => { setSelectedThread(thread); setReplyBody(''); setReplyError(''); }}
              className={`w-full text-left px-5 py-4 hover:bg-amber-50/30 dark:hover:bg-amber-900/10 transition-colors ${
                !thread.isRead ? 'bg-amber-50/20 dark:bg-amber-900/5' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center text-xs font-bold text-gold dark:text-gold-light shrink-0 mt-0.5">
                  {getInitials(thread.clientName || thread.participants[0]?.name || '?')}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={`text-sm truncate ${!thread.isRead ? 'font-bold text-gray-900 dark:text-white' : 'font-medium text-gray-700 dark:text-gray-300'}`}>
                      {thread.clientName || thread.participants[0]?.name || thread.participants[0]?.email || 'Unknown'}
                    </span>
                    <div className="ml-auto flex items-center gap-2 shrink-0">
                      {thread.messageCount > 1 && (
                        <span className="text-[10px] font-data text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-full px-1.5 py-0.5">
                          {thread.messageCount}
                        </span>
                      )}
                      {thread.hasAttachments && <Paperclip size={12} className="text-gray-400" />}
                      {!thread.isRead && (
                        <span className="w-2 h-2 rounded-full bg-gold shrink-0" />
                      )}
                      <span className="text-xs text-gray-400 font-data">{formatDate(thread.lastMessageDate)}</span>
                    </div>
                  </div>
                  <p className={`text-sm truncate mb-0.5 ${!thread.isRead ? 'font-semibold text-gray-800 dark:text-gray-100' : 'text-gray-600 dark:text-gray-400'}`}>
                    {thread.subject}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{thread.snippet}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  };

  // ---- Render sent list ----
  const renderSentList = () => {
    if (sentEmails.length === 0) {
      return (
        <div className="bg-[#faf7f2]/80 dark:bg-gray-900/60 backdrop-blur-xl rounded-xl border border-amber-200/25 dark:border-gray-800/60 shadow-sm overflow-hidden">
          <div className="px-5 py-12 text-center">
            <Send size={32} className="text-gray-300 dark:text-gray-400 mx-auto mb-3" />
            <p className="text-sm text-gray-400 mb-3">No sent emails yet</p>
            <button
              onClick={() => openCompose()}
              className="text-xs font-medium text-gold hover:text-gold-muted transition-colors"
            >
              Send your first email →
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-[#faf7f2]/80 dark:bg-gray-900/60 backdrop-blur-xl rounded-xl border border-amber-200/25 dark:border-gray-800/60 shadow-sm overflow-hidden">
        <div className="divide-y divide-amber-100/30 dark:divide-gray-800/60">
          {sentEmails.map((email) => (
            <button
              key={email.id}
              onClick={() => setSelectedSentItem(email)}
              className="w-full text-left px-5 py-4 hover:bg-amber-50/30 dark:hover:bg-amber-900/10 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center text-xs font-bold text-gold dark:text-gold-light shrink-0 mt-0.5">
                  {getInitials(email.clientName)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                      {email.clientName}
                    </span>
                    <div className="ml-auto flex items-center gap-2 shrink-0">
                      {email.hasAttachment && <Paperclip size={12} className="text-gray-400" />}
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleStar(email.id); }}
                        className="p-0.5"
                      >
                        <Star size={13} className={email.starred ? 'text-amber-400 fill-amber-400' : 'text-gray-300 dark:text-gray-600'} />
                      </button>
                      <span className="text-xs text-gray-400 font-data">{formatDate(email.date)}</span>
                    </div>
                  </div>
                  <p className="text-sm truncate mb-0.5 text-gray-600 dark:text-gray-400">{email.subject}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{email.preview}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  };

  // ---- Main content area ----
  const renderContent = () => {
    if (folder === 'inbox') {
      if (selectedThread) return renderThreadDetail();
      return renderInboxList();
    }

    if (folder === 'sent') {
      if (selectedSentItem) return renderSentDetail();
      return renderSentList();
    }

    // "All" — show inbox threads + sent items together, no detail view here
    if (selectedThread) return renderThreadDetail();
    if (selectedSentItem) return renderSentDetail();

    const allItems: Array<{ type: 'thread'; data: InboxThread } | { type: 'sent'; data: SentEmailItem }> = [
      ...inboxThreads.map((t) => ({ type: 'thread' as const, data: t })),
      ...sentEmails.map((s) => ({ type: 'sent' as const, data: s })),
    ].sort((a, b) => {
      const dateA = a.type === 'thread' ? a.data.lastMessageDate : a.data.date;
      const dateB = b.type === 'thread' ? b.data.lastMessageDate : b.data.date;
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    });

    if (allItems.length === 0) {
      return (
        <div className="bg-[#faf7f2]/80 dark:bg-gray-900/60 backdrop-blur-xl rounded-xl border border-amber-200/25 dark:border-gray-800/60 shadow-sm overflow-hidden">
          <div className="px-5 py-12 text-center">
            <Mail size={32} className="text-gray-300 dark:text-gray-400 mx-auto mb-3" />
            <p className="text-sm text-gray-400">No emails yet</p>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-[#faf7f2]/80 dark:bg-gray-900/60 backdrop-blur-xl rounded-xl border border-amber-200/25 dark:border-gray-800/60 shadow-sm overflow-hidden">
        <div className="divide-y divide-amber-100/30 dark:divide-gray-800/60">
          {allItems.map((item) => {
            const name = item.type === 'thread'
              ? (item.data.clientName || item.data.participants[0]?.name || 'Unknown')
              : item.data.clientName;
            const subject = item.type === 'thread' ? item.data.subject : item.data.subject;
            const snippet = item.type === 'thread' ? item.data.snippet : item.data.preview;
            const date = item.type === 'thread' ? item.data.lastMessageDate : item.data.date;
            const isUnread = item.type === 'thread' ? !item.data.isRead : false;
            const id = item.type === 'thread' ? item.data.id : item.data.id;

            return (
              <button
                key={`${item.type}-${id}`}
                onClick={() => {
                  if (item.type === 'thread') {
                    setSelectedThread(item.data);
                    setSelectedSentItem(null);
                    setReplyBody('');
                    setReplyError('');
                  } else {
                    setSelectedSentItem(item.data);
                    setSelectedThread(null);
                  }
                }}
                className={`w-full text-left px-5 py-4 hover:bg-amber-50/30 dark:hover:bg-amber-900/10 transition-colors ${
                  isUnread ? 'bg-amber-50/20 dark:bg-amber-900/5' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center text-xs font-bold text-gold dark:text-gold-light shrink-0 mt-0.5">
                    {getInitials(name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`text-sm truncate ${isUnread ? 'font-bold text-gray-900 dark:text-white' : 'font-medium text-gray-700 dark:text-gray-300'}`}>
                        {name}
                      </span>
                      <div className="ml-auto flex items-center gap-2 shrink-0">
                        {item.type === 'sent' && (
                          <span className="text-[10px] font-medium text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-full px-1.5 py-0.5">Sent</span>
                        )}
                        {item.type === 'thread' && (item.data as InboxThread).messageCount > 1 && (
                          <span className="text-[10px] font-data text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-full px-1.5 py-0.5">
                            {(item.data as InboxThread).messageCount}
                          </span>
                        )}
                        {isUnread && <span className="w-2 h-2 rounded-full bg-gold shrink-0" />}
                        <span className="text-xs text-gray-400 font-data">{formatDate(date)}</span>
                      </div>
                    </div>
                    <p className={`text-sm truncate mb-0.5 ${isUnread ? 'font-semibold text-gray-800 dark:text-gray-100' : 'text-gray-600 dark:text-gray-400'}`}>
                      {subject}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{snippet}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const unreadCount = inboxThreads.filter((t) => !t.isRead).length;

  return (
    <>
      <header
        className="sticky top-3 z-10 mx-4 lg:mx-6 px-4 lg:px-6 py-3 lg:py-4 rounded-xl border border-[#D4A84B]/20 shadow-lg shadow-black/20 flex items-center justify-between"
        style={{ background: '#1e3a5f' }}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold to-gold-muted flex items-center justify-center shadow-sm shadow-gold/15">
            <Mail size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg text-white" style={{ fontWeight: 600, letterSpacing: '-0.025em' }}>Email</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              {unreadCount > 0 ? `${unreadCount} unread` : `${inboxThreads.length} threads · ${sentEmails.length} sent`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchInbox}
            disabled={inboxLoading}
            className="flex items-center gap-1.5 text-xs font-medium text-slate-300 hover:text-white px-3 py-2 rounded-lg transition-colors"
            title="Refresh inbox"
          >
            <RefreshCw size={14} className={inboxLoading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => openCompose()}
            className="flex items-center gap-2 bg-gold hover:bg-gold-muted text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors shadow-sm shadow-gold/20 active:scale-[0.97]"
          >
            <Mail size={14} /> Compose
          </button>
        </div>
      </header>
      <div className="px-4 lg:px-8 py-4 lg:py-6">

      <div className="flex gap-6">
        {/* Folder sidebar */}
        <div className="w-40 shrink-0 hidden lg:block">
          <div className="space-y-1">
            {folders.map((f) => (
              <button
                key={f.id}
                onClick={() => { setFolder(f.id); setSelectedThread(null); setSelectedSentItem(null); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  folder === f.id
                    ? 'bg-amber-50 dark:bg-amber-900/20 text-gold-muted dark:text-gold-light'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50'
                }`}
              >
                <f.icon size={16} strokeWidth={folder === f.id ? 2 : 1.5} />
                {f.label}
                {f.id === 'inbox' && unreadCount > 0 && (
                  <span className="ml-auto text-xs font-bold text-gold dark:text-gold-light bg-amber-50 dark:bg-amber-900/30 rounded-full px-1.5 py-0.5 font-data">{unreadCount}</span>
                )}
                {f.id === 'sent' && f.count > 0 && (
                  <span className="ml-auto text-xs font-bold text-gold dark:text-gold-light bg-amber-50 dark:bg-amber-900/30 rounded-full px-1.5 py-0.5 font-data">{f.count}</span>
                )}
              </button>
            ))}
          </div>

          {/* Quick Email */}
          <div className="mt-6">
            <div className="flex items-center gap-2 mb-2 px-1">
              <Users size={13} className="text-gray-400 dark:text-gray-400" />
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-400">Quick Email</span>
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
              onClick={() => { setFolder(f.id); setSelectedThread(null); setSelectedSentItem(null); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                folder === f.id
                  ? 'bg-amber-50 dark:bg-amber-900/20 text-gold-muted dark:text-gold-light'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              {f.label}
              {f.id === 'inbox' && unreadCount > 0 && <span className="text-[10px] font-data font-bold text-gold">{unreadCount}</span>}
            </button>
          ))}
        </div>

        {/* Email list / detail */}
        <div className="flex-1 min-w-0">
          {renderContent()}
        </div>
      </div>
    </div>

    {/* Compose Modal */}
    {showCompose && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => !sending && setShowCompose(false)} />
        <div className="relative bg-[#faf7f2] dark:bg-gray-900 rounded-xl border border-amber-200/25 dark:border-gray-800/60 shadow-xl w-full max-w-2xl overflow-hidden">
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
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-400">Templates</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {EMAIL_TEMPLATES.map((tpl) => (
                    <button
                      key={tpl.name}
                      onClick={() => applyTemplate(tpl)}
                      className={`text-xs font-medium px-2.5 py-1 rounded-lg transition-colors ${
                        selectedTemplate === tpl.name
                          ? 'bg-amber-50 dark:bg-amber-900/20 text-gold-muted dark:text-gold-light border border-gold-light dark:border-gold-muted/30'
                          : 'bg-[#f5f0e8] dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'
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
                    className="w-full px-3 py-2 text-sm bg-[#f5f0e8] dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold"
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
                    className="w-full px-3 py-2 text-sm bg-[#f5f0e8] dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold"
                    placeholder="Email subject"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Message</label>
                  <textarea
                    value={composeBody}
                    onChange={(e) => setComposeBody(e.target.value)}
                    rows={10}
                    className="w-full px-3 py-2 text-sm bg-[#f5f0e8] dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold resize-none"
                    placeholder="Write your message..."
                  />
                </div>
              </div>

              <div className="px-5 py-4 border-t border-amber-100/30 dark:border-gray-800/60 flex items-center justify-between">
                {sendError ? (
                  <p className="text-xs text-red-500 dark:text-red-400">{sendError}</p>
                ) : (
                  <p className="text-xs text-gray-400 dark:text-gray-400">
                    Sending as: {sendingAs ? `${sendingAs.email} (${sendingAs.provider})` : 'Resend (default)'}
                  </p>
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
