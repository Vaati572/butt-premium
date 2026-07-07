"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { supabase } from "@/lib/supabase"
import {
  Plus, X, Search, Check, Trash2, Clock, CheckCircle2, Circle,
  List, LayoutGrid, CalendarDays, ChevronLeft, ChevronRight,
  Repeat, MessageSquare, ListChecks, Ban, Send, RotateCcw,
} from "lucide-react"

interface Props { activeSociety: any; profile: any }

interface SousTache { id: string; label: string; done: boolean }

interface Tache {
  id: string
  titre: string
  description?: string | null
  priorite: "basse" | "normale" | "haute" | "urgente"
  statut: "a_faire" | "en_cours" | "termine" | "annulee"
  date_debut?: string | null
  echeance?: string | null
  heure_echeance?: string | null
  categorie?: string | null
  couleur?: string | null
  recurrence?: "aucune" | "quotidienne" | "hebdomadaire" | "mensuelle" | null
  sous_taches?: SousTache[] | null
  assigne_id?: string | null
  created_by?: string | null
  completed_at?: string | null
  created_at: string
}

interface Membre { id: string; nom: string; avatar_url?: string; color?: string }
interface Commentaire { id: string; auteur_id: string; auteur_nom: string; contenu: string; created_at: string }

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
  { key: "annulee",  label: "Annulée",  color: "#52525b" },
]
const STATUT_CYCLE: Tache["statut"][] = ["a_faire", "en_cours", "termine"]

const RECURRENCE: Record<string, string> = {
  aucune: "Ne se répète pas", quotidienne: "Tous les jours", hebdomadaire: "Toutes les semaines", mensuelle: "Tous les mois",
}

const COULEURS = ["#eab308", "#ef4444", "#3b82f6", "#22c55e", "#a855f7", "#f97316", "#ec4899", "#06b6d4"]

const TODAY = new Date()
const todayStr = () => TODAY.toISOString().slice(0, 10)
const daysDiff = (dateStr: string) => Math.floor((TODAY.getTime() - new Date(dateStr + "T00:00:00").getTime()) / 86400000)

const echeanceInfo = (echeance: string | null | undefined, statut: Tache["statut"]) => {
  if (!echeance) return null
  if (statut === "termine" || statut === "annulee") return { label: new Date(echeance + "T00:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short" }), color: "#52525b" }
  const diff = daysDiff(echeance)
  if (diff > 0)  return { label: `Retard ${diff}j`, color: "#ef4444" }
  if (diff === 0) return { label: "Aujourd'hui", color: "#f97316" }
  if (diff === -1) return { label: "Demain", color: "#eab308" }
  return { label: new Date(echeance + "T00:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short" }), color: "#71717a" }
}

const nextEcheance = (dateStr: string, recurrence: string) => {
  const d = new Date(dateStr + "T00:00:00")
  if (recurrence === "quotidienne") d.setDate(d.getDate() + 1)
  else if (recurrence === "hebdomadaire") d.setDate(d.getDate() + 7)
  else if (recurrence === "mensuelle") d.setMonth(d.getMonth() + 1)
  else return null
  return d.toISOString().slice(0, 10)
}

const initials = (nom?: string) => nom?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "?"
const relTime = (iso: string) => {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (diff < 1) return "à l'instant"
  if (diff < 60) return `il y a ${diff}min`
  if (diff < 1440) return `il y a ${Math.floor(diff / 60)}h`
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
}

