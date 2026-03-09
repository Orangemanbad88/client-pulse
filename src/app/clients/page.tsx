'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Users, Upload } from 'lucide-react';
import { ClientList } from '@/components/clients/ClientList';
import { IntakeForm } from '@/components/clients/IntakeForm';
import { CSVImport } from '@/components/clients/CSVImport';
import type { Client, ClientIntakeData } from '@/types/client';

export default function ClientsPage() {
  return <Suspense><ClientsContent /></Suspense>;
}

function ClientsContent() {
  const params = useSearchParams();
  const [clients, setClients] = useState<Client[]>([]);
  const [matchCounts, setMatchCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showCSVImport, setShowCSVImport] = useState(false);
  const [createError, setCreateError] = useState('');

  useEffect(() => {
    import('@/services').then(async (svc) => {
      const [clientData, counts] = await Promise.all([
        svc.getClients(),
        svc.getNewMatchCountsByClient(),
      ]);
      setClients(clientData);
      setMatchCounts(counts);
      setLoading(false);
    }).catch(() => { setError(true); setLoading(false); });
  }, []);
  useEffect(() => { if (params.get('new') === 'true') setShowForm(true); }, [params]);

  const onCreate = async (d: ClientIntakeData) => {
    setCreateError('');
    try {
      const res = await fetch('/api/clients/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(d),
      });
      const result = await res.json();
      if (!result.success) {
        setCreateError(result.error || 'Failed to create client');
        return;
      }
      setClients((p) => [result.data, ...p]);
      setShowForm(false);
    } catch {
      setCreateError('Network error — please try again');
    }
  };

  const handleCSVImport = async (rows: Record<string, string>[]) => {
    let successCount = 0;
    let failCount = 0;
    for (const row of rows) {
      try {
        const res = await fetch('/api/clients/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            firstName: row.firstName || '',
            lastName: row.lastName || '',
            email: row.email || '',
            phone: row.phone || '',
            clientType: row.clientType || 'rental',
            status: row.status || 'lead',
            source: row.source || 'csv_import',
            preferredContact: row.preferredContact || 'email',
            notes: row.notes || '',
            currentAddress: row.currentAddress || '',
          }),
        });
        const result = await res.json();
        if (result.success) successCount++;
        else failCount++;
      } catch {
        failCount++;
      }
    }
    setShowCSVImport(false);
    // Refresh client list
    try {
      const svc = await import('@/services');
      const [clientData, counts] = await Promise.all([
        svc.getClients(),
        svc.getNewMatchCountsByClient(),
      ]);
      setClients(clientData);
      setMatchCounts(counts);
    } catch { /* list will refresh on next load */ }
    if (failCount > 0) {
      setCreateError(`Imported ${successCount} clients, ${failCount} failed`);
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-[400px]"><p className="text-[13px]" style={{ color: 'var(--text-tertiary)' }}>Loading...</p></div>;

  if (error) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <Users size={32} className="text-gray-300 dark:text-gray-700 mx-auto mb-3" />
        <p className="text-sm text-gray-400 mb-1">Unable to load clients</p>
        <p className="text-xs text-gray-400/60">Check your connection and try refreshing</p>
      </div>
    </div>
  );

  return (
    <>
      <header
        className="sticky top-0 z-10 px-4 lg:px-8 py-3 lg:py-4 border-b border-[#132a4a]/50 flex items-center justify-between"
        style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #1a3456 50%, #1e3a5f 100%)' }}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold to-gold-muted flex items-center justify-center shadow-sm shadow-gold/15">
            <Users size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg text-white" style={{ fontWeight: 600, letterSpacing: '-0.025em' }}>Clients</h1>
            <p className="text-xs text-slate-400 mt-0.5">{clients.length} total</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowCSVImport(true)} className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors border border-white/20 active:scale-[0.97]">
            <Upload size={14} /> Import CSV
          </button>
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-gold hover:bg-gold-muted text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors shadow-sm shadow-gold/20 active:scale-[0.97]">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
            New Client
          </button>
        </div>
      </header>
      <div className="px-4 lg:px-8 py-4 lg:py-6 space-y-4">
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              {createError && (
                <div className="mb-3 px-4 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">
                  {createError}
                </div>
              )}
              <IntakeForm onSubmit={onCreate} onCancel={() => { setShowForm(false); setCreateError(''); }} />
            </div>
          </div>
        )}
        {showCSVImport && (
          <CSVImport
            onImport={handleCSVImport}
            onClose={() => setShowCSVImport(false)}
          />
        )}
        <ClientList clients={clients} matchCounts={matchCounts} />
      </div>
    </>
  );
}
