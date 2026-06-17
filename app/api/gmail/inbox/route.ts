import { NextRequest, NextResponse } from "next/server"
import { getProfileIdFromRequest, getValidAccessToken } from "@/lib/gmail-auth"
import { extractHeader } from "@/lib/gmail"

export async function GET(req: NextRequest) {
  const profileId = await getProfileIdFromRequest(req)
  if (!profileId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const auth = await getValidAccessToken(profileId)
  if (!auth) return NextResponse.json({ connected: false, messages: [] })

  const pageToken = req.nextUrl.searchParams.get("pageToken") || ""
  const q = req.nextUrl.searchParams.get("q") || ""

  const params = new URLSearchParams({ maxResults: "20" })
  params.set("labelIds", "INBOX")
  if (pageToken) params.set("pageToken", pageToken)
  if (q) params.set("q", q)

  try {
    const listRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?${params.toString()}`, {
      headers: { Authorization: `Bearer ${auth.accessToken}` },
    })
    const listData = await listRes.json()
    if (!listRes.ok) return NextResponse.json({ error: listData }, { status: listRes.status })

    const ids: string[] = (listData.messages || []).map((m: any) => m.id)
    const messages = await Promise.all(ids.map(async (id) => {
      const r = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`,
        { headers: { Authorization: `Bearer ${auth.accessToken}` } }
      )
      const d = await r.json()
      return {
        id: d.id,
        threadId: d.threadId,
        snippet: d.snippet,
        unread: (d.labelIds || []).includes("UNREAD"),
        from: extractHeader(d.payload?.headers || [], "From"),
        subject: extractHeader(d.payload?.headers || [], "Subject") || "(sans sujet)",
        date: extractHeader(d.payload?.headers || [], "Date"),
      }
    }))

    return NextResponse.json({
      connected: true,
      email: auth.email,
      messages,
      nextPageToken: listData.nextPageToken || null,
    })
  } catch (e) {
    console.error("Gmail inbox error:", e)
    return NextResponse.json({ error: "Erreur lors de la récupération des emails" }, { status: 500 })
  }
}
