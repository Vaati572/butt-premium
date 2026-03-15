"use client"

import { useEffect, useState, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import {
  Plus, X, MapPin, User, Search, ChevronDown,
  CheckCircle2, Clock, Trash2, Pencil, Route,
  Building2, Target, History, ArrowRight, Check
} from "lucide-react"

interface Props {
  activeSociety: any
  profile: any
  onLaunchOnMap?: (t: any) => void
  onSwitchToMap?: () => void
}

type ContactType = "client" | "prospect" | "pharmacie"

interface TourneeStop {
  id: string           // UUID local
  contact_id: string
  contact_nom: string
  contact_type: ContactType
  adresse?: string
  ville?: string
  telephone?: string
  ordre: number
  statut: "a_faire" | "visite" | "absent"
  notes?: string
  vente?: string
  montant?: number
}

interface Tournee {
  id: string
  nom: string
  date: string
  statut: "planifiee" | "en_cours" | "terminee"
  stops: TourneeStop[]
  notes?: string
  society_id: string
  user_id: string
  created_at: string
}

const TYPE_CFG: Record<ContactType, { label: string; color: string; icon: any }> = {
  client:    { label: "Client",    color: "#eab308", icon: User },
  prospect:  { label: "Prospect",  color: "#f97316", icon: Target },
  pharmacie: { label: "Pharmacie", color: "#22c55e", icon: Building2 },
}

/* ── STOP VISITE PANEL ─────────────────────── */
function VisitePanel({
  stop, tourneeId, onClose, onDone
}: { stop: TourneeStop; tourneeId: string; onClose: () => void; onDone: () => void }) {
  const [statut, setStatut]   = useState(stop.statut)
  const [notes, setNotes]     = useState(stop.notes || "")
  const [vente, setVente]     = useState(stop.vente || "")
  const [montant, setMontant] = useState(String(stop.montant || ""))
  const [saving, setSaving]   = useState(false)

  const save = async () => {
    setSaving(true)
    // Update the stop within the tournee JSON
    const { data: t } = await supabase.from("tournees").select("stops").eq("id", tourneeId).single()
    const stops: TourneeStop[] = t?.stops || []
    const updated = stops.map((s: TourneeStop) =>
      s.id === stop.id ? { ...s, statut, notes, vente, montant: parseFloat(montant) || 0 } : s
    )
    await supabase.from("tournees").update({ stops: updated }).eq("id", tourneeId)
    setSaving(false)
    onDone()
    onClose()
  }

  const cfg = TYPE_CFG[stop.contact_type]

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-[#111111] border border-zinc-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="px-6 pt-6 pb-4 border-b border-zinc-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider mb-0.5" style={{ color: cfg.color }}>
                {cfg.label}
              </p>
              <h3 className="text-white font-bold text-lg">{stop.contact_nom}</h3>
              {stop.adresse && <p className="text-zinc-500 text-xs mt-0.5">📍 {stop.adresse}{stop.ville ? `, ${stop.ville}` : ""}</p>}
              {stop.telephone && <p className="text-zinc-500 text-xs">📞 {stop.telephone}</p>}
            </div>
            <button onClick={onClose} className="text-zinc-500 hover:text-white"><X size={18}/></button>
          </div>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Statut visite */}
          <div>
            <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-2">Résultat de la visite</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { val: "visite",  label: "✅ Visité",  color: "text-green-400 bg-green-400/10 border-green-400/30" },
                { val: "absent",  label: "❌ Absent",  color: "text-red-400 bg-red-400/10 border-red-400/30" },
                { val: "a_faire", label: "⏳ À faire", color: "text-zinc-400 bg-zinc-800 border-zinc-700" },
              ].map(({ val, label, color }) => (
                <button key={val} onClick={() => setStatut(val as any)}
                  className={`py-2.5 rounded-xl text-xs font-bold border transition-all ${statut === val ? color : "bg-zinc-900 text-zinc-600 border-zinc-800"}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Vente réalisée */}
          <div>
            <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Vente réalisée</label>
            <input value={vente} onChange={e => setVente(e.target.value)}
              placeholder="Ex: 3× Baume 50ml, 2× Huile Sèche..."
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-500/60"/>
          </div>

          {/* Montant */}
          <div>
            <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Montant (€)</label>
            <div className="relative">
              <input type="number" min="0" step="0.01" value={montant} onChange={e => setMontant(e.target.value)}
                placeholder="0.00"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-500/60"/>
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">€</span>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
              placeholder="Compte-rendu de la visite, prochaines actions..."
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-500/60 resize-none"/>
          </div>
        </div>

        <div className="px-6 pb-6 flex gap-3">
          <button onClick={save} disabled={saving}
            className="flex-1 py-3 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-sm disabled:opacity-40">
            {saving ? "Sauvegarde..." : "✓ Valider la visite"}
          </button>
          <button onClick={onClose} className="px-4 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold text-sm">
            Annuler
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── CRÉER TOURNÉE PANEL ──────────────────── */
function CreerTourneePanel({
  societyId, profile, onClose, onDone
}: { societyId: string; profile: any; onClose: () => void; onDone: () => void }) {
  const [nom, setNom]             = useState(`Tournée du ${new Date().toLocaleDateString("fr-FR")}`)
  const [date, setDate]           = useState(new Date().toISOString().split("T")[0])
  const [stops, setStops]         = useState<TourneeStop[]>([])
  const [addingStop, setAddingStop] = useState(false)
  const [stopType, setStopType]   = useState<ContactType>("client")
  const [stopSearch, setStopSearch] = useState("")
  const [contacts, setContacts]   = useState<any[]>([])
  const [saving, setSaving]       = useState(false)

  useEffect(() => {
    const loadContacts = async () => {
      if (!stopSearch.trim()) { setContacts([]); return }
      const q = stopSearch.toLowerCase()

      if (stopType === "client") {
        const { data } = await supabase.from("clients").select("id, nom, telephone, adresse, ville")
          .eq("society_id", societyId).ilike("nom", `%${q}%`).limit(10)
        setContacts((data || []).map(c => ({ ...c, type: "client" })))
      } else if (stopType === "prospect") {
        const { data } = await supabase.from("prospects").select("id, nom, entreprise, tel, adresse, ville")
          .eq("society_id", societyId).ilike("nom", `%${q}%`).limit(10)
        setContacts((data || []).map(p => ({ id: p.id, nom: p.entreprise || p.nom, telephone: p.tel, adresse: p.adresse, ville: p.ville, type: "prospect" })))
      } else {
        const { data } = await supabase.from("pharmacies").select("id, nom, adresse, ville, telephone")
          .eq("society_id", societyId).ilike("nom", `%${q}%`).limit(10)
        setContacts((data || []).map(p => ({ ...p, type: "pharmacie" })))
      }
    }
    const t = setTimeout(loadContacts, 300)
    return () => clearTimeout(t)
  }, [stopSearch, stopType, societyId])

  const addStop = (contact: any) => {
    const newStop: TourneeStop = {
      id: crypto.randomUUID(),
      contact_id: contact.id,
      contact_nom: contact.nom,
      contact_type: stopType,
      adresse: contact.adresse,
      ville: contact.ville,
      telephone: contact.telephone,
      ordre: stops.length + 1,
      statut: "a_faire",
    }
    setStops(prev => [...prev, newStop])
    setAddingStop(false)
    setStopSearch("")
    setContacts([])
  }

  const removeStop = (id: string) => {
    setStops(prev => prev.filter(s => s.id !== id).map((s, i) => ({ ...s, ordre: i + 1 })))
  }

  const moveStop = (id: string, dir: "up" | "down") => {
    setStops(prev => {
      const idx = prev.findIndex(s => s.id === id)
      if (dir === "up" && idx === 0) return prev
      if (dir === "down" && idx === prev.length - 1) return prev
      const arr = [...prev]
      const swap = dir === "up" ? idx - 1 : idx + 1
      ;[arr[idx], arr[swap]] = [arr[swap], arr[idx]]
      return arr.map((s, i) => ({ ...s, ordre: i + 1 }))
    })
  }

  const save = async () => {
    if (!nom.trim() || stops.length === 0) return
    setSaving(true)
    const { error: insertErr } = await supabase.from("tournees").insert({
      society_id: societyId,
      user_id: profile.id,
      nom: nom.trim(),
      date,
      statut: "planifiee",
      stops: JSON.parse(JSON.stringify(stops)), // ensure serializable
      notes: "",
    })
    if (insertErr) { alert("Erreur: "+insertErr.message); setSaving(false); return }
    setSaving(false)
    onDone()
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-end z-50">
      <div className="bg-[#111111] border-l border-zinc-800 w-full max-w-md h-full flex flex-col shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <div>
            <h3 className="text-base font-bold text-white">🗺️ Créer une tournée</h3>
            <p className="text-zinc-500 text-xs mt-0.5">Ajoutez vos étapes dans l'ordre</p>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white"><X size={18}/></button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Nom + Date */}
          <div>
            <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Nom de la tournée</label>
            <input value={nom} onChange={e => setNom(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-500/60"/>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"/>
          </div>

          {/* Étapes */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Étapes ({stops.length})</label>
              <button onClick={() => setAddingStop(true)}
                className="flex items-center gap-1 text-xs text-yellow-400 hover:text-yellow-300 font-semibold">
                <Plus size={12}/> Ajouter
              </button>
            </div>

            {/* Add stop form */}
            {addingStop && (
              <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-3 mb-3 space-y-2">
                {/* Type selector */}
                <div className="flex gap-1.5">
                  {(["client", "prospect", "pharmacie"] as ContactType[]).map(t => {
                    const cfg = TYPE_CFG[t]
                    return (
                      <button key={t} onClick={() => { setStopType(t); setStopSearch(""); setContacts([]) }}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all ${stopType===t ? "text-black border-transparent" : "bg-zinc-700 text-zinc-400 border-zinc-600"}`}
                        style={stopType===t ? { backgroundColor: cfg.color } : {}}>
                        {t === "client" ? "👤" : t === "prospect" ? "🎯" : "🏥"} {cfg.label}
                      </button>
                    )
                  })}
                </div>
                <div className="relative">
                  <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"/>
                  <input value={stopSearch} onChange={e => setStopSearch(e.target.value)}
                    placeholder={`Rechercher un ${TYPE_CFG[stopType].label.toLowerCase()}...`} autoFocus
                    className="w-full bg-zinc-700 border border-zinc-600 rounded-lg pl-8 pr-3 py-2 text-sm text-white focus:outline-none"/>
                </div>
                {contacts.length > 0 && (
                  <div className="bg-zinc-900 border border-zinc-700 rounded-lg overflow-hidden max-h-40 overflow-y-auto">
                    {contacts.map(c => (
                      <button key={c.id} onClick={() => addStop(c)}
                        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-zinc-800 text-left transition-colors">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-black shrink-0"
                          style={{ backgroundColor: TYPE_CFG[stopType].color }}>
                          {c.nom.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-white text-sm truncate">{c.nom}</p>
                          {c.ville && <p className="text-zinc-500 text-[10px]">{c.ville}</p>}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {stopSearch.trim() && contacts.length === 0 && (
                  <p className="text-zinc-600 text-xs text-center py-2">Aucun résultat</p>
                )}
                <button onClick={() => { setAddingStop(false); setStopSearch(""); setContacts([]) }}
                  className="w-full py-1.5 text-xs text-zinc-500 hover:text-zinc-300 text-center">Annuler</button>
              </div>
            )}

            {/* Stops list */}
            {stops.length === 0 ? (
              <div className="text-center py-6 text-zinc-600 bg-zinc-900 border border-dashed border-zinc-700 rounded-xl">
                <Route size={24} className="mx-auto mb-2 opacity-30"/>
                <p className="text-sm">Aucune étape</p>
                <p className="text-xs mt-1">Ajoutez des clients, prospects ou pharmacies</p>
              </div>
            ) : (
              <div className="space-y-2">
                {stops.map((stop, i) => {
                  const cfg = TYPE_CFG[stop.contact_type]
                  return (
                    <div key={stop.id} className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5">
                      {/* Numéro */}
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black text-black shrink-0"
                        style={{ backgroundColor: cfg.color }}>
                        {i + 1}
                      </div>
                      {/* Infos */}
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">{stop.contact_nom}</p>
                        <p className="text-zinc-600 text-[10px]">{cfg.label}{stop.ville ? ` · ${stop.ville}` : ""}</p>
                      </div>
                      {/* Move + remove */}
                      <div className="flex items-center gap-1">
                        <button onClick={() => moveStop(stop.id, "up")} disabled={i===0}
                          className="text-zinc-600 hover:text-zinc-300 disabled:opacity-20 text-sm w-5">↑</button>
                        <button onClick={() => moveStop(stop.id, "down")} disabled={i===stops.length-1}
                          className="text-zinc-600 hover:text-zinc-300 disabled:opacity-20 text-sm w-5">↓</button>
                        <button onClick={() => removeStop(stop.id)} className="text-red-500 hover:text-red-400 ml-1">
                          <X size={14}/>
                        </button>
                      </div>
                    </div>
                  )
                })}

                {/* Visual route summary */}
                {stops.length > 1 && (
                  <div className="flex items-center gap-1 text-zinc-600 text-[10px] overflow-x-auto py-1">
                    {stops.map((s, i) => (
                      <div key={s.id} className="flex items-center gap-1 shrink-0">
                        <span className="text-zinc-400 font-medium">{s.contact_nom.split(" ")[0]}</span>
                        {i < stops.length - 1 && <ArrowRight size={10}/>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="p-5 border-t border-zinc-800 space-y-3">
          <button onClick={save} disabled={saving || stops.length === 0 || !nom.trim()}
            className="w-full bg-yellow-500 hover:bg-yellow-400 disabled:opacity-40 text-black font-bold py-3 rounded-xl text-sm flex items-center justify-center gap-2">
            <Route size={15}/> {saving ? "Création..." : `Créer la tournée (${stops.length} étape${stops.length>1?"s":""})`}
          </button>
          <button onClick={onClose} className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold py-2.5 rounded-xl text-sm">Annuler</button>
        </div>
      </div>
    </div>
  )
}

/* ── HISTORIQUE TOURNÉE ───────────────────── */
function HistoriqueTourneePanel({ societyId, onClose }: { societyId: string; onClose: () => void }) {
  const [tournees, setTournees] = useState<any[]>([])
  const [loading, setLoading]   = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    supabase.from("tournees").select("*").eq("society_id", societyId)
      .order("date", { ascending: false }).limit(100)
      .then(({ data }) => { setTournees(data || []); setLoading(false) })
  }, [])

  const deleteTournee = async (id: string) => {
    if (!confirm("Supprimer cette tournée ?")) return
    await supabase.from("tournees").delete().eq("id", id)
    setTournees(prev => prev.filter(t => t.id !== id))
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-end z-50">
      <div className="bg-[#111111] border-l border-zinc-800 w-full max-w-lg h-full flex flex-col shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <div>
            <h3 className="text-base font-bold text-white">📋 Historique tournées</h3>
            <p className="text-zinc-500 text-xs mt-0.5">{tournees.length} tournée{tournees.length>1?"s":""}</p>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white"><X size={18}/></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin"/>
            </div>
          ) : tournees.length === 0 ? (
            <div className="text-center py-12 text-zinc-600">
              <Route size={32} className="mx-auto mb-3 opacity-20"/>
              <p className="text-sm">Aucune tournée</p>
            </div>
          ) : tournees.map(t => {
            const stops: TourneeStop[] = t.stops || []
            const totalMontant = stops.reduce((s: number, st: TourneeStop) => s + (st.montant || 0), 0)
            const visites = stops.filter((s: TourneeStop) => s.statut === "visite").length
            const isExpanded = expanded === t.id
            const statusCfg = {
              planifiee:  { label: "Planifiée",  color: "text-blue-400 bg-blue-400/10 border-blue-400/20" },
              en_cours:   { label: "En cours",   color: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20" },
              terminee:   { label: "Terminée",   color: "text-green-400 bg-green-400/10 border-green-400/20" },
            }[t.statut as string] || { label: t.statut, color: "text-zinc-400 bg-zinc-800 border-zinc-700" }

            return (
              <div key={t.id} className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                <button className="w-full flex items-start justify-between p-4 text-left hover:bg-zinc-800/30 transition-colors"
                  onClick={() => setExpanded(isExpanded ? null : t.id)}>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-white font-bold text-sm">{t.nom}</p>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${statusCfg.color}`}>{statusCfg.label}</span>
                    </div>
                    <p className="text-zinc-500 text-xs">{new Date(t.date).toLocaleDateString("fr-FR")} · {stops.length} étape{stops.length>1?"s":""}</p>
                    <p className="text-zinc-600 text-xs">{visites}/{stops.length} visites · <span className="text-yellow-400 font-semibold">{totalMontant.toFixed(2)}€</span></p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={e => { e.stopPropagation(); deleteTournee(t.id) }}
                      className="text-red-500 hover:text-red-400 p-1 rounded-lg hover:bg-red-500/10 transition-colors">
                      <Trash2 size={14}/>
                    </button>
                    <span className="text-zinc-600">{isExpanded ? "▲" : "▼"}</span>
                  </div>
                </button>

                {isExpanded && stops.length > 0 && (
                  <div className="border-t border-zinc-800 p-3 space-y-2">
                    {stops.map((stop: TourneeStop, i: number) => {
                      const cfg = TYPE_CFG[stop.contact_type]
                      return (
                        <div key={stop.id} className="flex items-start gap-3 bg-zinc-800 rounded-xl p-3">
                          <div className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black text-black shrink-0"
                            style={{ backgroundColor: cfg.color }}>
                            {i+1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-white text-sm font-semibold">{stop.contact_nom}</p>
                              <span className={`text-[10px] font-bold ${stop.statut==="visite"?"text-green-400":stop.statut==="absent"?"text-red-400":"text-zinc-500"}`}>
                                {stop.statut==="visite"?"✅":stop.statut==="absent"?"❌":"⏳"}
                              </span>
                              {stop.montant && stop.montant > 0 && (
                                <span className="text-yellow-400 text-xs font-bold">{stop.montant.toFixed(2)}€</span>
                              )}
                            </div>
                            {stop.vente && <p className="text-zinc-400 text-xs mt-0.5">{stop.vente}</p>}
                            {stop.notes && <p className="text-zinc-500 text-xs italic mt-0.5">{stop.notes}</p>}
                          </div>
                        </div>
                      )
                    })}
                    {/* Total */}
                    <div className="flex items-center justify-between px-3 py-2 bg-zinc-900 rounded-xl">
                      <span className="text-zinc-500 text-sm">Total tournée</span>
                      <span className="text-yellow-400 font-bold">{totalMontant.toFixed(2)}€</span>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════
   MAIN
══════════════════════════════════════════════ */
export default function TourneesModule({ activeSociety, profile, onLaunchOnMap, onSwitchToMap }: Props) {
  const [tournees, setTournees]         = useState<any[]>([])
  const [loading, setLoading]           = useState(true)
  const [showCreate, setShowCreate]     = useState(false)
  const [showHistory, setShowHistory]   = useState(false)
  const [activeTournee, setActiveTournee] = useState<any>(null)
  const [visitStop, setVisitStop]       = useState<{ stop: TourneeStop; tourneeId: string } | null>(null)

  const load = useCallback(async () => {
    if (!activeSociety?.id) return
    setLoading(true)
    const { data, error } = await supabase.from("tournees")
      .select("*")
      .eq("society_id", activeSociety.id)
      .order("date", { ascending: true })
    // Ne pas filtrer par statut ici — affiche tout sauf "terminee"
    setTournees((data||[]).filter((t:any) => t.statut !== "terminee"))
    setLoading(false)
  }, [activeSociety?.id])

  useEffect(() => { load() }, [load])

  const startTournee = async (tournee: any) => {
    await supabase.from("tournees").update({ statut: "en_cours" }).eq("id", tournee.id)
    setActiveTournee({ ...tournee, statut: "en_cours" })
    load()
  }

  const terminerTournee = async (tournee: any) => {
    if (!confirm("Terminer cette tournée ?")) return
    await supabase.from("tournees").update({ statut: "terminee" }).eq("id", tournee.id)
    setActiveTournee(null)
    load()
  }

  const deleteTournee = async (id: string) => {
    if (!confirm("Supprimer cette tournée ?")) return
    await supabase.from("tournees").delete().eq("id", id)
    if (activeTournee?.id === id) setActiveTournee(null)
    load()
  }

  const handleVisiteValidated = async () => {
    // Refresh tournee data
    const { data } = await supabase.from("tournees").select("*").eq("id", activeTournee.id).single()
    if (data) setActiveTournee(data)
    load()
  }

  // Currently active tournee view
  const currentTournee = activeTournee
    ? tournees.find(t => t.id === activeTournee.id) || activeTournee
    : null

  return (
    <div className="flex-1 overflow-y-auto bg-[#0a0a0a]">
      <div className="p-6 max-w-3xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-white">🛣️ Tournées</h1>
            <p className="text-zinc-500 text-sm mt-0.5">Planifiez vos visites terrain</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowHistory(true)}
              className="flex items-center gap-1.5 text-sm text-zinc-400 bg-zinc-900 border border-zinc-800 px-3 py-2 rounded-xl hover:bg-zinc-800">
              <History size={14}/> Historique
            </button>
            <button onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-4 py-2.5 rounded-xl text-sm shadow-lg shadow-yellow-500/20">
              <Plus size={16}/> Créer une tournée
            </button>
          </div>
        </div>

        {/* Active / planned tournees */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin"/>
          </div>
        ) : tournees.length === 0 ? (
          <div className="text-center py-24 text-zinc-600">
            <Route size={48} className="mx-auto mb-4 opacity-20"/>
            <p className="text-base font-semibold text-zinc-500 mb-2">Aucune tournée planifiée</p>
            <p className="text-sm mb-6">Créez votre première tournée pour organiser vos visites</p>
            <button onClick={() => setShowCreate(true)}
              className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-6 py-3 rounded-xl text-sm inline-flex items-center gap-2">
              <Plus size={16}/> Créer une tournée
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {tournees.map(t => {
              const stops: TourneeStop[] = t.stops || []
              const visites = stops.filter((s: TourneeStop) => s.statut === "visite").length
              const absents = stops.filter((s: TourneeStop) => s.statut === "absent").length
              const totalMontant = stops.reduce((s: number, st: TourneeStop) => s + (st.montant||0), 0)
              const isEnCours = t.statut === "en_cours"
              const isActive = activeTournee?.id === t.id

              return (
                <div key={t.id} className={`bg-zinc-900 border rounded-2xl overflow-hidden transition-all ${isEnCours ? "border-yellow-500/30" : "border-zinc-800"}`}>
                  {/* Header */}
                  <div className="flex items-center justify-between p-5">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-white font-bold">{t.nom}</p>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${isEnCours ? "text-yellow-400 bg-yellow-400/10 border-yellow-400/20 animate-pulse" : "text-blue-400 bg-blue-400/10 border-blue-400/20"}`}>
                          {isEnCours ? "En cours" : "Planifiée"}
                        </span>
                      </div>
                      <p className="text-zinc-500 text-sm">
                        📅 {new Date(t.date).toLocaleDateString("fr-FR")} · {stops.length} étape{stops.length>1?"s":""}
                      </p>
                      {isEnCours && (
                        <p className="text-zinc-400 text-xs mt-1">
                          {visites} visité · {absents} absent · <span className="text-yellow-400 font-bold">{totalMontant.toFixed(2)}€</span>
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {!isEnCours && (
                        <button onClick={() => startTournee(t)}
                          className="flex items-center gap-1.5 text-xs bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-3 py-1.5 rounded-lg">
                          ▶ Démarrer
                        </button>
                      )}
                      {isEnCours && (
                        <button onClick={() => setActiveTournee(isActive ? null : t)}
                          className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border transition-colors ${isActive ? "bg-zinc-700 text-zinc-300 border-zinc-600" : "bg-yellow-500/20 text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/30"}`}>
                          {isActive ? "Réduire" : "Voir étapes"}
                        </button>
                      )}
                      <button onClick={() => deleteTournee(t.id)} className="text-red-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10">
                        <Trash2 size={14}/>
                      </button>
                    </div>
                  </div>

                  {/* Stops (only when expanded + en_cours) */}
                  {isActive && isEnCours && (
                    <div className="border-t border-zinc-800 p-4 space-y-2">
                      {stops.map((stop: TourneeStop, i: number) => {
                        const cfg = TYPE_CFG[stop.contact_type]
                        const isDone = stop.statut !== "a_faire"
                        return (
                          <div key={stop.id}
                            className={`flex items-center gap-3 rounded-xl p-3 border transition-all ${isDone ? "bg-zinc-800/30 border-zinc-800" : "bg-zinc-800 border-zinc-700"}`}>
                            {/* Numéro */}
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${isDone ? "opacity-50" : ""}`}
                              style={{ backgroundColor: cfg.color + (isDone ? "40" : ""), color: isDone ? "#71717a" : "black" }}>
                              {stop.statut === "visite" ? "✓" : stop.statut === "absent" ? "✗" : i+1}
                            </div>

                            {/* Infos */}
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-semibold ${isDone ? "text-zinc-500 line-through" : "text-white"}`}>
                                {stop.contact_nom}
                              </p>
                              <p className="text-zinc-600 text-[10px]">
                                {cfg.label}{stop.ville ? ` · ${stop.ville}` : ""}
                                {stop.telephone && ` · ${stop.telephone}`}
                              </p>
                              {stop.vente && <p className="text-zinc-400 text-xs mt-0.5">{stop.vente}</p>}
                              {stop.montant && stop.montant > 0 && (
                                <p className="text-yellow-400 text-xs font-bold">{stop.montant.toFixed(2)}€</p>
                              )}
                            </div>

                            {/* Action */}
                            {!isDone ? (
                              <button
                                onClick={() => setVisitStop({ stop, tourneeId: t.id })}
                                className="flex items-center gap-1.5 text-[11px] font-bold text-yellow-400 bg-yellow-400/10 border border-yellow-400/20 px-2.5 py-1.5 rounded-lg hover:bg-yellow-400/20 transition-colors shrink-0">
                                <Check size={11}/> Valider
                              </button>
                            ) : (
                              <button onClick={() => setVisitStop({ stop, tourneeId: t.id })}
                                className="text-zinc-500 hover:text-zinc-300 p-1.5 rounded-lg hover:bg-zinc-700 shrink-0">
                                <Pencil size={13}/>
                              </button>
                            )}
                          </div>
                        )
                      })}

                      {/* Terminer */}
                      <button onClick={() => terminerTournee(t)}
                        className="w-full mt-2 py-2.5 rounded-xl text-sm font-bold text-black flex items-center justify-center gap-2"
                        style={{ backgroundColor: visites + absents === stops.length ? "#22c55e" : "#eab308" }}>
                        <CheckCircle2 size={15}/>
                        {visites + absents === stops.length ? "✓ Terminer la tournée" : `Terminer (${visites+absents}/${stops.length} traités)`}
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {showCreate && (
        <CreerTourneePanel societyId={activeSociety.id} profile={profile} onClose={() => setShowCreate(false)} onDone={load}/>
      )}
      {showHistory && (
        <HistoriqueTourneePanel societyId={activeSociety.id} onClose={() => setShowHistory(false)}/>
      )}
      {visitStop && (
        <VisitePanel
          stop={visitStop.stop}
          tourneeId={visitStop.tourneeId}
          onClose={() => setVisitStop(null)}
          onDone={handleVisiteValidated}
        />
      )}
    </div>
  )
}