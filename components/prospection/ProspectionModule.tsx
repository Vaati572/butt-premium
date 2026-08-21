"use client"

import { useState, useEffect, useCallback, useRef, useMemo } from "react"
import { supabase } from "@/lib/supabase"
import { useUserSettings } from "@/lib/UserSettingsContext"

interface Pharmacy {
  id: string
  name: string
  address: string
  ville: string
  cp: string
  dept: string
  deptNom: string
  region: string
  phone: string | null
  hours: string | null
  rating: number | null
  lat: number | null
  lon: number | null
}

interface TrackingEntry {
  statut: "a_contacter" | "contacte" | "interesse" | "client" | "a_rappeler" | "injoignable" | "refuse"
  notes: string
  rappel: string
  contact: string
  priorite: string
  updatedAt: string | null
}

const STATUTS = [
  { id: "a_contacter", label: "À contacter", color: "#71717a" },
  { id: "contacte",    label: "Contacté",    color: "#3b82f6" },
  { id: "a_rappeler",  label: "À rappeler",  color: "#f97316" },
  { id: "interesse",   label: "Intéressé",   color: "#22c55e" },
  { id: "client",      label: "Client",      color: "#eab308" },
  { id: "injoignable", label: "Injoignable", color: "#a1a1aa" },
  { id: "refuse",      label: "Refusé",      color: "#ef4444" },
] as const

const PRIORITES = [
  { id: "basse",   label: "Basse" },
  { id: "moyenne", label: "Moyenne" },
  { id: "haute",   label: "Haute" },
  { id: "urgente", label: "Urgente" },
]

const PAGE = 40
const EMPTY: TrackingEntry = {
  statut: "a_contacter", notes: "", rappel: "", contact: "", priorite: "moyenne", updatedAt: null,
}

