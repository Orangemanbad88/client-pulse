'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ClientList } from '@/components/clients/ClientList';
import { IntakeForm } from '@/components/clients/IntakeForm';
import type { Client, ClientIntakeData } from '@/types/client';
import * as svc from '@/services/mock-service';

export default function ClientsPage() {
  const params = useSearchParams();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => { svc.getClients().then((d) => { setClients(d); setLoading(false); }); }, []);
  useEffect(() => { if (params.get('new') === 'true') setShowForm(true); }, [params]);

  const onCreate = async (d: ClientIntakeData) => {
    const c = await svc.createClient(d);
    setClients((p) => [c, ...p]);
    setShowForm(false);
  };

  if (loading) return <div className="flex items-center justify-center min-h-[400px]"><p className="text-[13px]" style={{ color: 'var(--text-tertiary)' }}>Loading...</p></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>Clients</h1>
          <p className="text-[12px] font-mono mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{clients.length} total</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn btn-primary">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
          New Client
        </button>
      </div>
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <IntakeForm onSubmit={onCreate} onCancel={() => setShowForm(false)} />
          </div>
        </div>
      )}
      <ClientList clients={clients} />
    </div>
  );
}
