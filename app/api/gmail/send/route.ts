import { NextRequest, NextResponse } from "next/server"
import { getProfileIdFromRequest, getValidAccessToken } from "@/lib/gmail-auth"
import { encodeBase64Url } from "@/lib/gmail"

export async function POST(req: NextRequest) {
  const profileId = await getProfileIdFromRequest(req)
  if (!profileId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const auth = await getValidAccessToken(profileId)
  if (!auth) return NextResponse.json({ error: "Gmail non connecté" }, { status: 400 })

  const { to, subject, body, threadId, inReplyTo } = await req.json()
  if (!to || !body) return NextResponse.json({ error: "Destinataire et message requis" }, { status: 400 })

  try {
    const headerLines = [
      `From: ${auth.email}`,
      `To: ${to}`,
      `Subject: ${subject || "(sans sujet)"}`,
      "Content-Type: text/plain; charset=utf-8",
      "MIME-Version: 1.0",
    ]
    if (inReplyTo) {
      headerLines.push(`In-Reply-To: ${inReplyTo}`)
      headerLines.push(`References: ${inReplyTo}`)
    }
    const raw = encodeBase64Url(`${headerLines.join("\r\n")}\r\n\r\n${body}`)

    const r = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
      method: "POST",
      headers: { Authorization: `Bearer ${auth.accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ raw, threadId: threadId || undefined }),
    })
    const d = await r.json()
    if (!r.ok) return NextResponse.json({ error: d }, { status: r.status })

    return NextResponse.json({ success: true, id: d.id })
  } catch (e) {
    console.error("Gmail send error:", e)
    return NextResponse.json({ error: "Erreur lors de l'envoi" }, { status: 500 })
  }
}
