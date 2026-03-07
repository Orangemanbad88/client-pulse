'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import type { Client, ClientType, ClientStatus, ContactMethod, LifecycleStage } from '@/types/client';
import { LIFECYCLE_LABELS } from '@/types/client';
import { cn } from '@/lib/utils';

interface Props {
  client: Client;
  onSave: (updated: Client) => void;
  onClose: () => void;
}

const CLIENT_TYPES: { value: ClientType; label: string }[] = [
  { value: 'rental', label: 'Rental' },
  { value: 'buyer', label: 'Buyer' },
  { value: 'seller', label: 'Seller' },
  { value: 'investor', label: 'Investor' },
  { value: 'multi', label: 'Multi' },
];

const STATUSES: { value: ClientStatus; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'lead', label: 'Lead' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'past_client', label: 'Past Client' },
];

const CONTACT_METHODS: { value: ContactMethod; label: string }[] = [
  { value: 'any', label: 'Any' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'text', label: 'Text' },
];

const inputClass = 'w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold transition-all';
const labelClass = 'block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5';

export const EditClientModal = ({ client, onSave, onClose }: Props) => {
  const [form, setForm] = useState({
    firstName: client.firstName,
    lastName: client.lastName,
    email: client.email,
    phone: client.phone,
    preferredContact: client.preferredContact,
    clientType: client.clientType,
    status: client.status,
    lifecycleStage: client.lifecycleStage,
    notes: client.notes,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = <K extends keyof typeof form>(key: K, val: (typeof form)[K]) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  const handleSave = async () => {
    if (!form.firstName.trim() || !form.lastName.trim()) {
      setError('First and last name are required');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/clients/${client.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const result = await res.json();
      if (!result.success) {
        setError(result.error || 'Failed to update client');
        setSaving(false);
        return;
      }
      onSave(result.data);
    } catch {
      setError('Network error — please try again');
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative bg-white dark:bg-gray-900 rounded-xl border border-amber-200/25 dark:border-gray-800/60 shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-amber-100/30 dark:border-gray-800/60 flex items-center justify-between sticky top-0 bg-white dark:bg-gray-900 z-10">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-5 rounded-full bg-gold" />
            <h2 className="text-sm font-bold text-gray-800 dark:text-gray-100 tracking-tight">Edit Client</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <X size={16} className="text-gray-400" />
          </button>
        </div>

        {/* Form */}
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>First Name *</label>
              <input type="text" value={form.firstName} onChange={(e) => set('firstName', e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Last Name *</label>
              <input type="text" value={form.lastName} onChange={(e) => set('lastName', e.target.value)} className={inputClass} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Email</label>
              <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Phone</label>
              <input type="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)} className={inputClass} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Preferred Contact</label>
              <select value={form.preferredContact} onChange={(e) => set('preferredContact', e.target.value as ContactMethod)} className={cn(inputClass, 'appearance-none cursor-pointer')}>
                {CONTACT_METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Client Type</label>
              <select value={form.clientType} onChange={(e) => set('clientType', e.target.value as ClientType)} className={cn(inputClass, 'appearance-none cursor-pointer')}>
                {CLIENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Status</label>
              <select value={form.status} onChange={(e) => set('status', e.target.value as ClientStatus)} className={cn(inputClass, 'appearance-none cursor-pointer')}>
                {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Lifecycle Stage</label>
              <select value={form.lifecycleStage} onChange={(e) => set('lifecycleStage', e.target.value as LifecycleStage)} className={cn(inputClass, 'appearance-none cursor-pointer')}>
                {Object.entries(LIFECYCLE_LABELS).map(([val, label]) => <option key={val} value={val}>{label}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className={labelClass}>Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              rows={3}
              className={cn(inputClass, 'resize-none')}
              placeholder="Internal notes..."
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-amber-100/30 dark:border-gray-800/60 flex items-center justify-between sticky bottom-0 bg-white dark:bg-gray-900">
          {error ? (
            <p className="text-xs text-red-500 dark:text-red-400">{error}</p>
          ) : (
            <div />
          )}
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              disabled={saving}
              className="text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 px-4 py-2 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="text-xs font-medium text-white bg-gold hover:bg-gold-muted disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded-lg transition-colors shadow-sm shadow-gold/20 active:scale-[0.97]"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
