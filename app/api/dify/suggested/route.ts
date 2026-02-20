import { NextRequest } from "next/server"

export async function GET(req: NextRequest) {
    const url = new URL(req.url)
    const messageId = url.searchParams.get("message_id")
    const apiKey = req.headers.get("x-dify-api-key")
    const baseUrl = req.headers.get("x-dify-base-url") || "https://api.dify.ai/v1"

    if (!apiKey || !messageId) {
        return Response.json({ error: "Missing API Key or message_id" }, { status: 400 })
    }

    try {
        const difyUrl = `${baseUrl}/messages/${messageId}/suggested?user=chat-panels-user`

        const response = await fetch(difyUrl, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
            }
        })

        if (!response.ok) {
            const err = await response.text()
            return Response.json({ error: err }, { status: response.status })
        }

        const data = await response.json()
        return Response.json(data)
    } catch (error) {
        console.error("Suggested query error", error)
        return Response.json({ error: "Internal Error" }, { status: 500 })
    }
}
