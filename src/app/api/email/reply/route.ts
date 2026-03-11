import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { replyToEmail } from '@/lib/email';
import { createActivity } from '@/services';

export const dynamic = 'force-dynamic';

const replySchema = z.object({
  provider: z.enum(['gmail', 'outlook']),
  inReplyToMessageId: z.string().min(1, 'Message ID is required'),
  messageIdHeader: z.string(),
  referencesHeader: z.string(),
  threadId: z.string().min(1, 'Thread ID is required'),
  to: z.string().email('Invalid email address'),
  subject: z.string().min(1, 'Subject is required'),
  body: z.string().min(1, 'Reply body is required'),
  clientId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const raw = await request.json();
    const parsed = replySchema.safeParse(raw);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0].message },
        { status: 400 },
      );
    }

    const { clientId, ...replyInput } = parsed.data;

    const result = await replyToEmail(replyInput);

    // Log activity if we know the client
    if (clientId) {
      try {
        await createActivity({
          clientId,
          type: 'email',
          title: `Reply sent: ${replyInput.subject}`,
          description: replyInput.body.slice(0, 300),
          agentName: 'Tom',
        });
      } catch {
        // Non-critical
      }
    }

    return NextResponse.json({ success: true, data: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to send reply';

    if (message === 'NO_ACCOUNT') {
      return NextResponse.json(
        { success: false, error: 'No email account connected.' },
        { status: 400 },
      );
    }

    if (message === 'TOKEN_EXPIRED') {
      return NextResponse.json(
        { success: false, error: 'Email session expired. Please reconnect in Settings.', needsReconnect: true },
        { status: 401 },
      );
    }

    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
