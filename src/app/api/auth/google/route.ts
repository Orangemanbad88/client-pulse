import { NextRequest, NextResponse } from 'next/server';
import { getAuthUrl } from '@/lib/google-calendar';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const url = getAuthUrl();
    return NextResponse.redirect(url);
  } catch (err) {
    console.error('Google auth error:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to generate auth URL' },
      { status: 500 },
    );
  }
}
