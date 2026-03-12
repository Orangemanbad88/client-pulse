import { Clock, CalendarDays, MapPin } from 'lucide-react';
import type { CalendarEvent } from './types';
import { getEventPillClass } from './utils';

interface CalendarEventBadgeProps {
  type: CalendarEvent['type'];
  count: number;
}

const iconMap = {
  trigger: Clock,
  google: CalendarDays,
  activity: MapPin,
};

const labelMap = {
  trigger: 'trigger',
  google: 'synced',
  activity: 'activity',
};

export const CalendarEventBadge = ({ type, count }: CalendarEventBadgeProps) => {
  if (count === 0) return null;
  const Icon = iconMap[type];
  const pillClass = getEventPillClass(type);

  return (
    <div className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-semibold ${pillClass}`}>
      <Icon size={9} />
      <span>{count} {labelMap[type]}{count > 1 && type !== 'activity' ? 's' : ''}{count > 1 && type === 'activity' ? '' : ''}</span>
    </div>
  );
};
