import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code")
  const profileId = req.nextUrl.searchParams.get("state")
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin

  if (!code || !profileId) {
    console.error("Gmail callback: paramètres manquants", { code: !!code, profileId })
    return NextResponse.redirect(`${appUrl}/dashboard?tab=mail&mail_error=missing_params`)
  }

  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
        code,
        grant_type: "authorization_code",
      }),
    })
    const tokens = await tokenRes.json()
    if (!tokenRes.ok || !tokens.access_token) {
      console.error("Gmail callback: échec échange token", { status: tokenRes.status, tokens })
      return NextResponse.redirect(`${appUrl}/dashboard?tab=mail&mail_error=token_exchange&detail=${encodeURIComponent(tokens.error || tokens.error_description || "inconnu")}`)
    }

    const profileRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    })
    const googleProfile = await profileRes.json()

    const { data: profileRow } = await supabaseAdmin.from("profiles").select("society_id").eq("id", profileId).single()

    const payload: any = {
      profile_id: profileId,
      society_id: profileRow?.society_id || null,
      email: googleProfile.email || null,
      access_token: tokens.access_token,
      expiry_date: Date.now() + (tokens.expires_in || 3600) * 1000,
      updated_at: new Date().toISOString(),
    }
    // Google ne renvoie un refresh_token qu'à la première autorisation (ou si prompt=consent) ;
    // on ne l'écrase que si on en reçoit un nouveau.
    if (tokens.refresh_token) payload.refresh_token = tokens.refresh_token

    await supabaseAdmin.from("gmail_tokens").upsert(payload, { onConflict: "profile_id" })

    return NextResponse.redirect(`${appUrl}/dashboard?tab=mail&mail_connected=1`)
  } catch (e: any) {
    console.error("Gmail OAuth callback error:", e)
    return NextResponse.redirect(`${appUrl}/dashboard?tab=mail&mail_error=unknown&detail=${encodeURIComponent(e?.message || "inconnu")}`)
  }
}
