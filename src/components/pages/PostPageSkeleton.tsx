import * as React from "react";

import { GlassCard } from "../ui/GlassCard";

export function PostPageSkeleton() {
  return (
    <main className="min-h-screen py-14">
      <div className="mx-auto max-w-4xl px-4">
        <GlassCard className="p-6 md:p-10 space-y-6">
          <div className="text-xs font-mono text-foreground/50">King Bloggers</div>
          <div className="h-10 w-4/5 rounded skeleton" />
          <div className="h-4 w-40 rounded skeleton" />
          <div className="aspect-[16/9] w-full rounded-xl skeleton" />
          <div className="space-y-3">
            <div className="h-4 w-full rounded skeleton" />
            <div className="h-4 w-11/12 rounded skeleton" />
            <div className="h-4 w-10/12 rounded skeleton" />
            <div className="h-4 w-9/12 rounded skeleton" />
          </div>
        </GlassCard>
      </div>
    </main>
  );
}
