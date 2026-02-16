import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { Client, LifecycleStage, UrgencyLevel } from '@/types/client';

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

export const formatCurrency = (value: number, monthly = false): string => {
  const formatted = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
  return monthly ? `${formatted}/mo` : formatted;
};

export const formatDate = (dateStr: string): string => new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

export const formatRelativeDate = (dateStr: string): string => {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  const hrs = Math.floor(diffMs / 3600000);
  const days = Math.floor(diffMs / 86400000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m`;
  if (hrs < 24) return `${hrs}h`;
  if (days === 1) return '1d';
  if (days < 7) return `${days}d`;
  if (days < 30) return `${Math.floor(days / 7)}w`;
  return formatDate(dateStr);
};

export const daysUntil = (dateStr: string): number => Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
export const getInitials = (first: string, last: string) => `${first[0]}${last[0]}`.toUpperCase();
export const getClientName = (c: Client) => `${c.firstName} ${c.lastName}`;

export const urgencyBadge: Record<UrgencyLevel, string> = {
  critical: 'badge-danger',
  high: 'badge-warning',
  medium: 'badge-info',
  low: 'badge-neutral',
};

export const lifecycleOrder: LifecycleStage[] = ['new_lead', 'active_search', 'hot_decision', 'under_contract', 'active_client', 'renewal_window', 'past_client'];

export const scoreColor = (s: number) => s >= 90 ? 'text-emerald-500' : s >= 75 ? 'text-blue-500' : s >= 60 ? 'text-amber-500' : 'text-[var(--text-tertiary)]';
export const scoreBg = (s: number) => s >= 90 ? 'bg-emerald-500/10' : s >= 75 ? 'bg-blue-500/10' : s >= 60 ? 'bg-amber-500/10' : 'bg-[var(--bg-2)]';
