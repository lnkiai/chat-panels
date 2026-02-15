"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { HeaderBar } from "@/components/header-bar"
import { ChatPanel } from "@/components/chat-panel"
import { MessageInput } from "@/components/message-input"
import { PlaygroundSkeleton } from "@/components/playground-skeleton"
import { usePlayground } from "@/hooks/use-playground"
import { useTemplates } from "@/hooks/use-templates"
import {
  getAllProviders
} from "@/lib/ai-providers/registry"
import { cn } from "@/lib/utils"
import { useMemo } from "react"

export default function PlaygroundPage() {
  const {
    settings,
    panels,
    draft,
    setDraft,
    hydrated,
    updateApiKey,
    updateModel,
    updatePanelCount,
    updatePanelTitle,
    updateSystemPrompt,
    clearAllChats,
    clearApiKey,
    resetSystemPrompts,
    clearEverything,
    sendMessage,
    updatePanelConfig,
    updateActiveProvider,
    updateProviderConfig,
    updateProviderModels,
    togglePanelMode,
  } = usePlayground()

  const templateStore = useTemplates()

  const isAnyPanelLoading = panels.some((p) => p.isLoading)
  const count = settings.panelCount

  // Check if current provider has API key
  const currentProviderConfig = settings.providerConfigs?.[settings.activeProviderId]
  const hasApiKey = !!currentProviderConfig?.apiKey

  // Get available models for active provider
  const activeProvider = getAllProviders().find(p => p.id === settings.activeProviderId)
  const availableModels = (settings.providerConfigs?.[settings.activeProviderId]?.models || activeProvider?.models || []).map(m => ({
    id: m.id,
    label: m.label || m.id, // Ensure label exists
    description: m.description
  }))

  const effectiveProviders = useMemo(() => {
    return getAllProviders().map(p => {
      const dynamic = settings.providerConfigs?.[p.id]?.models
      return {
        id: p.id,
        name: p.name,
        models: (dynamic && dynamic.length > 0 ? dynamic : p.models).map(m => ({
          id: m.id,
          label: m.label || m.id,
          description: m.description
        }))
      }
    })
  }, [settings.providerConfigs])

  /* ---- Mobile scroll-snap navigation ---- */
  const [activeIndex, setActiveIndex] = useState(0)
  const [mobilePromptOpen, setMobilePromptOpen] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (activeIndex >= count) setActiveIndex(Math.max(0, count - 1))
  }, [count, activeIndex])

  const handleScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const w = el.clientWidth
    if (w === 0) return
    const idx = Math.round(el.scrollLeft / w)
    if (idx !== activeIndex) setMobilePromptOpen(false)
    setActiveIndex(idx)
  }, [activeIndex])

  const scrollToMobilePanel = useCallback(
    (idx: number) => {
      const el = scrollRef.current
      if (!el) return
      const clamped = Math.max(0, Math.min(count - 1, idx))
      el.scrollTo({ left: clamped * el.clientWidth, behavior: "smooth" })
      setActiveIndex(clamped)
    },
    [count]
  )

  // How many panels fit on desktop (always 1 on mobile via CSS)
  const visibleDesktopPanels = Math.min(count, 3)

  // Mobile dots visible only when >1 panel on small screens
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])
  const showMobileDots = isMobile && count > 1

  if (!hydrated) {
    return <PlaygroundSkeleton />
  }

  const currentMobilePanel = panels[activeIndex] ?? panels[0]

  return (
    <div className="flex h-dvh bg-background overflow-hidden relative flex-col">
      {/* Floating Header */}
      <div className="shrink-0 relative z-20">
        <HeaderBar
          settings={settings}
          onUpdateApiKey={updateApiKey}
          onUpdatePanelCount={updatePanelCount}
          onClearChats={clearAllChats}
          onClearApiKey={clearApiKey}
          onResetPrompts={resetSystemPrompts}
          onClearEverything={clearEverything}
          setMobilePromptOpen={setMobilePromptOpen}
          templates={templateStore.templates}
          onApplyTemplate={
            currentMobilePanel
              ? (content: string) => updateSystemPrompt(currentMobilePanel.id, content)
              : undefined
          }
          templateStore={templateStore}
          updateActiveProvider={updateActiveProvider}
          updateProviderConfig={updateProviderConfig}
          updateProviderModels={updateProviderModels}
          togglePanelMode={togglePanelMode}
        />
      </div>

      {/* ============ PANELS ============ */}
      <div className="flex-1 relative min-h-0">
        <div className="absolute inset-0">
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="h-full w-full flex overflow-x-auto overflow-y-hidden snap-x snap-mandatory no-scrollbar"
          >
            {panels.map((panel, idx) => (
              <div
                key={panel.id}
                className={cn(
                  "h-full shrink-0 snap-start snap-always",
                  "w-screen",
                  "md:w-[var(--panel-width)]"
                )}
                style={{
                  "--panel-width": `${100 / visibleDesktopPanels}%`,
                } as React.CSSProperties}
              >
                <ChatPanel
                  panel={panel}
                  panelIndex={idx}
                  totalPanels={count}
                  onUpdateSystemPrompt={(prompt) =>
                    updateSystemPrompt(panel.id, prompt)
                  }
                  onUpdateTitle={(title) =>
                    updatePanelTitle(panel.id, title)
                  }
                  onUpdateConfig={(config) => updatePanelConfig(panel.id, config)}
                  enablePanelMode={settings.enablePanelMode}
                  templates={templateStore.templates}
                  onApplyTemplate={(content) =>
                    updateSystemPrompt(panel.id, content)
                  }
                  availableProviders={effectiveProviders}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ============ MOBILE NAV DOTS ============ */}
      {showMobileDots && (
        <div className="fixed bottom-28 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-30 pointer-events-none">
          <div className="pointer-events-auto flex items-center gap-1.5">
            {panels.map((_, idx) => (
              <button
                key={idx}
                onClick={() => scrollToMobilePanel(idx)}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  idx === activeIndex
                    ? "w-5 bg-primary"
                    : "w-1.5 bg-border hover:bg-muted-foreground/40"
                )}
              />
            ))}
          </div>
        </div>
      )}

      {/* Global Input (Overlay) */}
      <div className="absolute bottom-0 left-0 right-0 z-20 pointer-events-none">
        <MessageInput
          onSend={sendMessage}
          disabled={!hasApiKey}
          isAnyPanelLoading={isAnyPanelLoading}
          model={settings.activeModelId}
          availableModels={availableModels}
          onUpdateModel={updateModel}
          draft={draft}
          setDraft={setDraft}
          mobilePanel={currentMobilePanel}
          onUpdateMobileSystemPrompt={
            currentMobilePanel
              ? (prompt: string) =>
                updateSystemPrompt(currentMobilePanel.id, prompt)
              : undefined
          }
          onUpdateMobileTitle={
            currentMobilePanel
              ? (title: string) =>
                updatePanelTitle(currentMobilePanel.id, title)
              : undefined
          }
          mobilePromptOpen={mobilePromptOpen}
          setMobilePromptOpen={setMobilePromptOpen}
          enablePanelMode={settings.enablePanelMode}
        />
      </div>
    </div>
  )
}
