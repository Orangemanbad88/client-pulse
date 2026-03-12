import { NextRequest, NextResponse } from 'next/server';
import { getClients, getClientPreferences, bulkInsertMatches, insertPendingAlerts } from '@/services';
import { matchListings } from '@/lib/matching';
import type { PropertyMatch, PropertyType } from '@/types/client';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  try {
    // Fetch all listings once — reuse for every client
    const baseUrl = request.nextUrl.origin;
    const listingsRes = await fetch(`${baseUrl}/api/listings`);
    if (!listingsRes.ok) {
      return NextResponse.json(
        { success: false, error: 'Failed to fetch listings' },
        { status: 502 },
      );
    }
    const listings = await listingsRes.json();
    if (!Array.isArray(listings) || listings.length === 0) {
      return NextResponse.json({
        success: true,
        clientsEvaluated: 0,
        matchesGenerated: 0,
        message: 'No listings available',
      });
    }

    // Fetch all clients
    const clients = await getClients();

    // Fetch preferences for all clients in parallel
    const prefsResults = await Promise.all(
      clients.map((c) => getClientPreferences(c.id)),
    );

    let clientsEvaluated = 0;
    let matchesGenerated = 0;
    let alertsCreated = 0;

    // Process each client that has valid preferences
    const insertPromises: Promise<unknown>[] = [];
    const alertInsertPromises: Promise<number>[] = [];

    for (let i = 0; i < clients.length; i++) {
      const client = clients[i];
      const preferences = prefsResults[i];

      // Skip clients with no preferences
      if (!preferences || (!preferences.rental && !preferences.buyer)) {
        continue;
      }

      // Run matching
      const matchResults = matchListings(listings, preferences);
      if (matchResults.length === 0) {
        // Clear stale matches for this client (e.g. type switched from rental→buyer)
        insertPromises.push(bulkInsertMatches(client.id, []));
        clientsEvaluated++;
        continue;
      }

      // Build PropertyMatch records
      const clientName = `${client.firstName} ${client.lastName}`;
      const matchRecords: Omit<PropertyMatch, 'id' | 'foundAt'>[] = matchResults.map((m) => ({
        clientId: client.id,
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

      insertPromises.push(bulkInsertMatches(client.id, matchRecords));

      // Queue pending alerts for this client's new matches
      const alertRows = matchRecords.map((m) => ({
        clientId: client.id,
        propertyId: m.listingId,
        propertyType: (client.clientType === 'buyer' || client.clientType === 'investor' ? 'listing' : 'rental') as 'listing' | 'rental',
      }));
      alertInsertPromises.push(insertPendingAlerts(alertRows));

      clientsEvaluated++;
      matchesGenerated += matchRecords.length;
    }

    // Wait for all inserts to complete
    await Promise.all(insertPromises);
    const alertCounts = await Promise.all(alertInsertPromises);
    alertsCreated = alertCounts.reduce((sum, c) => sum + c, 0);

    return NextResponse.json({
      success: true,
      clientsEvaluated,
      matchesGenerated,
      alertsCreated,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Regeneration failed';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
