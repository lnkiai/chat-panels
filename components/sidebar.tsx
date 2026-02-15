"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import {
  X,
  Plus,
  Pencil,
  Trash2,
  Check,
  ChevronRight,
  FileText,
  Settings2,
  Copy,
  Type,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Textarea } from "@/components/ui/textarea"
import type { PromptTemplate, PanelState } from "@/lib/types"
import { cn } from "@/lib/utils"

interface SidebarProps {
  open: boolean
  onClose: () => void
  templates: PromptTemplate[]
  onAddTemplate: (name: string, content: string) => PromptTemplate
  onUpdateTemplate: (id: string, updates: Partial<Pick<PromptTemplate, "name" | "content">>) => void
  onDeleteTemplate: (id: string) => void
  panels: PanelState[]
  onUpdateSystemPrompt: (panelId: number, prompt: string) => void
  onUpdatePanelTitle: (panelId: number, title: string) => void
}

type SidebarTab = "templates" | "panels"

export function Sidebar({
  open,
  onClose,
  templates,
  onAddTemplate,
  onUpdateTemplate,
  onDeleteTemplate,
  panels,
  onUpdateSystemPrompt,
  onUpdatePanelTitle,
}: SidebarProps) {
  const [tab, setTab] = useState<SidebarTab>("templates")

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px]"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Slide panel */}
      <AnimatePresence>
        {open && (
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed left-0 top-0 bottom-0 z-50 w-[340px] md:w-[380px] bg-card border-r border-border/60 flex flex-col overflow-hidden shadow-xl"
          >
            {/* Header */}
            <div className="shrink-0 flex items-center justify-between px-5 h-14 border-b border-border/50">
              <h2 className="text-sm font-heading text-foreground">
                {"Prompt Manager"}
              </h2>
              <motion.button
                onClick={onClose}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="h-8 w-8 flex items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              >
                <X className="h-4 w-4" />
              </motion.button>
            </div>

            {/* Tab switcher */}
            <div className="shrink-0 flex mx-4 mt-3 bg-muted/50 rounded-xl p-1 gap-1">
              <button
                onClick={() => setTab("templates")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all",
                  tab === "templates"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <FileText className="h-3.5 w-3.5" />
                <span>{"テンプレート"}</span>
              </button>
              <button
                onClick={() => setTab("panels")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all",
                  tab === "panels"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Settings2 className="h-3.5 w-3.5" />
                <span>{"パネル設定"}</span>
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto min-h-0 custom-scrollbar">
              {tab === "templates" ? (
                <TemplatesSection
                  templates={templates}
                  onAdd={onAddTemplate}
                  onUpdate={onUpdateTemplate}
                  onDelete={onDeleteTemplate}
                />
              ) : (
                <PanelsSection
                  panels={panels}
                  onUpdatePrompt={onUpdateSystemPrompt}
                  onUpdateTitle={onUpdatePanelTitle}
                />
              )}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  )
}

/* ------------------------------------------------------------------ */
/*  Templates section                                                  */
/* ------------------------------------------------------------------ */

function TemplatesSection({
  templates,
  onAdd,
  onUpdate,
  onDelete,
}: {
  templates: PromptTemplate[]
  onAdd: (name: string, content: string) => PromptTemplate
  onUpdate: (id: string, updates: Partial<Pick<PromptTemplate, "name" | "content">>) => void
  onDelete: (id: string) => void
}) {
  const [isCreating, setIsCreating] = useState(false)
  const [newName, setNewName] = useState("")
  const [newContent, setNewContent] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [editContent, setEditContent] = useState("")

  const handleCreate = () => {
    if (!newName.trim() || !newContent.trim()) return
    onAdd(newName.trim(), newContent.trim())
    setNewName("")
    setNewContent("")
    setIsCreating(false)
  }

  const startEdit = (t: PromptTemplate) => {
    setEditingId(t.id)
    setEditName(t.name)
    setEditContent(t.content)
  }

  const commitEdit = () => {
    if (!editingId || !editName.trim()) return
    onUpdate(editingId, { name: editName.trim(), content: editContent.trim() })
    setEditingId(null)
  }

  return (
    <div className="px-4 py-3 space-y-3">
      {/* Add button */}
      {!isCreating && (
        <motion.button
          onClick={() => setIsCreating(true)}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-dashed border-border/80 text-xs text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>{"新しいテンプレート"}</span>
        </motion.button>
      )}

      {/* Create form */}
      <AnimatePresence>
        {isCreating && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="overflow-hidden"
          >
            <div className="p-3 border border-primary/20 rounded-xl bg-primary/5 space-y-2">
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="テンプレート名"
                className="w-full text-xs bg-background border border-border/60 rounded-lg px-3 py-2 outline-none focus:border-primary/40"
                autoFocus
              />
              <Textarea
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="System prompt content..."
                className="text-xs min-h-[72px] resize-none font-mono bg-background border-border/60 rounded-lg focus-visible:ring-primary/30"
                rows={3}
              />
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCreate}
                  disabled={!newName.trim() || !newContent.trim()}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary text-primary-foreground disabled:opacity-40 transition-opacity"
                >
                  <Check className="h-3 w-3" />
                  <span>{"保存"}</span>
                </button>
                <button
                  onClick={() => {
                    setIsCreating(false)
                    setNewName("")
                    setNewContent("")
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  {"キャンセル"}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Templates list */}
      {templates.length === 0 && !isCreating && (
        <p className="text-center text-xs text-muted-foreground/50 py-8">
          {"テンプレートがありません"}
        </p>
      )}

      {templates.map((t) => (
        <div key={t.id}>
          {editingId === t.id ? (
            <div className="p-3 border border-primary/20 rounded-xl bg-primary/5 space-y-2">
              <input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full text-xs bg-background border border-border/60 rounded-lg px-3 py-2 outline-none focus:border-primary/40"
                autoFocus
              />
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="text-xs min-h-[72px] resize-none font-mono bg-background border-border/60 rounded-lg focus-visible:ring-primary/30"
                rows={3}
              />
              <div className="flex items-center gap-2">
                <button
                  onClick={commitEdit}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary text-primary-foreground"
                >
                  <Check className="h-3 w-3" />
                  <span>{"更新"}</span>
                </button>
                <button
                  onClick={() => setEditingId(null)}
                  className="px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  {"キャンセル"}
                </button>
              </div>
            </div>
          ) : (
            <TemplateCard
              template={t}
              onEdit={() => startEdit(t)}
              onDelete={() => onDelete(t.id)}
            />
          )}
        </div>
      ))}
    </div>
  )
}

function TemplateCard({
  template,
  onEdit,
  onDelete,
}: {
  template: PromptTemplate
  onEdit: () => void
  onDelete: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(template.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [template.content])

  return (
    <div className="border border-border/60 rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-muted/30 transition-colors"
      >
        <motion.span
          animate={{ rotate: expanded ? 90 : 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          <ChevronRight className="h-3 w-3 text-muted-foreground" />
        </motion.span>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium text-foreground truncate">{template.name}</div>
          {!expanded && (
            <div className="text-[10px] text-muted-foreground/50 truncate mt-0.5">
              {template.content.slice(0, 50)}{"..."}
            </div>
          )}
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 space-y-2">
              <pre className="text-[11px] font-mono text-muted-foreground bg-background/60 rounded-lg p-2.5 whitespace-pre-wrap max-h-32 overflow-y-auto custom-scrollbar">
                {template.content}
              </pre>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleCopy}
                  className={cn(
                    "flex items-center gap-1 h-6 px-2 rounded-md text-[10px] transition-all",
                    copied
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground/60 hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  {copied ? <Check className="h-2.5 w-2.5" /> : <Copy className="h-2.5 w-2.5" />}
                  <span>{copied ? "Copied" : "Copy"}</span>
                </button>
                <button
                  onClick={onEdit}
                  className="flex items-center gap-1 h-6 px-2 rounded-md text-[10px] text-muted-foreground/60 hover:text-foreground hover:bg-muted/50 transition-all"
                >
                  <Pencil className="h-2.5 w-2.5" />
                  <span>{"Edit"}</span>
                </button>
                <button
                  onClick={() => {
                    if (confirmDelete) {
                      onDelete()
                    } else {
                      setConfirmDelete(true)
                      setTimeout(() => setConfirmDelete(false), 3000)
                    }
                  }}
                  className={cn(
                    "flex items-center gap-1 h-6 px-2 rounded-md text-[10px] transition-all",
                    confirmDelete
                      ? "bg-destructive/10 text-destructive"
                      : "text-muted-foreground/60 hover:text-destructive hover:bg-destructive/5"
                  )}
                >
                  <Trash2 className="h-2.5 w-2.5" />
                  <span>{confirmDelete ? "確認" : "Delete"}</span>
                </button>
                <div className="flex-1" />
                <span className="text-[9px] text-muted-foreground/30 flex items-center gap-0.5">
                  <Type className="h-2 w-2" />
                  {template.content.length} {"chars"}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Panels section                                                     */
/* ------------------------------------------------------------------ */

function PanelsSection({
  panels,
  onUpdatePrompt,
  onUpdateTitle,
}: {
  panels: PanelState[]
  onUpdatePrompt: (panelId: number, prompt: string) => void
  onUpdateTitle: (panelId: number, title: string) => void
}) {
  return (
    <div className="px-4 py-3 space-y-3">
      {panels.map((panel) => (
        <PanelPromptEditor
          key={panel.id}
          panel={panel}
          onUpdatePrompt={(prompt) => onUpdatePrompt(panel.id, prompt)}
          onUpdateTitle={(title) => onUpdateTitle(panel.id, title)}
        />
      ))}
    </div>
  )
}

function PanelPromptEditor({
  panel,
  onUpdatePrompt,
  onUpdateTitle,
}: {
  panel: PanelState
  onUpdatePrompt: (prompt: string) => void
  onUpdateTitle: (title: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [titleDraft, setTitleDraft] = useState(panel.title)
  const titleInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setTitleDraft(panel.title)
  }, [panel.title])

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
    <div className="border border-border/60 rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2.5">
        <button
          onClick={() => setExpanded(!expanded)}
          className="shrink-0"
        >
          <motion.span
            animate={{ rotate: expanded ? 90 : 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <ChevronRight className="h-3 w-3 text-muted-foreground" />
          </motion.span>
        </button>

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
            className="text-xs font-heading bg-transparent border-b-2 border-primary outline-none px-0 py-0 w-28 text-foreground"
            maxLength={30}
          />
        ) : (
          <button
            onClick={() => {
              setTitleDraft(panel.title)
              setIsEditingTitle(true)
            }}
            className="flex items-center gap-1 text-xs font-heading text-foreground hover:text-primary transition-colors group"
          >
            <span>{panel.title}</span>
            <Pencil className="h-2.5 w-2.5 opacity-0 group-hover:opacity-60 transition-opacity" />
          </button>
        )}

        {!expanded && panel.systemPrompt.trim() && (
          <span className="ml-auto text-[10px] text-muted-foreground/40 truncate min-w-0 flex-1 text-right pl-3">
            {panel.systemPrompt}
          </span>
        )}
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 space-y-2">
              <Textarea
                value={panel.systemPrompt}
                onChange={(e) => onUpdatePrompt(e.target.value)}
                className="text-xs min-h-[80px] resize-none font-mono bg-background/60 border-border/60 rounded-lg focus-visible:ring-primary/30 focus-visible:border-primary/40 custom-scrollbar"
                placeholder="System prompt..."
                rows={3}
              />
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground/50">
                <Type className="h-2.5 w-2.5" />
                <span>{panel.systemPrompt.length.toLocaleString()} {"chars"}</span>
                <span>{"~"}{Math.ceil(panel.systemPrompt.length / 3).toLocaleString()} {"tokens"}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
