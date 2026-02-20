import { NextRequest, NextResponse } from 'next/server';
import { getTokensFromCode } from '@/lib/google-calendar';

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');

  if (!code) {
    return NextResponse.json(
      { success: false, error: 'Missing authorization code' },
      { status: 400 },
    );
  }

  try {
    const tokens = await getTokensFromCode(code);

    const response = NextResponse.redirect(new URL('/calendar?connected=true', request.url));

    if (tokens.access_token) {
      response.cookies.set('google_access_token', tokens.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 3600,
        path: '/',
      });
    }

    if (tokens.refresh_token) {
      response.cookies.set('google_refresh_token', tokens.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30,
        path: '/',
      });
    }

    return response;
  } catch (err) {
    console.error('Google callback error:', err);
    return NextResponse.redirect(new URL('/calendar?error=auth_failed', request.url));
  }
}
