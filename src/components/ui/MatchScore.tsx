'use client';

export const MatchScore = ({ score, dark }: { score: number; dark: boolean }) => {
  const color = score >= 85 ? (dark ? "#2dd4bf" : "#0d9488") : "#94a3b8";
  const trackColor = dark ? "#134e4a" : "#f0fdfa";
  const r = 20;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  return (
    <div className="relative flex items-center justify-center" style={{ width: 52, height: 52 }}>
      <svg width="52" height="52" className="absolute">
        <circle cx="26" cy="26" r={r} fill="none" stroke={trackColor} strokeWidth="4" />
        <circle
          cx="26" cy="26" r={r} fill="none" stroke={color} strokeWidth="4"
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transform: "rotate(-90deg)", transformOrigin: "center", transition: "stroke-dashoffset 1s ease" }}
        />
      </svg>
      <span className="text-sm font-bold font-data" style={{ color }}>{score}</span>
    </div>
  );
};
