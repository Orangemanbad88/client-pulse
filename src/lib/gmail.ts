import { google } from 'googleapis';
import type { EmailMessage, EmailParticipant } from '@/types/client';

/** Strip CR/LF from MIME header values to prevent header injection */
const sanitizeHeader = (value: string): string => value.replace(/[\r\n]/g, '');

const SCOPES = [
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/userinfo.email',
];

const getCredentials = () => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_GMAIL_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error(
      'Missing Gmail OAuth credentials. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_GMAIL_REDIRECT_URI in .env.local',
    );
  }

  return { clientId, clientSecret, redirectUri };
};

const createOAuth2Client = () => {
  const { clientId, clientSecret, redirectUri } = getCredentials();
  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
};

export const getGmailAuthUrl = (): string => {
  const client = createOAuth2Client();
  return client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
  });
};

export const getGmailTokensFromCode = async (code: string) => {
  const client = createOAuth2Client();
  const { tokens } = await client.getToken(code);

  // Fetch user email
  client.setCredentials(tokens);
  const oauth2 = google.oauth2({ version: 'v2', auth: client });
  const { data: userInfo } = await oauth2.userinfo.get();

  if (!tokens.access_token || !tokens.refresh_token) {
    throw new Error('Gmail OAuth did not return required tokens');
  }

  if (!userInfo.email) {
    throw new Error('Unable to retrieve email address from Google account');
  }

  return {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    expiresAt: tokens.expiry_date
      ? new Date(tokens.expiry_date).toISOString()
      : new Date(Date.now() + 3600 * 1000).toISOString(),
    email: userInfo.email,
  };
};

export const refreshGmailToken = async (
  refreshToken: string,
): Promise<{ accessToken: string; expiresAt: string }> => {
  const client = createOAuth2Client();
  client.setCredentials({ refresh_token: refreshToken });
  const { credentials } = await client.refreshAccessToken();

  return {
    accessToken: credentials.access_token || '',
    expiresAt: credentials.expiry_date
      ? new Date(credentials.expiry_date).toISOString()
      : new Date(Date.now() + 3600 * 1000).toISOString(),
  };
};

interface GmailSendInput {
  accessToken: string;
  refreshToken: string;
  to: string;
  subject: string;
  body: string;
}

export const sendGmailEmail = async ({
  accessToken,
  refreshToken,
  to,
  subject,
  body,
}: GmailSendInput) => {
  const client = createOAuth2Client();
  client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  const gmail = google.gmail({ version: 'v1', auth: client });

  // Build RFC 2822 MIME message (sanitize headers to prevent injection)
  const messageParts = [
    `To: ${sanitizeHeader(to)}`,
    `Subject: ${sanitizeHeader(subject)}`,
    'Content-Type: text/plain; charset=utf-8',
    '',
    body,
  ];
  const rawMessage = messageParts.join('\r\n');
  const encodedMessage = Buffer.from(rawMessage)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const result = await gmail.users.messages.send({
    userId: 'me',
    requestBody: { raw: encodedMessage },
  });

  return { messageId: result.data.id };
};

// ---- Read / Reply ----

const parseEmailAddress = (raw: string): EmailParticipant => {
  const match = raw.match(/^(.+?)\s*<(.+?)>$/);
  if (match) return { name: match[1].trim().replace(/^"|"$/g, ''), email: match[2].trim() };
  return { name: raw.trim(), email: raw.trim() };
};

const getHeader = (headers: Array<{ name?: string | null; value?: string | null }>, name: string): string => {
  const h = headers.find((h) => h.name?.toLowerCase() === name.toLowerCase());
  return h?.value || '';
};

const extractBody = (payload: { mimeType?: string | null; body?: { data?: string | null }; parts?: Array<{ mimeType?: string | null; body?: { data?: string | null }; parts?: unknown[] }> }): { text: string; html: string } => {
  let text = '';
  let html = '';

  if (payload.body?.data) {
    const decoded = Buffer.from(payload.body.data, 'base64url').toString('utf8');
    if (payload.mimeType === 'text/plain') text = decoded;
    else if (payload.mimeType === 'text/html') html = decoded;
  }

  if (payload.parts) {
    for (const part of payload.parts) {
      if (part.mimeType === 'text/plain' && part.body?.data) {
        text = Buffer.from(part.body.data, 'base64url').toString('utf8');
      } else if (part.mimeType === 'text/html' && part.body?.data) {
        html = Buffer.from(part.body.data, 'base64url').toString('utf8');
      } else if (part.mimeType?.startsWith('multipart/') && part.parts) {
        const nested = extractBody(part as typeof payload);
        if (!text && nested.text) text = nested.text;
        if (!html && nested.html) html = nested.html;
      }
    }
  }

  return { text, html };
};

