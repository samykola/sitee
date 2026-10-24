import { cn } from '@/lib/utils';

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton', className)} />;
}

export function PostSkeleton() {
  return (
    <div className="card p-4 space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton className="w-9 h-9 rounded-full" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-2.5 w-20" />
        </div>
        <Skeleton className="w-6 h-6 rounded" />
      </div>
      <Skeleton className="w-full aspect-[4/3] rounded-xl" />
      <Skeleton className="h-3 w-3/4" />
      <div className="flex gap-2">
        <Skeleton className="h-6 w-12" />
        <Skeleton className="h-6 w-12" />
        <Skeleton className="h-6 w-12" />
        <Skeleton className="h-6 w-12 ml-auto" />
      </div>
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="space-y-4">
      <div className="card overflow-hidden">
        <Skeleton className="h-40 rounded-none" />
        <div className="p-4 flex gap-4">
          <Skeleton className="w-20 h-20 rounded-full -mt-12 ring-4 ring-[#161616]" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-full max-w-xs" />
          </div>
        </div>
        <div className="px-4 pb-4 space-y-2">
          <Skeleton className="h-2 w-full" />
        </div>
      </div>
      <PostSkeleton />
      <PostSkeleton />
    </div>
  );
}

export function FeedSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <PostSkeleton key={i} />
      ))}
    </div>
  );
}
