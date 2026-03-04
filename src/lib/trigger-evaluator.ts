import type {
  Client,
  ClientPreferences,
  Activity,
  Trigger,
  CreateTriggerInput,
  UrgencyLevel,
} from '@/types/client';

interface EvaluatorContext {
  clients: Client[];
  preferences: ClientPreferences[];
  activities: Activity[];
  triggers: Trigger[];
}

/**
 * Pure evaluation logic — returns new triggers to create.
 * Does NOT write to DB; caller is responsible for persisting.
 */
export const evaluateTriggers = (ctx: EvaluatorContext): CreateTriggerInput[] => {
  const now = Date.now();
  const results: CreateTriggerInput[] = [];

  // Index existing active triggers by clientId:type for deduplication
  const activeTriggerKeys = new Set(
    ctx.triggers
      .filter((t) => t.status === 'pending' || t.status === 'fired')
      .map((t) => `${t.clientId}:${t.type}`),
  );

  const isDuplicate = (clientId: string, type: string) =>
    activeTriggerKeys.has(`${clientId}:${type}`);

  const clientName = (c: Client) => `${c.firstName} ${c.lastName}`;

  // Activities indexed by clientId
  const activitiesByClient = new Map<string, Activity[]>();
  for (const a of ctx.activities) {
    const list = activitiesByClient.get(a.clientId) || [];
    list.push(a);
    activitiesByClient.set(a.clientId, list);
  }

  // Preferences indexed by clientId
  const prefsMap = new Map<string, ClientPreferences>();
  for (const p of ctx.preferences) {
    prefsMap.set(p.clientId, p);
  }

  for (const client of ctx.clients) {
    if (client.status !== 'active') continue;

    const prefs = prefsMap.get(client.id);
    const clientActivities = activitiesByClient.get(client.id) || [];
    const lastActivityTime = clientActivities.length > 0
      ? Math.max(...clientActivities.map((a) => new Date(a.timestamp).getTime()))
      : new Date(client.createdAt).getTime();

    // 1. Lease expiration check
    const leaseExp = prefs?.rental?.currentLeaseExpiration;
    if (leaseExp && !isDuplicate(client.id, 'lease_expiration')) {
      const daysUntil = Math.ceil((new Date(leaseExp).getTime() - now) / 86400000);
      let urgency: UrgencyLevel | null = null;
      let desc = '';

      if (daysUntil <= 14 && daysUntil > 0) {
        urgency = 'critical';
        desc = `Lease expires in ${daysUntil} days. Immediate action needed.`;
      } else if (daysUntil <= 30 && daysUntil > 14) {
        urgency = 'high';
        desc = `Lease expires in ${daysUntil} days. Start showing alternatives.`;
      } else if (daysUntil <= 60 && daysUntil > 30) {
        urgency = 'medium';
        desc = `Lease expires in ${daysUntil} days. Begin renewal discussion.`;
      }

      if (urgency) {
        results.push({
          clientId: client.id,
          clientName: clientName(client),
          type: 'lease_expiration',
          title: `Lease expires in ${daysUntil} days`,
          description: desc,
          fireDate: new Date().toISOString(),
          urgency,
        });
      }
    }

    // 2. New client follow-up — 24hrs+ since creation with no activity
    if (!isDuplicate(client.id, 'new_client_followup')) {
      const createdMs = new Date(client.createdAt).getTime();
      const hoursSinceCreation = (now - createdMs) / 3600000;
      const hasActivity = clientActivities.length > 0;

      if (hoursSinceCreation >= 24 && !hasActivity) {
        results.push({
          clientId: client.id,
          clientName: clientName(client),
          type: 'new_client_followup',
          title: 'New client — 24hr follow-up',
          description: `${clientName(client)} signed up ${Math.floor(hoursSinceCreation / 24)} days ago with no follow-up yet.`,
          fireDate: new Date().toISOString(),
          urgency: 'high',
        });
      }
    }

    // 3. Stale lead — 90+ days since last contact
    if (!isDuplicate(client.id, 'stale_lead')) {
      const daysSinceContact = (now - lastActivityTime) / 86400000;
      if (daysSinceContact >= 90) {
        results.push({
          clientId: client.id,
          clientName: clientName(client),
          type: 'stale_lead',
          title: 'Stale lead — re-engage',
          description: `No contact in ${Math.floor(daysSinceContact)} days. Consider re-engagement outreach.`,
          fireDate: new Date().toISOString(),
          urgency: 'low',
        });
      }
    }

    // 4. Post-showing follow-up — 24-72hrs after showing with no follow-up
    if (!isDuplicate(client.id, 'post_showing')) {
      const showings = clientActivities.filter((a) => a.type === 'showing');
      const followUps = clientActivities.filter((a) => a.type === 'follow_up');

      for (const showing of showings) {
        const showingTime = new Date(showing.timestamp).getTime();
        const hoursSince = (now - showingTime) / 3600000;

        if (hoursSince >= 24 && hoursSince <= 72) {
          // Check if there's a follow-up after this showing
          const hasFollowUp = followUps.some(
            (f) => new Date(f.timestamp).getTime() > showingTime,
          );

          if (!hasFollowUp) {
            results.push({
              clientId: client.id,
              clientName: clientName(client),
              type: 'post_showing',
              title: 'Post-showing follow-up needed',
              description: `${clientName(client)} had a showing${showing.propertyAddress ? ` at ${showing.propertyAddress}` : ''} ${Math.floor(hoursSince)} hours ago. No follow-up recorded.`,
              fireDate: new Date().toISOString(),
              urgency: 'medium',
            });
            break; // One trigger per client
          }
        }
      }
    }
  }

  return results;
};
