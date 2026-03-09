import { NextRequest, NextResponse } from 'next/server';
import { getGmailTokensFromCode } from '@/lib/gmail';
import { upsertEmailAccount } from '@/services';

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');

  if (!code) {
    return NextResponse.redirect(new URL('/settings?gmail=error&reason=no_code', request.url));
  }

  try {
    const { accessToken, refreshToken, expiresAt, email } = await getGmailTokensFromCode(code);

    await upsertEmailAccount({
      provider: 'gmail',
      email,
      accessToken,
      refreshToken,
      tokenExpiresAt: expiresAt,
      isPrimary: true,
    });

    return NextResponse.redirect(new URL('/settings?gmail=connected', request.url));
  } catch (err) {
    console.error('Gmail callback error:', err);
    return NextResponse.redirect(new URL('/settings?gmail=error', request.url));
  }
}
