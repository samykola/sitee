import { Skeleton, FeedSkeleton } from '@/components/ui/Skeleton';

export default function Loading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-32" />
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
      <FeedSkeleton count={2} />
    </div>
  );
}
