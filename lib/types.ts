import type { ProviderConfig } from "./ai-providers/types"

export type ModelId = string

export interface TokenUsage {
  prompt: number
  completion: number
  total: number
}

export interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  thinking?: string
  isStreaming?: boolean
  tokenUsage?: TokenUsage
}

/* ------------------------------------------------------------------ */
/*  Prompt Templates                                                   */
/* ------------------------------------------------------------------ */

export interface PromptTemplate {
  id: string
  name: string
  content: string
  createdAt: number
  updatedAt: number
}

export interface PanelState {
  id: number
  title: string
  systemPrompt: string
  messages: ChatMessage[]
  isLoading: boolean
  // Panel-specific overrides
  providerId?: string
  modelId?: string
}

export interface PlaygroundSettings {
  // Global
  panelCount: number
  enablePanelMode: boolean


  // Provider Selection
  activeProviderId: string
  activeModelId: string

  // Per-Provider Configs (Keyed by Provider ID)
  // These configs override defaults or store sensitive info like API Keys.
  providerConfigs: Record<string, {
    apiKey?: string
    baseUrl?: string
    organizationId?: string
    enabled?: boolean
    models?: { id: string; label: string; description?: string }[]
    lastFetched?: number
  }>

  // Legacy fields for backward compatibility/migration
  apiKey?: string
  model?: string
}

// Deprecated: Use registry instead. Kept empty to avoid type errors in legacy imports until fully refactored.
export const MODELS: { id: string; label: string; description: string }[] = []
