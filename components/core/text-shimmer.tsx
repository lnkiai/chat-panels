"use client"

import { cn } from "@/lib/utils"
import { type CSSProperties, type ReactNode } from "react"

interface TextShimmerProps {
  children: ReactNode
  className?: string
  duration?: number
  spread?: number
}

export function TextShimmer({
  children,
  className,
  duration = 2,
  spread = 2,
}: TextShimmerProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 bg-clip-text text-transparent",
        "bg-[length:250%_100%] bg-[linear-gradient(90deg,transparent,hsl(var(--primary)),transparent)] animate-text-shimmer",
        className
      )}
      style={
        {
          "--shimmer-duration": `${duration}s`,
          "--shimmer-spread": spread,
          animationDuration: `${duration}s`,
        } as CSSProperties
      }
    >
      {children}
    </span>
  )
}
