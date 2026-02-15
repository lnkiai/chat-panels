import { ProviderConfig } from "../types"

export const ANTHROPIC_PROVIDER: ProviderConfig = {
    id: "anthropic",
    name: "Anthropic",
    type: "anthropic", // Will need specific implementation later
    iconPath: "/providers/anthropic.svg",
    description: "Claude models known for safety and reasoning.",
    defaultBaseUrl: "https://api.anthropic.com/v1",
    models: [
        { id: "claude-3-5-sonnet-20240620", label: "Claude 3.5 Sonnet", description: "Balanced model" },
        { id: "claude-3-7-sonnet-20250219", label: "Claude 3.7 Sonnet", description: "Next-gen balanced" },
        { id: "claude-opus-4-20250514", label: "Claude Opus 4", description: "Flagship model" },
        { id: "claude-sonnet-4-20250514", label: "Claude Sonnet 4", description: "Next-gen balanced" },
        { id: "claude-3-5-haiku-20241022", label: "Claude 3.5 Haiku", description: "Fastest model" },
    ]
}
