"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { motion } from "framer-motion"
import { HeaderBar } from "@/components/header-bar"
import { ChatPanel } from "@/components/chat-panel"
import { MessageInput } from "@/components/message-input"
import { PlaygroundSkeleton } from "@/components/playground-skeleton"
import { usePlayground } from "@/hooks/use-playground"
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

  const isAnyPanelLoading = panels.some((p) => p.isLoading)
  const count = settings.panelCount

  /* ---- Mobile swipe via CSS scroll-snap ---- */
  const [mobileIndex, setMobileIndex] = useState(0)
  const mobileScrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (mobileIndex >= count) setMobileIndex(Math.max(0, count - 1))
  }, [count, mobileIndex])

  // Track scroll-snap position
  const handleMobileScroll = useCallback(() => {
    const el = mobileScrollRef.current
    if (!el) return
    const w = el.clientWidth
    if (w === 0) return
    const idx = Math.round(el.scrollLeft / w)
    setMobileIndex(idx)
  }, [])

  const scrollToPanel = useCallback(
    (idx: number) => {
      const el = mobileScrollRef.current
      if (!el) return
      const clamped = Math.max(0, Math.min(count - 1, idx))
      el.scrollTo({ left: clamped * el.clientWidth, behavior: "smooth" })
      setMobileIndex(clamped)
    },
    [count]
  )

  const goMobilePrev = useCallback(
    () => scrollToPanel(mobileIndex - 1),
    [scrollToPanel, mobileIndex]
  )
  const goMobileNext = useCallback(
    () => scrollToPanel(mobileIndex + 1),
    [scrollToPanel, mobileIndex]
  )

  if (!hydrated) {
    return <PlaygroundSkeleton />
  }

  const currentMobilePanel = panels[mobileIndex]

  return (
    <div className="flex flex-col h-dvh bg-background overflow-hidden">
      {/* Floating Header */}
      <HeaderBar
        settings={settings}
        onUpdateApiKey={updateApiKey}
        onUpdatePanelCount={updatePanelCount}
        onClearChats={clearAllChats}
        onClearApiKey={clearApiKey}
        onResetPrompts={resetSystemPrompts}
        onClearEverything={clearEverything}
      />

      {/* ============ MOBILE ============ */}
      {/* Mobile panels are absolute, stretching the full screen (behind header + input) */}
      <div className="md:hidden absolute inset-0 z-0">
        <div
          ref={mobileScrollRef}
          onScroll={handleMobileScroll}
          className="h-full w-full flex overflow-x-auto overflow-y-hidden snap-x snap-mandatory no-scrollbar"
        >
          {panels.map((panel, idx) => (
            <div
              key={panel.id}
              className="w-full h-full shrink-0 snap-center snap-always"
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
                isMobileFullscreen
              />
            </div>
          ))}
        </div>
      </div>

      {/* Mobile: Floating nav arrows + dots (centered vertically, above input) */}
      {count > 1 && (
        <div className="md:hidden fixed bottom-36 left-0 right-0 flex items-center justify-center gap-3 z-30 pointer-events-none">
          <motion.button
            onClick={goMobilePrev}
            disabled={mobileIndex === 0}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.85 }}
            className="pointer-events-auto h-7 w-7 flex items-center justify-center rounded-lg bg-white/90 border border-border/50 text-muted-foreground hover:text-foreground disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </motion.button>

          <div className="pointer-events-auto flex items-center gap-1.5">
            {panels.map((_, idx) => (
              <button
                key={idx}
                onClick={() => scrollToPanel(idx)}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  idx === mobileIndex
                    ? "w-5 bg-primary"
                    : "w-1.5 bg-border hover:bg-muted-foreground/40"
                )}
              />
            ))}
          </div>

          <motion.button
            onClick={goMobileNext}
            disabled={mobileIndex >= count - 1}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.85 }}
            className="pointer-events-auto h-7 w-7 flex items-center justify-center rounded-lg bg-white/90 border border-border/50 text-muted-foreground hover:text-foreground disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </motion.button>
        </div>
      )}

      {/* Mobile: spacer so footer floats above the absolute panels */}
      <div className="md:hidden flex-1" />

      {/* ============ DESKTOP ============ */}
      <main className="flex-1 min-h-0 hidden md:block p-4 pt-3">
        <div className="h-full overflow-x-auto overflow-y-hidden custom-scrollbar">
          <div
            className="flex h-full gap-4"
            style={{
              width:
                count <= 2 ? "100%" : `max(100%, ${count * 380}px)`,
            }}
          >
            {panels.map((panel, idx) => (
              <div
                key={panel.id}
                className="h-full min-w-0"
                style={{
                  flexBasis: `${100 / count}%`,
                  flexGrow: 1,
                  flexShrink: 0,
                  minWidth: "340px",
                }}
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
      </main>

      {/* Global Input */}
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
      />
    </div>
  )
}
