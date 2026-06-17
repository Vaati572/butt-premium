"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { supabase } from "@/lib/supabase"
import {
  Plus, X, Search, Check, Trash2, AlertTriangle, Clock, CheckCircle2,
  Circle, List, LayoutGrid, ChevronLeft, ChevronRight, Tag, Flag, Pencil,
} from "lucide-react"

interface Props { activeSociety: any; profile: any }

interface Tache {
  id: string
  titre: string
  description?: string | null
  priorite: "basse" | "normale" | "haute" | "urgente"
  statut: "a_faire" | "en_cours" | "termine"
  echeance?: string | null
  categorie?: string | null
  assigne_id?: string | null
  created_by?: string | null
  completed_at?: string | null
  created_at: string
}

interface Membre { id: string; nom: string; avatar_url?: string; color?: string }

const PRIORITE: Record<Tache["priorite"], { label: string; color: string; bg: string; border: string; order: number }> = {
  basse:   { label: "Basse",   color: "#71717a", bg: "rgba(113,113,122,0.12)", border: "rgba(113,113,122,0.35)", order: 0 },
  normale: { label: "Normale", color: "#3b82f6", bg: "rgba(59,130,246,0.12)",  border: "rgba(59,130,246,0.35)",  order: 1 },
  haute:   { label: "Haute",   color: "#f97316", bg: "rgba(249,115,22,0.12)",  border: "rgba(249,115,22,0.4)",   order: 2 },
  urgente: { label: "Urgente", color: "#ef4444", bg: "rgba(239,68,68,0.14)",   border: "rgba(239,68,68,0.45)",   order: 3 },
}

const STATUTS: { key: Tache["statut"]; label: string; color: string }[] = [
  { key: "a_faire",  label: "À faire",  color: "#a1a1aa" },
  { key: "en_cours", label: "En cours", color: "#eab308" },
  { key: "termine",  label: "Terminé",  color: "#22c55e" },
]
const STATUT_CYCLE: Tache["statut"][] = ["a_faire", "en_cours", "termine"]

const TODAY = new Date()
const todayStr = () => TODAY.toISOString().slice(0, 10)
const daysDiff = (dateStr: string) => Math.floor((TODAY.getTime() - new Date(dateStr + "T00:00:00").getTime()) / 86400000)

const echeanceInfo = (echeance: string | null | undefined, statut: Tache["statut"]) => {
  if (!echeance) return null
  if (statut === "termine") return { label: new Date(echeance + "T00:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short" }), color: "#52525b" }
  const diff = daysDiff(echeance)
  if (diff > 0)  return { label: `Retard ${diff}j`, color: "#ef4444" }
  if (diff === 0) return { label: "Aujourd'hui", color: "#f97316" }
  if (diff === -1) return { label: "Demain", color: "#eab308" }
  return { label: new Date(echeance + "T00:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short" }), color: "#71717a" }
}

const initials = (nom?: string) => nom?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "?"

