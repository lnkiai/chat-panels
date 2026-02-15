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
      <div className="shrink-0 px-3 pt-3 md:px-4 md:pt-4 z-20 relative">
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

      {/* Full screen chat skeleton (behind header + input) */}
      <div className="absolute inset-0 z-0 flex flex-col items-center justify-center gap-5 px-6 md:px-16">
        <Bone className="h-10 w-3/4 md:w-1/3 rounded-2xl self-end" />
        <Bone className="h-24 w-full md:w-2/3 rounded-2xl self-start" />
        <Bone className="h-10 w-2/3 md:w-1/4 rounded-2xl self-end" />
        <Bone className="h-16 w-full md:w-1/2 rounded-2xl self-start" />
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Input skeleton */}
      <div className="shrink-0 relative z-20 bg-gradient-to-t from-background via-background/90 to-transparent pt-8 md:pt-6">
        <div className="px-4 pb-4 max-w-3xl mx-auto">
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
  )
}
