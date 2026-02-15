import { ProviderConfig } from "../types"

export const OPENROUTER_PROVIDER: ProviderConfig = {
    id: "openrouter",
    name: "OpenRouter",
    type: "openai_compatible",
    iconPath: "/providers/openrouter.svg",
    description: "Unified API for all LLMs.",
    defaultBaseUrl: "https://openrouter.ai/api/v1",
    models: [
        { id: "openai/gpt-4o", label: "GPT-4o (OpenAI)", description: "Multimodal flagship" },
        { id: "anthropic/claude-3-opus", label: "Claude 3 Opus", description: "High reasoning" },
        { id: "google/gemini-pro-1.5", label: "Gemini 1.5 Pro", description: "Long context" },
        { id: "meta-llama/llama-3-70b-instruct", label: "Llama 3 70B", description: "Open Source" },
        { id: "mistralai/mixtral-8x22b-instruct", label: "Mixtral 8x22B", description: "High performance open model" },
    ]
}
