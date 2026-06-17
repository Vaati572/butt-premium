import { NextRequest } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { refreshAccessToken } from "@/lib/gmail"

/**
 * Identifie l'utilisateur connecté à partir du token Supabase envoyé par le
 * client dans l'en-tête Authorization: Bearer <access_token>.
 */
export async function getProfileIdFromRequest(req: NextRequest): Promise<string | null> {
  const authHeader = req.headers.get("authorization") || ""
  const token = authHeader.replace("Bearer ", "").trim()
  if (!token) return null

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  )
  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) return null
  return data.user.id
}

/**
 * Retourne un access_token Gmail valide pour ce profil (le rafraîchit si expiré).
 * Retourne null si l'utilisateur n'a jamais connecté sa boîte mail.
 */
export async function getValidAccessToken(profileId: string): Promise<{ accessToken: string; email: string } | null> {
  const { data: row } = await supabaseAdmin.from("gmail_tokens").select("*").eq("profile_id", profileId).single()
  if (!row) return null

  if (row.expiry_date && Number(row.expiry_date) > Date.now() + 60_000) {
    return { accessToken: row.access_token, email: row.email }
  }

  if (!row.refresh_token) return null
  const tokens = await refreshAccessToken(row.refresh_token)
  await supabaseAdmin.from("gmail_tokens").update({
    access_token: tokens.access_token,
    expiry_date: Date.now() + (tokens.expires_in || 3600) * 1000,
    updated_at: new Date().toISOString(),
  }).eq("profile_id", profileId)

  return { accessToken: tokens.access_token, email: row.email }
}
