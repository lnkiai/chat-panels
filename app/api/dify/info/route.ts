export const runtime = "edge"

export async function GET(req: Request) {
    try {
        const apiKey = req.headers.get("x-dify-api-key")
        const baseUrl = req.headers.get("x-dify-base-url") || "https://api.dify.ai/v1"

        if (!apiKey) {
            return Response.json({ error: "API key is required" }, { status: 401 })
        }

        // Try /info as requested by user, fallback to /site if info fails or isn't what we need
        // Actually the user specifically said /info
        const res = await fetch(`${baseUrl.replace(/\/+$/, "")}/info`, {
            headers: {
                Authorization: `Bearer ${apiKey}`,
            }
        })

        if (!res.ok) {
            // Fallback to /site to get app name if /info is not available
            const resSite = await fetch(`${baseUrl.replace(/\/+$/, "")}/site`, {
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                }
            })
            if (!resSite.ok) {
                return Response.json({ error: "Failed to fetch dify info" }, { status: res.status })
            }
            const siteData = await resSite.json()
            return Response.json({ name: siteData.title, ...siteData })
        }

        const data = await res.json()
        return Response.json(data)
    } catch (error: any) {
        return Response.json({ error: "Internal server error", message: error.message }, { status: 500 })
    }
}
