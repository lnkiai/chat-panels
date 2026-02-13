"use client"

import { useState, useCallback, useRef } from "react"
import type {
  PlaygroundSettings,
  PanelState,
  ChatMessage,
  ModelId,
} from "@/lib/types"

const DEFAULT_SYSTEM_PROMPT = "You are a helpful assistant."

function createPanel(id: number): PanelState {
  return {
    id,
    systemPrompt: DEFAULT_SYSTEM_PROMPT,
    messages: [],
    isLoading: false,
  }
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

/**
 * Parse a raw SSE stream from a ReadableStream<Uint8Array>.
 * Yields { content, thinking } deltas as they arrive.
 */
async function* parseSSEStream(
  reader: ReadableStreamDefaultReader<Uint8Array>
): AsyncGenerator<{ content: string; thinking: string }> {
  const decoder = new TextDecoder()
  let buffer = ""

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })

    // SSE protocol: events are separated by double newlines
    // But we need to handle data lines that end with single newlines too
    // Split on newlines and process complete lines
    const lines = buffer.split("\n")
    // Keep the last potentially incomplete line in the buffer
    buffer = lines.pop() || ""

    for (const rawLine of lines) {
      const line = rawLine.trim()

      // Skip empty lines (SSE event separators)
      if (!line) continue

      // End of stream signal
      if (line === "data: [DONE]") continue

      // Only process data lines
      if (!line.startsWith("data:")) continue

      const jsonStr = line.slice(5).trim()
      if (!jsonStr) continue

      try {
        const parsed = JSON.parse(jsonStr)
        const delta = parsed.choices?.[0]?.delta

        if (delta) {
          const content =
            typeof delta.content === "string" ? delta.content : ""
          // Check multiple possible field names for thinking
          const thinking =
            typeof delta.thinking === "string"
              ? delta.thinking
              : typeof delta.reasoning_content === "string"
                ? delta.reasoning_content
                : typeof delta.reasoning === "string"
                  ? delta.reasoning
                  : ""

          if (content || thinking) {
            yield { content, thinking }
          }
        } else {
          // Log the full chunk for debugging if delta is missing
          console.log("[v0] SSE chunk without delta:", JSON.stringify(parsed).slice(0, 200))
        }
      } catch {
        // Malformed JSON chunk - skip
        console.log("[v0] Skipped malformed SSE JSON:", jsonStr.slice(0, 100))
      }
    }
  }

  // Process any remaining buffer
  if (buffer.trim()) {
    const line = buffer.trim()
    if (line.startsWith("data:") && line !== "data: [DONE]") {
      const jsonStr = line.slice(5).trim()
      try {
        const parsed = JSON.parse(jsonStr)
        const delta = parsed.choices?.[0]?.delta
        if (delta) {
          const content =
            typeof delta.content === "string" ? delta.content : ""
          const thinking =
            typeof delta.thinking === "string"
              ? delta.thinking
              : typeof delta.reasoning_content === "string"
                ? delta.reasoning_content
                : typeof delta.reasoning === "string"
                  ? delta.reasoning
                  : ""
          if (content || thinking) {
            yield { content, thinking }
          }
        }
      } catch {
        // ignore
      }
    }
  }
}

export function usePlayground() {
  const [settings, setSettings] = useState<PlaygroundSettings>({
    apiKey: "",
    model: "LongCat-Flash-Lite",
    panelCount: 2,
    enableThinking: false,
  })

  const [panels, setPanels] = useState<PanelState[]>([
    createPanel(0),
    createPanel(1),
    createPanel(2),
    createPanel(3),
    createPanel(4),
  ])

  const abortControllersRef = useRef<Map<number, AbortController>>(new Map())

  // Keep a ref to settings so sendMessage always reads the latest
  const settingsRef = useRef(settings)
  settingsRef.current = settings

  const updatePanelCount = useCallback((count: number) => {
    setSettings((prev) => ({ ...prev, panelCount: count }))
  }, [])

  const updateApiKey = useCallback((apiKey: string) => {
    setSettings((prev) => ({ ...prev, apiKey }))
  }, [])

  const updateModel = useCallback((model: ModelId) => {
    setSettings((prev) => ({ ...prev, model }))
  }, [])

  const toggleThinking = useCallback((enabled: boolean) => {
    setSettings((prev) => ({ ...prev, enableThinking: enabled }))
  }, [])

  const updateSystemPrompt = useCallback(
    (panelId: number, prompt: string) => {
      setPanels((prev) =>
        prev.map((p) =>
          p.id === panelId ? { ...p, systemPrompt: prompt } : p
        )
      )
    },
    []
  )

  const clearAllChats = useCallback(() => {
    abortControllersRef.current.forEach((controller) => controller.abort())
    abortControllersRef.current.clear()
    setPanels((prev) =>
      prev.map((p) => ({ ...p, messages: [], isLoading: false }))
    )
  }, [])

  const sendMessage = useCallback(
    async (userMessage: string) => {
      const snap = settingsRef.current
      if (!userMessage.trim() || !snap.apiKey.trim()) return

      const userMsg: ChatMessage = {
        id: generateId(),
        role: "user",
        content: userMessage,
      }

      // Snapshot settings for the closure
      const currentSettings = { ...snap }

      // Snapshot panels for building API payloads (use the raw state)
      let currentPanelSnapshots: PanelState[] = []
      setPanels((prev) => {
        currentPanelSnapshots = prev.slice(0, currentSettings.panelCount)
        return prev.map((p, idx) =>
          idx < currentSettings.panelCount
            ? { ...p, messages: [...p.messages, userMsg], isLoading: true }
            : p
        )
      })

      // Send requests to all active panels simultaneously
      const promises = currentPanelSnapshots.map(async (panelSnapshot) => {
        const panelId = panelSnapshot.id
        const assistantMsgId = generateId()

        // Add placeholder assistant message
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
          // Build messages payload from the snapshot (before user message was added)
          const messagesForApi = [
            ...panelSnapshot.messages.map((m) => ({
              role: m.role,
              content: m.content,
            })),
            { role: "user" as const, content: userMessage },
          ]

          console.log(
            "[v0] Sending request for panel",
            panelId,
            "model:",
            currentSettings.model
          )

          const response = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              apiKey: currentSettings.apiKey,
              model: currentSettings.model,
              systemPrompt: panelSnapshot.systemPrompt,
              messages: messagesForApi,
              enableThinking: currentSettings.enableThinking,
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

          console.log("[v0] Stream started for panel", panelId)

          let accContent = ""
          let accThinking = ""

          for await (const delta of parseSSEStream(reader)) {
            accContent += delta.content
            accThinking += delta.thinking

            // Capture in local const for the closure
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

          console.log(
            "[v0] Stream complete for panel",
            panelId,
            "- content length:",
            accContent.length,
            "thinking length:",
            accThinking.length
          )

          // Mark streaming as done
          const finalContent = accContent
          const finalThinking = accThinking

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
          console.log("[v0] Stream error for panel", panelId, ":", errorMessage)

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
    updateApiKey,
    updateModel,
    updatePanelCount,
    toggleThinking,
    updateSystemPrompt,
    clearAllChats,
    sendMessage,
  }
}
