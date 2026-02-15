"use client"

import { useState, useCallback, useEffect } from "react"
import type { PromptTemplate } from "@/lib/types"

const STORAGE_KEY = "longcat-templates"

function loadTemplates(): PromptTemplate[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as PromptTemplate[]
  } catch {
    return []
  }
}

function saveTemplates(templates: PromptTemplate[]) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(templates))
  } catch {
    // quota exceeded
  }
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

export function useTemplates() {
  const [templates, setTemplates] = useState<PromptTemplate[]>([])
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setTemplates(loadTemplates())
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    saveTemplates(templates)
  }, [templates, hydrated])

  const addTemplate = useCallback((name: string, content: string) => {
    const now = Date.now()
    const t: PromptTemplate = {
      id: generateId(),
      name,
      content,
      createdAt: now,
      updatedAt: now,
    }
    setTemplates((prev) => [...prev, t])
    return t
  }, [])

  const updateTemplate = useCallback(
    (id: string, updates: Partial<Pick<PromptTemplate, "name" | "content">>) => {
      setTemplates((prev) =>
        prev.map((t) =>
          t.id === id ? { ...t, ...updates, updatedAt: Date.now() } : t
        )
      )
    },
    []
  )

  const deleteTemplate = useCallback((id: string) => {
    setTemplates((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const clearTemplates = useCallback(() => {
    setTemplates([])
  }, [])

  return { templates, addTemplate, updateTemplate, deleteTemplate, clearTemplates }
}
