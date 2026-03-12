export default function PropertiesLoading() {
  return (
    <>
      <div className="sticky top-3 z-10 mx-4 lg:mx-6 px-4 lg:px-6 py-3 lg:py-4 rounded-xl border border-[#D4A84B]/20 shadow-lg shadow-black/20 flex items-center justify-between" style={{ background: '#1e3a5f' }}>
        <div className="flex items-center gap-3">
          <div className="skeleton w-10 h-10 rounded-xl" />
          <div className="space-y-2">
            <div className="skeleton h-5 w-28" />
            <div className="skeleton h-3 w-20" />
          </div>
        </div>
        <div className="skeleton w-28 h-9 rounded-lg" />
      </div>
      <div className="px-4 lg:px-8 py-4 lg:py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-[#faf7f2]/80 dark:bg-gray-900/60 backdrop-blur-xl rounded-xl border border-amber-200/25 dark:border-gray-800/60 overflow-hidden">
              <div className="skeleton h-48 w-full rounded-none" />
              <div className="p-4 space-y-3">
                <div className="skeleton h-4 w-3/4" />
                <div className="skeleton h-3 w-1/2" />
                <div className="flex items-center gap-2">
                  <div className="skeleton h-6 w-16 rounded-full" />
                  <div className="skeleton h-6 w-20 rounded-full" />
                </div>
                <div className="skeleton h-5 w-24" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
