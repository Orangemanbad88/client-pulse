import type { CalendarEvent } from './types';

export const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export const toDateKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export const getEventAccentColor = (type: CalendarEvent['type']): string => {
  switch (type) {
    case 'trigger': return '#D4A84B';
    case 'google': return '#3b82f6';
    case 'activity': return '#14b8a6';
  }
};

export const getEventBgClass = (type: CalendarEvent['type']): string => {
  switch (type) {
    case 'trigger': return 'bg-amber-900/30 dark:bg-amber-900/20';
    case 'google': return 'bg-blue-50 dark:bg-blue-900/20';
    case 'activity': return 'bg-teal-50 dark:bg-teal-900/20';
  }
};

export const getEventTextClass = (type: CalendarEvent['type']): string => {
  switch (type) {
    case 'trigger': return 'text-amber-600 dark:text-amber-400';
    case 'google': return 'text-blue-600 dark:text-blue-400';
    case 'activity': return 'text-teal-600 dark:text-teal-400';
  }
};

export const getEventPillClass = (type: CalendarEvent['type']): string => {
  switch (type) {
    case 'trigger': return 'bg-amber-900/30 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400';
    case 'google': return 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400';
    case 'activity': return 'bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400';
  }
};

export const getEventDateBoxClass = (type: CalendarEvent['type']): string => {
  switch (type) {
    case 'trigger': return 'bg-amber-900/30 dark:bg-amber-900/30';
    case 'google': return 'bg-blue-50 dark:bg-blue-900/30';
    case 'activity': return 'bg-teal-50 dark:bg-teal-900/30';
  }
};

export const getEventDateTextClass = (type: CalendarEvent['type']): string => {
  switch (type) {
    case 'trigger': return 'text-gold dark:text-gold-light';
    case 'google': return 'text-blue-600 dark:text-blue-400';
    case 'activity': return 'text-teal-600 dark:text-teal-400';
  }
};
