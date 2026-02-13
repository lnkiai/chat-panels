"use client"

import { Eye, EyeOff, RotateCcw, Brain, Settings, X } from "lucide-react"
import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { PlaygroundSettings, ModelId } from "@/lib/types"
import { MODELS, isThinkingModel } from "@/lib/types"
import { cn } from "@/lib/utils"

interface HeaderBarProps {
  settings: PlaygroundSettings
  onUpdateApiKey: (key: string) => void
  onUpdateModel: (model: ModelId) => void
  onUpdatePanelCount: (count: number) => void
  onToggleThinking: (enabled: boolean) => void
  onClearAll: () => void
}

export function HeaderBar({
  settings,
  onUpdateApiKey,
  onUpdateModel,
  onUpdatePanelCount,
  onToggleThinking,
  onClearAll,
}: HeaderBarProps) {
  const [showApiKey, setShowApiKey] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const thinkingAvailable = isThinkingModel(settings.model)

  return (
    <TooltipProvider delayDuration={300}>
      <header className="border-b bg-background">
        {/* Desktop layout */}
        <div className="hidden md:flex items-center justify-between px-4 h-12">
          {/* Left: Logo */}
          <div className="flex items-center shrink-0">
            <h1 className="text-sm font-semibold tracking-tight text-foreground">
              Longcat AI Playground
            </h1>
          </div>

          {/* Center: Controls */}
          <div className="flex items-center gap-3">
            {/* API Key */}
            <div className="flex items-center gap-1.5">
              <Label
                htmlFor="api-key-desktop"
                className="text-xs text-muted-foreground shrink-0"
              >
                API Key
              </Label>
              <div className="relative">
                <Input
                  id="api-key-desktop"
                  type={showApiKey ? "text" : "password"}
                  value={settings.apiKey}
                  onChange={(e) => onUpdateApiKey(e.target.value)}
                  placeholder="sk-..."
                  className="h-7 w-36 pr-7 text-xs font-mono bg-background"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showApiKey ? "API Keyを非表示" : "API Keyを表示"}
                >
                  {showApiKey ? (
                    <EyeOff className="h-3 w-3" />
                  ) : (
                    <Eye className="h-3 w-3" />
                  )}
                </button>
              </div>
            </div>

            <div className="h-4 w-px bg-border" />

            {/* Model Selector */}
            <Select
              value={settings.model}
              onValueChange={(v) => onUpdateModel(v as ModelId)}
            >
              <SelectTrigger className="h-7 w-48 text-xs bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MODELS.map((m) => (
                  <SelectItem key={m.id} value={m.id} className="text-xs">
                    <div className="flex flex-col">
                      <span>{m.label}</span>
                      <span className="text-muted-foreground text-[10px]">
                        {m.description}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="h-4 w-px bg-border" />

            {/* Panel Count */}
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground mr-1">
                Panels
              </span>
              {[1, 2, 3, 4, 5].map((count) => (
                <button
                  key={count}
                  onClick={() => onUpdatePanelCount(count)}
                  className={cn(
                    "h-6 w-6 flex items-center justify-center text-xs rounded-sm border transition-colors",
                    settings.panelCount === count
                      ? "bg-foreground text-background border-foreground"
                      : "bg-background text-foreground border-border hover:bg-muted"
                  )}
                  aria-label={`${count}パネル`}
                  aria-pressed={settings.panelCount === count}
                >
                  {count}
                </button>
              ))}
            </div>

            <div className="h-4 w-px bg-border" />

            {/* Thinking Toggle */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className={cn(
                    "flex items-center gap-2",
                    !thinkingAvailable && "opacity-40"
                  )}
                >
                  <Brain className="h-3.5 w-3.5 text-muted-foreground" />
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
              <TooltipContent side="bottom" className="text-xs">
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
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClearAll}
                  className="h-7 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                >
                  <RotateCcw className="h-3 w-3" />
                  <span>Reset</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                全チャット履歴をクリア
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Mobile layout */}
        <div className="flex md:hidden items-center justify-between px-3 h-11">
          <h1 className="text-sm font-semibold tracking-tight text-foreground">
            Longcat AI Playground
          </h1>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearAll}
              className="h-8 w-8 p-0 text-muted-foreground"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span className="sr-only">Reset</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="h-8 w-8 p-0 text-muted-foreground"
            >
              {mobileMenuOpen ? (
                <X className="h-4 w-4" />
              ) : (
                <Settings className="h-4 w-4" />
              )}
              <span className="sr-only">設定</span>
            </Button>
          </div>
        </div>

        {/* Mobile dropdown panel */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t px-3 py-3 space-y-3 bg-background">
            {/* API Key */}
            <div className="space-y-1.5">
              <Label htmlFor="api-key-mobile" className="text-xs text-muted-foreground">
                API Key
              </Label>
              <div className="relative">
                <Input
                  id="api-key-mobile"
                  type={showApiKey ? "text" : "password"}
                  value={settings.apiKey}
                  onChange={(e) => onUpdateApiKey(e.target.value)}
                  placeholder="sk-..."
                  className="h-8 pr-8 text-xs font-mono bg-background"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
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

            {/* Model */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Model</Label>
              <Select
                value={settings.model}
                onValueChange={(v) => onUpdateModel(v as ModelId)}
              >
                <SelectTrigger className="h-8 w-full text-xs bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MODELS.map((m) => (
                    <SelectItem key={m.id} value={m.id} className="text-xs">
                      <div className="flex flex-col">
                        <span>{m.label}</span>
                        <span className="text-muted-foreground text-[10px]">
                          {m.description}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Panels + Thinking row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground mr-1">Panels</span>
                {[1, 2, 3].map((count) => (
                  <button
                    key={count}
                    onClick={() => onUpdatePanelCount(count)}
                    className={cn(
                      "h-7 w-7 flex items-center justify-center text-xs rounded-sm border transition-colors",
                      settings.panelCount === count
                        ? "bg-foreground text-background border-foreground"
                        : "bg-background text-foreground border-border hover:bg-muted"
                    )}
                    aria-label={`${count}パネル`}
                    aria-pressed={settings.panelCount === count}
                  >
                    {count}
                  </button>
                ))}
              </div>

              <div
                className={cn(
                  "flex items-center gap-2",
                  !thinkingAvailable && "opacity-40"
                )}
              >
                <Brain className="h-3.5 w-3.5 text-muted-foreground" />
                <Label
                  htmlFor="thinking-toggle-mobile"
                  className="text-xs text-muted-foreground cursor-pointer"
                >
                  Thinking
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
        )}
      </header>
    </TooltipProvider>
  )
}
