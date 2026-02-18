'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ClientList } from '@/components/clients/ClientList';
import { IntakeForm } from '@/components/clients/IntakeForm';
import type { Client, ClientIntakeData } from '@/types/client';
import * as svc from '@/services/mock-service';

export default function ClientsPage() {
  return <Suspense><ClientsContent /></Suspense>;
}

function ClientsContent() {
  const params = useSearchParams();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => { svc.getClients().then((d) => { setClients(d); setLoading(false); }).catch((err) => { console.error('Failed to load clients:', err); setLoading(false); }); }, []);
  useEffect(() => { if (params.get('new') === 'true') setShowForm(true); }, [params]);

  const onCreate = async (d: ClientIntakeData) => {
    try {
      const c = await svc.createClient(d);
      setClients((p) => [c, ...p]);
      setShowForm(false);
    } catch {
      // TODO: show error toast when real backend is connected
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-[400px]"><p className="text-[13px]" style={{ color: 'var(--text-tertiary)' }}>Loading...</p></div>;

  return (
    <>
      <header
        className="px-4 lg:px-8 py-3 lg:py-4 border-b border-[#1E293B]/50 flex items-center justify-between"
        style={{ background: 'linear-gradient(135deg, #475569 0%, #1E293B 50%, #475569 100%)' }}
      >
        <div>
          <h1 className="text-lg text-white" style={{ fontWeight: 600, letterSpacing: '-0.025em' }}>Clients</h1>
          <p className="text-xs text-slate-400 mt-0.5">{clients.length} total</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors shadow-sm shadow-teal-600/20 active:scale-[0.97]">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
          New Client
        </button>
      </header>
      <div className="px-4 lg:px-8 py-4 lg:py-6 space-y-4">
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
    </>
  );
}
