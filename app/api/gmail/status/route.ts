import { NextRequest, NextResponse } from "next/server"
import { getProfileIdFromRequest } from "@/lib/gmail-auth"
import { supabaseAdmin } from "@/lib/supabase-admin"

export async function GET(req: NextRequest) {
  const profileId = await getProfileIdFromRequest(req)
  if (!profileId) return NextResponse.json({ connected: false })

  const { data } = await supabaseAdmin.from("gmail_tokens").select("email").eq("profile_id", profileId).single()
  return NextResponse.json({ connected: !!data, email: data?.email || null })
}
