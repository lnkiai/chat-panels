"use client"

import { useState, useRef, useEffect } from "react"
import {
  ChevronDown,
  ChevronRight,
  Settings2,
  User,
  Bot,
  Loader2,
  Pencil,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Streamdown } from "streamdown"
import { Textarea } from "@/components/ui/textarea"
import type { PanelState } from "@/lib/types"
import { cn } from "@/lib/utils"

interface ChatPanelProps {
  panel: PanelState
  panelIndex: number
  totalPanels: number
  onUpdateSystemPrompt: (prompt: string) => void
  onUpdateTitle: (title: string) => void
}

export function ChatPanel({
  panel,
  panelIndex,
  totalPanels,
  onUpdateSystemPrompt,
  onUpdateTitle,
}: ChatPanelProps) {
  const [isSystemPromptOpen, setIsSystemPromptOpen] = useState(false)
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [titleDraft, setTitleDraft] = useState(panel.title)
  const titleInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus()
      titleInputRef.current.select()
    }
  }, [isEditingTitle])

  const commitTitle = () => {
    const trimmed = titleDraft.trim()
    if (trimmed) {
      onUpdateTitle(trimmed)
    } else {
      setTitleDraft(panel.title)
    }
    setIsEditingTitle(false)
  }

  return (
    <div className="flex flex-col h-full min-w-0 bg-card">
      {/* Panel header */}
      <div className="border-b border-border shrink-0">
        <div className="flex items-center w-full px-3 py-2.5">
          {/* Collapsible toggle */}
          <motion.button
            onClick={() => setIsSystemPromptOpen(!isSystemPromptOpen)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors shrink-0"
            aria-expanded={isSystemPromptOpen}
          >
            <motion.span
              animate={{ rotate: isSystemPromptOpen ? 90 : 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <ChevronRight className="h-3 w-3" />
            </motion.span>
            <Settings2 className="h-3 w-3" />
          </motion.button>

          {/* Editable title */}
          {isEditingTitle ? (
            <input
              ref={titleInputRef}
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              onBlur={commitTitle}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitTitle()
                if (e.key === "Escape") {
                  setTitleDraft(panel.title)
                  setIsEditingTitle(false)
                }
              }}
              className="ml-2.5 text-xs font-semibold bg-transparent border-b-2 border-primary outline-none px-0 py-0 w-28 text-foreground"
              maxLength={30}
            />
          ) : (
            <button
              onClick={() => {
                setTitleDraft(panel.title)
                setIsEditingTitle(true)
              }}
              className="ml-2.5 flex items-center gap-1.5 text-xs font-semibold text-foreground hover:text-primary transition-colors group"
            >
              <span>{panel.title}</span>
              <Pencil className="h-2.5 w-2.5 opacity-0 group-hover:opacity-60 transition-opacity" />
            </button>
          )}

          {/* System prompt preview */}
          {!isSystemPromptOpen && (
            <span className="ml-2 text-[10px] text-muted-foreground truncate">
              {panel.systemPrompt.slice(0, 40)}
              {panel.systemPrompt.length > 40 ? "..." : ""}
            </span>
          )}
        </div>

        <AnimatePresence>
          {isSystemPromptOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              className="overflow-hidden"
            >
              <div className="px-3 pb-3">
                <Textarea
                  value={panel.systemPrompt}
                  onChange={(e) => onUpdateSystemPrompt(e.target.value)}
                  className="text-xs min-h-[60px] resize-none font-mono bg-background border-border rounded-xl focus-visible:ring-primary/30"
                  placeholder="System prompt..."
                  rows={3}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto min-h-0 bg-background">
        {panel.messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-xs text-muted-foreground">
              {"メッセージを入力して送信してください"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {panel.messages.map((message, i) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 260,
                  damping: 24,
                  delay: i === panel.messages.length - 1 ? 0 : 0,
                }}
                className="px-3 py-3.5"
              >
                {/* Message header */}
                <div className="flex items-center gap-2 mb-2">
                  {message.role === "user" ? (
                    <>
                      <div className="flex items-center justify-center h-5 w-5 rounded-lg border border-border bg-card">
                        <User className="h-3 w-3 text-muted-foreground" />
                      </div>
                      <span className="text-xs font-semibold text-foreground">You</span>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center justify-center h-5 w-5 rounded-lg bg-primary text-primary-foreground">
                        <Bot className="h-3 w-3" />
                      </div>
                      <span className="text-xs font-semibold text-foreground">Assistant</span>
                      {message.isStreaming && (
                        <Loader2 className="h-3 w-3 animate-spin text-primary" />
                      )}
                    </>
                  )}
                </div>

                {/* Thinking process */}
                {message.thinking && message.thinking.length > 0 && (
                  <ThinkingBlock
                    thinking={message.thinking}
                    isStreaming={!!message.isStreaming}
                  />
                )}

                {/* Message content */}
                <div className="pl-7">
                  {message.role === "user" ? (
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">
                      {message.content}
                    </p>
                  ) : message.content ? (
                    <div className="text-sm">
                      <Streamdown isAnimating={!!message.isStreaming}>
                        {message.content}
                      </Streamdown>
                    </div>
                  ) : message.isStreaming ? (
                    <div className="flex items-center gap-1.5 py-1">
                      {[0, 1, 2].map((dot) => (
                        <motion.span
                          key={dot}
                          className="inline-block h-1.5 w-1.5 rounded-full bg-primary"
                          animate={{ y: [0, -4, 0] }}
                          transition={{
                            duration: 0.6,
                            repeat: Infinity,
                            delay: dot * 0.15,
                            ease: "easeInOut",
                          }}
                        />
                      ))}
                    </div>
                  ) : null}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function ThinkingBlock({
  thinking,
  isStreaming,
}: {
  thinking: string
  isStreaming: boolean
}) {
  const [isOpen, setIsOpen] = useState(true)

  return (
    <div className="pl-7 mb-2">
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
        aria-expanded={isOpen}
      >
        <motion.span
          animate={{ rotate: isOpen ? 90 : 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          <ChevronRight className="h-3 w-3" />
        </motion.span>
        <span className="font-medium">
          {"Thinking Process"}
          {isStreaming && " ..."}
        </span>
      </motion.button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="overflow-hidden"
          >
            <div className="mt-1.5 p-3 bg-primary/5 border border-primary/15 rounded-xl text-xs text-muted-foreground leading-relaxed overflow-x-auto max-h-64 overflow-y-auto">
              <Streamdown isAnimating={isStreaming}>{thinking}</Streamdown>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
