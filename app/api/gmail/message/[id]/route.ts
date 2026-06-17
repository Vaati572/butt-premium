import { NextRequest, NextResponse } from "next/server"
import { getProfileIdFromRequest, getValidAccessToken } from "@/lib/gmail-auth"
import { extractHeader, extractBody } from "@/lib/gmail"

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const profileId = await getProfileIdFromRequest(req)
  if (!profileId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const auth = await getValidAccessToken(profileId)
  if (!auth) return NextResponse.json({ error: "Gmail non connecté" }, { status: 400 })

  try {
    const r = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${params.id}?format=full`, {
      headers: { Authorization: `Bearer ${auth.accessToken}` },
    })
    const d = await r.json()
    if (!r.ok) return NextResponse.json({ error: d }, { status: r.status })

    const { text, html } = extractBody(d.payload)

    // Marque le message comme lu (en arrière-plan, sans bloquer la réponse)
    if ((d.labelIds || []).includes("UNREAD")) {
      fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${params.id}/modify`, {
        method: "POST",
        headers: { Authorization: `Bearer ${auth.accessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ removeLabelIds: ["UNREAD"] }),
      }).catch(() => {})
    }

    return NextResponse.json({
      id: d.id,
      threadId: d.threadId,
      from: extractHeader(d.payload?.headers || [], "From"),
      to: extractHeader(d.payload?.headers || [], "To"),
      subject: extractHeader(d.payload?.headers || [], "Subject") || "(sans sujet)",
      date: extractHeader(d.payload?.headers || [], "Date"),
      messageIdHeader: extractHeader(d.payload?.headers || [], "Message-ID"),
      text, html,
    })
  } catch (e) {
    console.error("Gmail message error:", e)
    return NextResponse.json({ error: "Erreur lors de la récupération du message" }, { status: 500 })
  }
}
