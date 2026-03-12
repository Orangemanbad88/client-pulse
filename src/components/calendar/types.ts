export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  type: 'trigger' | 'activity' | 'google';
  clientName?: string;
  clientId?: string;
  description?: string;
  urgency?: string;
}

export interface NewEvent {
  title: string;
  date: string;
  time: string;
  clientName: string;
  description: string;
}

export type CalendarViewMode = 'month' | 'week';
