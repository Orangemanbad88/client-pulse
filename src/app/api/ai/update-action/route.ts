import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getAIProfile, upsertAIProfile } from '@/services';

const schema = z.object({
  clientId: z.string().min(1),
  actionId: z.string().min(1),
  completed: z.boolean(),
});

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { clientId, actionId, completed } = parsed.data;
    const profile = await getAIProfile(clientId);

    if (!profile) {
      return NextResponse.json(
        { success: false, error: 'AI profile not found' },
        { status: 404 },
      );
    }

    const updatedActions = profile.nextActions.map((a) =>
      a.id === actionId ? { ...a, completed } : a,
    );

    await upsertAIProfile(clientId, profile.summary, updatedActions);

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
