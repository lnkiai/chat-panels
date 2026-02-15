"use client"

import { useState, useRef, useCallback } from "react"
import {
  ArrowUp,
  ChevronDown,
  Check,
  Settings2,
  ChevronRight,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Textarea } from "@/components/ui/textarea"
import type { ModelId, PanelState } from "@/lib/types"
import { MODELS } from "@/lib/types"
import { cn } from "@/lib/utils"

interface MessageInputProps {
  onSend: (message: string) => void
  disabled?: boolean
  isAnyPanelLoading?: boolean
  model: ModelId
  onUpdateModel: (model: ModelId) => void
  draft: string
  setDraft: (value: string) => void
  mobilePanel?: PanelState
  onUpdateMobileSystemPrompt?: (prompt: string) => void
}

export function MessageInput({
  onSend,
  disabled,
  isAnyPanelLoading,
  model,
  onUpdateModel,
  draft,
  setDraft,
  mobilePanel,
  onUpdateMobileSystemPrompt,
}: MessageInputProps) {
  const value = draft
  const setValue = setDraft
  const [modelMenuOpen, setModelMenuOpen] = useState(false)
  const [mobilePromptOpen, setMobilePromptOpen] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSubmit = useCallback(() => {
    const trimmed = value.trim()
    if (!trimmed || disabled || isAnyPanelLoading) return
    onSend(trimmed)
    setValue("")
    if (textareaRef.current) {
      textareaRef.current.style.height = "44px"
    }
  }, [value, disabled, isAnyPanelLoading, onSend, setValue])

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
    <footer className="bg-transparent border-none shrink-0 relative z-20">
      {/* Mobile system prompt editor overlay */}
      <AnimatePresence>
        {mobilePromptOpen && mobilePanel && onUpdateMobileSystemPrompt && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="md:hidden overflow-hidden border-t border-border/40 bg-card/95 backdrop-blur-sm"
          >
            <div className="px-4 py-3 flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-heading text-foreground">
                  {mobilePanel.title} - System Prompt
                </span>
                <button
                  onClick={() => setMobilePromptOpen(false)}
                  className="text-[10px] text-primary"
                >
                  Done
                </button>
              </div>
              <Textarea
                value={mobilePanel.systemPrompt}
                onChange={(e) => onUpdateMobileSystemPrompt(e.target.value)}
                className="text-xs min-h-[80px] resize-none font-mono bg-background/60 border-border/60 rounded-xl focus-visible:ring-primary/30 focus-visible:border-primary/40 custom-scrollbar"
                placeholder="System prompt..."
                rows={3}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="px-4 pt-2 pb-4 max-w-3xl mx-auto">
        {/* Capsule input container */}
        <div className="bg-card border-2 border-border rounded-[28px] focus-within:border-primary/40 transition-all shadow-[0_2px_12px_rgba(62,168,255,0.06)]">
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
              "px-6 pt-4 pb-1.5 text-sm text-foreground placeholder:text-muted-foreground",
              "resize-none disabled:cursor-not-allowed disabled:opacity-50"
            )}
            style={{
              minHeight: "44px",
              maxHeight: "120px",
              overflowY: "auto",
            }}
          />

          {/* Bottom row */}
          <div className="flex items-center justify-between px-3 pb-3">
            <div className="flex items-center gap-1.5">
              {/* Model selector toggle */}
              <div className="relative">
                <motion.button
                  type="button"
                  onClick={() => setModelMenuOpen(!modelMenuOpen)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all",
                    "border border-border bg-background text-muted-foreground",
                    "hover:border-primary/40 hover:text-foreground",
                    modelMenuOpen &&
                      "border-primary/40 text-foreground bg-primary/5"
                  )}
                >
                  <span className="truncate max-w-[120px] md:max-w-[160px]">
                    {currentModel?.label || model}
                  </span>
                  <motion.span
                    animate={{ rotate: modelMenuOpen ? 180 : 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  >
                    <ChevronDown className="h-3 w-3 shrink-0" />
                  </motion.span>
                </motion.button>

                {/* Model dropdown */}
                <AnimatePresence>
                  {modelMenuOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setModelMenuOpen(false)}
                      />
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.96 }}
                        transition={{
                          type: "spring",
                          stiffness: 400,
                          damping: 25,
                        }}
                        className="absolute bottom-full left-0 mb-2 w-72 bg-card border border-border rounded-2xl overflow-hidden z-50 shadow-[0_4px_20px_rgba(62,168,255,0.08)]"
                      >
                        {MODELS.map((m, i) => (
                          <motion.button
                            key={m.id}
                            onClick={() => {
                              onUpdateModel(m.id)
                              setModelMenuOpen(false)
                            }}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{
                              delay: i * 0.03,
                              type: "spring",
                              stiffness: 300,
                              damping: 25,
                            }}
                            className={cn(
                              "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors",
                              "hover:bg-primary/5",
                              model === m.id && "bg-primary/8"
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
                              <motion.span
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{
                                  type: "spring",
                                  stiffness: 500,
                                  damping: 20,
                                }}
                              >
                                <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                              </motion.span>
                            )}
                          </motion.button>
                        ))}
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>

              {/* Mobile: system prompt button */}
              {mobilePanel && onUpdateMobileSystemPrompt && (
                <motion.button
                  type="button"
                  onClick={() => setMobilePromptOpen(!mobilePromptOpen)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  className={cn(
                    "md:hidden flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs transition-all",
                    "border border-border bg-background text-muted-foreground",
                    "hover:border-primary/40 hover:text-foreground",
                    mobilePromptOpen &&
                      "border-primary/40 text-primary bg-primary/5"
                  )}
                >
                  <Settings2 className="h-3 w-3 shrink-0" />
                  <span className="truncate max-w-[80px] text-[11px]">
                    {mobilePanel.title}
                  </span>
                  <motion.span
                    animate={{ rotate: mobilePromptOpen ? 90 : 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  >
                    <ChevronRight className="h-2.5 w-2.5 shrink-0" />
                  </motion.span>
                </motion.button>
              )}
            </div>

            {/* Send button */}
            <motion.button
              type="button"
              onClick={handleSubmit}
              disabled={!value.trim() || disabled || isAnyPanelLoading}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.9 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
              className={cn(
                "p-2.5 rounded-full transition-all",
                "bg-primary text-primary-foreground",
                "disabled:opacity-25 disabled:cursor-not-allowed"
              )}
              aria-label="Send"
            >
              {isAnyPanelLoading ? (
                <div className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              ) : (
                <ArrowUp className="h-4 w-4" strokeWidth={2.5} />
              )}
            </motion.button>
          </div>
        </div>
      </div>
    </footer>
  )
}
