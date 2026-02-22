import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST() {
  const response = NextResponse.json({ success: true });

  response.cookies.set('google_access_token', '', {
    httpOnly: true,
    maxAge: 0,
    path: '/',
  });
  response.cookies.set('google_refresh_token', '', {
    httpOnly: true,
    maxAge: 0,
    path: '/',
  });

  return response;
}
