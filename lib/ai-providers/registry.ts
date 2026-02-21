import { ProviderConfig, ProviderCredentials } from "./types"
import { BaseProvider } from "./base"
import { OpenAICompatibleProvider } from "./openai-compatible"
import { DifyProvider } from "./dify-provider"
import { AnthropicProvider } from "./anthropic-provider"
import { GeminiProvider } from "./gemini-provider"

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
        case "anthropic":
            return new AnthropicProvider(providerConfig, credentials)
        case "gemini":
            return new GeminiProvider(providerConfig, credentials)
        default:
            throw new Error(`Unsupported provider type: ${providerConfig.type}`)
    }
}
