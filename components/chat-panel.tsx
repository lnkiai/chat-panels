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
  Box,
  ThumbsUp,
  ThumbsDown,
  Download,
  X,
  Paperclip,
} from "lucide-react"
import { TextShimmer } from "@/components/core/text-shimmer"
import { motion, AnimatePresence } from "framer-motion"
import { Streamdown } from "streamdown"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { PanelState, ChatMessage, PromptTemplate } from "@/lib/types"
import { getAllProviders, getProvider } from "@/lib/ai-providers/registry"
import { cn } from "@/lib/utils"
import { useI18n } from "@/lib/i18n/context"

interface ChatPanelProps {
  panel: PanelState
  panelIndex: number
  totalPanels: number
  onUpdateSystemPrompt: (prompt: string) => void
  onUpdateTitle: (title: string) => void
  onUpdateConfig?: (config: { providerId?: string; modelId?: string; apiKey?: string, baseUrl?: string }) => void
  enablePanelMode?: boolean
  templates?: PromptTemplate[]
  onApplyTemplate?: (content: string) => void
  availableProviders?: { id: string; name: string; models: { id: string; label: string; description?: string }[] }[]
  onSend?: (message: string) => void
  onExportPanel?: (panelId: number) => void
  difyParameters?: any
  onUpdateDifyInputs?: (panelId: number, inputs: Record<string, any>) => void
  onRefreshDifyParameters?: (panelId: number) => void
  onRegisterDifyApp?: (apiKey: string, baseUrl?: string) => Promise<void>
  activeProviderId?: string
  isAnyPanelLoading?: boolean
}

