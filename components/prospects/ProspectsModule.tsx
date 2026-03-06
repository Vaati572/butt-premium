"use client"

import { useEffect, useState, useRef } from "react"
import { supabase } from "@/lib/supabase"
import {
  Plus, X, Search, MapPin, Eye, Phone, Mail, Building2,
  ChevronDown, Check, Pencil, Trash2, Map,
  User, Calendar, Tag, Filter
} from "lucide-react"

interface Props {
  activeSociety: any
  profile: any
  onShowOnMap?: (prospect: Prospect) => void
  onSwitchToMap?: () => void
  onSwitchToTournees?: () => void
}

export interface Prospect {
  id: string
  nom: string
  entreprise: string
  poste: string
  tel: string
  email: string
  adresse: string
  cp: string
  ville: string
  latitude: number | null
  longitude: number | null
  statut: string
  priorite: string
  source: string
  notes: string
  prochaine_action: string
  prochaine_action_date: string
  tags: string[]
  assigned_to: string | null
  created_at: string
}

const STATUTS = [
  { id: "a_faire",   label: "À faire",    color: "#3b82f6", bg: "#3b82f610", dot: "bg-blue-500"   },
  { id: "demarchee", label: "Démarchée",  color: "#f97316", bg: "#f9731610", dot: "bg-orange-500" },
  { id: "attente",   label: "En attente", color: "#eab308", bg: "#eab30810", dot: "bg-yellow-500" },
  { id: "converti",  label: "Converti",   color: "#22c55e", bg: "#22c55e10", dot: "bg-green-500"  },
  { id: "perdu",     label: "Perdu",      color: "#ef4444", bg: "#ef444410", dot: "bg-red-500"    },
]

const PRIORITES = [
  { id: "basse",   label: "Basse",   color: "#71717a" },
  { id: "normale", label: "Normale", color: "#3b82f6" },
  { id: "haute",   label: "Haute",   color: "#f97316" },
  { id: "urgente", label: "Urgente", color: "#ef4444" },
]

const SOURCES = ["Tatouage", "Esthétique", "Pharmacie", "Autre"]

const EMPTY: Omit<Prospect, "id" | "created_at"> & { source_autre?: string } = {
  nom: "", entreprise: "", poste: "", tel: "", email: "",
  adresse: "", cp: "", ville: "", latitude: null, longitude: null,
  statut: "a_faire", priorite: "normale", source: "", notes: "",
  prochaine_action: "", prochaine_action_date: "", tags: [], assigned_to: null,
  source_autre: "",
}

