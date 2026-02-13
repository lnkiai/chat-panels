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
      if (!userMessage.trim() || !settings.apiKey.trim()) return

      const userMsg: ChatMessage = {
        id: generateId(),
        role: "user",
        content: userMessage,
      }

      // Snapshot the current panels for building API payloads
      const currentPanels = panels.slice(0, settings.panelCount)

      // Add user message to all active panels and set loading
      setPanels((prev) =>
        prev.map((p, idx) =>
          idx < settings.panelCount
            ? { ...p, messages: [...p.messages, userMsg], isLoading: true }
            : p
        )
      )

      // Send requests to all active panels simultaneously
      const promises = currentPanels.map(async (panel) => {
        const assistantMsgId = generateId()

        // Add placeholder assistant message
        setPanels((prev) =>
          prev.map((p) =>
            p.id === panel.id
              ? {
                  ...p,
                  messages: [
                    ...p.messages.filter((m) => m.id !== userMsg.id),
                    userMsg,
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
        abortControllersRef.current.set(panel.id, abortController)

        try {
          const messagesForApi = [
            ...panel.messages.map((m) => ({
              role: m.role,
              content: m.content,
            })),
            { role: "user" as const, content: userMessage },
          ]

          const response = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              apiKey: settings.apiKey,
              model: settings.model,
              systemPrompt: panel.systemPrompt,
              messages: messagesForApi,
              enableThinking: settings.enableThinking,
            }),
            signal: abortController.signal,
          })

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            throw new Error(
              errorData.error || `API error: ${response.status}`
            )
          }

          const reader = response.body?.getReader()
          if (!reader) throw new Error("No response body")

          const decoder = new TextDecoder()
          let accumulatedContent = ""
          let accumulatedThinking = ""
          let buffer = ""

          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            buffer += decoder.decode(value, { stream: true })

            // SSE lines are separated by \n\n; individual lines by \n
            // Process complete lines only, keep partial last line in buffer
            const lines = buffer.split("\n")
            // The last element might be incomplete, keep it in buffer
            buffer = lines.pop() || ""

            for (const line of lines) {
              const trimmed = line.trim()
              if (!trimmed) continue

              if (trimmed === "data: [DONE]") {
                continue
              }

              if (trimmed.startsWith("data: ")) {
                const jsonStr = trimmed.slice(6).trim()
                if (!jsonStr) continue

                try {
                  const parsed = JSON.parse(jsonStr)
                  const choice = parsed.choices?.[0]

                  if (choice?.delta) {
                    const delta = choice.delta

                    // Longcat OpenAI-compatible format: delta.content for text, delta.thinking for thinking
                    if (delta.content != null && delta.content !== "") {
                      accumulatedContent += delta.content
                    }
                    if (delta.thinking != null && delta.thinking !== "") {
                      accumulatedThinking += delta.thinking
                    }
                  }
                } catch {
                  // Skip malformed JSON chunks
                }
              }
            }

            // Update the assistant message with accumulated content
            const contentSnapshot = accumulatedContent
            const thinkingSnapshot = accumulatedThinking

            setPanels((prev) =>
              prev.map((p) =>
                p.id === panel.id
                  ? {
                      ...p,
                      messages: p.messages.map((m) =>
                        m.id === assistantMsgId
                          ? {
                              ...m,
                              content: contentSnapshot,
                              thinking: thinkingSnapshot || undefined,
                              isStreaming: true,
                            }
                          : m
                      ),
                    }
                  : p
              )
            )
          }

          // Process any remaining buffer
          if (buffer.trim()) {
            const trimmed = buffer.trim()
            if (trimmed.startsWith("data: ") && trimmed !== "data: [DONE]") {
              const jsonStr = trimmed.slice(6).trim()
              try {
                const parsed = JSON.parse(jsonStr)
                const choice = parsed.choices?.[0]
                if (choice?.delta) {
                  if (choice.delta.content) {
                    accumulatedContent += choice.delta.content
                  }
                  if (choice.delta.thinking) {
                    accumulatedThinking += choice.delta.thinking
                  }
                }
              } catch {
                // ignore
              }
            }
          }

          // Mark streaming as complete
          const finalContent = accumulatedContent
          const finalThinking = accumulatedThinking

          setPanels((prev) =>
            prev.map((p) =>
              p.id === panel.id
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

          setPanels((prev) =>
            prev.map((p) =>
              p.id === panel.id
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
          abortControllersRef.current.delete(panel.id)
        }
      })

      await Promise.allSettled(promises)
    },
    [panels, settings]
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
