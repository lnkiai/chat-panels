"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { motion } from "framer-motion"
import { HeaderBar } from "@/components/header-bar"
import { ChatPanel } from "@/components/chat-panel"
import { MessageInput } from "@/components/message-input"
import { PlaygroundSkeleton } from "@/components/playground-skeleton"
import { Sidebar } from "@/components/sidebar"
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

  /* ---- Scroll-snap navigation (unified for mobile + desktop) ---- */
  const [activeIndex, setActiveIndex] = useState(0)
  const [mobilePromptOpen, setMobilePromptOpen] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Clamp active index when panel count changes
  useEffect(() => {
    if (activeIndex >= count) setActiveIndex(Math.max(0, count - 1))
  }, [count, activeIndex])

  // On mobile: each panel = 100vw. On desktop: each panel = 100vw / min(count, 3)
  // We track scroll position to figure out which "page" we're on
  const handleScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const w = el.clientWidth
    if (w === 0) return
    const idx = Math.round(el.scrollLeft / w)
    if (idx !== activeIndex) setMobilePromptOpen(false)
    setActiveIndex(idx)
  }, [activeIndex])

  const scrollToPage = useCallback(
    (idx: number) => {
      const el = scrollRef.current
      if (!el) return
      const maxPage = count <= 3 ? 0 : count - 3
      const clamped = Math.max(0, Math.min(maxPage, idx))
      el.scrollTo({ left: clamped * el.clientWidth, behavior: "smooth" })
      setActiveIndex(clamped)
    },
    [count]
  )

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

  const goPrev = useCallback(
    () => {
      if (typeof window !== "undefined" && window.innerWidth < 768) {
        scrollToMobilePanel(activeIndex - 1)
      } else {
        scrollToPage(activeIndex - 1)
      }
    },
    [scrollToPage, scrollToMobilePanel, activeIndex]
  )
  const goNext = useCallback(
    () => {
      if (typeof window !== "undefined" && window.innerWidth < 768) {
        scrollToMobilePanel(activeIndex + 1)
      } else {
        scrollToPage(activeIndex + 1)
      }
    },
    [scrollToPage, scrollToMobilePanel, activeIndex]
  )

  // How many panels are visible on desktop (always 1 on mobile via CSS)
  const visibleDesktopPanels = Math.min(count, 3)
  const hasDesktopOverflow = count > 3
  // For mobile dots we show all panels, for desktop only when overflowing
  const isMobileCheck = typeof window !== "undefined" && window.innerWidth < 768
  const showNav = isMobileCheck ? count > 1 : hasDesktopOverflow

  if (!hydrated) {
    return <PlaygroundSkeleton />
  }

  const currentMobilePanel = panels[activeIndex] ?? panels[0]

  return (
    <div className="flex flex-col h-dvh bg-background overflow-hidden relative">
      {/* Sidebar */}
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        templates={templateStore.templates}
        onAddTemplate={templateStore.addTemplate}
        onUpdateTemplate={templateStore.updateTemplate}
        onDeleteTemplate={templateStore.deleteTemplate}
        panels={panels}
        onUpdateSystemPrompt={updateSystemPrompt}
        onUpdatePanelTitle={updatePanelTitle}
      />

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
        />
      </div>

      {/* ============ PANELS (unified full-screen) ============ */}
      {/* Absolute container: panels sit behind header + input */}
      <div className="absolute inset-0 z-0">
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
                // Desktop: 100vw / min(count, 3) per panel
                "md:w-[var(--panel-width)]"
              )}
              style={{
                // CSS custom property for desktop panel width
                "--panel-width": `${100 / visibleDesktopPanels}vw`,
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
              />
            </div>
          ))}
        </div>
      </div>

      {/* ============ NAV BUTTONS ============ */}
      {showNav && (
        <div className="fixed bottom-28 md:bottom-6 left-1/2 -translate-x-1/2 md:left-auto md:translate-x-0 md:right-8 flex items-center gap-2.5 z-30 pointer-events-none">
          <motion.button
            onClick={goPrev}
            disabled={activeIndex === 0}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.85 }}
            className="pointer-events-auto h-7 w-7 flex items-center justify-center rounded-lg bg-card/90 backdrop-blur-sm border border-border/50 text-muted-foreground hover:text-foreground disabled:opacity-25 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </motion.button>

          <div className="pointer-events-auto flex items-center gap-1.5">
            {panels.map((_, idx) => (
              <button
                key={idx}
                onClick={() =>
                  typeof window !== "undefined" && window.innerWidth < 768
                    ? scrollToMobilePanel(idx)
                    : scrollToPage(Math.max(0, idx - visibleDesktopPanels + 1))
                }
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  idx === activeIndex
                    ? "w-5 bg-primary"
                    : "w-1.5 bg-border hover:bg-muted-foreground/40"
                )}
              />
            ))}
          </div>

          <motion.button
            onClick={goNext}
            disabled={
              isMobileCheck
                ? activeIndex >= count - 1
                : activeIndex >= count - visibleDesktopPanels
            }
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.85 }}
            className="pointer-events-auto h-7 w-7 flex items-center justify-center rounded-lg bg-card/90 backdrop-blur-sm border border-border/50 text-muted-foreground hover:text-foreground disabled:opacity-25 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </motion.button>
        </div>
      )}

      {/* Spacer to push footer down */}
      <div className="flex-1" />

      {/* Global Input - z-20 above panels */}
      <div className="relative z-20">
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
          templates={templateStore.templates}
          onApplyTemplate={(templateContent) => {
            if (currentMobilePanel) {
              updateSystemPrompt(currentMobilePanel.id, templateContent)
            }
          }}
        />
      </div>
    </div>
  )
}
