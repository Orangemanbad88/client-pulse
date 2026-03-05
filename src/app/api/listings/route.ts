import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const COMP_SEARCH_URL = process.env.COMP_SEARCH_URL || 'https://comp-search.vercel.app';

export async function GET() {
  try {
    const res = await fetch(`${COMP_SEARCH_URL}/api/listings`, {
      next: { revalidate: 300 }, // cache 5 minutes
    });

    if (!res.ok) {
      console.error('CompSearch API error:', res.status, res.statusText);
      return NextResponse.json([], { status: 502 });
    }

    const listings = await res.json();

    // Deduplicate: keep the most recent listing per address
    // For condos, also distinguish by price to preserve separate units
    const seen = new Map<string, typeof listings[0]>();
    for (const listing of listings) {
      const isCondo = /condo/i.test(listing.propertyType || '');
      const key = isCondo
        ? `${listing.address}|${listing.salePrice}`
        : listing.address;

      const existing = seen.get(key);
      if (!existing || new Date(listing.saleDate) > new Date(existing.saleDate)) {
        seen.set(key, listing);
      }
    }

    return NextResponse.json(Array.from(seen.values()));
  } catch (error) {
    console.error('Failed to fetch MLS listings:', error);
    return NextResponse.json([], { status: 502 });
  }
}
