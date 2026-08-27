"use client"

import { useEffect, useState, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import {
  Plus, X, Search, Pencil, Trash2, Check,
  ExternalLink, Send, Clock,
  LayoutGrid, List, Zap, Users, Target, TrendingUp,
} from "lucide-react"

interface Props { activeSociety: any; profile: any }

interface Prospect {
  id: string; nom: string; reseau: string; profil_url?: string
  ville?: string; secteur?: string; notes?: string; statut: string
  date_premier_contact?: string; date_derniere_action?: string
  budget_estime?: number; priorite: string; tags?: string[]; created_at: string
}

interface Action {
  id: string; prospect_id: string; type_action: string
  contenu?: string; created_at: string
}

const STATUTS: Record<string, { label: string; emoji: string; color: string; bg: string; border: string; next?: string }> = {
  a_contacter:     { label: "À contacter",        emoji: "🎯", color: "text-zinc-300",   bg: "bg-zinc-800",       border: "border-zinc-700",       next: "contacte"        },
  contacte:        { label: "Contacté",            emoji: "📤", color: "text-blue-400",   bg: "bg-blue-500/10",    border: "border-blue-500/30",    next: "en_attente"      },
  en_attente:      { label: "En attente",          emoji: "⏳", color: "text-yellow-400", bg: "bg-yellow-500/10",  border: "border-yellow-500/30",  next: "repondu"         },
  repondu:         { label: "A répondu",           emoji: "💬", color: "text-cyan-400",   bg: "bg-cyan-500/10",    border: "border-cyan-500/30",    next: "visio_planifiee" },
  visio_planifiee: { label: "Visio planifiée",     emoji: "📅", color: "text-purple-400", bg: "bg-purple-500/10",  border: "border-purple-500/30",  next: "visio_faite"     },
  visio_faite:     { label: "Visio faite",         emoji: "🎥", color: "text-indigo-400", bg: "bg-indigo-500/10",  border: "border-indigo-500/30",  next: "proposition"     },
  proposition:     { label: "Proposition envoyée", emoji: "📋", color: "text-orange-400", bg: "bg-orange-500/10",  border: "border-orange-500/30",  next: "negociation"     },
  negociation:     { label: "En négociation",      emoji: "🤝", color: "text-amber-400",  bg: "bg-amber-500/10",   border: "border-amber-500/30",   next: "gagne"           },
  gagne:           { label: "Gagné ✅",             emoji: "🏆", color: "text-green-400",  bg: "bg-green-500/10",   border: "border-green-500/30"                            },
  perdu:           { label: "Perdu",               emoji: "❌", color: "text-red-400",    bg: "bg-red-500/10",     border: "border-red-500/30"                               },
}
const STATUTS_ORDER = ["a_contacter","contacte","en_attente","repondu","visio_planifiee","visio_faite","proposition","negociation","gagne","perdu"]

const RESEAUX: Record<string, { label: string; emoji: string; color: string }> = {
  instagram: { label: "Instagram",  emoji: "📸", color: "text-pink-400"   },
  tiktok:    { label: "TikTok",     emoji: "🎵", color: "text-zinc-300"   },
  facebook:  { label: "Facebook",   emoji: "👥", color: "text-blue-400"   },
  linkedin:  { label: "LinkedIn",   emoji: "💼", color: "text-sky-400"    },
  snapchat:  { label: "Snapchat",   emoji: "👻", color: "text-yellow-400" },
  email:     { label: "Email",      emoji: "✉️",  color: "text-zinc-400"   },
  telephone: { label: "Téléphone",  emoji: "📞", color: "text-green-400"  },
  autre:     { label: "Autre",      emoji: "🌐", color: "text-zinc-400"   },
}

const ACTION_TYPES: Record<string, { label: string; emoji: string; color: string }> = {
  message:     { label: "Message envoyé",    emoji: "💬", color: "text-blue-400"   },
  reponse:     { label: "Réponse reçue",     emoji: "📩", color: "text-cyan-400"   },
  appel:       { label: "Appel téléphonique",emoji: "📞", color: "text-green-400"  },
  visio:       { label: "Visio / RDV",       emoji: "🎥", color: "text-purple-400" },
  email:       { label: "Email",             emoji: "✉️",  color: "text-zinc-400"   },
  proposition: { label: "Proposition",       emoji: "📋", color: "text-orange-400" },
  relance:     { label: "Relance",           emoji: "🔔", color: "text-yellow-400" },
  note:        { label: "Note interne",      emoji: "📝", color: "text-zinc-500"   },
  contrat:     { label: "Contrat signé",     emoji: "🏆", color: "text-green-400"  },
}

const PRIORITES = {
  haute:   { label: "Haute",   color: "text-red-400",    bg: "bg-red-500/10",    border: "border-red-500/30",    dot: "bg-red-500"    },
  normale: { label: "Normale", color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/30", dot: "bg-yellow-500" },
  basse:   { label: "Basse",   color: "text-zinc-500",   bg: "bg-zinc-800",      border: "border-zinc-700",      dot: "bg-zinc-500"   },
}

const formatDate = (d?: string) => {
  if (!d) return ""
  const diff = Math.floor((Date.now() - new Date(d).getTime()) / 86400000)
  if (diff === 0) return "Aujourd'hui"
  if (diff === 1) return "Hier"
  if (diff < 7) return `Il y a ${diff}j`
  if (diff < 30) return `Il y a ${Math.floor(diff / 7)}sem`
  return new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })
}

