import { Resend } from 'resend';
import { getEmailAccounts, updateEmailTokens } from '@/services';
import { sendGmailEmail, refreshGmailToken } from '@/lib/gmail';
import { sendOutlookEmail, refreshOutlookToken } from '@/lib/outlook';

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

export const sendEmail = async ({ to, subject, body, replyTo }: SendEmailInput): Promise<SendEmailResult> => {
  try {
    const accounts = await getEmailAccounts();
    const primary = accounts.find((a) => a.isPrimary) || accounts[0];

    if (primary) {
      // Auto-refresh expired tokens
      let { accessToken } = primary;
      if (new Date(primary.tokenExpiresAt) < new Date()) {
        try {
          if (primary.provider === 'gmail') {
            const refreshed = await refreshGmailToken(primary.refreshToken);
            accessToken = refreshed.accessToken;
            await updateEmailTokens(primary.id, refreshed.accessToken, refreshed.expiresAt);
          } else if (primary.provider === 'outlook') {
            const refreshed = await refreshOutlookToken(primary.refreshToken);
            accessToken = refreshed.accessToken;
            await updateEmailTokens(primary.id, refreshed.accessToken, refreshed.expiresAt);
          }
        } catch {
          // Token refresh failed — fall through to Resend
          return sendViaResend({ to, subject, body, replyTo });
        }
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
