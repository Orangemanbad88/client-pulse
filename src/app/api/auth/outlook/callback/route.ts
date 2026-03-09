import { NextRequest, NextResponse } from 'next/server';
import { getOutlookTokensFromCode } from '@/lib/outlook';
import { upsertEmailAccount } from '@/services';

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');

  if (!code) {
    return NextResponse.redirect(new URL('/settings?outlook=error&reason=no_code', request.url));
  }

  try {
    const { accessToken, refreshToken, expiresAt, email } = await getOutlookTokensFromCode(code);

    await upsertEmailAccount({
      provider: 'outlook',
      email,
      accessToken,
      refreshToken,
      tokenExpiresAt: expiresAt,
      isPrimary: true,
    });

    return NextResponse.redirect(new URL('/settings?outlook=connected', request.url));
  } catch (err) {
    console.error('Outlook callback error:', err);
    return NextResponse.redirect(new URL('/settings?outlook=error', request.url));
  }
}