export function ChatPanel({
  panel,
  onUpdateSystemPrompt,
  onUpdateTitle,
  onUpdateConfig,
  enablePanelMode = false,
  templates = [],
  onApplyTemplate,
  availableProviders,
  onSend,
  onExportPanel,
  difyParameters,
  onUpdateDifyInputs,
  onRefreshDifyParameters,
  onRegisterDifyApp,
  activeProviderId,
  isAnyPanelLoading
}: ChatPanelProps) {
  const [isSystemPromptOpen, setIsSystemPromptOpen] = useState(false)
  const [isRegisteringApp, setIsRegisteringApp] = useState(false)
  const [titleDraft, setTitleDraft] = useState(panel.title)
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const titleInputRef = useRef<HTMLInputElement>(null)
  const [pendingParamFiles, setPendingParamFiles] = useState<Record<string, File[]>>({})
  const { t } = useI18n()

  const effectiveProviderId = enablePanelMode ? (panel.providerId || activeProviderId) : activeProviderId
  const effectiveModelId = enablePanelMode ? (panel.modelId || activeProviderId) : activeProviderId // Just for logic if needed, actually page.tsx sends the right one.

  const commitTitle = () => {
    const trimmed = titleDraft.trim()
    if (trimmed) {
      onUpdateTitle(trimmed)
    } else {
      setTitleDraft(panel.title)
    }
    setIsEditingTitle(false)
  }

  useEffect(() => {
    if (isSystemPromptOpen && titleInputRef.current) {
      titleInputRef.current.focus()
    }
  }, [isSystemPromptOpen])

  const prevLoadingRef = useRef(isAnyPanelLoading)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (prevLoadingRef.current && !isAnyPanelLoading) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }
    prevLoadingRef.current = isAnyPanelLoading
  }, [isAnyPanelLoading])

  return (
    <div className="flex flex-col h-full min-w-0 overflow-hidden bg-background border-r border-border/20 last:border-r-0">
      {/* Panel header */}
      <div className="shrink-0 flex-col block z-10 border-b border-border/20 md:border-none">
        <div
          onClick={() => setIsSystemPromptOpen(!isSystemPromptOpen)}
          className="flex items-center justify-between w-full px-3.5 py-2.5 cursor-pointer hover:bg-muted/30 transition-colors"
        >
          <div className="flex items-center gap-1 text-xs font-heading text-foreground hover:text-primary transition-colors group flex-shrink-0 min-w-0">
            <motion.span
              animate={{ rotate: isSystemPromptOpen ? 90 : 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <ChevronRight className="h-3 w-3 text-muted-foreground mr-1" />
            </motion.span>
            <span className="truncate max-w-[150px]">{panel.title}</span>
          </div>

          <div className="flex items-center gap-2 flex-1 justify-end min-w-0">
            {!isSystemPromptOpen && panel.systemPrompt.trim() && effectiveProviderId !== "dify" && (
              <span className="text-[10px] text-muted-foreground/40 hidden md:block truncate min-w-0 ml-2">
                {panel.systemPrompt}
              </span>
            )}
            {!isSystemPromptOpen && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onExportPanel?.(panel.id)
                }}
                className="text-muted-foreground hover:text-primary transition-colors p-1 shrink-0 ml-auto"
                title="Export"
              >
                <Download className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        <AnimatePresence>
          {isSystemPromptOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              className="overflow-visible"
            >
              <div className="px-3.5 pt-2 pb-3 flex flex-col gap-1.5">
                {/* Panel Mode Selectors */}
                {enablePanelMode && onUpdateConfig && (
                  <div className="flex flex-col gap-2 mb-2 p-3 bg-muted/30 rounded-xl border border-border/40">
                    <div className="grid grid-cols-2 gap-2">
                      <ConfigDropdown
                        label="Provider"
                        value={panel.providerId || ""}
                        options={(availableProviders || getAllProviders().map(p => ({
                          id: p.id,
                          name: p.name,
                          models: p.models.map(m => ({ id: m.id, label: m.label, description: m.description }))
                        }))).map(p => ({ id: p.id, label: p.name }))}
                        onChange={(val) => onUpdateConfig({ providerId: val })}
                      />
                      <ConfigDropdown
                        label="Model"
                        displayValueOverride={(() => {
                          const isDify = effectiveProviderId === "dify"
                          if (isDify && difyParameters?.user_input_form && difyParameters?.user_input_form.length > 0) {
                            const summary = difyParameters.user_input_form
                              .filter((uf: any) => {
                                const type = Object.keys(uf)[0]
                                return !uf[type].hide
                              })
                              .map((uf: any) => {
                                const type = Object.keys(uf)[0]
                                return `${type}:${uf[type].variable}`
                              }).join(", ")
                            if (summary) return summary
                          }
                          return undefined
                        })()}
                        value={panel.modelId || ""}
                        options={(() => {
                          const providers = availableProviders || getAllProviders().map(p => ({
                            id: p.id,
                            name: p.name,
                            models: p.models.map(m => ({ id: m.id, label: m.label, description: m.description }))
                          }))
                          const currentProviderId = panel.providerId || providers[0]?.id
                          const provider = providers.find(p => p.id === currentProviderId)
                          return provider?.models || []
                        })()}
                        onChange={(val) => onUpdateConfig({ modelId: val })}
                        disabled={!panel.providerId && (!availableProviders || availableProviders.length === 0)}
                      />
                    </div>

                    {/* Dify Specific Settings */}
                    {panel.providerId === "dify" && (
                      <div className="mt-3 space-y-2 mb-4 p-3 bg-primary/5 border border-primary/10 rounded-xl">
                        <p className="text-[10px] font-bold text-primary/80 uppercase tracking-wider">Dify App Settings</p>
                        <div className="space-y-2">
                          <div className="space-y-1">
                            <label className="text-[10px] text-muted-foreground ml-1">App API Key</label>
                            <div className="flex gap-2">
                              <input
                                type="password"
                                className="flex-1 text-xs bg-background border border-border/60 rounded-lg px-2 py-1.5 focus:border-primary/40 focus:outline-none"
                                value={panel.apiKey || ""}
                                onChange={e => onUpdateConfig?.({ apiKey: e.target.value })}
                                placeholder="App API Key (Overrides global)"
                              />
                              <button
                                onClick={async () => {
                                  if (!panel.apiKey) return
                                  setIsRegisteringApp(true)
                                  try {
                                    await onRegisterDifyApp?.(panel.apiKey, panel.baseUrl)
                                  } finally {
                                    setIsRegisteringApp(false)
                                  }
                                }}
                                disabled={isRegisteringApp || !panel.apiKey}
                                className={cn(
                                  "p-1.5 bg-primary/10 hover:bg-primary/20 rounded-lg text-primary transition-colors h-8",
                                  (isRegisteringApp || !panel.apiKey) && "opacity-50 cursor-not-allowed"
                                )}
                                title="Register App as Model"
                              >
                                <Settings2 className={cn("h-3.5 w-3.5", isRegisteringApp && "animate-spin")} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Panel Name Title edit inside settings */}
                <div className="mb-2">
                  <input
                    ref={titleInputRef}
                    value={titleDraft}
                    onChange={(e) => setTitleDraft(e.target.value)}
                    onBlur={commitTitle}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") commitTitle()
                    }}
                    className="w-full text-xs font-heading bg-transparent border-b border-border/40 hover:border-border outline-none focus:border-primary transition-colors px-1 py-1 text-foreground"
                    placeholder="Panel Name"
                    maxLength={30}
                  />
                </div>

                {/* Template apply dropdown */}
                {effectiveProviderId !== "dify" && templates.length > 0 && onApplyTemplate && (
                  <div className="relative z-50">
                    <TemplateApplyDropdown
                      templates={templates}
                      onApply={onApplyTemplate}
                    />
                  </div>
                )}
                {/* System Prompt only for non-Dify */}
                {effectiveProviderId !== "dify" && (
                  <>
                    <Textarea
                      value={panel.systemPrompt}
                      onChange={(e) => onUpdateSystemPrompt(e.target.value)}
                      className="text-xs min-h-[80px] resize-none font-mono bg-background/60 border-border/60 rounded-xl focus-visible:ring-primary/30 focus-visible:border-primary/40 custom-scrollbar"
                      placeholder={t("systemPromptTitle")}
                      rows={3}
                    />
                  </>
                )}

                {/* Dify Custom Variables & Features */}
                {effectiveProviderId === "dify" && (
                  <div className="mt-4 space-y-3">
                    {difyParameters?.user_input_form && difyParameters.user_input_form.length > 0 && (
                      <div className="p-3 bg-muted/20 border border-border/40 rounded-xl mb-2 mx-1 shadow-sm">
                        <p className="text-xs font-semibold text-foreground/80 mb-3 ml-1 flex items-center justify-between">
                          <span>{t("customParams")}</span>
                        </p>
                        <div className="space-y-4 max-h-[250px] overflow-y-auto custom-scrollbar px-1 pb-1">
                          {difyParameters.user_input_form.map((uf: any, idx: number) => {
                            const type = Object.keys(uf)[0]
                            const field = uf[type]
                            if (field.hide) return null

                            return (
                              <div key={idx} className="space-y-1.5 mt-2">
                                {type === "checkbox" ? (
                                  <label className="flex items-center gap-2 cursor-pointer py-1.5 px-2 rounded-lg hover:bg-background/40 transition-colors border border-border/20">
                                    <input
                                      type="checkbox"
                                      className="peer appearance-none shrink-0 w-[14px] h-[14px] border border-border/80 rounded-sm bg-background/50 checked:bg-primary checked:border-0 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer relative checked:after:content-[''] checked:after:absolute checked:after:left-[4px] checked:after:top-[1px] checked:after:w-[4px] checked:after:h-[8px] checked:after:border-r-[1.5px] checked:after:border-b-[1.5px] checked:after:border-white checked:after:rotate-45"
                                      checked={panel.difyInputs?.[field.variable] ?? (field.default === "true" || field.default === true) ?? false}
                                      onChange={e => onUpdateDifyInputs?.(panel.id, { [field.variable]: e.target.checked })}
                                    />
                                    <span className="text-[11px] font-medium text-foreground/90 select-none block flex-1">{field.label} {field.required && <span className="text-destructive">*</span>}</span>
                                    {!field.required && <span className="text-[9px] text-muted-foreground/60">Optional</span>}
                                  </label>
                                ) : (
                                  <>
                                    <div className="flex h-5 items-center justify-between px-1">
                                      <div className="text-[11px] font-semibold text-foreground/85 flex items-center gap-1">
                                        {field.label} {field.required && <span className="text-destructive">*</span>}
                                      </div>
                                      {!field.required && <div className="text-[9px] text-muted-foreground/50">Optional</div>}
                                    </div>
                                    {type === "text-input" ? (
                                      <input
                                        type="text"
                                        className="w-full text-xs bg-background/80 border border-border/50 rounded-lg px-2.5 py-1.5 focus:border-primary/40 focus:bg-background focus:outline-none transition-colors shadow-sm"
                                        value={panel.difyInputs?.[field.variable] ?? field.default ?? ""}
                                        onChange={e => onUpdateDifyInputs?.(panel.id, { [field.variable]: e.target.value })}
                                        placeholder={field.label}
                                      />
                                    ) : type === "number" ? (
                                      <input
                                        type="number"
                                        className="w-full text-xs bg-background/80 border border-border/50 rounded-lg px-2.5 py-1.5 focus:border-primary/40 focus:bg-background focus:outline-none transition-colors shadow-sm"
                                        value={panel.difyInputs?.[field.variable] ?? field.default ?? ""}
                                        onChange={e => onUpdateDifyInputs?.(panel.id, { [field.variable]: Number(e.target.value) })}
                                        placeholder={field.label}
                                      />
                                    ) : type === "select" ? (
                                      <Select
                                        value={panel.difyInputs?.[field.variable] ?? field.default ?? ""}
                                        onValueChange={(val) => onUpdateDifyInputs?.(panel.id, { [field.variable]: val })}
                                      >
                                        <SelectTrigger className="w-full text-[11px] h-8 bg-background border-border/60 focus:ring-primary/30">
                                          <SelectValue placeholder={`Select ${field.label}`} />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {field.options?.map((opt: string) => (
                                            <SelectItem key={opt} value={opt} className="text-[11px]">
                                              {opt}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    ) : type === "file" || type === "file-list" ? (
                                      <div className="flex flex-col gap-2">
                                        <div className="flex items-center gap-2">
                                          <div className="flex-1">
                                            <input
                                              type="text"
                                              id={`dify-file-url-${panel.id}-${field.variable}`}
                                              className="w-full text-xs bg-background/80 border border-border/50 rounded-lg px-2.5 py-1.5 focus:border-primary/40 focus:bg-background focus:outline-none transition-colors shadow-sm"
                                              placeholder="File URL..."
                                            />
                                          </div>
                                          <input
                                            type="file"
                                            id={`dify-file-${panel.id}-${field.variable}`}
                                            className="hidden"
                                            multiple={type === "file-list"}
                                            accept={field.allowed_file_extensions?.map((ext: string) => `.${ext}`).join(",")}
                                            onChange={e => {
                                              const files = Array.from(e.target.files || [])
                                              if (files.length > 0) {
                                                setPendingParamFiles(prev => {
                                                  const newFiles = type === "file-list" ? [...(prev[field.variable] || []), ...files] : files;
                                                  (window as any)[`_pendingFiles_${panel.id}_${field.variable}`] = newFiles;
                                                  return { ...prev, [field.variable]: newFiles };
                                                });
                                              }
                                              e.target.value = ""; // reset
                                            }}
                                          />
                                          <button
                                            type="button"
                                            onClick={() => document.getElementById(`dify-file-${panel.id}-${field.variable}`)?.click()}
                                            className="h-8 w-8 shrink-0 rounded-lg border border-border/60 bg-background flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-all shadow-sm"
                                            title="Attach File"
                                          >
                                            <Paperclip className="h-4 w-4" />
                                          </button>
                                        </div>
                                        {pendingParamFiles[field.variable]?.length > 0 && (
                                          <div className="flex flex-col gap-1.5 mt-1">
                                            {pendingParamFiles[field.variable].map((f, i) => (
                                              <div key={i} className="flex items-center gap-2 bg-muted/40 px-2 py-1.5 rounded-md border border-border/40 justify-between">
                                                <div className="flex items-center gap-2 overflow-hidden">
                                                  <span className="text-[10px] text-foreground truncate">{f.name}</span>
                                                  <span className="text-[9px] text-muted-foreground whitespace-nowrap">
                                                    {(f.size / 1024).toFixed(1)} KB
                                                  </span>
                                                </div>
                                                <button
                                                  type="button"
                                                  className="text-muted-foreground hover:text-destructive shrink-0 transition-colors p-0.5"
                                                  onClick={() => {
                                                    setPendingParamFiles(prev => {
                                                      const updated = (prev[field.variable] || []).filter((_, idx) => idx !== i);
                                                      (window as any)[`_pendingFiles_${panel.id}_${field.variable}`] = updated;
                                                      return { ...prev, [field.variable]: updated };
                                                    });
                                                  }}
                                                >
                                                  <X className="w-3 h-3" />
                                                </button>
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    ) : type === "json_object" ? (
                                      <Textarea
                                        className="text-[11px] font-mono min-h-[60px] resize-none bg-background/80 border border-border/60 rounded-lg focus-visible:ring-primary/30 py-1.5 px-2.5 custom-scrollbar transition-colors"
                                        value={panel.difyInputs?.[field.variable] ?? field.default ?? ""}
                                        onChange={e => onUpdateDifyInputs?.(panel.id, { [field.variable]: e.target.value })}
                                        placeholder={field.label || field.json_schema}
                                        rows={3}
                                      />
                                    ) : (
                                      <Textarea
                                        className="text-xs min-h-[44px] resize-none bg-background/80 border border-border/50 rounded-lg focus-visible:ring-primary/40 focus:bg-background py-1.5 px-2.5 custom-scrollbar transition-colors shadow-sm"
                                        value={panel.difyInputs?.[field.variable] ?? field.default ?? ""}
                                        onChange={e => onUpdateDifyInputs?.(panel.id, { [field.variable]: e.target.value })}
                                        placeholder={field.label}
                                        rows={2}
                                      />
                                    )}
                                  </>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                    {/* File Upload UI */}
                    {difyParameters?.file_upload?.image?.enabled && (
                      <div className="p-3 bg-muted/20 border border-border/40 rounded-xl relative mx-1 mb-4 shadow-sm">
                        <p className="text-xs font-semibold text-foreground/80 mb-2 flex items-center justify-between ml-1">
                          <span>{t("attachments")} ({difyParameters.file_upload.image.number_limits || 1} {t("maxFiles")})</span>
                        </p>

                        {/* URL Method Support */}
                        {(difyParameters.file_upload.image.transfer_methods?.includes("remote_url") || difyParameters.file_upload.allowed_file_upload_methods?.includes("remote_url")) && (
                          <div className="mb-3">
                            <input
                              type="text"
                              id={`dify-file-url-${panel.id}`}
                              placeholder="Image/File URL..."
                              className="w-full text-xs bg-background/80 border border-border/50 rounded-lg px-2.5 py-1.5 focus:border-primary/40 focus:bg-background focus:outline-none transition-colors shadow-sm"
                            />
                          </div>
                        )}

                        <div className="flex items-center gap-2">
                          {(difyParameters.file_upload.image.transfer_methods?.includes("local_file") || difyParameters.file_upload.allowed_file_upload_methods?.includes("local_file")) && (
                            <>
                              <input
                                type="file"
                                id={`dify-file-${panel.id}`}
                                multiple={difyParameters.file_upload.image.number_limits > 1}
                                onChange={(e) => {
                                  const files = Array.from(e.target.files || [])
                                  if (files.length > 0) {
                                    (window as any)[`_pendingFiles_${panel.id}`] = files;
                                    const el = document.getElementById(`dify-file-label-${panel.id}`)
                                    if (el) el.innerText = files.length === 1 ? `${files[0].name} (${(files[0].size / 1024).toFixed(1)}KB)` : `${files.length} files attached`
                                  }
                                }}
                                className="hidden"
                              />
                              <label htmlFor={`dify-file-${panel.id}`} className="flex items-center justify-center flex-1 h-9 border flex-col border-dashed border-border/80 rounded-lg bg-background/50 hover:bg-background cursor-pointer transition-colors shadow-sm">
                                <span id={`dify-file-label-${panel.id}`} className="text-xs font-medium text-muted-foreground hover:text-foreground">{t("attachFiles")}</span>
                              </label>
                            </>
                          )}
                          <button
                            title="Clear"
                            className="h-9 w-9 flex shrink-0 items-center justify-center rounded-lg border border-border/60 bg-background/50 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                            onClick={() => {
                              delete (window as any)[`_pendingFiles_${panel.id}`];
                              const input = document.getElementById(`dify-file-${panel.id}`) as HTMLInputElement;
                              if (input) input.value = '';
                              const urlInput = document.getElementById(`dify-file-url-${panel.id}`) as HTMLInputElement;
                              if (urlInput) urlInput.value = '';
                              const el = document.getElementById(`dify-file-label-${panel.id}`)
                              if (el) el.innerText = 'Click to Attach files'
                            }}
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="h-px bg-border/40 mx-3" />
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto min-h-0 custom-scrollbar relative flex flex-col">
        <div className="flex-1 flex flex-col min-h-full">
          {panel.messages.length === 0 && (!difyParameters?.opening_statement || effectiveProviderId !== "dify") ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center mt-20 md:mt-0 max-w-sm mx-auto">
              <div className="h-14 w-14 rounded-2xl bg-card border border-border shadow-sm flex items-center justify-center mb-6 text-primary">
                <Box className="h-6 w-6" />
              </div>
              <p className="text-xl font-medium tracking-tight bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent mb-3">
                {panel.title}
              </p>
              <p className="text-[13px] leading-relaxed text-muted-foreground/80 balancetext">
                {t("adjustPromptDesc")}
              </p>
            </div>
          ) : (
            <div className="p-4 md:p-6 pb-48 space-y-6">
              {difyParameters?.opening_statement && effectiveProviderId === "dify" && (
                <div>
                  <AssistantMessage
                    message={{
                      id: "opening-statement",
                      role: "assistant",
                      content: difyParameters.opening_statement,
                    }}
                    isLast={false}
                    onSend={onSend}
                    providerId={effectiveProviderId || ""}
                  />
                </div>
              )}
              {panel.messages.map((m, i) => (
                <div key={m.id}>
                  {m.role === "user" ? (
                    <UserBubble message={m} />
                  ) : (
                    <AssistantMessage
                      message={m}
                      isLast={i === panel.messages.length - 1}
                      onSend={onSend}
                      providerId={effectiveProviderId || ""}
                    />
                  )}
                </div>
              ))}
              <div className="h-40 shrink-0" />
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
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
  message: ChatMessage
  isLast: boolean
}) {
  if (message.role === "user") {
    return <UserBubble message={message} />
  }
  return <AssistantMessage message={message} isLast={isLast} providerId="" />
}

/* ------------------------------------------------------------------ */
/*  User bubble                                                        */
/* ------------------------------------------------------------------ */

function UserBubble({ message }: { message: ChatMessage }) {
  const { content, attachedFiles } = message
  const { t } = useI18n()
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
                <span>{t("copied")}</span>
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" />
                <span>{t("copy")}</span>
              </>
            )}
          </motion.button>
        )}
      </AnimatePresence>

      <div
        onClick={() => content.trim() && setShowCopy((p) => !p)}
        className="max-w-[85%] px-3.5 py-2.5 rounded-2xl rounded-tr-sm border border-primary/15 bg-primary/5 cursor-pointer select-text"
      >
        {attachedFiles && attachedFiles.length > 0 && (
          <div className="flex flex-col gap-1.5 mb-2 relative z-10">
            {attachedFiles.map((file, i) => (
              <div key={i} className="flex items-center gap-2 px-2.5 py-1.5 bg-background/50 rounded-lg border border-border/50 text-xs">
                <Paperclip className="h-3 w-3 text-muted-foreground shrink-0" />
                <span className="truncate max-w-[150px] font-medium text-foreground">{file.name}</span>
              </div>
            ))}
          </div>
        )}
        <p className="text-sm whitespace-pre-wrap leading-relaxed text-foreground relative z-10">
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
  onSend,
  providerId,
}: {
  message: ChatMessage
  isLast: boolean
  onSend?: (message: string) => void
  providerId: string
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

      <div className="text-sm leading-relaxed mt-2">
        {message.content ? (
          <>
            <Streamdown
              isAnimating={!!message.isStreaming}
              allowedTags={providerId === "dify" ? {
                button: ["data-message", "style", "class", "type"],
                span: ["style", "class"],
                details: ["style", "class", "open", "close"],
                summary: ["style", "class"],
                br: [],
                input: ["type", "placeholder", "style", "class", "checked", "name", "value"],
                form: ["style", "class"],
                select: ["name", "style", "class"],
                option: ["value"],
                textarea: ["name", "placeholder", "style", "class"]
              } : undefined}
              components={providerId === "dify" ? {
                form: ({ node, ...props }: any) => {
                  return (
                    <form
                      {...props}
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (onSend) {
                          const formData = new FormData(e.currentTarget);
                          const entries = Array.from(formData.entries());
                          let out = "";
                          if (entries.length === 1) {
                            out = entries[0][1].toString();
                          } else if (entries.length > 1) {
                            out = entries.map(([k, v]) => `${k}: ${v}`).join('\n');
                          }
                          if (out.trim()) {
                            onSend(out.trim());
                          }
                        }
                        if (props.onSubmit) props.onSubmit(e);
                      }}
                      className={cn("my-3 p-3 border border-border/50 rounded-xl bg-muted/10 space-y-2", props.className)}
                    />
                  )
                },
                input: ({ node, ...props }: any) => (
                  <input {...props} className={cn("px-2 py-1.5 text-xs rounded-lg border border-border/60 bg-background focus:outline-none focus:ring-1 focus:ring-primary/40", props.className)} />
                ),
                button: ({ node, ...props }: any) => {
                  const dataMessage = props["data-message"] || props["dataMessage"] || props.value
                  return (
                    <button
                      {...props}
                      onClick={(e) => {
                        if (props.type !== "submit") {
                          e.preventDefault()
                          if (onSend) {
                            const msg = dataMessage || e.currentTarget.textContent || ""
                            if (msg.trim()) {
                              onSend(msg.trim())
                            }
                          }
                        }
                        if (props.onClick) props.onClick(e)
                      }}
                      className={cn("mx-1 px-3 py-1 focus:ring-2 focus:ring-primary outline-none hover:bg-primary/20 bg-primary/10 text-primary text-xs font-semibold rounded-lg transition-colors border border-primary/20", props.className)}
                    />
                  )
                },
                details: ({ node, ...props }: any) => {
                  return (
                    <details {...props} className={cn("my-2 cursor-pointer", props.className)} />
                  )
                },
                summary: ({ node, ...props }: any) => {
                  return (
                    <summary {...props} className={cn("font-medium select-none text-primary/80", props.className)} />
                  )
                }
              } : undefined}
            >
              {providerId === "dify" ? message.content.replace(/\\n/g, '\n').replace(/\n/g, '  \n') : message.content}
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

      {/* Suggested Questions */}
      {message.suggestedQuestions && message.suggestedQuestions.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {message.suggestedQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => onSend?.(q)}
              className="text-left max-w-full px-3 py-1.5 rounded-lg border border-border bg-muted/20 hover:bg-muted text-xs text-muted-foreground hover:text-foreground transition-all"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {message.content.trim() && !message.isStreaming && (
        <AssistantStatsBar message={message} providerId={providerId} />
      )}
    </motion.div>
  )
}

/* ------------------------------------------------------------------ */
/*  Assistant stats bar (with real token usage)                        */
/* ------------------------------------------------------------------ */

function AssistantStatsBar({ message, providerId }: { message: ChatMessage, providerId: string }) {
  const { t } = useI18n()
  const [copied, setCopied] = useState(false)
  const [feedbackState, setFeedbackState] = useState<"like" | "dislike" | null>(null)
  const charCount = message.content.length
  const tokenEstimate = Math.ceil(charCount / 3)

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [message.content])

  const handleFeedback = async (rating: "like" | "dislike") => {
    if (feedbackState === rating) return
    const settingsData = localStorage.getItem("chat-panels-settings")

    try {
      let apiKey = message.providerApiKey
      let baseUrl = message.providerBaseUrl

      if (!apiKey && settingsData) {
        const currentSettings = JSON.parse(settingsData)
        apiKey = currentSettings.providerConfigs?.["dify"]?.apiKey
        baseUrl = currentSettings.providerConfigs?.["dify"]?.baseUrl || "https://api.dify.ai/v1"
      }

      if (!apiKey) return

      const res = await fetch("/api/dify/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messageId: message.id,
          rating: rating,
          apiKey: apiKey,
          baseUrl: baseUrl
        })
      })
      if (res.ok) {
        setFeedbackState(rating)
      }
    } catch (e) {
      console.error(e)
    }
  }

  const usage = message.tokenUsage

  return (
    <div className="mt-2 flex items-center justify-between gap-2 flex-wrap">
      <div className="flex items-center gap-2">
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
              <span>{t("copied")}</span>
            </>
          ) : (
            <>
              <Copy className="h-2.5 w-2.5" />
              <span>{t("copy")}</span>
            </>
          )}
        </button>

        {providerId === "dify" && message.id !== "opening-statement" && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleFeedback("like")}
              className={cn(
                "flex items-center justify-center h-6 w-6 rounded-md transition-all",
                feedbackState === "like"
                  ? "bg-green-500/10 text-green-600"
                  : "text-muted-foreground/50 hover:text-foreground hover:bg-muted/50"
              )}
              title="Like"
            >
              <ThumbsUp className="h-3 w-3" />
            </button>
            <button
              onClick={() => handleFeedback("dislike")}
              className={cn(
                "flex items-center justify-center h-6 w-6 rounded-md transition-all",
                feedbackState === "dislike"
                  ? "bg-red-500/10 text-red-600"
                  : "text-muted-foreground/50 hover:text-foreground hover:bg-muted/50"
              )}
              title="Dislike"
            >
              <ThumbsDown className="h-3 w-3" />
            </button>
          </div>
        )}

        <div className="h-3 w-px bg-border/30 mx-1" />

        <div className="flex items-center gap-2.5 text-[10px] text-muted-foreground/40">
          <span className="flex items-center gap-0.5">
            <Type className="h-2.5 w-2.5" />
            {charCount.toLocaleString()} {t("chars")}
          </span>
          {usage ? (
            <>
              <span>{usage.completion.toLocaleString()} {t("tokens")}</span>
              <span className="text-muted-foreground/30">
                {`(${t("prompt")} ${usage.prompt.toLocaleString()} / ${t("total")} ${usage.total.toLocaleString()})`}
              </span>
            </>
          ) : (
            <span>
              {"~"}{tokenEstimate.toLocaleString()} {t("tokens")}
            </span>
          )}
        </div>
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
  const { t } = useI18n()

  return (
    <div data-template-dropdown className="relative">
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
        <span>{t("useTemplate")}</span>
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="absolute top-full left-0 mt-2 w-64 md:w-72 bg-card border border-border rounded-2xl overflow-hidden z-50 shadow-[0_4px_20px_rgba(62,168,255,0.08)] flex flex-col max-h-[300px]"
            >
              <div className="px-3 py-2 border-b border-border/40 font-medium text-xs text-foreground flex justify-between items-center bg-muted/20">
                <span>{t("promptsTemplates")}</span>
                <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="overflow-y-auto custom-scrollbar">
                {templates.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      onApply(t.content)
                      setOpen(false)
                    }}
                    className="w-full text-left px-3 py-2.5 hover:bg-primary/5 transition-colors border-b border-border/20 last:border-0"
                  >
                    <div className="text-xs font-medium text-foreground truncate">
                      {t.name}
                    </div>
                    <div className="text-[10px] text-muted-foreground/50 truncate mt-0.5">
                      {t.content}
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

/* ------------------------------------------------------------------ */
/*  Config Dropdown (Custom Selector)                                  */
/* ------------------------------------------------------------------ */

function ConfigDropdown({
  label,
  value,
  options,
  onChange,
  disabled,
  displayValueOverride
}: {
  label: string
  value: string
  options: { id: string; label: string; description?: string }[]
  onChange: (val: string) => void
  disabled?: boolean
  displayValueOverride?: string
}) {
  const [open, setOpen] = useState(false)
  const selected = options.find(o => o.id === value)

  return (
    <div className="relative min-w-0">
      <motion.button
        type="button"
        onClick={() => !disabled && setOpen(!open)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={cn(
          "w-full flex items-center justify-between gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all max-w-full",
          "border border-border bg-background text-muted-foreground overflow-hidden",
          "hover:border-primary/40 hover:text-foreground",
          open && "border-primary/40 text-foreground bg-primary/5",
          disabled && "opacity-50 cursor-not-allowed hover:border-border"
        )}
      >
        <span className="truncate flex-1 min-w-0 text-left">
          {displayValueOverride || selected?.label || label}
        </span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          <ChevronDown className="h-3 w-3 shrink-0" />
        </motion.span>
      </motion.button>

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
              className="absolute top-full left-0 mt-1 w-full bg-card border border-border rounded-xl overflow-hidden z-50 shadow-lg min-w-[200px]"
            >
              <div className="max-h-60 overflow-y-auto custom-scrollbar">
                {options.map((opt, i) => (
                  <motion.button
                    key={opt.id}
                    onClick={() => {
                      onChange(opt.id)
                      setOpen(false)
                    }}
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.02 }}
                    className={cn(
                      "w-full flex items-center gap-2 px-3 py-2 text-left transition-colors",
                      "hover:bg-primary/5",
                      value === opt.id && "bg-primary/5"
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-foreground truncate">
                        {opt.label}
                      </div>
                      {opt.description && (
                        <div className="text-[10px] text-muted-foreground truncate mt-0.5">
                          {opt.description}
                        </div>
                      )}
                    </div>
                    {value === opt.id && (
                      <Check className="h-3 w-3 text-primary shrink-0" />
                    )}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
