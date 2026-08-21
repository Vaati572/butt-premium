"use client"

import { useEffect, useState, useMemo, useRef } from "react"
import { supabase } from "@/lib/supabase"
import { useUserSettings } from "@/lib/UserSettingsContext"

interface Note {
  id: string
  titre: string
  contenu: string
  couleur: string
  pinned: boolean
  tags: string[]
  user_id: string
  created_at: string
  updated_at: string
  society_id?: string
}

interface Props {
  activeSociety: any
  profile: any
}

const COULEURS = [
  { id: "yellow", label: "Jaune",  bg: "bg-yellow-500/15", border: "border-yellow-500/30", text: "text-yellow-400", dot: "bg-yellow-400" },
  { id: "blue",   label: "Bleu",   bg: "bg-blue-500/15",   border: "border-blue-500/30",   text: "text-blue-400",   dot: "bg-blue-400" },
  { id: "green",  label: "Vert",   bg: "bg-emerald-500/15",border: "border-emerald-500/30",text: "text-emerald-400",dot: "bg-emerald-400" },
  { id: "red",    label: "Rouge",  bg: "bg-rose-500/15",   border: "border-rose-500/30",   text: "text-rose-400",   dot: "bg-rose-400" },
  { id: "purple", label: "Violet", bg: "bg-violet-500/15", border: "border-violet-500/30", text: "text-violet-400", dot: "bg-violet-400" },
  { id: "orange", label: "Orange", bg: "bg-orange-500/15", border: "border-orange-500/30", text: "text-orange-400", dot: "bg-orange-400" },
  { id: "zinc",   label: "Gris",   bg: "bg-zinc-800",      border: "border-zinc-700",      text: "text-zinc-400",   dot: "bg-zinc-500" },
]

const getCouleur = (id: string) => COULEURS.find(c => c.id === id) || COULEURS[0]

const ARCHIVED_TAG = "__archived__"

