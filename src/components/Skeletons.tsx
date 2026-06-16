import React from 'react';

export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col bg-[#0a0a0a] rounded-xl overflow-hidden border border-white/5 animate-pulse">
      {/* Image Skeleton */}
      <div className="relative aspect-[4/5] bg-white/5" />
      
      {/* Details Skeleton */}
      <div className="px-5 pb-5 pt-4 flex flex-col flex-1 space-y-3">
        <div className="flex items-center justify-between">
          <div className="h-2 w-16 bg-white/10 rounded-full" />
          <div className="h-2 w-8 bg-white/10 rounded-full" />
        </div>
        
        <div className="h-5 w-3/4 bg-white/10 rounded-md" />
        <div className="h-5 w-1/2 bg-white/10 rounded-md mb-2" />
        
        <div className="mt-auto flex items-baseline gap-2 pt-2">
          <div className="h-6 w-20 bg-white/10 rounded-md" />
          <div className="h-4 w-12 bg-white/5 rounded-md" />
        </div>
      </div>
    </div>
  );
}

export function CategorySkeleton() {
  return (
    <div className="relative aspect-[3/4] rounded-xl overflow-hidden border border-white/5 animate-pulse bg-[#0a0a0a]">
      <div className="absolute inset-0 bg-gradient-to-t from-white/10 via-transparent to-transparent" />
      <div className="absolute bottom-6 left-6 h-6 w-32 bg-white/10 rounded-md" />
    </div>
  );
}
