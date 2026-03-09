import { NextResponse } from 'next/server';
import { getOutlookAuthUrl } from '@/lib/outlook';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const url = getOutlookAuthUrl();
    return NextResponse.json({ success: true, url });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to generate Outlook auth URL';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
