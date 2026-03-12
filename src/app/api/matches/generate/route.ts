import { NextRequest, NextResponse } from 'next/server';
import { getClient, getClientPreferences, bulkInsertMatches } from '@/services';
import { matchListings } from '@/lib/matching';
import type { PropertyMatch, PropertyType } from '@/types/client';

export async function POST(request: NextRequest) {
  try {
    const { clientId } = await request.json();
    if (!clientId) {
      return NextResponse.json({ success: false, error: 'clientId is required' }, { status: 400 });
    }

    const [client, preferences] = await Promise.all([
      getClient(clientId),
      getClientPreferences(clientId),
    ]);

    if (!client) {
      return NextResponse.json({ success: false, error: 'Client not found' }, { status: 404 });
    }

    if (!preferences || (!preferences.rental && !preferences.buyer)) {
      return NextResponse.json({ success: false, error: 'Client has no preferences set' }, { status: 400 });
    }

    // Fetch listings from internal API
    const baseUrl = request.nextUrl.origin;
    const listingsRes = await fetch(`${baseUrl}/api/listings`);
    if (!listingsRes.ok) {
      return NextResponse.json({ success: false, error: 'Failed to fetch listings' }, { status: 502 });
    }
    const listings = await listingsRes.json();
    if (!Array.isArray(listings)) {
      return NextResponse.json({ success: false, error: 'Invalid listings data' }, { status: 502 });
    }

    // Run matching algorithm
    const matchResults = matchListings(listings, preferences);

    if (matchResults.length === 0) {
      // Clear old matches even when no new ones found (e.g. client type switched)
      await bulkInsertMatches(clientId, []);
      return NextResponse.json({ success: true, data: [], message: 'No matches found above threshold' });
    }

    // Build PropertyMatch records
    const clientName = `${client.firstName} ${client.lastName}`;
    const matchRecords: Omit<PropertyMatch, 'id' | 'foundAt'>[] = matchResults.map((m) => ({
      clientId,
      clientName,
      listingId: m.listingId,
      address: m.address,
      city: m.city,
      price: m.price,
      bedrooms: m.bedrooms,
      bathrooms: m.bathrooms,
      sqft: m.sqft,
      propertyType: m.propertyType as PropertyType,
      matchScore: m.matchScore,
      matchReasons: m.matchReasons,
      status: 'new' as const,
      photoUrl: m.photoUrl,
    }));

    const inserted = await bulkInsertMatches(clientId, matchRecords);
    return NextResponse.json({ success: true, data: inserted });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Match generation failed';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
