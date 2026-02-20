import { NextRequest } from "next/server"
import { getProvider, createProviderInstance } from "@/lib/ai-providers/registry"
import type { ProviderConfig, ChatCompletionRequest } from "@/lib/ai-providers/types"

interface ChatRequestBody extends ChatCompletionRequest {
  providerId: string
  providerConfig: {
    apiKey?: string
    baseUrl?: string
    organizationId?: string
  }
}

export const runtime = "edge"

export async function POST(req: NextRequest) {
  try {
    const body: ChatRequestBody = await req.json()
    const { providerId, providerConfig, model, messages } = body

    if (!providerId) {
      return Response.json({ error: "Provider ID is required" }, { status: 400 })
    }

    const providerDef = getProvider(providerId)
    if (!providerDef) {
      return Response.json({ error: `Provider ${providerId} not found` }, { status: 400 })
    }

    if (!providerConfig?.apiKey) {
      return Response.json({ error: "API key is required" }, { status: 400 })
    }

    if (!messages || messages.length === 0) {
      return Response.json({ error: "Messages are required" }, { status: 400 })
    }

    // Initialize provider
    const provider = createProviderInstance(providerDef, {
      apiKey: providerConfig.apiKey,
      baseUrl: providerConfig.baseUrl,
      organizationId: providerConfig.organizationId,
    })

    // Create completion
    const response = await provider.createChatCompletion({
      model,
      messages,
      systemPrompt: body.systemPrompt,
      enableThinking: body.enableThinking,
      stream: true,
      temperature: 0.7,
      maxTokens: 4096,
      files: body.files,
      difyInputs: body.difyInputs,
    })

    // Passthrough the SSE stream
    if (!response.body) {
      return Response.json(
        { error: "No response body from Provider API" },
        { status: 500 }
      )
    }

    return new Response(response.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error"
    console.error("API Route Error:", error)
    return Response.json({ error: message }, { status: 500 })
  }
}
