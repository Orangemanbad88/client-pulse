'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ClientDetail } from '@/components/clients/ClientDetail';
import type { Client, ClientPreferences, Activity, Transaction, PropertyMatch, AIProfile, Trigger } from '@/types/client';
import * as svc from '@/services/mock-service';
import Link from 'next/link';

export default function ClientDetailPage() {
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : (params.id ?? '');
  const [client, setClient] = useState<Client | null>(null);
  const [prefs, setPrefs] = useState<ClientPreferences | null>(null);
  const [acts, setActs] = useState<Activity[]>([]);
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [matches, setMatches] = useState<PropertyMatch[]>([]);
  const [ai, setAi] = useState<AIProfile | null>(null);
  const [triggers, setTriggers] = useState<Trigger[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [c, p, a, t, m, ap, tr] = await Promise.all([
          svc.getClient(id), svc.getClientPreferences(id), svc.getClientActivities(id),
          svc.getClientTransactions(id), svc.getClientMatches(id), svc.getAIProfile(id), svc.getClientTriggers(id)
        ]);
        if (!cancelled) {
          setClient(c); setPrefs(p); setActs(a); setTxs(t); setMatches(m); setAi(ap); setTriggers(tr); setLoading(false);
        }
      } catch {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  if (loading) return <div className="flex items-center justify-center min-h-[400px]"><p className="text-[13px]" style={{ color: 'var(--text-tertiary)' }}>Loading...</p></div>;

  if (!client) return (
    <div className="flex flex-col items-center justify-center min-h-[400px] animate-in">
      <p className="text-base font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Client not found</p>
      <Link href="/clients" className="btn btn-primary btn-sm">← Back</Link>
    </div>
  );

  return <ClientDetail client={client} preferences={prefs} activities={acts} transactions={txs} matches={matches} aiProfile={ai} triggers={triggers} />;
}
