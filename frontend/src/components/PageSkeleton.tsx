
export default function PageSkeleton() {
  return (
    <div className="flex-1 h-full w-full p-6 md:p-8 overflow-y-auto animate-pulse bg-[#f9f8f6] dark:bg-[#1E1C1C] transition-colors duration-300">
      {/* Top Header Skeleton */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-[#A89080]/15 dark:border-[#E2DAD2]/10">
        <div className="space-y-2.5">
          <div className="h-7 w-48 bg-[#B8AFA8]/30 dark:bg-[#3A3838] rounded-md" />
          <div className="h-4 w-72 bg-[#B8AFA8]/20 dark:bg-[#3A3838]/60 rounded-md" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-9 w-24 bg-[#B8AFA8]/25 dark:bg-[#3A3838] rounded-lg" />
          <div className="h-9 w-9 bg-[#B8AFA8]/25 dark:bg-[#3A3838] rounded-lg" />
        </div>
      </div>

      {/* Metric / Stat Bar Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="p-4 rounded-xl border border-[#A89080]/15 dark:border-[#E2DAD2]/10 bg-white/60 dark:bg-[#252222]/80 space-y-3"
          >
            <div className="flex justify-between items-center">
              <div className="h-4 w-20 bg-[#B8AFA8]/30 dark:bg-[#3A3838] rounded" />
              <div className="h-5 w-5 bg-[#A89080]/20 dark:bg-[#A89080]/30 rounded-full" />
            </div>
            <div className="h-6 w-28 bg-[#B8AFA8]/40 dark:bg-[#3A3838] rounded" />
          </div>
        ))}
      </div>

      {/* Main Content Area Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column / List Skeleton */}
        <div className="lg:col-span-2 p-6 rounded-2xl border border-[#A89080]/15 dark:border-[#E2DAD2]/10 bg-white/60 dark:bg-[#252222]/80 space-y-4">
          <div className="h-5 w-36 bg-[#B8AFA8]/30 dark:bg-[#3A3838] rounded" />
          <div className="space-y-3 pt-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="h-14 rounded-lg bg-[#B8AFA8]/15 dark:bg-[#2E2B2B] flex items-center px-4 justify-between"
              >
                <div className="space-y-2">
                  <div className="h-3.5 w-44 bg-[#B8AFA8]/30 dark:bg-[#3A3838] rounded" />
                  <div className="h-2.5 w-28 bg-[#B8AFA8]/20 dark:bg-[#3A3838]/60 rounded" />
                </div>
                <div className="h-6 w-16 bg-[#B8AFA8]/20 dark:bg-[#3A3838] rounded-full" />
              </div>
            ))}
          </div>
        </div>

        {/* Right Column / Detail Skeleton */}
        <div className="p-6 rounded-2xl border border-[#A89080]/15 dark:border-[#E2DAD2]/10 bg-white/60 dark:bg-[#252222]/80 space-y-4">
          <div className="h-5 w-28 bg-[#B8AFA8]/30 dark:bg-[#3A3838] rounded" />
          <div className="h-32 rounded-xl bg-[#B8AFA8]/15 dark:bg-[#2E2B2B]" />
          <div className="space-y-2 pt-2">
            <div className="h-3.5 w-full bg-[#B8AFA8]/25 dark:bg-[#3A3838] rounded" />
            <div className="h-3.5 w-4/5 bg-[#B8AFA8]/20 dark:bg-[#3A3838]/70 rounded" />
            <div className="h-3.5 w-2/3 bg-[#B8AFA8]/15 dark:bg-[#3A3838]/50 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}
