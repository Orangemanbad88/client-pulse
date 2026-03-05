import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const MCCANN_CATALOG_URL = 'https://mccannrealtors.vercel.app/api/search-catalog';

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

function normalizePropertyType(raw: string): string {
  const lower = raw.toLowerCase();
  if (lower.includes('condo')) return 'Condo';
  if (lower.includes('townhouse') || lower.includes('town house')) return 'Townhouse';
  if (lower.includes('duplex')) return 'Duplex';
  if (lower.includes('apartment')) return 'Apartment';
  return 'Single Family';
}

export async function GET() {
  try {
    const res = await fetch(MCCANN_CATALOG_URL, {
      next: { revalidate: 300 },
    });

    if (!res.ok) {
      console.error('McCann catalog API error:', res.status, res.statusText);
      return NextResponse.json([], { status: 502 });
    }

    const properties: McCannProperty[] = await res.json();

    const listings = properties.map((p) => {
      const d = p.PropertyDetails;

      // Get the best available rate
      const weeklyRate = p.RateInfo?.[0]
        ? parseFloat(p.RateInfo[0].Rate)
        : p.Availability?.[0]
          ? parseFloat(p.Availability[0].AverageRate)
          : 0;

      const availableSlots = (p.Availability || []).filter(
        (a) => a.Status === 'Available',
      ).length;

      const address = d.Unit ? `${d.Street} ${d.Unit}` : d.Street;

      return {
        id: p.PropertyID,
        referenceId: p.ReferenceID,
        address,
        city: d.City || 'Sea Isle City',
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
        description: d.Description || d.Headline || '',
        lat: parseFloat(d.Coordinates?.Latitude) || 0,
        lng: parseFloat(d.Coordinates?.Longitude) || 0,
        photos: (d.Photos || []).map((ph) => ph.URL),
        pricePerSqft: 0,
        similarityScore: 0,
      };
    });

    // Deduplicate by address
    const seen = new Map<string, (typeof listings)[0]>();
    for (const listing of listings) {
      if (!seen.has(listing.address)) {
        seen.set(listing.address, listing);
      }
    }

    return NextResponse.json(Array.from(seen.values()));
  } catch (error) {
    console.error('Failed to fetch McCann listings:', error);
    return NextResponse.json([], { status: 502 });
  }
}
