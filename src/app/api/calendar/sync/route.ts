import { NextRequest, NextResponse } from 'next/server';
import { createCalendarEvent } from '@/lib/google-calendar';
import { getClients } from '@/services/mock-service';

export async function POST(request: NextRequest) {
  const accessToken = request.cookies.get('google_access_token')?.value;
  const refreshToken = request.cookies.get('google_refresh_token')?.value;

  if (!accessToken || !refreshToken) {
    return NextResponse.json(
      { success: false, error: 'Google Calendar not connected. Please connect first.' },
      { status: 401 },
    );
  }

  try {
    const clients = await getClients();
    const results: { clientName: string; event: string; status: string }[] = [];

    for (const client of clients) {
      const clientName = `${client.firstName} ${client.lastName}`;

      // Sync lease expiration if the client has rental preferences with a lease date
      if (client.lifecycleStage === 'renewal_window' || client.lifecycleStage === 'active_client') {
        try {
          const leaseDate = new Date();
          leaseDate.setDate(leaseDate.getDate() + 30);
          const leaseEnd = new Date(leaseDate);
          leaseEnd.setHours(leaseEnd.getHours() + 1);

          await createCalendarEvent(accessToken, refreshToken, {
            summary: `Lease Expiration — ${clientName}`,
            description: `Lease expiration reminder for ${clientName}. Follow up about renewal or new property search.`,
            startDateTime: leaseDate.toISOString(),
            endDateTime: leaseEnd.toISOString(),
          });

          results.push({ clientName, event: 'lease_expiration', status: 'created' });
        } catch (err) {
          console.error(`Failed to create lease event for ${clientName}:`, err);
          results.push({ clientName, event: 'lease_expiration', status: 'failed' });
        }
      }

      // Sync follow-up date
      if (client.status === 'active') {
        try {
          const followUpDate = new Date();
          followUpDate.setDate(followUpDate.getDate() + 7);
          const followUpEnd = new Date(followUpDate);
          followUpEnd.setMinutes(followUpEnd.getMinutes() + 30);

          await createCalendarEvent(accessToken, refreshToken, {
            summary: `Follow-up — ${clientName}`,
            description: `Scheduled follow-up with ${clientName}. Check in on property search progress.`,
            startDateTime: followUpDate.toISOString(),
            endDateTime: followUpEnd.toISOString(),
          });

          results.push({ clientName, event: 'follow_up', status: 'created' });
        } catch (err) {
          console.error(`Failed to create follow-up event for ${clientName}:`, err);
          results.push({ clientName, event: 'follow_up', status: 'failed' });
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: { synced: results.filter((r) => r.status === 'created').length, results },
    });
  } catch (err) {
    console.error('Calendar sync error:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to sync calendar events' },
      { status: 500 },
    );
  }
}
