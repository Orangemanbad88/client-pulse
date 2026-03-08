import { NextResponse } from 'next/server';
import {
  getAppSetting,
  getPendingAlertsByClient,
  getClient,
  getClientMatches,
  markAlertsSent,
  markAlertsFailed,
  createActivity,
} from '@/services';
import { sendEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET() {
  try {
    // Check global toggle
    const autoEnabled = await getAppSetting('autoAlertsEnabled');
    if (autoEnabled === 'false') {
      return NextResponse.json({
        success: true,
        skipped: true,
        reason: 'Auto-alerts disabled globally',
      });
    }

    const pendingMap = await getPendingAlertsByClient();
    if (pendingMap.size === 0) {
      return NextResponse.json({
        success: true,
        clientsNotified: 0,
        alertsSent: 0,
        alertsFailed: 0,
      });
    }

    let clientsNotified = 0;
    let alertsSent = 0;
    let alertsFailed = 0;

    for (const [clientId, alerts] of pendingMap) {
      const client = await getClient(clientId);
      if (!client || client.alertsEnabled === false || !client.email) {
        continue;
      }

      // Look up match details for property context
      const matches = await getClientMatches(clientId);
      const alertIds = alerts.map((a) => a.id);

      // Build email
      const firstName = client.firstName || 'there';
      const matchDetails = alerts
        .map((a) => {
          const match = matches.find((m) => m.listingId === a.propertyId);
          if (!match) return `- Property ${a.propertyId}`;
          return `- ${match.address}, ${match.city} — ${match.bedrooms}BR/${match.bathrooms}BA — $${match.price.toLocaleString()} (${match.matchScore}% match)`;
        })
        .join('\n');

      const isSingle = alerts.length === 1;
      const subject = isSingle
        ? 'New Property Match Available'
        : `${alerts.length} New Property Matches`;
      const body = isSingle
        ? `Hi ${firstName},\n\nA property just came on the market that matches your criteria:\n\n${matchDetails}\n\nWant to schedule a showing? Just reply to this email.\n\nBest,\nYour ClientPulse Agent`
        : `Hi ${firstName},\n\nHere's your latest match digest — ${alerts.length} properties match your criteria:\n\n${matchDetails}\n\nReply to this email to schedule showings or ask questions.\n\nBest,\nYour ClientPulse Agent`;

      try {
        await sendEmail({ to: client.email, subject, body });
        await markAlertsSent(alertIds);
        alertsSent += alertIds.length;
        clientsNotified++;

        await createActivity({
          clientId,
          type: 'email',
          title: `Auto-alert: ${alerts.length} match${alerts.length > 1 ? 'es' : ''} sent`,
          description: `Automated email sent with ${alerts.length} property match${alerts.length > 1 ? 'es' : ''}`,
          agentName: 'System',
        });
      } catch {
        await markAlertsFailed(alertIds);
        alertsFailed += alertIds.length;
      }
    }

    return NextResponse.json({
      success: true,
      clientsNotified,
      alertsSent,
      alertsFailed,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Alert processing failed';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
