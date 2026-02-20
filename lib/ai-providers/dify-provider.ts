import { BaseProvider } from "./base"
import { ChatCompletionRequest, ProviderConfig, ProviderCredentials } from "./types"

export class DifyProvider extends BaseProvider {
    constructor(config: ProviderConfig, credentials: ProviderCredentials) {
        super(config, credentials)
    }

    async createChatCompletion(request: ChatCompletionRequest): Promise<Response> {
        // Build Dify request
        const apiKey = this.credentials.apiKey
        const baseUrl = this.credentials.baseUrl || "https://api.dify.ai/v1"

        if (!apiKey) {
            throw new Error("Missing Dify API Key")
        }

        const url = `${baseUrl}/chat-messages`

        // Prepare messages string and previous inputs if applying purely to dify format
        let query = ""
        request.messages.forEach(msg => {
            query += `${msg.role.toUpperCase()}: ${msg.content}\n\n`
        })

        if (request.systemPrompt) {
            query = `SYSTEM: ${request.systemPrompt}\n\n${query}`
        }

        const difyPayload = {
            inputs: request.difyInputs || {},
            query: request.messages[request.messages.length - 1]?.content || "",
            response_mode: request.stream ? "streaming" : "blocking",
            user: "chat-panels-user",
            files: request.files || [],
            // TODO: handle history appropriately for dify if conversation_id is tracked, 
        }

        // Use prompt engineering if we must send history in `query`, or rely on dify specific session tracking.
        // It's requested that the conversation history is kept in localstorage and Dify API /messages is NOT used to restore.
        // So we just send the full context as the query for simplicity, or we can send only the last user query.
        // Actually, if we send full history as query, it might cause issues if dify expects current user input.
        // Let's send everything inside `query`.
        difyPayload.query = query.trim()

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
                                    const chunk = {
                                        id: parsed.message_id,
                                        choices: [{
                                            delta: {
                                                content: content
                                            }
                                        }],
                                        usage: usage
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
