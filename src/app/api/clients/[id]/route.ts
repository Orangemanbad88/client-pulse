import { NextRequest, NextResponse } from 'next/server';
import { updateClient, deleteClient, updateClientPreferences } from '@/services';

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
