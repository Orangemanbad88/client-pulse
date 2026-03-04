import { NextResponse } from 'next/server';
import {
  getClients,
  getAllTriggers,
  createTrigger,
} from '@/services';
import { evaluateTriggers } from '@/lib/trigger-evaluator';
import type { ClientPreferences, Activity } from '@/types/client';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const svc = await import('@/services');

    const [clients, triggers] = await Promise.all([
      getClients(),
      getAllTriggers(),
    ]);

    // Fetch preferences and activities for all clients
    const [prefsResults, activitiesResults] = await Promise.all([
      Promise.all(clients.map((c) => svc.getClientPreferences(c.id))),
      Promise.all(clients.map((c) => svc.getClientActivities(c.id))),
    ]);

    const preferences: ClientPreferences[] = prefsResults.filter(
      (p): p is ClientPreferences => p !== null,
    );
    const activities: Activity[] = activitiesResults.flat();

    const newTriggers = evaluateTriggers({
      clients,
      preferences,
      activities,
      triggers,
    });

    // Create all new triggers
    const created = await Promise.all(
      newTriggers.map((t) => createTrigger(t)),
    );

    return NextResponse.json({
      success: true,
      data: {
        evaluated: clients.length,
        created: created.length,
        triggers: created,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
