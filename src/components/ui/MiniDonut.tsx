export const MiniDonut = ({ segments, size = 120, dark }: { segments: { label: string; value: number; color: string }[]; size?: number; dark: boolean }) => {
  const total = segments.reduce((s, seg) => s + seg.value, 0) || 1;
  const r = 42;
  const circ = 2 * Math.PI * r;
  let accum = 0;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={r} fill="none" stroke={dark ? "#134e4a" : "#f0fdfa"} strokeWidth="14" />
        {segments.map((seg) => {
          const pct = seg.value / total;
          const dashLen = pct * circ;
          const dashOff = -accum * circ;
          accum += pct;
          return (
            <circle key={seg.label} cx="60" cy="60" r={r} fill="none" stroke={seg.color}
              strokeWidth="14" strokeDasharray={`${dashLen} ${circ - dashLen}`}
              strokeDashoffset={dashOff}
              style={{ transform: "rotate(-90deg)", transformOrigin: "center" }}
            />
          );
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold font-data text-gray-800 dark:text-gray-100">{total}</span>
        <span className="text-xs text-gray-400 dark:text-gray-500">total</span>
      </div>
    </div>
  );
};
