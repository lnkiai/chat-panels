
import { NextResponse } from "next/server";

export const runtime = "edge";

// Define Provider Configurations
// Using reference from .docs/AI_Provider_Models_API_Reference.md
const PROVIDER_CONFIGS: Record<string, {
    endpoint: string,
    method: "GET" | "POST",
    headers: (apiKey: string) => Record<string, string>,
    body?: (apiKey: string) => any, // For Zhipu
    parser: (data: any) => { id: string, name: string, description?: string }[]
}> = {
    "openai": {
        endpoint: "https://api.openai.com/v1/models",
        method: "GET",
        headers: (apiKey) => ({ "Authorization": `Bearer ${apiKey}` }),
        parser: (data) => data.data
            .filter((m: any) => /^(gpt-(4|5)|o[134])/.test(m.id) && !m.id.includes('realtime') && !m.id.includes('audio'))
            .map((m: any) => ({
                id: m.id,
                name: m.id,
                description: `OpenAI Model (Context: ${m.context_window || 'N/A'})`
            }))
            .sort((a: any, b: any) => a.id.localeCompare(b.id))
    },
    "anthropic": {
        endpoint: "https://api.anthropic.com/v1/models",
        method: "GET",
        headers: (apiKey) => ({
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01"
        }),
        parser: (data) => data.data
            .filter((m: any) => m.type === "model")
            .map((m: any) => ({
                id: m.id,
                name: m.display_name || m.id,
                description: "Anthropic Model"
            }))
    },
    "gemini": {
        // Endpoint requires query param for key, handled in fetch logic
        endpoint: "https://generativelanguage.googleapis.com/v1beta/models",
        method: "GET",
        headers: () => ({}),
        parser: (data) => data.models?.map((m: any) => ({
            id: m.name.replace(/^models\//, ''), // Remove 'models/' prefix
            name: m.displayName || m.name,
            description: m.description || "Gemini Model"
        }))
            .filter((m: any) => m.id.startsWith("gemini-") && !m.id.includes("vision")) // Filter out older/vision-only
            .sort((a: any, b: any) => b.id.localeCompare(a.id)) || []
    },
    "deepseek": {
        endpoint: "https://api.deepseek.com/v1/models",
        method: "GET",
        headers: (apiKey) => ({ "Authorization": `Bearer ${apiKey}` }),
        parser: (data) => data.data.map((m: any) => ({
            id: m.id,
            name: m.id,
            description: "DeepSeek Model"
        }))
    },
    "qwen": {
        endpoint: "https://dashscope-intl.aliyuncs.com/api/v1/models",
        method: "GET",
        headers: (apiKey) => ({ "Authorization": `Bearer ${apiKey}` }),
        parser: (data) => data.data?.map((m: any) => ({
            id: m.id,
            name: m.id,
            description: "Qwen Model"
        })) || []
    },
    "openrouter": {
        endpoint: "https://openrouter.ai/api/v1/models",
        method: "GET",
        headers: (apiKey) => ({ "Authorization": `Bearer ${apiKey}` }),
        parser: (data) => {
            const allowedPrefixes = ["openai/", "anthropic/", "google/", "meta-llama/", "mistralai/", "deepseek/", "qwen/"];
            return data.data
                .filter((m: any) => allowedPrefixes.some(prefix => m.id.startsWith(prefix)))
                .map((m: any) => ({
                    id: m.id,
                    name: m.name || m.id,
                    description: `${m.context_length ? Math.round(m.context_length / 1000) + 'k' : ''} Context | ${m.pricing ? '$' + m.pricing.prompt + '/M' : ''}`
                }))
                .slice(0, 100); // Limit to top 100 to avoid overwhelming UI
        }
    },
    "xai": {
        endpoint: "https://api.x.ai/v1/models",
        method: "GET",
        headers: (apiKey) => ({ "Authorization": `Bearer ${apiKey}` }),
        parser: (data) => data.data.map((m: any) => ({
            id: m.id,
            name: m.id,
            description: "xAI Model"
        }))
    }
    // Zhipu omitted for now as it doesn't have a standard GET models endpoint listed in standard OpenAI format or simple GET in reference without POST complexity
};

export async function POST(req: Request) {
    try {
        const { providerId, apiKey } = await req.json();

        if (!providerId || !apiKey) {
            return NextResponse.json({ error: "Missing providerId or apiKey" }, { status: 400 });
        }

        const config = PROVIDER_CONFIGS[providerId];
        if (!config) {
            return NextResponse.json({ error: "Unsupported provider" }, { status: 400 });
        }

        let url = config.endpoint;
        // Special handling for Gemini usage of query param
        if (providerId === "gemini") {
            url += `?key=${apiKey}`;
        }

        const response = await fetch(url, {
            method: config.method,
            headers: config.headers(apiKey)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Provider ${providerId} fetch failed:`, response.status, errorText);
            return NextResponse.json({ error: `Provider API error: ${response.status}`, details: errorText }, { status: response.status });
        }

        const data = await response.json();
        const models = config.parser(data);

        return NextResponse.json({ models });

    } catch (error: any) {
        console.error("Model fetch error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
