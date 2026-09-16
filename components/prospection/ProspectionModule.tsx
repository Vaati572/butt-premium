"use client"

import { useState, useEffect, useCallback, useRef, useMemo } from "react"
import { supabase } from "@/lib/supabase"
import { Search, RefreshCw, Download, CheckCircle, Target, X } from "lucide-react"

interface Pharmacy {
  id: string; name: string; address: string; ville: string; cp: string
  dept: string; deptNom: string; region: string; phone: string | null
  hours: string | null; rating: number | null; lat: number | null; lon: number | null
}
interface TrackingEntry {
  statut: "a_contacter"|"contacte"|"interesse"|"client"|"a_rappeler"|"injoignable"|"refuse"
  notes: string; rappel: string; contact: string; priorite: string; updatedAt: string|null
}
type PanelMode = "none"|"lot"|"cochees"

const SL: Record<string,string> = {
  a_contacter:"À contacter", contacte:"Contacté", interesse:"Intéressé",
  client:"Client", a_rappeler:"À rappeler", injoignable:"Injoignable", refuse:"Refusé"
}
const SC: Record<string,string> = {
  a_contacter:"#52525b", contacte:"#3b82f6", interesse:"#22c55e",
  client:"#eab308", a_rappeler:"#f97316", injoignable:"#71717a", refuse:"#ef4444"
}
const PAGE = 50

