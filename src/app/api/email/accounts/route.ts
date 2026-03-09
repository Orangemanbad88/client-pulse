import { NextRequest, NextResponse } from 'next/server';
import { getEmailAccounts, deleteEmailAccount } from '@/services';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const accounts = await getEmailAccounts();
    // Strip tokens from response — only return safe fields
    const safe = accounts.map(({ id, provider, email, isPrimary, createdAt }) => ({
      id,
      provider,
      email,
      isPrimary,
      createdAt,
    }));
    return NextResponse.json({ success: true, accounts: safe });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch email accounts';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();
    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Missing account id' },
        { status: 400 },
      );
    }

    await deleteEmailAccount(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to disconnect account';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
