import type { ClientPreferences } from '@/types/client';

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

// ---- Prefs shape passed into scoring ----
interface MatchPrefs {
  budgetMin: number;
  budgetMax: number;
  bedrooms: number;
  bathrooms: number;
  sqftMin: number;
  preferredAreas: string[];
  propertyTypes: string[];
}

/**
 * Hard-filter then soft-score a listing against client preferences.
 *
 * Hard filters (instant disqualify):
 *   1. City must be in preferredAreas (if any are set)
 *   2. Bathrooms must match exactly (if pref set)
 *   3. Bedrooms must be exact or +1 (never fewer than requested)
 *   4. Price must be within budgetMin–budgetMax (if budget set)
 *   5. SqFt must be >= sqftMin (if pref set and listing has sqft data)
 *
 * Soft scoring (100 pts, ranks survivors):
 *   - Budget position   30 pts  (center of range = 30, edges = 20)
 *   - Bedrooms          25 pts  (exact = 25, +1 = 12)
 *   - Bathrooms         15 pts  (exact match guaranteed by hard filter)
 *   - City              15 pts  (guaranteed by hard filter)
 *   - Property type     10 pts
 *   - SqFt bonus         5 pts  (if listing sqft >= sqftMin * 1.2)
 */
function scoreAgainstPrefs(
  listing: ListingForMatch,
  prefs: MatchPrefs,
): { score: number; reasons: string[] } {
  // ========== HARD FILTERS ==========

  // 1. City — must be in a preferred area
  if (prefs.preferredAreas.length > 0) {
    const listingCity = normalizeCity(listing.city);
    if (!prefs.preferredAreas.some((area) => normalizeCity(area) === listingCity)) {
      return { score: 0, reasons: [] };
    }
  }

  // 2. Bathrooms — must match exactly
  if (prefs.bathrooms > 0 && listing.bathrooms !== prefs.bathrooms) {
    return { score: 0, reasons: [] };
  }

  // 3. Bedrooms — must be exact or +1, never fewer
  if (prefs.bedrooms > 0) {
    if (listing.bedrooms < prefs.bedrooms || listing.bedrooms > prefs.bedrooms + 1) {
      return { score: 0, reasons: [] };
    }
  }

  // 4. Budget — must be within min-max range
  if (prefs.budgetMax > 0) {
    if (listing.salePrice < prefs.budgetMin || listing.salePrice > prefs.budgetMax) {
      return { score: 0, reasons: [] };
    }
  }

  // 5. SqFt minimum — only enforce when listing has sqft data
  if (prefs.sqftMin > 0 && listing.sqft > 0 && listing.sqft < prefs.sqftMin) {
    return { score: 0, reasons: [] };
  }

  // ========== SOFT SCORING ==========
  let score = 0;
  const reasons: string[] = [];

  // Budget position (30 pts)
  if (prefs.budgetMax > 0) {
    const range = prefs.budgetMax - prefs.budgetMin;
    if (range > 0) {
      const mid = prefs.budgetMin + range / 2;
      const distFromMid = Math.abs(listing.salePrice - mid) / (range / 2);
      // 1.0 = at edge, 0.0 = at center
      const budgetScore = Math.round(30 - distFromMid * 10);
      score += Math.max(budgetScore, 20);
    } else {
      score += 30;
    }
    reasons.push('Within budget');
  }

  // Bedrooms (25 pts)
  if (prefs.bedrooms > 0) {
    if (listing.bedrooms === prefs.bedrooms) {
      score += 25;
      reasons.push('Exact bedroom match');
    } else {
      // +1 bedroom (already guaranteed by hard filter to be exact or +1)
      score += 12;
      reasons.push('+1 bedroom');
    }
  }

  // Bathrooms (15 pts) — exact match guaranteed
  if (prefs.bathrooms > 0) {
    score += 15;
    reasons.push('Exact bathroom match');
  }

  // City (15 pts) — match guaranteed
  if (prefs.preferredAreas.length > 0) {
    score += 15;
    reasons.push('Preferred area');
  }

  // Property type (10 pts)
  if (prefs.propertyTypes.length > 0) {
    const normalized = normalizePropertyType(listing.propertyType);
    if (prefs.propertyTypes.includes(normalized)) {
      score += 10;
      reasons.push('Preferred type');
    }
  }

  // SqFt bonus (5 pts) — 20%+ above minimum
  if (prefs.sqftMin > 0 && listing.sqft >= prefs.sqftMin * 1.2) {
    score += 5;
    reasons.push('Spacious');
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

      // Guard: need at least city or budget to produce meaningful matches
      if (rp.preferredAreas.length === 0 && rp.budgetMax <= 0) continue;

      // Filter by selected weeks — skip rentals not available during any chosen week
      const selectedDates = parseSelectedWeekDates(rp.leaseTermPref);
      if (selectedDates.length > 0) {
        if (!listing.availableCheckIns || listing.availableCheckIns.length === 0) continue;
        const checkInKeys = listing.availableCheckIns.map(toDateKey).filter(Boolean);
        const hasAvailability = selectedDates.some((sd) => checkInKeys.includes(sd));
        if (!hasAvailability) continue;
      }

      best = scoreAgainstPrefs(listing, {
        budgetMin: rp.budgetMin,
        budgetMax: rp.budgetMax,
        bedrooms: rp.bedrooms,
        bathrooms: rp.bathrooms,
        sqftMin: rp.sqftMin,
        preferredAreas: rp.preferredAreas,
        propertyTypes: rp.propertyTypes,
      });
    }

    // Score against buyer preferences for sale listings
    if (listing.listingType === 'for_sale' && preferences.buyer) {
      const bp = preferences.buyer;

      // Guard: need at least city or budget to produce meaningful matches
      if (bp.preferredAreas.length === 0 && bp.budgetMax <= 0) continue;

      best = scoreAgainstPrefs(listing, {
        budgetMin: bp.budgetMin,
        budgetMax: bp.budgetMax,
        bedrooms: bp.bedrooms,
        bathrooms: bp.bathrooms,
        sqftMin: bp.sqftMin,
        preferredAreas: bp.preferredAreas,
        propertyTypes: bp.propertyTypes,
      });
    }

    // Minimum 50 to qualify — with hard filters in place, anything that
    // survives and scores 50+ is a genuinely relevant match
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
