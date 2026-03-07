'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Pencil } from 'lucide-react';
import type {
  Client,
  ClientType,
  ClientStatus,
  ContactMethod,
  LifecycleStage,
  ClientPreferences,
  PropertyType,
  Amenity,
} from '@/types/client';
import { LIFECYCLE_LABELS, PROPERTY_TYPE_LABELS, AMENITY_LABELS } from '@/types/client';
import { cn } from '@/lib/utils';

interface SavedPrefs {
  rental?: Record<string, unknown> | null;
  buyer?: Record<string, unknown> | null;
}

interface Props {
  client: Client;
  preferences: ClientPreferences | null;
  onSave: (updated: Client, prefsUpdated?: boolean, savedPrefs?: SavedPrefs) => void;
  onClose: () => void;
}

const steps = ['Contact', 'Type', 'Preferences', 'Details'];

const CITIES = [
  'Avalon',
  'Avalon Manor',
  'Atlantic City',
  'Belleplain',
  'Cape May',
  'Cape May Beach',
  'Cape May Court House',
  'Cape May Point',
  'Cold Spring',
  'Corbin City',
  'Del Haven',
  'Dennisville',
  'Erma',
  'Fortescue',
  'Leesburg',
  'Little Egg Harbor',
  'Lower Township',
  'Marmora',
  'Mauricetown',
  'North Cape May',
  'North Wildwood',
  'Ocean City',
  'Ocean View',
  'Palermo',
  'Petersburg',
  'Rio Grande',
  'Sea Isle City',
  'Seaville',
  'Somers Point',
  'South Dennis',
  'Stone Harbor',
  'Swainton',
  'Toms River',
  'Townbank',
  'Tuckahoe',
  'Ventnor',
  'Villas',
  'West Cape May',
  'West Wildwood',
  'Whitesboro',
  'Wildwood',
  'Wildwood Crest',
  'Woodbine',
];

