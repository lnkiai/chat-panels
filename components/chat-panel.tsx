"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import {
  ChevronRight,
  Settings2,
  Loader2,
  Pencil,
  Copy,
  Check,
  Type,
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
  onUpdateSystemPrompt,
  onUpdateTitle,
}: ChatPanelProps) {
  const [isSystemPromptOpen, setIsSystemPromptOpen] = useState(true)
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
    <div className="flex flex-col h-full min-w-0 bg-card rounded-2xl border border-border/60 overflow-hidden">
      {/* Panel header */}
      <div className="shrink-0">
        <div className="flex items-center w-full px-3.5 py-2.5">
          {/* Collapsible toggle */}
          <motion.button
            onClick={() => setIsSystemPromptOpen(!isSystemPromptOpen)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors shrink-0"
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
              className="ml-2 text-xs font-heading bg-transparent border-b-2 border-primary outline-none px-0 py-0 w-24 text-foreground"
              maxLength={30}
            />
          ) : (
            <button
              onClick={() => {
                setTitleDraft(panel.title)
                setIsEditingTitle(true)
              }}
              className="ml-2 flex items-center gap-1 text-xs font-heading text-foreground hover:text-primary transition-colors group"
            >
              <span>{panel.title}</span>
              <Pencil className="h-2.5 w-2.5 opacity-0 group-hover:opacity-60 transition-opacity" />
            </button>
          )}

          {/* System prompt tiny preview */}
          {!isSystemPromptOpen && (
            <span className="ml-auto text-[10px] text-muted-foreground/50 truncate max-w-[80px]">
              {panel.systemPrompt.slice(0, 16)}
              {"..."}
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
              <div className="px-3.5 pt-2 pb-3">
                <Textarea
                  value={panel.systemPrompt}
                  onChange={(e) => onUpdateSystemPrompt(e.target.value)}
                  className="text-xs min-h-[80px] resize-none font-mono bg-background/60 border-border/60 rounded-xl focus-visible:ring-primary/30 focus-visible:border-primary/40 custom-scrollbar"
                  placeholder="System prompt..."
                  rows={3}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Subtle divider */}
        <div className="h-px bg-border/40 mx-3" />
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto min-h-0 bg-background/40 custom-scrollbar">
        {panel.messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-xs text-muted-foreground/50">
              {"メッセージを入力してください"}
            </p>
          </div>
        ) : (
          <div className="px-3 py-3 flex flex-col gap-3">
            {panel.messages.map((message, i) => (
              <MessageBubble
                key={message.id}
                message={message}
                isLast={i === panel.messages.length - 1}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Shared Glass Overlay                                               */
/* ------------------------------------------------------------------ */

function GlassOverlay({
  content,
  show,
  onClose,
}: {
  content: string
  show: boolean
  onClose: () => void
}) {
  const [copied, setCopied] = useState(false)
  const overlayRef = useRef<HTMLDivElement>(null)

  const charCount = content.length
  const tokenEstimate = Math.ceil(charCount / 3)

  const handleCopy = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    },
    [content]
  )

  useEffect(() => {
    if (!show) return
    const handler = (e: MouseEvent) => {
      if (overlayRef.current && !overlayRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [show, onClose])

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          ref={overlayRef}
          initial={{ opacity: 0, y: 6, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 4, scale: 0.97 }}
          transition={{ type: "spring", stiffness: 380, damping: 22 }}
          className="absolute bottom-0 left-0 right-0 z-10"
        >
          <div
            className="mx-1 mb-1 flex items-center gap-2 px-3 py-2 rounded-xl border border-border/50 backdrop-blur-xl"
            style={{ backgroundColor: "hsl(var(--card) / 0.65)" }}
          >
            <button
              onClick={handleCopy}
              className={cn(
                "flex items-center gap-1.5 h-7 px-2.5 rounded-lg text-xs transition-all",
                copied
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              )}
            >
              {copied ? (
                <>
                  <Check className="h-3 w-3" />
                  <span>{"Copied"}</span>
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" />
                  <span>{"Copy"}</span>
                </>
              )}
            </button>

            <div className="h-4 w-px bg-border/40" />

            <div className="flex items-center gap-3 text-[10px] text-muted-foreground/70">
              <span className="flex items-center gap-1">
                <Type className="h-2.5 w-2.5" />
                {charCount.toLocaleString()} {"chars"}
              </span>
              <span>
                {"~"}
                {tokenEstimate.toLocaleString()} {"tokens"}
              </span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/* ------------------------------------------------------------------ */
/*  Message dispatcher                                                 */
/* ------------------------------------------------------------------ */

function MessageBubble({
  message,
  isLast,
}: {
  message: PanelState["messages"][number]
  isLast: boolean
}) {
  if (message.role === "user") {
    return <UserBubble content={message.content} />
  }
  return <AssistantMessage message={message} isLast={isLast} />
}

/* ------------------------------------------------------------------ */
/*  User bubble - right-aligned, with glass overlay on tap             */
/* ------------------------------------------------------------------ */

function UserBubble({ content }: { content: string }) {
  const [showOverlay, setShowOverlay] = useState(false)
  const close = useCallback(() => setShowOverlay(false), [])

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 26 }}
      className="flex justify-end"
    >
      <div className="relative max-w-[85%]">
        <div
          onClick={() => content.trim() && setShowOverlay((p) => !p)}
          className="px-3.5 py-2.5 rounded-2xl rounded-tr-sm border border-primary/15 bg-primary/5 cursor-pointer"
        >
          <p className="text-sm whitespace-pre-wrap leading-relaxed text-foreground">
            {content}
          </p>
        </div>
        <GlassOverlay content={content} show={showOverlay} onClose={close} />
      </div>
    </motion.div>
  )
}

/* ------------------------------------------------------------------ */
/*  Assistant message - full width, glass overlay on tap               */
/* ------------------------------------------------------------------ */

function AssistantMessage({
  message,
  isLast,
}: {
  message: PanelState["messages"][number]
  isLast: boolean
}) {
  const [showOverlay, setShowOverlay] = useState(false)
  const close = useCallback(() => setShowOverlay(false), [])

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 26 }}
      className="w-full relative"
    >
      {/* Thinking process */}
      {message.thinking && message.thinking.length > 0 && (
        <ThinkingBlock
          thinking={message.thinking}
          isStreaming={!!message.isStreaming}
        />
      )}

      {/* Content */}
      <div
        onClick={() => {
          if (!message.isStreaming && message.content.trim()) {
            setShowOverlay((p) => !p)
          }
        }}
        className={cn(
          "text-sm leading-relaxed cursor-default",
          !message.isStreaming && message.content.trim() && "cursor-pointer"
        )}
      >
        {message.content ? (
          <>
            <Streamdown isAnimating={!!message.isStreaming}>
              {message.content}
            </Streamdown>
            {message.isStreaming && isLast && (
              <div className="mt-2 flex items-center gap-2">
                <Loader2 className="h-3 w-3 animate-spin text-primary/50" />
                <span className="text-[10px] text-muted-foreground/50">{"生成中..."}</span>
              </div>
            )}
          </>
        ) : message.isStreaming ? (
          <div className="flex items-center gap-2 py-1">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
            <span className="text-xs text-muted-foreground">{"生成中..."}</span>
          </div>
        ) : null}
      </div>

      {/* Glass overlay */}
      <GlassOverlay
        content={message.content}
        show={showOverlay && !message.isStreaming}
        onClose={close}
      />
    </motion.div>
  )
}

/* ------------------------------------------------------------------ */
/*  Thinking block                                                     */
/* ------------------------------------------------------------------ */

function ThinkingBlock({
  thinking,
  isStreaming,
}: {
  thinking: string
  isStreaming: boolean
}) {
  const [isOpen, setIsOpen] = useState(true)

  return (
    <div className="mb-2">
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
        <span className="font-heading">
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
            <div className="mt-1.5 p-3 bg-primary/5 border border-primary/10 rounded-xl text-xs text-muted-foreground leading-relaxed overflow-x-auto max-h-48 overflow-y-auto custom-scrollbar">
              <Streamdown isAnimating={isStreaming}>{thinking}</Streamdown>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
