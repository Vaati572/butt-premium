"use client"

import { useEffect, useState, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import { Plus, X, Pencil, Trash2, Check, Clock, ChevronLeft, ChevronRight, BookOpen } from "lucide-react"

interface Props { activeSociety: any; profile: any }

interface Tache {
  id: string
  titre: string
  date: string
  heure_debut: string
  heure_fin?: string
  couleur: string
  notes?: string
  user_id: string
  user_nom?: string
  done: boolean
  created_at: string
}

interface CahierItem {
  id: string
  society_id: string
  user_id: string
  user_nom?: string
  titre: string
  notes?: string
  priorite: "haute" | "normale" | "basse"
  done: boolean
  created_at: string
}

const COULEURS = [
  { val: "#3b82f6", label: "Bleu"   },
  { val: "#22c55e", label: "Vert"   },
  { val: "#eab308", label: "Jaune"  },
  { val: "#ef4444", label: "Rouge"  },
  { val: "#a855f7", label: "Violet" },
  { val: "#f97316", label: "Orange" },
  { val: "#ec4899", label: "Rose"   },
  { val: "#14b8a6", label: "Cyan"   },
]

const HOURS = Array.from({ length: 16 }, (_, i) => i + 7)

const PRIORITE_CFG = {
  haute:   { label: "Haute",   color: "#ef4444", bg: "bg-red-500/10",    border: "border-red-500/30"    },
  normale: { label: "Normale", color: "#eab308", bg: "bg-yellow-500/10", border: "border-yellow-500/30" },
  basse:   { label: "Basse",   color: "#22c55e", bg: "bg-green-500/10",  border: "border-green-500/30"  },
}

const getMondayOf = (d: Date) => {
  const day = new Date(d)
  day.setDate(day.getDate() - (day.getDay() === 0 ? 6 : day.getDay() - 1))
  day.setHours(0, 0, 0, 0)
  return day
}

/* ── FORM TÂCHE ── */
function TacheForm({ societyId, profile, tache, date: defaultDate, heure: defaultHeure, onClose, onDone }: {
  societyId: string; profile: any; tache?: Tache; date?: string; heure?: string; onClose: () => void; onDone: () => void
}) {
  const [titre, setTitre]           = useState(tache?.titre || "")
  const [date, setDate]             = useState(tache?.date || defaultDate || new Date().toISOString().slice(0, 10))
  const [heureDebut, setHeureDebut] = useState(tache?.heure_debut || defaultHeure || "09:00")
  const [heureFin, setHeureFin]     = useState(tache?.heure_fin || "")
  const [couleur, setCouleur]       = useState(tache?.couleur || "#3b82f6")
  const [notes, setNotes]           = useState(tache?.notes || "")
  const [saving, setSaving]         = useState(false)

  const save = async () => {
    if (!titre.trim()) return
    setSaving(true)
    const data = {
      society_id: societyId, user_id: profile.id,
      user_nom: profile.nom || "Utilisateur",
      titre: titre.trim(), date, heure_debut: heureDebut,
      heure_fin: heureFin || null, couleur, notes, done: false,
    }
    if (tache?.id) await supabase.from("taches").update(data).eq("id", tache.id)
    else await supabase.from("taches").insert(data)
    setSaving(false); onDone(); onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-[#111111] border border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-zinc-800">
          <h3 className="text-white font-bold">{tache ? "Modifier la tâche" : "Nouvelle tâche"}</h3>
          <button onClick={onClose} className="text-zinc-500 hover:text-white"><X size={16} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Titre *</label>
            <input value={titre} onChange={e => setTitre(e.target.value)} placeholder="Ex: Livraison Nini" autoFocus
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/60" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Date</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none" />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Heure début</label>
              <input type="time" value={heureDebut} onChange={e => setHeureDebut(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Heure fin (optionnel)</label>
            <input type="time" value={heureFin} onChange={e => setHeureFin(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none" />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Couleur</label>
            <div className="flex gap-2 flex-wrap">
              {COULEURS.map(c => (
                <button key={c.val} onClick={() => setCouleur(c.val)}
                  className={`w-8 h-8 rounded-lg border-2 transition-all ${couleur === c.val ? "border-white scale-110" : "border-transparent"}`}
                  style={{ backgroundColor: c.val }} title={c.label} />
              ))}
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Notes (optionnel)</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Détails..."
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none resize-none" />
          </div>
        </div>
        <div className="p-5 pt-0 flex gap-3">
          <button onClick={save} disabled={saving || !titre.trim()}
            className="flex-1 bg-blue-500 hover:bg-blue-400 disabled:opacity-40 text-white font-bold py-3 rounded-xl text-sm">
            {saving ? "Sauvegarde..." : tache ? "Modifier" : "Créer"}
          </button>
          <button onClick={onClose} className="px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold rounded-xl text-sm">Annuler</button>
        </div>
      </div>
    </div>
  )
}

/* ── FORM CAHIER (tâches fixes, sans semaine) ── */
function CahierForm({ societyId, profile, item, onClose, onDone }: {
  societyId: string; profile: any; item?: CahierItem; onClose: () => void; onDone: () => void
}) {
  const [titre, setPriorite_titre] = useState(item?.titre || "")
  const [notes, setNotes]          = useState(item?.notes || "")
  const [priorite, setPriorite]    = useState<"haute" | "normale" | "basse">(item?.priorite || "normale")
  const [saving, setSaving]        = useState(false)

  const save = async () => {
    if (!titre.trim()) return
    setSaving(true)
    const data = {
      society_id: societyId,
      user_id: profile.id,
      user_nom: profile.nom || "Utilisateur",
      titre: titre.trim(),
      notes: notes || null,
      priorite,
      semaine: "2000-01-01", // valeur fixe inutilisée
      done: false,
    }
    if (item?.id) await supabase.from("cahier_charges").update(data).eq("id", item.id)
    else await supabase.from("cahier_charges").insert(data)
    setSaving(false); onDone(); onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-[#111111] border border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-zinc-800">
          <h3 className="text-white font-bold">{item ? "Modifier la tâche" : "Ajouter une tâche fixe"}</h3>
          <button onClick={onClose} className="text-zinc-500 hover:text-white"><X size={16} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Tâche *</label>
            <input value={titre} onChange={e => setPriorite_titre(e.target.value)} placeholder="Ex: Préparer les commandes fournisseurs" autoFocus
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/60" />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Priorité</label>
            <div className="flex gap-2">
              {(["haute", "normale", "basse"] as const).map(p => (
                <button key={p} onClick={() => setPriorite(p)}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${priorite === p ? PRIORITE_CFG[p].bg + " " + PRIORITE_CFG[p].border : "bg-zinc-800 border-zinc-700 text-zinc-500"}`}
                  style={priorite === p ? { color: PRIORITE_CFG[p].color } : {}}>
                  {PRIORITE_CFG[p].label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Notes (optionnel)</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Détails, contexte..."
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none resize-none" />
          </div>
        </div>
        <div className="p-5 pt-0 flex gap-3">
          <button onClick={save} disabled={saving || !titre.trim()}
            className="flex-1 bg-blue-500 hover:bg-blue-400 disabled:opacity-40 text-white font-bold py-3 rounded-xl text-sm">
            {saving ? "Sauvegarde..." : item ? "Modifier" : "Ajouter"}
          </button>
          <button onClick={onClose} className="px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold rounded-xl text-sm">Annuler</button>
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════
   MAIN
══════════════════════════════════════════════ */
export default function AgendaModule({ activeSociety, profile }: Props) {
  const [taches, setTaches]               = useState<Tache[]>([])
  const [cahier, setCahier]               = useState<CahierItem[]>([])
  const [loading, setLoading]             = useState(true)
  const [showForm, setShowForm]           = useState(false)
  const [editTache, setEditTache]         = useState<Tache | null>(null)
  const [showCahierForm, setShowCahierForm] = useState(false)
  const [editCahierItem, setEditCahierItem] = useState<CahierItem | null>(null)
  const [formDate, setFormDate]           = useState("")
  const [formHeure, setFormHeure]         = useState("")
  const [view, setView]                   = useState<"week" | "list" | "cahier">("week")
  const [weekStart, setWeekStart]         = useState(() => getMondayOf(new Date()))

  const todayStr = new Date().toISOString().slice(0, 10)

  const load = useCallback(async () => {
    if (!activeSociety?.id) return
    setLoading(true)
    const [{ data: tachesData }, { data: cahierData }] = await Promise.all([
      supabase.from("taches").select("*").eq("society_id", activeSociety.id)
        .order("date").order("heure_debut"),
      supabase.from("cahier_charges").select("*").eq("society_id", activeSociety.id)
        .order("priorite").order("created_at"),
    ])
    setTaches(tachesData || [])
    setCahier(cahierData || [])
    setLoading(false)
  }, [activeSociety?.id])

  useEffect(() => { load() }, [load])

  const toggleDone = async (t: Tache) => {
    await supabase.from("taches").update({ done: !t.done }).eq("id", t.id)
    setTaches(prev => prev.map(x => x.id === t.id ? { ...x, done: !x.done } : x))
  }

  const deleteTache = async (id: string) => {
    if (!confirm("Supprimer cette tâche ?")) return
    await supabase.from("taches").delete().eq("id", id)
    setTaches(prev => prev.filter(x => x.id !== id))
  }

  const toggleCahierDone = async (item: CahierItem) => {
    await supabase.from("cahier_charges").update({ done: !item.done }).eq("id", item.id)
    setCahier(prev => prev.map(x => x.id === item.id ? { ...x, done: !x.done } : x))
  }

  const deleteCahierItem = async (id: string) => {
    if (!confirm("Supprimer cette tâche ?")) return
    await supabase.from("cahier_charges").delete().eq("id", id)
    setCahier(prev => prev.filter(x => x.id !== id))
  }

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart); d.setDate(d.getDate() + i); return d
  })

  // Cahier : toutes les tâches (pas de filtre semaine)
  const cahierTodo = cahier.filter(c => !c.done)
  const cahierDone = cahier.filter(c => c.done)
  const progress   = cahier.length > 0 ? Math.round((cahierDone.length / cahier.length) * 100) : 0

  const prevWeek = () => setWeekStart(d => { const n = new Date(d); n.setDate(n.getDate() - 7); return n })
  const nextWeek = () => setWeekStart(d => { const n = new Date(d); n.setDate(n.getDate() + 7); return n })
  const goToday  = () => setWeekStart(getMondayOf(new Date()))

  const dayStr      = (d: Date) => d.toISOString().slice(0, 10)
  const DAY_LABELS  = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"]
  const MONTH_LABELS = ["jan","fév","mar","avr","mai","jun","jul","aoû","sep","oct","nov","déc"]

  const getTacheStyle = (t: Tache) => {
    const hStart = parseInt(t.heure_debut.slice(0, 2)) + parseFloat(t.heure_debut.slice(3, 5)) / 60
    const hEnd   = t.heure_fin ? parseInt(t.heure_fin.slice(0, 2)) + parseFloat(t.heure_fin.slice(3, 5)) / 60 : hStart + 1
    return { top: (hStart - 7) * 56, height: Math.max((hEnd - hStart) * 56, 28) }
  }

  const upcomingTaches = taches.filter(t => t.date >= todayStr && !t.done)
    .sort((a, b) => a.date.localeCompare(b.date) || a.heure_debut.localeCompare(b.heure_debut))
    .slice(0, 20)

  return (
    <div className="flex-1 overflow-y-auto bg-[#0a0a0a]">
      <div className="p-6 max-w-7xl mx-auto">

        {/* HEADER */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-white">📅 Agenda & Tâches</h1>
            <p className="text-zinc-500 text-sm mt-0.5">{taches.filter(t => !t.done).length} tâche{taches.filter(t => !t.done).length > 1 ? "s" : ""} à faire</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-xl p-1">
              {([
                { id: "week",   label: "📅 Semaine" },
                { id: "list",   label: "📋 Liste"   },
                { id: "cahier", label: "📒 Cahier"  },
              ] as const).map(v => (
                <button key={v.id} onClick={() => setView(v.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${view === v.id ? "bg-blue-500 text-white" : "text-zinc-500 hover:text-zinc-300"}`}>
                  {v.label}
                </button>
              ))}
            </div>
            {view !== "cahier" ? (
              <button onClick={() => { setEditTache(null); setFormDate(todayStr); setFormHeure("09:00"); setShowForm(true) }}
                className="flex items-center gap-2 bg-blue-500 hover:bg-blue-400 text-white font-bold px-4 py-2.5 rounded-xl text-sm">
                <Plus size={15} /> Nouvelle tâche
              </button>
            ) : (
              <button onClick={() => { setEditCahierItem(null); setShowCahierForm(true) }}
                className="flex items-center gap-2 bg-blue-500 hover:bg-blue-400 text-white font-bold px-4 py-2.5 rounded-xl text-sm">
                <Plus size={15} /> Ajouter
              </button>
            )}
          </div>
        </div>

        {/* ── VUE SEMAINE ── */}
        {view === "week" && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <button onClick={prevWeek} className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg"><ChevronLeft size={16} /></button>
                <button onClick={goToday} className="px-3 py-1 text-xs font-semibold text-zinc-300 bg-zinc-800 hover:bg-zinc-700 rounded-lg">Aujourd'hui</button>
                <button onClick={nextWeek} className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg"><ChevronRight size={16} /></button>
              </div>
              <p className="text-white font-semibold text-sm">
                {weekDays[0].getDate()} {MONTH_LABELS[weekDays[0].getMonth()]} — {weekDays[6].getDate()} {MONTH_LABELS[weekDays[6].getMonth()]} {weekDays[0].getFullYear()}
              </p>
              <div />
            </div>

            <div className="grid border-b border-zinc-800" style={{ gridTemplateColumns: "48px repeat(7,1fr)" }}>
              <div className="border-r border-zinc-800" />
              {weekDays.map((d, i) => {
                const ds = dayStr(d)
                const isToday = ds === todayStr
                const count = taches.filter(t => t.date === ds).length
                return (
                  <div key={i} className={`py-2 px-1 text-center border-r border-zinc-800 last:border-0 ${isToday ? "bg-blue-500/10" : ""}`}>
                    <p className={`text-[10px] font-semibold uppercase ${isToday ? "text-blue-400" : "text-zinc-500"}`}>{DAY_LABELS[i]}</p>
                    <p className={`text-lg font-black ${isToday ? "text-blue-400" : "text-zinc-300"}`}>{d.getDate()}</p>
                    {count > 0 && <p className="text-[9px] text-zinc-600">{count} tâche{count > 1 ? "s" : ""}</p>}
                  </div>
                )
              })}
            </div>

            <div className="overflow-y-auto max-h-[600px] relative">
              <div className="grid relative" style={{ gridTemplateColumns: "48px repeat(7,1fr)" }}>
                <div className="sticky left-0 z-10">
                  {HOURS.map(h => (
                    <div key={h} className="h-14 border-b border-zinc-800 flex items-start justify-end pr-2 pt-1">
                      <span className="text-zinc-600 text-[10px]">{h}h</span>
                    </div>
                  ))}
                </div>
                {weekDays.map((d, di) => {
                  const ds = dayStr(d)
                  const isToday = ds === todayStr
                  const dayTaches = taches.filter(t => t.date === ds)
                  return (
                    <div key={di} className={`relative border-r border-zinc-800 last:border-0 ${isToday ? "bg-blue-500/5" : ""}`}>
                      {HOURS.map(h => (
                        <div key={h} onClick={() => {
                          setEditTache(null)
                          setFormDate(ds)
                          setFormHeure(`${h.toString().padStart(2, "0")}:00`)
                          setShowForm(true)
                        }} className="h-14 border-b border-zinc-800/50 hover:bg-zinc-800/30 cursor-pointer transition-colors" />
                      ))}
                      {dayTaches.map(t => {
                        const { top, height } = getTacheStyle(t)
                        return (
                          <div key={t.id} className="absolute left-0.5 right-0.5 rounded-lg px-1.5 py-1 overflow-hidden cursor-pointer group"
                            style={{ top, height, backgroundColor: t.couleur + "e0", minHeight: 26 }}
                            onClick={() => { setEditTache(t); setShowForm(true) }}>
                            <div className="flex items-start justify-between gap-1">
                              <p className={`text-[10px] font-bold text-black leading-tight truncate ${t.done ? "line-through opacity-60" : ""}`}>{t.titre}</p>
                              <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                <button onClick={e => { e.stopPropagation(); toggleDone(t) }}
                                  className="w-4 h-4 rounded bg-black/20 hover:bg-black/40 flex items-center justify-center">
                                  <Check size={10} className="text-black" />
                                </button>
                                <button onClick={e => { e.stopPropagation(); deleteTache(t.id) }}
                                  className="w-4 h-4 rounded bg-black/20 hover:bg-red-500/60 flex items-center justify-center">
                                  <X size={10} className="text-black" />
                                </button>
                              </div>
                            </div>
                            {height > 36 && <p className="text-[9px] text-black/70">{t.heure_debut}{t.heure_fin ? ` → ${t.heure_fin}` : ""}</p>}
                            {height > 50 && t.user_nom && <p className="text-[9px] text-black/60">{t.user_nom}</p>}
                          </div>
                        )
                      })}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── VUE LISTE ── */}
        {view === "list" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-white font-bold text-sm mb-3 flex items-center gap-2">
                <Clock size={14} className="text-blue-400" /> À venir
              </h2>
              {upcomingTaches.length === 0 ? (
                <div className="text-center py-12 text-zinc-600 bg-zinc-900 border border-zinc-800 rounded-2xl">
                  <p className="text-sm">Aucune tâche à venir</p>
                  <button onClick={() => { setEditTache(null); setFormDate(todayStr); setFormHeure("09:00"); setShowForm(true) }}
                    className="mt-3 text-blue-400 text-xs hover:underline">+ Ajouter une tâche</button>
                </div>
              ) : (
                <div className="space-y-2">
                  {upcomingTaches.map(t => (
                    <div key={t.id} className={`flex items-center gap-3 bg-zinc-900 border rounded-xl px-4 py-3 hover:border-zinc-600 transition-colors group ${t.done ? "opacity-50 border-zinc-800" : "border-zinc-800"}`}>
                      <div style={{ backgroundColor: t.couleur, width: 4, minHeight: 40, borderRadius: 4 }} className="shrink-0" />
                      <button onClick={() => toggleDone(t)}
                        className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-colors ${t.done ? "bg-green-500 border-green-500" : "border-zinc-600 hover:border-green-400"}`}>
                        {t.done && <Check size={11} className="text-white" />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold text-white ${t.done ? "line-through" : ""}`}>{t.titre}</p>
                        <p className="text-zinc-500 text-xs">
                          {new Date(t.date + "T00:00:00").toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" })} · {t.heure_debut}{t.heure_fin ? ` → ${t.heure_fin}` : ""}
                          {t.user_nom && <span className="ml-2 text-zinc-600">· {t.user_nom}</span>}
                        </p>
                        {t.notes && <p className="text-zinc-600 text-xs mt-0.5 truncate">{t.notes}</p>}
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => { setEditTache(t); setShowForm(true) }} className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800"><Pencil size={13} /></button>
                        <button onClick={() => deleteTache(t.id)} className="p-1.5 text-zinc-700 hover:text-red-400 rounded-lg hover:bg-red-500/10"><Trash2 size={13} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {taches.filter(t => t.done).length > 0 && (
              <div>
                <h2 className="text-zinc-600 font-bold text-sm mb-3">✓ Terminées ({taches.filter(t => t.done).length})</h2>
                <div className="space-y-1.5">
                  {taches.filter(t => t.done).slice(0, 5).map(t => (
                    <div key={t.id} className="flex items-center gap-3 px-4 py-2 bg-zinc-900/50 border border-zinc-800/50 rounded-xl opacity-50">
                      <div className="w-1 h-8 rounded-full shrink-0" style={{ backgroundColor: t.couleur }} />
                      <p className="text-sm text-zinc-500 line-through flex-1 truncate">{t.titre}</p>
                      <button onClick={() => deleteTache(t.id)} className="text-zinc-700 hover:text-red-400 p-1 rounded"><Trash2 size={12} /></button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── VUE CAHIER DES CHARGES (tâches fixes) ── */}
        {view === "cahier" && (
          <div className="space-y-5">

            {/* Stats globales */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4 text-center">
                <p className="text-2xl font-black text-white">{cahier.length}</p>
                <p className="text-zinc-500 text-xs mt-0.5">Total tâches</p>
              </div>
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4 text-center">
                <p className="text-2xl font-black text-yellow-400">{cahierTodo.length}</p>
                <p className="text-zinc-500 text-xs mt-0.5">À faire</p>
              </div>
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4 text-center">
                <p className="text-2xl font-black text-green-400">{cahierDone.length}</p>
                <p className="text-zinc-500 text-xs mt-0.5">Terminées</p>
              </div>
            </div>

            {/* Barre de progression globale */}
            {cahier.length > 0 && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-zinc-400 text-xs font-semibold">Progression globale</p>
                  <p className="text-white font-bold text-sm">{progress}%</p>
                </div>
                <div className="h-2.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${progress}%`, backgroundColor: progress === 100 ? "#22c55e" : "#3b82f6" }} />
                </div>
                {progress === 100 && (
                  <p className="text-green-400 text-xs font-semibold mt-2 text-center">🎉 Toutes les tâches sont terminées !</p>
                )}
              </div>
            )}

            {/* Tâches à faire */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-white font-bold text-sm flex items-center gap-2">
                  <BookOpen size={14} className="text-blue-400" />
                  Cahier des charges
                  {cahierTodo.length > 0 && (
                    <span className="bg-blue-500/20 text-blue-400 text-[10px] font-bold px-2 py-0.5 rounded-full">{cahierTodo.length}</span>
                  )}
                </h2>
              </div>

              {cahierTodo.length === 0 ? (
                <div className="text-center py-14 bg-zinc-900 border border-zinc-800 rounded-2xl border-dashed">
                  <p className="text-4xl mb-3">📒</p>
                  <p className="text-zinc-500 text-sm font-semibold">Aucune tâche en cours</p>
                  <p className="text-zinc-600 text-xs mt-1 mb-4">Ajoute les tâches récurrentes à accomplir</p>
                  <button onClick={() => { setEditCahierItem(null); setShowCahierForm(true) }}
                    className="inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-400 text-white font-bold px-4 py-2 rounded-xl text-sm">
                    <Plus size={14} /> Ajouter une tâche
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {(["haute", "normale", "basse"] as const).map(prio => {
                    const items = cahierTodo.filter(c => c.priorite === prio)
                    if (items.length === 0) return null
                    const cfg = PRIORITE_CFG[prio]
                    return (
                      <div key={prio}>
                        <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5 px-1" style={{ color: cfg.color }}>
                          {cfg.label}
                        </p>
                        <div className="space-y-2 mb-3">
                          {items.map(item => (
                            <div key={item.id}
                              className={`flex items-start gap-3 bg-zinc-900 border rounded-xl px-4 py-3.5 hover:border-zinc-600 transition-colors group ${cfg.border}`}>
                              <button onClick={() => toggleCahierDone(item)}
                                className="w-5 h-5 rounded border border-zinc-600 hover:border-green-400 flex items-center justify-center shrink-0 mt-0.5 transition-colors">
                              </button>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-white">{item.titre}</p>
                                {item.notes && <p className="text-zinc-500 text-xs mt-0.5">{item.notes}</p>}
                                {item.user_nom && <p className="text-zinc-600 text-[10px] mt-1">par {item.user_nom}</p>}
                              </div>
                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                <button onClick={() => { setEditCahierItem(item); setShowCahierForm(true) }}
                                  className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800"><Pencil size={13} /></button>
                                <button onClick={() => deleteCahierItem(item.id)}
                                  className="p-1.5 text-zinc-700 hover:text-red-400 rounded-lg hover:bg-red-500/10"><Trash2 size={13} /></button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Tâches terminées */}
            {cahierDone.length > 0 && (
              <div>
                <h2 className="text-zinc-600 font-bold text-sm mb-3">✓ Terminées ({cahierDone.length})</h2>
                <div className="space-y-1.5">
                  {cahierDone.map(item => (
                    <div key={item.id} className="flex items-center gap-3 px-4 py-2.5 bg-zinc-900/50 border border-zinc-800/50 rounded-xl">
                      <button onClick={() => toggleCahierDone(item)}
                        className="w-5 h-5 rounded bg-green-500 border-green-500 border flex items-center justify-center shrink-0">
                        <Check size={11} className="text-white" />
                      </button>
                      <p className="text-sm text-zinc-500 line-through flex-1 truncate">{item.titre}</p>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
                        style={{ color: PRIORITE_CFG[item.priorite].color, backgroundColor: PRIORITE_CFG[item.priorite].color + "20" }}>
                        {PRIORITE_CFG[item.priorite].label}
                      </span>
                      <button onClick={() => deleteCahierItem(item.id)} className="text-zinc-700 hover:text-red-400 p-1 rounded shrink-0"><Trash2 size={12} /></button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {showForm && (
        <TacheForm
          societyId={activeSociety.id} profile={profile}
          tache={editTache || undefined}
          date={formDate || undefined} heure={formHeure || undefined}
          onClose={() => { setShowForm(false); setEditTache(null) }}
          onDone={load}
        />
      )}

      {showCahierForm && (
        <CahierForm
          societyId={activeSociety.id} profile={profile}
          item={editCahierItem || undefined}
          onClose={() => { setShowCahierForm(false); setEditCahierItem(null) }}
          onDone={load}
        />
      )}
    </div>
  )
}