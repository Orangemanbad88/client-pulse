'use client';

import { useState } from 'react';
import type { ClientIntakeData, ClientType, ContactMethod, UrgencyLevel, PropertyType, Amenity } from '@/types/client';
import { PROPERTY_TYPE_LABELS, AMENITY_LABELS } from '@/types/client';
import { cn } from '@/lib/utils';

interface Props { onSubmit: (d: ClientIntakeData) => void; onCancel: () => void; }

const blank: ClientIntakeData = { firstName: '', lastName: '', email: '', phone: '', preferredContact: 'any', source: '', clientType: 'rental', currentAddress: '', reasonForMoving: '', urgency: 'medium', notes: '' };

export const IntakeForm = ({ onSubmit, onCancel }: Props) => {
  const [f, setF] = useState<ClientIntakeData>(blank);
  const [step, setStep] = useState(1);

  const u = <K extends keyof ClientIntakeData>(k: K, v: ClientIntakeData[K]) => setF((p) => ({ ...p, [k]: v }));
  const ur = (k: string, v: unknown) => setF((p) => ({ ...p, rentalPrefs: { ...p.rentalPrefs, [k]: v } }));
  const ub = (k: string, v: unknown) => setF((p) => ({ ...p, buyerPrefs: { ...p.buyerPrefs, [k]: v } }));

  const isR = f.clientType === 'rental';
  const isB = f.clientType === 'buyer' || f.clientType === 'investor';
  const amenities = isR ? (f.rentalPrefs?.mustHaveAmenities || []) : (f.buyerPrefs?.mustHaveFeatures || []);
  const ptypes = isR ? (f.rentalPrefs?.propertyTypes || []) : (f.buyerPrefs?.propertyTypes || []);

  const toggleA = (a: Amenity) => {
    if (isR) { const c = f.rentalPrefs?.mustHaveAmenities || []; ur('mustHaveAmenities', c.includes(a) ? c.filter((x) => x !== a) : [...c, a]); }
    else { const c = f.buyerPrefs?.mustHaveFeatures || []; ub('mustHaveFeatures', c.includes(a) ? c.filter((x) => x !== a) : [...c, a]); }
  };
  const toggleP = (p: PropertyType) => {
    if (isR) { const c = f.rentalPrefs?.propertyTypes || []; ur('propertyTypes', c.includes(p) ? c.filter((x) => x !== p) : [...c, p]); }
    else { const c = f.buyerPrefs?.propertyTypes || []; ub('propertyTypes', c.includes(p) ? c.filter((x) => x !== p) : [...c, p]); }
  };

  const steps = ['Contact', 'Type', 'Preferences', 'Situation'];

  return (
    <div className="surface-elevated overflow-hidden animate-scale-in" style={{ borderRadius: 'var(--radius-xl)' }}>
      <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--border)', background: 'var(--bg-1)' }}>
        <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>New Client</h2>
        <p className="text-[12px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>Enter once — syncs everywhere</p>
      </div>

      {/* Steps */}
      <div className="flex border-b" style={{ borderColor: 'var(--border)' }}>
        {steps.map((s, i) => (
          <button key={s} onClick={() => setStep(i + 1)}
            className={cn('flex-1 py-2.5 text-[11px] font-semibold text-center border-b-2 transition-all',
              step === i + 1 ? 'border-[var(--accent)]' : 'border-transparent')}
            style={{ color: step === i + 1 ? 'var(--accent-text)' : 'var(--text-tertiary)' }}>
            {s}
          </button>
        ))}
      </div>

      <div className="p-5 space-y-3.5 min-h-[320px]">
        {step === 1 && <div className="space-y-3.5 animate-in">
          <div className="grid grid-cols-2 gap-3">
            <div><Lbl>First Name</Lbl><input className="input" value={f.firstName} onChange={(e) => u('firstName', e.target.value)} placeholder="Sarah" /></div>
            <div><Lbl>Last Name</Lbl><input className="input" value={f.lastName} onChange={(e) => u('lastName', e.target.value)} placeholder="Chen" /></div>
          </div>
          <div><Lbl>Email</Lbl><input className="input" type="email" value={f.email} onChange={(e) => u('email', e.target.value)} placeholder="sarah@email.com" /></div>
          <div><Lbl>Phone</Lbl><input className="input" type="tel" value={f.phone} onChange={(e) => u('phone', e.target.value)} placeholder="(727) 555-0142" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Lbl>Contact Pref</Lbl><select className="select" value={f.preferredContact} onChange={(e) => u('preferredContact', e.target.value as ContactMethod)}>
              <option value="any">Any</option><option value="email">Email</option><option value="phone">Phone</option><option value="text">Text</option>
            </select></div>
            <div><Lbl>Source</Lbl><input className="input" value={f.source} onChange={(e) => u('source', e.target.value)} placeholder="Referral, Website..." /></div>
          </div>
        </div>}

        {step === 2 && <div className="space-y-3.5 animate-in">
          <div><Lbl>Client Type</Lbl>
            <div className="grid grid-cols-4 gap-2 mt-1.5">
              {(['rental', 'buyer', 'seller', 'investor'] as ClientType[]).map((t) => (
                <button key={t} onClick={() => u('clientType', t)}
                  className={cn('p-2.5 rounded-lg border text-[12px] font-medium capitalize text-center transition-all',
                    f.clientType === t ? 'border-[var(--accent)] bg-[var(--accent-muted)]' : 'hover:border-[var(--border-strong)]')}
                  style={{ borderColor: f.clientType === t ? 'var(--accent)' : 'var(--border)', color: f.clientType === t ? 'var(--accent-text)' : 'var(--text-secondary)' }}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div><Lbl>Property Types</Lbl>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {(Object.entries(PROPERTY_TYPE_LABELS) as [PropertyType, string][]).map(([k, v]) => (
                <button key={k} onClick={() => toggleP(k)}
                  className={cn('px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-all',
                    ptypes.includes(k) ? 'border-[var(--accent)] bg-[var(--accent-muted)]' : '')}
                  style={{ borderColor: ptypes.includes(k) ? 'var(--accent)' : 'var(--border)', color: ptypes.includes(k) ? 'var(--accent-text)' : 'var(--text-tertiary)' }}>
                  {v}
                </button>
              ))}
            </div>
          </div>
        </div>}

        {step === 3 && <div className="space-y-3.5 animate-in">
          <div className="grid grid-cols-2 gap-3">
            <div><Lbl>Budget Min {isR && '/mo'}</Lbl><input className="input" type="number" placeholder={isR ? '1800' : '250000'} onChange={(e) => isR ? ur('budgetMin', +e.target.value) : ub('budgetMin', +e.target.value)} /></div>
            <div><Lbl>Budget Max {isR && '/mo'}</Lbl><input className="input" type="number" placeholder={isR ? '2500' : '450000'} onChange={(e) => isR ? ur('budgetMax', +e.target.value) : ub('budgetMax', +e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><Lbl>Beds</Lbl><input className="input" type="number" placeholder="3" onChange={(e) => isR ? ur('bedrooms', +e.target.value) : ub('bedrooms', +e.target.value)} /></div>
            <div><Lbl>Baths</Lbl><input className="input" type="number" placeholder="2" onChange={(e) => isR ? ur('bathrooms', +e.target.value) : ub('bathrooms', +e.target.value)} /></div>
            <div><Lbl>Min SqFt</Lbl><input className="input" type="number" placeholder="1400" onChange={(e) => isR ? ur('sqftMin', +e.target.value) : ub('sqftMin', +e.target.value)} /></div>
          </div>
          <div><Lbl>Areas (comma-sep)</Lbl><input className="input" placeholder="Dunedin, Palm Harbor, Clearwater" onChange={(e) => { const a = e.target.value.split(',').map((x) => x.trim()).filter(Boolean); isR ? ur('preferredAreas', a) : ub('preferredAreas', a); }} /></div>
          <div><Lbl>Must-Have</Lbl>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {(Object.entries(AMENITY_LABELS) as [Amenity, string][]).map(([k, v]) => (
                <button key={k} onClick={() => toggleA(k)}
                  className={cn('px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-all',
                    amenities.includes(k) ? 'border-[var(--accent)] bg-[var(--accent-muted)]' : '')}
                  style={{ borderColor: amenities.includes(k) ? 'var(--accent)' : 'var(--border)', color: amenities.includes(k) ? 'var(--accent-text)' : 'var(--text-tertiary)' }}>
                  {v}
                </button>
              ))}
            </div>
          </div>
          {isR && <div><Lbl>Pets</Lbl><input className="input" placeholder="2 labs, cat, etc." onChange={(e) => ur('pets', e.target.value)} /></div>}
          {isB && <>
            <div className="grid grid-cols-2 gap-3">
              <div><Lbl>Pre-Approved?</Lbl><select className="select" onChange={(e) => ub('preApproved', e.target.value === 'true')}><option value="false">No</option><option value="true">Yes</option></select></div>
              <div><Lbl>Pre-Approval Amt</Lbl><input className="input" type="number" placeholder="500000" onChange={(e) => ub('preApprovalAmount', +e.target.value)} /></div>
            </div>
          </>}
        </div>}

        {step === 4 && <div className="space-y-3.5 animate-in">
          <div><Lbl>Current Address</Lbl><input className="input" value={f.currentAddress} onChange={(e) => u('currentAddress', e.target.value)} placeholder="412 Main St, Dunedin, FL" /></div>
          {isR && <div><Lbl>Lease Expiration</Lbl><input className="input" type="date" value={f.currentLeaseExpiration || ''} onChange={(e) => u('currentLeaseExpiration', e.target.value)} /></div>}
          <div><Lbl>Reason for Moving</Lbl><input className="input" value={f.reasonForMoving} onChange={(e) => u('reasonForMoving', e.target.value)} placeholder="Lease ending, relocating..." /></div>
          <div><Lbl>Urgency</Lbl>
            <div className="grid grid-cols-4 gap-2 mt-1.5">
              {(['low', 'medium', 'high', 'critical'] as UrgencyLevel[]).map((l) => (
                <button key={l} onClick={() => u('urgency', l)}
                  className={cn('p-2 rounded-lg border text-[11px] font-medium capitalize text-center transition-all',
                    f.urgency === l ? 'border-[var(--accent)] bg-[var(--accent-muted)]' : '')}
                  style={{ borderColor: f.urgency === l ? 'var(--accent)' : 'var(--border)', color: f.urgency === l ? 'var(--accent-text)' : 'var(--text-tertiary)' }}>
                  {l}
                </button>
              ))}
            </div>
          </div>
          <div><Lbl>Notes</Lbl><textarea className="input" value={f.notes} onChange={(e) => u('notes', e.target.value)} placeholder="Additional details..." /></div>
        </div>}
      </div>

      <div className="px-5 py-3 border-t flex items-center justify-between" style={{ borderColor: 'var(--border)', background: 'var(--bg-1)' }}>
        <button onClick={onCancel} className="btn btn-ghost">Cancel</button>
        <div className="flex gap-2">
          {step > 1 && <button onClick={() => setStep(step - 1)} className="btn btn-secondary">Back</button>}
          {step < 4 ? <button onClick={() => setStep(step + 1)} className="btn btn-primary">Next</button>
            : <button onClick={() => onSubmit(f)} className="btn btn-primary">Create Client</button>}
        </div>
      </div>
    </div>
  );
};

const Lbl = ({ children }: { children: React.ReactNode }) => (
  <label className="text-[11px] font-semibold block mb-1" style={{ color: 'var(--text-tertiary)' }}>{children}</label>
);
