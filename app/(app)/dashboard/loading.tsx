import { Skeleton } from "@/components/ui/skeleton"

export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-6 p-6 w-full max-w-7xl self-center animate-fade-in">
      {/* Drop zone + Unsorted */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Skeleton className="lg:col-span-2 h-[200px] rounded-xl" />
        <Skeleton className="lg:col-span-1 h-[200px] rounded-xl" />
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[120px] rounded-xl" />
        ))}
      </div>

      {/* Chart */}
      <Skeleton className="h-[400px] rounded-xl" />
    </div>
  )
}
