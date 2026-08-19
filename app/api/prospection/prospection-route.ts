import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { supabaseAdmin } from "@/lib/supabase-admin"

async function getProfileFromRequest(req: NextRequest) {
  const auth = req.headers.get("authorization") || ""
  const token = auth.replace("Bearer ", "").trim()
  if (!token) return null
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  )
  const { data } = await supabase.auth.getUser()
  if (!data?.user) return null
  const { data: profile } = await supabaseAdmin
    .from("profiles").select("id,society_id").eq("id", data.user.id).single()
  return profile
}

// GET — charger l'état de prospection de toute la société
export async function GET(req: NextRequest) {
  const profile = await getProfileFromRequest(req)
  if (!profile?.society_id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const { data } = await supabaseAdmin
    .from("prospection_finess_state")
    .select("pharmacy_id, statut, notes, rappel, contact, priorite, updated_at, updated_by")
    .eq("society_id", profile.society_id)

  // Convertir en objet { pharmacyId: { statut, notes, ... } }
  const state: Record<string, any> = {}
  ;(data || []).forEach((row: any) => {
    state[row.pharmacy_id] = {
      statut: row.statut,
      notes: row.notes || "",
      rappel: row.rappel || "",
      contact: row.contact || "",
      priorite: row.priorite || "moyenne",
      updatedAt: row.updated_at,
    }
  })

  return NextResponse.json({ state })
}

// POST — sauvegarder l'état (upsert par pharmacie)
export async function POST(req: NextRequest) {
  const profile = await getProfileFromRequest(req)
  if (!profile?.society_id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const body = await req.json()
  const { state } = body // { pharmacyId: { statut, notes, rappel, ... } }

  if (!state || typeof state !== "object") {
    return NextResponse.json({ error: "state manquant" }, { status: 400 })
  }

  // Filtrer les pharmacies qui ont été touchées (statut != a_contacter ou notes/rappel remplis)
  const rows = Object.entries(state)
    .filter(([, t]: any) => t.statut !== "a_contacter" || t.notes || t.rappel || t.contact)
    .map(([pharmacy_id, t]: any) => ({
      society_id: profile.society_id,
      pharmacy_id,
      statut: t.statut || "a_contacter",
      notes: t.notes || null,
      rappel: t.rappel || null,
      contact: t.contact || null,
      priorite: t.priorite || "moyenne",
      updated_by: profile.id,
      updated_at: new Date().toISOString(),
    }))

  if (rows.length > 0) {
    await supabaseAdmin
      .from("prospection_finess_state")
      .upsert(rows, { onConflict: "society_id,pharmacy_id" })
  }

  return NextResponse.json({ saved: rows.length })
}
