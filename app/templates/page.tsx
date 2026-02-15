"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import Link from "next/link"
import {
  Plus,
  Pencil,
  Trash2,
  Check,
  ChevronRight,
  Copy,
  Type,
  ArrowLeft,
  FileText,
  PanelLeft,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Textarea } from "@/components/ui/textarea"
import { Sidebar, SIDEBAR_WIDTH, ICON_BAR_WIDTH } from "@/components/sidebar"
import { useTemplates } from "@/hooks/use-templates"
import type { PromptTemplate } from "@/lib/types"
import { cn } from "@/lib/utils"

export default function TemplatesPage() {
  const { templates, addTemplate, updateTemplate, deleteTemplate } = useTemplates()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])

  const contentMargin = isMobile ? 0 : sidebarOpen ? SIDEBAR_WIDTH : ICON_BAR_WIDTH

  return (
    <div className="flex h-dvh bg-background overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onOpen={() => setSidebarOpen(true)}
        isMobile={isMobile}
        templates={templates}
      />

      {/* Main content */}
      <div
        className="flex-1 flex flex-col min-w-0 transition-[margin] duration-300 ease-out"
        style={{ marginLeft: contentMargin }}
      >
        {/* Header */}
        <div className="shrink-0 px-3 pt-3 pb-0 md:px-4 md:pt-4">
          <header className="bg-card/80 backdrop-blur-xl border border-border/60 rounded-2xl">
            <div className="flex items-center justify-between px-4 h-14 md:px-5">
              <div className="flex items-center gap-2">
                {/* Mobile sidebar toggle */}
                {isMobile && (
                  <motion.button
                    onClick={() => setSidebarOpen(true)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.85 }}
                    className="h-7 w-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-primary transition-colors md:hidden"
                  >
                    <PanelLeft className="h-3.5 w-3.5" />
                  </motion.button>
                )}
                <FileText className="h-4 w-4 text-primary" />
                <h1 className="text-sm font-heading tracking-tight text-foreground">
                  {"テンプレート管理"}
                </h1>
              </div>
              <Link
                href="/"
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-3 w-3" />
                <span>{"Playgroundに戻る"}</span>
              </Link>
            </div>
          </header>
        </div>

        {/* Template list */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-4 py-6 md:px-6">
          <div className="max-w-2xl mx-auto space-y-4">
            {/* Add button */}
            <CreateTemplateForm onAdd={addTemplate} />

            {/* Empty state */}
            {templates.length === 0 && (
              <div className="text-center py-16">
                <FileText className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground/50">
                  {"テンプレートがまだありません"}
                </p>
                <p className="text-xs text-muted-foreground/30 mt-1">
                  {"上のボタンから作成できます"}
                </p>
              </div>
            )}

            {/* Template cards */}
            {templates.map((t) => (
              <TemplateCard
                key={t.id}
                template={t}
                onUpdate={updateTemplate}
                onDelete={deleteTemplate}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Create template form                                               */
/* ------------------------------------------------------------------ */

function CreateTemplateForm({
  onAdd,
}: {
  onAdd: (name: string, content: string) => PromptTemplate
}) {
  const [isCreating, setIsCreating] = useState(false)
  const [name, setName] = useState("")
  const [content, setContent] = useState("")

  const handleCreate = () => {
    if (!name.trim() || !content.trim()) return
    onAdd(name.trim(), content.trim())
    setName("")
    setContent("")
    setIsCreating(false)
  }

  if (!isCreating) {
    return (
      <motion.button
        onClick={() => setIsCreating(true)}
        whileHover={{ scale: 1.005 }}
        whileTap={{ scale: 0.995 }}
        className="w-full flex items-center justify-center gap-1.5 py-3 rounded-xl border border-dashed border-border/80 text-xs text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all"
      >
        <Plus className="h-3.5 w-3.5" />
        <span>{"新しいテンプレートを作成"}</span>
      </motion.button>
    )
  }

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 28 }}
      className="overflow-hidden"
    >
      <div className="p-4 border border-primary/20 rounded-xl bg-primary/5 space-y-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="テンプレート名"
          className="w-full text-sm bg-background border border-border/60 rounded-lg px-3 py-2.5 outline-none focus:border-primary/40 transition-colors"
          autoFocus
        />
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="System prompt content..."
          className="text-xs min-h-[100px] resize-none font-mono bg-background border-border/60 rounded-lg focus-visible:ring-primary/30"
          rows={4}
        />
        <div className="flex items-center gap-2">
          <button
            onClick={handleCreate}
            disabled={!name.trim() || !content.trim()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium bg-primary text-primary-foreground disabled:opacity-40 transition-opacity"
          >
            <Check className="h-3 w-3" />
            <span>{"保存"}</span>
          </button>
          <button
            onClick={() => {
              setIsCreating(false)
              setName("")
              setContent("")
            }}
            className="px-3 py-2 rounded-lg text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {"キャンセル"}
          </button>
        </div>
      </div>
    </motion.div>
  )
}

/* ------------------------------------------------------------------ */
/*  Template card (with edit/delete)                                   */
/* ------------------------------------------------------------------ */

function TemplateCard({
  template,
  onUpdate,
  onDelete,
}: {
  template: PromptTemplate
  onUpdate: (id: string, updates: Partial<Pick<PromptTemplate, "name" | "content">>) => void
  onDelete: (id: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(template.name)
  const [editContent, setEditContent] = useState(template.content)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(template.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [template.content])

  const startEdit = () => {
    setEditName(template.name)
    setEditContent(template.content)
    setIsEditing(true)
    setExpanded(true)
  }

  const commitEdit = () => {
    if (!editName.trim()) return
    onUpdate(template.id, { name: editName.trim(), content: editContent.trim() })
    setIsEditing(false)
  }

  if (isEditing) {
    return (
      <div className="p-4 border border-primary/20 rounded-xl bg-primary/5 space-y-3">
        <input
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          className="w-full text-sm bg-background border border-border/60 rounded-lg px-3 py-2.5 outline-none focus:border-primary/40"
          autoFocus
        />
        <Textarea
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          className="text-xs min-h-[100px] resize-none font-mono bg-background border-border/60 rounded-lg focus-visible:ring-primary/30"
          rows={4}
        />
        <div className="flex items-center gap-2">
          <button
            onClick={commitEdit}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium bg-primary text-primary-foreground"
          >
            <Check className="h-3 w-3" />
            <span>{"更新"}</span>
          </button>
          <button
            onClick={() => setIsEditing(false)}
            className="px-3 py-2 rounded-lg text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {"キャンセル"}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="border border-border/60 rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2.5 px-4 py-3 text-left hover:bg-muted/30 transition-colors"
      >
        <motion.span
          animate={{ rotate: expanded ? 90 : 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
        </motion.span>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-foreground truncate">
            {template.name}
          </div>
          {!expanded && (
            <div className="text-[11px] text-muted-foreground/50 truncate mt-0.5">
              {template.content.slice(0, 80)}{"..."}
            </div>
          )}
        </div>
        <span className="text-[10px] text-muted-foreground/30 shrink-0 flex items-center gap-0.5">
          <Type className="h-2.5 w-2.5" />
          {template.content.length}
        </span>
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
            <div className="px-4 pb-4 space-y-3">
              <pre className="text-xs font-mono text-muted-foreground bg-background/60 rounded-lg p-3 whitespace-pre-wrap max-h-48 overflow-y-auto custom-scrollbar">
                {template.content}
              </pre>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className={cn(
                    "flex items-center gap-1 h-7 px-2.5 rounded-lg text-[11px] transition-all",
                    copied
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground/60 hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  <span>{copied ? "Copied" : "Copy"}</span>
                </button>
                <button
                  onClick={startEdit}
                  className="flex items-center gap-1 h-7 px-2.5 rounded-lg text-[11px] text-muted-foreground/60 hover:text-foreground hover:bg-muted/50 transition-all"
                >
                  <Pencil className="h-3 w-3" />
                  <span>{"Edit"}</span>
                </button>
                <button
                  onClick={() => {
                    if (confirmDelete) {
                      onDelete(template.id)
                    } else {
                      setConfirmDelete(true)
                      setTimeout(() => setConfirmDelete(false), 3000)
                    }
                  }}
                  className={cn(
                    "flex items-center gap-1 h-7 px-2.5 rounded-lg text-[11px] transition-all",
                    confirmDelete
                      ? "bg-destructive/10 text-destructive"
                      : "text-muted-foreground/60 hover:text-destructive hover:bg-destructive/5"
                  )}
                >
                  <Trash2 className="h-3 w-3" />
                  <span>{confirmDelete ? "確認" : "Delete"}</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
