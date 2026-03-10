import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const MCCANN_CATALOG_URL = 'https://mccannrealtors.vercel.app/api/search-catalog';
const COMP_SEARCH_URL = process.env.COMP_SEARCH_URL || 'https://comp-search.vercel.app';

interface McCannProperty {
  ReferenceID: string;
  PropertyID: string;
  PropertyDetails: {
    PropertyName: string;
    Description: string;
    Headline: string;
    PropertyType: string;
    Street: string;
    Unit: string;
    City: string;
    State: string;
    Zip: string;
    OccupancyLimit: string;
    TotalSleeps: string;
    BedRooms: string;
    Baths: string;
    Coordinates: { Latitude: string; Longitude: string };
    Photos: { ID: string; URL: string }[];
  };
  Availability: {
    CheckInDate: string;
    CheckOutDate: string;
    Status: string;
    AverageRate: string;
    MinimumRate: string;
    MaximumRate: string;
  }[];
  RateInfo: {
    Description: string;
    Rate: string;
    CheckInDate: string;
    MinimumStay: string;
    DailyRate: string;
  }[];
}

interface MLSListing {
  id: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  yearBuilt: number;
  propertyType: string;
  saleDate: string;
  salePrice: number;
  daysOnMarket: number;
  lat: number;
  lng: number;
  photos: string[];
  pricePerSqft: number;
  similarityScore: number;
}

/** Clean up city names from source data — collapse spaces, fix known variants */
function normalizeCityName(raw: string): string {
  const cleaned = raw.replace(/\s+/g, ' ').trim();
  // Fix known variants: "Sea Isle" → "Sea Isle City", "Sea Isle city" → "Sea Isle City"
  if (/^sea isle$/i.test(cleaned)) return 'Sea Isle City';
  if (/^sea isle city$/i.test(cleaned)) return 'Sea Isle City';
  return cleaned;
}

function normalizePropertyType(raw: string): string {
  const lower = raw.toLowerCase();
  if (lower.includes('condo')) return 'Condo';
  if (lower.includes('townhouse') || lower.includes('townhome') || lower.includes('town house')) return 'Townhouse';
  if (lower.includes('duplex')) return 'Duplex';
  if (lower.includes('apartment')) return 'Apartment';
  if (lower.includes('house') || lower.includes('cottage')) return 'Single Family';
  return 'Single Family';
}

async function fetchRentals() {
  try {
    const res = await fetch(MCCANN_CATALOG_URL, { next: { revalidate: 300 } });
    if (!res.ok) return [];
    const properties: McCannProperty[] = await res.json();

    return properties.map((p) => {
      const d = p.PropertyDetails;

      // Build per-week rate lookup from RateInfo (checkInDate → weekly rate)
      const ratesByCheckIn: Record<string, number> = {};
      for (const r of p.RateInfo || []) {
        if (r.CheckInDate && r.Rate) {
          ratesByCheckIn[r.CheckInDate] = parseFloat(r.Rate);
        }
      }

      // Representative price: average of available rates, fallback to first RateInfo
      const availableRates = (p.Availability || [])
        .filter((a) => a.Status === 'Available' && a.AverageRate)
        .map((a) => parseFloat(a.AverageRate));
      const weeklyRate = availableRates.length > 0
        ? Math.round(availableRates.reduce((s, r) => s + r, 0) / availableRates.length)
        : p.RateInfo?.[0] ? parseFloat(p.RateInfo[0].Rate) : 0;

      const availableSlots = (p.Availability || []).filter(
        (a) => a.Status === 'Available',
      ).length;
      const address = d.Unit ? `${d.Street} ${d.Unit}` : d.Street;

      return {
        id: `rental-${p.PropertyID}`,
        address,
        city: normalizeCityName(d.City || 'Sea Isle City'),
        state: d.State || 'NJ',
        zip: d.Zip || '',
        bedrooms: parseInt(d.BedRooms) || 0,
        bathrooms: parseInt(d.Baths) || 0,
        sleeps: parseInt(d.TotalSleeps) || 0,
        sqft: 0,
        yearBuilt: 0,
        propertyType: normalizePropertyType(d.PropertyType || ''),
        salePrice: weeklyRate,
        daysOnMarket: 0,
        availableSlots,
        availableCheckIns: (p.Availability || [])
          .filter((a) => a.Status === 'Available')
          .map((a) => a.CheckInDate),
        ratesByCheckIn,
        listingType: 'rental' as const,
        description: d.Description || d.Headline || '',
        lat: parseFloat(d.Coordinates?.Latitude) || 0,
        lng: parseFloat(d.Coordinates?.Longitude) || 0,
        photos: (d.Photos || []).map((ph) => ph.URL),
        pricePerSqft: 0,
        similarityScore: 0,
      };
    });
  } catch {
    return [];
  }
}

async function fetchForSale() {
  try {
    const res = await fetch(`${COMP_SEARCH_URL}/api/listings`, { next: { revalidate: 300 } });
    if (!res.ok) return [];
    const listings: MLSListing[] = await res.json();

    return listings.map((l) => ({
      ...l,
      sleeps: 0,
      availableSlots: 0,
      listingType: 'for_sale' as const,
      description: '',
    }));
  } catch {
    return [];
  }
}

// Public endpoint — no auth required. Serves the properties page which is publicly accessible.
export async function GET() {
  try {
    const [rentals, forSale] = await Promise.all([fetchRentals(), fetchForSale()]);

    const all = [...rentals, ...forSale];

    // Deduplicate by address within each type
    const seen = new Map<string, (typeof all)[0]>();
    for (const listing of all) {
      const key = `${listing.listingType}:${listing.address}`;
      if (!seen.has(key)) {
        seen.set(key, listing);
      }
    }

    return NextResponse.json(Array.from(seen.values()));
  } catch (error) {
    console.error('Failed to fetch listings:', error);
    return NextResponse.json([], { status: 502 });
  }
}
