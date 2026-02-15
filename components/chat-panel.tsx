"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import {
  ChevronRight,
  ChevronDown,
  Settings2,
  Pencil,
  Copy,
  Check,
  Type,
  AtSign,
} from "lucide-react"
import { TextShimmer } from "@/components/core/text-shimmer"
import { motion, AnimatePresence } from "framer-motion"
import { Streamdown } from "streamdown"
import { Textarea } from "@/components/ui/textarea"
import type { PanelState, ChatMessage, PromptTemplate } from "@/lib/types"
import { cn } from "@/lib/utils"

interface ChatPanelProps {
  panel: PanelState
  panelIndex: number
  totalPanels: number
  onUpdateSystemPrompt: (prompt: string) => void
  onUpdateTitle: (title: string) => void
  templates?: PromptTemplate[]
  onApplyTemplate?: (content: string) => void
}

export function ChatPanel({
  panel,
  onUpdateSystemPrompt,
  onUpdateTitle,
  templates = [],
  onApplyTemplate,
}: ChatPanelProps) {
  const [isSystemPromptOpen, setIsSystemPromptOpen] = useState(false)
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [titleDraft, setTitleDraft] = useState(panel.title)
  const titleInputRef = useRef<HTMLInputElement>(null)

  /* Scroll tracking for "new message" button */
  const scrollRef = useRef<HTMLDivElement>(null)
  const [isAtBottom, setIsAtBottom] = useState(true)
  const [hasNewMessages, setHasNewMessages] = useState(false)
  const prevMsgCountRef = useRef(panel.messages.length)

  const checkIfAtBottom = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 60
    setIsAtBottom(atBottom)
    if (atBottom) setHasNewMessages(false)
  }, [])

  useEffect(() => {
    const currentCount = panel.messages.length
    if (currentCount > prevMsgCountRef.current && !isAtBottom) {
      setHasNewMessages(true)
    }
    prevMsgCountRef.current = currentCount
  }, [panel.messages.length, isAtBottom])

  useEffect(() => {
    if (isAtBottom && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [panel.messages, isAtBottom])

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      })
      setHasNewMessages(false)
    }
  }, [])

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
    <div className="flex flex-col h-full min-w-0 overflow-hidden bg-background border-r border-border/20 last:border-r-0">
      {/* Panel header - visible on desktop only; mobile uses header-bar system prompt */}
      <div className="shrink-0 hidden md:block">
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
                {/* Template apply dropdown */}
                {templates.length > 0 && onApplyTemplate && (
                  <TemplateApplyDropdown
                    templates={templates}
                    onApply={onApplyTemplate}
                  />
                )}
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
      <div
        ref={scrollRef}
        onScroll={checkIfAtBottom}
        className="flex-1 overflow-y-auto min-h-0 custom-scrollbar relative"
      >
        {panel.messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-xs text-muted-foreground/50">
              {"メッセージを入力してください"}
            </p>
          </div>
        ) : (
          <div className="px-3 md:px-4 flex flex-col gap-3 pt-4 pb-44 md:pt-4 md:pb-28">
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

      {/* New message / scroll-to-bottom button */}
      <AnimatePresence>
        {(!isAtBottom || hasNewMessages) && panel.messages.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="absolute left-0 right-0 bottom-8 z-30 flex justify-center pointer-events-none"
          >
            <button
              onClick={scrollToBottom}
              className={cn(
                "pointer-events-auto flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-medium transition-colors border shadow-sm",
                hasNewMessages
                  ? "bg-primary/10 text-primary border-primary/20"
                  : "bg-card/90 backdrop-blur-sm text-muted-foreground border-border/50 hover:text-foreground"
              )}
            >
              <ChevronDown className="h-3 w-3" />
              <span>{hasNewMessages ? "新規メッセージ" : "最新へ"}</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
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
  message: ChatMessage
  isLast: boolean
}) {
  if (message.role === "user") {
    return <UserBubble content={message.content} />
  }
  return <AssistantMessage message={message} isLast={isLast} />
}

/* ------------------------------------------------------------------ */
/*  User bubble                                                        */
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
                : "bg-card/90 border-border/50 text-muted-foreground hover:text-foreground hover:bg-muted/50"
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
/*  Assistant message                                                  */
/* ------------------------------------------------------------------ */

function AssistantMessage({
  message,
  isLast,
}: {
  message: ChatMessage
  isLast: boolean
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 26 }}
      className="w-full"
    >
      {message.thinking && message.thinking.length > 0 && (
        <ThinkingBlock
          thinking={message.thinking}
          isStreaming={!!message.isStreaming}
        />
      )}

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

      {message.content.trim() && !message.isStreaming && (
        <AssistantStatsBar message={message} />
      )}
    </motion.div>
  )
}

/* ------------------------------------------------------------------ */
/*  Assistant stats bar (with real token usage)                        */
/* ------------------------------------------------------------------ */

function AssistantStatsBar({ message }: { message: ChatMessage }) {
  const [copied, setCopied] = useState(false)
  const charCount = message.content.length
  const tokenEstimate = Math.ceil(charCount / 3)

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [message.content])

  const usage = message.tokenUsage

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
        {usage ? (
          <>
            <span>{usage.completion.toLocaleString()} {"tokens"}</span>
            <span className="text-muted-foreground/30">
              {"(prompt: "}{usage.prompt.toLocaleString()}{" / total: "}{usage.total.toLocaleString()}{")"}
            </span>
          </>
        ) : (
          <span>
            {"~"}{tokenEstimate.toLocaleString()} {"tokens"}
          </span>
        )}
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
/*  Template apply dropdown (inside system prompt)                     */
/* ------------------------------------------------------------------ */

function TemplateApplyDropdown({
  templates,
  onApply,
}: {
  templates: PromptTemplate[]
  onApply: (content: string) => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative" data-template-dropdown>
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] transition-all",
          "border border-border/60 bg-background/60 text-muted-foreground",
          "hover:border-primary/40 hover:text-foreground",
          open && "border-primary/40 text-primary bg-primary/5"
        )}
      >
        <AtSign className="h-3 w-3" />
        <span>{"テンプレートを適用"}</span>
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -4, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="absolute top-full left-0 mt-1 w-60 bg-card border border-border rounded-xl overflow-hidden z-50 shadow-lg"
            >
              <div className="max-h-48 overflow-y-auto custom-scrollbar">
                {templates.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      onApply(t.content)
                      setOpen(false)
                    }}
                    className="w-full text-left px-3 py-2.5 hover:bg-primary/5 transition-colors"
                  >
                    <div className="text-xs font-medium text-foreground truncate">
                      {t.name}
                    </div>
                    <div className="text-[10px] text-muted-foreground/50 truncate mt-0.5">
                      {t.content.slice(0, 60)}{"..."}
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
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
  const [isOpen, setIsOpen] = useState(false)
  const wasStreamingRef = useRef(false)

  useEffect(() => {
    if (!wasStreamingRef.current && isStreaming) {
      setIsOpen(true)
    }
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
