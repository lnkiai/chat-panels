import { BaseProvider } from "./base"
import { ChatCompletionRequest } from "./types"

export class OpenAICompatibleProvider extends BaseProvider {
    async createChatCompletion(request: ChatCompletionRequest): Promise<Response> {
        const baseUrl = this.baseUrl?.replace(/\/+$/, "")
        const url = `${baseUrl}/chat/completions`

        // Prepare messages
        const messages = [
            ...(request.systemPrompt ? [{ role: "system", content: request.systemPrompt }] : []),
            ...request.messages
        ]

        const body: Record<string, any> = {
            model: request.model,
            messages,
            stream: request.stream ?? true,
            temperature: request.temperature ?? 0.7,
            max_tokens: request.maxTokens ?? 4096,
        }

        // Handle thinking params if applicable (mostly for Longcat but generic enough)
        if (request.enableThinking && request.model.toLowerCase().includes("thinking")) {
            body.enable_thinking = true
            body.thinking_budget = 2048
        }

        const headers: Record<string, string> = {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${this.apiKey}`,
        }

        if (this.credentials.organizationId) {
            headers["OpenAI-Organization"] = this.credentials.organizationId
        }

        try {
            const response = await fetch(url, {
                method: "POST",
                headers,
                body: JSON.stringify(body),
            })

            if (!response.ok) {
                // Try to parse error
                const text = await response.text()
                let errorMessage = `API Error: ${response.status} ${response.statusText}`
                try {
                    const data = JSON.parse(text)
                    errorMessage = data.error?.message || errorMessage
                } catch {
                    errorMessage += ` - ${text}`
                }
                throw new Error(errorMessage)
            }

            return response
        } catch (error) {
            console.error(`[${this.id}] Chat completion error:`, error)
            throw error
        }
    }
}
