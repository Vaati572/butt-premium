import { NextRequest, NextResponse } from "next/server"
import { getProfileIdFromRequest } from "@/lib/gmail-auth"
import { supabaseAdmin } from "@/lib/supabase-admin"

export async function POST(req: NextRequest) {
  const profileId = await getProfileIdFromRequest(req)
  if (!profileId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  await supabaseAdmin.from("gmail_tokens").delete().eq("profile_id", profileId)
  return NextResponse.json({ success: true })
}
