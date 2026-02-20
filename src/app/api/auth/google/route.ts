import { NextResponse } from 'next/server';
import { getAuthUrl } from '@/lib/google-calendar';

export async function GET() {
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