export default function ProspectionModule({ activeSociety, profile }: { activeSociety: any; profile: any }) {
  const { settings } = useUserSettings()
  const ACCENT = settings.accent_color || "#eab308"
  const societyId = activeSociety?.id

  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([])
  const [tracking, setTracking] = useState<Record<string, TrackingEntry>>({})
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [statusMsg, setStatusMsg] = useState("") // "Enregistré" | erreur

  const [search, setSearch] = useState("")
  const [fRegion, setFRegion] = useState("")
  const [fDept, setFDept] = useState("")
  const [fVille, setFVille] = useState("")
  const [fStatut, setFStatut] = useState("all")
  const [fPriorite, setFPriorite] = useState("all")
  const [fPhone, setFPhone] = useState(false)
  const [fRappel, setFRappel] = useState(false)
  const [page, setPage] = useState(1)

  const [selected, setSelected] = useState<Pharmacy | null>(null)
  const [checked, setChecked] = useState<Set<string>>(new Set())
  const [showLot, setShowLot] = useState(false)

  const [lotDept, setLotDept] = useState("")
  const [lotRegion, setLotRegion] = useState("")
  const [lotVille, setLotVille] = useState("")
  const [lotPhone, setLotPhone] = useState(true)
  const [lotQty, setLotQty] = useState(30)
  const [lotResults, setLotResults] = useState<Pharmacy[]>([])
  const [lotMode, setLotMode] = useState<"idle" | "preview" | "picked">("idle")
  const [lotLoading, setLotLoading] = useState(false)

  const notesTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  const flash = (msg: string, ms = 2000) => {
    setStatusMsg(msg)
    setTimeout(() => setStatusMsg(""), ms)
  }

  useEffect(() => {
    fetch("/pharmacies_data.json")
      .then(r => r.json())
      .then((data) => {
        // normalise les ids en string
        setPharmacies((data || []).map((p: any) => ({ ...p, id: String(p.id) })))
      })
      .catch(console.error)
  }, [])

  const loadTracking = useCallback(async () => {
    if (!societyId) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("prospection_finess_state")
        .select("pharmacy_id,statut,notes,rappel,contact,priorite,updated_at")
        .eq("society_id", societyId)
      if (error) {
        console.error("loadTracking", error)
        flash("Erreur chargement: " + error.message, 4000)
      }
      if (data) {
        const map: Record<string, TrackingEntry> = {}
        data.forEach((r: any) => {
          map[String(r.pharmacy_id)] = {
            statut: r.statut || "a_contacter",
            notes: r.notes || "",
            rappel: r.rappel || "",
            contact: r.contact || "",
            priorite: r.priorite || "moyenne",
            updatedAt: r.updated_at,
          }
        })
        setTracking(map)
      }
    } finally {
      setLoading(false)
    }
  }, [societyId])

  useEffect(() => {
    if (pharmacies.length > 0) loadTracking()
  }, [pharmacies.length, loadTracking])

  /**
   * SAUVEGARDE ROBUSTE : update si existe, sinon insert
   * (évite les problèmes d'onConflict / contrainte unique)
   */
  const saveOne = useCallback(async (pharmacyId: string, entry: TrackingEntry): Promise<boolean> => {
    if (!societyId) {
      flash("Pas de société active", 3000)
      return false
    }
    const pid = String(pharmacyId)
    const row = {
      society_id: societyId,
      pharmacy_id: pid,
      statut: entry.statut,
      notes: entry.notes || null,
      rappel: entry.rappel || null,
      contact: entry.contact || null,
      priorite: entry.priorite || "moyenne",
      updated_at: entry.updatedAt || new Date().toISOString(),
    }

    // 1) existe déjà ?
    const { data: existing, error: selErr } = await supabase
      .from("prospection_finess_state")
      .select("pharmacy_id")
      .eq("society_id", societyId)
      .eq("pharmacy_id", pid)
      .maybeSingle()

    if (selErr) {
      console.error("select", selErr)
      flash("Erreur: " + selErr.message, 4000)
      return false
    }

    if (existing) {
      const { error } = await supabase
        .from("prospection_finess_state")
        .update({
          statut: row.statut,
          notes: row.notes,
          rappel: row.rappel,
          contact: row.contact,
          priorite: row.priorite,
          updated_at: row.updated_at,
        })
        .eq("society_id", societyId)
        .eq("pharmacy_id", pid)
      if (error) {
        console.error("update", error)
        flash("Erreur save: " + error.message, 4000)
        return false
      }
    } else {
      const { error } = await supabase
        .from("prospection_finess_state")
        .insert(row)
      if (error) {
        // fallback upsert au cas où
        const { error: upErr } = await supabase
          .from("prospection_finess_state")
          .upsert(row, { onConflict: "society_id,pharmacy_id" })
        if (upErr) {
          console.error("insert/upsert", error, upErr)
          flash("Erreur save: " + (upErr.message || error.message), 4000)
          return false
        }
      }
    }
    flash("✓ Enregistré")
    return true
  }, [societyId])

  const saveMany = useCallback(async (entries: Record<string, TrackingEntry>) => {
    let ok = 0
    for (const [id, entry] of Object.entries(entries)) {
      if (await saveOne(id, entry)) ok++
    }
    if (ok > 1) flash(`✓ ${ok} enregistrées`)
  }, [saveOne])

  /** Applique un patch en local + sauvegarde immédiate (sauf notes → debounce) */
  const updateEntry = useCallback((id: string, patch: Partial<TrackingEntry>, debounceNotes = false) => {
    const pid = String(id)
    setTracking(prev => {
      const base = prev[pid] || { ...EMPTY }
      const nextEntry: TrackingEntry = {
        ...base,
        ...patch,
        updatedAt: new Date().toISOString(),
      }
      const next = { ...prev, [pid]: nextEntry }

      if (debounceNotes && "notes" in patch && Object.keys(patch).length === 1) {
        if (notesTimers.current[pid]) clearTimeout(notesTimers.current[pid])
        notesTimers.current[pid] = setTimeout(() => { saveOne(pid, nextEntry) }, 600)
      } else {
        // statut, priorité, rappel, contact → save immédiat
        saveOne(pid, nextEntry)
      }
      return next
    })
  }, [saveOne])

  const bulkUpdate = useCallback(async (ids: string[], patch: Partial<TrackingEntry>) => {
    if (!ids.length) return
    const now = new Date().toISOString()
    const toSave: Record<string, TrackingEntry> = {}
    setTracking(prev => {
      const next = { ...prev }
      ids.forEach(id => {
        const pid = String(id)
        const entry = { ...(prev[pid] || EMPTY), ...patch, updatedAt: now }
        next[pid] = entry
        toSave[pid] = entry
      })
      return next
    })
    await saveMany(toSave)
  }, [saveMany])

  const bulkReset = useCallback(async (ids: string[]) => {
    if (!ids.length || !societyId) return
    if (!confirm(`Réinitialiser le suivi de ${ids.length} pharmacie(s) ?`)) return
    setTracking(prev => {
      const next = { ...prev }
      ids.forEach(id => { delete next[String(id)] })
      return next
    })
    const { error } = await supabase
      .from("prospection_finess_state")
      .delete()
      .eq("society_id", societyId)
      .in("pharmacy_id", ids.map(String))
    if (error) flash("Erreur: " + error.message, 4000)
    else flash("✓ Réinitialisé")
    setChecked(new Set())
  }, [societyId])

  const syncTeam = useCallback(async () => {
    if (!societyId) return
    setSyncing(true)
    try {
      await loadTracking()
      flash("✓ Synchronisé")
    } finally {
      setSyncing(false)
    }
  }, [societyId, loadTracking])

  const regions = useMemo(() => [...new Set(pharmacies.map(p => p.region).filter(Boolean))].sort(), [pharmacies])
  const depts = useMemo(() => {
    const list = pharmacies.filter(p => !fRegion || p.region === fRegion)
    return [...new Set(list.map(p => p.dept).filter(Boolean))].sort()
  }, [pharmacies, fRegion])
  const villes = useMemo(() => {
    const list = pharmacies.filter(p => {
      if (fRegion && p.region !== fRegion) return false
      if (fDept && p.dept !== fDept) return false
      return true
    })
    return [...new Set(list.map(p => p.ville).filter(Boolean))].sort().slice(0, 400)
  }, [pharmacies, fRegion, fDept])

  const today = new Date().toISOString().slice(0, 10)
  const getTrack = useCallback((id: string) => tracking[String(id)] || EMPTY, [tracking])

  const stats = useMemo(() => {
    const s: Record<string, number> = {}
    STATUTS.forEach(st => { s[st.id] = 0 })
    pharmacies.forEach(p => {
      const st = tracking[String(p.id)]?.statut || "a_contacter"
      s[st] = (s[st] || 0) + 1
    })
    const rappelDue = Object.values(tracking).filter(t => t.rappel && t.rappel <= today && t.statut === "a_rappeler").length
    return { ...s, rappelDue, total: pharmacies.length }
  }, [pharmacies, tracking, today])

  const filtered = useMemo(() => {
    return pharmacies.filter(p => {
      const t = getTrack(p.id)
      if (fRegion && p.region !== fRegion) return false
      if (fDept && p.dept !== fDept) return false
      if (fVille && p.ville !== fVille) return false
      if (fPhone && !p.phone) return false
      if (fStatut !== "all" && t.statut !== fStatut) return false
      if (fPriorite !== "all" && t.priorite !== fPriorite) return false
      if (fRappel && !(t.rappel && t.rappel <= today)) return false
      if (search) {
        const q = search.toLowerCase()
        const blob = `${p.name} ${p.ville} ${p.cp} ${p.phone || ""} ${t.notes || ""} ${t.contact || ""}`.toLowerCase()
        if (!blob.includes(q)) return false
      }
      return true
    })
  }, [pharmacies, getTrack, fRegion, fDept, fVille, fPhone, fStatut, fPriorite, fRappel, search, today])

  const paginated = useMemo(() => filtered.slice(0, page * PAGE), [filtered, page])
  const checkedArr = useMemo(() => Array.from(checked), [checked])

  const toggleCheck = (id: string) => {
    const pid = String(id)
    setChecked(prev => {
      const next = new Set(prev)
      if (next.has(pid)) next.delete(pid)
      else next.add(pid)
      return next
    })
  }

  const toggleCheckAllVisible = () => {
    const ids = paginated.map(p => String(p.id))
    const all = ids.every(id => checked.has(id))
    setChecked(prev => {
      const next = new Set(prev)
      if (all) ids.forEach(id => next.delete(id))
      else ids.forEach(id => next.add(id))
      return next
    })
  }

  const getLot = useCallback(() => {
    return pharmacies.filter(p => {
      if (lotDept && p.dept !== lotDept) return false
      if (lotRegion && p.region !== lotRegion) return false
      if (lotVille && !(p.ville || "").toLowerCase().includes(lotVille.toLowerCase())) return false
      if (lotPhone && !p.phone) return false
      const t = tracking[String(p.id)]
      return !t || t.statut === "a_contacter"
    }).slice(0, lotQty)
  }, [pharmacies, tracking, lotDept, lotRegion, lotVille, lotPhone, lotQty])

  const previewLot = () => { setLotResults(getLot()); setLotMode("preview") }

  const confirmLot = async () => {
    setLotLoading(true)
    const picked = lotMode === "preview" ? lotResults : getLot()
    if (!picked.length) { setLotMode("idle"); setLotLoading(false); return }
    const who = [profile?.prenom, profile?.nom].filter(Boolean).join(" ") || profile?.email || ""
    await bulkUpdate(picked.map(p => String(p.id)), { statut: "contacte", contact: who })
    setLotResults(picked)
    setLotMode("picked")
    setLotLoading(false)
  }

  const exportCSV = () => {
    const rows = [["Nom", "Ville", "CP", "Dept", "Région", "Téléphone", "Statut", "Priorité", "Contact", "Rappel", "Notes"]]
    filtered.forEach(p => {
      const t = getTrack(p.id)
      rows.push([
        p.name, p.ville, p.cp, p.dept, p.region, p.phone || "",
        STATUTS.find(s => s.id === t.statut)?.label || t.statut,
        t.priorite, t.contact, t.rappel, (t.notes || "").replace(/\n/g, " "),
      ])
    })
    const a = document.createElement("a")
    a.href = "data:text/csv;charset=utf-8," + encodeURIComponent(rows.map(r => r.join(";")).join("\n"))
    a.download = `prospection_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
  }

  const resetFilters = () => {
    setSearch(""); setFRegion(""); setFDept(""); setFVille("")
    setFStatut("all"); setFPriorite("all"); setFPhone(false); setFRappel(false); setPage(1)
  }

  const selTrack = selected ? getTrack(selected.id) : null

  return (
    <div className="h-full flex bg-[#0a0a0a] overflow-hidden">
      <div className={`flex-1 flex flex-col min-w-0 ${selected ? "hidden lg:flex" : ""}`}>
        <div className="shrink-0 border-b border-zinc-800/70 px-5 py-4 space-y-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h1 className="text-xl font-bold text-white">Prospection</h1>
              <p className="text-xs text-zinc-500 mt-0.5">
                {filtered.length.toLocaleString("fr-FR")} pharmacie{filtered.length > 1 ? "s" : ""}
                {!societyId && <span className="text-rose-400 ml-2">· Pas de société !</span>}
                {statusMsg && (
                  <span className={`ml-2 ${statusMsg.startsWith("Erreur") || statusMsg.startsWith("Pas") ? "text-rose-400" : "text-emerald-400"}`}>
                    · {statusMsg}
                  </span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={syncTeam} disabled={syncing}
                className="h-8 px-3 rounded-lg text-xs text-zinc-400 border border-zinc-800 hover:text-white hover:bg-zinc-800 disabled:opacity-40">
                {syncing ? "…" : "↻ Sync"}
              </button>
              <button onClick={exportCSV}
                className="h-8 px-3 rounded-lg text-xs text-zinc-400 border border-zinc-800 hover:text-white hover:bg-zinc-800">↓ CSV</button>
              <button onClick={() => setShowLot(true)}
                className="h-8 px-3 rounded-lg text-xs font-semibold text-black" style={{ background: ACCENT }}>Lot</button>
            </div>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
            {STATUTS.map(st => (
              <button key={st.id}
                onClick={() => { setFStatut(fStatut === st.id ? "all" : st.id); setPage(1) }}
                className={`rounded-xl border p-2 text-left transition ${fStatut === st.id ? "ring-1 ring-white/20" : "border-zinc-800/80 bg-zinc-900/50"}`}
                style={fStatut === st.id ? { background: st.color + "22", borderColor: st.color + "55" } : {}}>
                <p className="text-[10px] text-zinc-500 truncate">{st.label}</p>
                <p className="text-sm font-bold" style={{ color: st.color }}>{(stats as any)[st.id] || 0}</p>
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[140px] max-w-xs">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">⌕</span>
              <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
                placeholder="Nom, ville, tél…"
                className="w-full h-9 bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-3 text-sm text-white placeholder-zinc-600 focus:outline-none" />
            </div>
            <select value={fRegion} onChange={e => { setFRegion(e.target.value); setFDept(""); setFVille(""); setPage(1) }}
              className="h-9 bg-zinc-900 border border-zinc-800 rounded-lg px-2 text-xs text-zinc-300 max-w-[130px]">
              <option value="">Région</option>
              {regions.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <select value={fDept} onChange={e => { setFDept(e.target.value); setFVille(""); setPage(1) }}
              className="h-9 bg-zinc-900 border border-zinc-800 rounded-lg px-2 text-xs text-zinc-300 max-w-[90px]">
              <option value="">Dépt</option>
              {depts.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <select value={fVille} onChange={e => { setFVille(e.target.value); setPage(1) }}
              className="h-9 bg-zinc-900 border border-zinc-800 rounded-lg px-2 text-xs text-zinc-300 max-w-[120px]">
              <option value="">Ville</option>
              {villes.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
            <select value={fPriorite} onChange={e => { setFPriorite(e.target.value); setPage(1) }}
              className="h-9 bg-zinc-900 border border-zinc-800 rounded-lg px-2 text-xs text-zinc-300">
              <option value="all">Priorité</option>
              {PRIORITES.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
            </select>
            <button onClick={() => { setFPhone(p => !p); setPage(1) }}
              className={`h-9 px-2.5 rounded-lg text-xs border ${fPhone ? "text-black border-transparent" : "text-zinc-500 border-zinc-800"}`}
              style={fPhone ? { background: ACCENT } : {}}>📞 Tél</button>
            <button onClick={() => { setFRappel(p => !p); setPage(1) }}
              className={`h-9 px-2.5 rounded-lg text-xs border ${fRappel ? "bg-orange-500/20 text-orange-400 border-orange-500/40" : "text-zinc-500 border-zinc-800"}`}>
              🔔 Rappels {stats.rappelDue > 0 ? `(${stats.rappelDue})` : ""}
            </button>
            {(search || fRegion || fDept || fVille || fStatut !== "all" || fPriorite !== "all" || fPhone || fRappel) && (
              <button onClick={resetFilters} className="h-9 px-2 text-xs text-zinc-500 hover:text-white">Reset</button>
            )}
          </div>
        </div>

        {checked.size > 0 && (
          <div className="shrink-0 px-5 py-2.5 bg-zinc-900/90 border-b border-zinc-800 flex flex-wrap items-center gap-2">
            <span className="text-xs text-zinc-400 font-medium">{checked.size} sélectionnée{checked.size > 1 ? "s" : ""}</span>
            <select defaultValue="" onChange={e => { if (e.target.value) { bulkUpdate(checkedArr, { statut: e.target.value as any }); e.target.value = "" } }}
              className="h-8 bg-zinc-800 border border-zinc-700 rounded-lg px-2 text-xs text-white">
              <option value="">Statut…</option>
              {STATUTS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
            <select defaultValue="" onChange={e => { if (e.target.value) { bulkUpdate(checkedArr, { priorite: e.target.value }); e.target.value = "" } }}
              className="h-8 bg-zinc-800 border border-zinc-700 rounded-lg px-2 text-xs text-white">
              <option value="">Priorité…</option>
              {PRIORITES.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
            </select>
            <button onClick={() => bulkUpdate(checkedArr, {
              statut: "contacte",
              contact: [profile?.prenom, profile?.nom].filter(Boolean).join(" ") || profile?.email || "",
            })} className="h-8 px-2.5 rounded-lg text-xs font-medium text-black" style={{ background: ACCENT }}>→ Contacté</button>
            <button onClick={() => bulkReset(checkedArr)}
              className="h-8 px-2.5 rounded-lg text-xs text-rose-400 border border-rose-500/30 hover:bg-rose-500/10">Réinitialiser</button>
            <button onClick={() => setChecked(new Set())} className="h-8 px-2 text-xs text-zinc-500 hover:text-white ml-auto">Désélectionner</button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: ACCENT }} />
            </div>
          ) : paginated.length === 0 ? (
            <div className="text-center py-20 text-sm text-zinc-500">Aucune pharmacie trouvée</div>
          ) : (
            <>
              <div className="sticky top-0 z-10 bg-[#0a0a0a]/95 backdrop-blur-sm px-5 py-1.5 border-b border-zinc-800/50 flex items-center gap-3">
                <input type="checkbox"
                  checked={paginated.length > 0 && paginated.every(p => checked.has(String(p.id)))}
                  onChange={toggleCheckAllVisible}
                  className="w-3.5 h-3.5 rounded accent-yellow-500 cursor-pointer" />
                <span className="text-[11px] text-zinc-600">Tout sélectionner (page)</span>
              </div>
              <div className="divide-y divide-zinc-800/40">
                {paginated.map(p => {
                  const t = getTrack(p.id)
                  const st = STATUTS.find(s => s.id === t.statut) || STATUTS[0]
                  const active = selected?.id === p.id
                  const isChecked = checked.has(String(p.id))
                  const rappelDue = t.rappel && t.rappel <= today
                  return (
                    <div key={p.id} className={`flex items-center gap-2.5 px-5 py-2.5 transition ${active ? "bg-zinc-900" : isChecked ? "bg-zinc-900/40" : "hover:bg-zinc-900/50"}`}>
                      <input type="checkbox" checked={isChecked} onChange={() => toggleCheck(p.id)}
                        onClick={e => e.stopPropagation()}
                        className="w-3.5 h-3.5 rounded accent-yellow-500 cursor-pointer shrink-0" />
                      <button onClick={() => setSelected(p)} className="flex-1 flex items-center gap-3 text-left min-w-0">
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ background: st.color }} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-white truncate">{p.name}</p>
                            {rappelDue && <span className="text-[10px] text-orange-400">🔔</span>}
                            {t.priorite === "urgente" && <span className="text-[10px] text-rose-400 font-bold">!</span>}
                          </div>
                          <p className="text-[11px] text-zinc-500 truncate">
                            {p.ville}{p.cp ? ` (${p.cp})` : ""} · {p.dept}{p.phone ? ` · ${p.phone}` : ""}
                          </p>
                        </div>
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0"
                          style={{ color: st.color, background: st.color + "22" }}>{st.label}</span>
                      </button>
                    </div>
                  )
                })}
              </div>
            </>
          )}
          {paginated.length < filtered.length && (
            <div className="p-4 text-center">
              <button onClick={() => setPage(p => p + 1)}
                className="h-9 px-5 rounded-xl text-sm text-zinc-400 border border-zinc-800 hover:text-white hover:bg-zinc-800">
                Charger plus ({filtered.length - paginated.length})
              </button>
            </div>
          )}
        </div>
      </div>

      {selected && selTrack && (
        <div className="w-full lg:w-[400px] xl:w-[440px] border-l border-zinc-800 bg-[#0c0c0e] flex flex-col shrink-0 h-full">
          <div className="px-5 py-4 border-b border-zinc-800 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-base font-bold text-white leading-snug">{selected.name}</h2>
              <p className="text-xs text-zinc-500 mt-1">{selected.address && `${selected.address}, `}{selected.cp} {selected.ville}</p>
            </div>
            <button onClick={() => setSelected(null)} className="text-zinc-500 hover:text-white shrink-0">✕</button>
          </div>
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            <div className="flex flex-wrap gap-2">
              {selected.phone && (
                <a href={`tel:${selected.phone}`} className="h-9 px-3 rounded-xl text-xs font-semibold text-black flex items-center gap-1.5" style={{ background: ACCENT }}>
                  📞 {selected.phone}
                </a>
              )}
              {selected.lat && selected.lon && (
                <a href={`https://www.google.com/maps?q=${selected.lat},${selected.lon}`} target="_blank" rel="noreferrer"
                  className="h-9 px-3 rounded-xl text-xs text-zinc-300 bg-zinc-900 border border-zinc-800 hover:text-white flex items-center">🗺️ Maps</a>
              )}
            </div>
            {selected.hours && <p className="text-xs text-zinc-500">🕐 {selected.hours}</p>}

            <div>
              <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-2">Statut</p>
              <div className="grid grid-cols-2 gap-1.5">
                {STATUTS.map(st => (
                  <button key={st.id} onClick={() => updateEntry(selected.id, { statut: st.id })}
                    className={`h-9 rounded-lg text-xs font-medium border transition ${selTrack.statut === st.id ? "text-black border-transparent" : "text-zinc-400 border-zinc-800 hover:border-zinc-600"}`}
                    style={selTrack.statut === st.id ? { background: st.color } : {}}>{st.label}</button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-2">Priorité</p>
              <div className="flex gap-1.5">
                {PRIORITES.map(pr => (
                  <button key={pr.id} onClick={() => updateEntry(selected.id, { priorite: pr.id })}
                    className={`flex-1 h-8 rounded-lg text-xs border transition ${selTrack.priorite === pr.id ? "border-zinc-500 bg-zinc-800 text-white" : "border-zinc-800 text-zinc-500 hover:text-zinc-300"}`}>
                    {pr.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[11px] text-zinc-500 mb-1">Contacté par</p>
                <input value={selTrack.contact}
                  onChange={e => updateEntry(selected.id, { contact: e.target.value })}
                  placeholder="Nom…" className="w-full h-9 bg-zinc-900 border border-zinc-800 rounded-lg px-3 text-sm text-white focus:outline-none" />
              </div>
              <div>
                <p className="text-[11px] text-zinc-500 mb-1">Rappel le</p>
                <input type="date" value={selTrack.rappel || ""}
                  onChange={e => updateEntry(selected.id, { rappel: e.target.value })}
                  className="w-full h-9 bg-zinc-900 border border-zinc-800 rounded-lg px-3 text-sm text-white focus:outline-none" />
              </div>
            </div>

            <div>
              <p className="text-[11px] text-zinc-500 mb-1">Notes</p>
              <textarea value={selTrack.notes}
                onChange={e => updateEntry(selected.id, { notes: e.target.value }, true)}
                rows={5} placeholder="Compte-rendu d’appel…"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none resize-none leading-relaxed" />
            </div>

            {selTrack.updatedAt && (
              <p className="text-[10px] text-zinc-600">MAJ {new Date(selTrack.updatedAt).toLocaleString("fr-FR")}</p>
            )}

            <button onClick={() => { if (confirm("Réinitialiser le suivi ?")) { bulkReset([String(selected.id)]); setSelected(null) } }}
              className="w-full h-9 rounded-lg text-xs text-rose-400 border border-rose-500/30 hover:bg-rose-500/10">
              Réinitialiser le suivi
            </button>
          </div>
        </div>
      )}

      {showLot && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-[#18181b] border border-zinc-700 rounded-2xl w-full max-w-lg max-h-[85vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
              <div>
                <h2 className="text-base font-semibold text-white">Lot de prospection</h2>
                <p className="text-xs text-zinc-500">Pioche des « À contacter »</p>
              </div>
              <button onClick={() => { setShowLot(false); setLotMode("idle"); setLotResults([]) }} className="text-zinc-500 hover:text-white">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {lotMode !== "picked" ? (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] text-zinc-500">Région</label>
                      <select value={lotRegion} onChange={e => setLotRegion(e.target.value)}
                        className="w-full h-9 mt-1 bg-zinc-900 border border-zinc-700 rounded-lg px-2 text-xs text-white">
                        <option value="">Toutes</option>
                        {regions.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] text-zinc-500">Département</label>
                      <select value={lotDept} onChange={e => setLotDept(e.target.value)}
                        className="w-full h-9 mt-1 bg-zinc-900 border border-zinc-700 rounded-lg px-2 text-xs text-white">
                        <option value="">Tous</option>
                        {[...new Set(pharmacies.filter(p => !lotRegion || p.region === lotRegion).map(p => p.dept))].sort().map(d => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] text-zinc-500">Ville</label>
                      <input value={lotVille} onChange={e => setLotVille(e.target.value)}
                        className="w-full h-9 mt-1 bg-zinc-900 border border-zinc-700 rounded-lg px-3 text-xs text-white" />
                    </div>
                    <div>
                      <label className="text-[11px] text-zinc-500">Quantité</label>
                      <input type="number" min={5} max={100} value={lotQty} onChange={e => setLotQty(Number(e.target.value) || 30)}
                        className="w-full h-9 mt-1 bg-zinc-900 border border-zinc-700 rounded-lg px-3 text-xs text-white" />
                    </div>
                  </div>
                  <label className="flex items-center gap-2 text-xs text-zinc-400 cursor-pointer">
                    <input type="checkbox" checked={lotPhone} onChange={e => setLotPhone(e.target.checked)} className="accent-yellow-500" />
                    Uniquement avec téléphone
                  </label>
                  {lotMode === "preview" && (
                    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-3 max-h-48 overflow-y-auto space-y-1">
                      <p className="text-xs text-zinc-500 mb-2">{lotResults.length} trouvée(s)</p>
                      {lotResults.map(p => (
                        <p key={p.id} className="text-xs text-zinc-300 truncate">{p.name} — {p.ville}</p>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-6">
                  <p className="text-3xl mb-2">✅</p>
                  <p className="text-sm text-white font-medium">{lotResults.length} passées en « Contacté »</p>
                </div>
              )}
            </div>
            <div className="px-5 py-4 border-t border-zinc-800 flex gap-2">
              {lotMode === "picked" ? (
                <button onClick={() => { setShowLot(false); setLotMode("idle"); setLotResults([]); setFStatut("contacte") }}
                  className="flex-1 h-10 rounded-xl text-sm font-bold text-black" style={{ background: ACCENT }}>Voir les contactées</button>
              ) : (
                <>
                  <button onClick={previewLot} className="flex-1 h-10 rounded-xl text-sm text-zinc-300 bg-zinc-800">Prévisualiser</button>
                  <button onClick={confirmLot} disabled={lotLoading || (lotMode === "preview" && lotResults.length === 0)}
                    className="flex-1 h-10 rounded-xl text-sm font-bold text-black disabled:opacity-40" style={{ background: ACCENT }}>
                    {lotLoading ? "…" : "Prendre le lot"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}