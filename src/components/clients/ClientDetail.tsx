'use client';

import type { Client, ClientPreferences, Activity, Transaction, PropertyMatch, AIProfile, Trigger } from '@/types/client';
import { LIFECYCLE_LABELS, PROPERTY_TYPE_LABELS, AMENITY_LABELS, ACTIVITY_ICONS } from '@/types/client';
import { getInitials, getClientName, formatCurrency, formatDate, formatRelativeDate, daysUntil, urgencyBadge, scoreColor, scoreBg, cn, stageBadge } from '@/lib/utils';
import { AIProfileCard } from './AIProfileCard';
import Link from 'next/link';

interface Props { client: Client; preferences: ClientPreferences | null; activities: Activity[]; transactions: Transaction[]; matches: PropertyMatch[]; aiProfile: AIProfile | null; triggers: Trigger[]; }

export const ClientDetail = ({ client, preferences, activities, transactions, matches, aiProfile, triggers }: Props) => {
  const rp = preferences?.rental;
  const bp = preferences?.buyer;
  const leaseExp = rp?.currentLeaseExpiration ? daysUntil(rp.currentLeaseExpiration) : null;

  return (
    <div className="space-y-4 animate-in">
      {/* Header */}
      <div className="surface overflow-hidden">
        <div className="px-5 py-4 flex items-center gap-4" style={{ background: 'var(--bg-1)' }}>
          <Link href="/clients" className="btn btn-ghost btn-sm">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          </Link>
          <div className="w-11 h-11 rounded-full bg-[var(--accent)] flex items-center justify-center text-white text-sm font-bold">
            {getInitials(client.firstName, client.lastName)}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2.5">
              <h1 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{getClientName(client)}</h1>
              <span className={cn('badge text-[10px]', stageBadge[client.lifecycleStage])}>{LIFECYCLE_LABELS[client.lifecycleStage]}</span>
            </div>
            <p className="text-[12px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
              <span className="capitalize">{client.clientType}</span> · {client.source} · Since {formatDate(client.createdAt)}
            </p>
          </div>
          <div className="flex gap-2">
            <button className="btn btn-secondary btn-sm">Edit</button>
            <button className="btn btn-primary btn-sm">Message</button>
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
          {matches.length > 0 && (
            <div className="surface overflow-hidden">
              <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
                <h3 className="text-[13px] font-bold" style={{ color: 'var(--text-primary)' }}>Property Matches</h3>
              </div>
              <div className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
                {matches.map((m) => (
                  <div key={m.id} className="px-4 py-3 hover:bg-[var(--surface-hover)] transition-colors">
                    <div className="flex items-start gap-3">
                      <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center text-[12px] font-bold font-mono', scoreBg(m.matchScore), scoreColor(m.matchScore))}>{m.matchScore}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold" style={{ color: 'var(--text-primary)' }}>{m.address}, {m.city}</p>
                        <p className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>{m.bedrooms}/{m.bathrooms} · {m.sqft.toLocaleString()}sf · {PROPERTY_TYPE_LABELS[m.propertyType]}</p>
                        <span className="text-[12px] font-bold font-mono" style={{ color: 'var(--accent-text)' }}>{formatCurrency(m.price, m.price < 10000)}</span>
                        <div className="flex flex-wrap gap-1 mt-1">{m.matchReasons.map((r) => <span key={r} className="pill text-[10px]">{r}</span>)}</div>
                      </div>
                      <button className="btn btn-primary btn-xs">Send</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {triggers.filter((t) => t.status !== 'completed').length > 0 && (
            <div className="surface overflow-hidden">
              <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
                <h3 className="text-[13px] font-bold" style={{ color: 'var(--text-primary)' }}>Triggers</h3>
              </div>
              <div className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
                {triggers.filter((t) => t.status !== 'completed').map((t) => (
                  <div key={t.id} className="px-4 py-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={cn('badge text-[10px]', urgencyBadge[t.urgency])}>{t.urgency}</span>
                      <span className="pill text-[10px] capitalize">{t.status}</span>
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