export default function ProspectionModule({ activeSociety, profile }: { activeSociety: any; profile: any }) {
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([])
  const [tracking, setTracking]     = useState<Record<string, TrackingEntry>>({})
  const [loading, setLoading]       = useState(true)
  const [syncing, setSyncing]       = useState(false)
  const [syncMsg, setSyncMsg]       = useState("")
  const [search, setSearch]         = useState("")
  const [fDept, setFDept]           = useState("")
  const [fRegion, setFRegion]       = useState("")
  const [fStatut, setFStatut]       = useState("all")
  const [fPhone, setFPhone]         = useState(false)
  const [sortBy, setSortBy]         = useState<"nom"|"rappel"|"contact_date"|"statut">("nom")
  const [sortDir, setSortDir]       = useState<"asc"|"desc">("asc")
  const [fDateFrom, setFDateFrom]   = useState("")
  const [fDateTo, setFDateTo]       = useState("")
  const [fRappelOnly, setFRappelOnly] = useState(false)
  const [page, setPage]             = useState(1)
  const [panel, setPanel]           = useState<PanelMode>("none")
  const [vcFilter, setVcFilter]     = useState("all")
  const [vcSearch, setVcSearch]     = useState("")
  const [lotDept, setLotDept]       = useState("")
  const [lotRegion, setLotRegion]   = useState("")
  const [lotVille, setLotVille]     = useState("")
  const [lotNom, setLotNom]         = useState("")
  const [lotPhone, setLotPhone]     = useState(true)
  const [lotQty, setLotQty]         = useState(30)
  const [lotResults, setLotResults] = useState<Pharmacy[]>([])
  const [lotMode, setLotMode]       = useState<"idle"|"preview"|"picked">("idle")
  const [lotLoading, setLotLoading] = useState(false)
  const saveTimer = useRef<NodeJS.Timeout | null>(null)

  // Chargement données pharmacies
  useEffect(() => {
    fetch("/pharmacies_data.json").then(r => r.json()).then(setPharmacies).catch(console.error)
  }, [])

  // Chargement tracking Supabase
  const loadTracking = useCallback(async () => {
    if (!activeSociety?.id) return
    setLoading(true)
    try {
      const { data } = await supabase
        .from("prospection_finess_state")
        .select("pharmacy_id,statut,notes,rappel,contact,priorite,updated_at")
        .eq("society_id", activeSociety.id)
      if (data) {
        const map: Record<string, TrackingEntry> = {}
        data.forEach((r: any) => {
          map[r.pharmacy_id] = { statut: r.statut, notes: r.notes||"", rappel: r.rappel||"", contact: r.contact||"", priorite: r.priorite||"moyenne", updatedAt: r.updated_at }
        })
        setTracking(map)
      }
    } finally { setLoading(false) }
  }, [activeSociety])

  useEffect(() => { if (pharmacies.length > 0) loadTracking() }, [pharmacies])

  // Sauvegarde Supabase
  const saveTracking = useCallback(async (t: Record<string, TrackingEntry>) => {
    if (!activeSociety?.id) return
    const rows = Object.entries(t)
      .filter(([, v]) => v.statut !== "a_contacter" || v.notes || v.rappel || v.contact)
      .map(([pharmacy_id, v]) => ({
        society_id: activeSociety.id, pharmacy_id,
        statut: v.statut, notes: v.notes||null, rappel: v.rappel||null,
        contact: v.contact||null, priorite: v.priorite||"moyenne",
        updated_at: v.updatedAt || new Date().toISOString()
      }))
    if (rows.length > 0)
      await supabase.from("prospection_finess_state").upsert(rows, { onConflict: "society_id,pharmacy_id" })
  }, [activeSociety])

  const updateEntry = useCallback((id: string, patch: Partial<TrackingEntry>) => {
    setTracking(prev => {
      const existing = prev[id]
      const base: TrackingEntry = {
        statut: existing?.statut || "a_contacter",
        notes: existing?.notes || "",
        rappel: existing?.rappel || "",
        contact: existing?.contact || "",
        priorite: existing?.priorite || "moyenne",
        updatedAt: new Date().toISOString(),
      }
      const next: Record<string, TrackingEntry> = { ...prev, [id]: { ...base, ...patch, updatedAt: new Date().toISOString() } }
      if (saveTimer.current) { clearTimeout(saveTimer.current); saveTimer.current = null }
      saveTimer.current = setTimeout(() => saveTracking(next), 800)
      return next
    })
  }, [saveTracking])

  // Sync équipe
  const syncTeam = useCallback(async () => {
    if (!activeSociety?.id) return
    setSyncing(true); setSyncMsg("")
    try {
      const { data } = await supabase.from("prospection_finess_state")
        .select("pharmacy_id,statut,notes,rappel,contact,priorite,updated_at")
        .eq("society_id", activeSociety.id)
      if (data) {
        setTracking(prev => {
          const next = { ...prev }
          data.forEach((r: any) => {
            const local = prev[r.pharmacy_id]
            const rd = new Date(r.updated_at||0).getTime()
            const ld = new Date(local?.updatedAt||0).getTime()
            if (!local || rd > ld) next[r.pharmacy_id] = { statut:r.statut, notes:r.notes||"", rappel:r.rappel||"", contact:r.contact||"", priorite:r.priorite||"moyenne", updatedAt:r.updated_at }
          })
          return next
        })
        setSyncMsg(`✅ ${data.length} synchronisées`)
      }
    } catch { setSyncMsg("❌ Erreur") }
    finally { setSyncing(false); setTimeout(() => setSyncMsg(""), 3000) }
  }, [activeSociety])

  // Données dérivées
  const depts   = useMemo(() => [...new Set(pharmacies.map(p => p.dept).filter(Boolean))].sort(), [pharmacies])
  const regions = useMemo(() => [...new Set(pharmacies.map(p => p.region).filter(Boolean))].sort(), [pharmacies])

  const stats = useMemo(() => {
    const s: Record<string,number> = { total: pharmacies.length, a_contacter: 0 }
    Object.keys(SL).forEach(k => { s[k] = 0 })
    Object.values(tracking).forEach(t => { s[t.statut] = (s[t.statut]||0) + 1 })
    return s
  }, [pharmacies, tracking])

  const todayStr = new Date().toISOString().slice(0,10)

  const filtered = useMemo(() => {
    let list = pharmacies.filter(p => {
      if (fDept && p.dept !== fDept) return false
      if (fRegion && p.region !== fRegion) return false
      if (fPhone && !p.phone) return false
      if (fStatut !== "all" && (tracking[p.id]?.statut || "a_contacter") !== fStatut) return false
      if (search) {
        const q = search.toLowerCase()
        if (!((p.name+p.ville+(p.phone||"")).toLowerCase().includes(q))) return false
      }
      // Filtre date de rappel
      const rappel = tracking[p.id]?.rappel || ""
      if (fRappelOnly && !rappel) return false
      if (fDateFrom && rappel && rappel < fDateFrom) return false
      if (fDateTo   && rappel && rappel > fDateTo)   return false
      return true
    })

    // Tri
    list = [...list].sort((a, b) => {
      let va = "", vb = ""
      if (sortBy === "nom") { va = a.name; vb = b.name }
      else if (sortBy === "statut") { va = tracking[a.id]?.statut||"a_contacter"; vb = tracking[b.id]?.statut||"a_contacter" }
      else if (sortBy === "rappel") { va = tracking[a.id]?.rappel||"9999"; vb = tracking[b.id]?.rappel||"9999" }
      else if (sortBy === "contact_date") { va = tracking[a.id]?.updatedAt||""; vb = tracking[b.id]?.updatedAt||"" }
      const cmp = va.localeCompare(vb)
      return sortDir === "asc" ? cmp : -cmp
    })

    return list
  }, [pharmacies, tracking, fDept, fRegion, fPhone, fStatut, search, fDateFrom, fDateTo, fRappelOnly, sortBy, sortDir])

  const paginated = useMemo(() => filtered.slice(0, page * PAGE), [filtered, page])

  const cochees = useMemo(() => pharmacies.filter(p => {
    const t = tracking[p.id]
    if (!t || t.statut === "a_contacter") return false
    if (vcFilter !== "all" && t.statut !== vcFilter) return false
    if (vcSearch) {
      const q = vcSearch.toLowerCase()
      if (!((p.name+p.ville+(p.phone||"")+(t.notes||"")+(t.contact||"")).toLowerCase().includes(q))) return false
    }
    return true
  }), [pharmacies, tracking, vcFilter, vcSearch])

  // Lot de 30
  const getLot = useCallback(() => pharmacies.filter(p => {
    if (lotDept && p.dept !== lotDept) return false
    if (lotRegion && p.region !== lotRegion) return false
    if (lotVille && !(p.ville||"").toLowerCase().includes(lotVille.toLowerCase())) return false
    if (lotNom && !p.name.toLowerCase().includes(lotNom.toLowerCase())) return false
    if (lotPhone && !p.phone) return false
    const t = tracking[p.id]; return !t || t.statut === "a_contacter"
  }).slice(0, lotQty), [pharmacies, tracking, lotDept, lotRegion, lotVille, lotNom, lotPhone, lotQty])

  const doPick = useCallback(async () => {
    setLotLoading(true)
    const picked = getLot()
    if (!picked.length) { setLotResults([]); setLotMode("idle"); setLotLoading(false); return }
    const now = new Date().toISOString()
    const who = [profile?.prenom, profile?.nom].filter(Boolean).join(" ") || profile?.email || ""
    setTracking(prev => {
      const next = { ...prev }
      picked.forEach(p => {
        const ex = prev[p.id]
        next[p.id] = {
          statut: "contacte" as const,
          notes: ex?.notes || "",
          rappel: ex?.rappel || "",
          contact: ex?.contact || who,
          priorite: ex?.priorite || "moyenne",
          updatedAt: now,
        }
      })
      saveTracking(next)
      return next
    })
    setLotResults(picked); setLotMode("picked"); setLotLoading(false)
  }, [getLot, profile, saveTracking])

  // Export PDF propre par catégorie
  const doExport = useCallback(() => {
    const dateNow = new Date().toLocaleDateString("fr-FR", { weekday:"long", day:"numeric", month:"long", year:"numeric" })
    const timeNow = new Date().toLocaleTimeString("fr-FR", { hour:"2-digit", minute:"2-digit" })

    // Grouper par statut dans l'ordre
    const ORDER = ["contacte","interesse","client","a_rappeler","injoignable","refuse","a_contacter"]
    const groups: Record<string, typeof cochees> = {}
    ORDER.forEach(s => { groups[s] = [] })
    cochees.forEach(p => {
      const s = tracking[p.id]?.statut || "a_contacter"
      if (!groups[s]) groups[s] = []
      groups[s].push(p)
    })

    const COLORS: Record<string,string> = {
      contacte:"#2563eb", interesse:"#16a34a", client:"#ca8a04",
      a_rappeler:"#ea580c", injoignable:"#6b7280", refuse:"#dc2626", a_contacter:"#374151"
    }
    const BG: Record<string,string> = {
      contacte:"#eff6ff", interesse:"#f0fdf4", client:"#fefce8",
      a_rappeler:"#fff7ed", injoignable:"#f9fafb", refuse:"#fef2f2", a_contacter:"#f9fafb"
    }

    let sections = ""
    let totalExporte = 0

    ORDER.forEach(statut => {
      const items = groups[statut]
      if (!items || items.length === 0) return
      totalExporte += items.length

      const col = COLORS[statut] || "#374151"
      const bg  = BG[statut]    || "#f9fafb"
      const label = SL[statut]  || statut

      const lignes = items.map((p, i) => {
        const t = tracking[p.id] || {} as TrackingEntry
        const ds = t.updatedAt
          ? new Date(t.updatedAt).toLocaleDateString("fr-FR",{day:"2-digit",month:"2-digit",year:"numeric"})
          : "—"
        const rappel = t.rappel
          ? new Date(t.rappel+"T00:00:00").toLocaleDateString("fr-FR",{day:"2-digit",month:"2-digit",year:"numeric"})
          : "—"
        const retard = t.rappel && t.rappel < new Date().toISOString().slice(0,10)
        return `<tr>
          <td class="num">${i+1}</td>
          <td class="name"><strong>${p.name}</strong><div class="addr">${p.address||""}</div></td>
          <td>${p.ville||"—"}<div class="sub">${p.dept||""} – ${p.deptNom||""}</div></td>
          <td class="phone">${p.phone||"—"}</td>
          <td class="contact">${t.contact||"—"}</td>
          <td class="date">${ds}</td>
          <td class="date${retard?" retard":""}">${rappel}</td>
          <td class="notes">${t.notes||""}</td>
        </tr>`
      }).join("")

      sections += `
        <div class="section">
          <div class="section-header" style="border-left:4px solid ${col};background:${bg}">
            <div class="section-title" style="color:${col}">${label}</div>
            <div class="section-count">${items.length} pharmacie${items.length>1?"s":""}</div>
          </div>
          <table>
            <thead>
              <tr>
                <th style="width:30px">#</th>
                <th>Pharmacie</th>
                <th>Ville / Dépt</th>
                <th>Téléphone</th>
                <th>Contacté par</th>
                <th>Dernier contact</th>
                <th>Rappel</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>${lignes}</tbody>
          </table>
        </div>`
    })

    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>Prospection Pharmacies — Butt Premium</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 11px; color: #1a1a1a; background: #fff; padding: 24px; }

  /* En-tête */
  .header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:20px; padding-bottom:14px; border-bottom:2px solid #1a1a1a; }
  .header-left h1 { font-size:20px; font-weight:800; letter-spacing:-0.5px; color:#0c0c0c; }
  .header-left p  { color:#666; font-size:11px; margin-top:4px; }
  .header-right   { text-align:right; }
  .header-right .badge { display:inline-flex; align-items:center; gap:6px; background:#f0f4ff; border:1px solid #c7d2fe; border-radius:99px; padding:4px 12px; font-size:11px; font-weight:700; color:#3730a3; margin-bottom:6px; }
  .header-right .meta { color:#999; font-size:10px; }

  /* Résumé */
  .summary { display:flex; gap:10px; margin-bottom:20px; flex-wrap:wrap; }
  .summary-card { flex:1; min-width:90px; border:1px solid #e5e7eb; border-radius:8px; padding:10px 14px; text-align:center; }
  .summary-card .val { font-size:22px; font-weight:900; }
  .summary-card .lbl { font-size:9px; font-weight:700; text-transform:uppercase; letter-spacing:.5px; color:#888; margin-top:2px; }

  /* Sections */
  .section { margin-bottom:24px; page-break-inside:avoid; }
  .section-header { display:flex; justify-content:space-between; align-items:center; padding:8px 14px; border-radius:6px 6px 0 0; margin-bottom:0; }
  .section-title  { font-size:13px; font-weight:800; }
  .section-count  { font-size:10px; font-weight:700; color:#555; background:rgba(0,0,0,0.07); padding:2px 8px; border-radius:99px; }

  /* Tableau */
  table { width:100%; border-collapse:collapse; font-size:10.5px; }
  thead th { background:#1a1a1a; color:#fff; padding:7px 10px; text-align:left; font-size:9px; font-weight:700; text-transform:uppercase; letter-spacing:.5px; white-space:nowrap; }
  tbody tr:nth-child(even) td { background:#fafafa; }
  tbody tr:hover td { background:#f0f4ff; }
  td { padding:7px 10px; border-bottom:1px solid #e5e7eb; vertical-align:top; }
  td.num    { text-align:center; color:#aaa; font-size:10px; width:30px; }
  td.name strong { font-weight:700; font-size:11px; }
  td.addr, .sub { color:#999; font-size:9.5px; margin-top:1px; }
  td.phone  { color:#2563eb; font-weight:600; white-space:nowrap; }
  td.contact{ color:#374151; }
  td.date   { color:#374151; white-space:nowrap; font-size:10px; }
  td.retard { color:#dc2626; font-weight:700; }
  td.notes  { color:#6b7280; font-style:italic; max-width:200px; }

  /* Pied */
  .footer { margin-top:24px; padding-top:12px; border-top:1px solid #e5e7eb; display:flex; justify-content:space-between; color:#aaa; font-size:9px; }

  /* Bouton impression */
  .no-print { margin-bottom:16px; }
  .btn-print { background:#1a1a1a; color:#fff; border:none; padding:10px 24px; border-radius:8px; font-size:13px; font-weight:700; cursor:pointer; margin-right:8px; }
  .btn-print:hover { background:#333; }

  @media print {
    .no-print { display:none !important; }
    body { padding: 0; }
    @page { margin:12mm 10mm; size:A4 landscape; }
    .section { page-break-inside:avoid; }
    thead { display:table-header-group; }
  }
</style>
</head>
<body>

<div class="no-print">
  <button class="btn-print" onclick="window.print()">🖨️ Imprimer / Exporter PDF</button>
  <button class="btn-print" style="background:#2563eb" onclick="window.close()">✕ Fermer</button>
</div>

<div class="header">
  <div class="header-left">
    <h1>💊 Prospection Pharmacies</h1>
    <p>Butt Premium — Base nationale FINESS</p>
  </div>
  <div class="header-right">
    <div class="badge">📋 ${totalExporte} pharmacie${totalExporte>1?"s":""} exportée${totalExporte>1?"s":""}</div>
    <div class="meta">${dateNow} à ${timeNow}</div>
  </div>
</div>

<div class="summary">
  ${ORDER.map(s => {
    const n = groups[s]?.length || 0
    if (!n) return ""
    const col = COLORS[s] || "#374151"
    return `<div class="summary-card" style="border-color:${col}30">
      <div class="val" style="color:${col}">${n}</div>
      <div class="lbl">${SL[s]||s}</div>
    </div>`
  }).filter(Boolean).join("")}
</div>

${sections}

<div class="footer">
  <span>Butt Premium CRM — Exporté le ${dateNow} à ${timeNow}</span>
  <span>${totalExporte} pharmacie${totalExporte>1?"s":""} · Base FINESS</span>
</div>

</body>
</html>`

    const w = window.open("", "_blank", "width=1200,height=800,scrollbars=yes")
    if (w) { w.document.write(html); w.document.close() }
  }, [cochees, tracking])

  const inp = "bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-zinc-600 w-full"
  const sel = "bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-zinc-600"

  return (
    <div className="flex-1 overflow-hidden flex flex-col bg-[#0a0a0a]">

      {/* ── HEADER ── */}
      <div className="border-b border-zinc-900 px-5 pt-4 pb-0 shrink-0">
        {/* Titre + actions */}
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div>
            <h1 className="text-white font-bold text-xl">💊 Prospection Pharmacies</h1>
            <p className="text-zinc-500 text-xs mt-0.5">Base nationale FINESS — {pharmacies.length.toLocaleString("fr-FR")} pharmacies</p>
          </div>
          <div className="flex items-center gap-2">
            {syncMsg && <span className="text-xs px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-300">{syncMsg}</span>}
            <button onClick={syncTeam} disabled={syncing}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all"
              style={{ background:"rgba(139,92,246,0.1)", borderColor:"rgba(139,92,246,0.3)", color:"#a78bfa" }}>
              <RefreshCw size={12} className={syncing ? "animate-spin" : ""} />
              {syncing ? "Sync..." : "Sync équipe"}
            </button>
            <button onClick={() => setPanel(p => p === "lot" ? "none" : "lot")}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all"
              style={{ background: panel==="lot" ? "rgba(14,165,233,0.2)" : "rgba(14,165,233,0.1)", borderColor:"rgba(14,165,233,0.35)", color:"#38bdf8" }}>
              <Target size={12} /> Lot de {lotQty}
            </button>
            <button onClick={() => setPanel(p => p === "cochees" ? "none" : "cochees")}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all"
              style={{ background: panel==="cochees" ? "rgba(34,197,94,0.2)" : "rgba(34,197,94,0.1)", borderColor:"rgba(34,197,94,0.35)", color:"#4ade80" }}>
              <CheckCircle size={12} /> Vue cochées
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black" style={{ background:"rgba(34,197,94,0.2)", color:"#4ade80" }}>{cochees.length}</span>
            </button>
          </div>
        </div>

        {/* Filtres statut (chips colorés) */}
        <div className="flex gap-1.5 flex-wrap pb-3">
          {[
            { key:"all",         label:"Toutes",      count: stats.total,            col:"#71717a" },
            { key:"a_contacter", label:"À contacter", count: stats.a_contacter||0,   col:"#52525b" },
            { key:"contacte",    label:"Contacté",    count: stats.contacte||0,       col:"#3b82f6" },
            { key:"interesse",   label:"Intéressé",   count: stats.interesse||0,      col:"#22c55e" },
            { key:"client",      label:"Client",      count: stats.client||0,         col:"#eab308" },
            { key:"a_rappeler",  label:"À rappeler",  count: stats.a_rappeler||0,     col:"#f97316" },
            { key:"injoignable", label:"Injoignable", count: stats.injoignable||0,    col:"#71717a" },
            { key:"refuse",      label:"Refusé",      count: stats.refuse||0,         col:"#ef4444" },
          ].map(s => {
            const active = fStatut === s.key
            return (
              <button key={s.key} onClick={() => { setFStatut(s.key); setPage(1) }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all"
                style={{ background: active ? s.col+"25" : "rgba(39,39,42,0.5)", borderColor: active ? s.col+"70" : "rgba(63,63,70,0.4)", color: active ? s.col : "#52525b" }}>
                {s.label}
                <span className="font-black" style={{ color: active ? s.col : "#3f3f46" }}>{s.count}</span>
              </button>
            )
          })}
        </div>

        {/* Filtres recherche / dépt / région */}
        <div className="flex gap-2 pb-2 flex-wrap border-t border-zinc-900/60 pt-2">
          <div className="flex-1 min-w-[200px] relative">
            <Search size={12} className="absolute left-3 top-2.5 text-zinc-500 pointer-events-none" />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
              placeholder="Rechercher nom, ville, téléphone..."
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-8 pr-3 py-2 text-sm text-white outline-none focus:border-zinc-600" />
          </div>
          <select value={fDept} onChange={e => { setFDept(e.target.value); setPage(1) }}
            className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-zinc-600">
            <option value="">Département</option>
            {depts.map(d => { const ph = pharmacies.find(p => p.dept === d); return <option key={d} value={d}>{d} – {ph?.deptNom||d}</option> })}
          </select>
          <select value={fRegion} onChange={e => { setFRegion(e.target.value); setPage(1) }}
            className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-zinc-600">
            <option value="">Région</option>
            {regions.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <label className="flex items-center gap-1.5 text-xs text-zinc-400 cursor-pointer px-3 py-2 border border-zinc-800 rounded-xl bg-zinc-900">
            <input type="checkbox" checked={fPhone} onChange={e => { setFPhone(e.target.checked); setPage(1) }} className="accent-blue-500" />
            📞 Avec tél.
          </label>
        </div>

        {/* Filtres date + tri */}
        <div className="flex gap-2 pb-2 flex-wrap items-center border-t border-zinc-900/60 pt-2">
          <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest shrink-0">📅 Rappel :</span>
          <input type="date" value={fDateFrom} onChange={e => { setFDateFrom(e.target.value); setPage(1) }}
            className="bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1.5 text-xs text-white outline-none focus:border-orange-500/50" />
          <span className="text-zinc-600 text-xs">→</span>
          <input type="date" value={fDateTo} onChange={e => { setFDateTo(e.target.value); setPage(1) }}
            className="bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1.5 text-xs text-white outline-none focus:border-orange-500/50" />
          <label className="flex items-center gap-1.5 text-xs text-zinc-400 cursor-pointer px-2.5 py-1.5 border border-zinc-800 rounded-lg bg-zinc-900">
            <input type="checkbox" checked={fRappelOnly} onChange={e => { setFRappelOnly(e.target.checked); setPage(1) }} className="accent-orange-500" />
            Avec rappel seulement
          </label>
          {(search||fDept||fRegion||fPhone||fStatut!=="all"||fDateFrom||fDateTo||fRappelOnly) && (
            <button onClick={() => { setSearch(""); setFDept(""); setFRegion(""); setFPhone(false); setFStatut("all"); setFDateFrom(""); setFDateTo(""); setFRappelOnly(false); setPage(1) }}
              className="px-3 py-1.5 rounded-lg text-xs font-bold text-red-400 border border-red-500/30 hover:bg-red-500/10 transition-colors">
              ✕ Tout réinitialiser
            </button>
          )}
          <div className="ml-auto flex items-center gap-2">
            <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Trier :</span>
            <select value={sortBy} onChange={e => { setSortBy(e.target.value as typeof sortBy); setPage(1) }}
              className="bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1.5 text-xs text-white outline-none">
              <option value="nom">Nom A→Z</option>
              <option value="statut">Statut</option>
              <option value="rappel">Date de rappel</option>
              <option value="contact_date">Dernier contact</option>
            </select>
            <button onClick={() => setSortDir(d => d === "asc" ? "desc" : "asc")}
              className="px-2.5 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white text-xs font-bold transition-colors w-24">
              {sortDir === "asc" ? "↑ Croissant" : "↓ Décroissant"}
            </button>
          </div>
        </div>

        {/* Compteur résultats */}
        <div className="text-xs text-zinc-600 pb-2">
          {filtered.length.toLocaleString("fr-FR")} résultat{filtered.length !== 1 ? "s" : ""}
          {filtered.length !== pharmacies.length && ` sur ${pharmacies.length.toLocaleString("fr-FR")}`}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden">
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-zinc-500 text-sm">Chargement des données...</p>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-zinc-950 z-10">
                  <tr>
                    {["Pharmacie","Ville / Dépt","Téléphone","Statut","Contacté par","Dernier contact","Rappel","Notes"].map(h => (
                      <th key={h} className="text-left text-[10px] font-bold uppercase tracking-widest text-zinc-600 px-4 py-2.5 border-b border-zinc-900 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginated.map(p => {
                    const t = tracking[p.id]
                    const s = t?.statut || "a_contacter"
                    return (
                      <tr key={p.id} className="border-b border-zinc-900/40 hover:bg-zinc-900/30 transition-colors">
                        <td className="px-4 py-2.5">
                          <div className="font-semibold text-white text-[13px] leading-tight">{p.name}</div>
                          <div className="text-zinc-600 text-[11px] mt-0.5">{p.address}</div>
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="text-zinc-300 text-[13px]">{p.ville}</div>
                          <div className="text-zinc-600 text-[11px]">{p.dept} – {p.deptNom}</div>
                        </td>
                        <td className="px-4 py-2.5 text-blue-400 text-[12px] whitespace-nowrap">
                          {p.phone || <span className="text-zinc-700">—</span>}
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="relative group/statut">
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-bold cursor-pointer select-none"
                              style={{ background: (SC[s]||"#52525b")+"20", borderColor: (SC[s]||"#52525b")+"50", color: SC[s]||"#a1a1aa", border: `1px solid ${SC[s]||"#52525b"}40` }}>
                              {SL[s] || "À contacter"} <span className="opacity-60 text-[9px]">▾</span>
                            </span>
                            <select value={s}
                              onChange={e => updateEntry(p.id, { statut: e.target.value as TrackingEntry["statut"] })}
                              className="absolute inset-0 opacity-0 cursor-pointer w-full"
                              style={{ fontSize: "12px" }}>
                              {Object.entries(SL).map(([k,v]) => (
                                <option key={k} value={k}>{v}</option>
                              ))}
                            </select>
                          </div>
                        </td>
                        <td className="px-4 py-2.5">
                          <input value={t?.contact||""} onChange={e => updateEntry(p.id, { contact: e.target.value })}
                            placeholder="Qui ?" className="bg-transparent border-b border-zinc-800 text-zinc-300 text-[12px] outline-none w-full focus:border-zinc-500 py-0.5 min-w-[80px]" />
                        </td>
                        <td className="px-4 py-2.5 whitespace-nowrap">
                          {t?.updatedAt ? (
                            <div>
                              <div className="text-zinc-300 text-[12px] font-medium">
                                {new Date(t.updatedAt).toLocaleDateString("fr-FR",{day:"numeric",month:"short",year:"numeric"})}
                              </div>
                              <div className="text-zinc-600 text-[10px]">
                                {new Date(t.updatedAt).toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"})}
                              </div>
                            </div>
                          ) : <span className="text-zinc-700 text-[11px]">—</span>}
                        </td>
                        <td className="px-4 py-2.5 whitespace-nowrap">
                          <div className="flex flex-col gap-0.5">
                            <input type="date" value={t?.rappel||""} onChange={e => updateEntry(p.id, { rappel: e.target.value })}
                              className="bg-transparent text-[11px] outline-none border-b border-zinc-800 focus:border-zinc-500"
                              style={{ color: t?.rappel ? (t.rappel < todayStr ? "#ef4444" : t.rappel === todayStr ? "#f97316" : "#f97316") : "#3f3f46" }} />
                            {t?.rappel && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full w-fit"
                                style={{
                                  background: t.rappel < todayStr ? "rgba(239,68,68,0.15)" : t.rappel === todayStr ? "rgba(249,115,22,0.15)" : "rgba(249,115,22,0.1)",
                                  color: t.rappel < todayStr ? "#ef4444" : "#f97316"
                                }}>
                                {t.rappel < todayStr ? "⚠ En retard" : t.rappel === todayStr ? "⏰ Aujourd'hui" : `📅 ${new Date(t.rappel+"T00:00:00").toLocaleDateString("fr-FR",{day:"numeric",month:"short"})}`}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-2.5">
                          <input value={t?.notes||""} onChange={e => updateEntry(p.id, { notes: e.target.value })}
                            placeholder="Note..." className="bg-transparent border-b border-zinc-800 text-zinc-400 text-[12px] outline-none focus:border-zinc-500 py-0.5 min-w-[120px] w-full" />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {paginated.length < filtered.length && (
                <div className="p-5 text-center">
                  <button onClick={() => setPage(p => p + 1)}
                    className="px-6 py-2.5 rounded-xl text-sm font-bold bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors">
                    Charger {Math.min(PAGE, filtered.length - paginated.length)} de plus ({(filtered.length - paginated.length).toLocaleString("fr-FR")} restants)
                  </button>
                </div>
              )}
              {!filtered.length && !loading && (
                <div className="flex flex-col items-center justify-center py-24 text-zinc-600">
                  <p className="text-lg font-bold mb-1">Aucun résultat</p>
                  <p className="text-sm">Modifiez vos filtres</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Panel Lot de 30 ── */}
        {panel === "lot" && (
          <div className="w-80 shrink-0 border-l border-zinc-900 flex flex-col bg-[#0d0d0d]">
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-900">
              <span className="text-white font-bold text-sm">🎯 Lot de pharmacies</span>
              <button onClick={() => setPanel("none")} className="text-zinc-600 hover:text-white"><X size={16} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider mb-1.5 block">Département</label>
                  <select value={lotDept} onChange={e => setLotDept(e.target.value)} className={sel + " text-xs w-full"}>
                    <option value="">Tous</option>
                    {depts.map(d => { const ph = pharmacies.find(p => p.dept === d); return <option key={d} value={d}>{d} – {ph?.deptNom||d}</option> })}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider mb-1.5 block">Région</label>
                  <select value={lotRegion} onChange={e => setLotRegion(e.target.value)} className={sel + " text-xs w-full"}>
                    <option value="">Toutes</option>
                    {regions.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider mb-1.5 block">Ville</label>
                <input value={lotVille} onChange={e => setLotVille(e.target.value)} placeholder="Ex: Paris, Lyon..." className={inp + " text-xs"} />
              </div>
              <div>
                <label className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider mb-1.5 block">Nom</label>
                <input value={lotNom} onChange={e => setLotNom(e.target.value)} placeholder="Ex: Centrale..." className={inp + " text-xs"} />
              </div>
              <label className="flex items-center gap-2 text-xs text-zinc-400 cursor-pointer py-1">
                <input type="checkbox" checked={lotPhone} onChange={e => setLotPhone(e.target.checked)} className="accent-blue-500" />
                Avec téléphone uniquement
              </label>
              <div>
                <label className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider mb-1.5 block">Quantité</label>
                <select value={lotQty} onChange={e => setLotQty(Number(e.target.value))} className={sel + " text-xs w-full"}>
                  {[10,20,30,50].map(n => <option key={n} value={n}>{n} pharmacies</option>)}
                </select>
              </div>
              <button onClick={doPick} disabled={lotLoading}
                className="w-full py-3 rounded-xl text-sm font-black text-white transition-all mt-2"
                style={{ background: "linear-gradient(135deg,#0ea5e9,#0284c7)", boxShadow:"0 4px 16px rgba(14,165,233,0.3)" }}>
                {lotLoading ? "..." : `🎯 Obtenir ${lotQty} & cocher`}
              </button>
              <button onClick={() => { setLotResults(getLot()); setLotMode("preview") }}
                className="w-full py-2.5 rounded-xl text-sm font-bold text-zinc-400 border border-zinc-800 hover:border-zinc-600 transition-colors">
                👁 Prévisualiser sans cocher
              </button>

              {lotMode !== "idle" && (
                <div className="mt-2">
                  <div className="text-[10px] font-bold uppercase tracking-wider mb-2"
                    style={{ color: lotMode==="picked" ? "#4ade80" : "#a1a1aa" }}>
                    {lotMode === "picked" ? `${lotResults.length} pharmacies cochées ✓` : `${lotResults.length} résultats (aperçu)`}
                  </div>
                  {lotResults.length === 0 && <p className="text-zinc-600 text-xs text-center py-4">Toutes les pharmacies de ces filtres ont déjà été contactées !</p>}
                  <div className="space-y-1.5 max-h-96 overflow-y-auto">
                    {lotResults.map((p, i) => (
                      <div key={p.id} className="p-2.5 rounded-lg border border-zinc-800 bg-zinc-900/40">
                        <div className="text-white text-xs font-semibold leading-tight">{i+1}. {p.name}</div>
                        <div className="text-zinc-600 text-[10px] mt-0.5">{p.ville} ({p.dept})</div>
                        {p.phone && <div className="text-blue-400 text-[10px]">{p.phone}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Panel Vue Cochées (plein écran) ── */}
      {panel === "cochees" && (
        <div className="fixed inset-0 z-50 bg-[#0a0a0a] flex flex-col">
          <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-900 shrink-0 flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <span className="text-white font-bold text-base">✅ Pharmacies cochées & suivies</span>
              <span className="text-xs px-2 py-1 rounded-full bg-zinc-800 text-zinc-400">{cochees.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={doExport}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white"
                style={{ background:"linear-gradient(135deg,#7c3aed,#4f46e5)" }}>
                <Download size={13} /> Export imprimable
              </button>
              <button onClick={() => setPanel("none")} className="text-zinc-600 hover:text-white p-2 rounded-lg hover:bg-zinc-800 transition-colors">
                <X size={18} />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 px-5 py-2.5 border-b border-zinc-900 shrink-0 flex-wrap">
            {["all","contacte","interesse","client","a_rappeler","refuse","injoignable"].map(s => {
              const col = SC[s] || "#52525b"; const on = vcFilter === s
              return (
                <button key={s} onClick={() => setVcFilter(s)}
                  className="px-3 py-1.5 rounded-full text-xs font-bold border transition-all"
                  style={{ background: on ? col+"22" : "transparent", borderColor: on ? col+"60" : "#3f3f46", color: on ? col : "#71717a" }}>
                  {s === "all" ? "Tous" : SL[s]}
                </button>
              )
            })}
            <div className="relative ml-auto">
              <Search size={12} className="absolute left-2.5 top-2 text-zinc-500 pointer-events-none" />
              <input value={vcSearch} onChange={e => setVcSearch(e.target.value)}
                placeholder="Rechercher..." className="bg-zinc-900 border border-zinc-800 rounded-xl pl-7 pr-3 py-1.5 text-xs text-white outline-none w-48 focus:border-zinc-600" />
            </div>
          </div>

          <div className="flex-1 overflow-auto">
            <table className="w-full text-sm min-w-[1000px]">
              <thead className="sticky top-0 bg-zinc-950 z-10">
                <tr>
                  {["#","Pharmacie","Ville / Dépt","Téléphone","Statut","Contacté par","Dernier contact","Rappel","Notes"].map(h => (
                    <th key={h} className="text-left text-[10px] font-bold uppercase tracking-widest text-zinc-600 px-4 py-3 border-b border-zinc-900 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cochees.map((p, i) => {
                  const t = tracking[p.id] || {} as TrackingEntry
                  const s = t.statut || "contacte"; const col = SC[s]
                  const ds = t.updatedAt ? new Date(t.updatedAt).toLocaleDateString("fr-FR", { day:"numeric", month:"short", year:"numeric" }) : "—"
                  return (
                    <tr key={p.id} className="border-b border-zinc-900/40 hover:bg-zinc-900/20 transition-colors">
                      <td className="px-4 py-3 text-zinc-600 text-[11px] w-8">{i+1}</td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-white text-[13px]">{p.name}</div>
                        <div className="text-zinc-600 text-[11px]">{p.address}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-zinc-300 text-[13px]">{p.ville||"—"}</div>
                        <div className="text-zinc-600 text-[11px]">{p.dept} {p.deptNom}</div>
                      </td>
                      <td className="px-4 py-3 text-blue-400 text-[12px] whitespace-nowrap">{p.phone||<span className="text-zinc-700">—</span>}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 rounded-full text-[10px] font-bold border whitespace-nowrap"
                          style={{ background:col+"18", borderColor:col+"50", color:col }}>
                          {SL[s]}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <input value={t.contact||""} onChange={e => updateEntry(p.id, { contact: e.target.value })}
                          placeholder="Qui a contacté ?" className="bg-transparent border-b border-zinc-800 text-zinc-300 text-[12px] outline-none focus:border-zinc-500 py-0.5 min-w-[100px]" />
                      </td>
                      <td className="px-4 py-3 text-zinc-500 text-[11px] whitespace-nowrap">{ds}</td>
                      <td className="px-4 py-3">
                        <input type="date" value={t.rappel||""} onChange={e => updateEntry(p.id, { rappel: e.target.value })}
                          className="bg-transparent text-[11px] outline-none border-b border-zinc-800 focus:border-zinc-500"
                          style={{ color: t.rappel ? "#f97316" : "#3f3f46" }} />
                      </td>
                      <td className="px-4 py-3">
                        <input value={t.notes||""} onChange={e => updateEntry(p.id, { notes: e.target.value })}
                          placeholder="Note..." className="bg-transparent border-b border-zinc-800 text-zinc-400 text-[12px] outline-none focus:border-zinc-500 py-0.5 min-w-[160px]" />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {!cochees.length && (
              <div className="flex flex-col items-center justify-center py-24 text-zinc-600">
                <CheckCircle size={40} className="mb-4 opacity-20" />
                <p className="text-lg font-bold mb-1">Aucune pharmacie cochée</p>
                <p className="text-sm">Utilisez le Lot de {lotQty} ou changez les statuts dans la liste principale</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
