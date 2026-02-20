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
