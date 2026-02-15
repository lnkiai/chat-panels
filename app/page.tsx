"use client"

import { useState, useEffect, useCallback } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
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

  /* ---- Mobile swipe state ---- */
  const [mobileIndex, setMobileIndex] = useState(0)

  // Clamp mobileIndex when panel count changes
  useEffect(() => {
    if (mobileIndex >= count) setMobileIndex(Math.max(0, count - 1))
  }, [count, mobileIndex])

  const goMobilePrev = useCallback(
    () => setMobileIndex((i) => Math.max(0, i - 1)),
    []
  )
  const goMobileNext = useCallback(
    () => setMobileIndex((i) => Math.min(count - 1, i + 1)),
    []
  )

  if (!hydrated) {
    return <PlaygroundSkeleton />
  }

  const currentMobilePanel = panels[mobileIndex]

  return (
    <div className="flex flex-col h-dvh bg-background">
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
      <main className="flex-1 min-h-0 flex flex-col md:hidden">
        {/* Full-screen swipe panel */}
        <div className="flex-1 min-h-0 relative">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={mobileIndex}
              initial={{ opacity: 0, x: 60 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -60 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              className="absolute inset-0 px-3 pt-2 pb-1"
            >
              {currentMobilePanel && (
                <ChatPanel
                  panel={currentMobilePanel}
                  panelIndex={mobileIndex}
                  totalPanels={count}
                  onUpdateSystemPrompt={(prompt) =>
                    updateSystemPrompt(currentMobilePanel.id, prompt)
                  }
                  onUpdateTitle={(title) =>
                    updatePanelTitle(currentMobilePanel.id, title)
                  }
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Mobile nav bar above input */}
        {count > 1 && (
          <div className="shrink-0 flex items-center justify-center gap-3 px-4 pt-1 pb-0.5">
            <motion.button
              onClick={goMobilePrev}
              disabled={mobileIndex === 0}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.85 }}
              className="h-7 w-7 flex items-center justify-center rounded-lg border border-border/50 text-muted-foreground hover:text-foreground disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </motion.button>

            {/* Dots indicator */}
            <div className="flex items-center gap-1.5">
              {panels.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setMobileIndex(idx)}
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
              className="h-7 w-7 flex items-center justify-center rounded-lg border border-border/50 text-muted-foreground hover:text-foreground disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </motion.button>
          </div>
        )}
      </main>

      {/* ============ DESKTOP ============ */}
      <main className="flex-1 min-h-0 hidden md:block p-4 pt-3">
        <div className="h-full overflow-x-auto overflow-y-hidden custom-scrollbar">
          <div
            className="flex h-full gap-4"
            style={{
              // Each panel is 50% of container width (2 visible), min 380px
              width:
                count <= 2
                  ? "100%"
                  : `max(100%, ${count * 380}px)`,
            }}
          >
            {panels.map((panel, idx) => (
              <div
                key={panel.id}
                className="h-full min-w-0"
                style={{
                  flexBasis: count <= 2 ? `${100 / count}%` : `${100 / count}%`,
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
      />
    </div>
  )
}
