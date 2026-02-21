import { ProviderConfig } from "../types"

export const OPENROUTER_PROVIDER: ProviderConfig = {
    id: "openrouter",
    name: "OpenRouter",
    type: "openai_compatible",
    iconPath: "/providers/openrouter.svg",
    description: "Unified API for 400+ models from all providers.",
    defaultBaseUrl: "https://openrouter.ai/api/v1",
    models: [
        { id: "anthropic/claude-sonnet-4-6", label: "Claude Sonnet 4.6", description: "Latest Anthropic model via OpenRouter" },
        { id: "google/gemini-2.5-pro", label: "Gemini 2.5 Pro", description: "Latest Google model via OpenRouter" },
        { id: "google/gemini-2.5-flash", label: "Gemini 2.5 Flash", description: "Fast Gemini via OpenRouter" },
        { id: "openai/gpt-4o", label: "GPT-4o", description: "OpenAI flagship via OpenRouter" },
        { id: "openai/o3-mini", label: "o3-mini", description: "OpenAI reasoning model via OpenRouter" },
        { id: "deepseek/deepseek-r1", label: "DeepSeek R1", description: "Open-source reasoning model" },
        { id: "meta-llama/llama-3.3-70b-instruct", label: "Llama 3.3 70B", description: "Meta open-source model" },
        { id: "mistralai/mistral-large", label: "Mistral Large", description: "Mistral flagship model" },
    ]
}
