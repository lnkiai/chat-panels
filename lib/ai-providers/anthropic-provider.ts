import { BaseProvider } from "./base"
import { ChatCompletionRequest } from "./types"

export class AnthropicProvider extends BaseProvider {
    async createChatCompletion(request: ChatCompletionRequest): Promise<Response> {
        const apiKey = this.credentials.apiKey
        const baseUrl = (this.credentials.baseUrl?.trim() || "https://api.anthropic.com/v1").replace(/\/+$/, "")

        if (!apiKey) {
            throw new Error("Missing Anthropic API Key")
        }

        // Separate system prompt from messages
        const userMessages = request.messages.filter(m => m.role !== "system")

        // Anthropic uses `contents` array with `role: user/assistant`
        const anthropicMessages = userMessages.map(m => ({
            role: m.role === "assistant" ? "assistant" : "user",
            content: m.content,
        }))

        const body: Record<string, any> = {
            model: request.model,
            max_tokens: request.maxTokens ?? 4096,
            messages: anthropicMessages,
            stream: request.stream ?? true,
        }

        // System prompt is a top-level field in Anthropic API
        if (request.systemPrompt) {
            body.system = request.systemPrompt
        }

        const response = await fetch(`${baseUrl}/messages`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": apiKey,
                "anthropic-version": "2023-06-01",
            },
            body: JSON.stringify(body),
        })

        if (!response.ok) {
            let errorMessage = `Anthropic API Error: ${response.status}`
            try {
                const err = await response.json()
                errorMessage = err.error?.message || errorMessage
            } catch {
                errorMessage = (await response.text()) || errorMessage
            }
            throw new Error(errorMessage)
        }

        if (request.stream && response.body) {
            return this.transformAnthropicStream(response.body)
        }

        // Non-streaming: parse and re-wrap as OpenAI-compatible
        const data = await response.json()
        const content = data.content?.[0]?.text ?? ""
        const usage = data.usage
            ? {
                prompt_tokens: data.usage.input_tokens ?? 0,
                completion_tokens: data.usage.output_tokens ?? 0,
                total_tokens: (data.usage.input_tokens ?? 0) + (data.usage.output_tokens ?? 0),
            }
            : undefined

        const compat = {
            id: data.id,
            object: "chat.completion",
            choices: [{ message: { role: "assistant", content }, finish_reason: data.stop_reason }],
            usage,
        }
        return new Response(JSON.stringify(compat), {
            headers: { "Content-Type": "application/json" },
        })
    }

    /**
     * Anthropic SSE → OpenAI-compatible SSE transformer
     *
     * Anthropic events:
     *   content_block_delta  →  delta.type = "text_delta", delta.text = "..."
     *   message_delta        →  usage.output_tokens
     *   message_start        →  message.usage.input_tokens
     */
    private transformAnthropicStream(body: ReadableStream<Uint8Array>): Response {
        const decoder = new TextDecoder()
        const encoder = new TextEncoder()

        const stream = new ReadableStream({
            async start(controller) {
                const reader = body.getReader()
                let buffer = ""
                let messageId = ""
                let inputTokens = 0
                let eventType = ""

                try {
                    while (true) {
                        const { done, value } = await reader.read()
                        if (done) break

                        buffer += decoder.decode(value, { stream: true })
                        const lines = buffer.split("\n")
                        buffer = lines.pop() ?? ""

                        for (const line of lines) {
                            const trimmed = line.trim()

                            if (trimmed.startsWith("event:")) {
                                eventType = trimmed.slice(6).trim()
                                continue
                            }

                            if (!trimmed.startsWith("data:")) continue
                            const dataStr = trimmed.slice(5).trim()
                            if (!dataStr || dataStr === "[DONE]") continue

                            try {
                                const parsed = JSON.parse(dataStr)

                                if (eventType === "message_start") {
                                    messageId = parsed.message?.id ?? ""
                                    inputTokens = parsed.message?.usage?.input_tokens ?? 0
                                }

                                if (eventType === "content_block_delta") {
                                    const text = parsed.delta?.text || parsed.delta?.thinking || ""
                                    if (text) {
                                        const chunk = {
                                            id: messageId,
                                            choices: [{ delta: { content: text } }],
                                        }
                                        controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`))
                                    }
                                }

                                if (eventType === "message_delta") {
                                    const outputTokens = parsed.usage?.output_tokens ?? 0
                                    if (outputTokens > 0) {
                                        const usageChunk = {
                                            id: messageId,
                                            choices: [{ delta: { content: "" } }],
                                            usage: {
                                                prompt_tokens: inputTokens,
                                                completion_tokens: outputTokens,
                                                total_tokens: inputTokens + outputTokens,
                                            },
                                        }
                                        controller.enqueue(encoder.encode(`data: ${JSON.stringify(usageChunk)}\n\n`))
                                    }
                                }

                                if (eventType === "message_stop") {
                                    controller.enqueue(encoder.encode("data: [DONE]\n\n"))
                                }
                            } catch {
                                // ignore parse errors
                            }
                        }
                    }
                } finally {
                    controller.close()
                    reader.releaseLock()
                }
            },
        })

        return new Response(stream, {
            headers: {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
            },
        })
    }
}
