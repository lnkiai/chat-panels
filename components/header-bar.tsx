"use client"

import { Eye, EyeOff, RotateCcw, Brain, Settings, X } from "lucide-react"
import Image from "next/image"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { PlaygroundSettings } from "@/lib/types"
import { isThinkingModel } from "@/lib/types"
import { cn } from "@/lib/utils"

interface HeaderBarProps {
  settings: PlaygroundSettings
  onUpdateApiKey: (key: string) => void
  onUpdatePanelCount: (count: number) => void
  onToggleThinking: (enabled: boolean) => void
  onClearAll: () => void
}

export function HeaderBar({
  settings,
  onUpdateApiKey,
  onUpdatePanelCount,
  onToggleThinking,
  onClearAll,
}: HeaderBarProps) {
  const [showApiKey, setShowApiKey] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const thinkingAvailable = isThinkingModel(settings.model)

  return (
    <TooltipProvider delayDuration={300}>
      {/* Floating header wrapper with spacing */}
      <div className="shrink-0 px-3 pt-3 pb-0 md:px-4 md:pt-4 md:pb-0 z-30 relative">
        <header className="bg-card/80 backdrop-blur-xl border border-border/60 rounded-2xl">
          {/* Desktop layout */}
          <div className="hidden md:flex items-center justify-between px-5 h-14">
            {/* Left: Logo */}
            <div className="flex items-center shrink-0">
              <div className="h-7 w-7 rounded-xl bg-card flex items-center justify-center mr-2.5 border border-border/60 overflow-hidden">
                <Image
                  src="/images/longcat-color.svg"
                  alt="Longcat"
                  width={20}
                  height={20}
                  className="h-5 w-5"
                />
              </div>
            <h1 className="text-sm font-heading tracking-tight text-foreground">
              Longcat AI Playground
            </h1>
          </div>

          {/* Center: Controls */}
            <div className="flex items-center gap-4">
              {/* API Key */}
              <div className="flex items-center gap-2">
                <Label
                  htmlFor="api-key-desktop"
                  className="text-xs text-muted-foreground shrink-0"
                >
                  API Key
                </Label>
                <div className="relative flex items-center">
                  <Input
                    id="api-key-desktop"
                    type={showApiKey ? "text" : "password"}
                    value={settings.apiKey}
                    onChange={(e) => onUpdateApiKey(e.target.value)}
                    placeholder="ak-..."
                    className="h-8 w-44 pr-8 text-xs font-mono rounded-xl bg-background/60 border-border/60 focus-visible:ring-primary/30"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-2.5 text-muted-foreground hover:text-primary transition-colors"
                    aria-label={showApiKey ? "API Keyを非表示" : "API Keyを表示"}
                  >
                    {showApiKey ? (
                      <EyeOff className="h-3.5 w-3.5" />
                    ) : (
                      <Eye className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="h-5 w-px bg-border/50" />

              {/* Panel Count */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground mr-0.5">
                  Panels
                </span>
                {[1, 2, 3, 4, 5].map((count) => (
                  <motion.button
                    key={count}
                    onClick={() => onUpdatePanelCount(count)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    className={cn(
                      "h-7 w-7 flex items-center justify-center text-xs font-medium rounded-lg border transition-colors",
                      settings.panelCount === count
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background/60 text-foreground border-border/60 hover:border-primary/40 hover:text-primary"
                    )}
                    aria-label={`${count}パネル`}
                    aria-pressed={settings.panelCount === count}
                  >
                    {count}
                  </motion.button>
                ))}
              </div>

              <div className="h-5 w-px bg-border/50" />

              {/* Thinking Toggle */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className={cn(
                      "flex items-center gap-2 transition-opacity",
                      !thinkingAvailable && "opacity-35"
                    )}
                  >
                    <Brain
                      className={cn(
                        "h-3.5 w-3.5 transition-colors",
                        settings.enableThinking && thinkingAvailable
                          ? "text-primary"
                          : "text-muted-foreground"
                      )}
                    />
                    <Label
                      htmlFor="thinking-toggle-desktop"
                      className="text-xs text-muted-foreground cursor-pointer"
                    >
                      Thinking
                    </Label>
                    <Switch
                      id="thinking-toggle-desktop"
                      checked={settings.enableThinking && thinkingAvailable}
                      onCheckedChange={onToggleThinking}
                      disabled={!thinkingAvailable}
                      className="scale-85"
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs rounded-xl">
                  {thinkingAvailable
                    ? "enable_thinking パラメータを有効化"
                    : "Thinking モデルを選択してください"}
                </TooltipContent>
              </Tooltip>
            </div>

            {/* Right: Reset */}
            <div className="shrink-0">
              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.button
                    onClick={onClearAll}
                    whileHover={{ scale: 1.05, rotate: -15 }}
                    whileTap={{ scale: 0.9, rotate: -90 }}
                    transition={{ type: "spring", stiffness: 300, damping: 15 }}
                    className="inline-flex items-center gap-1.5 px-3 h-8 rounded-xl text-xs text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Reset</span>
                  </motion.button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs rounded-xl">
                  全チャット履歴をクリア
                </TooltipContent>
              </Tooltip>
            </div>
          </div>

          {/* Mobile layout */}
          <div className="flex md:hidden items-center justify-between px-3 h-12">
            <div className="flex items-center">
              <div className="h-6 w-6 rounded-lg bg-card flex items-center justify-center mr-2 border border-border/60 overflow-hidden">
                <Image
                  src="/images/longcat-color.svg"
                  alt="Longcat"
                  width={16}
                  height={16}
                  className="h-4 w-4"
                />
              </div>
            <h1 className="text-sm font-heading tracking-tight text-foreground">
              Longcat AI
            </h1>
            </div>
            <div className="flex items-center gap-0.5">
              <motion.button
                onClick={onClearAll}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.85, rotate: -90 }}
                transition={{ type: "spring", stiffness: 300, damping: 15 }}
                className="h-8 w-8 flex items-center justify-center rounded-xl text-muted-foreground hover:text-primary transition-colors"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span className="sr-only">Reset</span>
              </motion.button>
              <motion.button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.85 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                className={cn(
                  "h-8 w-8 flex items-center justify-center rounded-xl transition-colors",
                  mobileMenuOpen
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-primary"
                )}
              >
                {mobileMenuOpen ? (
                  <X className="h-4 w-4" />
                ) : (
                  <Settings className="h-4 w-4" />
                )}
                <span className="sr-only">設定</span>
              </motion.button>
            </div>
          </div>

          {/* Mobile dropdown panel */}
          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 28 }}
                className="md:hidden overflow-hidden border-t border-border/40"
              >
                <div className="px-4 py-3 space-y-3">
                  {/* API Key */}
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="api-key-mobile"
                      className="text-xs text-muted-foreground"
                    >
                      API Key
                    </Label>
                    <div className="relative flex items-center">
                      <Input
                        id="api-key-mobile"
                        type={showApiKey ? "text" : "password"}
                        value={settings.apiKey}
                        onChange={(e) => onUpdateApiKey(e.target.value)}
                        placeholder="ak-..."
                        className="h-9 pr-9 text-xs font-mono rounded-xl bg-background/60 border-border/60 focus-visible:ring-primary/30"
                      />
                      <button
                        type="button"
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="absolute right-2.5 text-muted-foreground hover:text-primary transition-colors"
                        aria-label={
                          showApiKey ? "API Keyを非表示" : "API Keyを表示"
                        }
                      >
                        {showApiKey ? (
                          <EyeOff className="h-3.5 w-3.5" />
                        ) : (
                          <Eye className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Panels + Thinking row */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-muted-foreground mr-1">
                        Panels
                      </span>
                      {[1, 2, 3, 4, 5].map((count) => (
                        <motion.button
                          key={count}
                          onClick={() => onUpdatePanelCount(count)}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          transition={{
                            type: "spring",
                            stiffness: 400,
                            damping: 17,
                          }}
                          className={cn(
                            "h-7 w-7 flex items-center justify-center text-xs font-medium rounded-lg border transition-colors",
                            settings.panelCount === count
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-background/60 text-foreground border-border/60 hover:border-primary/40"
                          )}
                          aria-label={`${count}パネル`}
                          aria-pressed={settings.panelCount === count}
                        >
                          {count}
                        </motion.button>
                      ))}
                    </div>

                    <div
                      className={cn(
                        "flex items-center gap-2 transition-opacity",
                        !thinkingAvailable && "opacity-35"
                      )}
                    >
                      <Brain
                        className={cn(
                          "h-3.5 w-3.5 transition-colors",
                          settings.enableThinking && thinkingAvailable
                            ? "text-primary"
                            : "text-muted-foreground"
                        )}
                      />
                      <Label
                        htmlFor="thinking-toggle-mobile"
                        className="text-xs text-muted-foreground cursor-pointer"
                      >
                        Think
                      </Label>
                      <Switch
                        id="thinking-toggle-mobile"
                        checked={settings.enableThinking && thinkingAvailable}
                        onCheckedChange={onToggleThinking}
                        disabled={!thinkingAvailable}
                        className="scale-90"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </header>
      </div>
    </TooltipProvider>
  )
}