export default function ProspectsModule({ activeSociety, profile, onShowOnMap, onSwitchToMap, onSwitchToTournees }: Props) {
  const [prospects, setProspects] = useState<Prospect[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filterStatut, setFilterStatut] = useState("tous")
  const [filterSource, setFilterSource] = useState("tous")
  const [filterPriorite, setFilterPriorite] = useState("tous")
  const [filterVille, setFilterVille] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Prospect | null>(null)
  const [viewing, setViewing] = useState<Prospect | null>(null)
  const [form, setForm] = useState({ ...EMPTY })
  const [saving, setSaving] = useState(false)
  const [geocoding, setGeocoding] = useState(false)
  const [tagInput, setTagInput] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [tourMode, setTourMode] = useState(false)
  const [tourSelected, setTourSelected] = useState<Set<string>>(new Set())
  const [showTourForm, setShowTourForm] = useState(false)
  const [tourForm, setTourForm] = useState({ nom: "", date: "", mode: "prospect" as "prospect" | "livraison", notes: "" })
  const [savingTour, setSavingTour] = useState(false)
  const [homeAddress, setHomeAddress] = useState("")
  const [convertingToClient, setConvertingToClient] = useState(false)

  useEffect(() => { load() }, [activeSociety])

  useEffect(() => {
    supabase.from("profiles").select("adresse_depart").eq("id", profile.id).single()
      .then(({ data }) => { if (data?.adresse_depart) setHomeAddress(data.adresse_depart) })
  }, [profile])

  const load = async () => {
    setLoading(true)
    const { data } = await supabase.from("prospects")
      .select("*").eq("society_id", activeSociety.id)
      .order("created_at", { ascending: false })
    setProspects(data || [])
    setLoading(false)
  }

  const geocodeAddress = async () => {
    if (!form.adresse && !form.ville) return
    setGeocoding(true)
    const query = [form.adresse, form.cp, form.ville].filter(Boolean).join(", ")
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`)
      const data = await res.json()
      if (data?.[0]) {
        setForm(f => ({ ...f, latitude: parseFloat(data[0].lat), longitude: parseFloat(data[0].lon) }))
      }
    } catch {}
    setGeocoding(false)
  }

  const openCreate = () => { setForm({ ...EMPTY }); setEditing(null); setShowForm(true) }
  const openEdit = (p: Prospect) => { setForm({ ...p }); setEditing(p); setShowForm(true) }

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.nom.trim()) e.nom = "Le nom est obligatoire"
    if (!form.adresse.trim()) e.adresse = "L'adresse est obligatoire"
    if (!form.statut) e.statut = "Le statut est obligatoire"
    if (!form.priorite) e.priorite = "La priorité est obligatoire"
    if (!form.source) e.source = "La source est obligatoire"
    if (form.source === "Autre" && !form.source_autre?.trim()) e.source_autre = "Précisez la source"
    if (!form.prochaine_action_date) e.prochaine_action_date = "La date est obligatoire"
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const save = async () => {
    if (!validate()) return
    setSaving(true)
    // Strip source_autre (not a DB column) and build clean payload
    const { source_autre, ...cleanForm } = form as any
    // If source is "Autre", store the custom text in source field
    const payload = {
      ...cleanForm,
      source: source_autre?.trim() ? `Autre: ${source_autre}` : cleanForm.source,
      society_id: activeSociety.id,
    }
    if (editing) {
      const { error } = await supabase.from("prospects").update({ ...payload, updated_at: new Date().toISOString() }).eq("id", editing.id)
      if (error) { console.error("Update error:", error); setSaving(false); return }
    } else {
      const { error } = await supabase.from("prospects").insert({ ...payload, assigned_to: profile.id })
      if (error) { console.error("Insert error:", error); setSaving(false); return }
    }
    setSaving(false)
    setShowForm(false)
    setViewing(null)
    load()
  }

  const remove = async (id: string) => {
    if (!confirm("Supprimer ce prospect ?")) return
    await supabase.from("prospects").delete().eq("id", id)
    if (viewing?.id === id) setViewing(null)
    load()
  }

  const updateStatut = async (id: string, statut: string) => {
    await supabase.from("prospects").update({ statut, updated_at: new Date().toISOString() }).eq("id", id)
    load()
    if (viewing?.id === id) setViewing(v => v ? { ...v, statut } : v)
  }

  const convertToClient = async (p: Prospect) => {
    if (!confirm(`Créer une fiche client pour ${p.nom} et supprimer ce prospect ?`)) return
    setConvertingToClient(true)
    // Create client
    const { error } = await supabase.from("clients").insert({
      nom: p.nom,
      telephone: p.tel || "",
      email: p.email || "",
      adresse: p.adresse || "",
      cp: p.cp || "",
      ville: p.ville || "",
      notes: p.notes || "",
      society_id: activeSociety.id,
      contrat: "Prospect converti",
    })
    if (error) { alert("Erreur: " + error.message); setConvertingToClient(false); return }
    // Delete prospect
    await supabase.from("prospects").delete().eq("id", p.id)
    setConvertingToClient(false)
    setViewing(null)
    load()
    alert(`✅ Fiche client créée pour ${p.nom}`)
  }

  const sendToMap = (p: Prospect) => {
    if (onShowOnMap) onShowOnMap(p)
    if (onSwitchToMap) onSwitchToMap()
  }

  const toggleTourSelect = (id: string) => {
    setTourSelected(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n })
  }

  const saveTournee = async (goToMap: boolean) => {
    if (tourSelected.size === 0 || !tourForm.nom.trim()) return
    setSavingTour(true)

    const selectedProspects = prospects.filter(p => tourSelected.has(p.id))
    
    // Sort by heure if livraison mode (user sets hours after creation)
    const etapes = selectedProspects.map(p => ({
      prospect_id: p.id, nom: p.nom, adresse: p.adresse, ville: p.ville,
      latitude: p.latitude, longitude: p.longitude,
      heure: "", notes: "", fait: false
    }))

    // Estimate distance (rough haversine sum)
    let distKm = 0
    for (let i = 0; i < etapes.length - 1; i++) {
      const a = etapes[i]; const b = etapes[i + 1]
      if (a.latitude && b.latitude) {
        const R = 6371, dLat = (b.latitude - a.latitude) * Math.PI / 180, dLng = (b.longitude! - a.longitude!) * Math.PI / 180
        const x = Math.sin(dLat/2)**2 + Math.cos(a.latitude*Math.PI/180)*Math.cos(b.latitude*Math.PI/180)*Math.sin(dLng/2)**2
        distKm += R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1-x))
      }
    }

    const { data: saved } = await supabase.from("tournees").insert({
      nom: tourForm.nom, mode: tourForm.mode, statut: "planifiee",
      date_tournee: tourForm.date || null, adresse_depart: homeAddress,
      etapes, distance_km: Math.round(distKm) || null,
      duree_min: distKm > 0 ? Math.round(distKm / 60 * 60) : null,
      notes: tourForm.notes, society_id: activeSociety.id, user_id: profile.id
    }).select().single()

    setSavingTour(false)
    setShowTourForm(false)
    setTourMode(false)
    setTourSelected(new Set())
    setTourForm({ nom: "", date: "", mode: "prospect", notes: "" })

    if (goToMap && saved && onSwitchToMap) onSwitchToMap()
    else if (!goToMap && onSwitchToTournees) onSwitchToTournees()
  }

  const filtered = prospects.filter(p => {
    const matchSearch = !search || p.nom.toLowerCase().includes(search.toLowerCase()) ||
      p.entreprise.toLowerCase().includes(search.toLowerCase()) ||
      p.ville.toLowerCase().includes(search.toLowerCase())
    const matchStatut = filterStatut === "tous" || p.statut === filterStatut
    const matchSource = filterSource === "tous" || p.source === filterSource
    const matchPriorite = filterPriorite === "tous" || p.priorite === filterPriorite
    const matchVille = !filterVille.trim() || (p.ville || "").toLowerCase().includes(filterVille.toLowerCase())
    return matchSearch && matchStatut && matchSource && matchPriorite && matchVille
  })

  const counts = STATUTS.reduce((acc, s) => {
    acc[s.id] = prospects.filter(p => p.statut === s.id).length
    return acc
  }, {} as Record<string, number>)

  const statutCfg = (id: string) => STATUTS.find(s => s.id === id) || STATUTS[0]

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#0a0a0a]">

      {/* Header */}
      <div className="px-6 py-4 border-b border-zinc-900 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-white font-bold text-xl flex items-center gap-2">🎯 Prospects</h1>
          <p className="text-zinc-500 text-xs mt-0.5">{prospects.length} prospect{prospects.length > 1 ? "s" : ""}</p>
        </div>
        <div className="flex items-center gap-2">
          {onSwitchToMap && (
            <button onClick={onSwitchToMap}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium transition-colors border border-zinc-700">
              <Map size={14} /> Map
            </button>
          )}
          <button onClick={() => { setTourMode(!tourMode); setTourSelected(new Set()) }}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold transition-all border"
            style={tourMode ? { backgroundColor: "#eab30820", color: "#eab308", borderColor: "#eab30850" } : { backgroundColor: "#18181b", color: "#a1a1aa", borderColor: "#3f3f46" }}>
             {tourMode ? `${tourSelected.size} sélectionné${tourSelected.size > 1 ? "s" : ""}` : "Tournée"}
          </button>
          {tourMode && tourSelected.size > 0 && (
            <button onClick={() => setShowTourForm(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-black text-sm font-bold transition-colors"
              style={{ backgroundColor: "#eab308" }}>
              Créer tournée →
            </button>
          )}
          {!tourMode && (
            <button onClick={openCreate}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-black text-sm font-bold transition-colors"
              style={{ backgroundColor: "#eab308" }}>
              <Plus size={14} /> Nouveau
            </button>
          )}
        </div>
      </div>

      {/* Stats bar */}
      <div className="px-6 py-3 flex gap-2 overflow-x-auto border-b border-zinc-900">
        <button onClick={() => setFilterStatut("tous")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap border transition-all ${filterStatut === "tous" ? "bg-zinc-700 text-white border-zinc-600" : "border-zinc-800 text-zinc-500 hover:border-zinc-600"}`}>
          Tous · {prospects.length}
        </button>
        {STATUTS.map(s => (
          <button key={s.id} onClick={() => setFilterStatut(s.id)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap border transition-all"
            style={filterStatut === s.id
              ? { backgroundColor: s.color + "20", color: s.color, borderColor: s.color + "50" }
              : { borderColor: "#27272a", color: "#71717a" }}>
            <span className="mr-1">{counts[s.id] || 0}</span>{s.label}
          </button>
        ))}
      </div>

      {/* Search + Filtres */}
      <div className="px-6 py-3 border-b border-zinc-900 space-y-2">
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un prospect..."
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600" />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-6 h-6 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-4xl mb-3">🎯</p>
            <p className="text-zinc-400 font-semibold">Aucun prospect</p>
            <p className="text-zinc-600 text-sm mt-1">Créez votre premier prospect</p>
            <button onClick={openCreate} className="mt-4 px-4 py-2 rounded-xl text-black text-sm font-bold" style={{ backgroundColor: "#eab308" }}>
              + Nouveau prospect
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {filtered.map(p => {
              const sc = statutCfg(p.statut)
              const pc = PRIORITES.find(x => x.id === p.priorite)
              return (
                <div key={p.id}
                  onClick={() => { if (tourMode) toggleTourSelect(p.id) }}
                  className={`relative bg-zinc-900 border rounded-2xl p-4 transition-all group
                    ${tourMode
                      ? tourSelected.has(p.id)
                        ? "border-yellow-500 bg-yellow-500/5 cursor-pointer"
                        : "border-zinc-700 hover:border-yellow-500/50 cursor-pointer"
                      : "border-zinc-800 hover:border-zinc-700"
                    }`}>
                  {/* Checkbox tournée */}
                  {tourMode && (
                    <div className={`absolute top-3 right-3 w-6 h-6 rounded-full border-2 flex items-center justify-center z-10 transition-all
                      ${tourSelected.has(p.id) ? "bg-yellow-500 border-yellow-500" : "border-zinc-500 bg-zinc-800"}`}>
                      {tourSelected.has(p.id) && <Check size={12} className="text-black font-black" />}
                    </div>
                  )}
                  {/* Top row */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-white font-bold text-sm truncate">{p.nom}</span>
                        {p.priorite !== "normale" && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md shrink-0"
                            style={{ backgroundColor: pc?.color + "20", color: pc?.color }}>
                            {pc?.label}
                          </span>
                        )}
                      </div>
                      {p.entreprise && <p className="text-zinc-500 text-xs truncate flex items-center gap-1"><Building2 size={10} />{p.entreprise}</p>}
                    </div>
                    <span className="text-xs font-bold px-2 py-1 rounded-lg ml-2 shrink-0"
                      style={{ backgroundColor: sc.bg, color: sc.color }}>
                      {sc.label}
                    </span>
                  </div>

                  {/* Infos */}
                  <div className="space-y-1 mb-3">
                    {p.ville && (
                      <p className="text-zinc-500 text-xs flex items-center gap-1.5">
                        <MapPin size={10} className="shrink-0" />{p.cp ? `${p.cp} ` : ""}{p.ville}
                        {p.latitude && <span className="text-green-500 text-[10px] ml-1">📍</span>}
                      </p>
                    )}
                    {p.tel && <p className="text-zinc-500 text-xs flex items-center gap-1.5"><Phone size={10} />{p.tel}</p>}
                    {p.prochaine_action && (
                      <p className="text-yellow-500/80 text-xs flex items-center gap-1.5 truncate">
                        <Calendar size={10} className="shrink-0" />{p.prochaine_action}
                      </p>
                    )}
                  </div>

                  {/* Tags */}
                  {p.tags?.length > 0 && (
                    <div className="flex gap-1 flex-wrap mb-3">
                      {p.tags.slice(0, 3).map(t => (
                        <span key={t} className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-md">{t}</span>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 pt-3 border-t border-zinc-800" onClick={e => e.stopPropagation()}>
                    <button onClick={() => setViewing(p)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs transition-colors">
                      <Eye size={11} /> Voir
                    </button>
                    <button onClick={() => openEdit(p)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs transition-colors">
                      <Pencil size={11} /> Éditer
                    </button>
                    {p.latitude && (
                      <button onClick={() => sendToMap(p)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                        style={{ backgroundColor: "#3b82f620", color: "#3b82f6" }}>
                        <Map size={11} /> Map
                      </button>
                    )}
                    <button onClick={() => remove(p.id)}
                      className="ml-auto flex items-center justify-center w-7 h-7 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors opacity-0 group-hover:opacity-100">
                      <Trash2 size={11} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── FICHE DÉTAIL ────────────────────── */}
      {viewing && !showForm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111111] border border-zinc-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-y-auto max-h-[90vh]">
            {/* Header fiche */}
            <div className="flex items-center justify-between p-5 border-b border-zinc-800">
              <div>
                <h2 className="text-white font-bold text-lg">{viewing.nom}</h2>
                {viewing.entreprise && <p className="text-zinc-500 text-sm">{viewing.entreprise}</p>}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => openEdit(viewing)} className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white transition-colors">
                  <Pencil size={13} />
                </button>
                <button onClick={() => setViewing(null)} className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white transition-colors">
                  <X size={13} />
                </button>
              </div>
            </div>

            <div className="p-5 space-y-4">
              {/* Statut selector */}
              <div>
                <p className="text-zinc-500 text-[11px] uppercase tracking-wider mb-2">Statut</p>
                <div className="flex gap-2 flex-wrap">
                  {STATUTS.map(s => (
                    <button key={s.id} onClick={() => updateStatut(viewing.id, s.id)}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold border transition-all"
                      style={viewing.statut === s.id
                        ? { backgroundColor: s.color + "20", color: s.color, borderColor: s.color + "50" }
                        : { borderColor: "#27272a", color: "#71717a" }}>
                      {viewing.statut === s.id && "✓ "}{s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Infos */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Téléphone", value: viewing.tel, icon: "📞" },
                  { label: "Email", value: viewing.email, icon: "✉️" },
                  { label: "Poste", value: viewing.poste, icon: "👤" },
                  { label: "Source", value: viewing.source, icon: "📌" },
                  { label: "Priorité", value: PRIORITES.find(x => x.id === viewing.priorite)?.label, icon: "⚡" },
                  { label: "Ville", value: `${viewing.cp || ""} ${viewing.ville || ""}`.trim(), icon: "📍" },
                ].filter(x => x.value).map(({ label, value, icon }) => (
                  <div key={label} className="bg-zinc-900 rounded-xl p-3">
                    <p className="text-zinc-600 text-[10px] uppercase tracking-wider mb-1">{icon} {label}</p>
                    <p className="text-zinc-200 text-sm font-medium">{value}</p>
                  </div>
                ))}
              </div>

              {/* Adresse */}
              {viewing.adresse && (
                <div className="bg-zinc-900 rounded-xl p-3">
                  <p className="text-zinc-600 text-[10px] uppercase tracking-wider mb-1">🏠 Adresse</p>
                  <p className="text-zinc-200 text-sm">{viewing.adresse}, {viewing.cp} {viewing.ville}</p>
                  {viewing.latitude ? (
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-green-400 text-[11px] font-semibold">📍 Géolocalisé</span>
                      <button onClick={() => sendToMap(viewing)}
                        className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg"
                        style={{ backgroundColor: "#3b82f620", color: "#3b82f6" }}>
                        <Map size={11} /> Voir sur la map
                      </button>
                    </div>
                  ) : (
                    <p className="text-zinc-600 text-[11px] mt-1">Non géolocalisé — éditer pour géolocaliser</p>
                  )}
                </div>
              )}

              {/* Prochaine action */}
              {viewing.prochaine_action && (
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3">
                  <p className="text-yellow-500/80 text-[10px] uppercase tracking-wider mb-1">⚡ Prochaine action</p>
                  <p className="text-yellow-200 text-sm">{viewing.prochaine_action}</p>
                  {viewing.prochaine_action_date && (
                    <p className="text-yellow-500/60 text-xs mt-1">{new Date(viewing.prochaine_action_date).toLocaleDateString("fr-FR")}</p>
                  )}
                </div>
              )}

              {/* Notes */}
              {viewing.notes && (
                <div className="bg-zinc-900 rounded-xl p-3">
                  <p className="text-zinc-600 text-[10px] uppercase tracking-wider mb-2">📝 Notes</p>
                  <p className="text-zinc-300 text-sm whitespace-pre-wrap">{viewing.notes}</p>
                </div>
              )}

              {/* Tags */}
              {viewing.tags?.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {viewing.tags.map(t => (
                    <span key={t} className="text-xs bg-zinc-800 text-zinc-400 px-3 py-1 rounded-lg">{t}</span>
                  ))}
                </div>
              )}

              {/* Convertir en client */}
              <div className="pt-2 border-t border-zinc-800">
                <button onClick={() => convertToClient(viewing)} disabled={convertingToClient}
                  className="w-full py-3 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2"
                  style={{ backgroundColor: "#22c55e20", color: "#22c55e", border: "1px solid #22c55e30" }}>
                  {convertingToClient ? "Création en cours..." : "✅ Créer fiche client → supprimer prospect"}
                </button>
                <p className="text-zinc-600 text-[10px] text-center mt-1.5">La fiche prospect sera supprimée après conversion</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── FORMULAIRE CRÉER TOURNÉE ──────────── */}
      {showTourForm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111111] border border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-zinc-800">
              <div>
                <h2 className="text-white font-bold">Créer une tournée</h2>
                <p className="text-zinc-500 text-xs mt-0.5">{tourSelected.size} prospect{tourSelected.size > 1 ? "s" : ""} sélectionné{tourSelected.size > 1 ? "s" : ""}</p>
              </div>
              <button onClick={() => setShowTourForm(false)} className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white"><X size={14} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div><label className="block text-zinc-500 text-[11px] uppercase tracking-wider mb-1.5">Nom de la tournée <span className="text-red-400">*</span></label>
                <input value={tourForm.nom} onChange={e => setTourForm(f => ({ ...f, nom: e.target.value }))} placeholder="Ex: Tournée Metz Nord" className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-500/60" /></div>
              <div><label className="block text-zinc-500 text-[11px] uppercase tracking-wider mb-1.5">Date</label>
                <input type="date" value={tourForm.date} onChange={e => setTourForm(f => ({ ...f, date: e.target.value }))} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-500/60" /></div>
              <div>
                <label className="block text-zinc-500 text-[11px] uppercase tracking-wider mb-2">Type de tournée</label>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => setTourForm(f => ({ ...f, mode: "prospect" }))} className={`py-3 rounded-xl text-sm font-bold border transition-all ${tourForm.mode === "prospect" ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/40" : "bg-zinc-800 text-zinc-400 border-zinc-700"}`}>🎯 Prospection</button>
                  <button onClick={() => setTourForm(f => ({ ...f, mode: "livraison" }))} className={`py-3 rounded-xl text-sm font-bold border transition-all flex flex-col items-center gap-0.5 ${tourForm.mode === "livraison" ? "bg-purple-500/20 text-purple-400 border-purple-500/40" : "bg-zinc-800 text-zinc-400 border-zinc-700"}`}>
                    🚛 Livraison
                    <span className="text-[10px] opacity-70">avec heures</span>
                  </button>
                </div>
                {tourForm.mode === "livraison" && <p className="text-zinc-600 text-[11px] mt-2">💡 Vous pourrez définir les heures de chaque arrêt dans l'onglet Tournées</p>}
              </div>
              {homeAddress && <div className="bg-green-500/10 border border-green-500/20 rounded-xl px-3 py-2.5"><p className="text-green-400 text-xs font-semibold">🏠 Départ: {homeAddress}</p></div>}
              <div><label className="block text-zinc-500 text-[11px] uppercase tracking-wider mb-1.5">Notes</label>
                <textarea value={tourForm.notes} onChange={e => setTourForm(f => ({ ...f, notes: e.target.value }))} rows={2} placeholder="Instructions..." className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-500/60 resize-none" /></div>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => saveTournee(true)} disabled={savingTour || !tourForm.nom.trim()} className="py-3 rounded-xl text-black font-bold text-sm bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"><Map size={14} /> Lancer sur Map</button>
                <button onClick={() => saveTournee(false)} disabled={savingTour || !tourForm.nom.trim()} className="py-3 rounded-xl font-bold text-sm border border-zinc-600 text-zinc-200 hover:bg-zinc-800 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">💾 Sauvegarder</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── FORMULAIRE CRÉATION/ÉDITION ─────── */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111111] border border-zinc-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between p-5 border-b border-zinc-800">
              <h2 className="text-white font-bold">{editing ? "Modifier le prospect" : "Nouveau prospect"}</h2>
              <button onClick={() => setShowForm(false)} className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white">
                <X size={14} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Identité */}
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-[11px] uppercase tracking-wider mb-1.5"><span className="text-zinc-500">Nom</span> <span className="text-red-400">*</span></label>
                  <input value={form.nom} onChange={e => { setForm(f => ({ ...f, nom: e.target.value })); setErrors(e => ({...e, nom: ""})) }}
                    placeholder="Nom du contact"
                    className={`w-full bg-zinc-800 border rounded-xl px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none ${errors.nom ? "border-red-500" : "border-zinc-700 focus:border-yellow-500/60"}`} />
                  {errors.nom && <p className="text-red-400 text-[10px] mt-1">⚠ {errors.nom}</p>}
                </div>
                <div>
                  <label className="block text-zinc-500 text-[11px] uppercase tracking-wider mb-1.5">Entreprise</label>
                  <input value={form.entreprise} onChange={e => setForm(f => ({ ...f, entreprise: e.target.value }))}
                    placeholder="Nom de la société"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-500/60" />
                </div>
                <div>
                  <label className="block text-zinc-500 text-[11px] uppercase tracking-wider mb-1.5">Poste</label>
                  <input value={form.poste} onChange={e => setForm(f => ({ ...f, poste: e.target.value }))}
                    placeholder="Directeur, Gérant..."
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-500/60" />
                </div>
                <div>
                  <label className="block text-zinc-500 text-[11px] uppercase tracking-wider mb-1.5">Téléphone</label>
                  <input value={form.tel} onChange={e => setForm(f => ({ ...f, tel: e.target.value }))}
                    placeholder="06 00 00 00 00"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-500/60" />
                </div>
                <div>
                  <label className="block text-zinc-500 text-[11px] uppercase tracking-wider mb-1.5">Email</label>
                  <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="email@exemple.com"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-500/60" />
                </div>
              </div>

              {/* Adresse + géocodage */}
              <div className="bg-zinc-900/50 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between mb-1">
  <label className="text-[11px] uppercase tracking-wider"><span className="text-zinc-500">Adresse</span> <span className="text-red-400">*</span></label>
                  <button onClick={geocodeAddress} disabled={geocoding}
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-lg transition-colors"
                    style={{ backgroundColor: "#3b82f620", color: "#3b82f6" }}>
                    {geocoding
                      ? <><div className="w-3 h-3 border border-blue-400 border-t-transparent rounded-full animate-spin" /> Géolocalisation...</>
                      : <><MapPin size={11} /> Géolocaliser</>}
                  </button>
                </div>
                <input value={form.adresse} onChange={e => { setForm(f => ({ ...f, adresse: e.target.value })); setErrors(e => ({...e, adresse: ""})) }}
                  placeholder="Rue, numéro..."
                  className={`w-full bg-zinc-800 border rounded-xl px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none ${errors.adresse ? "border-red-500" : "border-zinc-700 focus:border-yellow-500/60"}`} />
                {errors.adresse && <p className="text-red-400 text-[10px] mt-1">⚠ {errors.adresse}</p>}
                <div className="grid grid-cols-3 gap-2">
                  <input value={form.cp} onChange={e => setForm(f => ({ ...f, cp: e.target.value }))}
                    placeholder="Code postal"
                    className="bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-500/60" />
                  <input value={form.ville} onChange={e => setForm(f => ({ ...f, ville: e.target.value }))}
                    placeholder="Ville" className="col-span-2 bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-500/60" />
                </div>
                {form.latitude && (
                  <p className="text-green-400 text-[11px] font-semibold">✓ Géolocalisé : {form.latitude?.toFixed(4)}, {form.longitude?.toFixed(4)}</p>
                )}
              </div>

              {/* Statut + Priorité + Source */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] uppercase tracking-wider mb-1.5"><span className="text-zinc-500">Statut</span> <span className="text-red-400">*</span></label>
                  <select value={form.statut} onChange={e => setForm(f => ({ ...f, statut: e.target.value }))}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-500/60">
                    {STATUTS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] uppercase tracking-wider mb-1.5"><span className="text-zinc-500">Priorité</span> <span className="text-red-400">*</span></label>
                  <select value={form.priorite} onChange={e => setForm(f => ({ ...f, priorite: e.target.value }))}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-500/60">
                    {PRIORITES.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] uppercase tracking-wider mb-1.5"><span className="text-zinc-500">Source</span> <span className="text-red-400">*</span></label>
                  <select value={form.source} onChange={e => { setForm(f => ({ ...f, source: e.target.value, source_autre: "" })); setErrors(e => ({...e, source: ""})) }}
                    className={`w-full bg-zinc-800 border rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none ${errors.source ? "border-red-500" : "border-zinc-700 focus:border-yellow-500/60"}`}>
                    <option value="">— Choisir —</option>
                    {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  {errors.source && <p className="text-red-400 text-[10px] mt-1">⚠ {errors.source}</p>}
                  {form.source === "Autre" && (
                    <input value={(form as any).source_autre || ""} onChange={e => { setForm(f => ({ ...f, source_autre: e.target.value } as any)); setErrors(e => ({...e, source_autre: ""})) }}
                      placeholder="Précisez la source..."
                      className={`w-full mt-2 bg-zinc-800 border rounded-xl px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none ${errors.source_autre ? "border-red-500" : "border-zinc-700 focus:border-yellow-500/60"}`} />
                  )}
                  {errors.source_autre && <p className="text-red-400 text-[10px] mt-1">⚠ {errors.source_autre}</p>}
                </div>
              </div>

              {/* Prochaine action */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-500 text-[11px] uppercase tracking-wider mb-1.5">Prochaine action</label>
                  <input value={form.prochaine_action} onChange={e => setForm(f => ({ ...f, prochaine_action: e.target.value }))}
                    placeholder="Rappeler, Envoyer devis..."
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-500/60" />
                </div>
                <div>
                  <label className="block text-[11px] uppercase tracking-wider mb-1.5"><span className="text-zinc-500">Date</span> <span className="text-red-400">*</span></label>
                  <input type="date" value={form.prochaine_action_date} onChange={e => { setForm(f => ({ ...f, prochaine_action_date: e.target.value })); setErrors(e => ({...e, prochaine_action_date: ""})) }}
                    className={`w-full bg-zinc-800 border rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none ${errors.prochaine_action_date ? "border-red-500" : "border-zinc-700 focus:border-yellow-500/60"}`} />
                  {errors.prochaine_action_date && <p className="text-red-400 text-[10px] mt-1">⚠ {errors.prochaine_action_date}</p>}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-zinc-500 text-[11px] uppercase tracking-wider mb-1.5">Notes</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  rows={3} placeholder="Informations importantes, historique..."
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-500/60 resize-none" />
              </div>

              {/* Tags */}
              <div>
                <label className="block text-zinc-500 text-[11px] uppercase tracking-wider mb-1.5">Tags</label>
                <div className="flex gap-2 flex-wrap mb-2">
                  {form.tags.map(t => (
                    <span key={t} className="flex items-center gap-1 text-xs bg-zinc-800 text-zinc-300 px-2.5 py-1 rounded-lg">
                      {t}
                      <button onClick={() => setForm(f => ({ ...f, tags: f.tags.filter(x => x !== t) }))} className="text-zinc-500 hover:text-red-400">×</button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input value={tagInput} onChange={e => setTagInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && tagInput.trim()) { setForm(f => ({ ...f, tags: [...f.tags, tagInput.trim()] })); setTagInput("") }}}
                    placeholder="Ajouter un tag + Entrée"
                    className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-500/60" />
                </div>
              </div>

              {/* Bouton save */}
              {Object.keys(errors).length > 0 && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
                  <p className="text-red-400 text-xs font-semibold">⚠ Certains champs obligatoires sont manquants</p>
                </div>
              )}
              <button onClick={save} disabled={saving}
                className="w-full py-3 rounded-xl text-black font-bold text-sm transition-colors disabled:opacity-50"
                style={{ backgroundColor: "#eab308" }}>
                {saving ? "Enregistrement..." : editing ? "Mettre à jour" : "Créer le prospect"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}