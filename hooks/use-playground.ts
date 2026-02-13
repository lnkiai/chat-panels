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
  ])

  const abortControllersRef = useRef<Map<number, AbortController>>(new Map())

  // Ensure panel count matches settings
  const updatePanelCount = useCallback((count: number) => {
    setSettings((prev) => ({ ...prev, panelCount: count }))
    setPanels((prev) => {
      if (count > prev.length) {
        const newPanels = [...prev]
        for (let i = prev.length; i < count; i++) {
          newPanels.push(createPanel(i))
        }
        return newPanels
      }
      return prev.slice(0, count)
    })
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
        prev.map((p) => (p.id === panelId ? { ...p, systemPrompt: prompt } : p))
      )
    },
    []
  )

  const clearAllChats = useCallback(() => {
    // Abort all ongoing requests
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

      // Add user message to all active panels and set loading
      setPanels((prev) =>
        prev.map((p) => ({
          ...p,
          messages: [...p.messages, userMsg],
          isLoading: true,
        }))
      )

      // Send requests to all active panels simultaneously
      const activePanels = panels.slice(0, settings.panelCount)

      const promises = activePanels.map(async (panel) => {
        const assistantMsgId = generateId()

        // Add placeholder assistant message
        setPanels((prev) =>
          prev.map((p) =>
            p.id === panel.id
              ? {
                  ...p,
                  messages: [
                    ...p.messages,
                    userMsg,
                    {
                      id: assistantMsgId,
                      role: "assistant",
                      content: "",
                      thinking: "",
                      isStreaming: true,
                    },
                  ].filter(
                    (msg, idx, arr) =>
                      arr.findIndex((m) => m.id === msg.id) === idx
                  ),
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

          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            const chunk = decoder.decode(value, { stream: true })
            const lines = chunk.split("\n")

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const data = line.slice(6)
                if (data === "[DONE]") continue

                try {
                  const parsed = JSON.parse(data)
                  if (parsed.thinking) {
                    accumulatedThinking += parsed.thinking
                  }
                  if (parsed.content) {
                    accumulatedContent += parsed.content
                  }
                  if (parsed.error) {
                    accumulatedContent = `Error: ${parsed.error}`
                  }
                } catch {
                  // Skip malformed JSON
                }
              }
            }

            // Update the assistant message with accumulated content
            setPanels((prev) =>
              prev.map((p) =>
                p.id === panel.id
                  ? {
                      ...p,
                      messages: p.messages.map((m) =>
                        m.id === assistantMsgId
                          ? {
                              ...m,
                              content: accumulatedContent,
                              thinking: accumulatedThinking || undefined,
                              isStreaming: true,
                            }
                          : m
                      ),
                    }
                  : p
              )
            )
          }

          // Mark streaming as complete
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
                            content: accumulatedContent,
                            thinking: accumulatedThinking || undefined,
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
