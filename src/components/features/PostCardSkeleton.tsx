import * as React from "react";

import { GlassCard } from "../ui/GlassCard";

export type PostCardSkeletonProps = {
  className?: string;
};

export function PostCardSkeleton({ className }: PostCardSkeletonProps) {
  return (
    <GlassCard className={"overflow-hidden " + (className ?? "")}> 
      <div className="aspect-[16/9] w-full rounded-none skeleton" />

      <div className="p-6 md:p-8 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="h-6 w-24 rounded-full skeleton" />
          <div className="h-4 w-16 rounded skeleton" />
        </div>

        <div className="space-y-2">
          <div className="h-7 w-4/5 rounded skeleton" />
          <div className="h-4 w-full rounded skeleton" />
          <div className="h-4 w-5/6 rounded skeleton" />
        </div>

        <div className="flex items-center gap-3 pt-2">
          <div className="h-9 w-9 rounded-full skeleton" />
          <div className="min-w-0">
            <div className="text-sm font-bold">King Bloggers</div>
            <div className="h-3 w-20 rounded skeleton mt-1" />
          </div>
        </div>
      </div>
    </GlassCard>
  );
}
