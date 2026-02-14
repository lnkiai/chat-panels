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
    <div className="flex flex-col h-dvh bg-background">
      {/* Header skeleton */}
      <div className="shrink-0 px-3 pt-3 md:px-4 md:pt-4">
        <div className="bg-card/80 border border-border/60 rounded-2xl">
          <div className="flex items-center justify-between px-5 h-14">
            {/* Left logo */}
            <div className="flex items-center gap-2.5">
              <Bone className="h-7 w-7 rounded-xl" />
              <Bone className="h-3.5 w-28" />
            </div>

            {/* Center controls */}
            <div className="hidden md:flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Bone className="h-3 w-12" />
                <Bone className="h-8 w-44 rounded-xl" />
              </div>
              <div className="h-5 w-px bg-border/50" />
              <div className="flex items-center gap-1.5">
                <Bone className="h-3 w-10" />
                {[1, 2, 3, 4, 5].map((i) => (
                  <Bone key={i} className="h-7 w-7 rounded-lg" />
                ))}
              </div>
              <div className="h-5 w-px bg-border/50" />
              <div className="flex items-center gap-2">
                <Bone className="h-3.5 w-3.5 rounded-full" />
                <Bone className="h-3 w-14" />
                <Bone className="h-5 w-9 rounded-full" />
              </div>
            </div>

            {/* Right */}
            <Bone className="h-8 w-20 rounded-xl" />
          </div>
        </div>
      </div>

      {/* Grid skeleton (2 panels) */}
      <main className="flex-1 min-h-0 overflow-hidden p-3 md:p-4 pt-2 md:pt-3">
        <div className="flex h-full gap-4">
          {[0, 1].map((i) => (
            <div
              key={i}
              className="flex-1 min-w-0 h-full bg-card rounded-2xl border border-border/60 overflow-hidden flex flex-col"
            >
              {/* Panel header */}
              <div className="shrink-0 px-3.5 py-3">
                <div className="flex items-center gap-2">
                  <Bone className="h-3 w-3 rounded-sm" />
                  <Bone className="h-3 w-3 rounded-sm" />
                  <Bone className="h-3.5 w-16" />
                </div>
              </div>

              {/* System prompt area */}
              <div className="px-3.5 pb-3 flex flex-col gap-1.5">
                <Bone className="h-[80px] w-full rounded-xl" />
                <div className="flex items-center gap-2 px-1">
                  <Bone className="h-5 w-14 rounded-md" />
                  <Bone className="h-3 w-px" />
                  <Bone className="h-3 w-20" />
                </div>
              </div>

              <div className="h-px bg-border/40 mx-3" />

              {/* Chat area */}
              <div className="flex-1 flex items-center justify-center">
                <Bone className="h-3 w-40" />
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Input skeleton */}
      <div className="shrink-0 px-4 pb-4 pt-2 md:px-8">
        <div className="max-w-3xl mx-auto">
          <Bone className="h-[52px] w-full rounded-[28px]" />
        </div>
      </div>
    </div>
  )
}
