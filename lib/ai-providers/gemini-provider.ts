import { BaseProvider } from "./base"
import { ChatCompletionRequest } from "./types"

export class GeminiProvider extends BaseProvider {
    async createChatCompletion(request: ChatCompletionRequest): Promise<Response> {
        const apiKey = this.credentials.apiKey
        const baseUrl = (this.credentials.baseUrl?.trim() || "https://generativelanguage.googleapis.com/v1beta").replace(/\/+$/, "")

        if (!apiKey) {
            throw new Error("Missing Gemini API Key")
        }

        // Separate system prompt from messages
        const chatMessages = request.messages.filter(m => m.role !== "system")

        // Gemini uses `contents` array with `role: user/model`
        const contents = chatMessages.map(m => ({
            role: m.role === "assistant" ? "model" : "user",
            parts: [{ text: m.content }],
        }))

        const body: Record<string, any> = {
            contents,
        }

        // System instruction is a separate top-level field
        if (request.systemPrompt) {
            body.systemInstruction = {
                parts: [{ text: request.systemPrompt }],
            }
        }

        // Generation config
        body.generationConfig = {
            maxOutputTokens: request.maxTokens ?? 4096,
            temperature: request.temperature ?? 0.7,
        }

        const useStream = request.stream ?? true
        const endpoint = useStream
            ? `${baseUrl}/models/${request.model}:streamGenerateContent?key=${apiKey}&alt=sse`
            : `${baseUrl}/models/${request.model}:generateContent?key=${apiKey}`

        const response = await fetch(endpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        })

        if (!response.ok) {
            let errorMessage = `Gemini API Error: ${response.status}`
            try {
                const err = await response.json()
                errorMessage = err.error?.message || errorMessage
            } catch {
                errorMessage = (await response.text()) || errorMessage
            }
            throw new Error(errorMessage)
        }

        if (useStream && response.body) {
            return this.transformGeminiStream(response.body)
        }

        // Non-streaming response
        const data = await response.json()
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? ""
        const usageMeta = data.usageMetadata
        const usage = usageMeta
            ? {
                prompt_tokens: usageMeta.promptTokenCount ?? 0,
                completion_tokens: usageMeta.candidatesTokenCount ?? 0,
                total_tokens: usageMeta.totalTokenCount ?? 0,
            }
            : undefined

        const compat = {
            id: `gemini-${Date.now()}`,
            object: "chat.completion",
            choices: [{ message: { role: "assistant", content: text }, finish_reason: "stop" }],
            usage,
        }
        return new Response(JSON.stringify(compat), {
            headers: { "Content-Type": "application/json" },
        })
    }

    /**
     * Gemini SSE (alt=sse) → OpenAI-compatible SSE transformer
     *
     * Gemini streaming returns SSE lines where each `data:` contains a
     * full GenerateContentResponse JSON chunk:
     * {
     *   candidates: [{ content: { parts: [{ text: "..." }], role: "model" } }],
     *   usageMetadata: { promptTokenCount, candidatesTokenCount, totalTokenCount }
     * }
     */
    private transformGeminiStream(body: ReadableStream<Uint8Array>): Response {
        const decoder = new TextDecoder()
        const encoder = new TextEncoder()

        const stream = new ReadableStream({
            async start(controller) {
                const reader = body.getReader()
                let buffer = ""
                const syntheticId = `gemini-${Date.now()}`

                try {
                    while (true) {
                        const { done, value } = await reader.read()
                        if (done) break

                        buffer += decoder.decode(value, { stream: true })
                        const lines = buffer.split("\n")
                        buffer = lines.pop() ?? ""

                        for (const line of lines) {
                            const trimmed = line.trim()
                            if (!trimmed.startsWith("data:")) continue

                            const dataStr = trimmed.slice(5).trim()
                            if (!dataStr || dataStr === "[DONE]") continue

                            try {
                                const parsed = JSON.parse(dataStr)
                                const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text ?? ""
                                const usageMeta = parsed.usageMetadata
                                const finishReason = parsed.candidates?.[0]?.finishReason

                                if (text) {
                                    const chunk: any = {
                                        id: syntheticId,
                                        choices: [{ delta: { content: text } }],
                                    }
                                    if (usageMeta) {
                                        chunk.usage = {
                                            prompt_tokens: usageMeta.promptTokenCount ?? 0,
                                            completion_tokens: usageMeta.candidatesTokenCount ?? 0,
                                            total_tokens: usageMeta.totalTokenCount ?? 0,
                                        }
                                    }
                                    controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`))
                                }

                                // Final chunk signals end
                                if (finishReason === "STOP" || finishReason === "MAX_TOKENS") {
                                    controller.enqueue(encoder.encode("data: [DONE]\n\n"))
                                }
                            } catch {
                                // ignore parse errors
                            }
                        }
                    }

                    // Ensure stream termination
                    controller.enqueue(encoder.encode("data: [DONE]\n\n"))
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
