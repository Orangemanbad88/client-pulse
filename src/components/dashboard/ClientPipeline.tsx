'use client';

import type { Client, LifecycleStage } from '@/types/client';
import { LIFECYCLE_LABELS } from '@/types/client';
import { getInitials, getClientName, formatRelativeDate, lifecycleOrder, cn } from '@/lib/utils';
import Link from 'next/link';

const stageAccent: Record<LifecycleStage, string> = {
  new_lead: 'var(--info)', active_search: 'var(--accent)', hot_decision: 'var(--warning)',
  under_contract: '#a855f7', active_client: 'var(--success)', renewal_window: '#f97316', past_client: 'var(--text-tertiary)',
};

export const ClientPipeline = ({ clientsByStage }: { clientsByStage: Record<LifecycleStage, Client[]> }) => {
  const active = lifecycleOrder.filter((s) => clientsByStage[s]?.length > 0);

  return (
    <div className="surface overflow-hidden">
      <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
        <h2 className="text-[13px] font-bold" style={{ color: 'var(--text-primary)' }}>Pipeline</h2>
      </div>
      <div className="p-4 overflow-x-auto">
        <div className="flex gap-3 min-w-max">
          {active.map((stage) => (
            <div key={stage} className="w-52 shrink-0">
              <div className="flex items-center gap-2 mb-2.5 px-0.5">
                <div className="w-2 h-2 rounded-full" style={{ background: stageAccent[stage] }} />
                <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
                  {LIFECYCLE_LABELS[stage]}
                </span>
                <span className="text-[11px] font-mono ml-auto" style={{ color: 'var(--text-quaternary)' }}>
                  {clientsByStage[stage].length}
                </span>
              </div>
              <div className="space-y-1.5 stagger">
                {clientsByStage[stage].map((c) => (
                  <Link key={c.id} href={`/clients/${c.id}`}
                    className="block p-2.5 rounded-lg border transition-all group hover:border-[var(--border-strong)]"
                    style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                        style={{ background: stageAccent[stage] }}>
                        {getInitials(c.firstName, c.lastName)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[12px] font-semibold truncate group-hover:text-[var(--accent-text)] transition-colors" style={{ color: 'var(--text-primary)' }}>
                          {getClientName(c)}
                        </p>
                        <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                          {c.clientType} · {formatRelativeDate(c.lastContact)}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
