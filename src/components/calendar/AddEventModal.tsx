import { createPortal } from 'react-dom';
import { Plus, X } from 'lucide-react';
import type { NewEvent } from './types';

interface AddEventModalProps {
  newEvent: NewEvent;
  onChangeEvent: (event: NewEvent) => void;
  onAdd: () => void;
  onClose: () => void;
}

export const AddEventModal = ({ newEvent, onChangeEvent, onAdd, onClose }: AddEventModalProps) => {
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-900 rounded-xl border border-amber-200/25 dark:border-gray-800/60 shadow-xl w-full max-w-md overflow-hidden animate-scale-in">
        <div className="px-5 py-4 border-b border-amber-100/30 dark:border-gray-800/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-5 rounded-full bg-gold" />
            <h2 className="text-sm font-bold text-gray-800 dark:text-gray-100 tracking-tight">Add Event</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors">
            <X size={16} className="text-gray-400" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Title *</label>
            <input
              type="text"
              value={newEvent.title}
              onChange={(e) => onChangeEvent({ ...newEvent, title: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold"
              placeholder="e.g. Property showing"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Date *</label>
              <input
                type="date"
                value={newEvent.date}
                onChange={(e) => onChangeEvent({ ...newEvent, date: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Time</label>
              <input
                type="time"
                value={newEvent.time}
                onChange={(e) => onChangeEvent({ ...newEvent, time: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Client Name</label>
            <input
              type="text"
              value={newEvent.clientName}
              onChange={(e) => onChangeEvent({ ...newEvent, clientName: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold"
              placeholder="Optional"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Description</label>
            <textarea
              value={newEvent.description}
              onChange={(e) => onChangeEvent({ ...newEvent, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold resize-none"
              placeholder="Optional"
            />
          </div>
        </div>
        <div className="px-5 py-4 border-t border-amber-100/30 dark:border-gray-800/60 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 px-4 py-2 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onAdd}
            disabled={!newEvent.title || !newEvent.date}
            className="flex items-center gap-1.5 text-xs font-medium text-white bg-gold hover:bg-gold-muted disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded-lg transition-colors shadow-sm shadow-gold/20 active:scale-[0.97]"
          >
            <Plus size={13} /> Add Event
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
