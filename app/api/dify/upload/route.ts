import { NextRequest } from "next/server"

export const runtime = 'edge';
export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData()

        const apiKey = req.headers.get("x-dify-api-key")
        const baseUrl = req.headers.get("x-dify-base-url") || "https://api.dify.ai/v1"

        if (!apiKey) {
            return Response.json({ error: "Missing API Key" }, { status: 400 })
        }

        const difyUrl = `${baseUrl}/files/upload`

        const response = await fetch(difyUrl, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
            },
            body: formData
        })

        if (!response.ok) {
            const err = await response.text()
            return Response.json({ error: err }, { status: response.status })
        }

        const data = await response.json()
        return Response.json(data)
    } catch (error) {
        console.error("Upload error", error)
        return Response.json({ error: "Internal Error" }, { status: 500 })
    }
}