/* ── Panel création / édition ── */
function TachePanel({ tache, membres, societyId, createdBy, onClose, onSaved }: {
  tache: Tache | null; membres: Membre[]; societyId: string; createdBy: string
  onClose: () => void; onSaved: () => void
}) {
  const [titre, setTitre]             = useState(tache?.titre || "")
  const [description, setDescription] = useState(tache?.description || "")
  const [priorite, setPriorite]       = useState<Tache["priorite"]>(tache?.priorite || "normale")
  const [statut, setStatut]           = useState<Tache["statut"]>(tache?.statut || "a_faire")
  const [echeance, setEcheance]       = useState(tache?.echeance || "")
  const [categorie, setCategorie]     = useState(tache?.categorie || "")
  const [assigneId, setAssigneId]     = useState(tache?.assigne_id || "")
  const [saving, setSaving]           = useState(false)
  const titreRef = useRef<HTMLInputElement>(null)

  useEffect(() => { if (!tache) setTimeout(() => titreRef.current?.focus(), 100) }, [])

  const save = async () => {
    if (!titre.trim()) return
    setSaving(true)
    const payload: any = {
      society_id: societyId, titre: titre.trim(), description: description || null,
      priorite, statut, echeance: echeance || null, categorie: categorie || null,
      assigne_id: assigneId || null,
    }
    if (statut === "termine" && tache?.statut !== "termine") payload.completed_at = new Date().toISOString()
    if (statut !== "termine") payload.completed_at = null
    if (tache?.id) {
      await supabase.from("taches").update(payload).eq("id", tache.id)
    } else {
      payload.created_by = createdBy
      await supabase.from("taches").insert(payload)
    }
    setSaving(false); onSaved(); onClose()
  }

  const deleteTache = async () => {
    if (!tache?.id || !confirm("Supprimer cette tâche ?")) return
    await supabase.from("taches").delete().eq("id", tache.id)
    onSaved(); onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end">
      <div className="bg-[#111111] border-l border-zinc-800 w-full max-w-sm h-full flex flex-col shadow-2xl">
        <div className="px-5 py-4 border-b border-zinc-800 shrink-0 flex items-start justify-between">
          <div>
            <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider mb-0.5">
              {tache ? "Modifier la tâche" : "Nouvelle tâche"}
            </p>
            <h2 className="text-white font-bold text-base">{tache ? "Détails" : "Créer une tâche"}</h2>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white"><X size={16}/></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-zinc-600 uppercase tracking-wider mb-1.5">Titre</label>
            <input ref={titreRef} type="text" value={titre} onChange={e => setTitre(e.target.value)}
              placeholder="Ex: Corriger le bug de stock..."
              onKeyDown={e => e.key === "Enter" && titre.trim() && save()}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 font-semibold focus:outline-none focus:border-yellow-500/60"/>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-zinc-600 uppercase tracking-wider mb-1.5">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3}
              placeholder="Détails, contexte, étapes..."
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none resize-none"/>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-zinc-600 uppercase tracking-wider mb-2">🚩 Priorité</label>
            <div className="grid grid-cols-4 gap-1.5">
              {(Object.entries(PRIORITE) as [Tache["priorite"], typeof PRIORITE.basse][]).map(([key, cfg]) => {
                const isActive = priorite === key
                return (
                  <button key={key} onClick={() => setPriorite(key)}
                    className="flex flex-col items-center gap-1 py-2.5 rounded-xl border text-xs font-bold transition-all"
                    style={{
                      backgroundColor: isActive ? cfg.bg : "rgba(39,39,42,0.5)",
                      borderColor: isActive ? cfg.border : "rgba(63,63,70,0.5)",
                      color: isActive ? cfg.color : "#52525b",
                    }}>
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cfg.color }}/>
                    <span className="text-[10px]">{cfg.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {tache && (
            <div>
              <label className="block text-[10px] font-bold text-zinc-600 uppercase tracking-wider mb-2">Statut</label>
              <div className="grid grid-cols-3 gap-1.5">
                {STATUTS.map(s => {
                  const isActive = statut === s.key
                  return (
                    <button key={s.key} onClick={() => setStatut(s.key)}
                      className="flex flex-col items-center gap-1 py-2.5 rounded-xl border text-xs font-bold transition-all"
                      style={{
                        backgroundColor: isActive ? s.color + "18" : "rgba(39,39,42,0.5)",
                        borderColor: isActive ? s.color + "50" : "rgba(63,63,70,0.5)",
                        color: isActive ? s.color : "#52525b",
                      }}>
                      <span className="text-[10px]">{s.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          <div>
            <label className="block text-[10px] font-bold text-zinc-600 uppercase tracking-wider mb-1.5">Échéance</label>
            <input type="date" value={echeance} onChange={e => setEcheance(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"/>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-zinc-600 uppercase tracking-wider mb-1.5">Assigné à</label>
            <select value={assigneId} onChange={e => setAssigneId(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none">
              <option value="">— Personne en particulier —</option>
              {membres.map(m => <option key={m.id} value={m.id}>{m.nom}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-zinc-600 uppercase tracking-wider mb-1.5">Catégorie</label>
            <input type="text" value={categorie} onChange={e => setCategorie(e.target.value)}
              placeholder="Ex: VaatiMod, CRM, Prospection..."
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none"/>
          </div>
        </div>

        <div className="p-4 border-t border-zinc-800 space-y-2 shrink-0">
          <button onClick={save} disabled={saving || !titre.trim()}
            className="w-full py-3 rounded-xl bg-yellow-500 hover:bg-yellow-400 disabled:opacity-40 text-black font-bold text-sm flex items-center justify-center gap-2">
            {saving ? <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"/> : <><Check size={14}/> {tache ? "Mettre à jour" : "Créer la tâche"}</>}
          </button>
          {tache && (
            <button onClick={deleteTache}
              className="w-full py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400/70 hover:bg-red-500/15 font-semibold text-sm flex items-center justify-center gap-2">
              <Trash2 size={12}/> Supprimer
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── Ligne vue Liste ── */
function TacheRow({ tache, membre, onOpen, onCycleStatut }: {
  tache: Tache; membre?: Membre; onOpen: () => void; onCycleStatut: () => void
}) {
  const ech = echeanceInfo(tache.echeance, tache.statut)
  const prio = PRIORITE[tache.priorite]
  const isDone = tache.statut === "termine"
  return (
    <div className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-xl px-3 py-3 transition-colors group"
      style={{ opacity: isDone ? 0.55 : 1 }}>
      <button onClick={onCycleStatut} className="shrink-0">
        {tache.statut === "termine" ? <CheckCircle2 size={20} className="text-green-500"/> :
         tache.statut === "en_cours" ? <Clock size={20} className="text-yellow-500"/> :
         <Circle size={20} className="text-zinc-600 group-hover:text-zinc-400"/>}
      </button>
      <button onClick={onOpen} className="flex-1 min-w-0 text-left">
        <p className={`text-white text-sm font-semibold truncate ${isDone ? "line-through text-zinc-500" : ""}`}>{tache.titre}</p>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <span className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: prio.bg, color: prio.color }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: prio.color }}/>{prio.label}
          </span>
          {ech && <span className="text-[10px] font-semibold" style={{ color: ech.color }}>📅 {ech.label}</span>}
          {tache.categorie && <span className="text-[10px] text-zinc-500">🏷️ {tache.categorie}</span>}
        </div>
      </button>
      {membre && (
        <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-black shrink-0"
          style={{ backgroundColor: membre.color || "#eab308" }} title={membre.nom}>
          {membre.avatar_url ? <img src={membre.avatar_url} className="w-full h-full rounded-full object-cover"/> : initials(membre.nom)}
        </div>
      )}
    </div>
  )
}

/* ── Carte vue Kanban ── */
function TacheCard({ tache, membre, onOpen, onMove }: {
  tache: Tache; membre?: Membre; onOpen: () => void; onMove: (dir: 1 | -1) => void
}) {
  const ech = echeanceInfo(tache.echeance, tache.statut)
  const prio = PRIORITE[tache.priorite]
  const idx = STATUT_CYCLE.indexOf(tache.statut)
  return (
    <div className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-xl p-3 transition-colors group"
      style={{ borderLeft: `3px solid ${prio.color}` }}>
      <button onClick={onOpen} className="w-full text-left">
        <p className="text-white text-sm font-semibold leading-snug mb-1.5">{tache.titre}</p>
        <div className="flex items-center gap-1.5 flex-wrap">
          {ech && <span className="text-[10px] font-semibold" style={{ color: ech.color }}>📅 {ech.label}</span>}
          {tache.categorie && <span className="text-[10px] text-zinc-500">🏷️ {tache.categorie}</span>}
        </div>
      </button>
      <div className="flex items-center justify-between mt-2.5">
        <div className="flex items-center gap-1">
          <button onClick={() => onMove(-1)} disabled={idx === 0}
            className="w-6 h-6 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-20 flex items-center justify-center text-zinc-400"><ChevronLeft size={12}/></button>
          <button onClick={() => onMove(1)} disabled={idx === STATUT_CYCLE.length - 1}
            className="w-6 h-6 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-20 flex items-center justify-center text-zinc-400"><ChevronRight size={12}/></button>
        </div>
        {membre && (
          <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-black shrink-0"
            style={{ backgroundColor: membre.color || "#eab308" }} title={membre.nom}>
            {membre.avatar_url ? <img src={membre.avatar_url} className="w-full h-full rounded-full object-cover"/> : initials(membre.nom)}
          </div>
        )}
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════
   MAIN MODULE
══════════════════════════════════════════════ */
export default function TachesModule({ activeSociety, profile }: Props) {
  const [taches, setTaches]   = useState<Tache[]>([])
  const [membres, setMembres] = useState<Membre[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView]       = useState<"liste" | "kanban">("liste")
  const [search, setSearch]   = useState("")
  const [filterStatut, setFilterStatut]   = useState<"toutes" | Tache["statut"]>("toutes")
  const [filterAssigne, setFilterAssigne] = useState<"tous" | "moi" | string>("tous")
  const [panelTache, setPanelTache] = useState<Tache | null | undefined>(undefined) // undefined = closed

  const load = useCallback(async () => {
    if (!activeSociety?.id) return
    setLoading(true)
    const [{ data: t }, { data: mem }] = await Promise.all([
      supabase.from("taches").select("*").eq("society_id", activeSociety.id).order("created_at", { ascending: false }),
      supabase.from("profiles").select("id,nom,avatar_url,color").eq("society_id", activeSociety.id),
    ])
    setTaches(t || [])
    setMembres(mem || [])
    setLoading(false)
  }, [activeSociety?.id])

  useEffect(() => { load() }, [load])

  const getMembre = (id?: string | null) => membres.find(m => m.id === id)

  const cycleStatut = async (tache: Tache) => {
    const idx = STATUT_CYCLE.indexOf(tache.statut)
    const next = STATUT_CYCLE[(idx + 1) % STATUT_CYCLE.length]
    const payload: any = { statut: next, completed_at: next === "termine" ? new Date().toISOString() : null }
    await supabase.from("taches").update(payload).eq("id", tache.id)
    setTaches(prev => prev.map(t => t.id === tache.id ? { ...t, ...payload } : t))
  }

  const moveStatut = async (tache: Tache, dir: 1 | -1) => {
    const idx = STATUT_CYCLE.indexOf(tache.statut)
    const nextIdx = idx + dir
    if (nextIdx < 0 || nextIdx >= STATUT_CYCLE.length) return
    const next = STATUT_CYCLE[nextIdx]
    const payload: any = { statut: next, completed_at: next === "termine" ? new Date().toISOString() : null }
    await supabase.from("taches").update(payload).eq("id", tache.id)
    setTaches(prev => prev.map(t => t.id === tache.id ? { ...t, ...payload } : t))
  }

  const filtered = taches.filter(t => {
    if (filterStatut !== "toutes" && t.statut !== filterStatut) return false
    if (filterAssigne === "moi" && t.assigne_id !== profile?.id) return false
    if (filterAssigne !== "tous" && filterAssigne !== "moi" && t.assigne_id !== filterAssigne) return false
    if (search) {
      const s = search.toLowerCase()
      if (!t.titre.toLowerCase().includes(s) && !(t.description || "").toLowerCase().includes(s) && !(t.categorie || "").toLowerCase().includes(s)) return false
    }
    return true
  })

  const sorted = [...filtered].sort((a, b) => {
    if (a.statut === "termine" && b.statut !== "termine") return 1
    if (b.statut === "termine" && a.statut !== "termine") return -1
    const pDiff = PRIORITE[b.priorite].order - PRIORITE[a.priorite].order
    if (pDiff !== 0) return pDiff
    if (a.echeance && b.echeance) return a.echeance < b.echeance ? -1 : 1
    if (a.echeance) return -1
    if (b.echeance) return 1
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  const actives     = taches.filter(t => t.statut !== "termine")
  const urgentes    = actives.filter(t => t.priorite === "urgente").length
  const enRetard    = actives.filter(t => t.echeance && t.echeance < todayStr()).length
  const termineesAuj = taches.filter(t => t.statut === "termine" && t.completed_at && t.completed_at.slice(0, 10) === todayStr()).length

  return (
    <div className="flex-1 overflow-hidden bg-[#0a0a0a] flex flex-col">
      <div className="border-b border-zinc-900 px-4 pt-4 pb-3 shrink-0 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h1 className="text-white font-bold text-xl">✅ Liste des tâches</h1>
            <p className="text-zinc-500 text-xs mt-0.5">{actives.length} active{actives.length > 1 ? "s" : ""} · {taches.length} au total</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-0.5 bg-zinc-900 border border-zinc-800 rounded-xl p-1">
              <button onClick={() => setView("liste")}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                style={{ backgroundColor: view === "liste" ? "#eab30820" : "transparent", color: view === "liste" ? "#eab308" : "#71717a" }}>
                <List size={15}/>
              </button>
              <button onClick={() => setView("kanban")}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                style={{ backgroundColor: view === "kanban" ? "#eab30820" : "transparent", color: view === "kanban" ? "#eab308" : "#71717a" }}>
                <LayoutGrid size={15}/>
              </button>
            </div>
            <button onClick={() => setPanelTache(null)}
              className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-4 py-2.5 rounded-xl text-sm shadow-lg shadow-yellow-500/20">
              <Plus size={15}/> Nouvelle tâche
            </button>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {[
            { label: "Actives",   value: String(actives.length),       color: "text-zinc-300" },
            { label: "Urgentes",  value: String(urgentes),             color: urgentes > 0 ? "text-red-400" : "text-zinc-500" },
            { label: "En retard", value: String(enRetard),             color: enRetard > 0 ? "text-orange-400" : "text-zinc-500" },
            { label: "Terminées aujourd'hui", value: String(termineesAuj), color: "text-green-400" },
          ].map(({ label, value, color }) => (
            <div key={label} className="shrink-0 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 flex items-center gap-2">
              <p className={`text-sm font-black ${color}`}>{value}</p>
              <p className="text-zinc-600 text-[10px]">{label}</p>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[160px]">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"/>
            <input type="text" placeholder="Rechercher une tâche..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-500/40"/>
            {search && <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-white"><X size={12}/></button>}
          </div>
          <select value={filterStatut} onChange={e => setFilterStatut(e.target.value as any)}
            className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none">
            <option value="toutes">Tous statuts</option>
            {STATUTS.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
          <select value={filterAssigne} onChange={e => setFilterAssigne(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none">
            <option value="tous">Tout le monde</option>
            <option value="moi">Assignées à moi</option>
            {membres.map(m => <option key={m.id} value={m.id}>{m.nom}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center"><div className="w-6 h-6 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin"/></div>
      ) : sorted.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
          <div className="text-6xl mb-4">✅</div>
          <p className="text-white text-lg font-bold mb-2">{taches.length === 0 ? "Aucune tâche pour le moment" : "Aucun résultat"}</p>
          <p className="text-zinc-500 text-sm mb-6">{taches.length === 0 ? "Crée ta première tâche pour t'organiser" : "Essaie d'autres filtres"}</p>
          {taches.length === 0 && (
            <button onClick={() => setPanelTache(null)} className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-5 py-3 rounded-xl text-sm"><Plus size={15}/> Nouvelle tâche</button>
          )}
        </div>
      ) : view === "liste" ? (
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {sorted.map(t => (
            <TacheRow key={t.id} tache={t} membre={getMembre(t.assigne_id)}
              onOpen={() => setPanelTache(t)} onCycleStatut={() => cycleStatut(t)}/>
          ))}
        </div>
      ) : (
        <div className="flex-1 overflow-x-auto p-4">
          <div className="flex gap-4 h-full min-w-[700px]">
            {STATUTS.map(s => {
              const colTaches = sorted.filter(t => t.statut === s.key)
              return (
                <div key={s.key} className="flex-1 flex flex-col min-w-[220px]">
                  <div className="flex items-center gap-2 mb-3 px-1">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }}/>
                    <p className="text-zinc-300 text-xs font-bold uppercase tracking-wider">{s.label}</p>
                    <span className="text-zinc-600 text-[10px] font-bold ml-auto">{colTaches.length}</span>
                  </div>
                  <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                    {colTaches.length === 0 ? (
                      <p className="text-zinc-700 text-xs text-center py-6">—</p>
                    ) : colTaches.map(t => (
                      <TacheCard key={t.id} tache={t} membre={getMembre(t.assigne_id)}
                        onOpen={() => setPanelTache(t)} onMove={dir => moveStatut(t, dir)}/>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {panelTache !== undefined && (
        <TachePanel tache={panelTache} membres={membres} societyId={activeSociety.id} createdBy={profile?.id || ""}
          onClose={() => setPanelTache(undefined)} onSaved={load}/>
      )}
    </div>
  )
}
