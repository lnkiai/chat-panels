import { ProviderConfig, ProviderCredentials, ChatCompletionRequest } from "./types"

export abstract class BaseProvider {
    constructor(
        public readonly config: ProviderConfig,
        protected readonly credentials: ProviderCredentials
    ) { }

    get id() {
        return this.config.id
    }

    get baseUrl() {
        return this.credentials.baseUrl || this.config.defaultBaseUrl
    }

    get apiKey() {
        return this.credentials.apiKey
    }

    abstract createChatCompletion(request: ChatCompletionRequest): Promise<Response>
}
