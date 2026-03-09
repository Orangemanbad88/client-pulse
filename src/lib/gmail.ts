import { google } from 'googleapis';

const SCOPES = [
  'https://www.googleapis.com/auth/gmail.send',
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

  // Build RFC 2822 MIME message
  const messageParts = [
    `To: ${to}`,
    `Subject: ${subject}`,
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