export default function NotesModule({ activeSociety, profile }: Props) {
  const { settings } = useUserSettings()
  const ACCENT = settings.accent_color || "#eab308"

  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filterColor, setFilterColor] = useState<string | null>(null)
  const [filterTag, setFilterTag] = useState<string | null>(null)
  const [showArchived, setShowArchived] = useState(false)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [sortBy, setSortBy] = useState<"updated" | "created" | "title">("updated")

  const [showEditor, setShowEditor] = useState(false)
  const [editing, setEditing] = useState<Note | null>(null)

  // Form
  const [titre, setTitre] = useState("")
  const [contenu, setContenu] = useState("")
  const [couleur, setCouleur] = useState("yellow")
  const [tags, setTags] = useState<string[]>([])
  const [pinned, setPinned] = useState(false)
  const [tagInput, setTagInput] = useState("")
  const [saving, setSaving] = useState(false)

  const contentRef = useRef<HTMLTextAreaElement>(null)

  const load = async () => {
    if (!activeSociety?.id) return
    setLoading(true)
    const { data } = await supabase
      .from("notes")
      .select("*")
      .eq("society_id", activeSociety.id)
      .order("pinned", { ascending: false })
      .order("updated_at", { ascending: false })
    setNotes(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [activeSociety?.id])

  // All unique tags (excluding system)
  const allTags = useMemo(() => {
    const set = new Set<string>()
    notes.forEach(n => (n.tags || []).forEach(t => {
      if (t !== ARCHIVED_TAG) set.add(t)
    }))
    return Array.from(set).sort()
  }, [notes])

  const filtered = useMemo(() => {
    let list = [...notes]

    // Archive filter
    list = list.filter(n => {
      const isArchived = (n.tags || []).includes(ARCHIVED_TAG)
      return showArchived ? isArchived : !isArchived
    })

    if (search) {
      const q = search.toLowerCase()
      list = list.filter(n =>
        n.titre?.toLowerCase().includes(q) ||
        n.contenu?.toLowerCase().includes(q) ||
        (n.tags || []).some(t => t.toLowerCase().includes(q))
      )
    }

    if (filterColor) list = list.filter(n => n.couleur === filterColor)
    if (filterTag) list = list.filter(n => (n.tags || []).includes(filterTag))

    list.sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
      if (sortBy === "title") return (a.titre || "").localeCompare(b.titre || "")
      if (sortBy === "created") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      return new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime()
    })

    return list
  }, [notes, search, filterColor, filterTag, showArchived, sortBy])

  const openCreate = () => {
    setEditing(null)
    setTitre("")
    setContenu("")
    setCouleur("yellow")
    setTags([])
    setPinned(false)
    setTagInput("")
    setShowEditor(true)
    setTimeout(() => contentRef.current?.focus(), 100)
  }

  const openEdit = (n: Note) => {
    setEditing(n)
    setTitre(n.titre || "")
    setContenu(n.contenu || "")
    setCouleur(n.couleur || "yellow")
    setTags((n.tags || []).filter(t => t !== ARCHIVED_TAG))
    setPinned(!!n.pinned)
    setTagInput("")
    setShowEditor(true)
  }

  const addTag = () => {
    const t = tagInput.trim().toLowerCase()
    if (!t || tags.includes(t) || t === ARCHIVED_TAG) return
    setTags(prev => [...prev, t])
    setTagInput("")
  }

  const removeTag = (t: string) => setTags(prev => prev.filter(x => x !== t))

  const save = async () => {
    if (!contenu.trim() && !titre.trim()) return
    setSaving(true)

    const payload = {
      titre: titre.trim() || "Sans titre",
      contenu: contenu.trim(),
      couleur,
      tags,
      pinned,
      updated_at: new Date().toISOString(),
    }

    if (editing) {
      await supabase.from("notes").update(payload).eq("id", editing.id)
    } else {
      await supabase.from("notes").insert({
        ...payload,
        society_id: activeSociety.id,
        user_id: profile.id,
      })
    }

    setSaving(false)
    setShowEditor(false)
    load()
  }

  const togglePin = async (n: Note) => {
    await supabase.from("notes").update({ pinned: !n.pinned, updated_at: new Date().toISOString() }).eq("id", n.id)
    load()
  }

  const toggleArchive = async (n: Note) => {
    const current = n.tags || []
    const isArchived = current.includes(ARCHIVED_TAG)
    const newTags = isArchived
      ? current.filter(t => t !== ARCHIVED_TAG)
      : [...current, ARCHIVED_TAG]
    await supabase.from("notes").update({ tags: newTags, updated_at: new Date().toISOString() }).eq("id", n.id)
    load()
  }

  const duplicate = async (n: Note) => {
    await supabase.from("notes").insert({
      titre: (n.titre || "Sans titre") + " (copie)",
      contenu: n.contenu,
      couleur: n.couleur,
      tags: (n.tags || []).filter(t => t !== ARCHIVED_TAG),
      pinned: false,
      society_id: activeSociety.id,
      user_id: profile.id,
    })
    load()
  }

  const remove = async (id: string) => {
    if (!confirm("Supprimer cette note définitivement ?")) return
    await supabase.from("notes").delete().eq("id", id)
    load()
  }

  // Checklist helpers
  const isChecklist = (text: string) =>
    text.split("\n").some(l => /^[-*]\s*\[[ xX]?\]/.test(l.trim()) || /^[-*]\s+/.test(l.trim()))

  const toggleCheckLine = (note: Note, lineIndex: number) => {
    const lines = note.contenu.split("\n")
    const line = lines[lineIndex]
    if (/^[-*]\s*\[x\]/i.test(line.trim())) {
      lines[lineIndex] = line.replace(/\[x\]/i, "[ ]")
    } else if (/^[-*]\s*\[\s*\]/.test(line.trim())) {
      lines[lineIndex] = line.replace(/\[\s*\]/, "[x]")
    } else if (/^[-*]\s+/.test(line.trim())) {
      lines[lineIndex] = line.replace(/^([-*])\s+/, "$1 [x] ")
    }
    const newContent = lines.join("\n")
    supabase.from("notes").update({ contenu: newContent, updated_at: new Date().toISOString() }).eq("id", note.id)
      .then(() => load())
  }

  const stats = {
    total: notes.filter(n => !(n.tags || []).includes(ARCHIVED_TAG)).length,
    pinned: notes.filter(n => n.pinned && !(n.tags || []).includes(ARCHIVED_TAG)).length,
    archived: notes.filter(n => (n.tags || []).includes(ARCHIVED_TAG)).length,
  }

  return (
    <div className="h-full flex flex-col bg-[#0a0a0a] overflow-hidden">

      {/* Header */}
      <div className="shrink-0 border-b border-zinc-800/70 px-5 py-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl font-bold text-white">Notes</h1>
            <p className="text-xs text-zinc-500 mt-0.5">
              {stats.total} note{stats.total > 1 ? "s" : ""}
              {stats.pinned > 0 && ` · ${stats.pinned} épinglée${stats.pinned > 1 ? "s" : ""}`}
              {stats.archived > 0 && ` · ${stats.archived} archivée${stats.archived > 1 ? "s" : ""}`}
            </p>
          </div>
          <button
            onClick={openCreate}
            className="h-9 px-4 rounded-xl text-sm font-semibold text-black flex items-center gap-1.5"
            style={{ background: ACCENT }}
          >
            + Nouvelle note
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2 mt-4">
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">⌕</span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher…"
              className="w-full h-9 bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600"
            />
          </div>

          {/* Color filters */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setFilterColor(null)}
              className={`h-7 px-2 rounded-md text-[11px] ${!filterColor ? "bg-zinc-700 text-white" : "text-zinc-500 hover:text-zinc-300"}`}
            >
              Toutes
            </button>
            {COULEURS.map(c => (
              <button
                key={c.id}
                onClick={() => setFilterColor(filterColor === c.id ? null : c.id)}
                className={`w-6 h-6 rounded-full ${c.dot} transition ${filterColor === c.id ? "ring-2 ring-white ring-offset-1 ring-offset-zinc-900" : "opacity-60 hover:opacity-100"}`}
                title={c.label}
              />
            ))}
          </div>

          {/* Tags filter */}
          {allTags.length > 0 && (
            <select
              value={filterTag || ""}
              onChange={e => setFilterTag(e.target.value || null)}
              className="h-8 bg-zinc-900 border border-zinc-800 rounded-lg px-2 text-xs text-zinc-300 focus:outline-none"
            >
              <option value="">Tous les tags</option>
              {allTags.map(t => <option key={t} value={t}>#{t}</option>)}
            </select>
          )}

          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            className="h-8 bg-zinc-900 border border-zinc-800 rounded-lg px-2 text-xs text-zinc-300 focus:outline-none"
          >
            <option value="updated">Récentes</option>
            <option value="created">Création</option>
            <option value="title">Titre</option>
          </select>

          <div className="flex gap-0.5 bg-zinc-900 rounded-lg p-0.5">
            <button
              onClick={() => setViewMode("grid")}
              className={`h-7 w-8 rounded-md text-xs ${viewMode === "grid" ? "bg-zinc-700 text-white" : "text-zinc-500"}`}
            >
              ⊞
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`h-7 w-8 rounded-md text-xs ${viewMode === "list" ? "bg-zinc-700 text-white" : "text-zinc-500"}`}
            >
              ≡
            </button>
          </div>

          <button
            onClick={() => setShowArchived(p => !p)}
            className={`h-8 px-2.5 rounded-lg text-xs transition ${
              showArchived ? "bg-zinc-700 text-white" : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {showArchived ? "← Actives" : `Archivées (${stats.archived})`}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: ACCENT }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-4xl mb-3 opacity-20">📝</p>
            <p className="text-sm text-zinc-500">
              {showArchived ? "Aucune note archivée" : search || filterColor || filterTag ? "Aucun résultat" : "Aucune note"}
            </p>
            {!showArchived && !search && (
              <button onClick={openCreate} className="mt-4 text-sm font-medium" style={{ color: ACCENT }}>
                Créer ta première note
              </button>
            )}
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {filtered.map(note => (
              <NoteCard
                key={note.id}
                note={note}
                onEdit={openEdit}
                onDelete={remove}
                onTogglePin={togglePin}
                onArchive={toggleArchive}
                onDuplicate={duplicate}
                onToggleCheck={toggleCheckLine}
                isChecklist={isChecklist}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-1.5 max-w-3xl mx-auto">
            {filtered.map(note => {
              const c = getCouleur(note.couleur)
              return (
                <div
                  key={note.id}
                  onClick={() => openEdit(note)}
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer hover:bg-zinc-900/80 transition ${c.border} ${c.bg}`}
                >
                  <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${c.dot}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {note.pinned && <span className="text-[10px]">📌</span>}
                      <p className="text-sm font-medium text-white truncate">{note.titre || "Sans titre"}</p>
                    </div>
                    <p className="text-xs text-zinc-500 line-clamp-1 mt-0.5">{note.contenu}</p>
                  </div>
                  <p className="text-[10px] text-zinc-600 shrink-0">
                    {new Date(note.updated_at || note.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                  </p>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Editor Modal */}
      {showEditor && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-[#18181b] border border-zinc-700 rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
              <h2 className="text-base font-semibold text-white">
                {editing ? "Modifier la note" : "Nouvelle note"}
              </h2>
              <button onClick={() => setShowEditor(false)} className="text-zinc-500 hover:text-white">✕</button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <input
                value={titre}
                onChange={e => setTitre(e.target.value)}
                placeholder="Titre (optionnel)"
                className="w-full h-10 bg-zinc-900 border border-zinc-700 rounded-xl px-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
              />

              <textarea
                ref={contentRef}
                value={contenu}
                onChange={e => setContenu(e.target.value)}
                placeholder="Écris ta note…&#10;&#10;Astuce : utilise - [ ] pour des cases à cocher"
                rows={10}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 resize-none leading-relaxed"
              />

              {/* Couleurs */}
              <div>
                <p className="text-[11px] text-zinc-500 mb-2">Couleur</p>
                <div className="flex gap-2">
                  {COULEURS.map(c => (
                    <button
                      key={c.id}
                      onClick={() => setCouleur(c.id)}
                      className={`w-7 h-7 rounded-full ${c.dot} transition ${
                        couleur === c.id ? "ring-2 ring-white ring-offset-2 ring-offset-zinc-900" : "opacity-50 hover:opacity-100"
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Tags */}
              <div>
                <p className="text-[11px] text-zinc-500 mb-2">Tags</p>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {tags.map(t => (
                    <span key={t} className="inline-flex items-center gap-1 h-6 px-2 rounded-full bg-zinc-800 text-xs text-zinc-300">
                      #{t}
                      <button onClick={() => removeTag(t)} className="text-zinc-500 hover:text-white">×</button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    value={tagInput}
                    onChange={e => setTagInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addTag())}
                    placeholder="Ajouter un tag…"
                    className="flex-1 h-8 bg-zinc-900 border border-zinc-700 rounded-lg px-3 text-xs text-white placeholder-zinc-600 focus:outline-none"
                  />
                  <button onClick={addTag} className="h-8 px-3 rounded-lg text-xs bg-zinc-800 text-zinc-300 hover:text-white">
                    +
                  </button>
                </div>
              </div>

              {/* Pin */}
              <button
                onClick={() => setPinned(p => !p)}
                className={`flex items-center gap-2 h-9 px-3 rounded-xl text-sm border transition ${
                  pinned
                    ? "bg-yellow-500/15 text-yellow-400 border-yellow-500/30"
                    : "bg-zinc-900 text-zinc-400 border-zinc-700 hover:border-zinc-500"
                }`}
              >
                📌 {pinned ? "Épinglée" : "Épingler"}
              </button>
            </div>

            <div className="px-5 py-4 border-t border-zinc-800 flex gap-2">
              <button
                onClick={() => setShowEditor(false)}
                className="flex-1 h-10 rounded-xl text-sm text-zinc-400 bg-zinc-800 hover:bg-zinc-700"
              >
                Annuler
              </button>
              <button
                onClick={save}
                disabled={saving || (!contenu.trim() && !titre.trim())}
                className="flex-1 h-10 rounded-xl text-sm font-bold text-black disabled:opacity-40"
                style={{ background: ACCENT }}
              >
                {saving ? "…" : editing ? "Enregistrer" : "Créer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── Note Card ─── */
function NoteCard({
  note, onEdit, onDelete, onTogglePin, onArchive, onDuplicate, onToggleCheck, isChecklist
}: {
  note: Note
  onEdit: (n: Note) => void
  onDelete: (id: string) => void
  onTogglePin: (n: Note) => void
  onArchive: (n: Note) => void
  onDuplicate: (n: Note) => void
  onToggleCheck: (n: Note, lineIndex: number) => void
  isChecklist: (text: string) => boolean
}) {
  const c = getCouleur(note.couleur)
  const lines = note.contenu.split("\n")
  const hasCheck = isChecklist(note.contenu)

  return (
    <div
      className={`group relative rounded-2xl border p-4 transition hover:scale-[1.01] ${c.bg} ${c.border}`}
    >
      {/* Pin indicator */}
      {note.pinned && (
        <span className="absolute top-3 right-3 text-xs">📌</span>
      )}

      {/* Title */}
      <p className="text-sm font-semibold text-white mb-2 pr-6 line-clamp-2">
        {note.titre || "Sans titre"}
      </p>

      {/* Content */}
      <div className="text-xs text-zinc-400 leading-relaxed mb-3 max-h-32 overflow-hidden">
        {hasCheck ? (
          <div className="space-y-1">
            {lines.slice(0, 6).map((line, i) => {
              const checked = /\[x\]/i.test(line)
              const isCheckLine = /^[-*]\s*\[/.test(line.trim()) || /^[-*]\s+/.test(line.trim())
              if (!isCheckLine) return <p key={i} className="truncate">{line}</p>
              return (
                <button
                  key={i}
                  onClick={e => { e.stopPropagation(); onToggleCheck(note, i) }}
                  className="flex items-start gap-2 w-full text-left hover:opacity-80"
                >
                  <span className={`mt-0.5 w-3.5 h-3.5 rounded border flex items-center justify-center text-[9px] shrink-0 ${
                    checked ? "bg-emerald-500 border-emerald-500 text-black" : "border-zinc-600"
                  }`}>
                    {checked ? "✓" : ""}
                  </span>
                  <span className={checked ? "line-through text-zinc-600" : ""}>
                    {line.replace(/^[-*]\s*\[[xX ]?\]\s*/, "").replace(/^[-*]\s+/, "")}
                  </span>
                </button>
              )
            })}
          </div>
        ) : (
          <p className="whitespace-pre-wrap line-clamp-5">{note.contenu}</p>
        )}
      </div>

      {/* Tags */}
      {(note.tags || []).filter(t => t !== ARCHIVED_TAG).length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {(note.tags || []).filter(t => t !== ARCHIVED_TAG).slice(0, 4).map(t => (
            <span key={t} className="text-[10px] px-1.5 py-0.5 rounded-full bg-black/20 text-zinc-400">
              #{t}
            </span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between">
        <p className="text-[10px] text-zinc-600">
          {new Date(note.updated_at || note.created_at).toLocaleDateString("fr-FR", {
            day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"
          })}
        </p>

        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition">
          <button onClick={e => { e.stopPropagation(); onTogglePin(note) }} className="w-6 h-6 rounded-md hover:bg-black/20 flex items-center justify-center text-[11px]" title="Épingler">📌</button>
          <button onClick={e => { e.stopPropagation(); onEdit(note) }} className="w-6 h-6 rounded-md hover:bg-black/20 flex items-center justify-center text-[11px]" title="Modifier">✎</button>
          <button onClick={e => { e.stopPropagation(); onDuplicate(note) }} className="w-6 h-6 rounded-md hover:bg-black/20 flex items-center justify-center text-[11px]" title="Dupliquer">⧉</button>
          <button onClick={e => { e.stopPropagation(); onArchive(note) }} className="w-6 h-6 rounded-md hover:bg-black/20 flex items-center justify-center text-[11px]" title="Archiver">📦</button>
          <button onClick={e => { e.stopPropagation(); onDelete(note.id) }} className="w-6 h-6 rounded-md hover:bg-rose-500/20 flex items-center justify-center text-[11px] text-rose-400" title="Supprimer">✕</button>
        </div>
      </div>

      {/* Click to edit */}
      <button onClick={() => onEdit(note)} className="absolute inset-0 z-0" aria-label="Éditer" />
      <div className="relative z-10 pointer-events-none group-hover:pointer-events-auto">
        {/* actions already have stopPropagation */}
      </div>
    </div>
  )
}