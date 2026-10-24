import { FeedSkeleton } from '@/components/ui/Skeleton';

export default function Loading() {
  return (
    <div className="space-y-4">
      <div className="card p-1 h-12" />
      <FeedSkeleton count={3} />
    </div>
  );
}
