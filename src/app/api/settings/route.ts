import { NextRequest, NextResponse } from 'next/server';
import { getAppSetting, setAppSetting } from '@/services';

export async function GET(request: NextRequest) {
  try {
    const key = request.nextUrl.searchParams.get('key');
    if (!key) {
      return NextResponse.json(
        { success: false, error: 'Missing key parameter' },
        { status: 400 },
      );
    }

    const value = await getAppSetting(key);
    return NextResponse.json({ success: true, value });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to read setting';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { key, value } = body as { key?: string; value?: string };

    if (!key || value === undefined || value === null) {
      return NextResponse.json(
        { success: false, error: 'Missing key or value' },
        { status: 400 },
      );
    }

    await setAppSetting(key, String(value));
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update setting';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
