"use client"

import { cn } from "@/lib/utils"

function Bone({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "bg-border/50 rounded-xl animate-skeleton-pulse",
        className
      )}
    />
  )
}

export function PlaygroundSkeleton() {
  return (
    <div className="flex flex-col h-dvh bg-background relative">
      {/* Header skeleton */}
      <div className="shrink-0 px-3 pt-3 md:px-4 md:pt-4 z-30 relative">
        <div className="bg-card/80 border border-border/60 rounded-2xl">
          {/* Desktop header */}
          <div className="hidden md:flex items-center justify-between px-5 h-14">
            <div className="flex items-center gap-2.5">
              <Bone className="h-7 w-7 rounded-xl" />
              <Bone className="h-3.5 w-28" />
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Bone className="h-3 w-12" />
                <Bone className="h-8 w-44 rounded-xl" />
              </div>
              <div className="h-5 w-px bg-border/50" />
              <div className="flex items-center gap-2">
                <Bone className="h-3 w-10" />
                <Bone className="h-7 w-7 rounded-lg" />
                <Bone className="h-3.5 w-5" />
                <Bone className="h-7 w-7 rounded-lg" />
              </div>
            </div>
            <Bone className="h-8 w-8 rounded-xl" />
          </div>
          {/* Mobile header */}
          <div className="flex md:hidden items-center justify-between px-3 h-12">
            <div className="flex items-center gap-2">
              <Bone className="h-6 w-6 rounded-lg" />
              <Bone className="h-3.5 w-20" />
            </div>
            <div className="flex items-center gap-1">
              <Bone className="h-8 w-8 rounded-xl" />
              <Bone className="h-8 w-8 rounded-xl" />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile: Full screen chat skeleton (behind header + input) */}
      <div className="md:hidden absolute inset-0 z-0 flex flex-col items-center justify-center gap-5 px-6">
        <Bone className="h-10 w-3/4 rounded-2xl self-end" />
        <Bone className="h-24 w-full rounded-2xl self-start" />
        <Bone className="h-10 w-2/3 rounded-2xl self-end" />
        <Bone className="h-16 w-full rounded-2xl self-start" />
      </div>
      {/* Mobile spacer */}
      <div className="md:hidden flex-1" />

      {/* Desktop: Panel grid skeleton */}
      <main className="flex-1 min-h-0 overflow-hidden p-4 pt-3 hidden md:block">
        <div className="flex h-full gap-4">
          {[0, 1].map((i) => (
            <div
              key={i}
              className="flex-1 min-w-0 h-full bg-card rounded-2xl border border-border/60 overflow-hidden flex flex-col"
            >
              <div className="shrink-0 px-3.5 py-3">
                <div className="flex items-center gap-2">
                  <Bone className="h-3 w-3 rounded-sm" />
                  <Bone className="h-3 w-3 rounded-sm" />
                  <Bone className="h-3.5 w-16" />
                  <div className="flex-1" />
                  <Bone className="h-2.5 w-32" />
                </div>
              </div>
              <div className="h-px bg-border/40 mx-3" />
              <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6">
                <Bone className="h-8 w-3/4 self-end rounded-2xl" />
                <Bone className="h-20 w-full self-start rounded-xl" />
                <Bone className="h-8 w-2/3 self-end rounded-2xl" />
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Input skeleton */}
      <div className="shrink-0 px-4 pb-4 pt-2 md:pt-2 relative z-20">
        <div className="bg-gradient-to-t from-background via-background/90 to-transparent md:bg-none pt-6 md:pt-0">
          <div className="max-w-3xl mx-auto">
            <div className="bg-card border-2 border-border rounded-[28px] px-6 py-4">
              <Bone className="h-5 w-40 mb-3" />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Bone className="h-8 w-28 rounded-xl" />
                  <Bone className="h-8 w-20 rounded-xl md:hidden" />
                </div>
                <Bone className="h-10 w-10 rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
