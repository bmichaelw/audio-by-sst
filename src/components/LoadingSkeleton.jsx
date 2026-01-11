import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export function TrackCardSkeleton() {
  return (
    <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'hsl(var(--border))', backgroundColor: 'hsl(var(--card))' }}>
      <Skeleton className="w-full aspect-square" style={{ backgroundColor: 'hsl(var(--muted))' }} />
      <div className="p-4 space-y-3">
        <Skeleton className="h-5 w-3/4" style={{ backgroundColor: 'hsl(var(--muted))' }} />
        <Skeleton className="h-4 w-full" style={{ backgroundColor: 'hsl(var(--muted))' }} />
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-16 rounded-full" style={{ backgroundColor: 'hsl(var(--muted))' }} />
          <Skeleton className="h-5 w-20 rounded-full" style={{ backgroundColor: 'hsl(var(--muted))' }} />
        </div>
      </div>
    </div>
  );
}

export function TrackListSkeleton({ count = 8 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <TrackCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function FiltersSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-12 w-full rounded-xl" style={{ backgroundColor: 'hsl(var(--muted))' }} />
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-32 rounded-lg" style={{ backgroundColor: 'hsl(var(--muted))' }} />
        <Skeleton className="h-6 w-20 rounded-full" style={{ backgroundColor: 'hsl(var(--muted))' }} />
        <Skeleton className="h-6 w-24 rounded-full" style={{ backgroundColor: 'hsl(var(--muted))' }} />
      </div>
    </div>
  );
}

export function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="border rounded-lg p-4" style={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
          <Skeleton className="h-10 w-10 rounded-lg mb-3" style={{ backgroundColor: 'hsl(var(--muted))' }} />
          <Skeleton className="h-3 w-20 mb-2" style={{ backgroundColor: 'hsl(var(--muted))' }} />
          <Skeleton className="h-6 w-12" style={{ backgroundColor: 'hsl(var(--muted))' }} />
        </div>
      ))}
    </div>
  );
}