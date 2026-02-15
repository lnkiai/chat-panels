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
    <div className="flex flex-col h-dvh bg-background relative overflow-hidden">
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

      {/* Panels Skeleton (Desktop: 2 columns, Mobile: 1 centered) */}
      <div className="flex-1 w-full px-0 md:px-0 pt-0 pb-0 overflow-hidden relative z-0">
        <div className="h-full w-full flex items-start">
          {/* Panel 1 */}
          <div className="flex-1 h-full border-r border-border/30 p-4 pb-32 flex flex-col gap-6 opacity-40 md:opacity-100">
            <div className="flex flex-col gap-3 mt-10">
              <Bone className="h-10 w-3/4 self-end rounded-2xl rounded-tr-sm" />
              <Bone className="h-24 w-full self-start rounded-2xl rounded-tl-sm" />
              <Bone className="h-8 w-1/2 self-end rounded-2xl rounded-tr-sm" />
            </div>
          </div>
          {/* Panel 2 (Desktop only) - Last one has no border-r */}
          <div className="hidden md:flex flex-1 h-full p-4 pb-32 flex-col gap-6">
            <div className="flex flex-col gap-3 mt-20">
              <Bone className="h-12 w-2/3 self-end rounded-2xl rounded-tr-sm" />
              <Bone className="h-32 w-full self-start rounded-2xl rounded-tl-sm" />
            </div>
          </div>
        </div>
      </div>

      {/* Input skeleton (Overlay) */}
      <div className="absolute bottom-0 left-0 right-0 z-30 pt-16 pb-6 px-4 bg-gradient-to-t from-background from-45% via-background/90 to-transparent">
        <div className="max-w-3xl mx-auto">
          <div className="bg-card border-2 border-border rounded-[28px] px-6 py-4 flex items-center justify-between shadow-sm">
            <Bone className="h-5 w-40" />
            <Bone className="h-9 w-9 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  )
}
