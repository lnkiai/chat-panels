"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { type PlaygroundSettings, type PanelState, type ChatMessage } from "@/lib/types"
import { getProvider, getAllProviders, PROVIDER_REGISTRY, LONGCAT_PROVIDER, DIFY_PROVIDER } from "@/lib/ai-providers/registry"
import type { ProviderConfig } from "@/lib/ai-providers/types"

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
  id?: string
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
        const msgId = parsed.id

        if (content || thinking || usage || msgId) {
          yield {
            id: msgId,
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
        const msgId = parsed.id
        if (content || thinking || usage || msgId) {
          yield {
            id: msgId,
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
  activeProviderId: DIFY_PROVIDER.id,
  activeModelId: DIFY_PROVIDER.models[0].id,
  panelCount: 2,
  enablePanelMode: false,
  providerConfigs: {},
  // Legacy
  apiKey: "",
  model: "",
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

  // Security warning check (could be extended)
  const isLocalStorageAvailable = typeof window !== "undefined"

  useEffect(() => {
    // Explicitly loading as partial and merging to ensure structure consistency
    const rawSettings = loadFromStorage<PlaygroundSettings>(
      STORAGE_KEY_SETTINGS,
      DEFAULT_SETTINGS
    )

    // Ensure merged structure has providerConfigs even if rawSettings (old cache) missed it
    const savedSettings: PlaygroundSettings = {
      ...DEFAULT_SETTINGS,
      ...rawSettings,
      providerConfigs: rawSettings.providerConfigs || {}
    }

    // Migration: If legacy settings exist (apiKey, model) but no providerConfigs, migrate them
    // This assumes the legacy settings were for Longcat
    if (savedSettings.apiKey && (!savedSettings.providerConfigs || Object.keys(savedSettings.providerConfigs).length === 0)) {
      savedSettings.providerConfigs = {
        [LONGCAT_PROVIDER.id]: { apiKey: savedSettings.apiKey }
      }
      savedSettings.activeProviderId = LONGCAT_PROVIDER.id
      // Handle migration of model name
      const provider = getProvider(savedSettings.activeProviderId)
      if (provider) {
        // If activeModelId is not valid for new provider, reset
        const modelExists = provider.models.some(m => m.id === savedSettings.activeModelId)
        if (!modelExists) {
          // If legacy model id matches one of the new models?
          // Or just force default
          savedSettings.activeModelId = provider.models[0].id
        }
      }
    }

    // Default active provider/model if missing or invalid
    if (!savedSettings.activeProviderId || !getProvider(savedSettings.activeProviderId)) {
      savedSettings.activeProviderId = LONGCAT_PROVIDER.id
      // Fallback model ID if not found
      savedSettings.activeModelId = getProvider(LONGCAT_PROVIDER.id)?.models[0].id || "gpt-4o"
    }

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

  const togglePanelMode = useCallback((enabled: boolean) => {
    setSettings((prev) => ({ ...prev, enablePanelMode: enabled }))
  }, [])

  // Legacy compatibility: Updates active provider's API key
  const updateApiKey = useCallback((apiKey: string) => {
    setSettings((prev) => {
      const providerId = prev.activeProviderId
      const currentConfigs = prev.providerConfigs || {} // Safeguard
      return {
        ...prev,
        providerConfigs: {
          ...currentConfigs,
          [providerId]: {
            ...currentConfigs[providerId],
            apiKey
          }
        },
        // Update legacy field just in case
        apiKey
      }
    })
  }, [])

  // Updates active model (must belong to active provider or be valid)
  const updateModel = useCallback((modelId: string) => {
    setSettings((prev) => ({ ...prev, activeModelId: modelId }))
  }, [])

  const updateActiveProvider = useCallback((providerId: string) => {
    const provider = getProvider(providerId)
    if (!provider) return

    setSettings((prev) => {
      const dynamicModels = prev.providerConfigs?.[providerId]?.models || []
      const activeModelId = dynamicModels.length > 0 ? dynamicModels[0].id : provider.models[0].id

      return {
        ...prev,
        activeProviderId: providerId,
        activeModelId
      }
    })
  }, [])

  // Updated to include organizationId
  const updateProviderConfig = useCallback((providerId: string, config: { apiKey?: string; baseUrl?: string; organizationId?: string; enabled?: boolean }) => {
    setSettings((prev) => {
      const currentConfigs = prev.providerConfigs || {} // Safeguard
      return {
        ...prev,
        providerConfigs: {
          ...currentConfigs,
          [providerId]: {
            ...currentConfigs[providerId],
            ...config
          }
        }
      }
    })
  }, [])

  // New action to update fetched models
  const updateProviderModels = useCallback((providerId: string, models: { id: string; label: string; description?: string }[]) => {
    setSettings((prev) => {
      const currentConfigs = prev.providerConfigs || {}

      let newActiveModelId = prev.activeModelId;
      if (prev.activeProviderId === providerId && models.length > 0) {
        newActiveModelId = models[0].id;
      }

      return {
        ...prev,
        activeModelId: newActiveModelId,
        providerConfigs: {
          ...currentConfigs,
          [providerId]: {
            ...currentConfigs[providerId],
            models,
            lastFetched: Date.now()
          }
        }
      }
    })
  }, [])

  const updatePanelTitle = useCallback(
    (panelId: number, title: string) => {
      setPanels((prev) =>
        prev.map((p) => (p.id === panelId ? { ...p, title } : p))
      )
    },
    []
  )

  // Update panel system prompt
  const updateSystemPrompt = useCallback(
    (panelId: number, prompt: string) => {
      setPanels((prev) =>
        prev.map((p) => (p.id === panelId ? { ...p, systemPrompt: prompt } : p))
      )
    },
    []
  )

  // Update panel-specific provider/model
  const updatePanelConfig = useCallback((panelId: number, config: { providerId?: string, modelId?: string, apiKey?: string, baseUrl?: string }) => {
    setPanels((prev) =>
      prev.map((p) => {
        if (p.id !== panelId) return p

        const updates: Partial<PanelState> = {}

        if (config.providerId) {
          updates.providerId = config.providerId
          // Reset model if provider changes, or ensure it's valid
          const provider = getProvider(config.providerId)
          if (provider) {
            // If modelId is not provided, default to first model of new provider
            if (!config.modelId) {
              updates.modelId = provider.models[0].id
            }
          }
        }

        if (config.modelId) {
          updates.modelId = config.modelId
        }

        if (config.apiKey !== undefined) {
          updates.apiKey = config.apiKey
        }

        if (config.baseUrl !== undefined) {
          updates.baseUrl = config.baseUrl
        }

        return { ...p, ...updates }
      })
    )
  }, [])

  const refreshDifyParameters = useCallback(async (panelId: number) => {
    const panels = panelsRef.current
    const panel = panels.find(p => p.id === panelId)
    if (!panel) return

    const providerId = panel.providerId || settingsRef.current.activeProviderId
    if (providerId !== "dify") return

    const apiKey = panel.apiKey || settingsRef.current.providerConfigs["dify"]?.apiKey
    const baseUrl = panel.baseUrl || settingsRef.current.providerConfigs["dify"]?.baseUrl || "https://api.dify.ai/v1"

    if (!apiKey) return

    try {
      const res = await fetch("/api/dify/parameters", {
        headers: {
          "x-dify-api-key": apiKey,
          "x-dify-base-url": baseUrl
        }
      })
      if (res.ok) {
        const data = await res.json()
        setPanels(prev => prev.map(p => p.id === panelId ? { ...p, difyParameters: data } : p))

        // Also update the app list in settings if this API key is already known or should be added
        setSettings(prev => {
          const difyConfig = prev.providerConfigs["dify"] || {}
          const apps = difyConfig.difyApps || []
          const existingIdx = apps.findIndex(a => a.apiKey === apiKey)

          if (existingIdx >= 0) {
            const newApps = [...apps]
            newApps[existingIdx] = { ...newApps[existingIdx], parameters: data }
            return {
              ...prev,
              providerConfigs: {
                ...prev.providerConfigs,
                dify: { ...difyConfig, difyApps: newApps }
              }
            }
          }
          return prev
        })
      }
    } catch (err) {
      console.error("Failed to fetch Dify parameters", err)
    }
  }, [])

  const registerDifyApp = useCallback(async (apiKey: string, baseUrl?: string) => {
    const effectiveBaseUrl = baseUrl || settingsRef.current.providerConfigs["dify"]?.baseUrl || "https://api.dify.ai/v1"
    if (!apiKey) return

    try {
      // 1. Fetch Info
      const infoRes = await fetch("/api/dify/info", {
        headers: {
          "x-dify-api-key": apiKey,
          "x-dify-base-url": effectiveBaseUrl
        }
      })
      if (!infoRes.ok) throw new Error("Failed to fetch Dify app info")
      const info = await infoRes.json()
      const appName = info.name || info.app_name || "Dify App"

      // 2. Fetch Params
      const paramsRes = await fetch("/api/dify/parameters", {
        headers: {
          "x-dify-api-key": apiKey,
          "x-dify-base-url": effectiveBaseUrl
        }
      })
      if (!paramsRes.ok) throw new Error("Failed to fetch Dify app parameters")
      const params = await paramsRes.json()

      // 3. Update Settings
      setSettings(prev => {
        const difyConfig = prev.providerConfigs["dify"] || {}
        const apps = difyConfig.difyApps || []
        const existingIdx = apps.findIndex(a => a.apiKey === apiKey)

        const newApp = { apiKey, name: appName, baseUrl: effectiveBaseUrl, parameters: params }
        let newApps = [...apps]
        if (existingIdx >= 0) {
          newApps[existingIdx] = newApp
        } else {
          newApps.push(newApp)
        }

        const newModels = newApps.map(app => ({
          id: app.apiKey,
          label: app.name
        }))

        return {
          ...prev,
          providerConfigs: {
            ...prev.providerConfigs,
            dify: {
              ...difyConfig,
              difyApps: newApps,
              models: newModels
            }
          }
        }
      })
    } catch (err) {
      console.error("Failed to register Dify app", err)
      throw err
    }
  }, [])

  const removeDifyApp = useCallback((apiKey: string) => {
    setSettings(prev => {
      const difyConfig = prev.providerConfigs["dify"] || {}
      const apps = difyConfig.difyApps || []
      const newApps = apps.filter(a => a.apiKey !== apiKey)

      const newModels = newApps.map(app => ({
        id: app.apiKey,
        label: app.name
      }))

      return {
        ...prev,
        providerConfigs: {
          ...prev.providerConfigs,
          dify: {
            ...difyConfig,
            difyApps: newApps,
            models: newModels
          }
        }
      }
    })
  }, [])

  const updateDifyInputs = useCallback((panelId: number, inputs: Record<string, any>) => {
    setPanels((prev) =>
      prev.map((p) =>
        p.id === panelId ? { ...p, difyInputs: { ...p.difyInputs, ...inputs } } : p
      )
    )
  }, [])

  /* ------ Delete operations ------ */

  const clearAllChats = useCallback(() => {
    abortControllersRef.current.forEach((controller) => controller.abort())
    abortControllersRef.current.clear()
    setPanels((prev) =>
      prev.map((p) => ({ ...p, messages: [], isLoading: false }))
    )
  }, [])

  const clearApiKey = useCallback(() => {
    setSettings((prev) => {
      const providerId = prev.activeProviderId
      const currentConfigs = prev.providerConfigs || {}
      return {
        ...prev,
        providerConfigs: {
          ...currentConfigs,
          [providerId]: {
            ...currentConfigs[providerId],
            apiKey: ""
          }
        },
        apiKey: ""
      }
    })
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
    async (userMessage: string, fileId?: string) => {
      const snap = settingsRef.current

      // Basic validation
      if (!userMessage.trim() && !fileId && !(window as any)._pendingFile) return

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

        // Determine effective provider and model for this panel
        let effectiveProviderId = currentSettings.activeProviderId
        let effectiveModelId = currentSettings.activeModelId

        if (currentSettings.enablePanelMode) {
          effectiveProviderId = panelSnapshot.providerId || currentSettings.activeProviderId
          effectiveModelId = panelSnapshot.modelId || currentSettings.activeModelId

          // Fallback validation: ensure model belongs to provider?
          // For now, trust the state or simple sync.
          // Ideally, if panel.providerId is set but modelId isn't, use default of that provider
          if (panelSnapshot.providerId && !panelSnapshot.modelId) {
            const p = getProvider(panelSnapshot.providerId)
            if (p) effectiveModelId = p.models[0].id
          }
        }

        // Get config for the effective provider
        const currentConfigs = currentSettings.providerConfigs || {}
        const currentProviderConfig = currentConfigs[effectiveProviderId]

        let apiKey = panelSnapshot.apiKey || currentProviderConfig?.apiKey || ""
        let baseUrl = panelSnapshot.baseUrl || currentProviderConfig?.baseUrl || ""

        // If Dify, check if modelId is an API key from difyApps
        if (effectiveProviderId === "dify" && currentProviderConfig?.difyApps) {
          const app = currentProviderConfig.difyApps.find(a => a.apiKey === effectiveModelId)
          if (app) {
            apiKey = app.apiKey
            baseUrl = app.baseUrl || baseUrl
          }
        }

        if (!apiKey) {
          // Error for this panel specifically
          setPanels((prev) =>
            prev.map((p) =>
              p.id === panelId
                ? {
                  ...p,
                  isLoading: false,
                  messages: [
                    ...p.messages,
                    {
                      id: generateId(),
                      role: "assistant",
                      content: `Error: API Key missing for provider ${effectiveProviderId}`,
                      isStreaming: false
                    }
                  ]
                }
                : p
            )
          )
          return
        }

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

          let files = undefined
          const filesToUpload = (window as any)[`_pendingFiles_${panelId}`] || []
          const fileUrlInput = document.getElementById(`dify-file-url-${panelId}`) as HTMLInputElement
          const fileUrl = fileUrlInput?.value

          if ((filesToUpload.length > 0 || fileUrl) && effectiveProviderId === "dify") {
            const apiFiles: any[] = []

            if (filesToUpload.length > 0) {
              for (const fileToUpload of filesToUpload) {
                const formData = new FormData()
                formData.append("file", fileToUpload)
                formData.append("user", "chat-panels-user")

                const uploadRes = await fetch("/api/dify/upload", {
                  method: "POST",
                  headers: {
                    "x-dify-api-key": apiKey,
                    "x-dify-base-url": baseUrl || "https://api.dify.ai/v1"
                  },
                  body: formData
                })
                if (uploadRes.ok) {
                  const uploadData = await uploadRes.json()
                  if (uploadData.id) {
                    apiFiles.push({
                      type: fileToUpload.type.startsWith("image/") ? "image" : "document",
                      transfer_method: "local_file",
                      upload_file_id: uploadData.id
                    })
                  }
                }
              }
            }

            if (fileUrl) {
              apiFiles.push({
                type: "image",
                transfer_method: "remote_url",
                url: fileUrl
              })
            }

            if (apiFiles.length > 0) {
              files = apiFiles
            }
          }

          let finalDifyInputs = { ...(panelSnapshot.difyInputs || {}) }
          if (effectiveProviderId === "dify") {
            const params = panelSnapshot.difyParameters ||
              currentProviderConfig?.difyApps?.find(a => a.apiKey === effectiveModelId)?.parameters ||
              currentProviderConfig?.difyParameters
            if (params?.user_input_form) {
              params.user_input_form.forEach((uf: any) => {
                const type = Object.keys(uf)[0]
                const field = uf[type]
                if (field && field.variable && finalDifyInputs[field.variable] === undefined) {
                  let def = field.default
                  if (def !== undefined && def !== "") {
                    finalDifyInputs[field.variable] = type === "number" ? Number(def) : (type === "checkbox" ? (def === "true" || def === true) : def)
                  } else if (field.required) {
                    if (type === "select" && Array.isArray(field.options) && field.options.length > 0) {
                      finalDifyInputs[field.variable] = field.options[0]
                    } else {
                      finalDifyInputs[field.variable] = type === "number" ? 0 : (type === "checkbox" ? false : "")
                    }
                  }
                }
              })
            }
          }

          // Send provider context to API
          const response = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              providerId: effectiveProviderId,
              providerConfig: {
                apiKey: apiKey,
                baseUrl: baseUrl, // Optional override
                organizationId: currentProviderConfig?.organizationId, // Optional
              },
              model: effectiveModelId,
              systemPrompt: panelSnapshot.systemPrompt,
              messages: messagesForApi,
              enableThinking: effectiveModelId.toLowerCase().includes("thinking"),
              files: files,
              difyInputs: finalDifyInputs
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
          let realMessageId = assistantMsgId

          for await (const delta of parseSSEStream(reader)) {
            if (delta.id) realMessageId = delta.id
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

          // Attempt to fetch suggested queries if Dify
          let suggestedQuestions = undefined
          if (effectiveProviderId === "dify" && apiKey && realMessageId) {
            try {
              const sugRes = await fetch(`/api/dify/suggested?message_id=${realMessageId}`, {
                headers: {
                  "x-dify-api-key": apiKey,
                  "x-dify-base-url": currentProviderConfig?.baseUrl || ""
                }
              })
              if (sugRes.ok) {
                const sugData = await sugRes.json()
                if (sugData.data && Array.isArray(sugData.data)) {
                  suggestedQuestions = sugData.data
                }
              }
            } catch (e) { }
          }

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
                        id: realMessageId, // optionally, update local message id to real one
                        content: finalContent,
                        thinking: finalThinking || undefined,
                        isStreaming: false,
                        tokenUsage: finalUsage,
                        suggestedQuestions
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

      // Cleanup pending file
      if ((window as any)._pendingFile) {
        delete (window as any)._pendingFile
      }
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
    updateApiKey, // Legacy/Current Provider
    updateModel,
    updateActiveProvider,
    updateProviderConfig,
    updateProviderModels,
    updatePanelCount,
    updatePanelTitle,
    updateSystemPrompt,
    togglePanelMode,
    updatePanelConfig,
    updateDifyInputs,
    refreshDifyParameters,
    registerDifyApp,
    removeDifyApp,
    clearAllChats,
    clearApiKey,
    resetSystemPrompts,
    clearEverything,
    sendMessage,
    isLocalStorageAvailable
  }
}
