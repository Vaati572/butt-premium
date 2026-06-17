const TOKEN_URL = "https://oauth2.googleapis.com/token"

export async function refreshAccessToken(refreshToken: string) {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  })
  if (!res.ok) {
    const t = await res.text()
    throw new Error("Échec du rafraîchissement du token Google : " + t)
  }
  return res.json() as Promise<{ access_token: string; expires_in: number; scope: string; token_type: string }>
}

export function decodeBase64Url(data: string): string {
  try {
    return Buffer.from(data.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf-8")
  } catch {
    return ""
  }
}

export function encodeBase64Url(str: string): string {
  return Buffer.from(str, "utf-8").toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

export function extractHeader(headers: any[], name: string): string {
  return headers?.find((h: any) => h.name?.toLowerCase() === name.toLowerCase())?.value || ""
}

export function extractBody(payload: any): { text: string; html: string } {
  let text = ""
  let html = ""
  function walk(part: any) {
    if (!part) return
    if (part.mimeType === "text/plain" && part.body?.data) text += decodeBase64Url(part.body.data)
    if (part.mimeType === "text/html" && part.body?.data) html += decodeBase64Url(part.body.data)
    if (part.parts) part.parts.forEach(walk)
  }
  walk(payload)
  if (!text && !html && payload?.body?.data) {
    text = decodeBase64Url(payload.body.data)
  }
  return { text, html }
}

// Extrait "Nom" et "email@domaine.com" depuis un header "From" du type 'Nom <email@domaine.com>'
export function parseFromHeader(from: string): { name: string; email: string } {
  const match = from.match(/^(.*?)\s*<(.+?)>$/)
  if (match) return { name: match[1].replace(/"/g, "").trim() || match[2], email: match[2] }
  return { name: from, email: from }
}
