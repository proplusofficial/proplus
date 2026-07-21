import React from 'react';

export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Welcome banner skeleton */}
      <div className="h-16 bg-gray-200 dark:bg-zinc-800 rounded-3xl animate-pulse-fast w-2/3" />
      
      {/* Earnings balance card skeleton */}
      <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 p-6 rounded-3xl space-y-4">
        <div className="h-4 bg-gray-200 dark:bg-zinc-800 rounded animate-pulse-fast w-24" />
        <div className="h-8 bg-gray-200 dark:bg-zinc-800 rounded animate-pulse-fast w-48" />
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100 dark:border-zinc-800">
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 dark:bg-zinc-800 rounded animate-pulse-fast w-16" />
            <div className="h-5 bg-gray-200 dark:bg-zinc-800 rounded animate-pulse-fast w-24" />
          </div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 dark:bg-zinc-800 rounded animate-pulse-fast w-16" />
            <div className="h-5 bg-gray-200 dark:bg-zinc-800 rounded animate-pulse-fast w-24" />
          </div>
        </div>
      </div>

      {/* Statistics grids skeleton */}
      <div className="grid grid-cols-2 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 p-4 rounded-2xl space-y-3">
            <div className="flex justify-between items-center">
              <div className="h-3 bg-gray-200 dark:bg-zinc-800 rounded animate-pulse-fast w-16" />
              <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-zinc-800 animate-pulse-fast" />
            </div>
            <div className="h-6 bg-gray-200 dark:bg-zinc-800 rounded animate-pulse-fast w-12" />
          </div>
        ))}
      </div>

      {/* Chart card skeleton */}
      <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 p-5 rounded-3xl space-y-4">
        <div className="h-4 bg-gray-200 dark:bg-zinc-800 rounded animate-pulse-fast w-32" />
        <div className="h-40 bg-gray-100 dark:bg-zinc-800/50 rounded-2xl animate-pulse-fast" />
      </div>
    </div>
  );
};

export const OrdersSkeleton: React.FC = () => {
  return (
    <div className="space-y-4">
      <div className="h-10 bg-gray-200 dark:bg-zinc-800 rounded-xl animate-pulse-fast w-full" />
      <div className="flex gap-2">
        <div className="h-8 bg-gray-200 dark:bg-zinc-800 rounded-lg animate-pulse-fast w-16" />
        <div className="h-8 bg-gray-200 dark:bg-zinc-800 rounded-lg animate-pulse-fast w-20" />
        <div className="h-8 bg-gray-200 dark:bg-zinc-800 rounded-lg animate-pulse-fast w-24" />
      </div>
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 p-5 rounded-2xl space-y-3">
          <div className="flex justify-between">
            <div className="h-4 bg-gray-200 dark:bg-zinc-800 rounded animate-pulse-fast w-32" />
            <div className="h-6 bg-gray-200 dark:bg-zinc-800 rounded-full animate-pulse-fast w-16" />
          </div>
          <div className="space-y-1.5">
            <div className="h-3 bg-gray-200 dark:bg-zinc-800 rounded animate-pulse-fast w-48" />
            <div className="h-3 bg-gray-200 dark:bg-zinc-800 rounded animate-pulse-fast w-36" />
          </div>
          <div className="h-3 bg-gray-200 dark:bg-zinc-800 rounded animate-pulse-fast w-24 pt-2" />
        </div>
      ))}
    </div>
  );
};

export const ProfileSkeleton: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center py-6 space-y-3">
        <div className="w-20 h-20 bg-gray-200 dark:bg-zinc-800 rounded-full animate-pulse-fast" />
        <div className="h-5 bg-gray-200 dark:bg-zinc-800 rounded animate-pulse-fast w-36" />
        <div className="h-3 bg-gray-200 dark:bg-zinc-800 rounded animate-pulse-fast w-24" />
      </div>
      <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 p-5 rounded-2xl space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex justify-between items-center">
            <div className="h-3 bg-gray-200 dark:bg-zinc-800 rounded animate-pulse-fast w-20" />
            <div className="h-4 bg-gray-200 dark:bg-zinc-800 rounded animate-pulse-fast w-36" />
          </div>
        ))}
      </div>
    </div>
  );
};
