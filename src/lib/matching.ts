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
  let score = 0;
  const reasons: string[] = [];

  // Budget (40 pts)
  if (prefs.budgetMax > 0) {
    if (listing.salePrice >= prefs.budgetMin && listing.salePrice <= prefs.budgetMax) {
      score += 40;
      reasons.push('Within budget');
    } else if (listing.salePrice < prefs.budgetMin) {
      score += 30;
      reasons.push('Under budget');
    } else if (listing.salePrice <= prefs.budgetMax * 1.1) {
      score += 20;
      reasons.push('Slightly over budget');
    }
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

  // Location (20 pts)
  if (prefs.preferredAreas.length > 0) {
    const listingCity = normalizeCity(listing.city);
    const match = prefs.preferredAreas.some((area) => normalizeCity(area) === listingCity);
    if (match) {
      score += 20;
      reasons.push('Preferred area');
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

  // Bathrooms (10 pts)
  if (prefs.bathrooms > 0) {
    if (listing.bathrooms >= prefs.bathrooms) {
      score += 10;
      reasons.push('Meets bathroom requirement');
    } else if (listing.bathrooms === prefs.bathrooms - 1) {
      score += 5;
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
