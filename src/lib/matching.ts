import type { RentalPreferences, BuyerPreferences, ClientPreferences } from '@/types/client';

interface ListingForMatch {
  id: string;
  address: string;
  city: string;
  state: string;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  propertyType: string;
  salePrice: number;
  listingType: 'rental' | 'for_sale';
  photos: string[];
  availableCheckIns?: string[];
}

export interface MatchResult {
  listingId: string;
  address: string;
  city: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  propertyType: string;
  matchScore: number;
  matchReasons: string[];
  photoUrl: string;
}

const normalizeCity = (s: string) => s.toLowerCase().trim();

/** Parse selected week labels (e.g. "Jun 7 – Jun 13") into normalized YYYY-MM-DD start dates */
function parseSelectedWeekDates(leaseTermPref: string): string[] {
  if (!leaseTermPref) return [];
  const now = new Date();
  const year = now.getMonth() >= 9 ? now.getFullYear() + 1 : now.getFullYear();
  return leaseTermPref.split(', ').filter(Boolean).map((w) => {
    const startStr = w.split(' – ')[0];
    if (!startStr) return '';
    const d = new Date(`${startStr}, ${year}`);
    if (isNaN(d.getTime())) return '';
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }).filter(Boolean);
}

/** Normalize a date string (various formats) to YYYY-MM-DD */
function toDateKey(raw: string): string {
  const d = new Date(raw);
  if (isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const normalizePropertyType = (raw: string): string => {
  const lower = raw.toLowerCase();
  if (lower.includes('condo')) return 'condo';
  if (lower.includes('townhouse') || lower.includes('townhome')) return 'townhouse';
  if (lower.includes('duplex')) return 'duplex';
  if (lower.includes('apartment')) return 'apartment';
  if (lower.includes('single') || lower.includes('house') || lower.includes('cottage')) return 'single_family';
  return lower;
};

function scoreAgainstPrefs(
  listing: ListingForMatch,
  prefs: { budgetMin: number; budgetMax: number; bedrooms: number; bathrooms: number; preferredAreas: string[]; propertyTypes: string[] },
): { score: number; reasons: string[] } {
  // ---- Hard filters: disqualify immediately if these fail ----

  // Must be in a preferred city
  if (prefs.preferredAreas.length > 0) {
    const listingCity = normalizeCity(listing.city);
    if (!prefs.preferredAreas.some((area) => normalizeCity(area) === listingCity)) {
      return { score: 0, reasons: [] };
    }
  }

  // Must match exact bathroom count
  if (prefs.bathrooms > 0 && listing.bathrooms !== prefs.bathrooms) {
    return { score: 0, reasons: [] };
  }

  // Must be within budget range (no under, no over)
  if (prefs.budgetMax > 0) {
    if (listing.salePrice < prefs.budgetMin || listing.salePrice > prefs.budgetMax) {
      return { score: 0, reasons: [] };
    }
  }

  // ---- Soft scoring for remaining criteria ----
  let score = 0;
  const reasons: string[] = [];

  // Budget (40 pts) — already guaranteed within range by hard filter
  if (prefs.budgetMax > 0) {
    score += 40;
    reasons.push('Within budget');
  }

  // Location (20 pts) — already guaranteed match by hard filter
  if (prefs.preferredAreas.length > 0) {
    score += 20;
    reasons.push('Preferred area');
  }

  // Bathrooms (10 pts) — already guaranteed exact match by hard filter
  if (prefs.bathrooms > 0) {
    score += 10;
    reasons.push('Exact bathroom match');
  }

  // Bedrooms (20 pts)
  if (prefs.bedrooms > 0) {
    if (listing.bedrooms === prefs.bedrooms) {
      score += 20;
      reasons.push('Exact bedroom match');
    } else if (Math.abs(listing.bedrooms - prefs.bedrooms) === 1) {
      score += 10;
      reasons.push('Close bedroom count');
    }
  }

  // Property type (10 pts)
  if (prefs.propertyTypes.length > 0) {
    const normalized = normalizePropertyType(listing.propertyType);
    if (prefs.propertyTypes.includes(normalized)) {
      score += 10;
      reasons.push('Preferred property type');
    }
  }

  return { score, reasons };
}

export function matchListings(
  listings: ListingForMatch[],
  preferences: ClientPreferences,
): MatchResult[] {
  const results: MatchResult[] = [];

  for (const listing of listings) {
    let best = { score: 0, reasons: [] as string[] };

    // Score against rental preferences for rental listings
    if (listing.listingType === 'rental' && preferences.rental) {
      const rp = preferences.rental;

      // Filter by selected weeks — skip rentals not available during any chosen week
      const selectedDates = parseSelectedWeekDates(rp.leaseTermPref);
      if (selectedDates.length > 0 && listing.availableCheckIns) {
        const checkInKeys = listing.availableCheckIns.map(toDateKey).filter(Boolean);
        const hasAvailability = selectedDates.some((sd) => checkInKeys.includes(sd));
        if (!hasAvailability) continue;
      }

      best = scoreAgainstPrefs(listing, {
        budgetMin: rp.budgetMin,
        budgetMax: rp.budgetMax,
        bedrooms: rp.bedrooms,
        bathrooms: rp.bathrooms,
        preferredAreas: rp.preferredAreas,
        propertyTypes: rp.propertyTypes,
      });
    }

    // Score against buyer preferences for sale listings
    if (listing.listingType === 'for_sale' && preferences.buyer) {
      const bp = preferences.buyer;
      best = scoreAgainstPrefs(listing, {
        budgetMin: bp.budgetMin,
        budgetMax: bp.budgetMax,
        bedrooms: bp.bedrooms,
        bathrooms: bp.bathrooms,
        preferredAreas: bp.preferredAreas,
        propertyTypes: bp.propertyTypes,
      });
    }

    if (best.score >= 50) {
      results.push({
        listingId: listing.id,
        address: listing.address,
        city: listing.city,
        price: listing.salePrice,
        bedrooms: listing.bedrooms,
        bathrooms: listing.bathrooms,
        sqft: listing.sqft,
        propertyType: listing.propertyType,
        matchScore: Math.min(best.score, 100),
        matchReasons: best.reasons,
        photoUrl: listing.photos[0] || '',
      });
    }
  }

  return results
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 10);
}
