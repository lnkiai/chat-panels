"use client"

import {
  Eye,
  EyeOff,
  Settings,
  X,
  Trash2,
  ClockFading,
  Minus,
  Plus,
} from "lucide-react"
import Image from "next/image"
import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { PlaygroundSettings } from "@/lib/types"
import { cn } from "@/lib/utils"

interface HeaderBarProps {
  settings: PlaygroundSettings
  onUpdateApiKey: (key: string) => void
  onUpdatePanelCount: (count: number) => void
  onClearChats: () => void
  onClearApiKey: () => void
  onResetPrompts: () => void
  onClearEverything: () => void
}

/* ------------------------------------------------------------------ */
/*  Manage Tabs definition                                             */
/* ------------------------------------------------------------------ */

const MANAGE_TABS = [
  { id: "chats", label: "会話", description: "会話履歴を削除" },
  { id: "apikey", label: "API Key", description: "API Keyを削除" },
  { id: "all", label: "すべて", description: "すべてリセット" },
] as const

type ManageTabId = (typeof MANAGE_TABS)[number]["id"]

/* ------------------------------------------------------------------ */
/*  Desktop Manage Menu (floating dropdown)                            */
/* ------------------------------------------------------------------ */

function DesktopManageMenu({
  onClearChats,
  onClearApiKey,
  onClearEverything,
}: {
  onClearChats: () => void
  onClearApiKey: () => void
  onClearEverything: () => void
}) {
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<ManageTabId>("chats")
  const [confirming, setConfirming] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
        setConfirming(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open])

  const handleDelete = () => {
    if (!confirming) {
      setConfirming(true)
      return
    }
    if (selected === "chats") onClearChats()
    else if (selected === "apikey") onClearApiKey()
    else onClearEverything()
    setOpen(false)
    setConfirming(false)
  }

  const currentTab = MANAGE_TABS.find((t) => t.id === selected)!

  return (
    <div className="relative" ref={menuRef}>
      <motion.button
        onClick={() => { setOpen(!open); setConfirming(false) }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.9 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
        className={cn(
          "inline-flex items-center justify-center h-8 w-8 rounded-xl transition-colors",
          open
            ? "text-primary bg-primary/8"
            : "text-muted-foreground hover:text-primary hover:bg-primary/5"
        )}
      >
        <ClockFading className="h-4 w-4" />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -5, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="absolute top-full right-0 mt-2 z-50"
          >
            <div className="bg-card border border-border/60 rounded-2xl p-2 w-52">
              <div className="flex rounded-xl border border-border/50 bg-background/60 p-1 mb-2">
                {MANAGE_TABS.map((tab) => {
                  const isActive = selected === tab.id
                  return (
                    <button
                      key={tab.id}
                      onClick={() => { setSelected(tab.id); setConfirming(false) }}
                      className="relative flex-1 flex items-center justify-center h-8 rounded-lg text-xs transition-colors z-10"
                    >
                      {isActive && (
                        <motion.div
                          layoutId="manage-tab-bg-desktop"
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
              <div className="px-1 pb-1">
                <p className="text-[10px] text-muted-foreground mb-2 px-1">
                  {currentTab.description}
                </p>
                <motion.button
                  onClick={handleDelete}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  className={cn(
                    "w-full flex items-center justify-center gap-1.5 h-9 rounded-xl text-xs font-medium transition-all",
                    confirming
                      ? "bg-destructive text-destructive-foreground"
                      : selected === "all"
                        ? "bg-destructive/10 text-destructive hover:bg-destructive/20"
                        : "bg-muted/60 text-foreground hover:bg-muted"
                  )}
                >
                  <Trash2 className="h-3 w-3" />
                  <span>{confirming ? "タップして確定" : "削除する"}</span>
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

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
  onResetPrompts,
  onClearEverything,
}: HeaderBarProps) {
  const [showApiKey, setShowApiKey] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  // Mobile manage panel (same slide-down style as settings)
  const [mobileManageOpen, setMobileManageOpen] = useState(false)
  const [manageSelected, setManageSelected] = useState<ManageTabId>("chats")
  const [manageConfirming, setManageConfirming] = useState(false)

  const handleMobileDelete = () => {
    if (!manageConfirming) {
      setManageConfirming(true)
      return
    }
    if (manageSelected === "chats") onClearChats()
    else if (manageSelected === "apikey") onClearApiKey()
    else onClearEverything()
    setMobileManageOpen(false)
    setManageConfirming(false)
  }

  const manageCurrentTab = MANAGE_TABS.find((t) => t.id === manageSelected)!

  return (
    <div className="shrink-0 px-3 pt-3 pb-0 md:px-4 md:pt-4 md:pb-0 z-30 relative">
      <header className="bg-card/80 backdrop-blur-xl border border-border/60 rounded-2xl">
        {/* Desktop layout */}
        <div className="hidden md:flex items-center justify-between px-5 h-14">
          <div className="flex items-center shrink-0">
            <div className="h-7 w-7 rounded-xl bg-card flex items-center justify-center mr-2.5 border border-border/60 overflow-hidden">
              <Image src="/images/longcat-color.svg" alt="Longcat" width={20} height={20} className="h-5 w-5" />
            </div>
            <h1 className="text-sm font-heading tracking-tight text-foreground">
              Longcat AI Playground
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Label htmlFor="api-key-desktop" className="text-xs text-muted-foreground shrink-0">
                API Key
              </Label>
              <div className="relative flex items-center">
                <Input
                  id="api-key-desktop"
                  type={showApiKey ? "text" : "password"}
                  value={settings.apiKey}
                  onChange={(e) => onUpdateApiKey(e.target.value)}
                  placeholder="ak-..."
                  className="h-8 w-44 pr-8 text-xs font-mono rounded-xl bg-background/60 border-border/60 focus-visible:ring-primary/30"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-2.5 flex items-center justify-center text-muted-foreground hover:text-primary transition-colors"
                >
                  {showApiKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>
            <div className="h-5 w-px bg-border/50" />
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Panels</span>
              <PanelStepper count={settings.panelCount} onChange={onUpdatePanelCount} />
            </div>
          </div>

          <div className="shrink-0">
            <DesktopManageMenu
              onClearChats={onClearChats}
              onClearApiKey={onClearApiKey}
              onClearEverything={onClearEverything}
            />
          </div>
        </div>

        {/* Mobile layout */}
        <div className="flex md:hidden items-center justify-between px-3 h-12">
          <div className="flex items-center">
            <div className="h-6 w-6 rounded-lg bg-card flex items-center justify-center mr-2 border border-border/60 overflow-hidden">
              <Image src="/images/longcat-color.svg" alt="Longcat" width={16} height={16} className="h-4 w-4" />
            </div>
            <h1 className="text-sm font-heading tracking-tight text-foreground">
              Longcat AI
            </h1>
          </div>
          <div className="flex items-center gap-0.5">
            {/* Manage button */}
            <motion.button
              onClick={() => { setMobileManageOpen(!mobileManageOpen); setMobileMenuOpen(false); setManageConfirming(false) }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.85 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
              className={cn(
                "h-8 w-8 flex items-center justify-center rounded-xl transition-colors",
                mobileManageOpen ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-primary"
              )}
            >
              <ClockFading className="h-4 w-4" />
            </motion.button>
            {/* Settings button */}
            <motion.button
              onClick={() => { setMobileMenuOpen(!mobileMenuOpen); setMobileManageOpen(false) }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.85 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
              className={cn(
                "h-8 w-8 flex items-center justify-center rounded-xl transition-colors",
                mobileMenuOpen ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-primary"
              )}
            >
              {mobileMenuOpen ? <X className="h-4 w-4" /> : <Settings className="h-4 w-4" />}
            </motion.button>
          </div>
        </div>

        {/* Mobile: Settings slide-down */}
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
                <div className="space-y-1.5">
                  <Label htmlFor="api-key-mobile" className="text-xs text-muted-foreground">
                    API Key
                  </Label>
                  <div className="relative flex items-center">
                    <Input
                      id="api-key-mobile"
                      type={showApiKey ? "text" : "password"}
                      value={settings.apiKey}
                      onChange={(e) => onUpdateApiKey(e.target.value)}
                      placeholder="ak-..."
                      className="h-9 pr-9 text-xs font-mono rounded-xl bg-background/60 border-border/60 focus-visible:ring-primary/30"
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-2.5 flex items-center justify-center text-muted-foreground hover:text-primary transition-colors"
                    >
                      {showApiKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Panels</span>
                  <PanelStepper count={settings.panelCount} onChange={onUpdatePanelCount} />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile: Manage slide-down (same pattern as settings) */}
        <AnimatePresence>
          {mobileManageOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              className="md:hidden overflow-hidden border-t border-border/40"
            >
              <div className="px-4 py-3">
                {/* Tab selector */}
                <div className="flex rounded-xl border border-border/50 bg-background/60 p-1 mb-3">
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
                            layoutId="manage-tab-bg-mobile"
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

                <p className="text-[10px] text-muted-foreground mb-2 px-1">
                  {manageCurrentTab.description}
                </p>
                <motion.button
                  onClick={handleMobileDelete}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  className={cn(
                    "w-full flex items-center justify-center gap-1.5 h-9 rounded-xl text-xs font-medium transition-all",
                    manageConfirming
                      ? "bg-destructive text-destructive-foreground"
                      : manageSelected === "all"
                        ? "bg-destructive/10 text-destructive hover:bg-destructive/20"
                        : "bg-muted/60 text-foreground hover:bg-muted"
                  )}
                >
                  <Trash2 className="h-3 w-3" />
                  <span>{manageConfirming ? "タップして確定" : "削除する"}</span>
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </div>
  )
}
