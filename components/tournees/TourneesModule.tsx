"use client"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { X, Trash2, Pencil, Map, Play, Check, Clock, ChevronDown, ChevronUp, Truck } from "lucide-react"

interface Etape {
  prospect_id: string; nom: string; adresse: string; ville: string
  latitude: number | null; longitude: number | null
  heure: string; notes: string; fait: boolean
}
interface Tournee {
  id: string; nom: string; mode: string; statut: string; date_tournee: string
  adresse_depart: string; etapes: Etape[]; distance_km: number | null
  duree_min: number | null; notes: string; created_at: string
}

const STATUTS = [
  { id: "planifiee", label: "Planifiée",  color: "#3b82f6" },
  { id: "en_cours",  label: "En cours",   color: "#eab308" },
  { id: "terminee",  label: "Terminée",   color: "#22c55e" },
]

interface Props { activeSociety: any; profile: any; onLaunchOnMap?: (t: Tournee) => void; onSwitchToMap?: () => void }

export default function TourneesModule({ activeSociety, profile, onLaunchOnMap, onSwitchToMap }: Props) {
  const [tournees, setTournees] = useState<Tournee[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [editing, setEditing] = useState<Tournee | null>(null)
  const [editForm, setEditForm] = useState<Partial<Tournee>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => { load() }, [activeSociety])

  const load = async () => {
    setLoading(true)
    const { data } = await supabase.from("tournees").select("*").eq("society_id", activeSociety.id).order("date_tournee", { ascending: false })
    setTournees(data || [])
    setLoading(false)
  }

  const remove = async (id: string) => { if (!confirm("Supprimer ?")) return; await supabase.from("tournees").delete().eq("id", id); load() }
  const openEdit = (t: Tournee) => { setEditForm({ ...t }); setEditing(t) }
  const closeEdit = () => setEditing(null)

  const saveEdit = async () => {
    if (!editForm.nom?.trim() || !editing) return
    setSaving(true)
    await supabase.from("tournees").update({ ...editForm, updated_at: new Date().toISOString() }).eq("id", editing.id)
    setSaving(false); closeEdit(); load()
  }

  const updateStatut = async (id: string, statut: string) => { await supabase.from("tournees").update({ statut }).eq("id", id); load() }

  const toggleFait = async (t: Tournee, idx: number) => {
    const etapes = t.etapes.map((e, i) => i === idx ? { ...e, fait: !e.fait } : e)
    await supabase.from("tournees").update({ etapes }).eq("id", t.id); load()
  }

  const launch = (t: Tournee) => { if (onLaunchOnMap) onLaunchOnMap(t); if (onSwitchToMap) onSwitchToMap() }
  const getStatut = (id: string) => STATUTS.find(s => s.id === id) || STATUTS[0]

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#0a0a0a]">
      <div className="px-6 py-4 border-b border-zinc-900 flex items-center justify-between">
        <div><h1 className="text-white font-bold text-xl">🛣️ Tournées</h1><p className="text-zinc-500 text-xs mt-0.5">{tournees.length} tournée{tournees.length > 1 ? "s" : ""} · Créez-en depuis l'onglet Prospects</p></div>
        {onSwitchToMap && <button onClick={onSwitchToMap} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-800 text-zinc-300 text-sm border border-zinc-700 hover:bg-zinc-700 transition-colors"><Map size={14} /> Map</button>}
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (<div className="flex items-center justify-center h-40"><div className="w-6 h-6 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" /></div>)
        : tournees.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-5xl mb-4">🛣️</p>
            <p className="text-zinc-400 font-bold text-lg">Aucune tournée</p>
            <p className="text-zinc-600 text-sm mt-2">Dans <span className="text-zinc-400 font-semibold">Prospects</span>, cochez des prospects<br />et cliquez <span className="text-yellow-400 font-semibold">"Créer tournée"</span></p>
          </div>
        ) : (
          <div className="space-y-3 max-w-3xl mx-auto">
            {tournees.map(t => {
              const sc = getStatut(t.statut)
              const done = t.etapes.filter(e => e.fait).length
              const isExpanded = expanded === t.id
              return (
                <div key={t.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <p className="text-white font-bold">{t.nom}</p>
                          <span className="text-xs font-bold px-2 py-0.5 rounded-lg" style={{ backgroundColor: sc.color + "20", color: sc.color }}>{sc.label}</span>
                          {t.mode === "livraison" && <span className="flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-lg bg-purple-500/20 text-purple-400"><Truck size={9} /> Livraison</span>}
                        </div>
                        <div className="flex gap-3 text-zinc-500 text-xs flex-wrap">
                          {t.date_tournee && <span>📅 {new Date(t.date_tournee).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" })}</span>}
                          <span>📍 {t.etapes.length} étapes</span>
                          {t.distance_km && <span>🛣️ ~{t.distance_km} km</span>}
                          {t.duree_min && <span>⏱ ~{Math.floor(t.duree_min / 60)}h{String(t.duree_min % 60).padStart(2, "0")}</span>}
                          {done > 0 && <span className="text-green-400 font-semibold">✓ {done}/{t.etapes.length}</span>}
                        </div>
                        {t.etapes.length > 0 && (
                          <div className="mt-2.5 h-1.5 bg-zinc-800 rounded-full overflow-hidden w-full max-w-xs">
                            <div className="h-full bg-green-500 rounded-full transition-all duration-500" style={{ width: `${(done / t.etapes.length) * 100}%` }} />
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button onClick={() => launch(t)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold" style={{ backgroundColor: "#eab30820", color: "#eab308" }}><Play size={11} /> Lancer</button>
                        <button onClick={() => openEdit(t)} className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 transition-colors"><Pencil size={12} /></button>
                        <button onClick={() => remove(t.id)} className="w-8 h-8 rounded-lg bg-red-500/10 hover:bg-red-500/20 flex items-center justify-center text-red-400 transition-colors"><Trash2 size={12} /></button>
                        <button onClick={() => setExpanded(isExpanded ? null : t.id)} className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 transition-colors">{isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</button>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      {STATUTS.map(s => (
                        <button key={s.id} onClick={() => updateStatut(t.id, s.id)} className="px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all"
                          style={t.statut === s.id ? { backgroundColor: s.color + "20", color: s.color, borderColor: s.color + "40" } : { borderColor: "#27272a", color: "#52525b" }}>
                          {t.statut === s.id && "✓ "}{s.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-zinc-800 px-4 py-3 space-y-2 bg-zinc-950/40">
                      {t.adresse_depart && (
                        <div className="flex items-center gap-2.5 px-3 py-2 text-xs text-zinc-500">
                          <span className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center text-sm shrink-0">🏠</span>
                          <span className="truncate">{t.adresse_depart}</span>
                          <span className="text-zinc-600">Départ</span>
                        </div>
                      )}
                      {t.etapes.map((e, i) => (
                        <div key={i} className={`flex items-start gap-3 p-3 rounded-xl transition-all ${e.fait ? "bg-green-500/5 border border-green-500/20" : "bg-zinc-800/50"}`}>
                          <button onClick={() => toggleFait(t, i)}
                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${e.fait ? "bg-green-500 border-green-500" : "border-zinc-600 hover:border-green-400"}`}>
                            {e.fait && <Check size={11} className="text-white" />}
                          </button>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`font-semibold text-sm ${e.fait ? "text-zinc-500 line-through" : "text-white"}`}>{e.nom}</span>
                              {e.heure && t.mode === "livraison" && <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-lg bg-purple-500/20 text-purple-300"><Clock size={9} />{e.heure}</span>}
                              <span className="w-5 h-5 rounded-full bg-zinc-700 text-zinc-400 flex items-center justify-center text-[10px] font-black">{i + 1}</span>
                            </div>
                            {e.ville && <p className="text-zinc-500 text-xs mt-0.5">📍 {e.adresse ? `${e.adresse}, ` : ""}{e.ville}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111111] border border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between p-5 border-b border-zinc-800">
              <h2 className="text-white font-bold">Modifier la tournée</h2>
              <button onClick={closeEdit} className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white"><X size={14} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div><label className="block text-zinc-500 text-[11px] uppercase tracking-wider mb-1.5">Nom</label>
                <input value={editForm.nom || ""} onChange={e => setEditForm(f => ({ ...f, nom: e.target.value }))} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-500/60" /></div>
              <div><label className="block text-zinc-500 text-[11px] uppercase tracking-wider mb-1.5">Date</label>
                <input type="date" value={editForm.date_tournee || ""} onChange={e => setEditForm(f => ({ ...f, date_tournee: e.target.value }))} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-500/60" /></div>
              <div><label className="block text-zinc-500 text-[11px] uppercase tracking-wider mb-1.5">Notes</label>
                <textarea value={editForm.notes || ""} onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))} rows={3} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-500/60 resize-none" /></div>
              {editForm.mode === "livraison" && editForm.etapes && (
                <div>
                  <label className="block text-zinc-500 text-[11px] uppercase tracking-wider mb-2">⏰ Heures des étapes (Livraison)</label>
                  <div className="space-y-2">
                    {editForm.etapes.map((e, i) => (
                      <div key={i} className="flex items-center gap-3 bg-zinc-800 rounded-xl px-3 py-2.5">
                        <span className="text-zinc-200 text-sm flex-1 truncate">{e.nom}</span>
                        <input type="time" value={e.heure || ""} onChange={ev => {
                          const etapes = editForm.etapes!.map((et, idx) => idx === i ? { ...et, heure: ev.target.value } : et)
                          setEditForm(f => ({ ...f, etapes }))
                        }} className="bg-zinc-700 border border-zinc-600 rounded-lg px-2 py-1.5 text-sm text-white focus:outline-none w-28" />
                      </div>
                    ))}
                  </div>
                  <p className="text-zinc-600 text-[10px] mt-2">Les étapes seront ordonnées par heure sur la map</p>
                </div>
              )}
              <button onClick={saveEdit} disabled={saving} className="w-full py-3 rounded-xl text-black font-bold text-sm bg-yellow-500 disabled:opacity-50 transition-colors">{saving ? "Enregistrement..." : "Sauvegarder"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
