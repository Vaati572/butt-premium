"use client"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Plus, X, Search, Pin, Trash2, Pencil } from "lucide-react"

interface Note {
  id: string; titre: string; contenu: string; couleur: string
  pinned: boolean; tags: string[]; user_id: string
  created_at: string; updated_at: string
}

const COULEURS = [
  { id: "yellow", bg: "#eab30820", border: "#eab30840", text: "#eab308" },
  { id: "blue",   bg: "#3b82f620", border: "#3b82f640", text: "#3b82f6" },
  { id: "green",  bg: "#22c55e20", border: "#22c55e40", text: "#22c55e" },
  { id: "red",    bg: "#ef444420", border: "#ef444440", text: "#ef4444" },
  { id: "purple", bg: "#a855f720", border: "#a855f740", text: "#a855f7" },
  { id: "zinc",   bg: "#27272a",   border: "#3f3f46",   text: "#a1a1aa" },
]
const getCouleur = (id: string) => COULEURS.find(c => c.id === id) || COULEURS[0]

export default function NotesModule({ activeSociety, profile }: { activeSociety: any; profile: any }) {
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Note | null>(null)
  const [form, setForm] = useState({ titre: "", contenu: "", couleur: "yellow", tags: [] as string[], pinned: false })
  const [saving, setSaving] = useState(false)

  useEffect(() => { load() }, [profile])

  const load = async () => {
    setLoading(true)
    const { data } = await supabase.from("notes").select("*").eq("user_id", profile.id)
      .order("pinned", { ascending: false }).order("updated_at", { ascending: false })
    setNotes(data || []); setLoading(false)
  }

  const openCreate = () => { setForm({ titre: "", contenu: "", couleur: "yellow", tags: [], pinned: false }); setEditing(null); setShowForm(true) }
  const openEdit = (n: Note) => { setForm({ titre: n.titre, contenu: n.contenu, couleur: n.couleur, tags: n.tags || [], pinned: n.pinned }); setEditing(n); setShowForm(true) }

  const save = async () => {
    if (!form.contenu.trim()) return
    setSaving(true)
    if (editing) {
      await supabase.from("notes").update({ ...form, updated_at: new Date().toISOString() }).eq("id", editing.id)
    } else {
      await supabase.from("notes").insert({ ...form, user_id: profile.id, society_id: activeSociety.id })
    }
    setSaving(false); setShowForm(false); load()
  }

  const remove = async (id: string) => {
    if (!confirm("Supprimer cette note ?")) return
    await supabase.from("notes").delete().eq("id", id); load()
  }

  const togglePin = async (n: Note) => {
    await supabase.from("notes").update({ pinned: !n.pinned }).eq("id", n.id); load()
  }

  const filtered = notes.filter(n => !search || n.titre?.toLowerCase().includes(search.toLowerCase()) || n.contenu.toLowerCase().includes(search.toLowerCase()))
  const pinned = filtered.filter(n => n.pinned)
  const unpinned = filtered.filter(n => !n.pinned)

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#0a0a0a]">
      <div className="px-6 py-4 border-b border-zinc-900 flex items-center justify-between">
        <div><h1 className="text-white font-bold text-xl">📝 Notes</h1><p className="text-zinc-500 text-xs mt-0.5">{notes.length} note{notes.length > 1 ? "s" : ""} personnelles</p></div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 rounded-xl text-black text-sm font-bold bg-yellow-500 hover:bg-yellow-400 transition-colors"><Plus size={14} /> Nouvelle note</button>
      </div>
      <div className="px-6 py-3 border-b border-zinc-900">
        <div className="relative"><Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..." className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600" /></div>
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (<div className="flex items-center justify-center h-40"><div className="w-6 h-6 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" /></div>)
        : filtered.length === 0 ? (<div className="text-center py-20"><p className="text-4xl mb-3">📝</p><p className="text-zinc-400 font-semibold">Aucune note</p><button onClick={openCreate} className="mt-4 px-4 py-2 rounded-xl text-black text-sm font-bold bg-yellow-500">+ Nouvelle note</button></div>)
        : (<>
          {pinned.length > 0 && (<div className="mb-6"><p className="text-zinc-600 text-[10px] uppercase tracking-widest font-bold mb-3 flex items-center gap-1.5"><Pin size={10} /> Épinglées</p><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">{pinned.map(n => <NoteCard key={n.id} note={n} onEdit={openEdit} onDelete={remove} onTogglePin={togglePin} />)}</div></div>)}
          {unpinned.length > 0 && (<div>{pinned.length > 0 && <p className="text-zinc-600 text-[10px] uppercase tracking-widest font-bold mb-3">Autres notes</p>}<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">{unpinned.map(n => <NoteCard key={n.id} note={n} onEdit={openEdit} onDelete={remove} onTogglePin={togglePin} />)}</div></div>)}
        </>)}
      </div>
      {showForm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111111] border border-zinc-800 rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-zinc-800">
              <h2 className="text-white font-bold">{editing ? "Modifier la note" : "Nouvelle note"}</h2>
              <button onClick={() => setShowForm(false)} className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white"><X size={14} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div><label className="block text-zinc-500 text-[11px] uppercase tracking-wider mb-2">Couleur</label><div className="flex gap-2">{COULEURS.map(c => (<button key={c.id} onClick={() => setForm(f => ({ ...f, couleur: c.id }))} className="w-8 h-8 rounded-lg border-2 transition-all" style={{ backgroundColor: c.bg, borderColor: form.couleur === c.id ? c.text : "transparent" }} />))}</div></div>
              <input value={form.titre} onChange={e => setForm(f => ({ ...f, titre: e.target.value }))} placeholder="Titre (optionnel)" className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-500/60" />
              <textarea value={form.contenu} onChange={e => setForm(f => ({ ...f, contenu: e.target.value }))} placeholder="Contenu de la note... *" rows={5} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-500/60 resize-none" />
              <button onClick={() => setForm(f => ({ ...f, pinned: !f.pinned }))} className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border transition-all ${form.pinned ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" : "bg-zinc-800 text-zinc-400 border-zinc-700"}`}><Pin size={13} /> {form.pinned ? "Épinglée" : "Épingler"}</button>
              <button onClick={save} disabled={saving || !form.contenu.trim()} className="w-full py-3 rounded-xl text-black font-bold text-sm bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 transition-colors">{saving ? "Enregistrement..." : editing ? "Mettre à jour" : "Créer la note"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function NoteCard({ note, onEdit, onDelete, onTogglePin }: { note: Note; onEdit: (n: Note) => void; onDelete: (id: string) => void; onTogglePin: (n: Note) => void }) {
  const c = getCouleur(note.couleur)
  return (
    <div className="rounded-2xl p-4 border group hover:opacity-90 transition-all relative" style={{ backgroundColor: c.bg, borderColor: c.border }}>
      {note.pinned && <Pin size={10} className="absolute top-3 right-3" style={{ color: c.text }} />}
      {note.titre && <p className="font-bold text-sm text-white mb-2 pr-4">{note.titre}</p>}
      <p className="text-zinc-300 text-sm whitespace-pre-wrap line-clamp-6">{note.contenu}</p>
      <p className="text-zinc-600 text-[10px] mt-3">{new Date(note.updated_at || note.created_at).toLocaleDateString("fr-FR")}</p>
      <div className="absolute bottom-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => onTogglePin(note)} className="w-6 h-6 rounded-lg bg-zinc-800/80 flex items-center justify-center hover:bg-zinc-700"><Pin size={10} className="text-zinc-400" /></button>
        <button onClick={() => onEdit(note)} className="w-6 h-6 rounded-lg bg-zinc-800/80 flex items-center justify-center hover:bg-zinc-700"><Pencil size={10} className="text-zinc-400" /></button>
        <button onClick={() => onDelete(note.id)} className="w-6 h-6 rounded-lg bg-red-500/20 flex items-center justify-center hover:bg-red-500/40"><Trash2 size={10} className="text-red-400" /></button>
      </div>
    </div>
  )
}