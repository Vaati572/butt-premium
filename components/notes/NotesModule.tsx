"use client"

import { useEffect, useState, useMemo, useRef, useCallback } from "react"
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
  { id: "pink",   label: "Rose",   bg: "bg-pink-500/15",   border: "border-pink-500/30",   text: "text-pink-400",   dot: "bg-pink-400" },
  { id: "zinc",   label: "Gris",   bg: "bg-zinc-800",      border: "border-zinc-700",      text: "text-zinc-400",   dot: "bg-zinc-500" },
]

const TEMPLATES = [
  {
    id: "blank",
    label: "Note vide",
    icon: "📝",
    titre: "",
    contenu: "",
  },
  {
    id: "todo",
    label: "Liste de tâches",
    icon: "✅",
    titre: "À faire",
    contenu: "- [ ] Tâche 1\n- [ ] Tâche 2\n- [ ] Tâche 3",
  },
  {
    id: "meeting",
    label: "Compte-rendu",
    icon: "📋",
    titre: "Réunion — ",
    contenu: "## Participants\n- \n\n## Ordre du jour\n1. \n\n## Décisions\n- \n\n## Actions\n- [ ] ",
  },
  {
    id: "idea",
    label: "Idée / Brainstorm",
    icon: "💡",
    titre: "Idée",
    contenu: "## Concept\n\n\n## Points forts\n- \n\n## Points à creuser\n- \n\n## Prochaine étape\n- [ ] ",
  },
  {
    id: "client",
    label: "Fiche client",
    icon: "👤",
    titre: "Client — ",
    contenu: "## Contact\n- Tél : \n- Email : \n\n## Besoins\n\n\n## Historique\n- \n\n## Suivi\n- [ ] ",
  },
  {
    id: "daily",
    label: "Journal du jour",
    icon: "📅",
    titre: "",
    contenu: `## ${new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}\n\n### Objectifs du jour\n- [ ] \n\n### Notes\n\n\n### Bilan\n`,
  },
]

const ARCHIVED_TAG = "__archived__"
const getCouleur = (id: string) => COULEURS.find(c => c.id === id) || COULEURS[0]

