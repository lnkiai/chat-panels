export type ModelId =
  | "LongCat-Flash-Lite"
  | "LongCat-Flash-Chat"
  | "LongCat-Flash-Thinking-2601"

export interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  thinking?: string
  isStreaming?: boolean
}

export interface PanelState {
  id: number
  title: string
  systemPrompt: string
  messages: ChatMessage[]
  isLoading: boolean
}

export interface PlaygroundSettings {
  apiKey: string
  model: ModelId
  panelCount: number
  enableThinking: boolean
}

export const MODELS: { id: ModelId; label: string; description: string }[] = [
  {
    id: "LongCat-Flash-Lite",
    label: "Flash-Lite",
    description: "High-speed / Lightweight / 320K tokens",
  },
  {
    id: "LongCat-Flash-Chat",
    label: "Flash-Chat",
    description: "General purpose / 256K tokens",
  },
  {
    id: "LongCat-Flash-Thinking-2601",
    label: "Flash-Thinking-2601",
    description: "Deep reasoning / Agent / 256K tokens",
  },
]

export const isThinkingModel = (model: ModelId): boolean =>
  model === "LongCat-Flash-Thinking-2601"
