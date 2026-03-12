export default function CalendarLoading() {
  return (
    <>
      <div className="sticky top-3 z-10 mx-4 lg:mx-6 px-4 lg:px-6 py-3 lg:py-4 rounded-xl border border-[#D4A84B]/20 shadow-lg shadow-black/20 flex items-center justify-between" style={{ background: '#1e3a5f' }}>
        <div className="flex items-center gap-3">
          <div className="skeleton w-10 h-10 rounded-xl" />
          <div className="space-y-2">
            <div className="skeleton h-5 w-24" />
            <div className="skeleton h-3 w-20" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="skeleton w-24 h-9 rounded-lg" />
          <div className="skeleton w-28 h-9 rounded-lg" />
        </div>
      </div>
      <div className="px-4 lg:px-8 py-4 lg:py-6">
        <div className="bg-[#162b48]/80 dark:bg-gray-900/60 backdrop-blur-xl rounded-xl border border-amber-200/25 dark:border-gray-800/60 overflow-hidden">
          {/* Calendar header row */}
          <div className="grid grid-cols-7 gap-px border-b border-amber-200/25 dark:border-gray-800/60">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="p-3 text-center">
                <div className="skeleton h-3 w-8 mx-auto" />
              </div>
            ))}
          </div>
          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-px">
            {Array.from({ length: 35 }).map((_, i) => (
              <div key={i} className="p-3 min-h-[80px]">
                <div className="skeleton h-4 w-6 mb-2" />
                {i % 5 === 0 && <div className="skeleton h-5 w-full rounded" />}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
