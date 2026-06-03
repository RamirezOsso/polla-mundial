import { cn } from '@/lib/utils'

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-lg bg-gray-800', className)} />
}

export function MatchCardSkeleton() {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 space-y-3">
      <Skeleton className="h-3 w-24" />
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 justify-end">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="w-8 h-8 rounded-full" />
        </div>
        <Skeleton className="h-10 w-20 rounded-xl" />
        <div className="flex items-center gap-2 flex-1">
          <Skeleton className="w-8 h-8 rounded-full" />
          <Skeleton className="h-4 w-20" />
        </div>
      </div>
    </div>
  )
}
