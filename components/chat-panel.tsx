"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import {
  ChevronRight,
  Settings2,
  Pencil,
  Copy,
  Check,
  Type,
} from "lucide-react"
import { TextShimmer } from "@/components/core/text-shimmer"
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
    <div className="flex flex-col h-full min-w-0 bg-card rounded-2xl border border-border/60 overflow-hidden">
      {/* Panel header */}
      <div className="shrink-0">
        <div className="flex items-center w-full px-3.5 py-2.5">
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

          {!isSystemPromptOpen && panel.systemPrompt.trim() && (
            <span className="ml-auto text-[10px] text-muted-foreground/40 truncate min-w-0 flex-1 text-right pl-3">
              {panel.systemPrompt}
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
              <div className="px-3.5 pt-2 pb-3 flex flex-col gap-1.5">
                <Textarea
                  value={panel.systemPrompt}
                  onChange={(e) => onUpdateSystemPrompt(e.target.value)}
                  className="text-xs min-h-[80px] resize-none font-mono bg-background/60 border-border/60 rounded-xl focus-visible:ring-primary/30 focus-visible:border-primary/40 custom-scrollbar"
                  placeholder="System prompt..."
                  rows={3}
                />
                <PromptStatsBar content={panel.systemPrompt} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

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
/*  User bubble - right-aligned, tap to show side copy button          */
/* ------------------------------------------------------------------ */

function UserBubble({ content }: { content: string }) {
  const [showCopy, setShowCopy] = useState(false)
  const [copied, setCopied] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  const handleCopy = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => {
        setCopied(false)
        setShowCopy(false)
      }, 1500)
    },
    [content]
  )

  // Close on outside click
  useEffect(() => {
    if (!showCopy) return
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowCopy(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [showCopy])

  return (
    <motion.div
      ref={wrapperRef}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 26 }}
      className="flex items-center justify-end gap-1.5"
    >
      {/* Side copy button */}
      <AnimatePresence>
        {showCopy && (
          <motion.button
            initial={{ opacity: 0, x: 8, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 8, scale: 0.8 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
            onClick={handleCopy}
            className={cn(
              "shrink-0 flex items-center gap-1 h-7 px-2 rounded-lg border text-[11px] transition-colors",
              copied
                ? "bg-primary/10 border-primary/20 text-primary"
                : "bg-white/90 border-border/50 text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            {copied ? (
              <>
                <Check className="h-3 w-3" />
                <span>{"Copied!"}</span>
              </>
            ) : (
              <Copy className="h-3 w-3" />
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Bubble */}
      <div
        onClick={() => content.trim() && setShowCopy((p) => !p)}
        className="max-w-[85%] px-3.5 py-2.5 rounded-2xl rounded-tr-sm border border-primary/15 bg-primary/5 cursor-pointer select-text"
      >
        <p className="text-sm whitespace-pre-wrap leading-relaxed text-foreground">
          {content}
        </p>
      </div>
    </motion.div>
  )
}

/* ------------------------------------------------------------------ */
/*  Assistant message - full width, always-visible stats bar           */
/* ------------------------------------------------------------------ */

function AssistantMessage({
  message,
  isLast,
}: {
  message: PanelState["messages"][number]
  isLast: boolean
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 26 }}
      className="w-full"
    >
      {/* Thinking process */}
      {message.thinking && message.thinking.length > 0 && (
        <ThinkingBlock
          thinking={message.thinking}
          isStreaming={!!message.isStreaming}
        />
      )}

      {/* Content */}
      <div className="text-sm leading-relaxed">
        {message.content ? (
          <>
            <Streamdown isAnimating={!!message.isStreaming}>
              {message.content}
            </Streamdown>
            {message.isStreaming && isLast && (
              <div className="mt-2">
                <TextShimmer className="text-[11px] font-mono" duration={1.2}>
                  generating...
                </TextShimmer>
              </div>
            )}
          </>
        ) : message.isStreaming ? (
          <div className="py-1">
            <TextShimmer className="text-xs font-mono" duration={1}>
              generating...
            </TextShimmer>
          </div>
        ) : null}
      </div>

      {/* Always-visible stats bar below AI content */}
      {message.content.trim() && !message.isStreaming && (
        <AssistantStatsBar content={message.content} />
      )}
    </motion.div>
  )
}

/* ------------------------------------------------------------------ */
/*  Assistant stats bar - always visible below AI message              */
/* ------------------------------------------------------------------ */

function AssistantStatsBar({ content }: { content: string }) {
  const [copied, setCopied] = useState(false)
  const charCount = content.length
  const tokenEstimate = Math.ceil(charCount / 3)

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [content])

  return (
    <div className="mt-2 flex items-center gap-2">
      <button
        onClick={handleCopy}
        className={cn(
          "flex items-center gap-1 h-6 px-2 rounded-md text-[10px] transition-all",
          copied
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground/50 hover:text-foreground hover:bg-muted/50"
        )}
      >
        {copied ? (
          <>
            <Check className="h-2.5 w-2.5" />
            <span>{"Copied!"}</span>
          </>
        ) : (
          <>
            <Copy className="h-2.5 w-2.5" />
            <span>{"Copy"}</span>
          </>
        )}
      </button>

      <div className="h-3 w-px bg-border/30" />

      <div className="flex items-center gap-2.5 text-[10px] text-muted-foreground/40">
        <span className="flex items-center gap-0.5">
          <Type className="h-2.5 w-2.5" />
          {charCount.toLocaleString()} {"chars"}
        </span>
        <span>
          {"~"}{tokenEstimate.toLocaleString()} {"tokens"}
        </span>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  System prompt stats bar                                            */
/* ------------------------------------------------------------------ */

function PromptStatsBar({ content }: { content: string }) {
  const [copied, setCopied] = useState(false)
  const charCount = content.length
  const tokenEstimate = Math.ceil(charCount / 3)

  const handleCopy = useCallback(() => {
    if (!content.trim()) return
    navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [content])

  return (
    <div className="flex items-center gap-2 px-1 py-0.5">
      <button
        onClick={handleCopy}
        className={cn(
          "flex items-center gap-1 h-6 px-2 rounded-md text-[10px] transition-all",
          copied
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground/60 hover:text-foreground hover:bg-muted/50"
        )}
      >
        {copied ? (
          <>
            <Check className="h-2.5 w-2.5" />
            <span>{"Copied"}</span>
          </>
        ) : (
          <>
            <Copy className="h-2.5 w-2.5" />
            <span>{"Copy"}</span>
          </>
        )}
      </button>

      <div className="h-3 w-px bg-border/40" />

      <div className="flex items-center gap-2.5 text-[10px] text-muted-foreground/50">
        <span className="flex items-center gap-0.5">
          <Type className="h-2.5 w-2.5" />
          {charCount.toLocaleString()} {"chars"}
        </span>
        <span>
          {"~"}{tokenEstimate.toLocaleString()} {"tokens"}
        </span>
      </div>
    </div>
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
  const wasStreamingRef = useRef(isStreaming)

  useEffect(() => {
    // When streaming stops (was true -> now false), auto-collapse
    if (wasStreamingRef.current && !isStreaming) {
      setIsOpen(false)
    }
    wasStreamingRef.current = isStreaming
  }, [isStreaming])

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
