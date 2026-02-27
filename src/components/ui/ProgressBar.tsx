export const ProgressBar = ({ current, total, color = "#d4a00a" }: { current: number; total: number; color?: string }) => {
  const pct = Math.min((current / total) * 100, 100);
  return (
    <div className="w-full h-1.5 bg-yellow-50 dark:bg-yellow-900/20 rounded-full overflow-hidden">
      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: color }} />
    </div>
  );
};