export const parseGmailMessage = (msg: {
  id?: string | null;
  threadId?: string | null;
  labelIds?: string[] | null;
  snippet?: string | null;
  payload?: {
    headers?: Array<{ name?: string | null; value?: string | null }>;
    mimeType?: string | null;
    body?: { data?: string | null };
    parts?: Array<{ mimeType?: string | null; body?: { data?: string | null }; parts?: unknown[] }>;
  };
}): EmailMessage => {
  const headers = msg.payload?.headers || [];
  const { text, html } = extractBody(msg.payload || {});

  return {
    id: msg.id || '',
    threadId: msg.threadId || '',
    subject: getHeader(headers, 'Subject'),
    from: parseEmailAddress(getHeader(headers, 'From')),
    to: getHeader(headers, 'To').split(',').map((a) => parseEmailAddress(a.trim())).filter((p) => p.email),
    date: getHeader(headers, 'Date') || new Date().toISOString(),
    bodyText: text,
    bodyHtml: html,
    snippet: msg.snippet || '',
    isRead: !(msg.labelIds || []).includes('UNREAD'),
    hasAttachments: (msg.payload?.parts || []).some((p) => p.mimeType?.startsWith('application/') || p.mimeType?.startsWith('image/')),
    provider: 'gmail',
    messageIdHeader: getHeader(headers, 'Message-ID'),
    referencesHeader: getHeader(headers, 'References'),
  };
};

interface GmailFetchInput {
  accessToken: string;
  refreshToken: string;
  clientEmails: string[];
  maxResults?: number;
}

export const fetchGmailMessages = async ({
  accessToken,
  refreshToken,
  clientEmails,
  maxResults = 50,
}: GmailFetchInput): Promise<EmailMessage[]> => {
  if (clientEmails.length === 0) return [];

  const client = createOAuth2Client();
  client.setCredentials({ access_token: accessToken, refresh_token: refreshToken });
  const gmail = google.gmail({ version: 'v1', auth: client });

  // Chunk client emails into groups of ~30 to stay under Gmail query length limit
  const chunkSize = 30;
  const allMessageIds: string[] = [];

  for (let i = 0; i < clientEmails.length; i += chunkSize) {
    const chunk = clientEmails.slice(i, i + chunkSize);
    const query = chunk.map((e) => `from:${e} OR to:${e}`).join(' OR ');

    try {
      const listRes = await gmail.users.messages.list({
        userId: 'me',
        q: query,
        maxResults,
      });

      const ids = (listRes.data.messages || []).map((m) => m.id).filter(Boolean) as string[];
      for (const id of ids) {
        if (!allMessageIds.includes(id)) allMessageIds.push(id);
      }
    } catch {
      // Skip this chunk on error
    }
  }

  // Fetch full messages in batches of 10
  const messages: EmailMessage[] = [];
  const batchSize = 10;

  for (let i = 0; i < allMessageIds.length && i < maxResults; i += batchSize) {
    const batch = allMessageIds.slice(i, i + batchSize);
    const results = await Promise.allSettled(
      batch.map((id) =>
        gmail.users.messages.get({ userId: 'me', id, format: 'full' }),
      ),
    );

    for (const result of results) {
      if (result.status === 'fulfilled') {
        messages.push(parseGmailMessage(result.value.data));
      }
    }
  }

  return messages;
};

interface GmailReplyInput {
  accessToken: string;
  refreshToken: string;
  to: string;
  subject: string;
  body: string;
  threadId: string;
  inReplyToHeader: string;
  referencesHeader: string;
}

export const replyGmailEmail = async ({
  accessToken,
  refreshToken,
  to,
  subject,
  body,
  threadId,
  inReplyToHeader,
  referencesHeader,
}: GmailReplyInput) => {
  const client = createOAuth2Client();
  client.setCredentials({ access_token: accessToken, refresh_token: refreshToken });
  const gmail = google.gmail({ version: 'v1', auth: client });

  const refs = referencesHeader
    ? `${referencesHeader} ${inReplyToHeader}`
    : inReplyToHeader;

  const replySubject = subject.startsWith('Re:') ? subject : `Re: ${subject}`;

  const messageParts = [
    `To: ${sanitizeHeader(to)}`,
    `Subject: ${sanitizeHeader(replySubject)}`,
    `In-Reply-To: ${sanitizeHeader(inReplyToHeader)}`,
    `References: ${sanitizeHeader(refs)}`,
    'Content-Type: text/plain; charset=utf-8',
    '',
    body,
  ];
  const rawMessage = messageParts.join('\r\n');
  const encodedMessage = Buffer.from(rawMessage)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const result = await gmail.users.messages.send({
    userId: 'me',
    requestBody: { raw: encodedMessage, threadId },
  });

  return { messageId: result.data.id };
};
