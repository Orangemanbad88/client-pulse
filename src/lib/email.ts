import { Resend } from 'resend';
import { getEmailAccounts, updateEmailTokens } from '@/services';
import { sendGmailEmail, refreshGmailToken, fetchGmailMessages, replyGmailEmail } from '@/lib/gmail';
import { sendOutlookEmail, refreshOutlookToken, fetchOutlookMessages, replyOutlookEmail } from '@/lib/outlook';
import type { EmailAccount, EmailMessage, EmailThread, ReplyEmailInput } from '@/types/client';

let _resend: Resend | null = null;
const getResend = () => {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY || '');
  }
  return _resend;
};

const FROM_EMAIL = process.env.NOTIFICATION_FROM_EMAIL || 'onboarding@resend.dev';

interface SendEmailInput {
  to: string;
  subject: string;
  body: string;
  replyTo?: string;
}

export interface SendEmailResult {
  provider: 'gmail' | 'outlook' | 'resend';
  messageId?: string | null;
}

const sendViaResend = async ({ to, subject, body, replyTo }: SendEmailInput): Promise<SendEmailResult> => {
  const { data, error } = await getResend().emails.send({
    from: FROM_EMAIL,
    to,
    subject,
    text: body,
    replyTo,
  });

  if (error) {
    throw new Error(error.message);
  }

  return { provider: 'resend', messageId: data?.id };
};

/**
 * Ensure the account has a valid (non-expired) access token.
 * Refreshes if needed and persists the new token.
 */
export const ensureValidToken = async (account: EmailAccount): Promise<string> => {
  if (new Date(account.tokenExpiresAt) > new Date()) {
    return account.accessToken;
  }

  if (account.provider === 'gmail') {
    const refreshed = await refreshGmailToken(account.refreshToken);
    await updateEmailTokens(account.id, refreshed.accessToken, refreshed.expiresAt);
    return refreshed.accessToken;
  }

  if (account.provider === 'outlook') {
    const refreshed = await refreshOutlookToken(account.refreshToken);
    await updateEmailTokens(account.id, refreshed.accessToken, refreshed.expiresAt);
    return refreshed.accessToken;
  }

  return account.accessToken;
};

export const sendEmail = async ({ to, subject, body, replyTo }: SendEmailInput): Promise<SendEmailResult> => {
  try {
    const accounts = await getEmailAccounts();
    const primary = accounts.find((a) => a.isPrimary) || accounts[0];

    if (primary) {
      let accessToken: string;
      try {
        accessToken = await ensureValidToken(primary);
      } catch {
        return sendViaResend({ to, subject, body, replyTo });
      }

      if (primary.provider === 'gmail') {
        const result = await sendGmailEmail({
          accessToken,
          refreshToken: primary.refreshToken,
          to,
          subject,
          body,
        });
        return { provider: 'gmail', messageId: result.messageId };
      }

      if (primary.provider === 'outlook') {
        const result = await sendOutlookEmail({
          accessToken,
          refreshToken: primary.refreshToken,
          to,
          subject,
          body,
        });
        return { provider: 'outlook', messageId: result.messageId };
      }
    }
  } catch {
    // OAuth send failed — fall back to Resend
  }

  return sendViaResend({ to, subject, body, replyTo });
};

export const getActiveEmailProvider = async (): Promise<{
  provider: 'gmail' | 'outlook' | 'resend';
  email: string;
} | null> => {
  try {
    const accounts = await getEmailAccounts();
    const primary = accounts.find((a) => a.isPrimary) || accounts[0];
    if (primary) {
      return { provider: primary.provider, email: primary.email };
    }
  } catch {
    // No connected accounts
  }
  return null;
};

// ---- Inbox Read ----

export const fetchInboxMessages = async (clientEmails: string[]): Promise<EmailMessage[]> => {
  const accounts = await getEmailAccounts();
  const primary = accounts.find((a) => a.isPrimary) || accounts[0];

  if (!primary) {
    throw new Error('NO_ACCOUNT');
  }

  let accessToken: string;
  try {
    accessToken = await ensureValidToken(primary);
  } catch {
    throw new Error('TOKEN_EXPIRED');
  }

  if (primary.provider === 'gmail') {
    return fetchGmailMessages({
      accessToken,
      refreshToken: primary.refreshToken,
      clientEmails,
    });
  }

  if (primary.provider === 'outlook') {
    return fetchOutlookMessages({
      accessToken,
      clientEmails,
    });
  }

  return [];
};

export const groupIntoThreads = (
  messages: EmailMessage[],
  clientEmailMap: Map<string, { id: string; name: string }>,
): EmailThread[] => {
  const threadMap = new Map<string, EmailMessage[]>();

  for (const msg of messages) {
    const key = msg.threadId || msg.id;
    const existing = threadMap.get(key);
    if (existing) {
      existing.push(msg);
    } else {
      threadMap.set(key, [msg]);
    }
  }

  const threads: EmailThread[] = [];

  for (const [threadId, msgs] of threadMap) {
    // Sort messages oldest → newest within thread
    msgs.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const lastMsg = msgs[msgs.length - 1];
    const allParticipants = new Map<string, { name: string; email: string }>();
    let clientId: string | undefined;
    let clientName: string | undefined;

    for (const msg of msgs) {
      // Track all participants
      allParticipants.set(msg.from.email, msg.from);
      for (const to of msg.to) {
        allParticipants.set(to.email, to);
      }

      // Resolve client association
      if (!clientId) {
        const fromClient = clientEmailMap.get(msg.from.email.toLowerCase());
        if (fromClient) {
          clientId = fromClient.id;
          clientName = fromClient.name;
        } else {
          for (const to of msg.to) {
            const toClient = clientEmailMap.get(to.email.toLowerCase());
            if (toClient) {
              clientId = toClient.id;
              clientName = toClient.name;
              break;
            }
          }
        }
      }
    }

    threads.push({
      id: threadId,
      subject: msgs[0].subject || '(no subject)',
      participants: Array.from(allParticipants.values()),
      messages: msgs,
      lastMessageDate: lastMsg.date,
      snippet: lastMsg.snippet || lastMsg.bodyText.slice(0, 120),
      isRead: msgs.every((m) => m.isRead),
      hasAttachments: msgs.some((m) => m.hasAttachments),
      messageCount: msgs.length,
      clientId,
      clientName,
      provider: msgs[0].provider,
    });
  }

  // Sort threads by most recent message
  threads.sort((a, b) => new Date(b.lastMessageDate).getTime() - new Date(a.lastMessageDate).getTime());

  return threads;
};

// ---- Reply ----

export const replyToEmail = async (input: ReplyEmailInput) => {
  const accounts = await getEmailAccounts();
  const primary = accounts.find((a) => a.isPrimary) || accounts[0];

  if (!primary) {
    throw new Error('NO_ACCOUNT');
  }

  let accessToken: string;
  try {
    accessToken = await ensureValidToken(primary);
  } catch {
    throw new Error('TOKEN_EXPIRED');
  }

  if (input.provider === 'gmail') {
    return replyGmailEmail({
      accessToken,
      refreshToken: primary.refreshToken,
      to: input.to,
      subject: input.subject,
      body: input.body,
      threadId: input.threadId,
      inReplyToHeader: input.messageIdHeader,
      referencesHeader: input.referencesHeader,
    });
  }

  if (input.provider === 'outlook') {
    return replyOutlookEmail({
      accessToken,
      messageId: input.inReplyToMessageId,
      body: input.body,
    });
  }

  throw new Error(`Unsupported provider: ${input.provider}`);
};
