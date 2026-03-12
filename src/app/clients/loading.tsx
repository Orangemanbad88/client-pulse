export default function ClientsLoading() {
  return (
    <>
      <div className="sticky top-3 z-10 mx-4 lg:mx-6 px-4 lg:px-6 py-3 lg:py-4 rounded-xl border border-[#D4A84B]/20 shadow-lg shadow-black/20 flex items-center justify-between" style={{ background: '#1e3a5f' }}>
        <div className="flex items-center gap-3">
          <div className="skeleton w-10 h-10 rounded-xl" />
          <div className="space-y-2">
            <div className="skeleton h-5 w-20" />
            <div className="skeleton h-3 w-16" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="skeleton w-28 h-9 rounded-lg" />
          <div className="skeleton w-28 h-9 rounded-lg" />
        </div>
      </div>
      <div className="px-4 lg:px-8 py-4 lg:py-6 space-y-4">
        {/* Filter bar */}
        <div className="flex items-center gap-3">
          <div className="skeleton h-9 w-64 rounded-lg" />
          <div className="skeleton h-9 w-24 rounded-lg" />
        </div>
        {/* Client rows */}
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-[#162b48]/80 dark:bg-gray-900/60 backdrop-blur-xl rounded-xl border border-amber-200/25 dark:border-gray-800/60 p-4 flex items-center gap-4">
              <div className="skeleton w-10 h-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-4 w-32" />
                <div className="skeleton h-3 w-48" />
              </div>
              <div className="skeleton h-6 w-16 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
