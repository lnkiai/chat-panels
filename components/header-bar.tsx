"use client"

import {
  Eye,
  EyeOff,
  Settings,
  Settings2,
  X,
  Trash2,
  ClockFading,
  Minus,
  Plus,
  Pencil,
  Book,
  Check,
  BookmarkPlus,
  RefreshCw,
  Search,
  Box,
  BrainCircuit,
  ToggleLeft,
  ToggleRight
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { PlaygroundSettings, PanelState, PromptTemplate } from "@/lib/types"
import { getProvider, getAllProviders } from "@/lib/ai-providers/registry"
import { cn } from "@/lib/utils"

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
  onClearApiKey: () => void
  onResetPrompts: () => void
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
  updateProviderConfig?: (providerId: string, config: { apiKey?: string; enabled?: boolean }) => void
  updateProviderModels?: (providerId: string, models: { id: string; label: string; description?: string }[]) => void
  togglePanelMode?: (enabled: boolean) => void
}

/* ------------------------------------------------------------------ */
/*  Manage Tabs definition                                             */
/* ------------------------------------------------------------------ */

const MANAGE_TABS = [
  { id: "chats", label: "会話", description: "会話履歴を削除" },
  { id: "apikey", label: "API Key", description: "API Keyを削除" },
  { id: "templates", label: "テンプレート", description: "テンプレートを削除" },
  { id: "all", label: "すべて", description: "すべてリセット" },
] as const

