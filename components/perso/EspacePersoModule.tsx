"use client"

import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import { Save, Plus, Trash2, Check, Lock, Edit3, Target, StickyNote, ListTodo, TrendingUp, Star } from "lucide-react"

interface Props { activeSociety: any; profile: any; targetIds: string[]; targetNom: string }

interface TodoItem { id: string; text: string; done: boolean; created_at: string }
interface Objectif { id: string; label: string; valeur_cible: number; valeur_actuelle: number; unite: string; color: string }
interface PostIt  { id: string; text: string; color: string; created_at: string }

const POSTIT_COLORS = ["#fef08a","#bbf7d0","#bfdbfe","#fecaca","#e9d5ff","#fed7aa"]

export default function EspacePersoModule({ activeSociety, profile, targetIds, targetNom }: Props) {
  const [targetProfile, setTargetProfile] = useState<any>(null)
  const [loading, setLoading]       = useState(true)
  const [saving, setSaving]         = useState(false)
  const isOwner = targetIds.includes(profile?.id)

  // Data
  const [notes, setNotes]           = useState("")
  const [savedNotes, setSavedNotes] = useState("")
  const [todos, setTodos]           = useState<TodoItem[]>([])
  const [objectifs, setObjectifs]   = useState<Objectif[]>([])
  const [postits, setPostits]       = useState<PostIt[]>([])
  const [stats, setStats]           = useState({ ventesJour: 0, ventesMois: 0, caJour: 0, caMois: 0 })

  // UI
  const [newTodo, setNewTodo]       = useState("")
  const [editingNotes, setEditingNotes] = useState(false)
  const [newObjectifLabel, setNewObjectifLabel] = useState("")
  const [newObjectifCible, setNewObjectifCible] = useState("")
  const [newObjectifUnite, setNewObjectifUnite] = useState("")
  const [showObjectifForm, setShowObjectifForm] = useState(false)
  const [newPostitText, setNewPostitText] = useState("")
  const [activeTab, setActiveTab]   = useState<"notes"|"todo"|"objectifs"|"postits">("notes")
  const [espaceId, setEspaceId]     = useState<string | null>(null)

  const sid = activeSociety?.id

  const load = useCallback(async () => {
    if (!sid) return
    setLoading(true)

    // Trouver le profil cible par UUID
    const { data: profiles } = await supabase.from("profiles")
      .select("id,nom,prenom,avatar_url,color,email")
      .in("id", targetIds)
    const tp = profiles?.[0] || null
    setTargetProfile(tp || null)

    if (!tp) { setLoading(false); return }

    // Charger l'espace perso
    let { data: espace } = await supabase.from("espace_perso")
      .select("*").eq("profile_id", tp.id).eq("society_id", sid).single()

    if (!espace) {
      const { data: created } = await supabase.from("espace_perso").insert({
        society_id: sid, profile_id: tp.id, profile_nom: tp.prenom || tp.nom,
        notes: "", todo: [], objectifs: [], postits: []
      }).select().single()
      espace = created
    }

    if (espace) {
      setEspaceId(espace.id)
      setNotes(espace.notes || "")
      setSavedNotes(espace.notes || "")
      setTodos(espace.todo || [])
      setObjectifs(espace.objectifs || [])
      setPostits(espace.postits || [])
    }

    // Stats personnelles (ventes créées par ce profil)
    const today = new Date().toISOString().slice(0,10)
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0,10)
    const { data: ventesData } = await supabase.from("ventes")
      .select("total_ttc,created_at")
      .eq("society_id", sid)
      .eq("created_by", tp.id)
      .gte("created_at", monthStart)
    const ventes = ventesData || []
    const ventesJour = ventes.filter(v => v.created_at?.slice(0,10) === today)
    setStats({
      ventesJour: ventesJour.length,
      ventesMois: ventes.length,
      caJour: ventesJour.reduce((s:number,v:any) => s + (Number(v.total_ttc)||0), 0),
      caMois: ventes.reduce((s:number,v:any) => s + (Number(v.total_ttc)||0), 0),
    })

    setLoading(false)
  }, [sid, targetNom])

  useEffect(() => { load() }, [load])

  const saveAll = async (patch: any) => {
    if (!espaceId || !isOwner) return
    await supabase.from("espace_perso").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", espaceId)
  }

  const saveNotes = async () => {
    setSaving(true)
    await saveAll({ notes })
    setSavedNotes(notes)
    setEditingNotes(false)
    setSaving(false)
  }

  const addTodo = async () => {
    if (!newTodo.trim() || !isOwner) return
    const item: TodoItem = { id: crypto.randomUUID(), text: newTodo.trim(), done: false, created_at: new Date().toISOString() }
    const next = [...todos, item]
    setTodos(next); setNewTodo("")
    await saveAll({ todo: next })
  }

  const toggleTodo = async (id: string) => {
    if (!isOwner) return
    const next = todos.map(t => t.id === id ? { ...t, done: !t.done } : t)
    setTodos(next); await saveAll({ todo: next })
  }

  const deleteTodo = async (id: string) => {
    if (!isOwner) return
    const next = todos.filter(t => t.id !== id)
    setTodos(next); await saveAll({ todo: next })
  }

  const addObjectif = async () => {
    if (!newObjectifLabel.trim() || !isOwner) return
    const colors = ["#eab308","#22c55e","#3b82f6","#a855f7","#f97316"]
    const item: Objectif = {
      id: crypto.randomUUID(), label: newObjectifLabel.trim(),
      valeur_cible: Number(newObjectifCible) || 100, valeur_actuelle: 0,
      unite: newObjectifUnite || "%", color: colors[objectifs.length % colors.length]
    }
    const next = [...objectifs, item]
    setObjectifs(next); setNewObjectifLabel(""); setNewObjectifCible(""); setNewObjectifUnite(""); setShowObjectifForm(false)
    await saveAll({ objectifs: next })
  }

  const updateObjectifActuel = async (id: string, val: number) => {
    if (!isOwner) return
    const next = objectifs.map(o => o.id === id ? { ...o, valeur_actuelle: val } : o)
    setObjectifs(next); await saveAll({ objectifs: next })
  }

  const deleteObjectif = async (id: string) => {
    if (!isOwner) return
    const next = objectifs.filter(o => o.id !== id)
    setObjectifs(next); await saveAll({ objectifs: next })
  }

  const addPostit = async (color: string) => {
    if (!newPostitText.trim() || !isOwner) return
    const item: PostIt = { id: crypto.randomUUID(), text: newPostitText.trim(), color, created_at: new Date().toISOString() }
    const next = [...postits, item]
    setPostits(next); setNewPostitText("")
    await saveAll({ postits: next })
  }

  const deletePostit = async (id: string) => {
    if (!isOwner) return
    const next = postits.filter(p => p.id !== id)
    setPostits(next); await saveAll({ postits: next })
  }

  const fmtMoney = (n: number) => n.toLocaleString("fr-FR", { minimumFractionDigits: 2 }) + " €"
  const initials = (targetProfile?.prenom || targetProfile?.nom || targetNom)?.split(" ").map((n:string) => n[0]).join("").toUpperCase().slice(0,2) || "?"
  const colors = ["#eab308","#22c55e","#3b82f6","#a855f7","#f97316","#ef4444"]
  const avatarBg = targetProfile?.color || colors[(targetNom.charCodeAt(0)||0) % colors.length]

  if (loading) return (
    <div className="flex-1 flex items-center justify-center bg-[#0a0a0a]">
      <div className="w-7 h-7 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!targetProfile) return (
    <div className="flex-1 flex items-center justify-center bg-[#0a0a0a]">
      <div className="text-center">
        <p className="text-4xl mb-3">👤</p>
        <p className="text-white font-bold">Profil "{targetNom}" introuvable</p>
        <p className="text-zinc-500 text-sm mt-1">Ce profil n'existe pas encore dans la société</p>
      </div>
    </div>
  )

  return (
    <div className="flex-1 overflow-y-auto bg-[#0a0a0a]">

      {/* Header profil */}
      <div className="border-b border-zinc-900 px-6 py-5 flex items-center gap-5"
        style={{ background: `linear-gradient(135deg, ${avatarBg}10, transparent)` }}>
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black text-black shadow-lg shrink-0"
          style={{ backgroundColor: avatarBg }}>
          {targetProfile.avatar_url
            ? <img src={targetProfile.avatar_url} className="w-full h-full object-cover rounded-2xl" alt="" />
            : initials}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-white font-black text-2xl">{targetProfile.prenom || targetProfile.nom}</h1>
            {!isOwner && (
              <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700">
                <Lock size={9} /> Lecture seule
              </span>
            )}
            {isOwner && (
              <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border" style={{ background: avatarBg+"20", borderColor: avatarBg+"50", color: avatarBg }}>
                <Star size={9} /> Mon espace
              </span>
            )}
          </div>
          <p className="text-zinc-500 text-sm mt-0.5">Espace personnel · {targetProfile.nom}</p>
        </div>
        {/* Mini stats */}
        <div className="flex gap-3 shrink-0">
          {[
            { label: "Ventes aujourd'hui", value: stats.ventesJour, sub: fmtMoney(stats.caJour) },
            { label: "Ventes ce mois",     value: stats.ventesMois, sub: fmtMoney(stats.caMois) },
          ].map(s => (
            <div key={s.label} className="text-right px-4 py-2.5 rounded-xl border border-zinc-800 bg-zinc-900/40">
              <p className="text-white font-black text-xl leading-none" style={{ color: avatarBg }}>{s.value}</p>
              <p className="text-zinc-500 text-[10px] mt-1 whitespace-nowrap">{s.label}</p>
              <p className="text-zinc-600 text-[10px]">{s.sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b border-zinc-900 px-6">
        {([
          { id:"notes",    label:"Notes",    icon:<Edit3 size={13}/> },
          { id:"todo",     label:"Todo",     icon:<ListTodo size={13}/> },
          { id:"objectifs",label:"Objectifs",icon:<Target size={13}/> },
          { id:"postits",  label:"Post-its", icon:<StickyNote size={13}/> },
        ] as const).map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className="flex items-center gap-1.5 px-4 py-3 text-sm font-bold border-b-2 transition-colors"
            style={{ color: activeTab===t.id ? avatarBg : "#52525b", borderColor: activeTab===t.id ? avatarBg : "transparent" }}>
            {t.icon} {t.label}
            {t.id === "todo" && todos.filter(t=>!t.done).length > 0 &&
              <span className="text-[10px] px-1.5 py-0.5 rounded-full font-black" style={{ background: avatarBg+"25", color: avatarBg }}>{todos.filter(t=>!t.done).length}</span>}
            {t.id === "objectifs" && objectifs.length > 0 &&
              <span className="text-[10px] px-1.5 py-0.5 rounded-full font-black bg-zinc-800 text-zinc-400">{objectifs.length}</span>}
          </button>
        ))}
      </div>

      <div className="px-6 py-5 max-w-4xl">

        {/* ── NOTES ── */}
        {activeTab === "notes" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-white font-bold">📝 Notes personnelles</h2>
              {isOwner && !editingNotes && <button onClick={() => setEditingNotes(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600 transition-colors"><Edit3 size={11}/> Modifier</button>}
            </div>
            {editingNotes ? (
              <div className="space-y-2">
                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={16}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-2xl p-4 text-white text-sm outline-none focus:border-zinc-500 resize-none leading-relaxed font-mono"
                  placeholder="Tes notes personnelles..." />
                <div className="flex gap-2">
                  <button onClick={saveNotes} disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-black transition-all"
                    style={{ backgroundColor: avatarBg }}>
                    <Save size={13}/> {saving ? "Sauvegarde..." : "Sauvegarder"}
                  </button>
                  <button onClick={() => { setNotes(savedNotes); setEditingNotes(false) }}
                    className="px-4 py-2 rounded-xl text-sm font-bold text-zinc-400 border border-zinc-800 hover:border-zinc-600 transition-colors">
                    Annuler
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-5 min-h-[200px]">
                {notes ? (
                  <pre className="text-zinc-200 text-sm leading-relaxed whitespace-pre-wrap font-sans">{notes}</pre>
                ) : (
                  <p className="text-zinc-600 text-sm italic">
                    {isOwner ? "Cliquez sur Modifier pour ajouter vos notes..." : "Aucune note pour le moment."}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── TODO ── */}
        {activeTab === "todo" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-white font-bold">✅ Liste de tâches personnelle</h2>
              <span className="text-zinc-500 text-xs">{todos.filter(t=>t.done).length}/{todos.length} terminées</span>
            </div>

            {isOwner && (
              <div className="flex gap-2">
                <input value={newTodo} onChange={e => setNewTodo(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && addTodo()}
                  placeholder="Nouvelle tâche..." className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600" />
                <button onClick={addTodo} className="px-4 py-2.5 rounded-xl text-sm font-bold text-black shrink-0 transition-all" style={{ backgroundColor: avatarBg }}>
                  <Plus size={15}/>
                </button>
              </div>
            )}

            {todos.length === 0 ? (
              <p className="text-zinc-600 text-sm italic py-8 text-center">{isOwner ? "Aucune tâche. Ajoutez-en une !" : "Aucune tâche."}</p>
            ) : (
              <div className="space-y-2">
                {[...todos].sort((a,b) => Number(a.done) - Number(b.done)).map(todo => (
                  <div key={todo.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${todo.done ? "border-zinc-800/40 bg-zinc-900/20 opacity-50" : "border-zinc-800 bg-zinc-900/40"}`}>
                    <button onClick={() => toggleTodo(todo.id)} disabled={!isOwner}
                      className="w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all"
                      style={{ backgroundColor: todo.done ? avatarBg : "transparent", borderColor: todo.done ? avatarBg : "#52525b" }}>
                      {todo.done && <Check size={12} className="text-black" strokeWidth={3}/>}
                    </button>
                    <span className={`flex-1 text-sm ${todo.done ? "line-through text-zinc-600" : "text-white"}`}>{todo.text}</span>
                    {isOwner && <button onClick={() => deleteTodo(todo.id)} className="text-zinc-700 hover:text-red-400 transition-colors shrink-0"><Trash2 size={13}/></button>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── OBJECTIFS ── */}
        {activeTab === "objectifs" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-white font-bold">🎯 Objectifs personnels</h2>
              {isOwner && <button onClick={() => setShowObjectifForm(p=>!p)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border border-zinc-800 text-zinc-400 hover:text-white transition-colors"><Plus size={11}/> Nouvel objectif</button>}
            </div>

            {isOwner && showObjectifForm && (
              <div className="p-4 rounded-2xl border border-zinc-700 bg-zinc-900/60 space-y-3">
                <p className="text-white font-bold text-sm">Nouvel objectif</p>
                <div className="grid grid-cols-3 gap-2">
                  <input value={newObjectifLabel} onChange={e => setNewObjectifLabel(e.target.value)} placeholder="Libellé (ex: CA mensuel)"
                    className="col-span-3 bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500" />
                  <input value={newObjectifCible} onChange={e => setNewObjectifCible(e.target.value)} placeholder="Cible (ex: 5000)" type="number"
                    className="bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none" />
                  <input value={newObjectifUnite} onChange={e => setNewObjectifUnite(e.target.value)} placeholder="Unité (€, %, …)"
                    className="bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none" />
                  <button onClick={addObjectif} className="rounded-xl text-sm font-bold text-black" style={{ backgroundColor: avatarBg }}>Ajouter</button>
                </div>
              </div>
            )}

            {objectifs.length === 0 ? (
              <p className="text-zinc-600 text-sm italic py-8 text-center">{isOwner ? "Aucun objectif défini." : "Aucun objectif."}</p>
            ) : (
              <div className="space-y-3">
                {objectifs.map(obj => {
                  const pct = Math.min(100, Math.round((obj.valeur_actuelle / obj.valeur_cible) * 100))
                  return (
                    <div key={obj.id} className="p-4 rounded-2xl border border-zinc-800 bg-zinc-900/40">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: obj.color }} />
                          <span className="text-white font-bold text-sm">{obj.label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black" style={{ color: obj.color }}>{pct}%</span>
                          {isOwner && <button onClick={() => deleteObjectif(obj.id)} className="text-zinc-700 hover:text-red-400"><Trash2 size={12}/></button>}
                        </div>
                      </div>
                      <div className="h-2.5 bg-zinc-800 rounded-full overflow-hidden mb-3">
                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: obj.color }} />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-400 text-xs">{obj.valeur_actuelle} / {obj.valeur_cible} {obj.unite}</span>
                        {isOwner && (
                          <div className="flex items-center gap-1">
                            <input type="number" defaultValue={obj.valeur_actuelle}
                              onBlur={e => updateObjectifActuel(obj.id, Number(e.target.value))}
                              className="w-20 bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1 text-xs text-white text-right focus:outline-none focus:border-zinc-500" />
                            <span className="text-zinc-600 text-xs">{obj.unite}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ── POST-ITS ── */}
        {activeTab === "postits" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-white font-bold">🗒️ Post-its</h2>
              <span className="text-zinc-600 text-xs">{postits.length} note{postits.length!==1?"s":""}</span>
            </div>

            {isOwner && (
              <div className="space-y-2">
                <textarea value={newPostitText} onChange={e => setNewPostitText(e.target.value)} rows={2} placeholder="Nouveau post-it..."
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600 resize-none" />
                <div className="flex gap-2 flex-wrap">
                  {POSTIT_COLORS.map(c => (
                    <button key={c} onClick={() => addPostit(c)}
                      className="w-8 h-8 rounded-lg hover:scale-110 transition-transform border-2 border-transparent hover:border-white/30"
                      style={{ backgroundColor: c }} />
                  ))}
                  <span className="text-zinc-600 text-xs self-center ml-1">← Choisir la couleur et coller</span>
                </div>
              </div>
            )}

            {postits.length === 0 ? (
              <p className="text-zinc-600 text-sm italic py-8 text-center">{isOwner ? "Aucun post-it. Collez-en un !" : "Aucun post-it."}</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {postits.map(p => (
                  <div key={p.id} className="relative rounded-2xl p-4 shadow-lg" style={{ backgroundColor: p.color, minHeight: "120px" }}>
                    <p className="text-zinc-900 text-sm font-medium leading-relaxed whitespace-pre-wrap">{p.text}</p>
                    {isOwner && (
                      <button onClick={() => deletePostit(p.id)} className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/15 hover:bg-black/30 flex items-center justify-center transition-colors">
                        <Trash2 size={11} className="text-zinc-800" />
                      </button>
                    )}
                    <p className="text-zinc-500 text-[10px] mt-2 absolute bottom-2 left-4">{new Date(p.created_at).toLocaleDateString("fr-FR",{day:"numeric",month:"short"})}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="h-8" />
      </div>
    </div>
  )
}
