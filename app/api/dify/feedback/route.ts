import { NextRequest } from "next/server"

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { messageId, rating, apiKey, baseUrl } = body

        if (!messageId || !rating || !apiKey) {
            return Response.json({ error: "Missing required fields" }, { status: 400 })
        }

        const difyBaseUrl = baseUrl || "https://api.dify.ai/v1"
        const difyUrl = `${difyBaseUrl}/messages/${messageId}/feedbacks`

        const response = await fetch(difyUrl, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                rating: rating, // "like" or "dislike"
                user: "chat-panels-user"
            })
        })

        if (!response.ok) {
            const err = await response.text()
            return Response.json({ error: err }, { status: response.status })
        }

        const data = await response.json()
        return Response.json(data)
    } catch (error) {
        console.error("Feedback error", error)
        return Response.json({ error: "Internal Error" }, { status: 500 })
    }
}