function ProspectModal({ prospect, societyId, profile, onClose, onDone }: {
  prospect?: Prospect | null; societyId: string; profile: any
  onClose: () => void; onDone: () => void
}) {
  const [nom, setNom]             = useState(prospect?.nom || "")
  const [reseau, setReseau]       = useState(prospect?.reseau || "instagram")
  const [profilUrl, setProfilUrl] = useState(prospect?.profil_url || "")
  const [ville, setVille]         = useState(prospect?.ville || "")
  const [secteur, setSecteur]     = useState(prospect?.secteur || "")
  const [notes, setNotes]         = useState(prospect?.notes || "")
  const [statut, setStatut]       = useState(prospect?.statut || "a_contacter")
  const [priorite, setPriorite]   = useState(prospect?.priorite || "normale")
  const [budget, setBudget]       = useState(prospect?.budget_estime?.toString() || "")
  const [tags, setTags]           = useState((prospect?.tags || []).join(", "))
  const [saving, setSaving]       = useState(false)
  const [errMsg, setErrMsg]       = useState("")

  const save = async () => {
    if (!nom.trim()) return
    setSaving(true); setErrMsg("")
    try {
      const payload: any = {
        society_id: societyId,
        user_id: profile.id,
        nom: nom.trim(),
        reseau,
        profil_url: profilUrl || null,
        ville: ville || null,
        secteur: secteur || null,
        notes: notes || null,
        statut,
        priorite,
        budget_estime: budget ? parseFloat(budget) : null,
        tags: tags ? tags.split(",").map((t: string) => t.trim()).filter(Boolean) : [],
        date_derniere_action: new Date().toISOString().slice(0, 10),
        updated_at: new Date().toISOString(),
      }
      let err: any = null
      if (prospect?.id) {
        const res = await supabase.from("social_prospects").update(payload).eq("id", prospect.id)
        err = res.error
      } else {
        payload.date_premier_contact = new Date().toISOString().slice(0, 10)
        const res = await supabase.from("social_prospects").insert(payload)
        err = res.error
      }
      if (err) { setErrMsg("Erreur : " + err.message); setSaving(false); return }
      setSaving(false); onDone(); onClose()
    } catch (e: any) {
      setErrMsg("Erreur : " + (e?.message || "inconnue"))
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#111111] border border-zinc-800 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 shrink-0">
          <h2 className="text-white font-bold">{prospect ? "Modifier" : "Nouveau prospect"}</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white"><X size={16}/></button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {errMsg && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
              <p className="text-red-400 text-sm font-semibold">{errMsg}</p>
            </div>
          )}
          <div>
            <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Nom / Pseudo *</label>
            <input value={nom} onChange={e => setNom(e.target.value)} placeholder="Ex: @studio_ink_paris" autoFocus
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-500/60"/>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Réseau</label>
              <select value={reseau} onChange={e => setReseau(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none">
                {Object.entries(RESEAUX).map(([k, v]) => <option key={k} value={k}>{v.emoji} {v.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Priorité</label>
              <div className="flex gap-1.5">
                {(["haute","normale","basse"] as const).map(p => (
                  <button key={p} onClick={() => setPriorite(p)}
                    className={`flex-1 py-2 rounded-xl text-[10px] font-bold border transition-all ${priorite === p ? `${PRIORITES[p].bg} ${PRIORITES[p].border} ${PRIORITES[p].color}` : "bg-zinc-900 border-zinc-800 text-zinc-600"}`}>
                    {PRIORITES[p].label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Statut</label>
            <div className="grid grid-cols-2 gap-1.5">
              {STATUTS_ORDER.map(s => {
                const cfg = STATUTS[s]
                return (
                  <button key={s} onClick={() => setStatut(s)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border transition-all text-left ${statut === s ? `${cfg.bg} ${cfg.border} ${cfg.color}` : "bg-zinc-900 border-zinc-800 text-zinc-600 hover:border-zinc-600"}`}>
                    <span>{cfg.emoji}</span>{cfg.label}
                  </button>
                )
              })}
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">🔗 URL du profil</label>
            <input value={profilUrl} onChange={e => setProfilUrl(e.target.value)} placeholder="https://instagram.com/..."
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none"/>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">📍 Ville</label>
              <input value={ville} onChange={e => setVille(e.target.value)} placeholder="Paris..."
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none"/>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">🏷️ Secteur</label>
              <input value={secteur} onChange={e => setSecteur(e.target.value)} placeholder="Tatouage..."
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none"/>
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">💰 Budget estimé (€)</label>
            <input type="number" value={budget} onChange={e => setBudget(e.target.value)} placeholder="0"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none"/>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">🏷️ Tags <span className="normal-case text-zinc-600 font-normal">(virgule)</span></label>
            <input value={tags} onChange={e => setTags(e.target.value)} placeholder="tatouage, soins..."
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none"/>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">📝 Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Informations utiles..."
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none resize-none"/>
          </div>
        </div>
        <div className="px-5 py-4 border-t border-zinc-800 flex gap-2 shrink-0">
          <button onClick={save} disabled={saving || !nom.trim()}
            className="flex-1 py-3 rounded-xl bg-yellow-500 hover:bg-yellow-400 disabled:opacity-40 text-black font-bold text-sm flex items-center justify-center gap-2">
            {saving ? <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"/> : <><Check size={14}/> {prospect ? "Mettre à jour" : "Créer"}</>}
          </button>
          <button onClick={onClose} className="px-4 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold text-sm">Annuler</button>
        </div>
      </div>
    </div>
  )
}

function FichePanel({ prospect: ip, actions, societyId, profile, onClose, onUpdate }: {
  prospect: Prospect; actions: Action[]; societyId: string; profile: any
  onClose: () => void; onUpdate: () => void
}) {
  const [prospect, setProspect]             = useState(ip)
  const [newActionType, setNewActionType]   = useState("message")
  const [newActionContent, setNewContent]   = useState("")
  const [savingAction, setSavingAction]     = useState(false)

  useEffect(() => { setProspect(ip) }, [ip])

  const addAction = async () => {
    setSavingAction(true)
    try {
      await supabase.from("social_actions").insert({
        prospect_id: prospect.id, society_id: societyId,
        user_id: profile.id, type_action: newActionType,
        contenu: newActionContent || null,
      })
      await supabase.from("social_prospects").update({
        date_derniere_action: new Date().toISOString().slice(0, 10),
        updated_at: new Date().toISOString(),
      }).eq("id", prospect.id)
      setNewContent("")
      onUpdate()
    } catch (e) { console.error(e) }
    setSavingAction(false)
  }

  const changerStatut = async (s: string) => {
    await supabase.from("social_prospects").update({
      statut: s, date_derniere_action: new Date().toISOString().slice(0, 10),
      updated_at: new Date().toISOString(),
    }).eq("id", prospect.id)
    try {
      await supabase.from("social_actions").insert({
        prospect_id: prospect.id, society_id: societyId,
        user_id: profile.id, type_action: "note",
        contenu: `Statut → ${STATUTS[s]?.label}`,
      })
    } catch {}
    setProspect(p => ({ ...p, statut: s }))
    onUpdate()
  }

  const cfg  = STATUTS[prospect.statut]
  const r    = RESEAUX[prospect.reseau]
  const prio = PRIORITES[prospect.priorite as keyof typeof PRIORITES]
  const next = cfg?.next
  const pActions = actions.filter(a => a.prospect_id === prospect.id)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex justify-end">
      <div className="bg-[#111111] border-l border-zinc-800 w-full max-w-lg h-full flex flex-col shadow-2xl">
        <div className="px-5 py-4 border-b border-zinc-800 shrink-0">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${cfg?.bg} ${cfg?.border} ${cfg?.color}`}>{cfg?.emoji} {cfg?.label}</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${prio?.bg} ${prio?.border} ${prio?.color}`}>{prio?.label}</span>
              </div>
              <h2 className="text-white font-bold text-lg truncate">{prospect.nom}</h2>
              <div className="flex items-center gap-2 flex-wrap mt-0.5">
                <span className={`text-xs font-semibold ${r?.color}`}>{r?.emoji} {r?.label}</span>
                {prospect.ville && <span className="text-zinc-500 text-xs">📍 {prospect.ville}</span>}
                {prospect.secteur && <span className="text-zinc-500 text-xs">· {prospect.secteur}</span>}
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0 ml-2">
              {prospect.profil_url && (
                <a href={prospect.profil_url} target="_blank" rel="noopener noreferrer"
                  className="w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800">
                  <ExternalLink size={14}/>
                </a>
              )}
              <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-zinc-500 hover:text-white"><X size={16}/></button>
            </div>
          </div>
          <div className="flex gap-2 mt-3 flex-wrap">
            {prospect.budget_estime != null && (
              <div className="flex items-center gap-1.5 bg-zinc-900 rounded-lg px-2.5 py-1.5">
                <span className="text-zinc-500 text-[10px]">Budget</span>
                <span className="text-yellow-400 text-xs font-bold">{Number(prospect.budget_estime).toFixed(0)}€</span>
              </div>
            )}
            {prospect.date_premier_contact && (
              <div className="flex items-center gap-1.5 bg-zinc-900 rounded-lg px-2.5 py-1.5">
                <span className="text-zinc-500 text-[10px]">1er contact</span>
                <span className="text-zinc-300 text-xs">{formatDate(prospect.date_premier_contact)}</span>
              </div>
            )}
            {prospect.date_derniere_action && (
              <div className="flex items-center gap-1.5 bg-zinc-900 rounded-lg px-2.5 py-1.5">
                <Clock size={10} className="text-zinc-500"/>
                <span className="text-zinc-300 text-xs">{formatDate(prospect.date_derniere_action)}</span>
              </div>
            )}
          </div>
          {prospect.tags && prospect.tags.length > 0 && (
            <div className="flex gap-1.5 mt-2 flex-wrap">
              {prospect.tags.map(tag => (
                <span key={tag} className="text-[10px] bg-zinc-800 border border-zinc-700 text-zinc-400 px-2 py-0.5 rounded-full">{tag}</span>
              ))}
            </div>
          )}
        </div>
        {next && (
          <div className="px-5 py-3 border-b border-zinc-800 shrink-0">
            <button onClick={() => changerStatut(next)}
              className="w-full py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/20">
              <Zap size={14}/> Passer à : {STATUTS[next]?.emoji} {STATUTS[next]?.label}
            </button>
          </div>
        )}
        <div className="px-5 py-3 border-b border-zinc-800 shrink-0">
          <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider mb-2">Changer le statut</p>
          <div className="flex gap-1 flex-wrap">
            {STATUTS_ORDER.map(s => {
              const sc = STATUTS[s]; const isActive = prospect.statut === s
              return (
                <button key={s} onClick={() => !isActive && changerStatut(s)}
                  className={`text-[10px] font-semibold px-2 py-1 rounded-lg border transition-all ${isActive ? `${sc.bg} ${sc.border} ${sc.color}` : "bg-zinc-900 border-zinc-800 text-zinc-600 hover:border-zinc-600 hover:text-zinc-400"}`}>
                  {sc.emoji}
                </button>
              )
            })}
          </div>
        </div>
        {prospect.notes && (
          <div className="px-5 py-3 border-b border-zinc-800 shrink-0">
            <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider mb-1">Notes</p>
            <p className="text-zinc-400 text-xs leading-relaxed">{prospect.notes}</p>
          </div>
        )}
        <div className="px-5 py-3 border-b border-zinc-800 shrink-0">
          <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider mb-2">Ajouter une action</p>
          <div className="mb-2">
            <select value={newActionType} onChange={e => setNewActionType(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none">
              {Object.entries(ACTION_TYPES).map(([k, v]) => <option key={k} value={k}>{v.emoji} {v.label}</option>)}
            </select>
          </div>
          <div className="flex gap-2">
            <input value={newActionContent} onChange={e => setNewContent(e.target.value)}
              placeholder="Détail (optionnel)..." onKeyDown={e => e.key === "Enter" && addAction()}
              className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none"/>
            <button onClick={addAction} disabled={savingAction}
              className="px-3 py-2 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-xs flex items-center gap-1 disabled:opacity-40">
              {savingAction ? <div className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin"/> : <Send size={12}/>}
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-3">
          <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider mb-3">Historique ({pActions.length})</p>
          {pActions.length === 0 ? (
            <p className="text-zinc-700 text-xs text-center py-6">Aucune action enregistrée</p>
          ) : (
            <div className="relative">
              <div className="absolute left-[13px] top-0 bottom-0 w-px bg-zinc-800"/>
              <div className="space-y-3">
                {pActions.map(action => {
                  const ac = ACTION_TYPES[action.type_action] || ACTION_TYPES.note
                  return (
                    <div key={action.id} className="flex gap-3 relative">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-sm shrink-0 z-10 bg-zinc-900 border border-zinc-700">{ac.emoji}</div>
                      <div className="flex-1 min-w-0 pb-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className={`text-xs font-semibold ${ac.color}`}>{ac.label}</p>
                          <p className="text-zinc-600 text-[10px] shrink-0">
                            {new Date(action.created_at).toLocaleDateString("fr-FR", { day:"numeric", month:"short", hour:"2-digit", minute:"2-digit" })}
                          </p>
                        </div>
                        {action.contenu && <p className="text-zinc-400 text-xs mt-0.5 leading-relaxed">{action.contenu}</p>}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ProspectCard({ prospect, onClick, onEdit, onDelete }: {
  prospect: Prospect; onClick: () => void; onEdit: () => void; onDelete: () => void
}) {
  const r    = RESEAUX[prospect.reseau]
  const prio = PRIORITES[prospect.priorite as keyof typeof PRIORITES]
  return (
    <div onClick={onClick} className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 cursor-pointer hover:border-zinc-600 transition-all group">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className={`text-[10px] font-bold ${r?.color}`}>{r?.emoji}</span>
            <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${prio?.dot}`}/>
          </div>
          <p className="text-white text-sm font-bold truncate">{prospect.nom}</p>
          {prospect.ville   && <p className="text-zinc-500 text-[10px] truncate">📍 {prospect.ville}</p>}
          {prospect.secteur && <p className="text-zinc-600 text-[10px] truncate">{prospect.secteur}</p>}
        </div>
        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" onClick={e => e.stopPropagation()}>
          <button onClick={onEdit}   className="w-6 h-6 flex items-center justify-center text-zinc-500 hover:text-white rounded hover:bg-zinc-700"><Pencil size={11}/></button>
          <button onClick={onDelete} className="w-6 h-6 flex items-center justify-center text-zinc-600 hover:text-red-400 rounded hover:bg-red-500/10"><Trash2 size={11}/></button>
        </div>
      </div>
      <div className="flex items-center justify-between">
        {prospect.budget_estime ? <span className="text-yellow-400 text-[10px] font-bold">{Number(prospect.budget_estime).toFixed(0)}€</span> : <span/>}
        {prospect.date_derniere_action && <span className="text-zinc-600 text-[9px]">{formatDate(prospect.date_derniere_action)}</span>}
      </div>
      {prospect.tags && prospect.tags.length > 0 && (
        <div className="flex gap-1 mt-1.5 flex-wrap">
          {prospect.tags.slice(0, 3).map(tag => (
            <span key={tag} className="text-[9px] bg-zinc-800 text-zinc-500 px-1.5 py-0.5 rounded-full">{tag}</span>
          ))}
        </div>
      )}
    </div>
  )
}

export default function SocialProspectsModule({ activeSociety, profile }: Props) {
  const [prospects, setProspects]   = useState<Prospect[]>([])
  const [actions, setActions]       = useState<Action[]>([])
  const [loading, setLoading]       = useState(true)
  const [loadError, setLoadError]   = useState("")
  const [view, setView]             = useState<"kanban"|"liste">("kanban")
  const [search, setSearch]         = useState("")
  const [filterReseau, setFilterReseau]     = useState("all")
  const [filterPriorite, setFilterPriorite] = useState("all")
  const [showModal, setShowModal]           = useState(false)
  const [editProspect, setEditProspect]     = useState<Prospect | null>(null)
  const [ficheProspect, setFicheProspect]   = useState<Prospect | null>(null)

  const load = useCallback(async () => {
    if (!activeSociety?.id) return
    setLoading(true); setLoadError("")
    try {
      const { data: p, error: ep } = await supabase
        .from("social_prospects").select("*")
        .eq("society_id", activeSociety.id)
        .order("created_at", { ascending: false })
      if (ep) { setLoadError("Erreur : " + ep.message + " — Vérifiez que le SQL a été exécuté dans Supabase."); setLoading(false); return }
      setProspects(p || [])
      try {
        const { data: a } = await supabase.from("social_actions").select("*")
          .eq("society_id", activeSociety.id).order("created_at", { ascending: false })
        setActions(a || [])
      } catch { setActions([]) }
    } catch (e: any) { setLoadError("Erreur : " + (e?.message || "inconnue")) }
    setLoading(false)
  }, [activeSociety?.id])

  useEffect(() => { load() }, [load])

  const handleUpdate = useCallback(async () => {
    await load()
    if (ficheProspect) {
      const { data } = await supabase.from("social_prospects").select("*").eq("id", ficheProspect.id).single()
      if (data) setFicheProspect(data)
    }
  }, [load, ficheProspect])

  const deleteProspect = async (id: string) => {
    if (!confirm("Supprimer ce prospect ?")) return
    try { await supabase.from("social_actions").delete().eq("prospect_id", id) } catch {}
    await supabase.from("social_prospects").delete().eq("id", id)
    setProspects(prev => prev.filter(p => p.id !== id))
    if (ficheProspect?.id === id) setFicheProspect(null)
  }

  const filtered = prospects.filter(p => {
    if (filterReseau   !== "all" && p.reseau   !== filterReseau)   return false
    if (filterPriorite !== "all" && p.priorite !== filterPriorite) return false
    if (search) {
      const s = search.toLowerCase()
      return p.nom?.toLowerCase().includes(s) || p.ville?.toLowerCase().includes(s)
        || p.secteur?.toLowerCase().includes(s) || (p.tags || []).some(t => t.toLowerCase().includes(s))
    }
    return true
  })

  const total    = prospects.length
  const gannes   = prospects.filter(p => p.statut === "gagne").length
  const actifs   = prospects.filter(p => !["gagne","perdu"].includes(p.statut)).length
  const tauxConv = total > 0 ? Math.round((gannes / total) * 100) : 0
  const kanbanCols = STATUTS_ORDER.map(s => ({ statut: s, cfg: STATUTS[s], items: filtered.filter(p => p.statut === s) }))

  return (
    <div className="flex-1 overflow-hidden bg-[#0a0a0a] flex flex-col">
      <div className="border-b border-zinc-900 p-4 shrink-0 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h1 className="text-white font-bold text-xl">📱 Instagram & Autres</h1>
            <p className="text-zinc-500 text-xs mt-0.5">Suivi de prospection réseaux sociaux</p>
          </div>
          <button onClick={() => { setEditProspect(null); setShowModal(true) }}
            className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-4 py-2.5 rounded-xl text-sm shadow-lg shadow-yellow-500/20">
            <Plus size={15}/> Nouveau prospect
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {[
            { label: "Total",      value: total,        color: "text-white",       icon: <Users size={14}/> },
            { label: "En cours",   value: actifs,       color: "text-yellow-400",  icon: <Target size={14}/> },
            { label: "Gagnés",     value: gannes,       color: "text-green-400",   icon: <TrendingUp size={14}/> },
            { label: "Taux conv.", value: tauxConv+"%", color: tauxConv > 20 ? "text-green-400" : "text-zinc-400", icon: <Zap size={14}/> },
          ].map(({ label, value, color, icon }) => (
            <div key={label} className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 flex items-center gap-2.5">
              <div className="text-zinc-600">{icon}</div>
              <div><p className={`text-base font-black ${color}`}>{value}</p><p className="text-zinc-600 text-[10px]">{label}</p></div>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[160px]">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"/>
            <input type="text" placeholder="Nom, ville, secteur, tag..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-500/40"/>
          </div>
          <select value={filterReseau} onChange={e => setFilterReseau(e.target.value)} className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none">
            <option value="all">Tous réseaux</option>
            {Object.entries(RESEAUX).map(([k, v]) => <option key={k} value={k}>{v.emoji} {v.label}</option>)}
          </select>
          <select value={filterPriorite} onChange={e => setFilterPriorite(e.target.value)} className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none">
            <option value="all">Toutes priorités</option>
            <option value="haute">🔴 Haute</option>
            <option value="normale">🟡 Normale</option>
            <option value="basse">⚫ Basse</option>
          </select>
          <div className="flex gap-1 bg-zinc-900 border border-zinc-800 rounded-xl p-1">
            <button onClick={() => setView("kanban")} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${view==="kanban" ? "bg-zinc-700 text-white" : "text-zinc-500 hover:text-zinc-300"}`}><LayoutGrid size={12}/> Kanban</button>
            <button onClick={() => setView("liste")}  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${view==="liste"  ? "bg-zinc-700 text-white" : "text-zinc-500 hover:text-zinc-300"}`}><List size={12}/> Liste</button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center"><div className="w-6 h-6 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin"/></div>
      ) : loadError ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <p className="text-red-400 text-sm font-semibold mb-2">{loadError}</p>
          <p className="text-zinc-500 text-xs mb-4">Exécutez le SQL dans Supabase → SQL Editor puis rechargez</p>
          <button onClick={load} className="bg-yellow-500 text-black font-bold px-4 py-2 rounded-xl text-sm">Réessayer</button>
        </div>
      ) : prospects.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <div className="text-6xl mb-4">📱</div>
          <p className="text-white text-lg font-bold mb-2">Aucun prospect</p>
          <p className="text-zinc-500 text-sm mb-6">Suivez vos prospects Instagram, TikTok et autres réseaux</p>
          <button onClick={() => { setEditProspect(null); setShowModal(true) }}
            className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-5 py-3 rounded-xl text-sm">
            <Plus size={15}/> Ajouter un prospect
          </button>
        </div>
      ) : view === "kanban" ? (
        <div className="flex-1 overflow-x-auto">
          <div className="flex gap-3 p-4 h-full" style={{ minWidth: `${STATUTS_ORDER.length * 220}px` }}>
            {kanbanCols.map(({ statut, cfg, items }) => (
              <div key={statut} className="flex flex-col w-52 shrink-0">
                <div className={`flex items-center justify-between px-3 py-2 rounded-xl mb-2 border ${cfg.bg} ${cfg.border}`}>
                  <div className="flex items-center gap-1.5"><span className="text-sm">{cfg.emoji}</span><p className={`text-[11px] font-bold ${cfg.color} truncate`}>{cfg.label}</p></div>
                  <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${cfg.bg} ${cfg.color} shrink-0`}>{items.length}</span>
                </div>
                <div className="flex-1 overflow-y-auto space-y-2">
                  {items.map(p => (
                    <ProspectCard key={p.id} prospect={p}
                      onClick={() => setFicheProspect(p)}
                      onEdit={() => { setEditProspect(p); setShowModal(true) }}
                      onDelete={() => deleteProspect(p.id)}
                    />
                  ))}
                  {items.length === 0 && <div className="text-center py-8 text-zinc-800 text-xs">Vide</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead><tr className="border-b border-zinc-800">
                {["Prospect","Réseau","Statut","Priorité","Ville","Dernière action","Budget",""].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr></thead>
              <tbody className="divide-y divide-zinc-800">
                {filtered.map(p => {
                  const r  = RESEAUX[p.reseau]; const s = STATUTS[p.statut]; const pr = PRIORITES[p.priorite as keyof typeof PRIORITES]
                  return (
                    <tr key={p.id} onClick={() => setFicheProspect(p)} className="hover:bg-zinc-800/40 cursor-pointer transition-colors group">
                      <td className="px-4 py-3"><p className="text-white text-sm font-semibold">{p.nom}</p>{p.secteur && <p className="text-zinc-500 text-[10px]">{p.secteur}</p>}</td>
                      <td className="px-4 py-3"><span className={`text-xs font-semibold ${r?.color}`}>{r?.emoji} {r?.label}</span></td>
                      <td className="px-4 py-3"><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${s?.bg} ${s?.border} ${s?.color}`}>{s?.emoji} {s?.label}</span></td>
                      <td className="px-4 py-3"><div className={`w-2 h-2 rounded-full inline-block ${pr?.dot}`}/><span className={`text-[10px] ml-1.5 ${pr?.color}`}>{pr?.label}</span></td>
                      <td className="px-4 py-3 text-zinc-400 text-xs">{p.ville || "—"}</td>
                      <td className="px-4 py-3 text-zinc-500 text-xs">{formatDate(p.date_derniere_action)}</td>
                      <td className="px-4 py-3">{p.budget_estime ? <span className="text-yellow-400 text-xs font-bold">{Number(p.budget_estime).toFixed(0)}€</span> : <span className="text-zinc-700">—</span>}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                          <button onClick={() => { setEditProspect(p); setShowModal(true) }} className="p-1.5 text-zinc-400 hover:text-white rounded hover:bg-zinc-700"><Pencil size={12}/></button>
                          <button onClick={() => deleteProspect(p.id)} className="p-1.5 text-zinc-600 hover:text-red-400 rounded hover:bg-red-500/10"><Trash2 size={12}/></button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <ProspectModal prospect={editProspect} societyId={activeSociety.id} profile={profile}
          onClose={() => { setShowModal(false); setEditProspect(null) }} onDone={load}/>
      )}
      {ficheProspect && (
        <FichePanel prospect={ficheProspect} actions={actions} societyId={activeSociety.id} profile={profile}
          onClose={() => setFicheProspect(null)} onUpdate={handleUpdate}/>
      )}
    </div>
  )
}