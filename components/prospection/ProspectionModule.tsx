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
      const next = { ...prev, [id]: { statut:"a_contacter", notes:"", rappel:"", contact:"", priorite:"moyenne", updatedAt:null, ...prev[id], ...patch, updatedAt: new Date().toISOString() } as TrackingEntry }
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
    const s: Record<string,number> = { total: pharmacies.length }
    Object.keys(SL).forEach(k => { s[k] = 0 })
    Object.values(tracking).forEach(t => { s[t.statut] = (s[t.statut]||0) + 1 })
    return s
  }, [pharmacies, tracking])

  const filtered = useMemo(() => pharmacies.filter(p => {
    if (fDept && p.dept !== fDept) return false
    if (fRegion && p.region !== fRegion) return false
    if (fPhone && !p.phone) return false
    if (fStatut !== "all" && (tracking[p.id]?.statut || "a_contacter") !== fStatut) return false
    if (search) {
      const q = search.toLowerCase()
      if (!((p.name+p.ville+(p.phone||"")).toLowerCase().includes(q))) return false
    }
    return true
  }), [pharmacies, tracking, fDept, fRegion, fPhone, fStatut, search])

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

  // Export
  const doExport = useCallback(() => {
    const now = new Date().toLocaleDateString("fr-FR", { weekday:"long", day:"numeric", month:"long", year:"numeric" })
    const rows = cochees.map((p, i) => {
      const t = tracking[p.id] || {} as TrackingEntry
      const s = t.statut || "contacte"; const col = SC[s]||"#888"
      const ds = t.updatedAt ? new Date(t.updatedAt).toLocaleDateString("fr-FR") : ""
      return `<tr>
        <td style="text-align:center;color:#888">${i+1}</td>
        <td><strong>${p.name}</strong><br><span style="color:#999;font-size:10px">${p.address||""}</span></td>
        <td>${p.ville||""}<br><span style="color:#999;font-size:10px">${p.dept||""} – ${p.deptNom||""}</span></td>
        <td style="color:#0284c7">${p.phone||""}</td>
        <td><span style="padding:2px 8px;border-radius:99px;background:${col}22;color:${col};border:1px solid ${col}55;font-size:10px;font-weight:700">${SL[s]||s}</span></td>
        <td style="color:#666;font-size:11px">${t.contact||""}</td>
        <td style="color:#666;font-size:11px">${ds}</td>
        <td style="color:#666;font-size:11px">${t.notes||""}</td>
        <td style="min-width:120px">&nbsp;</td><td style="min-width:120px">&nbsp;</td>
      </tr>`
    }).join("")
    const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><title>Prospection</title>
<style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:Arial,sans-serif;font-size:11px;padding:16px}
h1{font-size:18px;font-weight:700;margin-bottom:8px;color:#0284c7}
table{width:100%;border-collapse:collapse}
th{background:#0284c7;color:#fff;padding:7px 8px;text-align:left;font-size:10px;font-weight:700;text-transform:uppercase}
td{padding:7px 8px;border-bottom:1px solid #e5e7eb;vertical-align:top}
tr:nth-child(even) td{background:#f9fafb}
.btn{background:#0284c7;color:#fff;border:none;padding:8px 20px;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;margin-bottom:12px}
@media print{.btn{display:none}@page{margin:12mm;size:A4 landscape}}</style>
</head><body>
<button class="btn" onclick="window.print()">🖨️ Imprimer / PDF</button>
<h1>💊 Prospection Pharmacies — Butt Premium</h1>
<p style="color:#666;font-size:11px;margin-bottom:12px">${now} — ${cochees.length} pharmacies</p>
<table><thead><tr><th>#</th><th>Pharmacie</th><th>Ville/Dépt</th><th>Téléphone</th><th>Statut</th><th>Contacté par</th><th>Date</th><th>Notes</th><th>Compte-rendu</th><th>Suite</th></tr></thead>
<tbody>${rows}</tbody></table></body></html>`
    const w = window.open("","_blank","width=1100,height=700,scrollbars=yes")
    if (w) { w.document.write(html); w.document.close() }
  }, [cochees, tracking])

  const inp = "bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-zinc-600 w-full"
  const sel = "bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-zinc-600"

  return (
    <div className="flex-1 overflow-hidden flex flex-col bg-[#0a0a0a]">

      {/* Header */}
      <div className="border-b border-zinc-900 px-5 pt-4 pb-3 shrink-0">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div>
            <h1 className="text-white font-bold text-xl">💊 Prospection Pharmacies</h1>
            <p className="text-zinc-500 text-xs mt-0.5">Base nationale FINESS — {pharmacies.length.toLocaleString("fr-FR")} pharmacies</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {syncMsg && <span className="text-xs px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-300">{syncMsg}</span>}
            <button onClick={syncTeam} disabled={syncing}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border transition-all"
              style={{ background:"rgba(139,92,246,0.1)", borderColor:"rgba(139,92,246,0.3)", color:"#a78bfa" }}>
              <RefreshCw size={14} className={syncing ? "animate-spin" : ""} />
              {syncing ? "Sync..." : "Sync équipe"}
            </button>
            <button onClick={() => setPanel(p => p === "lot" ? "none" : "lot")}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border transition-all"
              style={{ background: panel==="lot" ? "rgba(14,165,233,0.2)" : "rgba(14,165,233,0.1)", borderColor:"rgba(14,165,233,0.35)", color:"#38bdf8" }}>
              <Target size={14} /> Lot de {lotQty}
            </button>
            <button onClick={() => setPanel(p => p === "cochees" ? "none" : "cochees")}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border transition-all"
              style={{ background: panel==="cochees" ? "rgba(34,197,94,0.2)" : "rgba(34,197,94,0.1)", borderColor:"rgba(34,197,94,0.35)", color:"#4ade80" }}>
              <CheckCircle size={14} /> Vue cochées
              <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background:"rgba(34,197,94,0.2)", color:"#4ade80" }}>{cochees.length}</span>
            </button>
          </div>
        </div>

        {/* Stat chips */}
        <div className="flex gap-1.5 flex-wrap">
          {[
            { key:"all", label:"Toutes", count: stats.total },
            { key:"contacte", label:"Contacté", count: stats.contacte||0 },
            { key:"interesse", label:"Intéressé", count: stats.interesse||0 },
            { key:"client", label:"Client", count: stats.client||0 },
            { key:"a_rappeler", label:"À rappeler", count: stats.a_rappeler||0 },
            { key:"injoignable", label:"Injoignable", count: stats.injoignable||0 },
            { key:"refuse", label:"Refusé", count: stats.refuse||0 },
          ].map(s => {
            const col = SC[s.key] || "#52525b"
            const active = fStatut === s.key
            return (
              <button key={s.key} onClick={() => { setFStatut(s.key); setPage(1) }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all"
                style={{ background: active ? col+"22" : "rgba(39,39,42,0.4)", borderColor: active ? col+"60" : "rgba(63,63,70,0.4)", color: active ? col : "#52525b" }}>
                {s.label} <span style={{ color: active ? col : "#3f3f46", fontWeight:700 }}>{s.count}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">

        {/* ── Liste principale ── */}
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* Filtres */}
          <div className="flex gap-2 px-5 py-3 border-b border-zinc-900 shrink-0 flex-wrap">
            <div className="flex-1 min-w-[180px] relative">
              <Search size={13} className="absolute left-3 top-2.5 text-zinc-500 pointer-events-none" />
              <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
                placeholder="Nom, ville, téléphone..." className={inp + " pl-8"} />
            </div>
            <select value={fDept} onChange={e => { setFDept(e.target.value); setPage(1) }} className={sel}>
              <option value="">Tous les départements</option>
              {depts.map(d => { const ph = pharmacies.find(p => p.dept === d); return <option key={d} value={d}>{d} – {ph?.deptNom||d}</option> })}
            </select>
            <select value={fRegion} onChange={e => { setFRegion(e.target.value); setPage(1) }} className={sel}>
              <option value="">Toutes les régions</option>
              {regions.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <label className="flex items-center gap-2 text-sm text-zinc-400 cursor-pointer px-3 py-2 border border-zinc-800 rounded-xl bg-zinc-900">
              <input type="checkbox" checked={fPhone} onChange={e => { setFPhone(e.target.checked); setPage(1) }} className="accent-blue-500" />
              Avec tél.
            </label>
            {(search||fDept||fRegion||fPhone||fStatut!=="all") && (
              <button onClick={() => { setSearch(""); setFDept(""); setFRegion(""); setFPhone(false); setFStatut("all"); setPage(1) }}
                className="px-3 py-2 rounded-xl text-xs text-zinc-500 border border-zinc-800 hover:text-white hover:border-zinc-600 transition-colors">
                ✕ Reset
              </button>
            )}
          </div>

          <div className="text-xs text-zinc-600 px-5 py-2 border-b border-zinc-900 shrink-0">
            {filtered.length.toLocaleString("fr-FR")} résultat{filtered.length !== 1 ? "s" : ""}
          </div>

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
                    {["Pharmacie","Ville / Dépt","Téléphone","Statut","Contacté par","Rappel","Notes"].map(h => (
                      <th key={h} className="text-left text-[10px] font-bold uppercase tracking-widest text-zinc-600 px-4 py-2.5 border-b border-zinc-900 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginated.map(p => {
                    const t = tracking[p.id]
                    const s = t?.statut || "a_contacter"
                    const col = SC[s]
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
                          <select value={s}
                            onChange={e => updateEntry(p.id, { statut: e.target.value as TrackingEntry["statut"] })}
                            className="text-[11px] font-bold px-2 py-1 rounded-lg border outline-none cursor-pointer"
                            style={{ background: col+"18", borderColor: col+"50", color: col }}>
                            {Object.entries(SL).map(([k,v]) => (
                              <option key={k} value={k} style={{ background:"#18181b", color: SC[k] }}>{v}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-2.5">
                          <input value={t?.contact||""} onChange={e => updateEntry(p.id, { contact: e.target.value })}
                            placeholder="Qui ?" className="bg-transparent border-b border-zinc-800 text-zinc-300 text-[12px] outline-none w-full focus:border-zinc-500 py-0.5 min-w-[80px]" />
                        </td>
                        <td className="px-4 py-2.5">
                          <input type="date" value={t?.rappel||""} onChange={e => updateEntry(p.id, { rappel: e.target.value })}
                            className="bg-transparent text-[11px] outline-none border-b border-zinc-800 focus:border-zinc-500"
                            style={{ color: t?.rappel ? "#f97316" : "#3f3f46" }} />
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
