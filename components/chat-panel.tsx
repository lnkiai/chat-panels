"use client"

import { useState, useEffect, useRef } from "react"
import {
  ChevronDown,
  ChevronRight,
  Settings2,
  User,
  Bot,
  Loader2,
} from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { MarkdownRenderer } from "@/components/markdown-renderer"
import type { PanelState } from "@/lib/types"
import { cn } from "@/lib/utils"

interface ChatPanelProps {
  panel: PanelState
  panelIndex: number
  totalPanels: number
  onUpdateSystemPrompt: (prompt: string) => void
}

export function ChatPanel({
  panel,
  panelIndex,
  totalPanels,
  onUpdateSystemPrompt,
}: ChatPanelProps) {
  const [isSystemPromptOpen, setIsSystemPromptOpen] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [panel.messages])

  return (
    <div
      className={cn(
        "flex flex-col h-full min-w-0",
        panelIndex < totalPanels - 1 && "border-r"
      )}
    >
      {/* Panel header with system prompt */}
      <div className="border-b shrink-0">
        <button
          onClick={() => setIsSystemPromptOpen(!isSystemPromptOpen)}
          className="flex items-center gap-2 w-full px-3 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
          aria-expanded={isSystemPromptOpen}
        >
          {isSystemPromptOpen ? (
            <ChevronDown className="h-3 w-3 shrink-0" />
          ) : (
            <ChevronRight className="h-3 w-3 shrink-0" />
          )}
          <Settings2 className="h-3 w-3 shrink-0" />
          <span className="font-medium">
            Panel {panelIndex + 1}
          </span>
          <span className="text-muted-foreground truncate">
            {isSystemPromptOpen
              ? "System Prompt"
              : `- ${panel.systemPrompt.slice(0, 50)}${panel.systemPrompt.length > 50 ? "..." : ""}`}
          </span>
        </button>

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

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {panel.messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-xs text-muted-foreground">
              メッセージを入力して送信してください
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

                {/* Thinking process (collapsible) */}
                {message.thinking && (
                  <ThinkingBlock thinking={message.thinking} />
                )}

                {/* Message content */}
                <div className="pl-7">
                  {message.role === "user" ? (
                    <p className="text-sm whitespace-pre-wrap">
                      {message.content}
                    </p>
                  ) : message.content ? (
                    <MarkdownRenderer content={message.content} />
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
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
    </div>
  )
}

function ThinkingBlock({ thinking }: { thinking: string }) {
  const [isOpen, setIsOpen] = useState(false)

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
        <span className="font-medium">Thinking Process</span>
      </button>
      {isOpen && (
        <div className="mt-1.5 p-2.5 bg-muted/50 border rounded-sm text-xs text-muted-foreground font-mono leading-relaxed whitespace-pre-wrap overflow-x-auto">
          {thinking}
        </div>
      )}
    </div>
  )
}
