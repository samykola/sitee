import { PostSkeleton, Skeleton } from '@/components/ui/Skeleton';

export default function Loading() {
  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <PostSkeleton />
      <div className="card p-4 space-y-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-8 w-24" />
      </div>
    </div>
  );
}
