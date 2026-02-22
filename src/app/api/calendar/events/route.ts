import { NextRequest, NextResponse } from 'next/server';
import { getCalendarEvents } from '@/lib/google-calendar';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const accessToken = request.cookies.get('google_access_token')?.value;
  const refreshToken = request.cookies.get('google_refresh_token')?.value;

  if (!accessToken || !refreshToken) {
    return NextResponse.json(
      { success: false, error: 'Not connected to Google Calendar' },
      { status: 401 },
    );
  }

  try {
    const timeMin = request.nextUrl.searchParams.get('timeMin') || undefined;
    const timeMax = request.nextUrl.searchParams.get('timeMax') || undefined;

    const events = await getCalendarEvents(accessToken, refreshToken, timeMin, timeMax);

    return NextResponse.json({ success: true, data: events });
  } catch (err) {
    console.error('Calendar events fetch error:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch calendar events' },
      { status: 500 },
    );
  }
}
