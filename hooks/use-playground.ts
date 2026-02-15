"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import type {
  PlaygroundSettings,
  PanelState,
  ChatMessage,
  ModelId,
} from "@/lib/types"

const DEFAULT_SYSTEM_PROMPT = "You are a helpful assistant."
const STORAGE_KEY_SETTINGS = "longcat-settings"
const STORAGE_KEY_PANELS = "longcat-panels"
const STORAGE_KEY_DRAFT = "longcat-draft"

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function createPanel(id: number): PanelState {
  return {
    id,
    title: `Panel ${id + 1}`,
    systemPrompt: DEFAULT_SYSTEM_PROMPT,
    messages: [],
    isLoading: false,
  }
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

/* ------------------------------------------------------------------ */
/*  localStorage helpers                                               */
/* ------------------------------------------------------------------ */

function loadFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function saveToStorage(key: string, value: unknown) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // quota exceeded - silently fail
  }
}

function removeFromStorage(key: string) {
  if (typeof window === "undefined") return
  try {
    localStorage.removeItem(key)
  } catch {
    // ignore
  }
}

/* ------------------------------------------------------------------ */
/*  SSE parser                                                         */
/* ------------------------------------------------------------------ */

interface SSEDelta {
  content: string
  thinking: string
  usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number }
}

async function* parseSSEStream(
  reader: ReadableStreamDefaultReader<Uint8Array>
): AsyncGenerator<SSEDelta> {
  const decoder = new TextDecoder()
  let buffer = ""

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split("\n")
    buffer = lines.pop() || ""

    for (const rawLine of lines) {
      const line = rawLine.trim()
      if (!line) continue
      if (line === "data: [DONE]") continue
      if (!line.startsWith("data:")) continue

      const jsonStr = line.slice(5).trim()
      if (!jsonStr) continue

      try {
        const parsed = JSON.parse(jsonStr)
        const delta = parsed.choices?.[0]?.delta
        const usage = parsed.usage

        const content = delta
          ? typeof delta.content === "string" ? delta.content : ""
          : ""
        const thinking = delta
          ? (typeof delta.thinking === "string"
              ? delta.thinking
              : typeof delta.reasoning_content === "string"
                ? delta.reasoning_content
                : typeof delta.reasoning === "string"
                  ? delta.reasoning
                  : "")
          : ""

        if (content || thinking || usage) {
          yield {
            content,
            thinking,
            usage: usage
              ? { prompt_tokens: usage.prompt_tokens ?? 0, completion_tokens: usage.completion_tokens ?? 0, total_tokens: usage.total_tokens ?? 0 }
              : undefined,
          }
        }
      } catch {
        // skip
      }
    }
  }

  if (buffer.trim()) {
    const line = buffer.trim()
    if (line.startsWith("data:") && line !== "data: [DONE]") {
      const jsonStr = line.slice(5).trim()
      try {
        const parsed = JSON.parse(jsonStr)
        const delta = parsed.choices?.[0]?.delta
        const usage = parsed.usage
        const content = delta ? (typeof delta.content === "string" ? delta.content : "") : ""
        const thinking = delta
          ? (typeof delta.thinking === "string" ? delta.thinking
            : typeof delta.reasoning_content === "string" ? delta.reasoning_content
            : typeof delta.reasoning === "string" ? delta.reasoning : "")
          : ""
        if (content || thinking || usage) {
          yield {
            content,
            thinking,
            usage: usage
              ? { prompt_tokens: usage.prompt_tokens ?? 0, completion_tokens: usage.completion_tokens ?? 0, total_tokens: usage.total_tokens ?? 0 }
              : undefined,
          }
        }
      } catch {
        // ignore
      }
    }
  }
}

/* ------------------------------------------------------------------ */
/*  Default values                                                     */
/* ------------------------------------------------------------------ */

const DEFAULT_SETTINGS: PlaygroundSettings = {
  apiKey: "",
  model: "LongCat-Flash-Lite",
  panelCount: 2,
}

const DEFAULT_PANELS: PanelState[] = [
  createPanel(0),
  createPanel(1),
  createPanel(2),
  createPanel(3),
  createPanel(4),
]

/* ------------------------------------------------------------------ */
/*  Hook                                                               */
/* ------------------------------------------------------------------ */

