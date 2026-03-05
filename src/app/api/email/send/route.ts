import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { sendEmail } from '@/lib/email';
import { createActivity } from '@/services';
import { getClients } from '@/services';

export const dynamic = 'force-dynamic';

const sendEmailSchema = z.object({
  to: z.string().email('Invalid email address'),
  subject: z.string().min(1, 'Subject is required'),
  body: z.string().min(1, 'Body is required'),
  clientId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const raw = await request.json();
    const parsed = sendEmailSchema.safeParse(raw);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0].message },
        { status: 400 },
      );
    }

    const { to, subject, body, clientId } = parsed.data;

    const data = await sendEmail({ to, subject, body });

    // Log as activity — resolve clientId if not provided
    let resolvedClientId = clientId;
    if (!resolvedClientId) {
      try {
        const clients = await getClients();
        const match = clients.find(
          (c) => c.email.toLowerCase() === to.toLowerCase(),
        );
        if (match) resolvedClientId = match.id;
      } catch {
        // Non-critical — skip activity logging if client lookup fails
      }
    }

    if (resolvedClientId) {
      try {
        await createActivity({
          clientId: resolvedClientId,
          type: 'email',
          title: `Email sent: ${subject}`,
          description: body.slice(0, 300),
          agentName: 'Tom',
        });
      } catch {
        // Non-critical — email was still sent successfully
      }
    }

    return NextResponse.json({ success: true, data });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to send email';
    console.error('Email send error:', message);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