/* ── Panel création / édition — complet ── */
function TachePanel({ tache, membres, societyId, profile, onClose, onSaved }: {
  tache: Tache | null; membres: Membre[]; societyId: string; profile: any
  onClose: () => void; onSaved: () => void
}) {
  const [titre, setTitre]             = useState(tache?.titre || "")
  const [description, setDescription] = useState(tache?.description || "")
  const [priorite, setPriorite]       = useState<Tache["priorite"]>(tache?.priorite || "normale")
  const [statut, setStatut]           = useState<Tache["statut"]>(tache?.statut || "a_faire")
  const [dateDebut, setDateDebut]     = useState(tache?.date_debut || "")
  const [echeance, setEcheance]       = useState(tache?.echeance || "")
  const [heureEcheance, setHeureEcheance] = useState(tache?.heure_echeance || "")
  const [categorie, setCategorie]     = useState(tache?.categorie || "")
  const [couleur, setCouleur]         = useState<string | null>(tache?.couleur || null)
  const [recurrence, setRecurrence]   = useState(tache?.recurrence || "aucune")
  const [assigneId, setAssigneId]     = useState(tache?.assigne_id || "")
  const [sousTaches, setSousTaches]   = useState<SousTache[]>(tache?.sous_taches || [])
  const [nouvelleSousTache, setNouvelleSousTache] = useState("")
  const [saving, setSaving]           = useState(false)
  const [comments, setComments]       = useState<Commentaire[]>([])
  const [newComment, setNewComment]   = useState("")
  const [postingComment, setPostingComment] = useState(false)
  const titreRef = useRef<HTMLInputElement>(null)

  useEffect(() => { if (!tache) setTimeout(() => titreRef.current?.focus(), 100) }, [])

  useEffect(() => {
    if (!tache?.id) return
    supabase.from("liste_taches_commentaires").select("*").eq("tache_id", tache.id)
      .order("created_at", { ascending: true })
      .then(({ data }) => setComments(data || []))
  }, [tache?.id])

  const addSousTache = () => {
    if (!nouvelleSousTache.trim()) return
    setSousTaches(prev => [...prev, { id: Math.random().toString(36).slice(2), label: nouvelleSousTache.trim(), done: false }])
    setNouvelleSousTache("")
  }
  const toggleSousTache = (id: string) => setSousTaches(prev => prev.map(s => s.id === id ? { ...s, done: !s.done } : s))
  const removeSousTache = (id: string) => setSousTaches(prev => prev.filter(s => s.id !== id))

  const postComment = async () => {
    if (!newComment.trim() || !tache?.id) return
    setPostingComment(true)
    const payload = {
      tache_id: tache.id, society_id: societyId, auteur_id: profile?.id || null,
      auteur_nom: profile?.nom || "?", contenu: newComment.trim(),
    }
    const { data } = await supabase.from("liste_taches_commentaires").insert(payload).select().single()
    if (data) setComments(prev => [...prev, data])
    setNewComment(""); setPostingComment(false)
  }

  const save = async () => {
    if (!titre.trim()) return
    setSaving(true)
    const payload: any = {
      society_id: societyId, titre: titre.trim(), description: description || null,
      priorite, statut, date_debut: dateDebut || null, echeance: echeance || null,
      heure_echeance: heureEcheance || null, categorie: categorie || null,
      couleur: couleur || null, recurrence, assigne_id: assigneId || null,
      sous_taches: sousTaches,
    }
    const wasTermine = tache?.statut === "termine"
    if (statut === "termine" && !wasTermine) payload.completed_at = new Date().toISOString()
    if (statut !== "termine") payload.completed_at = null

    if (tache?.id) {
      await supabase.from("liste_taches").update(payload).eq("id", tache.id)
    } else {
      payload.created_by = profile?.id || null
      await supabase.from("liste_taches").insert(payload)
    }

    // Récurrence : si on vient de terminer une tâche récurrente, on crée la prochaine occurrence
    if (statut === "termine" && !wasTermine && recurrence !== "aucune" && echeance) {
      const next = nextEcheance(echeance, recurrence)
      if (next) {
        await supabase.from("liste_taches").insert({
          society_id: societyId, titre: titre.trim(), description: description || null,
          priorite, statut: "a_faire", date_debut: null, echeance: next,
          heure_echeance: heureEcheance || null, categorie: categorie || null,
          couleur: couleur || null, recurrence, assigne_id: assigneId || null,
          sous_taches: sousTaches.map(s => ({ ...s, done: false })),
          created_by: profile?.id || null,
        })
      }
    }
    setSaving(false); onSaved(); onClose()
  }

  const deleteTache = async () => {
    if (!tache?.id || !confirm("Supprimer définitivement cette tâche ?")) return
    await supabase.from("liste_taches_commentaires").delete().eq("tache_id", tache.id)
    await supabase.from("liste_taches").delete().eq("id", tache.id)
    onSaved(); onClose()
  }

  const doneCount = sousTaches.filter(s => s.done).length

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end">
      <div className="bg-[#111111] border-l border-zinc-800 w-full max-w-md h-full flex flex-col shadow-2xl">
        <div className="px-5 py-4 border-b border-zinc-800 shrink-0 flex items-start justify-between"
          style={couleur ? { background: `linear-gradient(135deg, ${couleur}15, transparent)` } : {}}>
          <div>
            <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider mb-0.5">
              {tache ? "Modifier la tâche" : "Nouvelle tâche"}
            </p>
            <h2 className="text-white font-bold text-base">{tache ? "Détails" : "Créer une tâche"}</h2>
            {tache?.created_by && (
              <p className="text-zinc-600 text-[10px] mt-0.5">
                Créée par {membres.find(m => m.id === tache.created_by)?.nom || "?"} · {new Date(tache.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
              </p>
            )}
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white shrink-0"><X size={16}/></button>
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
              <div className="grid grid-cols-4 gap-1.5">
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
                      {s.key === "annulee" ? <Ban size={11}/> : <span className="text-[10px]">{s.label}</span>}
                      {s.key === "annulee" && <span className="text-[9px]">{s.label}</span>}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[10px] font-bold text-zinc-600 uppercase tracking-wider mb-1.5">Début</label>
              <input type="date" value={dateDebut} onChange={e => setDateDebut(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none"/>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-zinc-600 uppercase tracking-wider mb-1.5">Échéance</label>
              <input type="date" value={echeance} onChange={e => setEcheance(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none"/>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[10px] font-bold text-zinc-600 uppercase tracking-wider mb-1.5">Heure (optionnel)</label>
              <input type="time" value={heureEcheance} onChange={e => setHeureEcheance(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none"/>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-zinc-600 uppercase tracking-wider mb-1.5 flex items-center gap-1"><Repeat size={10}/> Récurrence</label>
              <select value={recurrence} onChange={e => setRecurrence(e.target.value as any)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-2 py-2.5 text-xs text-white focus:outline-none">
                {Object.entries(RECURRENCE).map(([k, label]) => <option key={k} value={k}>{label}</option>)}
              </select>
            </div>
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

          <div>
            <label className="block text-[10px] font-bold text-zinc-600 uppercase tracking-wider mb-1.5">Couleur (perso)</label>
            <div className="flex items-center gap-1.5 flex-wrap">
              <button onClick={() => setCouleur(null)}
                className="w-7 h-7 rounded-full border-2 flex items-center justify-center"
                style={{ borderColor: !couleur ? "#fff" : "#3f3f46" }}>
                <X size={11} className="text-zinc-500"/>
              </button>
              {COULEURS.map(c => (
                <button key={c} onClick={() => setCouleur(c)}
                  className="w-7 h-7 rounded-full border-2 transition-transform"
                  style={{ backgroundColor: c, borderColor: couleur === c ? "#fff" : "transparent", transform: couleur === c ? "scale(1.1)" : "scale(1)" }}/>
              ))}
            </div>
          </div>

          {/* Sous-tâches */}
          <div>
            <label className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-600 uppercase tracking-wider mb-2">
              <ListChecks size={11}/> Sous-tâches {sousTaches.length > 0 && <span className="text-zinc-500">({doneCount}/{sousTaches.length})</span>}
            </label>
            {sousTaches.length > 0 && (
              <div className="h-1 rounded-full bg-zinc-800 overflow-hidden mb-2">
                <div className="h-full rounded-full bg-green-500 transition-all" style={{ width: `${sousTaches.length ? (doneCount / sousTaches.length) * 100 : 0}%` }}/>
              </div>
            )}
            <div className="space-y-1.5 mb-2">
              {sousTaches.map(s => (
                <div key={s.id} className="flex items-center gap-2 bg-zinc-800/60 rounded-lg px-2.5 py-2">
                  <button onClick={() => toggleSousTache(s.id)} className="shrink-0">
                    {s.done ? <CheckCircle2 size={15} className="text-green-500"/> : <Circle size={15} className="text-zinc-600"/>}
                  </button>
                  <span className={`flex-1 text-xs ${s.done ? "text-zinc-500 line-through" : "text-zinc-200"}`}>{s.label}</span>
                  <button onClick={() => removeSousTache(s.id)} className="text-zinc-600 hover:text-red-400 shrink-0"><X size={12}/></button>
                </div>
              ))}
            </div>
            <div className="flex gap-1.5">
              <input type="text" value={nouvelleSousTache} onChange={e => setNouvelleSousTache(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addSousTache()}
                placeholder="Ajouter une sous-tâche..."
                className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none"/>
              <button onClick={addSousTache} className="w-8 h-8 rounded-lg bg-zinc-700 hover:bg-zinc-600 flex items-center justify-center text-white shrink-0"><Plus size={14}/></button>
            </div>
          </div>

          {/* Commentaires — visible seulement sur une tâche existante */}
          {tache?.id && (
            <div>
              <label className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-600 uppercase tracking-wider mb-2">
                <MessageSquare size={11}/> Commentaires {comments.length > 0 && `(${comments.length})`}
              </label>
              <div className="space-y-2 mb-2 max-h-48 overflow-y-auto">
                {comments.length === 0 ? (
                  <p className="text-zinc-700 text-xs text-center py-3">Aucun commentaire pour l'instant</p>
                ) : comments.map(c => (
                  <div key={c.id} className="bg-zinc-800/60 rounded-lg px-3 py-2">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-zinc-300 text-xs font-bold">{c.auteur_nom}</span>
                      <span className="text-zinc-600 text-[10px]">{relTime(c.created_at)}</span>
                    </div>
                    <p className="text-zinc-400 text-xs whitespace-pre-wrap">{c.contenu}</p>
                  </div>
                ))}
              </div>
              <div className="flex gap-1.5">
                <input type="text" value={newComment} onChange={e => setNewComment(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && postComment()}
                  placeholder="Ajouter un commentaire..."
                  className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none"/>
                <button onClick={postComment} disabled={postingComment || !newComment.trim()}
                  className="w-8 h-8 rounded-lg bg-yellow-500 hover:bg-yellow-400 disabled:opacity-40 flex items-center justify-center text-black shrink-0">
                  {postingComment ? <div className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin"/> : <Send size={13}/>}
                </button>
              </div>
            </div>
          )}
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
function TacheRow({ tache, membre, onOpen, onCycleStatut, onToggleSousTache }: {
  tache: Tache; membre?: Membre
  onOpen: () => void
  onCycleStatut: () => void
  onToggleSousTache: (sousTacheId: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const ech = echeanceInfo(tache.echeance, tache.statut)
  const prio = PRIORITE[tache.priorite] || PRIORITE.normale
  const isDone = tache.statut === "termine"
  const isCancelled = tache.statut === "annulee"
  const sousTaches = tache.sous_taches || []
  const doneCount = sousTaches.filter(s => s.done).length
  const hasSousTaches = sousTaches.length > 0
  const progress = hasSousTaches ? Math.round((doneCount / sousTaches.length) * 100) : 0

  return (
    <div className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-xl transition-colors group"
      style={{ opacity: isDone || isCancelled ? 0.55 : 1, borderLeft: tache.couleur ? `3px solid ${tache.couleur}` : undefined }}>
      {/* Ligne principale */}
      <div className="flex items-center gap-2.5 px-3 py-3">
        {/* Bouton statut */}
        <button onClick={onCycleStatut} className="shrink-0" disabled={isCancelled}>
          {isCancelled ? <Ban size={20} className="text-zinc-600"/> :
           tache.statut === "termine" ? <CheckCircle2 size={20} className="text-green-500"/> :
           tache.statut === "en_cours" ? <Clock size={20} className="text-yellow-500"/> :
           <Circle size={20} className="text-zinc-600 group-hover:text-zinc-400"/>}
        </button>

        {/* Contenu cliquable → déplie les sous-tâches ou ouvre le panel si pas de sous-tâches */}
        <button onClick={() => hasSousTaches ? setExpanded(p => !p) : onOpen()} className="flex-1 min-w-0 text-left">
          <p className={`text-white text-sm font-semibold truncate ${isDone || isCancelled ? "line-through text-zinc-500" : ""}`}>{tache.titre}</p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: prio.bg, color: prio.color }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: prio.color }}/>{prio.label}
            </span>
            {ech && <span className="text-[10px] font-semibold" style={{ color: ech.color }}>📅 {ech.label}{tache.heure_echeance ? ` à ${tache.heure_echeance.slice(0,5)}` : ""}</span>}
            {tache.recurrence && tache.recurrence !== "aucune" && <Repeat size={10} className="text-zinc-500"/>}
            {hasSousTaches && (
              <span className="flex items-center gap-1 text-[10px] font-bold" style={{ color: doneCount === sousTaches.length ? "#22c55e" : "#a1a1aa" }}>
                <ListChecks size={10}/> {doneCount}/{sousTaches.length}
              </span>
            )}
            {tache.categorie && <span className="text-[10px] text-zinc-500">🏷️ {tache.categorie}</span>}
          </div>
        </button>

        {/* Avatar membre */}
        {membre && (
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-black shrink-0"
            style={{ backgroundColor: membre.color || "#eab308" }} title={membre.nom}>
            {membre.avatar_url ? <img src={membre.avatar_url} className="w-full h-full rounded-full object-cover"/> : initials(membre.nom)}
          </div>
        )}

        {/* Bouton ouvrir en grand */}
        <button onClick={e => { e.stopPropagation(); onOpen() }}
          className="w-7 h-7 rounded-lg bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-500 hover:text-white shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
          title="Ouvrir les détails">
          <ChevronRight size={14}/>
        </button>
      </div>

      {/* Barre de progression mini sous-tâches */}
      {hasSousTaches && (
        <div className="px-3 pb-2 -mt-1">
          <div className="h-1 rounded-full bg-zinc-800 overflow-hidden">
            <div className="h-full rounded-full transition-all duration-300"
              style={{ width: `${progress}%`, backgroundColor: progress === 100 ? "#22c55e" : "#eab308" }}/>
          </div>
        </div>
      )}

      {/* Liste des sous-tâches dépliable */}
      {hasSousTaches && expanded && (
        <div className="border-t border-zinc-800/60 px-3 py-2 space-y-1.5">
          {sousTaches.map(s => (
            <button key={s.id} onClick={() => onToggleSousTache(s.id)}
              className="w-full flex items-center gap-2.5 py-1.5 text-left group/st">
              <div className={`w-4.5 h-4.5 rounded border flex items-center justify-center shrink-0 transition-colors ${s.done ? "bg-green-500 border-green-500" : "border-zinc-600 group-hover/st:border-zinc-400"}`}
                style={{ width: "18px", height: "18px" }}>
                {s.done && <Check size={10} className="text-black"/>}
              </div>
              <span className={`text-xs flex-1 ${s.done ? "line-through text-zinc-600" : "text-zinc-300"}`}>{s.label}</span>
            </button>
          ))}
          <button onClick={onOpen}
            className="w-full flex items-center justify-center gap-1.5 mt-1 py-1.5 rounded-lg bg-zinc-800/60 hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 text-[10px] font-bold transition-colors">
            <ChevronRight size={10}/> Modifier · Ajouter des sous-tâches
          </button>
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
  const prio = PRIORITE[tache.priorite] || PRIORITE.normale
  const idx = Math.max(0, STATUT_CYCLE.indexOf(tache.statut))
  const sousTaches = tache.sous_taches || []
  const doneCount = sousTaches.filter(s => s.done).length
  return (
    <div className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-xl p-3 transition-colors group"
      style={{ borderLeft: `3px solid ${tache.couleur || prio.color}` }}>
      <button onClick={onOpen} className="w-full text-left">
        <p className="text-white text-sm font-semibold leading-snug mb-1.5">{tache.titre}</p>
        <div className="flex items-center gap-1.5 flex-wrap">
          {ech && <span className="text-[10px] font-semibold" style={{ color: ech.color }}>📅 {ech.label}</span>}
          {tache.recurrence && tache.recurrence !== "aucune" && <Repeat size={10} className="text-zinc-500"/>}
          {sousTaches.length > 0 && <span className="text-[10px] text-zinc-500">☑ {doneCount}/{sousTaches.length}</span>}
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

/* ── Groupe vue Échéancier ── */
function EcheancierGroup({ title, color, taches, membres, onOpen, onCycleStatut, onToggleSousTache }: {
  title: string; color: string; taches: Tache[]; membres: Membre[]
  onOpen: (t: Tache) => void; onCycleStatut: (t: Tache) => void
  onToggleSousTache: (tache: Tache, sousTacheId: string) => void
}) {
  if (taches.length === 0) return null
  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-2 px-1">
        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }}/>
        <p className="text-xs font-bold uppercase tracking-wider" style={{ color }}>{title}</p>
        <span className="text-zinc-600 text-[10px] font-bold">{taches.length}</span>
      </div>
      <div className="space-y-2">
        {taches.map(t => (
          <TacheRow key={t.id} tache={t} membre={membres.find(m => m.id === t.assigne_id)}
            onOpen={() => onOpen(t)} onCycleStatut={() => onCycleStatut(t)}
            onToggleSousTache={sid => onToggleSousTache(t, sid)}/>
        ))}
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
  const [view, setView]       = useState<"liste" | "kanban" | "echeancier">("echeancier")
  const [search, setSearch]   = useState("")
  const [filterStatut, setFilterStatut]   = useState<"toutes" | Tache["statut"]>("toutes")
  const [filterAssigne, setFilterAssigne] = useState<"tous" | "moi" | string>("tous")
  const [panelTache, setPanelTache] = useState<Tache | null | undefined>(undefined) // undefined = closed
  const [showTerminees, setShowTerminees] = useState(false)

  const load = useCallback(async () => {
    if (!activeSociety?.id) return
    setLoading(true)
    const [{ data: t }, { data: mem }] = await Promise.all([
      supabase.from("liste_taches").select("*").eq("society_id", activeSociety.id).order("created_at", { ascending: false }),
      supabase.from("profiles").select("id,nom,avatar_url,color").eq("society_id", activeSociety.id),
    ])
    setTaches(t || [])
    setMembres(mem || [])
    setLoading(false)
  }, [activeSociety?.id])

  useEffect(() => { load() }, [load])

  const getMembre = (id?: string | null) => membres.find(m => m.id === id)

  const cycleStatut = async (tache: Tache) => {
    if (tache.statut === "annulee") return
    const idx = Math.max(0, STATUT_CYCLE.indexOf(tache.statut))
    const next = STATUT_CYCLE[(idx + 1) % STATUT_CYCLE.length]
    const payload: any = { statut: next, completed_at: next === "termine" ? new Date().toISOString() : null }
    await supabase.from("liste_taches").update(payload).eq("id", tache.id)
    setTaches(prev => prev.map(t => t.id === tache.id ? { ...t, ...payload } : t))
    if (next === "termine" && tache.recurrence && tache.recurrence !== "aucune" && tache.echeance) {
      const nextDate = nextEcheance(tache.echeance, tache.recurrence)
      if (nextDate) {
        await supabase.from("liste_taches").insert({
          society_id: activeSociety.id, titre: tache.titre, description: tache.description || null,
          priorite: tache.priorite, statut: "a_faire", echeance: nextDate,
          heure_echeance: tache.heure_echeance || null, categorie: tache.categorie || null,
          couleur: tache.couleur || null, recurrence: tache.recurrence, assigne_id: tache.assigne_id || null,
          sous_taches: (tache.sous_taches || []).map(s => ({ ...s, done: false })),
          created_by: tache.created_by || null,
        })
        load()
      }
    }
  }

  const moveStatut = async (tache: Tache, dir: 1 | -1) => {
    const idx = Math.max(0, STATUT_CYCLE.indexOf(tache.statut))
    const nextIdx = idx + dir
    if (nextIdx < 0 || nextIdx >= STATUT_CYCLE.length) return
    const next = STATUT_CYCLE[nextIdx]
    const payload: any = { statut: next, completed_at: next === "termine" ? new Date().toISOString() : null }
    await supabase.from("liste_taches").update(payload).eq("id", tache.id)
    setTaches(prev => prev.map(t => t.id === tache.id ? { ...t, ...payload } : t))
  }

  const toggleSousTache = async (tache: Tache, sousTacheId: string) => {
    const updated = (tache.sous_taches || []).map(s =>
      s.id === sousTacheId ? { ...s, done: !s.done } : s
    )
    await supabase.from("liste_taches").update({ sous_taches: updated }).eq("id", tache.id)
    setTaches(prev => prev.map(t => t.id === tache.id ? { ...t, sous_taches: updated } : t))
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
    const pDiff = (PRIORITE[b.priorite] || PRIORITE.normale).order - (PRIORITE[a.priorite] || PRIORITE.normale).order
    if (pDiff !== 0) return pDiff
    if (a.echeance && b.echeance) return a.echeance < b.echeance ? -1 : 1
    if (a.echeance) return -1
    if (b.echeance) return 1
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  const actives      = taches.filter(t => t.statut !== "termine" && t.statut !== "annulee")
  const urgentes     = actives.filter(t => t.priorite === "urgente").length
  const enRetard     = actives.filter(t => t.echeance && t.echeance < todayStr()).length
  const aujourdhui   = actives.filter(t => t.echeance === todayStr()).length
  const termineesAuj = taches.filter(t => t.statut === "termine" && t.completed_at && t.completed_at.slice(0, 10) === todayStr()).length

  // Groupes pour la vue Échéancier
  const nonTerminees = sorted.filter(t => t.statut !== "termine" && t.statut !== "annulee")
  const grpRetard     = nonTerminees.filter(t => t.echeance && t.echeance < todayStr())
  const grpAujourdhui = nonTerminees.filter(t => t.echeance === todayStr())
  const demainStr = (() => { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().slice(0, 10) })()
  const grpDemain     = nonTerminees.filter(t => t.echeance === demainStr)
  const semaineLimite = (() => { const d = new Date(); d.setDate(d.getDate() + 7); return d.toISOString().slice(0, 10) })()
  const grpSemaine    = nonTerminees.filter(t => t.echeance && t.echeance > demainStr && t.echeance <= semaineLimite)
  const grpPlusTard   = nonTerminees.filter(t => t.echeance && t.echeance > semaineLimite)
  const grpSansEcheance = nonTerminees.filter(t => !t.echeance)
  const grpTermineesAnnulees = sorted.filter(t => t.statut === "termine" || t.statut === "annulee")

  return (
    <div className="flex-1 overflow-hidden bg-[#0a0a0a] flex flex-col">
      <div className="border-b border-zinc-900 px-4 pt-4 pb-3 shrink-0 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h1 className="text-white font-bold text-xl">✅ Liste des tâches</h1>
            <p className="text-zinc-500 text-xs mt-0.5">{actives.length} active{actives.length > 1 ? "s" : ""} · {taches.length} au total · partagée avec l'équipe</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-0.5 bg-zinc-900 border border-zinc-800 rounded-xl p-1">
              <button onClick={() => setView("echeancier")} title="Échéancier"
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                style={{ backgroundColor: view === "echeancier" ? "#eab30820" : "transparent", color: view === "echeancier" ? "#eab308" : "#71717a" }}>
                <CalendarDays size={15}/>
              </button>
              <button onClick={() => setView("liste")} title="Liste"
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                style={{ backgroundColor: view === "liste" ? "#eab30820" : "transparent", color: view === "liste" ? "#eab308" : "#71717a" }}>
                <List size={15}/>
              </button>
              <button onClick={() => setView("kanban")} title="Kanban"
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
            { label: "Actives",             value: String(actives.length),       color: "text-zinc-300" },
            { label: "Aujourd'hui",         value: String(aujourdhui),           color: aujourdhui > 0 ? "text-orange-400" : "text-zinc-500" },
            { label: "Urgentes",            value: String(urgentes),             color: urgentes > 0 ? "text-red-400" : "text-zinc-500" },
            { label: "En retard",           value: String(enRetard),             color: enRetard > 0 ? "text-red-400" : "text-zinc-500" },
            { label: "Terminées aujourd'hui", value: String(termineesAuj),        color: "text-green-400" },
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
          <p className="text-zinc-500 text-sm mb-6">{taches.length === 0 ? "Crée la première tâche pour toi et ton équipe" : "Essaie d'autres filtres"}</p>
          {taches.length === 0 && (
            <button onClick={() => setPanelTache(null)} className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-5 py-3 rounded-xl text-sm"><Plus size={15}/> Nouvelle tâche</button>
          )}
        </div>
      ) : view === "echeancier" ? (
        <div className="flex-1 overflow-y-auto p-4">
          <EcheancierGroup title="En retard" color="#ef4444" taches={grpRetard} membres={membres} onOpen={setPanelTache} onCycleStatut={cycleStatut} onToggleSousTache={toggleSousTache}/>
          <EcheancierGroup title="Aujourd'hui" color="#f97316" taches={grpAujourdhui} membres={membres} onOpen={setPanelTache} onCycleStatut={cycleStatut} onToggleSousTache={toggleSousTache}/>
          <EcheancierGroup title="Demain" color="#eab308" taches={grpDemain} membres={membres} onOpen={setPanelTache} onCycleStatut={cycleStatut} onToggleSousTache={toggleSousTache}/>
          <EcheancierGroup title="Cette semaine" color="#3b82f6" taches={grpSemaine} membres={membres} onOpen={setPanelTache} onCycleStatut={cycleStatut} onToggleSousTache={toggleSousTache}/>
          <EcheancierGroup title="Plus tard" color="#71717a" taches={grpPlusTard} membres={membres} onOpen={setPanelTache} onCycleStatut={cycleStatut} onToggleSousTache={toggleSousTache}/>
          <EcheancierGroup title="Sans échéance" color="#52525b" taches={grpSansEcheance} membres={membres} onOpen={setPanelTache} onCycleStatut={cycleStatut} onToggleSousTache={toggleSousTache}/>
          {grpTermineesAnnulees.length > 0 && (
            <div className="mt-2">
              <button onClick={() => setShowTerminees(p => !p)} className="flex items-center gap-2 text-zinc-500 hover:text-zinc-300 text-xs font-bold uppercase tracking-wider mb-2">
                <RotateCcw size={11}/> {showTerminees ? "Masquer" : "Voir"} terminées / annulées ({grpTermineesAnnulees.length})
              </button>
              {showTerminees && (
                <div className="space-y-2">
                  {grpTermineesAnnulees.map(t => (
                    <TacheRow key={t.id} tache={t} membre={getMembre(t.assigne_id)} onOpen={() => setPanelTache(t)} onCycleStatut={() => cycleStatut(t)} onToggleSousTache={sid => toggleSousTache(t, sid)}/>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ) : view === "liste" ? (
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {sorted.map(t => (
            <TacheRow key={t.id} tache={t} membre={getMembre(t.assigne_id)}
              onOpen={() => setPanelTache(t)} onCycleStatut={() => cycleStatut(t)}
              onToggleSousTache={sid => toggleSousTache(t, sid)}/>
          ))}
        </div>
      ) : (
        <div className="flex-1 overflow-x-auto p-4">
          <div className="flex gap-4 h-full min-w-[700px]">
            {STATUTS.filter(s => s.key !== "annulee").map(s => {
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
        <TachePanel tache={panelTache} membres={membres} societyId={activeSociety.id} profile={profile}
          onClose={() => setPanelTache(undefined)} onSaved={load}/>
      )}
    </div>
  )
}