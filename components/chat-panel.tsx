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
    <div className="flex flex-col h-full min-w-0">
      {/* Panel header with title + system prompt toggle */}
      <div className="border-b shrink-0">
        <div className="flex items-center w-full px-3 py-2">
          {/* Collapsible toggle */}
          <button
            onClick={() => setIsSystemPromptOpen(!isSystemPromptOpen)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors shrink-0"
            aria-expanded={isSystemPromptOpen}
          >
            {isSystemPromptOpen ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
            <Settings2 className="h-3 w-3" />
          </button>

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
              className="ml-2 text-xs font-medium bg-transparent border-b border-foreground outline-none px-0 py-0 w-24"
              maxLength={30}
            />
          ) : (
            <button
              onClick={() => {
                setTitleDraft(panel.title)
                setIsEditingTitle(true)
              }}
              className="ml-2 flex items-center gap-1 text-xs font-medium text-foreground hover:text-muted-foreground transition-colors group"
            >
              <span>{panel.title}</span>
              <Pencil className="h-2.5 w-2.5 opacity-0 group-hover:opacity-60 transition-opacity" />
            </button>
          )}

          {/* System prompt preview when collapsed */}
          {!isSystemPromptOpen && (
            <span className="ml-2 text-[10px] text-muted-foreground truncate">
              {panel.systemPrompt.slice(0, 40)}
              {panel.systemPrompt.length > 40 ? "..." : ""}
            </span>
          )}
        </div>

        {isSystemPromptOpen && (
          <div className="px-3 pb-3">
            <Textarea
              value={panel.systemPrompt}
              onChange={(e) => onUpdateSystemPrompt(e.target.value)}
              className="text-xs min-h-[60px] resize-none font-mono bg-muted/50 border-border"
              placeholder="System prompt..."
              rows={3}
            />
          </div>
        )}
      </div>

      {/* Messages area - fixed height with internal scroll */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {panel.messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-xs text-muted-foreground">
              {"メッセージを入力して送信してください"}
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {panel.messages.map((message) => (
              <div key={message.id} className="px-3 py-3">
                {/* Message header */}
                <div className="flex items-center gap-2 mb-2">
                  {message.role === "user" ? (
                    <>
                      <div className="flex items-center justify-center h-5 w-5 rounded-sm border bg-background">
                        <User className="h-3 w-3" />
                      </div>
                      <span className="text-xs font-medium">You</span>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center justify-center h-5 w-5 rounded-sm border bg-foreground text-background">
                        <Bot className="h-3 w-3" />
                      </div>
                      <span className="text-xs font-medium">Assistant</span>
                      {message.isStreaming && (
                        <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
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
                    <p className="text-sm whitespace-pre-wrap">
                      {message.content}
                    </p>
                  ) : message.content ? (
                    <div className="text-sm">
                      <Streamdown isAnimating={!!message.isStreaming}>
                        {message.content}
                      </Streamdown>
                    </div>
                  ) : message.isStreaming ? (
                    <div className="flex items-center gap-1.5">
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-muted-foreground animate-pulse" />
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-muted-foreground animate-pulse [animation-delay:150ms]" />
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-muted-foreground animate-pulse [animation-delay:300ms]" />
                    </div>
                  ) : null}
                </div>
              </div>
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
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        aria-expanded={isOpen}
      >
        {isOpen ? (
          <ChevronDown className="h-3 w-3" />
        ) : (
          <ChevronRight className="h-3 w-3" />
        )}
        <span className="font-medium">
          {"Thinking Process"}
          {isStreaming && " ..."}
        </span>
      </button>
      {isOpen && (
        <div className="mt-1.5 p-2.5 bg-muted/50 border rounded-sm text-xs text-muted-foreground leading-relaxed overflow-x-auto max-h-64 overflow-y-auto">
          <Streamdown isAnimating={isStreaming}>{thinking}</Streamdown>
        </div>
      )}
    </div>
  )
}
