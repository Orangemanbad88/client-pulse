import { SkeletonCard } from '@/components/ui/Skeleton';

export default function AnalyticsLoading() {
  return (
    <>
      <div className="sticky top-3 z-10 mx-4 lg:mx-6 px-4 lg:px-6 py-3 lg:py-4 rounded-xl border border-[#D4A84B]/20 shadow-lg shadow-black/20 flex items-center justify-between" style={{ background: '#1e3a5f' }}>
        <div className="flex items-center gap-3">
          <div className="skeleton w-10 h-10 rounded-xl" />
          <div className="space-y-2">
            <div className="skeleton h-5 w-24" />
            <div className="skeleton h-3 w-32" />
          </div>
        </div>
        <div className="skeleton w-32 h-9 rounded-lg" />
      </div>
      <div className="px-4 lg:px-8 py-4 lg:py-6">
        {/* Summary cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-4 lg:mb-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-[#162b48]/80 dark:bg-gray-900/60 backdrop-blur-xl rounded-xl border border-amber-200/25 dark:border-gray-800/60 overflow-hidden">
              <div className="px-5 py-4" style={{ background: '#1e3a5f' }}>
                <div className="skeleton h-4 w-32" />
              </div>
              <div className="p-5">
                <div className="skeleton h-48 w-full rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
