export const Skeleton = ({ className = '' }: { className?: string }) => (
  <div className={`skeleton ${className}`} />
);

export const SkeletonText = ({ lines = 3, className = '' }: { lines?: number; className?: string }) => (
  <div className={`space-y-2 ${className}`}>
    {Array.from({ length: lines }).map((_, i) => (
      <div key={i} className={`skeleton h-3 ${i === lines - 1 ? 'w-3/4' : 'w-full'}`} />
    ))}
  </div>
);

export const SkeletonCard = ({ className = '' }: { className?: string }) => (
  <div className={`bg-[#faf7f2]/80 dark:bg-gray-900/60 backdrop-blur-xl rounded-xl border border-amber-200/25 dark:border-gray-800/60 p-4 ${className}`}>
    <div className="flex items-center justify-between mb-3">
      <div className="skeleton h-3 w-20" />
      <div className="skeleton w-7 h-7 rounded-lg" />
    </div>
    <div className="skeleton h-8 w-16 mb-2" />
    <div className="skeleton h-3 w-24" />
  </div>
);
