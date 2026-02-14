"use client"

import { useState, useRef, useCallback } from "react"
import { ArrowUp, ChevronDown, Check } from "lucide-react"
import type { ModelId } from "@/lib/types"
import { MODELS } from "@/lib/types"
import { cn } from "@/lib/utils"

interface MessageInputProps {
  onSend: (message: string) => void
  disabled?: boolean
  isAnyPanelLoading?: boolean
  model: ModelId
  onUpdateModel: (model: ModelId) => void
}

export function MessageInput({
  onSend,
  disabled,
  isAnyPanelLoading,
  model,
  onUpdateModel,
}: MessageInputProps) {
  const [value, setValue] = useState("")
  const [modelMenuOpen, setModelMenuOpen] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const modelMenuRef = useRef<HTMLDivElement>(null)

  const handleSubmit = useCallback(() => {
    const trimmed = value.trim()
    if (!trimmed || disabled || isAnyPanelLoading) return
    onSend(trimmed)
    setValue("")
    if (textareaRef.current) {
      textareaRef.current.style.height = "44px"
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

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value)
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = "44px"
      const scrollHeight = textarea.scrollHeight
      textarea.style.height = Math.min(scrollHeight, 120) + "px"
    }
  }

  const currentModel = MODELS.find((m) => m.id === model)

  return (
    <footer className="bg-background border-t">
      <div className="px-3 pt-3 pb-3 max-w-3xl mx-auto">
        {/* Capsule input container */}
        <div className="bg-muted/50 border-2 border-border rounded-[24px] focus-within:border-foreground/20 focus-within:bg-background transition-all">
          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={value}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder={
              disabled
                ? "API Keyを入力してください..."
                : "メッセージを入力..."
            }
            disabled={disabled}
            rows={1}
            className={cn(
              "w-full bg-transparent border-none outline-none focus:outline-none focus:ring-0",
              "px-5 pt-3.5 pb-1.5 text-sm text-foreground placeholder:text-muted-foreground",
              "resize-none disabled:cursor-not-allowed disabled:opacity-50"
            )}
            style={{ minHeight: "44px", maxHeight: "120px", overflowY: "auto" }}
          />

          {/* Bottom row: Model selector (left) + Send button (right) */}
          <div className="flex items-center justify-between px-3 pb-2.5">
            {/* Model selector toggle */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setModelMenuOpen(!modelMenuOpen)}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all",
                  "border border-border bg-background text-muted-foreground",
                  "hover:bg-muted hover:text-foreground",
                  modelMenuOpen && "bg-muted text-foreground"
                )}
              >
                <span className="truncate max-w-[140px]">
                  {currentModel?.label || model}
                </span>
                <ChevronDown
                  className={cn(
                    "h-3 w-3 shrink-0 transition-transform",
                    modelMenuOpen && "rotate-180"
                  )}
                />
              </button>

              {/* Model dropdown */}
              {modelMenuOpen && (
                <>
                  {/* Backdrop to close */}
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setModelMenuOpen(false)}
                  />
                  <div
                    ref={modelMenuRef}
                    className="absolute bottom-full left-0 mb-2 w-72 bg-background border border-border rounded-lg overflow-hidden z-50"
                  >
                    {MODELS.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => {
                          onUpdateModel(m.id)
                          setModelMenuOpen(false)
                        }}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors",
                          "hover:bg-muted",
                          model === m.id && "bg-muted/70"
                        )}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium text-foreground">
                            {m.label}
                          </div>
                          <div className="text-[10px] text-muted-foreground mt-0.5">
                            {m.description}
                          </div>
                        </div>
                        {model === m.id && (
                          <Check className="h-3.5 w-3.5 text-foreground shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Send button - circle with arrow up */}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!value.trim() || disabled || isAnyPanelLoading}
              className={cn(
                "p-2 rounded-full transition-all",
                "bg-foreground text-background",
                "disabled:opacity-30 disabled:cursor-not-allowed",
                "hover:opacity-90 active:scale-95"
              )}
              aria-label="送信"
            >
              {isAnyPanelLoading ? (
                <div className="h-4 w-4 border-2 border-background/30 border-t-background rounded-full animate-spin" />
              ) : (
                <ArrowUp className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {/* Helper text */}
        <p className="text-center text-[10px] text-muted-foreground mt-2">
          {"全アクティブパネルに同時送信 ・ Shift+Enter で改行"}
        </p>
      </div>
    </footer>
  )
}
