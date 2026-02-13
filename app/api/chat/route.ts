import { NextRequest } from "next/server"

const LONGCAT_API_URL = "https://api.longcat.chat/openai/v1/chat/completions"

interface ChatRequestBody {
  apiKey: string
  model: string
  systemPrompt: string
  messages: { role: string; content: string }[]
  enableThinking: boolean
}

export const runtime = "edge"

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
      {
        role: "system",
        content: systemPrompt || "You are a helpful assistant.",
      },
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
      const errorText = await response.text()
      let errorMessage = `Longcat API error: ${response.status}`
      try {
        const errorData = JSON.parse(errorText)
        errorMessage = errorData?.error?.message || errorMessage
      } catch {
        // use default
      }
      return Response.json({ error: errorMessage }, { status: response.status })
    }

    // Passthrough the SSE stream directly from Longcat API
    if (!response.body) {
      return Response.json(
        { error: "No response body from API" },
        { status: 500 }
      )
    }

    return new Response(response.body, {
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
