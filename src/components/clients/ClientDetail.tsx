'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Trash2 } from 'lucide-react';
import type { Client, ClientPreferences, Activity, Transaction, PropertyMatch, AIProfile, Trigger } from '@/types/client';
import { LIFECYCLE_LABELS, PROPERTY_TYPE_LABELS, AMENITY_LABELS, ACTIVITY_ICONS } from '@/types/client';
import { getInitials, getClientName, formatCurrency, formatDate, formatRelativeDate, daysUntil, urgencyBadge, scoreColor, scoreBg, cn, stageBadge } from '@/lib/utils';
import { AIProfileCard } from './AIProfileCard';
import { EditClientModal } from './EditClientModal';
import Link from 'next/link';

interface Props { client: Client; preferences: ClientPreferences | null; activities: Activity[]; transactions: Transaction[]; matches: PropertyMatch[]; aiProfile: AIProfile | null; triggers: Trigger[]; }

export const ClientDetail = ({ client: initialClient, preferences: initialPrefs, activities, transactions, matches: initialMatches, aiProfile, triggers: initialTriggers }: Props) => {
  const router = useRouter();
  const [client, setClient] = useState(initialClient);
  const [prefs, setPrefs] = useState(initialPrefs);
  const rp = prefs?.rental;
  const bp = prefs?.buyer;
  const leaseExp = rp?.currentLeaseExpiration ? daysUntil(rp.currentLeaseExpiration) : null;

  const [matchList, setMatchList] = useState(initialMatches);
  const [triggerList, setTriggerList] = useState(initialTriggers);
  const [matchLoading, setMatchLoading] = useState<string | null>(null);
  const [triggerLoading, setTriggerLoading] = useState<string | null>(null);

  // Edit / Delete / Find Matches state
  const [showEdit, setShowEdit] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [findingMatches, setFindingMatches] = useState(false);
  const [matchingInProgress, setMatchingInProgress] = useState(false);

  const handleSendMatch = async (matchId: string) => {
    setMatchLoading(matchId);
    try {
      const svc = await import('@/services');
      await svc.updateMatchStatus(matchId, 'sent');
      setMatchList((prev) => prev.map((m) => (m.id === matchId ? { ...m, status: 'sent' as const } : m)));
    } catch {
      // keep original on failure
    } finally {
      setMatchLoading(null);
    }
  };

  const handleTriggerAction = async (triggerId: string, action: 'completed' | 'dismissed') => {
    setTriggerLoading(triggerId);
    try {
      const svc = await import('@/services');
      await svc.updateTriggerStatus(triggerId, action);
      setTriggerList((prev) => prev.map((t) => (t.id === triggerId ? { ...t, status: action } : t)));
    } catch {
      // keep original on failure
    } finally {
      setTriggerLoading(null);
    }
  };

  const handleMessage = () => {
    if (client.email) {
      window.open(`mailto:${client.email}`);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/clients/${client.id}`, { method: 'DELETE' });
      const result = await res.json();
      if (result.success) {
        router.push('/clients');
      }
    } catch {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleFindMatches = async () => {
    setFindingMatches(true);
    try {
      const res = await fetch('/api/matches/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: client.id }),
      });
      const result = await res.json();
      if (result.success && result.data) {
        setMatchList(result.data);
      }
    } catch {
      // silently fail
    } finally {
      setFindingMatches(false);
    }
  };

  const hasPreferences = !!(prefs?.rental || prefs?.buyer);

  return (
    <div className="space-y-4 animate-in">
      {/* Header */}
      <div className="surface overflow-hidden">
        <div className="px-5 py-4 flex items-center gap-4 border-b border-[#1E293B]/50" style={{ background: 'linear-gradient(135deg, #334155 0%, #1E293B 50%, #334155 100%)' }}>
          <Link href="/clients" className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          </Link>
          <div className="w-11 h-11 rounded-full bg-gold flex items-center justify-center text-white text-sm font-bold">
            {getInitials(client.firstName, client.lastName)}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2.5">
              <h1 className="text-lg font-bold text-white">{getClientName(client)}</h1>
              <span className={cn('badge text-[10px]', stageBadge[client.lifecycleStage])}>{LIFECYCLE_LABELS[client.lifecycleStage]}</span>
            </div>
            <p className="text-[12px] mt-0.5 text-slate-400">
              <span className="capitalize">{client.clientType}</span> · {client.source} · Since {formatDate(client.createdAt)}
            </p>
          </div>
          <div className="flex gap-2">
            {hasPreferences && (
              <button
                onClick={handleFindMatches}
                disabled={findingMatches}
                className={cn('text-sm font-medium px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white border border-white/10 transition-colors flex items-center gap-1.5', findingMatches && 'opacity-50 cursor-wait')}
              >
                <Sparkles size={13} />
                {findingMatches ? 'Finding...' : 'Find Matches'}
              </button>
            )}
            <button onClick={() => setShowEdit(true)} className="text-sm font-medium px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white border border-white/10 transition-colors">Edit</button>
            <button onClick={() => setShowDeleteConfirm(true)} className="text-sm font-medium px-3 py-1.5 rounded-lg bg-white/10 hover:bg-red-500/20 text-white border border-white/10 hover:border-red-500/30 transition-colors">
              <Trash2 size={14} />
            </button>
            <button onClick={handleMessage} className="text-sm font-medium px-3 py-1.5 rounded-lg bg-gold hover:bg-gold-muted text-white transition-colors shadow-sm shadow-gold/20">Message</button>
          </div>
        </div>
        <div className="grid grid-cols-4 divide-x" style={{ borderTop: '1px solid var(--border)', borderColor: 'var(--border)' }}>
          {[
            { l: 'Email', v: client.email },
            { l: 'Phone', v: client.phone, mono: true },
            { l: 'Preferred', v: client.preferredContact },
            { l: 'Last Contact', v: formatRelativeDate(client.lastContact), mono: true },
          ].map((d) => (
            <div key={d.l} className="px-4 py-2.5 text-center">
              <p className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: 'var(--text-quaternary)' }}>{d.l}</p>
              <p className={cn('text-[12px] font-medium mt-0.5 capitalize truncate', d.mono && 'font-mono')} style={{ color: 'var(--text-primary)' }}>{d.v}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: AI + Prefs + Transactions */}
        <div className="space-y-4">
          <AIProfileCard profile={aiProfile} />

          {/* Preferences */}
          <div className="surface overflow-hidden">
            <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
              <h3 className="text-[13px] font-bold" style={{ color: 'var(--text-primary)' }}>{rp ? 'Rental Prefs' : 'Buyer Prefs'}</h3>
            </div>
            <div className="p-4 space-y-2.5">
              {rp && <>
                <Row l="Budget" v={`${formatCurrency(rp.budgetMin)} - ${formatCurrency(rp.budgetMax)}/mo`} />
                <Row l="Beds/Baths" v={`${rp.bedrooms}BR / ${rp.bathrooms}BA`} />
                <Row l="Min SqFt" v={rp.sqftMin?.toLocaleString() || '—'} mono />
                <div><Lbl>Areas</Lbl><div className="flex flex-wrap gap-1 mt-1">{rp.preferredAreas.map((a) => <span key={a} className="pill">{a}</span>)}</div></div>
                {rp.mustHaveAmenities?.length > 0 && <div><Lbl>Must-Have</Lbl><div className="flex flex-wrap gap-1 mt-1">{rp.mustHaveAmenities.map((a) => <span key={a} className="badge badge-accent text-[10px]">{AMENITY_LABELS[a]}</span>)}</div></div>}
                {rp.pets && <Row l="Pets" v={rp.pets} />}
                {leaseExp !== null && (
                  <div className="mt-2 p-2.5 rounded-lg" style={{ background: 'var(--warning-muted)', border: '1px solid rgba(245,158,11,0.2)' }}>
                    <p className="text-[11px] font-semibold" style={{ color: 'var(--warning)' }}>⏰ Lease expires in {leaseExp} days</p>
                  </div>
                )}
              </>}
              {bp && <>
                <Row l="Budget" v={`${formatCurrency(bp.budgetMin)} - ${formatCurrency(bp.budgetMax)}`} />
                <Row l="Beds/Baths" v={`${bp.bedrooms}BR / ${bp.bathrooms}BA`} />
                {bp.preApproved && <Row l="Pre-Approved" v={formatCurrency(bp.preApprovalAmount || 0)} accent />}
                <Row l="Down Payment" v={bp.downPayment} />
                <Row l="Timeline" v={bp.timeline} />
              </>}
              {!rp && !bp && <p className="text-[12px] text-center py-4" style={{ color: 'var(--text-tertiary)' }}>No preferences set.</p>}
            </div>
          </div>

          {transactions.length > 0 && (
            <div className="surface overflow-hidden">
              <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
                <h3 className="text-[13px] font-bold" style={{ color: 'var(--text-primary)' }}>Transactions</h3>
              </div>
              <div className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
                {transactions.map((tx) => (
                  <div key={tx.id} className="px-4 py-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="badge badge-neutral text-[10px] capitalize">{tx.type}</span>
                      <span className="text-[12px] font-bold font-mono" style={{ color: 'var(--accent-text)' }}>{formatCurrency(tx.amount, tx.type === 'lease')}</span>
                    </div>
                    <p className="text-[12px] font-medium" style={{ color: 'var(--text-primary)' }}>{tx.propertyAddress}</p>
                    <p className="text-[11px] font-mono" style={{ color: 'var(--text-tertiary)' }}>{formatDate(tx.date)}{tx.leaseEndDate && ` → ${formatDate(tx.leaseEndDate)}`}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Matches + Triggers + Activity */}
        <div className="lg:col-span-2 space-y-4">
          {matchingInProgress && (
            <div className="surface overflow-hidden p-4">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
                <p className="text-[12px] font-medium" style={{ color: 'var(--accent-text)' }}>
                  Finding property matches based on updated preferences...
                </p>
              </div>
              <div className="mt-2 h-1 rounded-full overflow-hidden" style={{ background: 'var(--bg-1)' }}>
                <div className="h-full rounded-full animate-pulse" style={{ width: '60%', background: 'var(--accent)' }} />
              </div>
            </div>
          )}

          {matchList.length > 0 && (
            <div className="surface overflow-hidden">
              <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
                <h3 className="text-[13px] font-bold" style={{ color: 'var(--text-primary)' }}>Property Matches</h3>
              </div>
              <div className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
                {matchList.map((m) => (
                  <div key={m.id} className="px-4 py-3 hover:bg-[var(--surface-hover)] transition-colors">
                    <div className="flex items-start gap-3">
                      <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center text-[12px] font-bold font-mono', scoreBg(m.matchScore), scoreColor(m.matchScore))}>{m.matchScore}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold" style={{ color: 'var(--text-primary)' }}>{m.address}, {m.city}</p>
                        <p className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>{m.bedrooms}/{m.bathrooms} · {m.sqft.toLocaleString()}sf · {PROPERTY_TYPE_LABELS[m.propertyType]}</p>
                        <span className="text-[12px] font-bold font-mono" style={{ color: 'var(--accent-text)' }}>{formatCurrency(m.price, m.price < 10000)}</span>
                        <div className="flex flex-wrap gap-1 mt-1">{m.matchReasons.map((r) => <span key={r} className="pill text-[10px]">{r}</span>)}</div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {m.status === 'sent' && <span className="badge badge-accent text-[10px]">Sent</span>}
                        {m.status !== 'sent' && (
                          <button
                            disabled={matchLoading === m.id}
                            onClick={() => handleSendMatch(m.id)}
                            className={cn('btn btn-primary btn-xs', matchLoading === m.id && 'opacity-50 cursor-wait')}
                          >
                            {matchLoading === m.id ? '...' : 'Send'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {triggerList.filter((t) => t.status !== 'completed' && t.status !== 'dismissed').length > 0 && (
            <div className="surface overflow-hidden">
              <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
                <h3 className="text-[13px] font-bold" style={{ color: 'var(--text-primary)' }}>Triggers</h3>
              </div>
              <div className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
                {triggerList.filter((t) => t.status !== 'completed' && t.status !== 'dismissed').map((t) => (
                  <div key={t.id} className="px-4 py-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={cn('badge text-[10px]', urgencyBadge[t.urgency])}>{t.urgency}</span>
                      <span className="pill text-[10px] capitalize">{t.status}</span>
                      <div className="ml-auto flex items-center gap-1.5">
                        <button
                          disabled={triggerLoading === t.id}
                          onClick={() => handleTriggerAction(t.id, 'completed')}
                          className={cn('text-[11px] font-medium px-2 py-1 rounded bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors', triggerLoading === t.id && 'opacity-50 cursor-wait')}
                        >
                          Complete
                        </button>
                        <button
                          disabled={triggerLoading === t.id}
                          onClick={() => handleTriggerAction(t.id, 'dismissed')}
                          className={cn('text-[11px] font-medium px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors', triggerLoading === t.id && 'opacity-50 cursor-wait')}
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>
                    <p className="text-[12px] font-medium" style={{ color: 'var(--text-primary)' }}>{t.title}</p>
                    <p className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>{t.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="surface overflow-hidden">
            <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
              <h3 className="text-[13px] font-bold" style={{ color: 'var(--text-primary)' }}>Activity</h3>
              <span className="text-[11px] font-mono" style={{ color: 'var(--text-quaternary)' }}>{activities.length}</span>
            </div>
            <div className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
              {activities.map((a) => (
                <div key={a.id} className="px-4 py-2.5 hover:bg-[var(--surface-hover)] transition-colors">
                  <div className="flex items-start gap-2.5">
                    <span className="text-sm mt-0.5">{ACTIVITY_ICONS[a.type]}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-[12px] font-medium" style={{ color: 'var(--text-primary)' }}>{a.title}</p>
                        <span className="text-[10px] font-mono" style={{ color: 'var(--text-quaternary)' }}>{formatRelativeDate(a.timestamp)}</span>
                      </div>
                      <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{a.description}</p>
                    </div>
                  </div>
                </div>
              ))}
              {activities.length === 0 && <div className="p-6 text-center text-[12px]" style={{ color: 'var(--text-tertiary)' }}>No activity yet.</div>}
            </div>
          </div>

          {client.notes && (
            <div className="surface p-4">
              <p className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-tertiary)' }}>Notes</p>
              <p className="text-[12px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{client.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {showEdit && (
        <EditClientModal
          client={client}
          preferences={prefs}
          onSave={async (updated, prefsUpdated, savedPrefs) => {
            setClient(updated);
            setShowEdit(false);
            if (prefsUpdated && savedPrefs) {
              // Update preferences directly from what was just saved
              setPrefs({
                clientId: client.id,
                rental: savedPrefs.rental as ClientPreferences['rental'],
                buyer: savedPrefs.buyer as ClientPreferences['buyer'],
              });

              // Wait for background matching to complete, then refresh matches
              setMatchingInProgress(true);
              await new Promise((r) => setTimeout(r, 3000));
              try {
                const svc = await import('@/services');
                const freshMatches = await svc.getClientMatches(client.id);
                setMatchList(freshMatches);
              } catch {
                // non-critical — matches will appear on next page load
              } finally {
                setMatchingInProgress(false);
              }
            }
          }}
          onClose={() => setShowEdit(false)}
        />
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => !deleting && setShowDeleteConfirm(false)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div className="relative bg-white dark:bg-gray-900 rounded-xl border border-amber-200/25 dark:border-gray-800/60 shadow-xl w-full max-w-sm p-6 text-center" onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center mx-auto mb-4">
              <Trash2 size={20} className="text-red-500" />
            </div>
            <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100 mb-2">Delete {getClientName(client)}?</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-5">This will permanently remove the client and all associated data. This cannot be undone.</p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 px-4 py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="text-xs font-medium text-white bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded-lg transition-colors"
              >
                {deleting ? 'Deleting...' : 'Delete Client'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Row = ({ l, v, mono, accent }: { l: string; v: string; mono?: boolean; accent?: boolean }) => (
  <div className="flex justify-between text-[12px]">
    <span style={{ color: 'var(--text-tertiary)' }}>{l}</span>
    <span className={cn('font-medium', mono && 'font-mono')} style={{ color: accent ? 'var(--success)' : 'var(--text-primary)' }}>{v}</span>
  </div>
);

const Lbl = ({ children }: { children: React.ReactNode }) => (
  <span className="text-[12px]" style={{ color: 'var(--text-tertiary)' }}>{children}</span>
);
