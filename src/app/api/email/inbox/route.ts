import { NextResponse } from 'next/server';
import { getClients } from '@/services';
import { fetchInboxMessages, groupIntoThreads, getActiveEmailProvider } from '@/lib/email';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const provider = await getActiveEmailProvider();
    if (!provider) {
      return NextResponse.json({
        success: true,
        threads: [],
        provider: null,
        message: 'No email account connected. Connect one in Settings.',
      });
    }

    const clients = await getClients();
    const clientEmails = clients
      .map((c) => c.email)
      .filter((e) => e && e.includes('@'));

    if (clientEmails.length === 0) {
      return NextResponse.json({
        success: true,
        threads: [],
        provider: provider.provider,
        message: 'No clients with email addresses found.',
      });
    }

    const clientEmailMap = new Map<string, { id: string; name: string }>();
    for (const c of clients) {
      if (c.email) {
        clientEmailMap.set(c.email.toLowerCase(), {
          id: c.id,
          name: `${c.firstName} ${c.lastName}`,
        });
      }
    }

    const messages = await fetchInboxMessages(clientEmails);
    const threads = groupIntoThreads(messages, clientEmailMap);

    return NextResponse.json({
      success: true,
      threads,
      provider: provider.provider,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch inbox';

    if (message === 'NO_ACCOUNT') {
      return NextResponse.json({
        success: true,
        threads: [],
        provider: null,
        message: 'No email account connected. Connect one in Settings.',
      });
    }

    if (message === 'TOKEN_EXPIRED') {
      return NextResponse.json({
        success: false,
        error: 'Your email session has expired. Please reconnect your account in Settings.',
        needsReconnect: true,
      }, { status: 401 });
    }

    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