export const EditClientModal = ({ client, preferences, onSave, onClose }: Props) => {
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [firstName, setFirstName] = useState(client.firstName);
  const [lastName, setLastName] = useState(client.lastName);
  const [email, setEmail] = useState(client.email);
  const [phone, setPhone] = useState(client.phone);
  const [preferredContact, setPreferredContact] = useState<ContactMethod>(client.preferredContact);
  const [source, setSource] = useState(client.source);
  const [clientType, setClientType] = useState<ClientType>(client.clientType);
  const [status, setStatus] = useState<ClientStatus>(client.status);
  const [lifecycleStage, setLifecycleStage] = useState<LifecycleStage>(client.lifecycleStage);
  const [notes, setNotes] = useState(client.notes);

  const rp = preferences?.rental;
  const [rBudgetMin, setRBudgetMin] = useState(rp?.budgetMin ?? 0);
  const [rBudgetMax, setRBudgetMax] = useState(rp?.budgetMax ?? 0);
  const [rBedrooms, setRBedrooms] = useState(rp?.bedrooms ?? 0);
  const [rBathrooms, setRBathrooms] = useState(rp?.bathrooms ?? 0);
  const [rSqftMin, setRSqftMin] = useState(rp?.sqftMin ?? 0);
  const [rAreas, setRAreas] = useState<string[]>(rp?.preferredAreas ?? []);
  const [rPropertyTypes, setRPropertyTypes] = useState<PropertyType[]>(rp?.propertyTypes ?? []);
  const [rAmenities, setRAmenities] = useState<Amenity[]>(rp?.mustHaveAmenities ?? []);
  const [rPets, setRPets] = useState(rp?.pets ?? '');
  const [rMoveIn, setRMoveIn] = useState(rp?.moveInTimeline ?? '');
  const [rLeaseExp, setRLeaseExp] = useState(rp?.currentLeaseExpiration ?? '');

  const bp = preferences?.buyer;
  const [bBudgetMin, setBBudgetMin] = useState(bp?.budgetMin ?? 0);
  const [bBudgetMax, setBBudgetMax] = useState(bp?.budgetMax ?? 0);
  const [bBedrooms, setBBedrooms] = useState(bp?.bedrooms ?? 0);
  const [bBathrooms, setBBathrooms] = useState(bp?.bathrooms ?? 0);
  const [bSqftMin, setBSqftMin] = useState(bp?.sqftMin ?? 0);
  const [bAreas, setBAreas] = useState<string[]>(bp?.preferredAreas ?? []);
  const [bPropertyTypes, setBPropertyTypes] = useState<PropertyType[]>(bp?.propertyTypes ?? []);
  const [bAmenities, setBAmenities] = useState<Amenity[]>(bp?.mustHaveFeatures ?? []);
  const [bPreApproved, setBPreApproved] = useState(bp?.preApproved ?? false);
  const [bPreApprovalAmt, setBPreApprovalAmt] = useState(bp?.preApprovalAmount ?? 0);
  const [bDownPayment, setBDownPayment] = useState(bp?.downPayment ?? '');
  const [bTimeline, setBTimeline] = useState(bp?.timeline ?? '');

  const isR = clientType === 'rental';
  const isB = clientType === 'buyer' || clientType === 'investor';
  const currentPTypes = isR ? rPropertyTypes : bPropertyTypes;
  const currentAmenities = isR ? rAmenities : bAmenities;
  const currentAreas = isR ? rAreas : bAreas;
  const setCurrentAreas = isR ? setRAreas : setBAreas;

  const togglePType = (p: PropertyType) => {
    if (isR) setRPropertyTypes((prev) => prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]);
    else setBPropertyTypes((prev) => prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]);
  };
  const toggleAmenity = (a: Amenity) => {
    if (isR) setRAmenities((prev) => prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]);
    else setBAmenities((prev) => prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]);
  };
  const toggleCity = (city: string) => {
    setCurrentAreas((prev) => prev.includes(city) ? prev.filter((c) => c !== city) : [...prev, city]);
  };

  const handleSave = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      setError('First and last name are required');
      setStep(1);
      return;
    }
    setSaving(true);
    setError('');
    try {
      const rentalPrefs = isR ? {
        budgetMin: rBudgetMin, budgetMax: rBudgetMax, bedrooms: rBedrooms, bathrooms: rBathrooms,
        sqftMin: rSqftMin, preferredAreas: rAreas,
        propertyTypes: rPropertyTypes, mustHaveAmenities: rAmenities, pets: rPets,
        moveInTimeline: rMoveIn, currentLeaseExpiration: rLeaseExp,
      } : null;

      const buyerPrefs = isB ? {
        budgetMin: bBudgetMin, budgetMax: bBudgetMax, bedrooms: bBedrooms, bathrooms: bBathrooms,
        sqftMin: bSqftMin, preferredAreas: bAreas,
        propertyTypes: bPropertyTypes, mustHaveFeatures: bAmenities, preApproved: bPreApproved,
        preApprovalAmount: bPreApprovalAmt, downPayment: bDownPayment, timeline: bTimeline,
      } : null;

      // Always send preferences for rental/buyer clients, even if partially filled
      const prefsPayload = (isR || isB) ? { preferences: { rental: rentalPrefs, buyer: buyerPrefs } } : {};

      const res = await fetch(`/api/clients/${client.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName, lastName, email, phone, preferredContact, source, clientType, status, lifecycleStage, notes,
          ...prefsPayload,
        }),
      });
      const result = await res.json();
      if (!result.success) {
        setError(result.error || 'Failed to update client');
        setSaving(false);
        return;
      }
      onSave(result.data, result.prefsUpdated, { rental: rentalPrefs, buyer: buyerPrefs });
    } catch {
      setError('Network error — please try again');
      setSaving(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="surface-elevated overflow-hidden" style={{ borderRadius: 'var(--radius-xl)' }}>
          {/* Header with pencil icon + client name */}
          <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--border)', background: 'var(--bg-1)' }}>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[var(--accent-muted)] flex items-center justify-center">
                <Pencil size={14} style={{ color: 'var(--accent-text)' }} />
              </div>
              <div>
                <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>Edit {client.firstName} {client.lastName}</h2>
                <p className="text-[12px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>Update contact info, preferences & details</p>
              </div>
            </div>
          </div>

          {/* Step tabs */}
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

          {/* Step content */}
          <div className="p-5 space-y-3.5 min-h-[320px]">
            {error && (
              <div className="p-2.5 rounded-lg text-[11px] font-medium" style={{ background: 'rgba(239,68,68,0.08)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>
                {error}
              </div>
            )}

            {step === 1 && <div className="space-y-3.5 animate-in">
              <div className="grid grid-cols-2 gap-3">
                <div><Lbl>First Name *</Lbl><input className="input" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Sarah" /></div>
                <div><Lbl>Last Name *</Lbl><input className="input" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Chen" /></div>
              </div>
              <div><Lbl>Email</Lbl><input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="sarah@email.com" /></div>
              <div><Lbl>Phone</Lbl><input className="input" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(727) 555-0142" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Lbl>Contact Pref</Lbl><select className="select" value={preferredContact} onChange={(e) => setPreferredContact(e.target.value as ContactMethod)}>
                  <option value="any">Any</option><option value="email">Email</option><option value="phone">Phone</option><option value="text">Text</option>
                </select></div>
                <div><Lbl>Source</Lbl><input className="input" value={source} onChange={(e) => setSource(e.target.value)} placeholder="Referral, Website..." /></div>
              </div>
            </div>}

            {step === 2 && <div className="space-y-3.5 animate-in">
              <div><Lbl>Client Type</Lbl>
                <div className="grid grid-cols-4 gap-2 mt-1.5">
                  {(['rental', 'buyer', 'seller', 'investor'] as ClientType[]).map((t) => (
                    <button key={t} onClick={() => setClientType(t)}
                      className={cn('p-2.5 rounded-lg border text-[12px] font-medium capitalize text-center transition-all',
                        clientType === t ? 'border-[var(--accent)] bg-[var(--accent-muted)]' : 'hover:border-[var(--border-strong)]')}
                      style={{ borderColor: clientType === t ? 'var(--accent)' : 'var(--border)', color: clientType === t ? 'var(--accent-text)' : 'var(--text-secondary)' }}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div><Lbl>Status</Lbl>
                <div className="grid grid-cols-4 gap-2 mt-1.5">
                  {(['active', 'lead', 'inactive', 'past_client'] as ClientStatus[]).map((s) => (
                    <button key={s} onClick={() => setStatus(s)}
                      className={cn('p-2.5 rounded-lg border text-[12px] font-medium capitalize text-center transition-all',
                        status === s ? 'border-[var(--accent)] bg-[var(--accent-muted)]' : 'hover:border-[var(--border-strong)]')}
                      style={{ borderColor: status === s ? 'var(--accent)' : 'var(--border)', color: status === s ? 'var(--accent-text)' : 'var(--text-secondary)' }}>
                      {s.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>
              <div><Lbl>Lifecycle Stage</Lbl>
                <select className="select" value={lifecycleStage} onChange={(e) => setLifecycleStage(e.target.value as LifecycleStage)}>
                  {Object.entries(LIFECYCLE_LABELS).map(([val, label]) => <option key={val} value={val}>{label}</option>)}
                </select>
              </div>
              <div><Lbl>Property Types</Lbl>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {(Object.entries(PROPERTY_TYPE_LABELS) as [PropertyType, string][]).map(([k, v]) => (
                    <button key={k} onClick={() => togglePType(k)}
                      className={cn('px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-all',
                        currentPTypes.includes(k) ? 'border-[var(--accent)] bg-[var(--accent-muted)]' : '')}
                      style={{ borderColor: currentPTypes.includes(k) ? 'var(--accent)' : 'var(--border)', color: currentPTypes.includes(k) ? 'var(--accent-text)' : 'var(--text-tertiary)' }}>
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            </div>}

            {step === 3 && <div className="space-y-3.5 animate-in">
              {isR && <>
                <div className="grid grid-cols-2 gap-3">
                  <div><Lbl>Budget Min /mo</Lbl><input className="input" type="number" value={rBudgetMin || ''} onChange={(e) => setRBudgetMin(+e.target.value)} placeholder="1800" /></div>
                  <div><Lbl>Budget Max /mo</Lbl><input className="input" type="number" value={rBudgetMax || ''} onChange={(e) => setRBudgetMax(+e.target.value)} placeholder="2500" /></div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div><Lbl>Beds</Lbl><input className="input" type="number" value={rBedrooms || ''} onChange={(e) => setRBedrooms(+e.target.value)} placeholder="3" /></div>
                  <div><Lbl>Baths</Lbl><input className="input" type="number" value={rBathrooms || ''} onChange={(e) => setRBathrooms(+e.target.value)} placeholder="2" /></div>
                  <div><Lbl>Min SqFt</Lbl><input className="input" type="number" value={rSqftMin || ''} onChange={(e) => setRSqftMin(+e.target.value)} placeholder="1400" /></div>
                </div>
                <div>
                  <Lbl>Cities</Lbl>
                  <div className="flex flex-wrap gap-1.5 mt-1.5 max-h-[140px] overflow-y-auto p-1">
                    {CITIES.map((city) => (
                      <button key={city} onClick={() => toggleCity(city)}
                        className={cn('px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-all',
                          currentAreas.includes(city) ? 'border-[var(--accent)] bg-[var(--accent-muted)]' : '')}
                        style={{ borderColor: currentAreas.includes(city) ? 'var(--accent)' : 'var(--border)', color: currentAreas.includes(city) ? 'var(--accent-text)' : 'var(--text-tertiary)' }}>
                        {city}
                      </button>
                    ))}
                  </div>
                </div>
                <div><Lbl>Must-Have Amenities</Lbl>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {(Object.entries(AMENITY_LABELS) as [Amenity, string][]).map(([k, v]) => (
                      <button key={k} onClick={() => toggleAmenity(k)}
                        className={cn('px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-all',
                          currentAmenities.includes(k) ? 'border-[var(--accent)] bg-[var(--accent-muted)]' : '')}
                        style={{ borderColor: currentAmenities.includes(k) ? 'var(--accent)' : 'var(--border)', color: currentAmenities.includes(k) ? 'var(--accent-text)' : 'var(--text-tertiary)' }}>
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Lbl>Pets</Lbl><input className="input" value={rPets} onChange={(e) => setRPets(e.target.value)} placeholder="2 labs, cat..." /></div>
                  <div><Lbl>Move-in Timeline</Lbl><input className="input" value={rMoveIn} onChange={(e) => setRMoveIn(e.target.value)} placeholder="ASAP, 30 days..." /></div>
                </div>
                <div><Lbl>Lease Expiration</Lbl><input className="input" type="date" value={rLeaseExp} onChange={(e) => setRLeaseExp(e.target.value)} /></div>
              </>}
              {isB && <>
                <div className="grid grid-cols-2 gap-3">
                  <div><Lbl>Budget Min</Lbl><input className="input" type="number" value={bBudgetMin || ''} onChange={(e) => setBBudgetMin(+e.target.value)} placeholder="250000" /></div>
                  <div><Lbl>Budget Max</Lbl><input className="input" type="number" value={bBudgetMax || ''} onChange={(e) => setBBudgetMax(+e.target.value)} placeholder="450000" /></div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div><Lbl>Beds</Lbl><input className="input" type="number" value={bBedrooms || ''} onChange={(e) => setBBedrooms(+e.target.value)} placeholder="3" /></div>
                  <div><Lbl>Baths</Lbl><input className="input" type="number" value={bBathrooms || ''} onChange={(e) => setBBathrooms(+e.target.value)} placeholder="2" /></div>
                  <div><Lbl>Min SqFt</Lbl><input className="input" type="number" value={bSqftMin || ''} onChange={(e) => setBSqftMin(+e.target.value)} placeholder="1400" /></div>
                </div>
                <div>
                  <Lbl>Cities</Lbl>
                  <div className="flex flex-wrap gap-1.5 mt-1.5 max-h-[140px] overflow-y-auto p-1">
                    {CITIES.map((city) => (
                      <button key={city} onClick={() => toggleCity(city)}
                        className={cn('px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-all',
                          currentAreas.includes(city) ? 'border-[var(--accent)] bg-[var(--accent-muted)]' : '')}
                        style={{ borderColor: currentAreas.includes(city) ? 'var(--accent)' : 'var(--border)', color: currentAreas.includes(city) ? 'var(--accent-text)' : 'var(--text-tertiary)' }}>
                        {city}
                      </button>
                    ))}
                  </div>
                </div>
                <div><Lbl>Must-Have Features</Lbl>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {(Object.entries(AMENITY_LABELS) as [Amenity, string][]).map(([k, v]) => (
                      <button key={k} onClick={() => toggleAmenity(k)}
                        className={cn('px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-all',
                          currentAmenities.includes(k) ? 'border-[var(--accent)] bg-[var(--accent-muted)]' : '')}
                        style={{ borderColor: currentAmenities.includes(k) ? 'var(--accent)' : 'var(--border)', color: currentAmenities.includes(k) ? 'var(--accent-text)' : 'var(--text-tertiary)' }}>
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Lbl>Pre-Approved?</Lbl><select className="select" value={bPreApproved ? 'true' : 'false'} onChange={(e) => setBPreApproved(e.target.value === 'true')}><option value="false">No</option><option value="true">Yes</option></select></div>
                  <div><Lbl>Pre-Approval Amt</Lbl><input className="input" type="number" value={bPreApprovalAmt || ''} onChange={(e) => setBPreApprovalAmt(+e.target.value)} placeholder="500000" /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Lbl>Down Payment</Lbl><input className="input" value={bDownPayment} onChange={(e) => setBDownPayment(e.target.value)} placeholder="20%, $50k..." /></div>
                  <div><Lbl>Timeline</Lbl><input className="input" value={bTimeline} onChange={(e) => setBTimeline(e.target.value)} placeholder="3 months, ASAP..." /></div>
                </div>
              </>}
              {!isR && !isB && (
                <p className="text-[12px] text-center py-8" style={{ color: 'var(--text-tertiary)' }}>
                  Preferences are available for Rental and Buyer/Investor clients. Change the client type in the Type tab.
                </p>
              )}
            </div>}

            {step === 4 && <div className="space-y-3.5 animate-in">
              <div><Lbl>Notes</Lbl><textarea className="input" rows={5} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Additional details, special requests..." /></div>
              <div className="p-3 rounded-lg text-[11px] space-y-1.5" style={{ background: 'var(--bg-1)', border: '1px solid var(--border)' }}>
                <p style={{ color: 'var(--text-tertiary)' }}><strong style={{ color: 'var(--text-secondary)' }}>Assigned Agent:</strong> {client.assignedAgent}</p>
                <p style={{ color: 'var(--text-tertiary)' }}><strong style={{ color: 'var(--text-secondary)' }}>Created:</strong> {new Date(client.createdAt).toLocaleDateString()}</p>
                <p style={{ color: 'var(--text-tertiary)' }}><strong style={{ color: 'var(--text-secondary)' }}>Last Contact:</strong> {new Date(client.lastContact).toLocaleDateString()}</p>
              </div>
            </div>}
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t flex items-center justify-between" style={{ borderColor: 'var(--border)', background: 'var(--bg-1)' }}>
            <button onClick={onClose} className="btn btn-ghost" disabled={saving}>Cancel</button>
            <div className="flex gap-2">
              {step > 1 && <button onClick={() => setStep(step - 1)} className="btn btn-secondary">Back</button>}
              {step < 4 && <button onClick={() => setStep(step + 1)} className="btn btn-secondary">Next</button>}
              <button onClick={handleSave} disabled={saving} className="btn btn-primary">
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

const Lbl = ({ children }: { children: React.ReactNode }) => (
  <label className="text-[11px] font-semibold block mb-1" style={{ color: 'var(--text-tertiary)' }}>{children}</label>
);
