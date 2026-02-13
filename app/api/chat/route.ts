import { NextRequest } from "next/server"

const LONGCAT_API_URL = "https://api.longcat.chat/openai/v1/chat/completions"

interface ChatRequestBody {
  apiKey: string
  model: string
  systemPrompt: string
  messages: { role: string; content: string }[]
  enableThinking: boolean
}

export async function POST(req: NextRequest) {
  try {
    const body: ChatRequestBody = await req.json()
    const { apiKey, model, systemPrompt, messages, enableThinking } = body

    if (!apiKey) {
      return Response.json({ error: "API key is required" }, { status: 400 })
    }

    if (!messages || messages.length === 0) {
      return Response.json({ error: "Messages are required" }, { status: 400 })
    }

    // Build messages array with system prompt
    const apiMessages = [
      { role: "system", content: systemPrompt || "You are a helpful assistant." },
      ...messages,
    ]

    // Build request body
    const requestBody: Record<string, unknown> = {
      model,
      messages: apiMessages,
      stream: true,
      max_tokens: 4096,
      temperature: 0.7,
    }

    // Only add thinking params for thinking models
    if (enableThinking && model.includes("Thinking")) {
      requestBody.enable_thinking = true
      requestBody.thinking_budget = 2048
    }

    const response = await fetch(LONGCAT_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      const errorMessage =
        errorData?.error?.message || `Longcat API error: ${response.status}`
      return Response.json({ error: errorMessage }, { status: response.status })
    }

    // Stream the response back to the client
    const reader = response.body?.getReader()
    if (!reader) {
      return Response.json(
        { error: "No response body from API" },
        { status: 500 }
      )
    }

    const encoder = new TextEncoder()
    const decoder = new TextDecoder()

    const stream = new ReadableStream({
      async start(controller) {
        try {
          let buffer = ""

          while (true) {
            const { done, value } = await reader.read()
            if (done) {
              controller.enqueue(encoder.encode("data: [DONE]\n\n"))
              controller.close()
              break
            }

            buffer += decoder.decode(value, { stream: true })
            const lines = buffer.split("\n")
            // Keep last potentially incomplete line in buffer
            buffer = lines.pop() || ""

            for (const line of lines) {
              const trimmed = line.trim()
              if (!trimmed || trimmed === "data: [DONE]") {
                if (trimmed === "data: [DONE]") {
                  controller.enqueue(encoder.encode("data: [DONE]\n\n"))
                }
                continue
              }

              if (trimmed.startsWith("data: ")) {
                const jsonStr = trimmed.slice(6)
                try {
                  const parsed = JSON.parse(jsonStr)
                  const choice = parsed.choices?.[0]

                  if (choice?.delta) {
                    const delta = choice.delta
                    const output: Record<string, string> = {}

                    if (delta.content) {
                      output.content = delta.content
                    }
                    if (delta.thinking) {
                      output.thinking = delta.thinking
                    }

                    if (Object.keys(output).length > 0) {
                      controller.enqueue(
                        encoder.encode(`data: ${JSON.stringify(output)}\n\n`)
                      )
                    }
                  }
                } catch {
                  // Skip malformed JSON chunks
                }
              }
            }
          }
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Stream error"
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ error: message })}\n\n`
            )
          )
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error"
    return Response.json({ error: message }, { status: 500 })
  }
}
