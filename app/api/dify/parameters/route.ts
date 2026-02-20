export const runtime = "edge"

export async function GET(req: Request) {
    try {
        const apiKey = req.headers.get("x-dify-api-key")
        const baseUrl = req.headers.get("x-dify-base-url") || "https://api.dify.ai/v1"

        if (!apiKey) {
            console.error("[Dify Params] Missing API key")
            return Response.json({ error: "API key is required" }, { status: 401 })
        }

        console.log(`[Dify Params] Fetching from ${baseUrl}/parameters`)
        const res = await fetch(`${baseUrl.replace(/\/+$/, "")}/parameters`, {
            headers: {
                Authorization: `Bearer ${apiKey}`,
            }
        })

        if (!res.ok) {
            const errText = await res.text()
            console.error(`[Dify Params] Error ${res.status}: ${errText}`)
            return Response.json({ error: "Failed to fetch dify parameters", details: errText }, { status: res.status })
        }

        const data = await res.json()
        console.log("[Dify Params] Success")
        return Response.json(data)
    } catch (error: any) {
        console.error("[Dify Params] Internal error:", error)
        return Response.json({ error: "Internal server error", message: error.message }, { status: 500 })
    }
}
