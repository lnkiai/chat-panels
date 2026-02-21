"use client"

import {
  Eye,
  EyeOff,
  Settings,
  Settings2,
  X,
  Trash2,
  Box,
  ClockFading,
  Minus,
  Plus,
  Pencil,
  Book,
  Check,
  BookmarkPlus,
  RefreshCw,
  Search,
  BrainCircuit,
  ToggleLeft,
  ToggleRight,
  Download,
  Languages,
  Github
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { PlaygroundSettings, PanelState, PromptTemplate } from "@/lib/types"
import { getProvider, getAllProviders } from "@/lib/ai-providers/registry"
import { cn } from "@/lib/utils"
import { useI18n } from "@/lib/i18n/context"
import { LanguageSelector } from "./language-selector"

interface TemplateStore {
  templates: PromptTemplate[]
  addTemplate: (name: string, content: string) => PromptTemplate
  updateTemplate: (id: string, updates: Partial<Pick<PromptTemplate, "name" | "content">>) => void
  deleteTemplate: (id: string) => void
  clearTemplates?: () => void
}

interface HeaderBarProps {
  settings: PlaygroundSettings
  onUpdateApiKey: (key: string) => void
  onUpdatePanelCount: (count: number) => void
  onClearChats: () => void
  onExportAllChats?: () => void
  onClearApiKey: () => void
  onResetPrompts: () => void
  onResetPanels?: () => void
  onClearEverything: () => void
  mobilePromptOpen?: boolean
  setMobilePromptOpen?: (open: boolean) => void
  mobilePanel?: PanelState
  onUpdateMobileSystemPrompt?: (prompt: string) => void
  onUpdateMobileTitle?: (title: string) => void
  templates?: PromptTemplate[]
  onApplyTemplate?: (content: string) => void
  templateStore?: TemplateStore

  // Actions for provider config
  updateActiveProvider?: (providerId: string) => void
  updateProviderConfig?: (providerId: string, config: { apiKey?: string; baseUrl?: string; enabled?: boolean }) => void
  updateProviderModels?: (providerId: string, models: { id: string; label: string; description?: string }[]) => void
  togglePanelMode?: (enabled: boolean) => void
  onRegisterDifyApp?: (apiKey: string, baseUrl?: string) => Promise<void>
  onRemoveDifyApp?: (apiKey: string) => void
  panels?: PanelState[]
  updatePanelConfig?: (panelId: number, config: { providerId?: string; modelId?: string; apiKey?: string; baseUrl?: string; enabled?: boolean }) => void
}

/* ------------------------------------------------------------------ */
/*  Manage Tabs definition                                             */
/* ------------------------------------------------------------------ */

type ManageTabId = "chats" | "apikey" | "templates" | "panels" | "all"

/* ------------------------------------------------------------------ */
/*  Panel Count Stepper                                                */
/* ------------------------------------------------------------------ */

function PanelStepper({ count, onChange }: { count: number; onChange: (n: number) => void }) {
  return (
    <div className="flex items-center gap-1">
      <motion.button
        onClick={() => onChange(Math.max(1, count - 1))}
        disabled={count <= 1}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.85 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
        className="h-7 w-7 flex items-center justify-center rounded-lg border border-border/60 bg-background/60 text-muted-foreground hover:text-foreground hover:border-primary/40 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <Minus className="h-3 w-3" />
      </motion.button>
      <input
        type="number"
        value={count}
        onChange={(e) => {
          const val = parseInt(e.target.value)
          if (!isNaN(val)) onChange(Math.max(1, Math.min(100, val)))
        }}
        className="w-10 text-center text-xs font-heading tabular-nums text-foreground bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-primary/40 rounded-sm custom-scrollbar"
        min={1}
        max={100}
      />
      <motion.button
        onClick={() => onChange(Math.min(100, count + 1))}
        disabled={count >= 100}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.85 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
        className="h-7 w-7 flex items-center justify-center rounded-lg border border-border/60 bg-background/60 text-muted-foreground hover:text-foreground hover:border-primary/40 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <Plus className="h-3 w-3" />
      </motion.button>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  HeaderBar                                                          */
/* ------------------------------------------------------------------ */

export function HeaderBar({
  settings,
  onUpdateApiKey,
  onUpdatePanelCount,
  onClearChats,
  onExportAllChats,
  onClearApiKey,
  onResetPrompts,
  onResetPanels,
  onClearEverything,
  setMobilePromptOpen,
  templates = [],
  onApplyTemplate,
  templateStore,
  updateActiveProvider,
  updateProviderConfig,
  updateProviderModels,
  togglePanelMode,
  onRegisterDifyApp,
  onRemoveDifyApp,
  panels = [],
  updatePanelConfig
}: HeaderBarProps) {
  const { t } = useI18n()

  const manageTabs = [
    { id: "chats", label: t("clearChats") },
    { id: "apikey", label: t("clearApiKey") },
    { id: "templates", label: t("clearTemplates") },
    { id: "panels", label: t("resetPanels") },
    { id: "all", label: t("clearEverything") },
  ] as const

  const [showApiKey, setShowApiKey] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [manageOpen, setManageOpen] = useState(false)
  const [templatesOpen, setTemplatesOpen] = useState(false)
  const [providersOpen, setProvidersOpen] = useState(false)

  const [manageSelected, setManageSelected] = useState<ManageTabId>("chats")
  const [manageConfirming, setManageConfirming] = useState(false)

  // Template CRUD State
  const [isAddingTemplate, setIsAddingTemplate] = useState(false)
  const [newTemplateName, setNewTemplateName] = useState("")
  const [newTemplateContent, setNewTemplateContent] = useState("")
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null)
  const [editingTemplateName, setEditingTemplateName] = useState("")
  const [editingTemplateContent, setEditingTemplateContent] = useState("")

  // Providers Tab State
  const [selectedProviderId, setSelectedProviderId] = useState<string>(settings.activeProviderId)
  const [isFetchingModels, setIsFetchingModels] = useState(false)
  const [providerConfirmOpen, setProviderConfirmOpen] = useState(false)

  // Active Provider Info
  const activeProvider = getProvider(settings.activeProviderId)
  const activeApiKey = settings.providerConfigs?.[settings.activeProviderId]?.apiKey || ""

  const handleDelete = () => {
    if (!manageConfirming) {
      setManageConfirming(true)
      return
    }
    if (manageSelected === "chats") onClearChats()
    else if (manageSelected === "apikey") onClearApiKey()
    else if (manageSelected === "templates") templateStore?.clearTemplates?.()
    else if (manageSelected === "panels") onResetPanels?.()
    else {
      onClearEverything()
      templateStore?.clearTemplates?.()
    }
    setManageOpen(false)
    setManageConfirming(false)
  }

  const manageCurrentTab = manageTabs.find((t) => t.id === manageSelected)!

  /* Close logic */
  const closeAllDrawers = () => {
    setMobileMenuOpen(false)
    setManageOpen(false)
    setTemplatesOpen(false)
    setProvidersOpen(false)
    setMobilePromptOpen?.(false)
    setManageConfirming(false)
    setEditingTemplateId(null)
    setIsAddingTemplate(false)
  }

  const handleCreateTemplate = () => {
    if (!newTemplateName.trim() || !newTemplateContent.trim() || !templateStore) return
    templateStore.addTemplate(newTemplateName.trim(), newTemplateContent.trim())
    setNewTemplateName("")
    setNewTemplateContent("")
    setIsAddingTemplate(false)
  }

  const handleUpdateTemplate = () => {
    if (!editingTemplateId || !editingTemplateName.trim() || !templateStore) return
    templateStore.updateTemplate(editingTemplateId, { name: editingTemplateName.trim(), content: editingTemplateContent.trim() })
    setEditingTemplateId(null)
  }

  const startEditTemplate = (t: PromptTemplate) => {
    setEditingTemplateId(t.id)
    setEditingTemplateName(t.name)
    setEditingTemplateContent(t.content)
    setIsAddingTemplate(false)
  }

  /* Provider Logic */
  const selectedProviderConfig = settings.providerConfigs?.[selectedProviderId] || {}
  const selectedProviderDef = getProvider(selectedProviderId)
  const dynamicModels = selectedProviderConfig.models || []
  const staticModels = selectedProviderDef?.models || []
  // Prefer dynamic models if available, else static
  const displayModels = dynamicModels.length > 0 ? dynamicModels : staticModels

  const handleFetchModels = async () => {
    if (!selectedProviderConfig.apiKey) return

    setIsFetchingModels(true)
    try {
      if (selectedProviderId === "dify" && onRegisterDifyApp) {
        await onRegisterDifyApp(selectedProviderConfig.apiKey, selectedProviderConfig.baseUrl)
        return
      }

      if (!updateProviderModels) return
      const res = await fetch("/api/models", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          providerId: selectedProviderId,
          apiKey: selectedProviderConfig.apiKey,
          baseUrl: selectedProviderConfig.baseUrl
        })
      })
      const data = await res.json()
      if (data.models) {
        updateProviderModels(selectedProviderId, data.models.map((m: any) => ({
          id: m.id,
          label: m.name,
          description: m.description
        })))
      }
    } catch (e) {
      console.error("Failed to fetch models", e)
    } finally {
      setIsFetchingModels(false)
    }
  }

  return (
    <div className="shrink-0 px-3 pt-3 pb-0 md:px-4 md:pt-4 md:pb-0 z-20 relative">
      <header className="bg-card/80 backdrop-blur-xl border border-border/60 rounded-2xl transition-all duration-300">
        <div className="flex items-center justify-between px-3 h-12 md:px-5 md:h-14">
          {/* Logo & Title */}
          <div className="flex items-center gap-1.5 md:gap-2">
            <Link href="/" className="flex items-center gap-2">
              <div className="h-8 w-8 md:h-9 md:w-9 rounded-lg md:rounded-xl bg-card flex items-center justify-center border border-border/60 overflow-hidden">
                <Image src="/images/chat-panels.svg" alt="chat-panels" width={24} height={24} className="h-5 w-5 md:h-6 md:w-6" />
              </div>
              <h1 className="text-sm font-heading tracking-tight text-foreground hidden md:block">
                chat-panels
              </h1>
              <h1 className="text-sm font-heading tracking-tight text-foreground md:hidden">
                chat-panels
              </h1>
            </Link>
          </div>

          {/* Desktop Controls (Center) */}
          <div className="hidden md:flex items-center gap-4">

            {/* Panel Mode Active Indicator */}
            {settings.enablePanelMode && (
              <button
                onClick={() => {
                  const next = !providersOpen
                  closeAllDrawers()
                  if (next) setProvidersOpen(true)
                }}
                className={cn(
                  "flex items-center gap-2 px-2 py-1 rounded-lg transition-colors group",
                  providersOpen ? "bg-primary/10 text-primary" : "hover:bg-muted/50"
                )}
                title="Panel Mode Active"
              >
                <div className="h-5 w-5 rounded-md border border-border/60 bg-primary/10 flex items-center justify-center overflow-hidden group-hover:bg-primary/20">
                  <Settings2 className="h-3 w-3 text-primary" />
                </div>
                <span className="text-xs font-medium text-foreground">Panel Mode</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 md:gap-3">
            <div className="hidden md:flex items-center gap-2 mr-2">
              <span className="text-xs text-muted-foreground">Panels</span>
              <PanelStepper count={settings.panelCount} onChange={onUpdatePanelCount} />
            </div>

            {/* AI Providers Toggle (Unified with Active Provider) */}
            <motion.button
              onClick={() => {
                const next = !providersOpen
                closeAllDrawers()
                if (next) {
                  setProvidersOpen(true)
                  setSelectedProviderId(settings.activeProviderId)
                }
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
              className={cn(
                "flex items-center gap-2 px-2 py-1.5 md:px-3 md:py-1.5 rounded-xl transition-all border",
                providersOpen
                  ? "border-primary/30 bg-primary/5 text-primary"
                  : "border-border/40 bg-muted/30 text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              )}
              title="AI Providers"
            >
              {activeProvider && !settings.enablePanelMode && (
                <>
                  <div className="h-5 w-5 rounded shadow-sm border border-border/50 bg-background flex items-center justify-center overflow-hidden shrink-0">
                    <Image
                      src={activeProvider.iconPath}
                      alt={activeProvider.name}
                      width={14}
                      height={14}
                      className="object-contain"
                      onError={(e) => { e.currentTarget.style.display = 'none' }}
                    />
                  </div>
                  <span className="text-xs font-medium hidden md:block whitespace-nowrap">{activeProvider.name}</span>
                </>
              )}
              {settings.enablePanelMode && (
                <div className="h-5 w-5 rounded shadow-sm border border-primary/20 bg-primary/10 flex items-center justify-center overflow-hidden shrink-0">
                  <Settings2 className="h-3 w-3 text-primary" />
                </div>
              )}
              <Box className="h-3.5 w-3.5 md:h-4 md:w-4 ml-0.5 opacity-70" />
            </motion.button>


            {/* Templates Toggle */}
            <motion.button
              onClick={() => {
                const next = !templatesOpen
                closeAllDrawers()
                if (next) setTemplatesOpen(true)
              }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.85 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
              className={cn(
                "h-8 w-8 md:h-8 md:w-8 flex items-center justify-center rounded-xl transition-colors",
                templatesOpen ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-primary"
              )}
            >
              <Book className="h-4 w-4 md:h-4 md:w-4" />
            </motion.button>

            {/* Manage Toggle */}
            <motion.button
              onClick={() => {
                const next = !manageOpen
                closeAllDrawers()
                if (next) setManageOpen(true)
              }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.85 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
              className={cn(
                "h-8 w-8 md:h-8 md:w-8 flex items-center justify-center rounded-xl transition-colors",
                manageOpen ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-primary"
              )}
            >
              <ClockFading className="h-4 w-4 md:h-4 md:w-4" />
            </motion.button>

            {/* Mobile Settings Toggle (Mostly replaces providers link, but keeps mobile layout consistent) */}
            <motion.button
              onClick={() => {
                const next = !mobileMenuOpen
                closeAllDrawers()
                if (next) setMobileMenuOpen(true)
              }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.85 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
              className={cn(
                "h-8 w-8 flex items-center justify-center rounded-xl transition-colors md:hidden",
                mobileMenuOpen ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-primary"
              )}
            >
              {mobileMenuOpen ? <X className="h-4 w-4" /> : <Settings className="h-4 w-4" />}
            </motion.button>
          </div>
        </div>

        {/* ================= DRAWERS (Slide down) ================= */}

        {/* 1. Mobile Settings Drawer */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              className="md:hidden overflow-hidden border-t border-border/40"
            >
              <div className="px-4 py-3 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{t("panelsCount")}</span>
                  <PanelStepper count={settings.panelCount} onChange={onUpdatePanelCount} />
                </div>
                <div className="flex items-center justify-between border-t border-border/40 pt-3">
                  <span className="text-xs text-muted-foreground flex items-center gap-1.5 min-w-0 shrink-0">
                    <Languages className="w-4 h-4" />
                    {t("language")}
                  </span>
                  <LanguageSelector modalMode={false} />
                </div>
                <div className="flex items-center justify-between border-t border-border/40 pt-3">
                  <span className="text-xs text-muted-foreground flex items-center gap-1.5 min-w-0 shrink-0">
                    <Github className="w-4 h-4" />
                    GitHub
                  </span>
                  <a
                    href="https://github.com/lnkiai/chat-panels"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    lnkiai/chat-panels
                  </a>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 2. Manage Drawer (History & Reset) - Unified */}
        <AnimatePresence>
          {manageOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              className="overflow-hidden border-t border-border/40"
            >
              <div className="px-4 py-4 md:px-5 space-y-4">
                {/* Export Section */}
                {onExportAllChats && (
                  <div className="bg-secondary/40 rounded-xl p-3.5 border border-secondary/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
                    <div>
                      <h4 className="text-[13px] font-semibold text-foreground flex items-center gap-1.5"><Download className="h-4 w-4" /> {t("export")}</h4>
                      <p className="text-[11px] text-muted-foreground mt-1.5 leading-relaxed">{t("exportDesc")}</p>
                    </div>
                    <motion.button
                      onClick={onExportAllChats}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      className="flex items-center justify-center gap-1.5 h-8 px-4 rounded-lg text-xs font-medium transition-all bg-background border border-border/60 hover:bg-secondary/80 text-foreground shrink-0 w-full sm:w-auto shadow-sm"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>{t("export")}</span>
                    </motion.button>
                  </div>
                )}

                {/* Delete Section */}
                <div>
                  <h4 className="text-[13px] font-semibold text-foreground flex items-center gap-1.5 mb-2.5 mt-1">
                    <Trash2 className="h-4 w-4 text-muted-foreground/80" />
                    {t("delete")}
                  </h4>
                  <div className="flex flex-wrap md:flex-nowrap rounded-xl border border-border/50 bg-background/60 p-1 mb-3 shadow-sm">
                    {manageTabs.map((tab) => {
                      const isActive = manageSelected === tab.id
                      return (
                        <button
                          key={tab.id}
                          onClick={() => { setManageSelected(tab.id); setManageConfirming(false) }}
                          className="relative flex-1 flex items-center justify-center h-8 rounded-lg text-xs transition-colors z-10"
                        >
                          {isActive && (
                            <motion.div
                              layoutId="manage-tab-bg"
                              className="absolute inset-0 bg-card border border-border/60 rounded-lg shadow-sm"
                              transition={{ type: "spring", bounce: 0.2, duration: 0.35 }}
                            />
                          )}
                          <span className={cn(
                            "relative z-10 text-[11px] font-medium transition-colors",
                            isActive ? "text-foreground" : "text-muted-foreground/70 hover:text-foreground"
                          )}>
                            {tab.label}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between px-1 gap-3">
                    <p className="text-[11px] text-muted-foreground/80 flex-1 leading-relaxed">
                      {manageSelected === "chats"
                        ? t("clearAllChatsDesc")
                        : manageSelected === "all"
                          ? t("resetAllPanelsDesc")
                          : ""}
                    </p>
                    <div className="flex items-center gap-2">
                      <motion.button
                        onClick={handleDelete}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.97 }}
                        transition={{ type: "spring", stiffness: 400, damping: 17 }}
                        className={cn(
                          "flex items-center justify-center gap-1.5 h-8 px-4 rounded-lg text-xs font-medium transition-all shadow-sm",
                          manageConfirming
                            ? "bg-destructive text-destructive-foreground"
                            : manageSelected === "all"
                              ? "bg-destructive/10 text-destructive hover:bg-destructive/20 border border-destructive/20"
                              : "bg-muted/60 border border-border/60 text-foreground hover:bg-muted"
                        )}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>{manageConfirming ? t("confirmingDelete") : t("delete")}</span>
                      </motion.button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 3. AI Providers Drawer (New) */}
        <AnimatePresence>
          {providersOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              className="overflow-hidden border-t border-border/40"
            >
              <div className="flex flex-col md:flex-row h-[420px] divide-y md:divide-y-0 md:divide-x divide-border/40">
                {/* Left: Provider List */}
                <div className="w-full md:w-56 flex md:flex-col overflow-x-auto md:overflow-y-auto md:overflow-x-hidden custom-scrollbar bg-muted/10 p-2 gap-2 md:space-y-1 border-b md:border-b-0 border-border/40 shrink-0">
                  <div className="hidden md:block px-2 py-1 mb-2 shrink-0">
                    <h3 className="text-xs font-semibold text-foreground/80">AI Providers</h3>
                  </div>
                  {getAllProviders().map(p => (
                    <button
                      key={p.id}
                      onClick={() => setSelectedProviderId(p.id)}
                      className={cn(
                        "w-auto md:w-full flex items-center gap-2.5 px-2 py-2 md:px-3 rounded-lg text-left transition-colors shrink-0",
                        selectedProviderId === p.id
                          ? "bg-primary/10 text-primary border border-primary/10"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-transparent"
                      )}
                    >
                      <div className="h-10 w-10 rounded-xl bg-background flex items-center justify-center border border-border/40 shrink-0">
                        <Image
                          src={p.iconPath}
                          alt={p.name}
                          width={24}
                          height={24}
                          onError={(e) => { e.currentTarget.style.display = 'none' }}
                        />
                      </div>
                      <span className="hidden md:block text-xs font-medium truncate">{p.name}</span>
                    </button>
                  ))}

                  <div className="md:mt-4 hidden md:block px-2 py-1 mb-1 shrink-0">
                    <h3 className="text-xs font-semibold text-foreground/80">Options</h3>
                  </div>
                  {/* Options Menu Item */}
                  <button
                    onClick={() => setSelectedProviderId("options")}
                    className={cn(
                      "w-auto md:w-full flex items-center justify-center md:justify-start gap-2.5 px-3 py-2 rounded-lg text-left transition-colors shrink-0",
                      selectedProviderId === "options"
                        ? "bg-primary/10 text-primary border border-primary/10"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-transparent"
                    )}
                  >
                    <div className="flex items-center justify-center shrink-0">
                      <Settings2 className="h-4 w-4" />
                    </div>
                    <span className="hidden md:block text-xs font-medium truncate">{t("options")}</span>
                  </button>
                </div>

                {/* Right: Config Area */}
                <div className="flex-1 p-4 md:p-6 overflow-y-auto custom-scrollbar bg-background/50">
                  {selectedProviderId === "options" ? (
                    <div className="max-w-xl mx-auto space-y-6">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-card border border-border/60 flex items-center justify-center shadow-sm">
                          <Settings2 className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <h2 className="text-sm font-semibold text-foreground">{t("options")}</h2>
                          <p className="text-[11px] text-muted-foreground">{t("optionsDesc")}</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        {/* Panel Mode Toggle */}
                        <div className="flex items-center justify-between p-4 bg-background border border-border/60 rounded-xl shadow-sm">
                          <div className="pr-4">
                            <h3 className="text-xs font-semibold text-foreground flex items-center gap-1.5"><Box className="h-3.5 w-3.5" />{t("panelMode")}</h3>
                            <p className="text-[10px] text-muted-foreground mt-1.5 leading-relaxed">{t("panelModeDesc")}</p>
                          </div>
                          <button
                            onClick={() => togglePanelMode?.(!settings.enablePanelMode)}
                            className="shrink-0 transition-transform active:scale-90"
                          >
                            {settings.enablePanelMode ? (
                              <ToggleRight className="h-7 w-7 text-primary" />
                            ) : (
                              <ToggleLeft className="h-7 w-7 text-muted-foreground/50" />
                            )}
                          </button>
                        </div>
                        {settings.enablePanelMode && panels && panels.length > 0 && (
                          <div className="space-y-3 mt-4">
                            <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider pl-1 font-mono">{t("perPanelModelSelection")}</h4>
                            <div className="space-y-2">
                              {panels.map((p, idx) => {
                                const provId = p.providerId || settings.activeProviderId;
                                const dynamic = settings.providerConfigs?.[provId]?.models;
                                const base = getProvider(provId)?.models || [];
                                const modelsList = dynamic && dynamic.length > 0 ? dynamic : base;

                                return (
                                  <div key={p.id} className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 bg-card border border-border/50 rounded-xl shadow-sm items-center">
                                    <div className="flex items-center gap-1.5 px-1 truncate min-w-0">
                                      <span className="shrink-0 w-5 h-5 flex items-center justify-center bg-muted/50 rounded-md text-[10px] font-bold text-muted-foreground tabular-nums">
                                        {idx + 1}
                                      </span>
                                      <span className="text-xs font-medium text-foreground truncate">{p.title || `Panel ${idx + 1}`}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {/* Provider Select */}
                                      <Select
                                        value={p.providerId || settings.activeProviderId}
                                        onValueChange={(val) => {
                                          if (updatePanelConfig) updatePanelConfig(p.id, { providerId: val, modelId: "" })
                                        }}
                                      >
                                        <SelectTrigger className="flex-1 h-7 text-[10px] bg-background">
                                          <SelectValue placeholder={t("provider")} />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {getAllProviders().map(prov => (
                                            <SelectItem key={prov.id} value={prov.id} className="text-[10px]">{prov.name}</SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                      {/* Model Select */}
                                      <Select
                                        value={p.modelId || ""}
                                        onValueChange={(val) => {
                                          if (updatePanelConfig) updatePanelConfig(p.id, { modelId: val })
                                        }}
                                      >
                                        <SelectTrigger className="flex-1 h-7 text-[10px] bg-background">
                                          <SelectValue placeholder={t("globalDefault")} />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="default_val_hack" className="text-[10px] opacity-60">{t("globalDefault")}</SelectItem>
                                          {modelsList.map((m: any) => (
                                            <SelectItem key={m.id} value={m.id} className="text-[10px]">{m.label || m.id}</SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )}


                      </div>
                    </div>
                  ) : (
                    <div className="max-w-xl mx-auto space-y-6">
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-card border border-border/60 flex items-center justify-center shadow-sm shrink-0">
                            {selectedProviderDef && (
                              <Image
                                src={selectedProviderDef.iconPath}
                                alt={selectedProviderDef.name}
                                width={24}
                                height={24}
                                className={selectedProviderId === "dify" ? "h-5 w-5 object-contain" : ""}
                              />
                            )}
                          </div>
                          <div className="flex flex-col items-start gap-1">
                            <h2 className="text-sm font-semibold text-foreground leading-none">{selectedProviderDef?.name}</h2>
                            <p className="text-[11px] text-muted-foreground leading-none">{t("configureApi")}</p>
                          </div>
                        </div>

                        {/* Set as Active Button / Status */}
                        <div className="flex items-center gap-2">
                          {settings.activeProviderId !== selectedProviderId && updateActiveProvider && (
                            <>
                              {providerConfirmOpen ? (
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                  <span className="text-[10px] text-destructive font-medium animate-pulse">{t("willResetChat")}</span>
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => {
                                        updateActiveProvider(selectedProviderId)
                                        onClearChats()
                                        setProviderConfirmOpen(false)
                                      }}
                                      className="px-3 py-1.5 bg-destructive text-destructive-foreground text-[10px] font-medium rounded-lg hover:bg-destructive/90 transition-colors shrink-0"
                                    >
                                      {t("confirmDelete")}
                                    </button>
                                    <button
                                      onClick={() => setProviderConfirmOpen(false)}
                                      className="px-2 py-1.5 text-[10px] text-muted-foreground hover:text-foreground transition-colors shrink-0"
                                    >
                                      {t("cancel")}
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setProviderConfirmOpen(true)}
                                  className="px-3 py-1.5 bg-primary text-primary-foreground text-xs font-medium rounded-lg hover:bg-primary/90 transition-colors shrink-0"
                                >
                                  {t("setActive")}
                                </button>
                              )}
                            </>
                          )}
                          {settings.activeProviderId === selectedProviderId && (
                            <span className="px-2 py-1 bg-primary/10 text-primary text-[10px] font-medium rounded-lg border border-primary/20 shrink-0 self-start">
                              {t("activeGlobal")}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* API Key Input */}
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">{t("apiKey")}</Label>
                        <div className="flex gap-2 relative">
                          <Input
                            type={showApiKey ? "text" : "password"}
                            value={selectedProviderConfig.apiKey || ""}
                            onChange={(e) => updateProviderConfig?.(selectedProviderId, { apiKey: e.target.value })}
                            placeholder={`Enter ${selectedProviderDef?.name} ${t("apiKey")}`}
                            className={cn(
                              "text-xs font-mono h-9 bg-background/50 flex-1",
                              selectedProviderId === "dify" ? "pr-[5.5rem]" : "pr-8"
                            )}
                          />
                          <button
                            type="button"
                            onClick={() => setShowApiKey(!showApiKey)}
                            className={cn(
                              "absolute top-2.5 text-muted-foreground hover:text-primary transition-colors",
                              selectedProviderId === "dify" ? "right-[4.5rem]" : "right-3"
                            )}
                          >
                            {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                          {selectedProviderId === "dify" && (
                            <button
                              onClick={async () => {
                                if (!onRegisterDifyApp || !selectedProviderConfig.apiKey) return
                                setIsFetchingModels(true)
                                try {
                                  await onRegisterDifyApp(selectedProviderConfig.apiKey, selectedProviderConfig.baseUrl)
                                  updateProviderConfig?.(selectedProviderId, { apiKey: "" })
                                } catch (e) {
                                  console.error(e)
                                } finally {
                                  setIsFetchingModels(false)
                                }
                              }}
                              disabled={isFetchingModels || !selectedProviderConfig.apiKey}
                              className="px-3 h-9 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-semibold rounded-lg transition-colors flex items-center justify-center shrink-0 disabled:opacity-50"
                            >
                              {isFetchingModels ? t("adding") : t("add")}
                            </button>
                          )}
                        </div>
                        <p className="text-[10px] text-muted-foreground/60">
                          {t("keysStoredLocally")}
                        </p>
                      </div>

                      {/* Custom Endpoint Input */}
                      <div className="space-y-2 mt-4">
                        <Label className="text-xs text-muted-foreground">{t("customEndpoint")}</Label>
                        <Input
                          type="text"
                          value={selectedProviderConfig.baseUrl || ""}
                          onChange={(e) => updateProviderConfig?.(selectedProviderId, { baseUrl: e.target.value })}
                          placeholder={selectedProviderDef?.defaultBaseUrl || "https://api.example.com/v1"}
                          className="text-xs font-mono h-9 bg-background/50"
                        />
                        <p className="text-[10px] text-muted-foreground/60">
                          {t("leaveEmptyDefault")}
                        </p>
                      </div>

                      {/* Model Fetching */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs text-muted-foreground">Models ({displayModels.length})</Label>
                          {selectedProviderId !== "dify" && (
                            <button
                              onClick={handleFetchModels}
                              disabled={isFetchingModels || !selectedProviderConfig.apiKey}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-muted/50 hover:bg-muted text-foreground text-[11px] font-medium rounded-lg transition-colors border border-border/40 disabled:opacity-50"
                            >
                              <RefreshCw className={cn("h-3.5 w-3.5", isFetchingModels && "animate-spin")} />
                              <span>Fetch Models</span>
                            </button>
                          )}
                        </div>

                        {/* Models List - Fixed Height Scrollable */}
                        <div className="h-[200px] border border-border/60 rounded-xl bg-card/50 overflow-hidden flex flex-col">
                          <div className="overflow-y-auto custom-scrollbar p-1 space-y-1">
                            {displayModels.length === 0 ? (
                              <div className="flex flex-col items-center justify-center h-full text-xs text-muted-foreground py-10 px-4 text-center space-y-2">
                                {selectedProviderId === "dify" ? (
                                  <>
                                    <p>No Dify Apps registered yet.</p>
                                    <p className="text-[10px] opacity-80">Enter an App API Key and click Add to register an app.</p>
                                  </>
                                ) : (
                                  "No models found. Enter API Key and click Fetch."
                                )}
                              </div>
                            ) : (
                              displayModels.map((model) => (
                                <div key={model.id} className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-background/80 transition-colors group">
                                  <div className="min-w-0">
                                    <div className="text-xs font-medium text-foreground">{model.label}</div>
                                    {model.description && (
                                      <div className="text-[10px] text-muted-foreground truncate">{model.description}</div>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <div className="text-[10px] font-mono text-muted-foreground/40 mt-[2px] mr-1">
                                      {selectedProviderId === "dify" ? `${model.id.substring(0, 8)}...${model.id.substring(model.id.length - 4)}` : model.id}
                                    </div>
                                    {selectedProviderId === "dify" && onRemoveDifyApp && (
                                      <>
                                        <button
                                          onClick={async (e) => {
                                            e.stopPropagation();
                                            if (onRegisterDifyApp) {
                                              const btn = e.currentTarget;
                                              const icon = btn.querySelector("svg");
                                              if (icon) icon.classList.add("animate-spin");
                                              try {
                                                await onRegisterDifyApp(model.id, selectedProviderConfig.baseUrl);
                                              } finally {
                                                if (icon) icon.classList.remove("animate-spin");
                                              }
                                            }
                                          }}
                                          className="p-1 text-muted-foreground/40 hover:text-primary transition-colors rounded hover:bg-primary/10 shrink-0"
                                          title="Refresh Parameters"
                                        >
                                          <RefreshCw className="h-3.5 w-3.5" />
                                        </button>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            onRemoveDifyApp(model.id)
                                          }}
                                          className="p-1 text-muted-foreground/40 hover:text-destructive transition-colors rounded hover:bg-destructive/10 shrink-0"
                                          title="Remove App"
                                        >
                                          <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                        {selectedProviderConfig.lastFetched && (
                          <div className="text-[10px] text-muted-foreground/40 text-right">
                            Last updated: {new Date(selectedProviderConfig.lastFetched).toLocaleTimeString()}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 4. Templates Drawer - Unified */}
        <AnimatePresence>
          {templatesOpen && templateStore && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              className="overflow-hidden border-t border-border/40"
            >
              <div className="px-4 py-3 md:px-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-heading text-foreground">
                    {t("templateManagement")} ({templateStore.templates.length})
                  </span>
                  <button
                    onClick={() => {
                      setIsAddingTemplate(!isAddingTemplate)
                      setEditingTemplateId(null)
                    }}
                    className={cn(
                      "h-6 px-2.5 flex items-center justify-center gap-1.5 rounded-lg text-[10px] font-medium transition-colors",
                      isAddingTemplate
                        ? "bg-muted text-foreground"
                        : "bg-primary/10 text-primary hover:bg-primary/20"
                    )}
                  >
                    {isAddingTemplate ? <X className="h-3 w-3" /> : <BookmarkPlus className="h-3 w-3" />}
                    <span>{isAddingTemplate ? t("cancelAdd") : t("createNew")}</span>
                  </button>
                </div>

                {/* Inline Add Form */}
                <AnimatePresence>
                  {isAddingTemplate && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 300, damping: 28 }}
                      className="overflow-hidden bg-muted/30 rounded-xl border border-border/40 p-3 space-y-2"
                    >
                      <Input
                        value={newTemplateName}
                        onChange={(e) => setNewTemplateName(e.target.value)}
                        placeholder={t("templateNamePlaceholder")}
                        className="h-8 text-xs bg-background/80"
                      />
                      <Textarea
                        value={newTemplateContent}
                        onChange={(e) => setNewTemplateContent(e.target.value)}
                        placeholder={t("templateContentPlaceholder")}
                        className="text-xs min-h-[80px] font-mono bg-background/80"
                      />
                      <div className="flex justify-end pt-1">
                        <button
                          onClick={handleCreateTemplate}
                          disabled={!newTemplateName.trim() || !newTemplateContent.trim()}
                          className="px-3 py-1.5 bg-primary text-primary-foreground text-[10px] font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
                        >
                          {t("add")}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Template List */}
                <div className="max-h-[300px] md:max-h-[400px] overflow-y-auto custom-scrollbar -mr-2 pr-2 space-y-2">
                  {templateStore.templates.length === 0 && !isAddingTemplate && (
                    <div className="py-8 text-center text-muted-foreground/40 text-xs">
                      {t("noTemplates")}
                    </div>
                  )}

                  {templateStore.templates.map(t => (
                    <div key={t.id} className="group relative bg-card border border-border/40 rounded-xl p-3 hover:border-border/80 transition-colors">
                      {editingTemplateId === t.id ? (
                        <div className="space-y-2">
                          <Input
                            value={editingTemplateName}
                            onChange={(e) => setEditingTemplateName(e.target.value)}
                            className="h-8 text-xs"
                          />
                          <Textarea
                            value={editingTemplateContent}
                            onChange={(e) => setEditingTemplateContent(e.target.value)}
                            className="text-xs min-h-[80px] font-mono"
                          />
                          <div className="flex items-center justify-end gap-2 pt-1">
                            <button
                              onClick={() => setEditingTemplateId(null)}
                              className="text-[10px] text-muted-foreground hover:text-foreground"
                            >
                              キャンセル
                            </button>
                            <button
                              onClick={handleUpdateTemplate}
                              className="px-3 py-1 bg-primary text-primary-foreground text-[10px] rounded-lg"
                            >
                              保存
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1 text-left block">
                              <div className="text-xs font-medium text-foreground truncate">{t.name}</div>
                              <div className="text-[10px] text-muted-foreground/60 line-clamp-2 mt-1 font-mono">
                                {t.content}
                              </div>
                            </div>
                            <div className="flex items-center gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity self-start">
                              <button
                                onClick={() => startEditTemplate(t)}
                                className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => templateStore.deleteTemplate(t.id)}
                                className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded-lg transition-colors"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </div>
  )
}
