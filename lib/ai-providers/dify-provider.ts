import { BaseProvider } from "./base"
import { ChatCompletionRequest, ProviderConfig, ProviderCredentials } from "./types"

export class DifyProvider extends BaseProvider {
    constructor(config: ProviderConfig, credentials: ProviderCredentials) {
        super(config, credentials)
    }

    async createChatCompletion(request: ChatCompletionRequest): Promise<Response> {
        // Build Dify request
        const apiKey = this.credentials.apiKey
        let baseUrl = this.credentials.baseUrl || "https://api.dify.ai/v1"
        if (baseUrl.endsWith('/')) {
            baseUrl = baseUrl.slice(0, -1)
        }

        if (!apiKey) {
            throw new Error("Missing Dify API Key")
        }

        const url = `${baseUrl}/chat-messages`

        const difyPayload: any = {
            inputs: request.difyInputs || {},
            query: request.messages[request.messages.length - 1]?.content || "",
            response_mode: request.stream ? "streaming" : "blocking",
            user: "chat-panels-user",
            files: request.files || [],
        }

        if (request.conversationId) {
            difyPayload.conversation_id = request.conversationId
        }

        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(difyPayload)
        })

        if (!response.ok) {
            let errorMessage = `Provider error: ${response.status}`
            try {
                const err = await response.json()
                errorMessage = err.message || err.error?.message || errorMessage
            } catch {
                errorMessage = await response.text() || errorMessage
            }
            throw new Error(errorMessage)
        }

        if (request.stream && response.body) {
            return this.transformDifyStream(response.body)
        }

        return response
    }

    private transformDifyStream(body: ReadableStream<Uint8Array>): Response {
        const decoder = new TextDecoder()
        const encoder = new TextEncoder()

        const stream = new ReadableStream({
            async start(controller) {
                const reader = body.getReader()
                let buffer = ""

                try {
                    while (true) {
                        const { done, value } = await reader.read()
                        if (done) break

                        buffer += decoder.decode(value, { stream: true })
                        const lines = buffer.split("\n")
                        buffer = lines.pop() || ""

                        for (const line of lines) {
                            const trimmedLine = line.trim()
                            if (!trimmedLine || !trimmedLine.startsWith("data: ")) continue

                            const dataStr = trimmedLine.slice(6)
                            if (dataStr === "[DONE]") {
                                controller.enqueue(encoder.encode("data: [DONE]\n\n"))
                                continue
                            }

                            try {
                                const parsed = JSON.parse(dataStr)
                                const event = parsed.event

                                let content = ""
                                let usage = undefined

                                if (event === "message" || event === "agent_message") {
                                    content = parsed.answer || ""
                                } else if (event === "message_end") {
                                    // extract metadata
                                    if (parsed.metadata?.usage) {
                                        usage = {
                                            prompt_tokens: parsed.metadata.usage.prompt_tokens || 0,
                                            completion_tokens: parsed.metadata.usage.completion_tokens || 0,
                                            total_tokens: parsed.metadata.usage.total_tokens || 0
                                        }
                                    }
                                }

                                if (content || usage) {
                                    const chunk: any = {
                                        id: parsed.message_id,
                                        choices: [{
                                            delta: {
                                                content: content
                                            }
                                        }],
                                        usage: usage
                                    }
                                    if (parsed.conversation_id) {
                                        chunk.conversation_id = parsed.conversation_id
                                    }
                                    controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`))
                                }

                            } catch (e) {
                                // ignore parse errors for partial chunks or non-json data
                            }
                        }
                    }
                    if (buffer.trim() === "data: [DONE]") {
                        controller.enqueue(encoder.encode("data: [DONE]\n\n"))
                    }
                } finally {
                    controller.close()
                    reader.releaseLock()
                }
            }
        })

        return new Response(stream, {
            headers: {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache",
                "Connection": "keep-alive"
            }
        })
    }
}
