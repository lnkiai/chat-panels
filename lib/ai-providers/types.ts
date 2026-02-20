export interface AIModel {
    id: string
    label: string
    description?: string
}

export interface ProviderConfig {
    id: string
    name: string
    type: "openai_compatible" | "anthropic" | "gemini" | "dify"
    iconPath: string
    description?: string
    defaultBaseUrl?: string
    models: AIModel[]

    // Is this provider enabled by default in the registry?
    isEnabled?: boolean
}

export interface ProviderCredentials {
    apiKey?: string
    baseUrl?: string
    organizationId?: string
}

export interface ChatCompletionRequest {
    model: string
    messages: { role: string; content: string }[]
    systemPrompt?: string
    temperature?: number
    maxTokens?: number
    stream?: boolean
    enableThinking?: boolean
    files?: { type: string; transfer_method: string; url?: string; upload_file_id?: string }[]
    difyInputs?: Record<string, any>
}
