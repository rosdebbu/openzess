
export default function ChatSkeleton() {
  return (
    <div className="flex-1 w-full max-w-4xl mx-auto px-4 py-8 space-y-6 animate-pulse">
      {/* Agent message skeleton */}
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-[#A89080]/30 dark:bg-[#A89080]/40 shrink-0" />
        <div className="space-y-2 max-w-[75%] w-full">
          <div className="h-4 w-28 bg-[#B8AFA8]/30 dark:bg-[#3A3838] rounded" />
          <div className="p-4 rounded-2xl rounded-tl-sm bg-white/70 dark:bg-[#2A2727] border border-[#A89080]/15 dark:border-[#E2DAD2]/10 space-y-2">
            <div className="h-3.5 w-full bg-[#B8AFA8]/25 dark:bg-[#3A3838] rounded" />
            <div className="h-3.5 w-5/6 bg-[#B8AFA8]/20 dark:bg-[#3A3838]/80 rounded" />
            <div className="h-3.5 w-3/4 bg-[#B8AFA8]/15 dark:bg-[#3A3838]/60 rounded" />
          </div>
        </div>
      </div>

      {/* User message skeleton */}
      <div className="flex items-start justify-end gap-3">
        <div className="space-y-2 max-w-[70%] w-full flex flex-col items-end">
          <div className="h-4 w-20 bg-[#B8AFA8]/30 dark:bg-[#3A3838] rounded" />
          <div className="p-4 rounded-2xl rounded-tr-sm bg-[#A89080]/15 dark:bg-[#A89080]/20 border border-[#A89080]/20 space-y-2 w-full">
            <div className="h-3.5 w-full bg-[#A89080]/30 dark:bg-[#A89080]/40 rounded" />
            <div className="h-3.5 w-2/3 bg-[#A89080]/25 dark:bg-[#A89080]/30 rounded" />
          </div>
        </div>
        <div className="w-8 h-8 rounded-full bg-[#B8AFA8]/30 dark:bg-[#3A3838] shrink-0" />
      </div>

      {/* Agent message skeleton with code/tool preview */}
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-[#A89080]/30 dark:bg-[#A89080]/40 shrink-0" />
        <div className="space-y-2 max-w-[80%] w-full">
          <div className="h-4 w-32 bg-[#B8AFA8]/30 dark:bg-[#3A3838] rounded" />
          <div className="p-4 rounded-2xl rounded-tl-sm bg-white/70 dark:bg-[#2A2727] border border-[#A89080]/15 dark:border-[#E2DAD2]/10 space-y-3">
            <div className="h-3.5 w-full bg-[#B8AFA8]/25 dark:bg-[#3A3838] rounded" />
            <div className="h-24 w-full bg-[#B8AFA8]/15 dark:bg-[#1E1C1C] rounded-lg border border-[#A89080]/10" />
            <div className="h-3.5 w-4/5 bg-[#B8AFA8]/20 dark:bg-[#3A3838]/80 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}
