"use client"

import { useState, useRef, useCallback } from "react"
import { Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface MessageInputProps {
  onSend: (message: string) => void
  disabled?: boolean
  isAnyPanelLoading?: boolean
}

export function MessageInput({
  onSend,
  disabled,
  isAnyPanelLoading,
}: MessageInputProps) {
  const [value, setValue] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSubmit = useCallback(() => {
    const trimmed = value.trim()
    if (!trimmed || disabled || isAnyPanelLoading) return
    onSend(trimmed)
    setValue("")
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
    }
  }, [value, disabled, isAnyPanelLoading, onSend])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault()
        handleSubmit()
      }
    },
    [handleSubmit]
  )

  const handleInput = useCallback(() => {
    const textarea = textareaRef.current
    if (!textarea) return
    textarea.style.height = "auto"
    textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`
  }, [])

  return (
    <footer className="border-t bg-background">
      <div className="flex items-end gap-2 px-4 py-3 max-w-5xl mx-auto">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => {
              setValue(e.target.value)
              handleInput()
            }}
            onKeyDown={handleKeyDown}
            placeholder={
              disabled
                ? "API Keyを入力してください..."
                : "メッセージを入力... (Enter で送信, Shift+Enter で改行)"
            }
            disabled={disabled}
            rows={1}
            className={cn(
              "w-full resize-none rounded-sm border bg-background px-3 py-2 text-sm",
              "placeholder:text-muted-foreground",
              "focus:outline-none focus:ring-1 focus:ring-ring",
              "disabled:cursor-not-allowed disabled:opacity-50",
              "min-h-[38px] max-h-[160px]"
            )}
          />
        </div>
        <Button
          onClick={handleSubmit}
          disabled={!value.trim() || disabled || isAnyPanelLoading}
          size="sm"
          className="h-[38px] px-3 shrink-0 bg-foreground text-background hover:bg-foreground/90"
        >
          {isAnyPanelLoading ? (
            <div className="flex items-center gap-1.5">
              <span className="inline-block h-1 w-1 rounded-full bg-background animate-pulse" />
              <span className="inline-block h-1 w-1 rounded-full bg-background animate-pulse [animation-delay:150ms]" />
              <span className="inline-block h-1 w-1 rounded-full bg-background animate-pulse [animation-delay:300ms]" />
            </div>
          ) : (
            <Send className="h-4 w-4" />
          )}
          <span className="sr-only">送信</span>
        </Button>
      </div>
      <div className="text-center pb-2">
        <p className="text-[10px] text-muted-foreground">
          {"全アクティブパネルに同時送信されます"}
        </p>
      </div>
    </footer>
  )
}
