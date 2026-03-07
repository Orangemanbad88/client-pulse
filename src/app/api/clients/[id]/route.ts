import { NextRequest, NextResponse } from 'next/server';
import { updateClient, deleteClient, updateClientPreferences } from '@/services';

function hasMatchingFields(prefs: Record<string, unknown> | null | undefined): boolean {
  if (!prefs) return false;
  const areas = prefs.preferredAreas as string[] | undefined;
  const beds = prefs.bedrooms as number | undefined;
  const baths = prefs.bathrooms as number | undefined;
  return !!(areas && areas.length > 0 && beds && beds > 0 && baths && baths > 0);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { preferences, ...clientFields } = body;
    const updated = await updateClient(id, clientFields);

    let prefsUpdated = false;
    if (preferences) {
      await updateClientPreferences(id, preferences.rental, preferences.buyer);
      prefsUpdated = true;

      // Only fire matching if city + beds + baths are filled
      const canMatch = hasMatchingFields(preferences.rental) || hasMatchingFields(preferences.buyer);
      if (canMatch) {
        const origin = request.nextUrl.origin;
        fetch(`${origin}/api/matches/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ clientId: id }),
        }).catch(() => {
          // matching failure is non-critical
        });
      }
    }

    return NextResponse.json({ success: true, data: updated, prefsUpdated });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update client';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    await deleteClient(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete client';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
