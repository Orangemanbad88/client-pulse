/**
 * Generates NJ Shore rental season weeks (Saturday to Saturday).
 * Season runs from late May through early September.
 */
export function getRentalSeasonWeeks(): { label: string; value: string; month: string }[] {
  const now = new Date();
  // If past September, generate for next year's season
  const year = now.getMonth() >= 9 ? now.getFullYear() + 1 : now.getFullYear();

  // Find last Saturday of May
  const may31 = new Date(year, 4, 31);
  const dayOfWeek = may31.getDay(); // 0=Sun..6=Sat
  const offset = dayOfWeek === 6 ? 0 : dayOfWeek + 1; // days back to previous Saturday
  const firstSat = new Date(year, 4, 31 - offset);

  const weeks: { label: string; value: string; month: string }[] = [];
  const current = new Date(firstSat);
  const seasonEnd = new Date(year, 8, 7); // Sep 7

  const fmt = (d: Date) =>
    d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  const monthName = (d: Date) =>
    d.toLocaleDateString('en-US', { month: 'long' });

  while (current < seasonEnd) {
    const end = new Date(current);
    end.setDate(end.getDate() + 6);
    weeks.push({
      label: `${fmt(current)} – ${fmt(end)}`,
      value: `${fmt(current)} – ${fmt(end)}`,
      month: monthName(current),
    });
    current.setDate(current.getDate() + 7);
  }

  return weeks;
}

/** Get unique months from the season weeks */
export function getSeasonMonths(weeks: { month: string }[]): string[] {
  const seen = new Set<string>();
  return weeks.reduce<string[]>((acc, w) => {
    if (!seen.has(w.month)) {
      seen.add(w.month);
      acc.push(w.month);
    }
    return acc;
  }, []);
}
