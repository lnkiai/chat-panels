"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  PanelLeft,
  PanelLeftClose,
  Sparkles,
  FileText,
  Settings,
} from "lucide-react"
import { motion } from "framer-motion"
import type { PromptTemplate } from "@/lib/types"
import { cn } from "@/lib/utils"

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const SIDEBAR_WIDTH = 256
const ICON_BAR_WIDTH = 56

export { SIDEBAR_WIDTH, ICON_BAR_WIDTH }

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
  onOpen: () => void
  isMobile: boolean
  templates: PromptTemplate[]
  /** Called when user picks a template in sidebar to apply to current panel */
  onApplyTemplate?: (content: string) => void
}

/* ------------------------------------------------------------------ */
/*  Navigation items                                                   */
/* ------------------------------------------------------------------ */

const NAV_ITEMS = [
  { id: "playground", label: "Playground", icon: Sparkles, href: "/" },
  { id: "templates", label: "テンプレート管理", icon: FileText, href: "/templates" },
] as const

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export function Sidebar({
  isOpen,
  onClose,
  onOpen,
  isMobile,
  templates,
  onApplyTemplate,
}: SidebarProps) {
  const pathname = usePathname()
  const [iconBarHover, setIconBarHover] = useState<number | null>(null)

  const activeIndex = NAV_ITEMS.findIndex((item) =>
    item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)
  )
  const indicatorIndex = iconBarHover !== null ? iconBarHover : activeIndex

  const ICON_ITEM_SIZE = 40
  const ICON_ITEM_GAP = 4

  /* ---- Mobile: overlay sidebar ---- */
  if (isMobile) {
    return (
      <>
        {/* Backdrop */}
        <div
          className={cn(
            "fixed inset-0 backdrop-blur-sm bg-background/30 z-40 transition-opacity duration-300 md:hidden",
            isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
          )}
          onClick={onClose}
        />
        <aside
          className={cn(
            "fixed top-0 left-0 h-full w-64 z-50 bg-card border-r border-border/60 flex flex-col md:hidden",
            "transition-transform duration-300 ease-out shadow-xl",
            isOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <SidebarContent
            onClose={onClose}
            pathname={pathname}
            templates={templates}
            onApplyTemplate={onApplyTemplate}
            isMobile
          />
        </aside>
      </>
    )
  }

  /* ---- Desktop: icon bar (collapsed) + full sidebar (expanded) ---- */
  return (
    <>
      {/* Icon bar (visible when sidebar is collapsed) */}
      <aside
        className={cn(
          "fixed top-0 left-0 h-full z-20 bg-card/60 backdrop-blur-xl border-r border-border/40 flex flex-col items-center py-4 gap-3",
          "transition-all duration-300 ease-out",
          isOpen ? "w-0 opacity-0 pointer-events-none" : "opacity-100"
        )}
        style={{ width: isOpen ? 0 : ICON_BAR_WIDTH }}
      >
        {/* Open button */}
        <motion.button
          onClick={onOpen}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
          className="h-9 w-9 flex items-center justify-center rounded-xl border border-border/50 text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors"
          title="サイドバーを開く"
        >
          <PanelLeft className="h-4 w-4" />
        </motion.button>

        {/* Nav icons */}
        <div className="relative mt-2">
          {/* Animated indicator background */}
          {indicatorIndex >= 0 && (
            <div
              className="absolute left-0 right-0 h-10 w-10 bg-primary/8 rounded-lg pointer-events-none transition-transform duration-200"
              style={{
                transform: `translateY(${indicatorIndex * (ICON_ITEM_SIZE + ICON_ITEM_GAP)}px)`,
              }}
            />
          )}
          <div className="flex flex-col gap-1">
            {NAV_ITEMS.map((item, index) => {
              const Icon = item.icon
              const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={cn(
                    "h-10 w-10 flex items-center justify-center rounded-lg relative z-10 transition-colors",
                    isActive || iconBarHover === index
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  title={item.label}
                  onMouseEnter={() => setIconBarHover(index)}
                  onMouseLeave={() => setIconBarHover(null)}
                >
                  <Icon className="h-4.5 w-4.5" />
                </Link>
              )
            })}
          </div>
        </div>
      </aside>

      {/* Full sidebar panel */}
      <aside
        className={cn(
          "fixed top-0 left-0 h-full z-20 bg-card/80 backdrop-blur-xl border-r border-border/60 flex flex-col",
          "transition-transform duration-300 ease-out shadow-lg"
        )}
        style={{
          width: SIDEBAR_WIDTH,
          transform: isOpen ? "translateX(0)" : `translateX(-${SIDEBAR_WIDTH}px)`,
        }}
      >
        <SidebarContent
          onClose={onClose}
          pathname={pathname}
          templates={templates}
          onApplyTemplate={onApplyTemplate}
          isMobile={false}
        />
      </aside>
    </>
  )
}

/* ------------------------------------------------------------------ */
/*  Sidebar inner content                                              */
/* ------------------------------------------------------------------ */

function SidebarContent({
  onClose,
  pathname,
  templates,
  onApplyTemplate,
  isMobile,
}: {
  onClose: () => void
  pathname: string
  templates: PromptTemplate[]
  onApplyTemplate?: (content: string) => void
  isMobile: boolean
}) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const activeIndex = NAV_ITEMS.findIndex((item) =>
    item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)
  )
  const indicatorIndex = hoveredIndex !== null ? hoveredIndex : activeIndex

  const ITEM_HEIGHT = 40
  const ITEM_GAP = 4

  return (
    <>
      {/* Header */}
      <div className="h-14 px-4 flex items-center justify-between border-b border-border/40 shrink-0">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-heading text-foreground">Longcat AI</h2>
        </div>
        <motion.button
          onClick={onClose}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
          className="h-8 w-8 flex items-center justify-center rounded-xl border border-border/50 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
        >
          <PanelLeftClose className="h-4 w-4" />
        </motion.button>
      </div>

      {/* Navigation */}
      <div className="px-3 py-3">
        <div className="relative flex flex-col gap-1">
          {/* Animated indicator */}
          {indicatorIndex >= 0 && (
            <div
              className="absolute left-0 right-0 bg-primary/8 rounded-lg pointer-events-none transition-transform duration-200"
              style={{
                height: ITEM_HEIGHT,
                transform: `translateY(${indicatorIndex * (ITEM_HEIGHT + ITEM_GAP)}px)`,
              }}
            />
          )}

          {NAV_ITEMS.map((item, index) => {
            const Icon = item.icon
            const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)
            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={isMobile ? onClose : undefined}
                className={cn(
                  "w-full flex items-center gap-2.5 h-10 px-3 rounded-lg relative z-10 transition-colors text-sm",
                  isActive || hoveredIndex === index
                    ? "text-foreground font-medium"
                    : "text-muted-foreground"
                )}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-border/40 mx-3" />

      {/* Templates quick-select */}
      <div className="flex-1 overflow-y-auto min-h-0 custom-scrollbar px-3 py-3">
        <p className="text-[11px] font-medium text-muted-foreground/60 uppercase tracking-wider px-2 mb-2">
          {"テンプレート"}
        </p>
        {templates.length === 0 ? (
          <p className="text-xs text-muted-foreground/40 px-2 py-4 text-center">
            {"テンプレートがありません"}
          </p>
        ) : (
          <div className="space-y-1">
            {templates.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  onApplyTemplate?.(t.content)
                  if (isMobile) onClose()
                }}
                className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-primary/5 transition-colors group"
              >
                <div className="text-xs font-medium text-foreground group-hover:text-primary truncate transition-colors">
                  {t.name}
                </div>
                <div className="text-[10px] text-muted-foreground/40 truncate mt-0.5">
                  {t.content.slice(0, 50)}{"..."}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="shrink-0 px-3 py-3 border-t border-border/40">
        <Link
          href="/templates"
          onClick={isMobile ? onClose : undefined}
          className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
        >
          <Settings className="h-3.5 w-3.5" />
          <span>{"テンプレートを管理"}</span>
        </Link>
      </div>
    </>
  )
}
