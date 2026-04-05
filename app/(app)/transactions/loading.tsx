import { Skeleton } from "@/components/ui/skeleton"

export default function TransactionsLoading() {
  return (
    <div className="flex flex-col gap-6 p-6 w-full max-w-[1400px] mx-auto animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-6 w-12 rounded-full" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-28 rounded-lg" />
          <Skeleton className="h-10 w-36 rounded-lg" />
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        <Skeleton className="h-10 flex-1 min-w-[200px] rounded-lg" />
        <Skeleton className="h-10 w-[180px] rounded-lg" />
        <Skeleton className="h-10 w-[180px] rounded-lg" />
      </div>

      <div className="rounded-xl border overflow-hidden">
        <Skeleton className="h-10 w-full" />
        {Array.from({ length: 12 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full border-t rounded-none" />
        ))}
      </div>
    </div>
  )
}
