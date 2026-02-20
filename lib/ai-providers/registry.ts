import { ProviderConfig, ProviderCredentials } from "./types"
import { BaseProvider } from "./base"
import { OpenAICompatibleProvider } from "./openai-compatible"
import { DifyProvider } from "./dify-provider"

// Import definitions
import { LONGCAT_PROVIDER } from "./definitions/longcat"
import { OPENAI_PROVIDER } from "./definitions/openai"
import { ANTHROPIC_PROVIDER } from "./definitions/anthropic"
import { GEMINI_PROVIDER } from "./definitions/gemini"
import { DIFY_PROVIDER } from "./definitions/dify"
import { OPENROUTER_PROVIDER } from "./definitions/openrouter"

// Export definitions
export {
    LONGCAT_PROVIDER,
    OPENAI_PROVIDER,
    ANTHROPIC_PROVIDER,
    GEMINI_PROVIDER,
    DIFY_PROVIDER,
    OPENROUTER_PROVIDER
}

export const PROVIDER_REGISTRY: Record<string, ProviderConfig> = {
    [DIFY_PROVIDER.id]: DIFY_PROVIDER,
    [OPENAI_PROVIDER.id]: OPENAI_PROVIDER,
    [GEMINI_PROVIDER.id]: GEMINI_PROVIDER,
    [ANTHROPIC_PROVIDER.id]: ANTHROPIC_PROVIDER,
    [OPENROUTER_PROVIDER.id]: OPENROUTER_PROVIDER,
    [LONGCAT_PROVIDER.id]: LONGCAT_PROVIDER,
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
        case "dify":
            return new DifyProvider(providerConfig, credentials)
        // For now, treat others as compatible or throw error until implemented
        case "anthropic":
        case "gemini":
            // TODO: Implement specific providers. For now, try to use OpenAI compatible if feasible, or throw clearly.
            // Given the request is just to "show" them, we can throw here.
            throw new Error(`Provider implementation for ${providerConfig.type} is not yet available.`)
        default:
            throw new Error(`Unsupported provider type: ${providerConfig.type}`)
    }
}
