import { google } from 'googleapis';

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI!;

const SCOPES = ['https://www.googleapis.com/auth/calendar.events'];

const createOAuth2Client = () =>
  new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

export const getAuthUrl = (): string => {
  const client = createOAuth2Client();
  return client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
  });
};

export const getTokensFromCode = async (code: string) => {
  const client = createOAuth2Client();
  const { tokens } = await client.getToken(code);
  return tokens;
};

interface CalendarEventInput {
  summary: string;
  description?: string;
  startDateTime: string;
  endDateTime: string;
}

export const createCalendarEvent = async (
  accessToken: string,
  refreshToken: string,
  event: CalendarEventInput,
) => {
  const client = createOAuth2Client();
  client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  const calendar = google.calendar({ version: 'v3', auth: client });

  const response = await calendar.events.insert({
    calendarId: 'primary',
    requestBody: {
      summary: event.summary,
      description: event.description,
      start: { dateTime: event.startDateTime, timeZone: 'America/New_York' },
      end: { dateTime: event.endDateTime, timeZone: 'America/New_York' },
    },
  });

  return response.data;
};

export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: string;
  end: string;
  htmlLink?: string;
}

export const getCalendarEvents = async (
  accessToken: string,
  refreshToken: string,
  timeMin?: string,
  timeMax?: string,
): Promise<GoogleCalendarEvent[]> => {
  const client = createOAuth2Client();
  client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  const calendar = google.calendar({ version: 'v3', auth: client });

  const now = new Date();
  const defaultMin = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const defaultMax = new Date(now.getFullYear(), now.getMonth() + 2, 0).toISOString();

  const response = await calendar.events.list({
    calendarId: 'primary',
    timeMin: timeMin || defaultMin,
    timeMax: timeMax || defaultMax,
    singleEvents: true,
    orderBy: 'startTime',
    maxResults: 250,
  });

  return (response.data.items || []).map((item) => ({
    id: item.id || '',
    summary: item.summary || '(No title)',
    description: item.description || undefined,
    start: item.start?.dateTime || item.start?.date || '',
    end: item.end?.dateTime || item.end?.date || '',
    htmlLink: item.htmlLink || undefined,
  }));
};
