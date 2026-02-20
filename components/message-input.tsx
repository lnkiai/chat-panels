"use client"

import { useState, useRef, useCallback } from "react"
import {
  ArrowUp,
  ChevronDown,
  Check,
  Settings2,
  Paperclip,
  X,
  Loader2
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import type { ModelId, PanelState } from "@/lib/types"
import { cn } from "@/lib/utils"

interface AIModel {
  id: string
  label: string
  description?: string
}

interface MessageInputProps {
  onSend: (message: string, fileId?: string) => void
  disabled?: boolean
  isAnyPanelLoading?: boolean
  model: ModelId
  availableModels: AIModel[] // New prop
  onUpdateModel: (model: ModelId) => void
  draft: string
  setDraft: (value: string) => void
  mobilePanel?: PanelState
  onUpdateMobileSystemPrompt?: (prompt: string) => void
  onUpdateMobileTitle?: (title: string) => void
  mobilePromptOpen?: boolean
  setMobilePromptOpen?: (open: boolean) => void
  enablePanelMode?: boolean
}

export function MessageInput({
  onSend,
  disabled,
  isAnyPanelLoading,
  model,
  availableModels,
  onUpdateModel,
  draft,
  setDraft,
  mobilePanel,
  mobilePromptOpen = false,
  setMobilePromptOpen,
  enablePanelMode = false,
}: MessageInputProps) {
  const value = draft
  const setValue = setDraft
  const [modelMenuOpen, setModelMenuOpen] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [uploading, setUploading] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<{ id: string, name: string } | null>(null)

  const handleSubmit = useCallback(() => {
    const trimmed = value.trim()
    if (!trimmed && !uploadedFile || disabled || isAnyPanelLoading) return
    onSend(trimmed, uploadedFile?.id)
    setValue("")
    setUploadedFile(null)
    if (textareaRef.current) {
      textareaRef.current.style.height = "44px"
    }
  }, [value, uploadedFile, disabled, isAnyPanelLoading, onSend, setValue])

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

  const currentModel = availableModels.find((m) => m.id === model)

  return (
    <footer className="border-none shrink-0 relative z-20 bg-gradient-to-t from-background from-45% via-background/90 to-transparent pt-8 md:pt-12 pointer-events-none">
      <div className="px-4 pb-4 max-w-3xl mx-auto pointer-events-auto">
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
              "resize-none disabled:cursor-not-allowed disabled:opacity-50 custom-scrollbar"
            )}
            style={{
              minHeight: "44px",
              maxHeight: "120px",
              overflowY: "auto",
            }}
          />

          {/* Attachments preview */}
          {uploadedFile && (
            <div className="px-4 pb-2">
              <div className="flex items-center gap-2 bg-muted/50 w-max px-3 py-1.5 rounded-lg border border-border">
                <span className="text-xs text-foreground max-w-[150px] truncate">{uploadedFile.name}</span>
                <button
                  type="button"
                  onClick={() => setUploadedFile(null)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Bottom row */}
          <div className="flex items-center justify-between px-3 pb-3">
            <div className="flex items-center gap-1.5">

              {/* Attachment logic for dify/others */}
              <input
                type="file"
                className="hidden"
                ref={fileInputRef}
                onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  setUploading(true)
                  try {
                    // For simply passing it through, we assume the Dify Upload API.
                    // If we require credentials here, `usePlayground` can supply them.
                    // This is minimal MVP relying on global/panel settings.
                    // Note: Since we don't have apiKey right here, we should dispatch an action or fetch differently.
                    // Actually, if we just want UI to handle it, we can trigger an event or pass a prop.
                    // For now, let's assume we pass the file to onSend and handle upload in use-playground.
                    setUploadedFile({ id: "local-pending", name: file.name })
                      // Store the real file on a custom property to process later
                      ; (window as any)._pendingFile = file
                  } finally {
                    setUploading(false)
                    if (fileInputRef.current) fileInputRef.current.value = ""
                  }
                }}
              />
              <motion.button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-xl transition-colors"
              >
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
              </motion.button>

              {/* Model selector - hidden if Panel Mode is enabled */}
              {!enablePanelMode && (
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
                    <span className="truncate max-w-[100px] md:max-w-[160px]">
                      {currentModel?.label || (availableModels[0]?.label ?? model)}
                    </span>
                    <motion.span
                      animate={{ rotate: modelMenuOpen ? 180 : 0 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    >
                      <ChevronDown className="h-3 w-3 shrink-0" />
                    </motion.span>
                  </motion.button>

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
                          className="absolute bottom-full left-0 mb-2 w-72 bg-card border border-border rounded-2xl overflow-hidden z-50 shadow-[0_4px_20px_rgba(62,168,255,0.08)] flex flex-col max-h-[300px]"
                        >
                          <div className="overflow-y-auto custom-scrollbar">
                            {availableModels.length === 0 && (
                              <div className="px-4 py-3 text-xs text-muted-foreground">No models available</div>
                            )}
                            {availableModels.map((m, i) => (
                              <motion.button
                                key={m.id}
                                onClick={() => {
                                  onUpdateModel(m.id)
                                  setModelMenuOpen(false)
                                }}
                                initial={{ opacity: 0, x: -8 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{
                                  delay: Math.min(i, 20) * 0.02, // cap delay to avoid long waits for huge lists
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
                          </div>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Mobile: system prompt button removed, now in chat-panel directly */}
            </div>

            {/* Send button */}
            <motion.button
              type="button"
              onClick={handleSubmit}
              disabled={(!value.trim() && !uploadedFile) || disabled || isAnyPanelLoading}
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
