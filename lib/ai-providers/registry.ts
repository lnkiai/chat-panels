import { ProviderConfig, ProviderCredentials } from "./types"
import { BaseProvider } from "./base"
import { OpenAICompatibleProvider } from "./openai-compatible"

// Import definitions
import { LONGCAT_PROVIDER } from "./definitions/longcat"
import { OPENAI_PROVIDER } from "./definitions/openai"
import { ANTHROPIC_PROVIDER } from "./definitions/anthropic"
import { GEMINI_PROVIDER } from "./definitions/gemini"
import { DEEPSEEK_PROVIDER } from "./definitions/deepseek"
import { OPENROUTER_PROVIDER } from "./definitions/openrouter"

// Export definitions
export {
    LONGCAT_PROVIDER,
    OPENAI_PROVIDER,
    ANTHROPIC_PROVIDER,
    GEMINI_PROVIDER,
    DEEPSEEK_PROVIDER,
    OPENROUTER_PROVIDER
}

// Provider Registry Map
export const PROVIDER_REGISTRY: Record<string, ProviderConfig> = {
    [LONGCAT_PROVIDER.id]: LONGCAT_PROVIDER,
    [OPENAI_PROVIDER.id]: OPENAI_PROVIDER,
    [ANTHROPIC_PROVIDER.id]: ANTHROPIC_PROVIDER,
    [GEMINI_PROVIDER.id]: GEMINI_PROVIDER,
    [DEEPSEEK_PROVIDER.id]: DEEPSEEK_PROVIDER,
    [OPENROUTER_PROVIDER.id]: OPENROUTER_PROVIDER,
}

export function getAllProviders(): ProviderConfig[] {
    return Object.values(PROVIDER_REGISTRY)
}

export function getProvider(id: string): ProviderConfig | undefined {
    return PROVIDER_REGISTRY[id]
}

export function createProviderInstance(
    providerConfig: ProviderConfig,
    credentials: ProviderCredentials
): BaseProvider {
    switch (providerConfig.type) {
        case "openai_compatible":
            return new OpenAICompatibleProvider(providerConfig, credentials)
        // For now, treat others as compatible or throw error until implemented
        case "anthropic":
        case "gemini":
        case "google":
            // TODO: Implement specific providers. For now, try to use OpenAI compatible if feasible, or throw clearly.
            // Given the request is just to "show" them, we can throw here.
            throw new Error(`Provider implementation for ${providerConfig.type} is not yet available.`)
        default:
            throw new Error(`Unsupported provider type: ${providerConfig.type}`)
    }
}