type ManageTabId = (typeof MANAGE_TABS)[number]["id"]

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
      <span className="w-6 text-center text-xs font-heading tabular-nums text-foreground">
        {count}
      </span>
      <motion.button
        onClick={() => onChange(Math.min(5, count + 1))}
        disabled={count >= 5}
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
  onClearApiKey,
  onClearEverything,
  setMobilePromptOpen,
  templates = [],
  onApplyTemplate,
  templateStore,
  updateActiveProvider,
  updateProviderConfig,
  updateProviderModels,
  togglePanelMode
}: HeaderBarProps) {
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
    else {
      onClearEverything()
      templateStore?.clearTemplates?.()
    }
    setManageOpen(false)
    setManageConfirming(false)
  }

  const manageCurrentTab = MANAGE_TABS.find((t) => t.id === manageSelected)!

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
    if (!updateProviderModels || !selectedProviderConfig.apiKey) return
    setIsFetchingModels(true)
    try {
      const res = await fetch("/api/models", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          providerId: selectedProviderId,
          apiKey: selectedProviderConfig.apiKey
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

            {/* Provider Link - Replaced with internal Drawer toggle */}
            {activeProvider && !settings.enablePanelMode && (
              <button
                onClick={() => {
                  const next = !providersOpen
                  closeAllDrawers()
                  if (next) {
                    setProvidersOpen(true)
                    setSelectedProviderId(settings.activeProviderId)
                  }
                }}
                className={cn(
                  "flex items-center gap-2 px-2 py-1 rounded-lg transition-colors",
                  providersOpen ? "bg-primary/10 text-primary" : "hover:bg-muted/50 text-foreground"
                )}
                title="Manage Providers"
              >
                <div className="h-8 w-8 rounded-md border border-border/60 bg-background/50 flex items-center justify-center overflow-hidden">
                  <Image
                    src={activeProvider.iconPath}
                    alt={activeProvider.name}
                    width={20}
                    height={20}
                    onError={(e) => { e.currentTarget.style.display = 'none' }}
                  />
                </div>
                <span className="text-xs font-medium">{activeProvider.name}</span>
              </button>
            )}

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

            <div className="h-5 w-px bg-border/50" />


            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Panels</span>
              <PanelStepper count={settings.panelCount} onChange={onUpdatePanelCount} />
            </div>
          </div>

          {/* Right Controls (Unified) */}
          <div className="flex items-center gap-0.5 md:gap-1">
            {/* AI Providers Toggle (Visible on Mobile/Desktop) */}
            <motion.button
              onClick={() => {
                const next = !providersOpen
                closeAllDrawers()
                if (next) {
                  setProvidersOpen(true)
                  setSelectedProviderId(settings.activeProviderId) // Default to active
                }
              }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.85 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
              className={cn(
                "h-8 w-8 md:h-8 md:w-8 flex items-center justify-center rounded-xl transition-colors",
                providersOpen ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-primary"
              )}
              title="AI Providers"
            >
              <BrainCircuit className="h-4 w-4 md:h-4 md:w-4" />
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
                  <span className="text-xs text-muted-foreground">Panels</span>
                  <PanelStepper count={settings.panelCount} onChange={onUpdatePanelCount} />
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
              <div className="px-4 py-3 md:px-5">
                <div className="flex flex-wrap md:flex-nowrap rounded-xl border border-border/50 bg-background/60 p-1 mb-3">
                  {MANAGE_TABS.map((tab) => {
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
                            className="absolute inset-0 bg-card border border-border/60 rounded-lg"
                            transition={{ type: "spring", bounce: 0.2, duration: 0.35 }}
                          />
                        )}
                        <span className={cn(
                          "relative z-10 text-[11px] font-medium transition-colors",
                          isActive ? "text-foreground" : "text-muted-foreground"
                        )}>
                          {tab.label}
                        </span>
                      </button>
                    )
                  })}
                </div>
                <div className="flex items-center justify-between px-1">
                  <p className="text-[10px] text-muted-foreground">
                    {manageCurrentTab.description}
                  </p>
                  <motion.button
                    onClick={handleDelete}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    className={cn(
                      "flex items-center justify-center gap-1.5 h-8 px-4 rounded-lg text-xs font-medium transition-all",
                      manageConfirming
                        ? "bg-destructive text-destructive-foreground"
                        : manageSelected === "all"
                          ? "bg-destructive/10 text-destructive hover:bg-destructive/20"
                          : "bg-muted/60 text-foreground hover:bg-muted"
                    )}
                  >
                    <Trash2 className="h-3 w-3" />
                    <span>{manageConfirming ? "確定する" : "削除"}</span>
                  </motion.button>
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
                <div className="w-full md:w-56 overflow-y-auto custom-scrollbar bg-muted/10 p-2 space-y-1">
                  <div className="px-2 py-1 mb-2">
                    <h3 className="text-xs font-semibold text-foreground/80">AI Providers</h3>
                  </div>
                  {getAllProviders().map(p => (
                    <button
                      key={p.id}
                      onClick={() => setSelectedProviderId(p.id)}
                      className={cn(
                        "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-colors",
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
                      <span className="text-xs font-medium truncate">{p.name}</span>
                    </button>
                  ))}

                  <div className="mt-4 px-2 py-1 mb-1">
                    <h3 className="text-xs font-semibold text-foreground/80">Options</h3>
                  </div>
                  {/* Panel Mode Toggle in list */}
                  <button
                    onClick={() => togglePanelMode?.(!settings.enablePanelMode)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors bg-muted/20 hover:bg-muted/40"
                  >
                    <div className="flex items-center gap-2">
                      <Box className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs font-medium">Panel Mode</span>
                    </div>
                    {settings.enablePanelMode ? (
                      <ToggleRight className="h-5 w-5 text-primary" />
                    ) : (
                      <ToggleLeft className="h-5 w-5 text-muted-foreground" />
                    )}
                  </button>
                </div>

                {/* Right: Config Area */}
                <div className="flex-1 p-4 md:p-6 overflow-y-auto custom-scrollbar bg-background/50">
                  <div className="max-w-xl mx-auto space-y-6">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-card border border-border/60 flex items-center justify-center shadow-sm">
                          {selectedProviderDef && (
                            <Image
                              src={selectedProviderDef.iconPath}
                              alt={selectedProviderDef.name}
                              width={24}
                              height={24}
                            />
                          )}
                        </div>
                        <div>
                          <h2 className="text-sm font-semibold text-foreground">{selectedProviderDef?.name}</h2>
                          <p className="text-[11px] text-muted-foreground">Configure API access and models</p>
                        </div>
                      </div>
                      {/* Set as Active Button */}
                      {settings.activeProviderId !== selectedProviderId && updateActiveProvider && (
                        <button
                          onClick={() => updateActiveProvider(selectedProviderId)}
                          className="px-3 py-1.5 bg-primary text-primary-foreground text-xs font-medium rounded-lg hover:bg-primary/90 transition-colors"
                        >
                          Set Active
                        </button>
                      )}
                      {settings.activeProviderId === selectedProviderId && (
                        <span className="px-2 py-1 bg-primary/10 text-primary text-[10px] font-medium rounded-lg border border-primary/20">
                          Active Global
                        </span>
                      )}
                    </div>

                    {/* API Key Input */}
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">API Key</Label>
                      <div className="relative">
                        <Input
                          type={showApiKey ? "text" : "password"}
                          value={selectedProviderConfig.apiKey || ""}
                          onChange={(e) => updateProviderConfig?.(selectedProviderId, { apiKey: e.target.value })}
                          placeholder={`Enter ${selectedProviderDef?.name} API Key`}
                          className="text-xs font-mono h-9 pr-20 bg-background/50"
                        />
                        <button
                          type="button"
                          onClick={() => setShowApiKey(!showApiKey)}
                          className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-primary transition-colors"
                        >
                          {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      <p className="text-[10px] text-muted-foreground/60">
                        Keys are stored locally in your browser.
                      </p>
                    </div>

                    {/* Model Fetching */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs text-muted-foreground">Models ({displayModels.length})</Label>
                        <button
                          onClick={handleFetchModels}
                          disabled={isFetchingModels || !selectedProviderConfig.apiKey}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-muted/50 hover:bg-muted text-foreground text-[11px] font-medium rounded-lg transition-colors border border-border/40 disabled:opacity-50"
                        >
                          <RefreshCw className={cn("h-3.5 w-3.5", isFetchingModels && "animate-spin")} />
                          <span>Fetch Models</span>
                        </button>
                      </div>

                      {/* Models List - Fixed Height Scrollable */}
                      <div className="h-[200px] border border-border/60 rounded-xl bg-card/50 overflow-hidden flex flex-col">
                        <div className="overflow-y-auto custom-scrollbar p-1 space-y-1">
                          {displayModels.length === 0 ? (
                            <div className="flex items-center justify-center h-full text-xs text-muted-foreground py-10">
                              No models found. Enter API Key and click Fetch.
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
                                <div className="text-[10px] font-mono text-muted-foreground/40">{model.id}</div>
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
                    テンプレート管理 ({templateStore.templates.length})
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
                    <span>{isAddingTemplate ? "キャンセル" : "新規作成"}</span>
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
                        placeholder="テンプレート名"
                        className="h-8 text-xs bg-background/80"
                      />
                      <Textarea
                        value={newTemplateContent}
                        onChange={(e) => setNewTemplateContent(e.target.value)}
                        placeholder="システムプロンプトの内容..."
                        className="text-xs min-h-[80px] font-mono bg-background/80"
                      />
                      <div className="flex justify-end pt-1">
                        <button
                          onClick={handleCreateTemplate}
                          disabled={!newTemplateName.trim() || !newTemplateContent.trim()}
                          className="px-3 py-1.5 bg-primary text-primary-foreground text-[10px] font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
                        >
                          追加する
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Template List */}
                <div className="max-h-[300px] md:max-h-[400px] overflow-y-auto custom-scrollbar -mr-2 pr-2 space-y-2">
                  {templateStore.templates.length === 0 && !isAddingTemplate && (
                    <div className="py-8 text-center text-muted-foreground/40 text-xs">
                      登録されたテンプレートはありません
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
                            <button
                              className="min-w-0 flex-1 text-left block"
                              onClick={() => {
                                if (onApplyTemplate) {
                                  onApplyTemplate(t.content)
                                  closeAllDrawers()
                                }
                              }}
                            >
                              <div className="text-xs font-medium text-foreground truncate group-hover:text-primary transition-colors">{t.name}</div>
                              <div className="text-[10px] text-muted-foreground/60 line-clamp-2 mt-1 font-mono">
                                {t.content}
                              </div>
                            </button>
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
                              {onApplyTemplate && (
                                <>
                                  <div className="w-px h-4 bg-border/40 mx-0.5" />
                                  <button
                                    onClick={() => {
                                      onApplyTemplate(t.content)
                                      closeAllDrawers()
                                    }}
                                    className="flex items-center gap-1 px-2 py-1 bg-primary/5 text-primary text-[10px] font-medium rounded-md hover:bg-primary/10 transition-colors"
                                  >
                                    <Check className="h-3 w-3" />
                                    適用
                                  </button>
                                </>
                              )}
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
