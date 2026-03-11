import type { EmailMessage } from '@/types/client';

const SCOPES = 'Mail.Send Mail.Read User.Read offline_access';

const getCredentials = () => {
  const clientId = process.env.MICROSOFT_CLIENT_ID;
  const clientSecret = process.env.MICROSOFT_CLIENT_SECRET;
  const redirectUri = process.env.MICROSOFT_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error(
      'Missing Microsoft OAuth credentials. Set MICROSOFT_CLIENT_ID, MICROSOFT_CLIENT_SECRET, and MICROSOFT_REDIRECT_URI in .env.local',
    );
  }

  return { clientId, clientSecret, redirectUri };
};

export const getOutlookAuthUrl = (): string => {
  const { clientId, redirectUri } = getCredentials();
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: redirectUri,
    response_mode: 'query',
    scope: SCOPES,
    prompt: 'consent',
  });

  return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params.toString()}`;
};

export const getOutlookTokensFromCode = async (code: string) => {
  const { clientId, clientSecret, redirectUri } = getCredentials();

  const tokenRes = await fetch(
    'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
        scope: SCOPES,
      }),
    },
  );

  if (!tokenRes.ok) {
    const err = await tokenRes.text();
    throw new Error(`Outlook token exchange failed: ${err}`);
  }

  const tokens = await tokenRes.json();

  // Fetch user email from Graph API
  const meRes = await fetch('https://graph.microsoft.com/v1.0/me', {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });

  if (!meRes.ok) {
    throw new Error('Failed to fetch Microsoft user profile');
  }

  const me = await meRes.json();

  if (!tokens.access_token || !tokens.refresh_token) {
    throw new Error('Outlook OAuth did not return required tokens');
  }

  const email = me.mail || me.userPrincipalName;
  if (!email) {
    throw new Error('Unable to retrieve email address from Microsoft account');
  }

  return {
    accessToken: tokens.access_token as string,
    refreshToken: tokens.refresh_token as string,
    expiresAt: new Date(Date.now() + (tokens.expires_in as number) * 1000).toISOString(),
    email: email as string,
  };
};

export const refreshOutlookToken = async (
  refreshToken: string,
): Promise<{ accessToken: string; expiresAt: string }> => {
  const { clientId, clientSecret } = getCredentials();

  const res = await fetch(
    'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
        scope: SCOPES,
      }),
    },
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Outlook token refresh failed: ${err}`);
  }

  const data = await res.json();

  return {
    accessToken: data.access_token as string,
    expiresAt: new Date(Date.now() + (data.expires_in as number) * 1000).toISOString(),
  };
};

interface OutlookSendInput {
  accessToken: string;
  refreshToken: string;
  to: string;
  subject: string;
  body: string;
}

export const sendOutlookEmail = async ({
  accessToken,
  to,
  subject,
  body,
}: OutlookSendInput) => {
  const res = await fetch('https://graph.microsoft.com/v1.0/me/sendMail', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: {
        subject,
        body: { contentType: 'Text', content: body },
        toRecipients: [{ emailAddress: { address: to } }],
      },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Outlook send failed: ${err}`);
  }

  return { messageId: 'outlook-sent' };
};

// ---- Read / Reply ----

interface OutlookGraphMessage {
  id: string;
  conversationId: string;
  subject: string;
  from: { emailAddress: { name: string; address: string } };
  toRecipients: Array<{ emailAddress: { name: string; address: string } }>;
  receivedDateTime: string;
  body: { contentType: string; content: string };
  bodyPreview: string;
  isRead: boolean;
  hasAttachments: boolean;
  internetMessageId: string;
}

export const parseOutlookMessage = (msg: OutlookGraphMessage): EmailMessage => ({
  id: msg.id,
  threadId: msg.conversationId,
  subject: msg.subject || '',
  from: {
    name: msg.from?.emailAddress?.name || '',
    email: msg.from?.emailAddress?.address || '',
  },
  to: (msg.toRecipients || []).map((r) => ({
    name: r.emailAddress?.name || '',
    email: r.emailAddress?.address || '',
  })),
  date: msg.receivedDateTime || new Date().toISOString(),
  bodyText: msg.body?.contentType === 'Text' ? msg.body.content : '',
  bodyHtml: msg.body?.contentType === 'HTML' ? msg.body.content : '',
  snippet: msg.bodyPreview || '',
  isRead: msg.isRead,
  hasAttachments: msg.hasAttachments,
  provider: 'outlook',
  messageIdHeader: msg.internetMessageId || '',
  referencesHeader: '',
});

interface OutlookFetchInput {
  accessToken: string;
  clientEmails: string[];
  maxResults?: number;
}

export const fetchOutlookMessages = async ({
  accessToken,
  clientEmails,
  maxResults = 50,
}: OutlookFetchInput): Promise<EmailMessage[]> => {
  if (clientEmails.length === 0) return [];

  const seen = new Set<string>();
  const messages: EmailMessage[] = [];

  // Cap at 20 client emails per batch to avoid $filter limits
  const emailsToSearch = clientEmails.slice(0, 20);

  // Build filter: (from/emailAddress/address eq '...' or toRecipients/any(...))
  const filterParts = emailsToSearch.map(
    (e) => `(from/emailAddress/address eq '${e}' or toRecipients/any(r: r/emailAddress/address eq '${e}'))`,
  );
  const filter = filterParts.join(' or ');

  const selectFields = [
    'id', 'conversationId', 'subject', 'from', 'toRecipients',
    'receivedDateTime', 'body', 'bodyPreview', 'isRead', 'hasAttachments', 'internetMessageId',
  ].join(',');

  try {
    const url = `https://graph.microsoft.com/v1.0/me/messages?$filter=${encodeURIComponent(filter)}&$select=${selectFields}&$orderby=receivedDateTime desc&$top=${maxResults}`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Outlook fetch failed: ${err}`);
    }

    const data = await res.json();
    for (const msg of (data.value || []) as OutlookGraphMessage[]) {
      if (!seen.has(msg.id)) {
        seen.add(msg.id);
        messages.push(parseOutlookMessage(msg));
      }
    }
  } catch (err) {
    throw err;
  }

  return messages;
};

interface OutlookReplyInput {
  accessToken: string;
  messageId: string;
  body: string;
}

export const replyOutlookEmail = async ({
  accessToken,
  messageId,
  body,
}: OutlookReplyInput) => {
  const res = await fetch(
    `https://graph.microsoft.com/v1.0/me/messages/${encodeURIComponent(messageId)}/reply`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ comment: body }),
    },
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Outlook reply failed: ${err}`);
  }

  return { messageId: 'outlook-reply-sent' };
};
