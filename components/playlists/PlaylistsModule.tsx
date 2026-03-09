"use client"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Plus, X, Eye, Trash2, Users, ChevronDown, ChevronUp, Pencil } from "lucide-react"

interface Playlist { id: string; nom: string; client_ids: string[]; created_at: string }
interface Client { id: string; nom: string; contrat: string; ville?: string }
interface Props { activeSociety: any; profile: any }

export default function PlaylistsModule({ activeSociety, profile }: Props) {
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Playlist | null>(null)
  const [nom, setNom] = useState("")
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState("")
  const [saving, setSaving] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => { load() }, [activeSociety])

  const load = async () => {
    setLoading(true)
    const [{ data: pl }, { data: cl }] = await Promise.all([
      supabase.from("playlists_clients").select("*").eq("society_id", activeSociety.id).order("created_at", { ascending: false }),
      supabase.from("clients").select("id, nom, contrat, ville").eq("society_id", activeSociety.id).order("nom"),
    ])
    setPlaylists(pl || [])
    setClients(cl || [])
    setLoading(false)
  }

  const openCreate = () => {
    setEditing(null); setNom(""); setSelected(new Set()); setSearch(""); setShowForm(true)
  }

  const openEdit = (pl: Playlist) => {
    setEditing(pl)
    setNom(pl.nom)
    setSelected(new Set(pl.client_ids || []))
    setSearch("")
    setShowForm(true)
  }

  const closeForm = () => {
    setShowForm(false); setEditing(null); setNom(""); setSelected(new Set()); setSearch("")
  }

  const save = async () => {
    if (!nom.trim() || selected.size === 0) return
    setSaving(true)
    let error: any = null
    if (editing) {
      const res = await supabase.from("playlists_clients").update({
        nom: nom.trim(),
        client_ids: Array.from(selected),
      }).eq("id", editing.id)
      error = res.error
    } else {
      const res = await supabase.from("playlists_clients").insert({
        nom: nom.trim(),
        client_ids: Array.from(selected),
        society_id: activeSociety.id,
        user_id: profile.id,
      })
      error = res.error
    }
    if (error) { alert("Erreur: " + error.message); setSaving(false); return }
    setSaving(false); closeForm(); load()
  }

  const remove = async (id: string) => {
    if (!confirm("Supprimer cette playlist ?")) return
    await supabase.from("playlists_clients").delete().eq("id", id)
    load()
  }

  const toggleClient = (id: string) => {
    setSelected(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n })
  }

  const filteredClients = clients.filter(c => c.nom.toLowerCase().includes(search.toLowerCase()))
  const getClientsForPlaylist = (pl: Playlist) => clients.filter(c => pl.client_ids?.includes(c.id))

  const CONTRAT_COLORS: Record<string, string> = {
    "VIP": "#eab308", "Premium": "#a855f7", "Standard": "#3b82f6",
    "Prospect converti": "#22c55e"
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#0a0a0a]">
      <div className="px-6 py-4 border-b border-zinc-900 flex items-center justify-between">
        <div>
          <h1 className="text-white font-bold text-xl">🎵 Playlists clients</h1>
          <p className="text-zinc-500 text-xs mt-0.5">{playlists.length} playlist{playlists.length > 1 ? "s" : ""}</p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-black text-sm font-bold"
          style={{ backgroundColor: "#eab308" }}>
          <Plus size={14} /> Nouvelle playlist
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center h-40"><div className="w-6 h-6 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : playlists.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-5xl mb-4">🎵</p>
            <p className="text-zinc-400 font-bold text-lg">Aucune playlist</p>
            <p className="text-zinc-600 text-sm mt-2">Groupez vos clients par campagne, zone ou segment</p>
          </div>
        ) : (
          <div className="space-y-3 max-w-2xl mx-auto">
            {playlists.map(pl => {
              const cls = getClientsForPlaylist(pl)
              const isExpanded = expanded === pl.id
              return (
                <div key={pl.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden hover:border-zinc-700 transition-all">
                  <div className="p-4 flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-bold truncate">{pl.nom}</p>
                      <p className="text-zinc-500 text-xs mt-0.5"><Users size={10} className="inline mr-1" />{cls.length} client{cls.length > 1 ? "s" : ""}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button onClick={() => setExpanded(isExpanded ? null : pl.id)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors">
                        <Eye size={12} /> Voir {isExpanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                      </button>
                      <button onClick={() => openEdit(pl)}
                        className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 transition-colors">
                        <Pencil size={12} />
                      </button>
                      <button onClick={() => remove(pl.id)} className="w-8 h-8 rounded-lg bg-red-500/10 hover:bg-red-500/20 flex items-center justify-center text-red-400 transition-colors">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-zinc-800 p-4">
                      {cls.length === 0 ? (
                        <p className="text-zinc-600 text-xs text-center py-4">Aucun client trouvé</p>
                      ) : (
                        <div className="space-y-2">
                          {cls.map(c => (
                            <div key={c.id} className="flex items-center gap-3 bg-zinc-800/50 rounded-xl px-3 py-2.5">
                              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-black text-xs font-black shrink-0"
                                style={{ backgroundColor: CONTRAT_COLORS[c.contrat] || "#eab308" }}>
                                {c.nom.charAt(0).toUpperCase()}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-white text-sm font-semibold truncate">{c.nom}</p>
                                {c.ville && <p className="text-zinc-500 text-xs">📍 {c.ville}</p>}
                              </div>
                              <span className="text-xs font-bold px-2 py-0.5 rounded-lg shrink-0"
                                style={{ backgroundColor: (CONTRAT_COLORS[c.contrat] || "#eab308") + "20", color: CONTRAT_COLORS[c.contrat] || "#eab308" }}>
                                {c.contrat}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal création / édition */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111111] border border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-5 border-b border-zinc-800 shrink-0">
              <h2 className="text-white font-bold">{editing ? "Modifier la playlist" : "Nouvelle playlist"}</h2>
              <button onClick={closeForm}
                className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white">
                <X size={14} />
              </button>
            </div>
            <div className="p-5 flex flex-col gap-4 flex-1 overflow-hidden">
              <div>
                <label className="block text-zinc-500 text-[11px] uppercase tracking-wider mb-1.5">Nom de la playlist <span className="text-red-400">*</span></label>
                <input value={nom} onChange={e => setNom(e.target.value)} placeholder="Ex: Clients VIP Paris, Campagne Été..."
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-500/60" />
              </div>

              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-zinc-500 text-[11px] uppercase tracking-wider">Clients <span className="text-yellow-400 font-bold">{selected.size} sélectionné{selected.size > 1 ? "s" : ""}</span></label>
                  {selected.size > 0 && (
                    <button onClick={() => setSelected(new Set())} className="text-zinc-600 text-[10px] hover:text-zinc-400">Tout désélectionner</button>
                  )}
                </div>
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..."
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-500/60 mb-2" />
                <div className="flex-1 overflow-y-auto space-y-1">
                  {filteredClients.map(c => (
                    <button key={c.id} onClick={() => toggleClient(c.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all border ${selected.has(c.id) ? "border-yellow-500/50 bg-yellow-500/10" : "border-transparent hover:bg-zinc-800"}`}>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${selected.has(c.id) ? "bg-yellow-500 border-yellow-500" : "border-zinc-600"}`}>
                        {selected.has(c.id) && <span className="text-black text-[10px] font-black">✓</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">{c.nom}</p>
                        {c.ville && <p className="text-zinc-500 text-[10px]">{c.ville}</p>}
                      </div>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md shrink-0"
                        style={{ backgroundColor: (CONTRAT_COLORS[c.contrat] || "#eab308") + "20", color: CONTRAT_COLORS[c.contrat] || "#eab308" }}>
                        {c.contrat}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <button onClick={save} disabled={saving || !nom.trim() || selected.size === 0}
                className="w-full py-3 rounded-xl text-black font-bold text-sm bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 transition-colors shrink-0">
                {saving ? (editing ? "Mise à jour..." : "Création...") : editing ? `✓ Mettre à jour (${selected.size} client${selected.size > 1 ? "s" : ""})` : `Créer la playlist (${selected.size} client${selected.size > 1 ? "s" : ""})`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
