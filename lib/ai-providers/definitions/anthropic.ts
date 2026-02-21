import { ProviderConfig } from "../types"

export const ANTHROPIC_PROVIDER: ProviderConfig = {
    id: "anthropic",
    name: "Anthropic",
    type: "anthropic",
    iconPath: "/providers/anthropic.svg",
    description: "Claude models known for safety and reasoning.",
    defaultBaseUrl: "https://api.anthropic.com/v1",
    models: [
        { id: "claude-sonnet-4-6", label: "Claude Sonnet 4.6", description: "Latest balanced model · fast & capable" },
        { id: "claude-opus-4-6", label: "Claude Opus 4.6", description: "Flagship · best for complex tasks" },
        { id: "claude-haiku-4-5-20251001", label: "Claude Haiku 4.5", description: "Fastest & most affordable" },
        { id: "claude-3-7-sonnet-20250219", label: "Claude 3.7 Sonnet", description: "Extended thinking model" },
        { id: "claude-3-5-sonnet-20241022", label: "Claude 3.5 Sonnet", description: "Stable high-performance model" },
    ]
}
