import { Resend } from 'resend';

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

export const sendEmail = async ({ to, subject, body, replyTo }: SendEmailInput) => {
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

  return data;
};
