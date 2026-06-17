"use client"

import { useEffect, useState, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import {
  Plus, X, Pencil, Trash2, Check, Clock, ChevronLeft, ChevronRight,
  BookOpen, Calendar, CalendarDays, AlertCircle, Search, ListTodo,
  TrendingUp,
} from "lucide-react"

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

const HOURS = Array.from({ length: 16 }, (_, i) => i + 7) // 7h → 22h
const ROW_H = 56

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
const dayStr = (d: Date) => d.toISOString().slice(0, 10)

const DAY_LABELS   = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"]
const MONTH_LABELS = ["jan","fév","mar","avr","mai","jun","jul","aoû","sep","oct","nov","déc"]

/* ── Mini anneau de progression ── */
function ProgressRing({ percent, size = 56, color = "#22c55e" }: { percent: number; size?: number; color?: string }) {
  const stroke = 6
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const offset = c - (Math.min(100, Math.max(0, percent)) / 100) * c
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90 shrink-0">
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#27272a" strokeWidth={stroke} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 0.6s ease" }} />
    </svg>
  )
}

/* ── Carte stat cliquable ── */
function StatCard({ icon: Icon, label, value, color, onClick, pulse }: {
  icon: any; label: string; value: string | number; color: string; onClick?: () => void; pulse?: boolean
}) {
  return (
    <button onClick={onClick} disabled={!onClick}
      className={`flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3.5 text-left transition-all ${onClick ? "hover:border-zinc-700 hover:bg-zinc-800/60 cursor-pointer" : "cursor-default"}`}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${pulse ? "animate-pulse" : ""}`} style={{ backgroundColor: color + "18" }}>
        <Icon size={18} style={{ color }} />
      </div>
      <div className="min-w-0">
        <p className="text-white text-xl font-black leading-none">{value}</p>
        <p className="text-zinc-500 text-[11px] font-semibold mt-1 truncate">{label}</p>
      </div>
    </button>
  )
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
      heure_fin: heureFin || null, couleur, notes, done: tache?.done ?? false,
    }
    if (tache?.id) await supabase.from("taches").update(data).eq("id", tache.id)
    else await supabase.from("taches").insert(data)
    setSaving(false); onDone(); onClose()
  }

  const couleurLabel = COULEURS.find(c => c.val === couleur)?.label || ""

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#111111] border border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-zinc-800">
          <h3 className="text-white font-bold flex items-center gap-2"><Calendar size={16} className="text-blue-400"/> {tache ? "Modifier la tâche" : "Nouvelle tâche"}</h3>
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
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Couleur</label>
              <span className="text-[11px] text-zinc-400">{couleurLabel}</span>
            </div>
            <div className="flex gap-2 flex-wrap">
              {COULEURS.map(c => (
                <button key={c.val} onClick={() => setCouleur(c.val)}
                  className={`w-9 h-9 rounded-xl border-2 transition-all flex items-center justify-center ${couleur === c.val ? "border-white scale-110 shadow-lg" : "border-transparent"}`}
                  style={{ backgroundColor: c.val }} title={c.label}>
                  {couleur === c.val && <Check size={14} className="text-black/70"/>}
                </button>
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

/* ── FORM CAHIER ── */
function CahierForm({ societyId, profile, item, onClose, onDone }: {
  societyId: string; profile: any; item?: CahierItem; onClose: () => void; onDone: () => void
}) {
  const [titre, setTitreVal]    = useState(item?.titre || "")
  const [notes, setNotes]       = useState(item?.notes || "")
  const [priorite, setPriorite] = useState<"haute" | "normale" | "basse">(item?.priorite || "normale")
  const [saving, setSaving]     = useState(false)

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
      semaine: "2000-01-01",
      done: item?.done ?? false,
    }
    if (item?.id) await supabase.from("cahier_charges").update(data).eq("id", item.id)
    else await supabase.from("cahier_charges").insert(data)
    setSaving(false); onDone(); onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#111111] border border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-zinc-800">
          <h3 className="text-white font-bold flex items-center gap-2"><BookOpen size={16} className="text-blue-400"/> {item ? "Modifier la tâche" : "Ajouter une tâche fixe"}</h3>
          <button onClick={onClose} className="text-zinc-500 hover:text-white"><X size={16} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Tâche *</label>
            <input value={titre} onChange={e => setTitreVal(e.target.value)} placeholder="Ex: Préparer les commandes fournisseurs" autoFocus
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
  const [taches, setTaches]                 = useState<Tache[]>([])
  const [cahier, setCahier]                 = useState<CahierItem[]>([])
  const [loading, setLoading]               = useState(true)
  const [showForm, setShowForm]             = useState(false)
  const [editTache, setEditTache]           = useState<Tache | null>(null)
  const [showCahierForm, setShowCahierForm] = useState(false)
  const [editCahierItem, setEditCahierItem] = useState<CahierItem | null>(null)
  const [formDate, setFormDate]             = useState("")
  const [formHeure, setFormHeure]           = useState("")
  const [view, setView]                     = useState<"week" | "list" | "cahier">("week")
  const [weekStart, setWeekStart]           = useState(() => getMondayOf(new Date()))
  const [search, setSearch]                 = useState("")
  const [tick, setTick]                     = useState(() => Date.now())

  useEffect(() => {
    const id = setInterval(() => setTick(Date.now()), 60000)
    return () => clearInterval(id)
  }, [])

  const now       = new Date(tick)
  const todayStr  = dayStr(now)

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

  /* ── Stats globales (basées sur la vraie semaine actuelle, indépendant de la navigation) ── */
  const realWeekStart    = getMondayOf(now)
  const realWeekEnd      = new Date(realWeekStart); realWeekEnd.setDate(realWeekEnd.getDate() + 6)
  const realWeekStartStr = dayStr(realWeekStart)
  const realWeekEndStr   = dayStr(realWeekEnd)

  const todayTasks   = taches.filter(t => t.date === todayStr && !t.done)
  const overdueTasks = taches.filter(t => t.date < todayStr && !t.done)
  const weekTasks     = taches.filter(t => t.date >= realWeekStartStr && t.date <= realWeekEndStr && !t.done)
  const doneCount     = taches.filter(t => t.done).length
  const completionRate = taches.length > 0 ? Math.round((doneCount / taches.length) * 100) : 0

  /* ── Vue semaine (navigation) ── */
  const weekDays = Array.from({ length: 7 }, (_, i) => { const d = new Date(weekStart); d.setDate(d.getDate() + i); return d })
  const prevWeek = () => setWeekStart(d => { const n = new Date(d); n.setDate(n.getDate() - 7); return n })
  const nextWeek = () => setWeekStart(d => { const n = new Date(d); n.setDate(n.getDate() + 7); return n })
  const goToday  = () => setWeekStart(getMondayOf(new Date()))

  const getTacheStyle = (t: Tache) => {
    const hStart = parseInt(t.heure_debut.slice(0, 2)) + parseFloat(t.heure_debut.slice(3, 5)) / 60
    const hEnd   = t.heure_fin ? parseInt(t.heure_fin.slice(0, 2)) + parseFloat(t.heure_fin.slice(3, 5)) / 60 : hStart + 1
    return { top: (hStart - 7) * ROW_H, height: Math.max((hEnd - hStart) * ROW_H, 28) }
  }

  const nowHourFloat = now.getHours() + now.getMinutes() / 60
  const showNowLine  = nowHourFloat >= 7 && nowHourFloat <= 23
  const nowLineTop   = (Math.min(23, Math.max(7, nowHourFloat)) - 7) * ROW_H

  /* ── Vue liste : regroupement par échéance ── */
  const matchesSearch = (text?: string) => !search.trim() || (text || "").toLowerCase().includes(search.toLowerCase())

  const allOpenTaches = taches.filter(t => !t.done && matchesSearch(t.titre))
    .sort((a, b) => a.date.localeCompare(b.date) || a.heure_debut.localeCompare(b.heure_debut))

  const inDays = (t: Tache, n: number) => {
    const diff = Math.round((new Date(t.date).getTime() - new Date(todayStr).getTime()) / 86400000)
    return diff === n
  }
  const groupRetard   = allOpenTaches.filter(t => t.date < todayStr)
  const groupToday    = allOpenTaches.filter(t => t.date === todayStr)
  const groupDemain    = allOpenTaches.filter(t => inDays(t, 1))
  const groupSemaine  = allOpenTaches.filter(t => { const diff = Math.round((new Date(t.date).getTime() - new Date(todayStr).getTime()) / 86400000); return diff >= 2 && diff <= 7 })
  const groupPlusTard = allOpenTaches.filter(t => { const diff = Math.round((new Date(t.date).getTime() - new Date(todayStr).getTime()) / 86400000); return diff > 7 })

  const listGroups: { label: string; icon: any; color: string; items: Tache[] }[] = [
    { label: "En retard",    icon: AlertCircle, color: "#ef4444", items: groupRetard },
    { label: "Aujourd'hui",  icon: CalendarDays, color: "#3b82f6", items: groupToday },
    { label: "Demain",       icon: Calendar,     color: "#a855f7", items: groupDemain },
    { label: "Cette semaine",icon: Calendar,     color: "#eab308", items: groupSemaine },
    { label: "Plus tard",    icon: Calendar,     color: "#71717a", items: groupPlusTard },
  ].filter(g => g.items.length > 0)

  const doneTachesFiltered = taches.filter(t => t.done && matchesSearch(t.titre))

  /* ── Cahier ── */
  const cahierFiltered = cahier.filter(c => matchesSearch(c.titre) || matchesSearch(c.notes))
  const cahierTodo = cahierFiltered.filter(c => !c.done)
  const cahierDone = cahierFiltered.filter(c => c.done)
  const cahierProgress = cahier.length > 0 ? Math.round((cahier.filter(c => c.done).length / cahier.length) * 100) : 0

  return (
    <div className="flex-1 overflow-y-auto bg-[#0a0a0a]">
      <div className="p-6 max-w-7xl mx-auto">

        {/* ── HEADER ── */}
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-white">📅 Agenda & Tâches</h1>
            <p className="text-zinc-500 text-sm mt-0.5">
              {now.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
            </p>
          </div>
          {view !== "cahier" ? (
            <button onClick={() => { setEditTache(null); setFormDate(todayStr); setFormHeure("09:00"); setShowForm(true) }}
              className="flex items-center gap-2 bg-blue-500 hover:bg-blue-400 text-white font-bold px-4 py-2.5 rounded-xl text-sm shadow-lg shadow-blue-500/20">
              <Plus size={15} /> Nouvelle tâche
            </button>
          ) : (
            <button onClick={() => { setEditCahierItem(null); setShowCahierForm(true) }}
              className="flex items-center gap-2 bg-blue-500 hover:bg-blue-400 text-white font-bold px-4 py-2.5 rounded-xl text-sm shadow-lg shadow-blue-500/20">
              <Plus size={15} /> Ajouter
            </button>
          )}
        </div>

        {/* ── STATS CARDS ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          <StatCard icon={CalendarDays} label="Aujourd'hui" value={todayTasks.length} color="#3b82f6"
            onClick={() => { setView("week"); goToday() }} />
          <StatCard icon={AlertCircle} label="En retard" value={overdueTasks.length} color="#ef4444"
            pulse={overdueTasks.length > 0} onClick={() => setView("list")} />
          <StatCard icon={Calendar} label="Cette semaine" value={weekTasks.length} color="#a855f7"
            onClick={() => { setView("week"); goToday() }} />
          <StatCard icon={TrendingUp} label="Taux de complétion" value={`${completionRate}%`} color="#22c55e"
            onClick={() => setView("list")} />
        </div>

        {/* ── NAVIGATION + RECHERCHE ── */}
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <div className="inline-flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-2xl p-1.5">
            {([
              { id: "week",   label: "Semaine", icon: CalendarDays },
              { id: "list",   label: "Liste",   icon: ListTodo     },
              { id: "cahier", label: "Cahier",  icon: BookOpen     },
            ] as const).map(v => (
              <button key={v.id} onClick={() => setView(v.id)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap ${view === v.id ? "bg-blue-500 text-white" : "text-zinc-500 hover:text-zinc-300"}`}>
                <v.icon size={13}/> {v.label}
              </button>
            ))}
          </div>

          {view !== "week" && (
            <div className="relative w-full sm:w-64">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"/>
              <input type="text" placeholder="Rechercher une tâche..." value={search} onChange={e => setSearch(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500/40"/>
            </div>
          )}
        </div>

        {/* ════════ VUE SEMAINE ════════ */}
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
              <div className="w-[140px]" />
            </div>

            <div className="grid border-b border-zinc-800" style={{ gridTemplateColumns: "48px repeat(7,1fr)" }}>
              <div className="border-r border-zinc-800" />
              {weekDays.map((d, i) => {
                const ds = dayStr(d)
                const isToday = ds === todayStr
                const count = taches.filter(t => t.date === ds && !t.done).length
                return (
                  <div key={i} className={`py-2.5 px-1 text-center border-r border-zinc-800 last:border-0 ${isToday ? "bg-blue-500/10" : ""}`}>
                    <p className={`text-[10px] font-semibold uppercase ${isToday ? "text-blue-400" : "text-zinc-500"}`}>{DAY_LABELS[i]}</p>
                    <div className={`mx-auto mt-1 w-7 h-7 rounded-full flex items-center justify-center text-sm font-black ${isToday ? "bg-blue-500 text-white" : "text-zinc-300"}`}>
                      {d.getDate()}
                    </div>
                    {count > 0 && <p className="text-[9px] text-zinc-600 mt-1">{count} tâche{count > 1 ? "s" : ""}</p>}
                  </div>
                )
              })}
            </div>

            <div className="overflow-y-auto max-h-[600px] relative">
              <div className="grid relative" style={{ gridTemplateColumns: "48px repeat(7,1fr)" }}>
                <div className="sticky left-0 z-10 bg-zinc-900">
                  {HOURS.map(h => (
                    <div key={h} className="border-b border-zinc-800 flex items-start justify-end pr-2 pt-1" style={{ height: ROW_H }}>
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
                        }} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 cursor-pointer transition-colors group flex items-center justify-center"
                        style={{ height: ROW_H }}>
                          <Plus size={12} className="text-zinc-700 opacity-0 group-hover:opacity-100 transition-opacity"/>
                        </div>
                      ))}
                      {dayTaches.map(t => {
                        const { top, height } = getTacheStyle(t)
                        return (
                          <div key={t.id} className="absolute left-0.5 right-0.5 rounded-lg px-1.5 py-1 overflow-hidden cursor-pointer group shadow-sm"
                            style={{ top, height, backgroundColor: t.couleur + "e6", minHeight: 26, opacity: t.done ? 0.45 : 1 }}
                            onClick={() => { setEditTache(t); setShowForm(true) }}>
                            <div className="flex items-start justify-between gap-1">
                              <p className={`text-[10px] font-bold text-black leading-tight truncate ${t.done ? "line-through" : ""}`}>{t.titre}</p>
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
                      {isToday && showNowLine && (
                        <div className="absolute left-0 right-0 z-20 pointer-events-none" style={{ top: nowLineTop }}>
                          <div className="relative">
                            <div className="absolute -left-1.5 -top-[5px] w-3 h-3 rounded-full bg-red-500 shadow-lg shadow-red-500/50" />
                            <div className="h-[2px] bg-red-500" />
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* ════════ VUE LISTE ════════ */}
        {view === "list" && (
          <div className="space-y-6">
            {listGroups.length === 0 ? (
              <div className="text-center py-16 text-zinc-600 bg-zinc-900 border border-dashed border-zinc-800 rounded-2xl">
                <p className="text-4xl mb-3">✨</p>
                <p className="text-sm font-semibold text-zinc-500">{search ? "Aucun résultat" : "Tout est à jour, rien à faire !"}</p>
                {!search && (
                  <button onClick={() => { setEditTache(null); setFormDate(todayStr); setFormHeure("09:00"); setShowForm(true) }}
                    className="mt-3 text-blue-400 text-xs hover:underline">+ Ajouter une tâche</button>
                )}
              </div>
            ) : listGroups.map(group => (
              <div key={group.label}>
                <h2 className="font-bold text-sm mb-3 flex items-center gap-2" style={{ color: group.color }}>
                  <group.icon size={14} /> {group.label}
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: group.color + "20", color: group.color }}>{group.items.length}</span>
                </h2>
                <div className="space-y-2">
                  {group.items.map(t => (
                    <div key={t.id} className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 hover:border-zinc-600 transition-colors group">
                      <div style={{ backgroundColor: t.couleur, width: 4, minHeight: 40, borderRadius: 4 }} className="shrink-0" />
                      <button onClick={() => toggleDone(t)}
                        className="w-5 h-5 rounded border border-zinc-600 hover:border-green-400 flex items-center justify-center shrink-0 transition-colors">
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white">{t.titre}</p>
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
              </div>
            ))}

            {doneTachesFiltered.length > 0 && (
              <div>
                <h2 className="text-zinc-600 font-bold text-sm mb-3">✓ Terminées ({doneTachesFiltered.length})</h2>
                <div className="space-y-1.5">
                  {doneTachesFiltered.slice(0, 5).map(t => (
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

        {/* ════════ VUE CAHIER ════════ */}
        {view === "cahier" && (
          <div className="space-y-5">

            {/* Stats avec anneau de progression */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4 flex items-center gap-5 flex-wrap">
              <div className="relative shrink-0">
                <ProgressRing percent={cahierProgress} color={cahierProgress === 100 ? "#22c55e" : "#3b82f6"} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-white text-sm font-black">{cahierProgress}%</span>
                </div>
              </div>
              <div className="flex-1 flex items-center gap-6 flex-wrap">
                <div>
                  <p className="text-2xl font-black text-white leading-none">{cahier.length}</p>
                  <p className="text-zinc-500 text-xs mt-0.5">Total tâches</p>
                </div>
                <div>
                  <p className="text-2xl font-black text-yellow-400 leading-none">{cahierTodo.length}</p>
                  <p className="text-zinc-500 text-xs mt-0.5">À faire</p>
                </div>
                <div>
                  <p className="text-2xl font-black text-green-400 leading-none">{cahier.filter(c=>c.done).length}</p>
                  <p className="text-zinc-500 text-xs mt-0.5">Terminées</p>
                </div>
              </div>
              {cahierProgress === 100 && cahier.length > 0 && (
                <p className="text-green-400 text-xs font-semibold">🎉 Tout est terminé !</p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-white font-bold text-sm flex items-center gap-2">
                  <BookOpen size={14} className="text-blue-400" /> Cahier des charges
                  {cahierTodo.length > 0 && <span className="bg-blue-500/20 text-blue-400 text-[10px] font-bold px-2 py-0.5 rounded-full">{cahierTodo.length}</span>}
                </h2>
              </div>

              {cahierTodo.length === 0 ? (
                <div className="text-center py-14 bg-zinc-900 border border-zinc-800 rounded-2xl border-dashed">
                  <p className="text-4xl mb-3">📒</p>
                  <p className="text-zinc-500 text-sm font-semibold">{search ? "Aucun résultat" : "Aucune tâche en cours"}</p>
                  {!search && (
                    <>
                      <p className="text-zinc-600 text-xs mt-1 mb-4">Ajoute les tâches récurrentes à accomplir</p>
                      <button onClick={() => { setEditCahierItem(null); setShowCahierForm(true) }}
                        className="inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-400 text-white font-bold px-4 py-2 rounded-xl text-sm">
                        <Plus size={14} /> Ajouter une tâche
                      </button>
                    </>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {(["haute", "normale", "basse"] as const).map(prio => {
                    const items = cahierTodo.filter(c => c.priorite === prio)
                    if (items.length === 0) return null
                    const cfg = PRIORITE_CFG[prio]
                    return (
                      <div key={prio}>
                        <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5 px-1 flex items-center gap-1.5" style={{ color: cfg.color }}>
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cfg.color }}/> {cfg.label} ({items.length})
                        </p>
                        <div className="space-y-2">
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