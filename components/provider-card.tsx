"use client"

import Image from "next/image"
import { motion } from "framer-motion"
import { Settings, Check, ExternalLink } from "lucide-react"
import type { ProviderConfig } from "@/lib/ai-providers/types"
import { cn } from "@/lib/utils"

interface ProviderCardProps {
    provider: ProviderConfig
    isActive: boolean
    hasApiKey: boolean
    onManage: () => void
    onActivate: () => void
}

export function ProviderCard({
    provider,
    isActive,
    hasApiKey,
    onManage,
    onActivate,
}: ProviderCardProps) {
    return (
        <div
            className={cn(
                "relative rounded-xl border p-4 transition-all duration-300",
                isActive
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border/60 bg-card hover:border-border/80"
            )}
        >
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className={cn(
                        "h-10 w-10 flex items-center justify-center rounded-lg overflow-hidden border",
                        isActive ? "bg-background border-primary/20" : "bg-muted/30 border-border/40"
                    )}>
                        {/* Using Next.js Image assuming public assets are present */}
                        <Image
                            src={provider.iconPath}
                            alt={provider.name}
                            width={24}
                            height={24}
                            className="object-contain"
                            onError={(e) => {
                                // Fallback if image fails
                                e.currentTarget.style.display = 'none'
                            }}
                        />
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                            {provider.name}
                            {isActive && (
                                <span className="inline-flex items-center text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-medium">
                                    Active
                                </span>
                            )}
                        </h3>
                        <p className="text-[11px] text-muted-foreground line-clamp-1">
                            {provider.description || "AI Model Provider"}
                        </p>
                    </div>
                </div>

                {/* Status Indicator */}
                <div className="flex flex-col items-end gap-1">
                    {hasApiKey ? (
                        <div className="flex items-center gap-1 text-[10px] text-green-600 bg-green-500/10 px-1.5 py-0.5 rounded-md">
                            <Check className="h-3 w-3" />
                            <span>Configured</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded-md">
                            <span>Not Configured</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-2 mt-auto">
                <button
                    onClick={onManage}
                    className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-lg text-xs font-medium border border-border/60 bg-background/50 hover:bg-muted/50 transition-colors"
                >
                    <Settings className="h-3.5 w-3.5" />
                    <span>Configure</span>
                </button>

                {!isActive && (
                    <button
                        onClick={onActivate}
                        className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-lg text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                    >
                        <span>Set Active</span>
                    </button>
                )}
            </div>
        </div>
    )
}
