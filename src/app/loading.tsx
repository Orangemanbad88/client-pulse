import { SkeletonCard } from '@/components/ui/Skeleton';

export default function DashboardLoading() {
  return (
    <>
      {/* Header skeleton */}
      <div className="sticky top-3 z-10 hidden lg:block mx-4 lg:mx-6 rounded-xl border border-[#D4A84B]/20 shadow-lg shadow-black/20" style={{ background: '#1e3a5f' }}>
        <div className="px-4 lg:px-8 py-3 lg:py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="skeleton w-10 h-10 rounded-xl" />
            <div className="space-y-2">
              <div className="skeleton h-5 w-40" />
              <div className="skeleton h-3 w-28" />
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="skeleton w-10 h-10 rounded-lg" />
            <div className="skeleton w-28 h-10 rounded-lg" />
          </div>
        </div>
      </div>

      <div className="px-4 lg:px-8 py-4 lg:py-6">
        {/* Metric cards skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 lg:gap-4 mb-4 lg:mb-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>

        {/* Main grid skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
          <div className="lg:col-span-7">
            <div className="bg-[#faf7f2]/80 dark:bg-gray-900/60 backdrop-blur-xl rounded-xl border border-amber-200/25 dark:border-gray-800/60 overflow-hidden">
              <div className="px-5 py-4" style={{ background: '#1e3a5f' }}>
                <div className="skeleton h-4 w-32" />
              </div>
              <div className="p-4 space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="skeleton h-16 w-full rounded-lg" />
                ))}
              </div>
            </div>
          </div>
          <div className="lg:col-span-5 space-y-4 lg:space-y-6">
            <div className="bg-[#faf7f2]/80 dark:bg-gray-900/60 backdrop-blur-xl rounded-xl border border-amber-200/25 dark:border-gray-800/60 overflow-hidden">
              <div className="px-5 py-4" style={{ background: '#1e3a5f' }}>
                <div className="skeleton h-4 w-28" />
              </div>
              <div className="p-5">
                <div className="skeleton h-32 w-full rounded-lg" />
              </div>
            </div>
            <div className="bg-[#faf7f2]/80 dark:bg-gray-900/60 backdrop-blur-xl rounded-xl border border-amber-200/25 dark:border-gray-800/60 overflow-hidden">
              <div className="px-5 py-4" style={{ background: '#1e3a5f' }}>
                <div className="skeleton h-4 w-36" />
              </div>
              <div className="p-4 space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="skeleton h-20 w-full rounded-lg" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