function countWords(text: string) {
  return text.trim() ? text.trim().split(/\s+/).length : 0
}
function countChars(text: string) {
  return text.length
}
function countChecks(text: string) {
  const total = (text.match(/[-*]\s*\[[ xX]?\]/g) || []).length
  const done = (text.match(/[-*]\s*\[x\]/gi) || []).length
  return { total, done }
}

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
  const [showTemplates, setShowTemplates] = useState(false)
  const [editing, setEditing] = useState<Note | null>(null)
  const [focusMode, setFocusMode] = useState(false)
  const [preview, setPreview] = useState(false)

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

  const allTags = useMemo(() => {
    const set = new Set<string>()
    notes.forEach(n => (n.tags || []).forEach(t => {
      if (t !== ARCHIVED_TAG) set.add(t)
    }))
    return Array.from(set).sort()
  }, [notes])

  const filtered = useMemo(() => {
    let list = [...notes]
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

  const openCreate = (template?: typeof TEMPLATES[0]) => {
    setEditing(null)
    setTitre(template?.titre || "")
    setContenu(template?.contenu || "")
    setCouleur("yellow")
    setTags([])
    setPinned(false)
    setTagInput("")
    setPreview(false)
    setFocusMode(false)
    setShowTemplates(false)
    setShowEditor(true)
    setTimeout(() => contentRef.current?.focus(), 120)
  }

  const openEdit = (n: Note) => {
    setEditing(n)
    setTitre(n.titre || "")
    setContenu(n.contenu || "")
    setCouleur(n.couleur || "yellow")
    setTags((n.tags || []).filter(t => t !== ARCHIVED_TAG))
    setPinned(!!n.pinned)
    setTagInput("")
    setPreview(false)
    setFocusMode(false)
    setShowEditor(true)
  }

  // ─── Toolbar helpers ───
  const insertAtCursor = useCallback((before: string, after = "") => {
    const el = contentRef.current
    if (!el) {
      setContenu(prev => prev + before + after)
      return
    }
    const start = el.selectionStart
    const end = el.selectionEnd
    const selected = contenu.slice(start, end)
    const newText = contenu.slice(0, start) + before + selected + after + contenu.slice(end)
    setContenu(newText)
    setTimeout(() => {
      el.focus()
      const pos = start + before.length + selected.length
      el.setSelectionRange(pos, pos)
    }, 10)
  }, [contenu])

  const insertLine = (prefix: string) => {
    const el = contentRef.current
    if (!el) {
      setContenu(prev => prev + (prev.endsWith("\n") || !prev ? "" : "\n") + prefix)
      return
    }
    const start = el.selectionStart
    const lineStart = contenu.lastIndexOf("\n", start - 1) + 1
    const newText = contenu.slice(0, lineStart) + prefix + contenu.slice(lineStart)
    setContenu(newText)
    setTimeout(() => {
      el.focus()
      el.setSelectionRange(lineStart + prefix.length, lineStart + prefix.length)
    }, 10)
  }

  const addTag = () => {
    const t = tagInput.trim().toLowerCase().replace(/\s+/g, "-")
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
    const newTags = isArchived ? current.filter(t => t !== ARCHIVED_TAG) : [...current, ARCHIVED_TAG]
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

  const exportNote = (n: Note) => {
    const text = `# ${n.titre || "Sans titre"}\n\n${n.contenu}\n\n---\nTags: ${(n.tags || []).filter(t => t !== ARCHIVED_TAG).join(", ") || "aucun"}\nModifié: ${new Date(n.updated_at || n.created_at).toLocaleString("fr-FR")}`
    const blob = new Blob([text], { type: "text/markdown" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${(n.titre || "note").replace(/[^a-z0-9]/gi, "_")}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  const copyContent = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
    } catch {}
  }

  const isChecklist = (text: string) =>
    text.split("\n").some(l => /^[-*]\s*\[[ xX]?\]/.test(l.trim()))

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
    supabase.from("notes").update({
      contenu: lines.join("\n"),
      updated_at: new Date().toISOString(),
    }).eq("id", note.id).then(() => load())
  }

  const stats = {
    total: notes.filter(n => !(n.tags || []).includes(ARCHIVED_TAG)).length,
    pinned: notes.filter(n => n.pinned && !(n.tags || []).includes(ARCHIVED_TAG)).length,
    archived: notes.filter(n => (n.tags || []).includes(ARCHIVED_TAG)).length,
  }

  const words = countWords(contenu)
  const chars = countChars(contenu)
  const checks = countChecks(contenu)

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
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowTemplates(true)}
              className="h-9 px-3 rounded-xl text-xs font-medium text-zinc-400 border border-zinc-800 hover:text-white hover:bg-zinc-800 transition"
            >
              Modèles
            </button>
            <button
              onClick={() => openCreate()}
              className="h-9 px-4 rounded-xl text-sm font-semibold text-black"
              style={{ background: ACCENT }}
            >
              + Nouvelle note
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 mt-4">
          <div className="relative flex-1 min-w-[160px] max-w-xs">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">⌕</span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher…"
              className="w-full h-9 bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600"
            />
          </div>

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
                className={`w-5 h-5 rounded-full ${c.dot} transition ${filterColor === c.id ? "ring-2 ring-white ring-offset-1 ring-offset-zinc-900" : "opacity-50 hover:opacity-100"}`}
                title={c.label}
              />
            ))}
          </div>

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
            <option value="title">Titre A-Z</option>
          </select>

          <div className="flex gap-0.5 bg-zinc-900 rounded-lg p-0.5">
            <button onClick={() => setViewMode("grid")} className={`h-7 w-8 rounded-md text-xs ${viewMode === "grid" ? "bg-zinc-700 text-white" : "text-zinc-500"}`}>⊞</button>
            <button onClick={() => setViewMode("list")} className={`h-7 w-8 rounded-md text-xs ${viewMode === "list" ? "bg-zinc-700 text-white" : "text-zinc-500"}`}>≡</button>
          </div>

          <button
            onClick={() => setShowArchived(p => !p)}
            className={`h-8 px-2.5 rounded-lg text-xs transition ${showArchived ? "bg-zinc-700 text-white" : "text-zinc-500 hover:text-zinc-300"}`}
          >
            {showArchived ? "← Actives" : `Archivées (${stats.archived})`}
          </button>
        </div>
      </div>

      {/* Notes list */}
      <div className="flex-1 overflow-y-auto p-5">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: ACCENT }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-4xl mb-3 opacity-20">📝</p>
            <p className="text-sm text-zinc-500 mb-4">
              {showArchived ? "Aucune note archivée" : search || filterColor || filterTag ? "Aucun résultat" : "Aucune note pour le moment"}
            </p>
            {!showArchived && !search && (
              <div className="flex justify-center gap-2">
                <button onClick={() => setShowTemplates(true)} className="h-9 px-4 rounded-xl text-sm text-zinc-400 border border-zinc-700 hover:text-white">
                  Voir les modèles
                </button>
                <button onClick={() => openCreate()} className="h-9 px-4 rounded-xl text-sm font-semibold text-black" style={{ background: ACCENT }}>
                  Créer une note
                </button>
              </div>
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
                onExport={exportNote}
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

      {/* Templates modal */}
      {showTemplates && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-[#18181b] border border-zinc-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
              <h2 className="text-base font-semibold text-white">Choisir un modèle</h2>
              <button onClick={() => setShowTemplates(false)} className="text-zinc-500 hover:text-white">✕</button>
            </div>
            <div className="p-3 grid grid-cols-2 gap-2">
              {TEMPLATES.map(t => (
                <button
                  key={t.id}
                  onClick={() => openCreate(t)}
                  className="flex flex-col items-start gap-1 p-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-600 transition text-left"
                >
                  <span className="text-2xl">{t.icon}</span>
                  <span className="text-sm font-medium text-white">{t.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Editor */}
      {showEditor && (
        <div className={`fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 ${focusMode ? "p-0" : ""}`}>
          <div className={`bg-[#18181b] border border-zinc-700 shadow-2xl flex flex-col overflow-hidden transition-all ${
            focusMode ? "w-full h-full rounded-none border-0" : "w-full max-w-2xl max-h-[92vh] rounded-2xl"
          }`}>
            {/* Editor header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 shrink-0">
              <h2 className="text-sm font-semibold text-white">
                {editing ? "Modifier" : "Nouvelle note"}
              </h2>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setFocusMode(p => !p)}
                  className="h-7 px-2 rounded-md text-[11px] text-zinc-400 hover:text-white hover:bg-zinc-800"
                  title="Mode focus"
                >
                  {focusMode ? "↘" : "⛶"}
                </button>
                <button
                  onClick={() => setPreview(p => !p)}
                  className={`h-7 px-2 rounded-md text-[11px] ${preview ? "text-white bg-zinc-700" : "text-zinc-400 hover:text-white hover:bg-zinc-800"}`}
                >
                  Aperçu
                </button>
                <button onClick={() => setShowEditor(false)} className="h-7 w-7 rounded-md text-zinc-500 hover:text-white hover:bg-zinc-800">✕</button>
              </div>
            </div>

            {/* Writing toolbar */}
            {!preview && (
              <div className="flex flex-wrap items-center gap-1 px-3 py-2 border-b border-zinc-800/80 bg-zinc-900/40 shrink-0">
                <ToolBtn label="G" title="Gras (**texte**)" onClick={() => insertAtCursor("**", "**")} bold />
                <ToolBtn label="I" title="Italique (*texte*)" onClick={() => insertAtCursor("*", "*")} italic />
                <ToolBtn label="H" title="Titre" onClick={() => insertLine("## ")} />
                <span className="w-px h-4 bg-zinc-700 mx-0.5" />
                <ToolBtn label="•" title="Liste" onClick={() => insertLine("- ")} />
                <ToolBtn label="☑" title="Case à cocher" onClick={() => insertLine("- [ ] ")} />
                <ToolBtn label="1." title="Liste numérotée" onClick={() => insertLine("1. ")} />
                <span className="w-px h-4 bg-zinc-700 mx-0.5" />
                <ToolBtn label="“”" title="Citation" onClick={() => insertLine("> ")} />
                <ToolBtn label="—" title="Séparateur" onClick={() => insertAtCursor("\n---\n")} />
                <ToolBtn label="📅" title="Date du jour" onClick={() => insertAtCursor(new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" }))} />
                <ToolBtn label="🕐" title="Heure" onClick={() => insertAtCursor(new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }))} />
                <span className="w-px h-4 bg-zinc-700 mx-0.5" />
                <ToolBtn label="⧉" title="Copier le contenu" onClick={() => copyContent(contenu)} />
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <input
                value={titre}
                onChange={e => setTitre(e.target.value)}
                placeholder="Titre de la note…"
                className="w-full h-10 bg-transparent border-0 text-lg font-semibold text-white placeholder-zinc-600 focus:outline-none"
              />

              {preview ? (
                <div className="prose-note text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed min-h-[200px]">
                  {contenu.split("\n").map((line, i) => {
                    if (line.startsWith("## ")) return <h3 key={i} className="text-base font-bold text-white mt-3 mb-1">{line.slice(3)}</h3>
                    if (line.startsWith("# ")) return <h2 key={i} className="text-lg font-bold text-white mt-3 mb-1">{line.slice(2)}</h2>
                    if (line.startsWith("> ")) return <p key={i} className="border-l-2 border-zinc-600 pl-3 text-zinc-400 italic my-1">{line.slice(2)}</p>
                    if (line.trim() === "---") return <hr key={i} className="border-zinc-700 my-3" />
                    if (/^[-*]\s*\[x\]/i.test(line.trim())) {
                      return <p key={i} className="flex gap-2 items-start"><span className="text-emerald-400">✓</span><span className="line-through text-zinc-500">{line.replace(/^[-*]\s*\[x\]\s*/i, "")}</span></p>
                    }
                    if (/^[-*]\s*\[\s*\]/.test(line.trim())) {
                      return <p key={i} className="flex gap-2 items-start"><span className="text-zinc-600">○</span><span>{line.replace(/^[-*]\s*\[\s*\]\s*/, "")}</span></p>
                    }
                    if (/^[-*]\s+/.test(line.trim())) {
                      return <p key={i} className="flex gap-2 items-start"><span className="text-zinc-500">•</span><span>{line.replace(/^[-*]\s+/, "")}</span></p>
                    }
                    if (/^\d+\.\s+/.test(line.trim())) {
                      return <p key={i} className="ml-1">{line}</p>
                    }
                    return <p key={i} className={line ? "" : "h-4"}>{line || " "}</p>
                  })}
                </div>
              ) : (
                <textarea
                  ref={contentRef}
                  value={contenu}
                  onChange={e => setContenu(e.target.value)}
                  placeholder={"Écris ici…\n\nRaccourcis :\n**gras**  *italique*\n- liste\n- [ ] case à cocher\n## titre"}
                  className="w-full min-h-[220px] bg-transparent border-0 text-sm text-white placeholder-zinc-600 focus:outline-none resize-none leading-relaxed"
                  style={{ minHeight: focusMode ? "60vh" : "220px" }}
                />
              )}

              {/* Meta */}
              {!focusMode && (
                <>
                  <div>
                    <p className="text-[11px] text-zinc-500 mb-1.5">Couleur</p>
                    <div className="flex gap-1.5">
                      {COULEURS.map(c => (
                        <button
                          key={c.id}
                          onClick={() => setCouleur(c.id)}
                          className={`w-6 h-6 rounded-full ${c.dot} transition ${couleur === c.id ? "ring-2 ring-white ring-offset-2 ring-offset-zinc-900" : "opacity-40 hover:opacity-100"}`}
                        />
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-[11px] text-zinc-500 mb-1.5">Tags</p>
                    <div className="flex flex-wrap gap-1.5 mb-1.5">
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
                        placeholder="Ajouter un tag + Entrée"
                        className="flex-1 h-8 bg-zinc-900 border border-zinc-700 rounded-lg px-3 text-xs text-white placeholder-zinc-600 focus:outline-none"
                      />
                      <button onClick={addTag} className="h-8 px-3 rounded-lg text-xs bg-zinc-800 text-zinc-300 hover:text-white">+</button>
                    </div>
                  </div>

                  <button
                    onClick={() => setPinned(p => !p)}
                    className={`flex items-center gap-2 h-8 px-3 rounded-lg text-xs border transition ${
                      pinned ? "bg-yellow-500/15 text-yellow-400 border-yellow-500/30" : "bg-zinc-900 text-zinc-400 border-zinc-700"
                    }`}
                  >
                    📌 {pinned ? "Épinglée" : "Épingler"}
                  </button>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-3 border-t border-zinc-800 flex items-center justify-between gap-3 shrink-0">
              <div className="text-[11px] text-zinc-600 flex gap-3">
                <span>{words} mot{words > 1 ? "s" : ""}</span>
                <span>{chars} car.</span>
                {checks.total > 0 && <span>{checks.done}/{checks.total} tâches</span>}
              </div>
              <div className="flex gap-2">
                <button onClick={() => setShowEditor(false)} className="h-9 px-4 rounded-xl text-sm text-zinc-400 bg-zinc-800 hover:bg-zinc-700">
                  Annuler
                </button>
                <button
                  onClick={save}
                  disabled={saving || (!contenu.trim() && !titre.trim())}
                  className="h-9 px-5 rounded-xl text-sm font-bold text-black disabled:opacity-40"
                  style={{ background: ACCENT }}
                >
                  {saving ? "…" : editing ? "Enregistrer" : "Créer"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ToolBtn({ label, title, onClick, bold, italic }: {
  label: string; title: string; onClick: () => void; bold?: boolean; italic?: boolean
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`h-7 min-w-[28px] px-1.5 rounded-md text-xs text-zinc-400 hover:text-white hover:bg-zinc-800 transition ${bold ? "font-bold" : ""} ${italic ? "italic" : ""}`}
    >
      {label}
    </button>
  )
}

function NoteCard({
  note, onEdit, onDelete, onTogglePin, onArchive, onDuplicate, onExport, onToggleCheck, isChecklist
}: {
  note: Note
  onEdit: (n: Note) => void
  onDelete: (id: string) => void
  onTogglePin: (n: Note) => void
  onArchive: (n: Note) => void
  onDuplicate: (n: Note) => void
  onExport: (n: Note) => void
  onToggleCheck: (n: Note, lineIndex: number) => void
  isChecklist: (text: string) => boolean
}) {
  const c = getCouleur(note.couleur)
  const lines = note.contenu.split("\n")
  const hasCheck = isChecklist(note.contenu)
  const checks = countChecks(note.contenu)

  return (
    <div className={`group relative rounded-2xl border p-4 transition hover:scale-[1.01] ${c.bg} ${c.border}`}>
      {note.pinned && <span className="absolute top-3 right-3 text-xs">📌</span>}

      <p className="text-sm font-semibold text-white mb-2 pr-6 line-clamp-2">
        {note.titre || "Sans titre"}
      </p>

      <div className="text-xs text-zinc-400 leading-relaxed mb-3 max-h-28 overflow-hidden">
        {hasCheck ? (
          <div className="space-y-1">
            {lines.slice(0, 5).map((line, i) => {
              const checked = /\[x\]/i.test(line)
              const isCheckLine = /^[-*]\s*\[/.test(line.trim())
              if (!isCheckLine) {
                if (/^[-*]\s+/.test(line.trim())) {
                  return <p key={i} className="truncate">• {line.replace(/^[-*]\s+/, "")}</p>
                }
                return line ? <p key={i} className="truncate">{line}</p> : null
              }
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
                    {line.replace(/^[-*]\s*\[[xX ]?\]\s*/, "")}
                  </span>
                </button>
              )
            })}
            {checks.total > 0 && (
              <p className="text-[10px] text-zinc-600 pt-1">{checks.done}/{checks.total} terminées</p>
            )}
          </div>
        ) : (
          <p className="whitespace-pre-wrap line-clamp-4">{note.contenu}</p>
        )}
      </div>

      {(note.tags || []).filter(t => t !== ARCHIVED_TAG).length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {(note.tags || []).filter(t => t !== ARCHIVED_TAG).slice(0, 3).map(t => (
            <span key={t} className="text-[10px] px-1.5 py-0.5 rounded-full bg-black/20 text-zinc-400">#{t}</span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-[10px] text-zinc-600">
          {new Date(note.updated_at || note.created_at).toLocaleDateString("fr-FR", {
            day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"
          })}
        </p>
        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition relative z-10">
          <IconBtn title="Épingler" onClick={() => onTogglePin(note)}>📌</IconBtn>
          <IconBtn title="Modifier" onClick={() => onEdit(note)}>✎</IconBtn>
          <IconBtn title="Dupliquer" onClick={() => onDuplicate(note)}>⧉</IconBtn>
          <IconBtn title="Exporter .md" onClick={() => onExport(note)}>↓</IconBtn>
          <IconBtn title="Archiver" onClick={() => onArchive(note)}>📦</IconBtn>
          <IconBtn title="Supprimer" onClick={() => onDelete(note.id)} danger>✕</IconBtn>
        </div>
      </div>

      <button onClick={() => onEdit(note)} className="absolute inset-0 z-0" aria-label="Ouvrir" />
    </div>
  )
}

function IconBtn({ children, onClick, title, danger }: {
  children: React.ReactNode; onClick: () => void; title: string; danger?: boolean
}) {
  return (
    <button
      title={title}
      onClick={e => { e.stopPropagation(); onClick() }}
      className={`w-6 h-6 rounded-md flex items-center justify-center text-[11px] ${
        danger ? "hover:bg-rose-500/20 text-rose-400" : "hover:bg-black/20 text-zinc-400"
      }`}
    >
      {children}
    </button>
  )
}