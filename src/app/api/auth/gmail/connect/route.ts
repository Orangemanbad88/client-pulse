import { NextResponse } from 'next/server';
import { getGmailAuthUrl } from '@/lib/gmail';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const url = getGmailAuthUrl();
    return NextResponse.json({ success: true, url });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to generate Gmail auth URL';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
