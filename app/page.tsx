"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { HeaderBar } from "@/components/header-bar"
import { ChatPanel } from "@/components/chat-panel"
import { MessageInput } from "@/components/message-input"
import { PlaygroundSkeleton } from "@/components/playground-skeleton"
import { Sidebar, SIDEBAR_WIDTH, ICON_BAR_WIDTH } from "@/components/sidebar"
import { usePlayground } from "@/hooks/use-playground"
import { useTemplates } from "@/hooks/use-templates"
import { cn } from "@/lib/utils"

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
  } = usePlayground()

  const templateStore = useTemplates()

  const isAnyPanelLoading = panels.some((p) => p.isLoading)
  const count = settings.panelCount

  /* ---- Sidebar ---- */
  const [sidebarOpen, setSidebarOpen] = useState(false)

  /* ---- Mobile detection ---- */
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])

  /* ---- Content offset for sidebar ---- */
  const contentMargin = isMobile ? 0 : sidebarOpen ? SIDEBAR_WIDTH : ICON_BAR_WIDTH

  /* ---- Scroll-snap navigation (mobile only) ---- */
  const [activeIndex, setActiveIndex] = useState(0)
  const [mobilePromptOpen, setMobilePromptOpen] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Clamp active index when panel count changes
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

  // How many panels are visible on desktop (always 1 on mobile via CSS)
  const visibleDesktopPanels = Math.min(count, 3)

  // Mobile dots navigation
  const showMobileDots = isMobile && count > 1

  if (!hydrated) {
    return <PlaygroundSkeleton />
  }

  const currentMobilePanel = panels[activeIndex] ?? panels[0]

  return (
    <div className="flex h-dvh bg-background overflow-hidden relative">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onOpen={() => setSidebarOpen(true)}
        isMobile={isMobile}
        templates={templateStore.templates}
        onApplyTemplate={(content) => {
          if (currentMobilePanel) {
            updateSystemPrompt(currentMobilePanel.id, content)
          }
        }}
      />

      {/* Main content area - offset by sidebar */}
      <div
        className="flex-1 flex flex-col min-w-0 h-dvh overflow-hidden transition-[margin] duration-300 ease-out"
        style={{ marginLeft: contentMargin }}
      >
        {/* Floating Header - z-20 so it's above panels */}
        <div className="shrink-0 relative z-20">
          <HeaderBar
            settings={settings}
            onUpdateApiKey={updateApiKey}
            onUpdatePanelCount={updatePanelCount}
            onClearChats={clearAllChats}
            onClearApiKey={clearApiKey}
            onResetPrompts={resetSystemPrompts}
            onClearEverything={clearEverything}
            mobilePromptOpen={mobilePromptOpen}
            setMobilePromptOpen={setMobilePromptOpen}
            mobilePanel={currentMobilePanel}
            onUpdateMobileSystemPrompt={
              currentMobilePanel
                ? (prompt: string) => updateSystemPrompt(currentMobilePanel.id, prompt)
                : undefined
            }
            onUpdateMobileTitle={
              currentMobilePanel
                ? (title: string) => updatePanelTitle(currentMobilePanel.id, title)
                : undefined
            }
            onOpenSidebar={() => setSidebarOpen(true)}
            templates={templateStore.templates}
            onApplyTemplate={
              currentMobilePanel
                ? (content: string) => updateSystemPrompt(currentMobilePanel.id, content)
                : undefined
            }
          />
        </div>

        {/* ============ PANELS (unified full-screen) ============ */}
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
                    // Mobile: 100vw per panel
                    "w-screen",
                    // Desktop: fill available width / min(count, 3) per panel
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
                    templates={templateStore.templates}
                    onApplyTemplate={(content) =>
                      updateSystemPrompt(panel.id, content)
                    }
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

        {/* Global Input - z-20 above panels */}
        <div className="relative z-20 shrink-0">
          <MessageInput
            onSend={sendMessage}
            disabled={!settings.apiKey.trim()}
            isAnyPanelLoading={isAnyPanelLoading}
            model={settings.model}
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
          />
        </div>
      </div>
    </div>
  )
}
