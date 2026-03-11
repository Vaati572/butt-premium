import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const apiKey = process.env.ANTHROPIC_KEY || ""
    if (!apiKey) {
      return NextResponse.json({ error: "Clé ANTHROPIC_KEY manquante dans Vercel" }, { status: 500 })
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(body),
    })

    const data = await response.json()

    if (!response.ok) {
      const errMsg = data?.error?.message || JSON.stringify(data)
      console.error("Anthropic API error:", response.status, errMsg)
      return NextResponse.json(
        { error: `[${response.status}] ${errMsg}` },
        { status: response.status }
      )
    }

    return NextResponse.json(data)
  } catch (e: any) {
    console.error("Route /api/ia error:", e)
    return NextResponse.json({ error: e.message || "Erreur serveur" }, { status: 500 })
  }
}