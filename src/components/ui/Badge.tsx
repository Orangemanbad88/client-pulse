export type BadgeVariant = 'critical' | 'high' | 'medium' | 'new' | 'sent' | 'default';

const styles: Record<BadgeVariant, string> = {
  critical: "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-800/30 animate-badge-pulse",
  high: "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-800/30",
  medium: "bg-amber-50 dark:bg-amber-900/20 text-gold dark:text-gold-light border border-gold-light dark:border-gold-muted/30",
  new: "bg-amber-50 dark:bg-amber-900/20 text-gold dark:text-gold-light border border-gold-light dark:border-gold-muted/30",
  sent: "bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700",
  default: "bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700",
};

export const Badge = ({ children, variant = "default" }: { children: React.ReactNode; variant?: BadgeVariant }) => (
  <span className={`${styles[variant]} text-xs font-medium px-2 py-0.5 rounded-full`}>
    {children}
  </span>
);
