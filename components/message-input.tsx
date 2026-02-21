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
import { useI18n } from "@/lib/i18n/context"

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
  activeProviderId?: string
  onClearChats?: () => void
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
  activeProviderId,
  onClearChats,
}: MessageInputProps) {
  const value = draft
  const setValue = setDraft
  const [modelMenuOpen, setModelMenuOpen] = useState(false)
  const [confirmingModelId, setConfirmingModelId] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [uploading, setUploading] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<{ id: string, name: string }[]>([])
  const { t } = useI18n()

  const handleSubmit = useCallback(() => {
    const trimmed = value.trim()
    if (!trimmed && uploadedFiles.length === 0 || disabled || isAnyPanelLoading) return
    onSend(trimmed, uploadedFiles[0]?.id)
    setValue("")
    setUploadedFiles([])
    if (textareaRef.current) {
      textareaRef.current.style.height = "44px"
    }
  }, [value, uploadedFiles, disabled, isAnyPanelLoading, onSend, setValue])

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
                ? t("enterApiKeyMsg")
                : t("enterMsg")
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

          {/* Bottom row */}
          <div className="flex items-center justify-between px-3 pb-3 relative">
            <div className="flex items-center gap-1.5 flex-1 min-w-0 pr-2">

              {/* Attachment logic for dify/others */}
              <input
                type="file"
                className="hidden"
                multiple
                ref={fileInputRef}
                onChange={async (e) => {
                  const files = Array.from(e.target.files || [])
                  if (files.length === 0) return
                  setUploading(true)
                  try {
                    const newFiles = files.map((f, i) => ({ id: `local-pending-${Date.now()}-${i}`, name: f.name }))
                    setUploadedFiles(prev => [...prev, ...newFiles])
                    const currentPending = (window as any)._pendingFiles || []
                      ; (window as any)._pendingFiles = [...currentPending, ...files]
                      // Legacy single file fallback
                      ; (window as any)._pendingFile = files[0]
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
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="h-4 w-4 shrink-0" />}
              </motion.button>

              {/* Attachments inline preview */}
              <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar flex-1 min-w-0 pr-1">
                {uploadedFiles.map(f => (
                  <div key={f.id} className="flex-shrink-0 flex items-center gap-1 bg-muted/50 px-2 py-1.5 rounded-lg border border-border/80 h-[32px]">
                    <span className="text-[11px] text-foreground max-w-[80px] lg:max-w-[120px] truncate">{f.name}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setUploadedFiles(prev => prev.filter(x => x.id !== f.id))
                      }}
                      className="text-muted-foreground hover:text-foreground transition-colors ml-1 p-0.5 shrink-0"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
              {!enablePanelMode && (
                <div className="relative shrink-0 z-50">
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
                          className="absolute bottom-full -left-2 sm:left-0 mb-2 w-[260px] sm:w-72 bg-card border border-border rounded-2xl overflow-hidden z-50 shadow-[0_4px_20px_rgba(62,168,255,0.08)] flex flex-col max-h-[300px] max-w-[calc(100vw-32px)]"
                        >
                          <div className="overflow-y-auto custom-scrollbar">
                            {availableModels.length === 0 && (
                              <div className="px-4 py-3 text-xs text-muted-foreground">{t("noModelsAvailable")}</div>
                            )}
                            {availableModels.map((m, i) => (
                              <motion.div
                                key={m.id}
                                onClick={() => {
                                  if (activeProviderId === "dify" && model !== m.id) {
                                    setConfirmingModelId(m.id)
                                  } else {
                                    onUpdateModel(m.id)
                                    setModelMenuOpen(false)
                                  }
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
                                {confirmingModelId === m.id ? (
                                  <div className="flex flex-col gap-1.5 w-full">
                                    <span className="text-[10px] text-destructive font-bold">{t("willResetChat")}</span>
                                    <div className="flex gap-2 w-full justify-between items-center">
                                      <span className="text-xs font-semibold text-foreground truncate pl-1 flex-1">{m.label}</span>
                                      <div className="flex gap-1 shrink-0">
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            setConfirmingModelId(null)
                                          }}
                                          className="text-[10px] px-2 py-1 rounded bg-muted hover:bg-muted/80"
                                        >
                                          {t("cancel")}
                                        </button>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            onUpdateModel(m.id)
                                            if (onClearChats) onClearChats()
                                            setConfirmingModelId(null)
                                            setModelMenuOpen(false)
                                          }}
                                          className="text-[10px] px-2 py-1 rounded bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                        >
                                          {t("confirmDelete")}
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <>
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
                                  </>
                                )}
                              </motion.div>
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
              disabled={(!value.trim() && uploadedFiles.length === 0) || disabled || isAnyPanelLoading}
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
