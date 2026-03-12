import type { CalendarViewMode } from './types';

interface CalendarViewToggleProps {
  viewMode: CalendarViewMode;
  onViewChange: (mode: CalendarViewMode) => void;
}

export const CalendarViewToggle = ({ viewMode, onViewChange }: CalendarViewToggleProps) => {
  return (
    <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
      <button
        onClick={() => onViewChange('month')}
        className={`text-xs font-medium px-3 py-1.5 rounded-md transition-all ${
          viewMode === 'month'
            ? 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 shadow-sm'
            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
        }`}
      >
        Month
      </button>
      <button
        onClick={() => onViewChange('week')}
        className={`text-xs font-medium px-3 py-1.5 rounded-md transition-all ${
          viewMode === 'week'
            ? 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 shadow-sm'
            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
        }`}
      >
        Week
      </button>
    </div>
  );
};
