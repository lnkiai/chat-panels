"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import {
  ChevronRight,
  Settings2,
  User,
  Bot,
  Loader2,
  Pencil,
  Copy,
  Check,
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
        <div className="flex items-center w-full px-3.5 py-3">
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
              className="ml-2.5 text-xs font-heading bg-transparent border-b-2 border-primary outline-none px-0 py-0 w-28 text-foreground"
              maxLength={30}
            />
          ) : (
            <button
              onClick={() => {
                setTitleDraft(panel.title)
                setIsEditingTitle(true)
              }}
              className="ml-2.5 flex items-center gap-1.5 text-xs font-heading text-foreground hover:text-primary transition-colors group"
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
              <div className="px-3.5 pt-1 pb-3.5">
                <Textarea
                  value={panel.systemPrompt}
                  onChange={(e) => onUpdateSystemPrompt(e.target.value)}
                  className="text-xs min-h-[60px] resize-none font-mono bg-background/60 border-border/60 rounded-xl focus-visible:ring-primary/30 focus-visible:border-primary/40"
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
            <p className="text-xs text-muted-foreground/60">
              {"メッセージを入力して送信してください"}
            </p>
          </div>
        ) : (
          <div className="px-3 py-4 space-y-4">
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
/* Message bubble - reference design:                                  */
/*   User: right-aligned, rounded with cut top-right corner, white bg */
/*   AI: full-width, no wrapper card, content + action bar            */
/* ------------------------------------------------------------------ */

function MessageBubble({
  message,
  isLast,
}: {
  message: PanelState["messages"][number]
  isLast: boolean
}) {
  const isUser = message.role === "user"

  if (isUser) {
    return <UserBubble content={message.content} />
  }

  return (
    <AssistantMessage
      message={message}
      isLast={isLast}
    />
  )
}

/* --- User bubble --- */
function UserBubble({ content }: { content: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [content])

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 26 }}
      className="flex justify-end group"
    >
      {/* Hover copy button on the left */}
      <button
        onClick={handleCopy}
        className="self-center mr-2 h-7 w-7 flex items-center justify-center rounded-lg opacity-0 group-hover:opacity-100 transition-all text-muted-foreground hover:text-foreground hover:bg-muted/60"
        title={copied ? "Copied" : "Copy"}
      >
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      </button>

      <div className="max-w-[80%] px-4 py-3 rounded-2xl rounded-tr-sm border border-primary/15 bg-primary/5">
        <p className="text-sm whitespace-pre-wrap leading-relaxed text-foreground">
          {content}
        </p>
      </div>
    </motion.div>
  )
}

/* --- Assistant message --- */
function AssistantMessage({
  message,
  isLast,
}: {
  message: PanelState["messages"][number]
  isLast: boolean
}) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [message.content])

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 26 }}
      className="w-full"
    >
      {/* Header: icon + label */}
      <div className="flex items-center gap-2 mb-2">
        <div className="flex items-center justify-center h-6 w-6 rounded-lg bg-primary text-primary-foreground">
          <Bot className="h-3.5 w-3.5" />
        </div>
        <span className="text-xs font-heading text-foreground">Assistant</span>
        {message.isStreaming && (
          <Loader2 className="h-3 w-3 animate-spin text-primary" />
        )}
      </div>

      {/* Thinking process */}
      {message.thinking && message.thinking.length > 0 && (
        <ThinkingBlock
          thinking={message.thinking}
          isStreaming={!!message.isStreaming}
        />
      )}

      {/* Content */}
      <div className="pl-8">
        {message.content ? (
          <div className="text-sm leading-relaxed">
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

        {/* Action bar - only after streaming complete */}
        {!message.isStreaming && message.content.trim() !== "" && (
          <div className="flex items-center gap-1 mt-3 pt-2.5 border-t border-border/30">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 h-7 px-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all text-xs"
            >
              {copied ? (
                <>
                  <Check className="h-3 w-3" />
                  <span>{"コピー済み"}</span>
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" />
                  <span>{"コピー"}</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </motion.div>
  )
}

/* --- Thinking block --- */
function ThinkingBlock({
  thinking,
  isStreaming,
}: {
  thinking: string
  isStreaming: boolean
}) {
  const [isOpen, setIsOpen] = useState(true)

  return (
    <div className="pl-8 mb-2">
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
            <div className="mt-1.5 p-3 bg-primary/5 border border-primary/10 rounded-xl text-xs text-muted-foreground leading-relaxed overflow-x-auto max-h-64 overflow-y-auto custom-scrollbar">
              <Streamdown isAnimating={isStreaming}>{thinking}</Streamdown>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