export function usePlayground() {
  // ------ hydration-safe state init from localStorage ------
  const [settings, setSettings] = useState<PlaygroundSettings>(DEFAULT_SETTINGS)
  const [panels, setPanels] = useState<PanelState[]>(DEFAULT_PANELS)
  const [draft, setDraft] = useState("")
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    const savedSettings = loadFromStorage<PlaygroundSettings>(
      STORAGE_KEY_SETTINGS,
      DEFAULT_SETTINGS
    )
    const savedPanels = loadFromStorage<PanelState[]>(
      STORAGE_KEY_PANELS,
      DEFAULT_PANELS
    )
    const savedDraft = loadFromStorage<string>(STORAGE_KEY_DRAFT, "")

    // Ensure 5 panels always exist (merge saved with defaults)
    const mergedPanels = Array.from({ length: 5 }, (_, i) => {
      const saved = savedPanels.find((p) => p.id === i)
      if (saved) {
        // Clear isLoading and isStreaming on restore
        return {
          ...saved,
          isLoading: false,
          messages: saved.messages.map((m) => ({ ...m, isStreaming: false })),
        }
      }
      return createPanel(i)
    })

    setSettings(savedSettings)
    setPanels(mergedPanels)
    setDraft(savedDraft)
    setHydrated(true)
  }, [])

  // ------ Persist to localStorage on change ------
  useEffect(() => {
    if (!hydrated) return
    saveToStorage(STORAGE_KEY_SETTINGS, settings)
  }, [settings, hydrated])

  useEffect(() => {
    if (!hydrated) return
    // Save panels without isLoading/isStreaming state
    const toSave = panels.map((p) => ({
      ...p,
      isLoading: false,
      messages: p.messages.map((m) => ({ ...m, isStreaming: false })),
    }))
    saveToStorage(STORAGE_KEY_PANELS, toSave)
  }, [panels, hydrated])

  useEffect(() => {
    if (!hydrated) return
    saveToStorage(STORAGE_KEY_DRAFT, draft)
  }, [draft, hydrated])

  const abortControllersRef = useRef<Map<number, AbortController>>(new Map())

  const settingsRef = useRef(settings)
  settingsRef.current = settings

  const panelsRef = useRef(panels)
  panelsRef.current = panels

  /* ------ Settings updates ------ */

  const updatePanelCount = useCallback((count: number) => {
    setSettings((prev) => ({ ...prev, panelCount: count }))
  }, [])

  const updateApiKey = useCallback((apiKey: string) => {
    setSettings((prev) => ({ ...prev, apiKey }))
  }, [])

  const updateModel = useCallback((model: ModelId) => {
    setSettings((prev) => ({ ...prev, model }))
  }, [])



  const updatePanelTitle = useCallback(
    (panelId: number, title: string) => {
      setPanels((prev) =>
        prev.map((p) => (p.id === panelId ? { ...p, title } : p))
      )
    },
    []
  )

  const updateSystemPrompt = useCallback(
    (panelId: number, prompt: string) => {
      setPanels((prev) =>
        prev.map((p) => (p.id === panelId ? { ...p, systemPrompt: prompt } : p))
      )
    },
    []
  )

  /* ------ Delete operations ------ */

  const clearAllChats = useCallback(() => {
    abortControllersRef.current.forEach((controller) => controller.abort())
    abortControllersRef.current.clear()
    setPanels((prev) =>
      prev.map((p) => ({ ...p, messages: [], isLoading: false }))
    )
  }, [])

  const clearApiKey = useCallback(() => {
    setSettings((prev) => ({ ...prev, apiKey: "" }))
  }, [])

  const resetSystemPrompts = useCallback(() => {
    setPanels((prev) =>
      prev.map((p) => ({
        ...p,
        systemPrompt: DEFAULT_SYSTEM_PROMPT,
        title: `Panel ${p.id + 1}`,
      }))
    )
  }, [])

  const clearEverything = useCallback(() => {
    abortControllersRef.current.forEach((controller) => controller.abort())
    abortControllersRef.current.clear()
    setSettings(DEFAULT_SETTINGS)
    setPanels(DEFAULT_PANELS.map((p) => ({ ...p })))
    setDraft("")
    removeFromStorage(STORAGE_KEY_SETTINGS)
    removeFromStorage(STORAGE_KEY_PANELS)
    removeFromStorage(STORAGE_KEY_DRAFT)
  }, [])

  /* ------ Send message ------ */

  const sendMessage = useCallback(
    async (userMessage: string) => {
      const snap = settingsRef.current
      if (!userMessage.trim() || !snap.apiKey.trim()) return

      const userMsg: ChatMessage = {
        id: generateId(),
        role: "user",
        content: userMessage,
      }

      const currentSettings = { ...snap }

      // Read panels synchronously from ref - guaranteed latest
      const currentPanelSnapshots = panelsRef.current
        .slice(0, currentSettings.panelCount)
        .map((p) => ({ ...p }))

      if (currentPanelSnapshots.length === 0) return

      // Add user message + set loading
      setPanels((prev) =>
        prev.map((p, idx) =>
          idx < currentSettings.panelCount
            ? { ...p, messages: [...p.messages, userMsg], isLoading: true }
            : p
        )
      )

      const promises = currentPanelSnapshots.map(async (panelSnapshot) => {
        const panelId = panelSnapshot.id
        const assistantMsgId = generateId()

        setPanels((prev) =>
          prev.map((p) =>
            p.id === panelId
              ? {
                  ...p,
                  messages: [
                    ...p.messages,
                    {
                      id: assistantMsgId,
                      role: "assistant" as const,
                      content: "",
                      thinking: "",
                      isStreaming: true,
                    },
                  ],
                }
              : p
          )
        )

        const abortController = new AbortController()
        abortControllersRef.current.set(panelId, abortController)

        try {
          const messagesForApi = [
            ...panelSnapshot.messages.map((m) => ({
              role: m.role,
              content: m.content,
            })),
            { role: "user" as const, content: userMessage },
          ]

          const response = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              apiKey: currentSettings.apiKey,
              model: currentSettings.model,
              systemPrompt: panelSnapshot.systemPrompt,
              messages: messagesForApi,
              enableThinking: currentSettings.model.toLowerCase().includes("thinking"),
            }),
            signal: abortController.signal,
          })

          if (!response.ok) {
            const errorText = await response.text()
            let errorMessage = `API error: ${response.status}`
            try {
              const errorData = JSON.parse(errorText)
              errorMessage = errorData.error || errorMessage
            } catch {
              errorMessage = errorText || errorMessage
            }
            throw new Error(errorMessage)
          }

          const reader = response.body?.getReader()
          if (!reader) throw new Error("No response body")

          let accContent = ""
          let accThinking = ""
          let lastUsage: { prompt_tokens: number; completion_tokens: number; total_tokens: number } | undefined

          for await (const delta of parseSSEStream(reader)) {
            accContent += delta.content
            accThinking += delta.thinking
            if (delta.usage) lastUsage = delta.usage

            const contentNow = accContent
            const thinkingNow = accThinking

            setPanels((prev) =>
              prev.map((p) =>
                p.id === panelId
                  ? {
                      ...p,
                      messages: p.messages.map((m) =>
                        m.id === assistantMsgId
                          ? {
                              ...m,
                              content: contentNow,
                              thinking: thinkingNow || undefined,
                              isStreaming: true,
                            }
                          : m
                      ),
                    }
                  : p
              )
            )
          }

          const finalContent = accContent
          const finalThinking = accThinking
          const finalUsage = lastUsage
            ? { prompt: lastUsage.prompt_tokens, completion: lastUsage.completion_tokens, total: lastUsage.total_tokens }
            : undefined

          setPanels((prev) =>
            prev.map((p) =>
              p.id === panelId
                ? {
                    ...p,
                    isLoading: false,
                    messages: p.messages.map((m) =>
                      m.id === assistantMsgId
                        ? {
                            ...m,
                            content: finalContent,
                            thinking: finalThinking || undefined,
                            isStreaming: false,
                            tokenUsage: finalUsage,
                          }
                        : m
                    ),
                  }
                : p
            )
          )
        } catch (error) {
          if ((error as Error).name === "AbortError") return

          const errorMessage =
            error instanceof Error ? error.message : "Unknown error"

          setPanels((prev) =>
            prev.map((p) =>
              p.id === panelId
                ? {
                    ...p,
                    isLoading: false,
                    messages: p.messages.map((m) =>
                      m.id === assistantMsgId
                        ? {
                            ...m,
                            content: `Error: ${errorMessage}`,
                            isStreaming: false,
                          }
                        : m
                    ),
                  }
                : p
            )
          )
        } finally {
          abortControllersRef.current.delete(panelId)
        }
      })

      await Promise.allSettled(promises)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  return {
    settings,
    panels: panels.slice(0, settings.panelCount),
    draft,
    setDraft,
    hydrated,
    updateApiKey,
    updateModel,
    updatePanelCount,
    updatePanelTitle,
    updateSystemPrompt,
    clearAllChats,
    clearApiKey,
    resetSystemPrompts,
    clearEverything,
    sendMessage,
  }
}
