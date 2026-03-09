"use client"
import { useEffect, useState, useRef } from "react"
import { supabase } from "@/lib/supabase"
import {
  Plus, X, Search, Trash2, Download, Eye, Upload,
  FileText, File, Image, FileSpreadsheet, Folder,
  FolderPlus, ChevronRight, Home, ArrowLeft
} from "lucide-react"

interface Doc {
  id: string; nom: string; description: string; type: string
  url: string; taille: number; categorie: string
  user_id: string; user_nom: string; created_at: string
  folder_id: string | null
}

interface DocFolder {
  id: string; nom: string; couleur: string
  parent_id: string | null; created_at: string
  _count?: number
}

const CATEGORIES = ["Contrats", "Factures", "Devis", "RH", "Commercial", "Technique", "Autre"]
const FOLDER_COLORS = ["#eab308","#f97316","#22c55e","#3b82f6","#a855f7","#ec4899","#06b6d4","#ef4444"]

const getFileIcon = (type: string) => {
  if (type?.includes("image"))  return { icon: Image,           color: "#a855f7" }
  if (type?.includes("pdf"))    return { icon: FileText,        color: "#ef4444" }
  if (type?.includes("sheet") || type?.includes("excel") || type?.includes("csv"))
                                 return { icon: FileSpreadsheet, color: "#22c55e" }
  return { icon: File, color: "#3b82f6" }
}

const formatSize = (bytes: number) => {
  if (!bytes) return "—"
  if (bytes < 1024) return bytes + " B"
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
  return (bytes / (1024 * 1024)).toFixed(1) + " MB"
}

export default function DocumentsModule({ activeSociety, profile }: { activeSociety: any; profile: any }) {
  const [docs, setDocs]           = useState<Doc[]>([])
  const [folders, setFolders]     = useState<DocFolder[]>([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState("")
  const [filterCat, setFilterCat] = useState("tous")

  // Navigation
  const [currentFolder, setCurrentFolder] = useState<DocFolder | null>(null)
  const [breadcrumb, setBreadcrumb]        = useState<DocFolder[]>([])

  // Modals
  const [showUpload, setShowUpload]       = useState(false)
  const [showNewFolder, setShowNewFolder] = useState(false)
  const [uploading, setUploading]         = useState(false)

  // Upload form
  const [form, setForm]               = useState({ nom: "", description: "", categorie: "Autre" })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  // New folder form
  const [folderForm, setFolderForm] = useState({ nom: "", couleur: "#eab308" })

  useEffect(() => { loadAll() }, [activeSociety])

  const loadAll = async () => {
    setLoading(true)
    const [{ data: docsData }, { data: foldersData }] = await Promise.all([
      supabase.from("documents").select("*").eq("society_id", activeSociety.id).order("created_at", { ascending: false }),
      supabase.from("document_folders").select("*").eq("society_id", activeSociety.id).order("nom"),
    ])
    setDocs(docsData || [])
    setFolders(foldersData || [])
    setLoading(false)
  }

  // Navigate into a folder
  const openFolder = (folder: DocFolder) => {
    setCurrentFolder(folder)
    setBreadcrumb(prev => [...prev, folder])
    setSearch("")
  }

  // Navigate to breadcrumb index
  const goToBreadcrumb = (idx: number) => {
    if (idx === -1) { setCurrentFolder(null); setBreadcrumb([]); return }
    const target = breadcrumb[idx]
    setCurrentFolder(target)
    setBreadcrumb(prev => prev.slice(0, idx + 1))
  }

  // Current folder's sub-folders
  const currentSubFolders = folders.filter(f => f.parent_id === (currentFolder?.id ?? null))

  // Current folder's docs
  const currentDocs = docs.filter(d => {
    const inFolder = d.folder_id === (currentFolder?.id ?? null)
    const matchSearch = !search || d.nom?.toLowerCase().includes(search.toLowerCase())
    const matchCat = filterCat === "tous" || d.categorie === filterCat
    return inFolder && matchSearch && matchCat
  })

  // Create folder
  const createFolder = async () => {
    if (!folderForm.nom.trim()) return
    await supabase.from("document_folders").insert({
      nom: folderForm.nom.trim(),
      couleur: folderForm.couleur,
      society_id: activeSociety.id,
      parent_id: currentFolder?.id ?? null,
    })
    setFolderForm({ nom: "", couleur: "#eab308" })
    setShowNewFolder(false)
    loadAll()
  }

  const deleteFolder = async (folder: DocFolder) => {
    const hasContent = docs.some(d => d.folder_id === folder.id) || folders.some(f => f.parent_id === folder.id)
    if (hasContent) {
      if (!confirm(`Le dossier "${folder.nom}" contient des fichiers ou sous-dossiers. Supprimer quand même ?`)) return
    } else {
      if (!confirm(`Supprimer le dossier "${folder.nom}" ?`)) return
    }
    await supabase.from("documents").update({ folder_id: null }).eq("folder_id", folder.id)
    await supabase.from("document_folders").delete().eq("id", folder.id)
    loadAll()
  }

  // Upload file
  const handleFileSelect = (file: File) => {
    setSelectedFile(file)
    if (!form.nom) setForm(f => ({ ...f, nom: file.name.replace(/\.[^.]+$/, "") }))
  }

  const upload = async () => {
    if (!selectedFile || !form.nom.trim()) return
    setUploading(true)
    const path = `documents/${activeSociety.id}/${Date.now()}_${selectedFile.name}`
    const { error: uploadError } = await supabase.storage.from("documents").upload(path, selectedFile, { upsert: true })
    let url = ""
    if (!uploadError) {
      const { data: urlData } = supabase.storage.from("documents").getPublicUrl(path)
      url = urlData.publicUrl
    }
    const { error: dbError } = await supabase.from("documents").insert({
      nom: form.nom, description: form.description, categorie: form.categorie,
      url, type: selectedFile.type, taille: selectedFile.size,
      society_id: activeSociety.id, user_id: profile.id, user_nom: profile.nom || "",
      folder_id: currentFolder?.id ?? null,
    })
    setUploading(false)
    if (dbError) { alert("Erreur: " + dbError.message); return }
    setShowUpload(false); setSelectedFile(null)
    setForm({ nom: "", description: "", categorie: "Autre" }); loadAll()
  }

  const removeDoc = async (doc: Doc) => {
    if (!confirm("Supprimer ce document ?")) return
    await supabase.from("documents").delete().eq("id", doc.id)
    loadAll()
  }

  const totalCount = currentSubFolders.length + currentDocs.length

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#0a0a0a]">

      {/* ── HEADER ── */}
      <div className="px-6 py-4 border-b border-zinc-900 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          {/* Back button */}
          {currentFolder && (
            <button onClick={() => goToBreadcrumb(breadcrumb.length - 2)}
              className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center transition-colors shrink-0">
              <ArrowLeft size={14} className="text-zinc-400" />
            </button>
          )}
          <div>
            <h1 className="text-white font-bold text-xl">📁 Documents</h1>
            {/* Breadcrumb */}
            <div className="flex items-center gap-1 mt-0.5 flex-wrap">
              <button onClick={() => goToBreadcrumb(-1)}
                className="flex items-center gap-1 text-zinc-500 hover:text-zinc-300 text-xs transition-colors">
                <Home size={10} /> Racine
              </button>
              {breadcrumb.map((f, i) => (
                <span key={f.id} className="flex items-center gap-1">
                  <ChevronRight size={10} className="text-zinc-700" />
                  <button onClick={() => goToBreadcrumb(i)}
                    className={`text-xs transition-colors ${i === breadcrumb.length - 1 ? "text-white font-semibold" : "text-zinc-500 hover:text-zinc-300"}`}>
                    {f.nom}
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button onClick={() => setShowNewFolder(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-zinc-300 text-sm font-semibold bg-zinc-800 hover:bg-zinc-700 transition-colors">
            <FolderPlus size={14} /> Dossier
          </button>
          <button onClick={() => setShowUpload(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-black text-sm font-bold bg-yellow-500 hover:bg-yellow-400 transition-colors">
            <Upload size={14} /> Ajouter
          </button>
        </div>
      </div>

      {/* ── FILTERS ── */}
      <div className="px-6 py-3 border-b border-zinc-900 flex gap-3">
        <div className="relative flex-1">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un document..."
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600" />
        </div>
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
          className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none">
          <option value="tous">Toutes catégories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* ── CONTENT ── */}
      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-6 h-6 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : totalCount === 0 && !search ? (
          <div className="text-center py-20">
            <p className="text-5xl mb-3">📁</p>
            <p className="text-zinc-400 font-semibold mb-1">
              {currentFolder ? `Dossier "${currentFolder.nom}" vide` : "Aucun document"}
            </p>
            <p className="text-zinc-600 text-sm mb-5">Créez un dossier ou ajoutez un document</p>
            <div className="flex items-center justify-center gap-3">
              <button onClick={() => setShowNewFolder(true)}
                className="px-4 py-2 rounded-xl text-zinc-300 text-sm font-semibold bg-zinc-800 hover:bg-zinc-700 transition-colors">
                + Nouveau dossier
              </button>
              <button onClick={() => setShowUpload(true)}
                className="px-4 py-2 rounded-xl text-black text-sm font-bold bg-yellow-500 hover:bg-yellow-400 transition-colors">
                + Ajouter un fichier
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">

            {/* ── DOSSIERS ── */}
            {currentSubFolders.length > 0 && (
              <div>
                <p className="text-zinc-600 text-xs font-bold uppercase tracking-widest mb-3">
                  Dossiers · {currentSubFolders.length}
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
                  {currentSubFolders.map(folder => {
                    const docsInFolder = docs.filter(d => d.folder_id === folder.id).length
                    const subFolders   = folders.filter(f => f.parent_id === folder.id).length
                    return (
                      <div key={folder.id} className="group relative">
                        <button onClick={() => openFolder(folder)}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 hover:border-zinc-600 transition-all text-left">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                            style={{ backgroundColor: folder.couleur + "20" }}>
                            <Folder size={20} style={{ color: folder.couleur }} />
                          </div>
                          <p className="text-white font-semibold text-sm truncate">{folder.nom}</p>
                          <p className="text-zinc-600 text-xs mt-0.5">
                            {docsInFolder} fichier{docsInFolder !== 1 ? "s" : ""}
                            {subFolders > 0 ? ` · ${subFolders} dossier${subFolders !== 1 ? "s" : ""}` : ""}
                          </p>
                        </button>
                        <button onClick={() => deleteFolder(folder)}
                          className="absolute top-2 right-2 w-6 h-6 rounded-lg bg-red-500/10 hover:bg-red-500/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Trash2 size={10} className="text-red-400" />
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* ── DOCUMENTS ── */}
            {currentDocs.length > 0 && (
              <div>
                <p className="text-zinc-600 text-xs font-bold uppercase tracking-widest mb-3">
                  Fichiers · {currentDocs.length}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  {currentDocs.map(doc => {
                    const { icon: Icon, color } = getFileIcon(doc.type)
                    return (
                      <div key={doc.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 hover:border-zinc-700 transition-all group">
                        <div className="flex items-start gap-3 mb-3">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: color + "20" }}>
                            <Icon size={18} style={{ color }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-semibold text-sm truncate">{doc.nom}</p>
                            <p className="text-zinc-500 text-xs">{doc.categorie} · {formatSize(doc.taille)}</p>
                          </div>
                        </div>
                        {doc.description && <p className="text-zinc-500 text-xs mb-3 line-clamp-2">{doc.description}</p>}
                        <div className="flex items-center justify-between">
                          <p className="text-zinc-600 text-[10px]">{doc.user_nom} · {new Date(doc.created_at).toLocaleDateString("fr-FR")}</p>
                          <div className="flex gap-1">
                            {doc.url && doc.type?.includes("image") && (
                              <button onClick={() => window.open(doc.url, "_blank")}
                                className="w-7 h-7 rounded-lg bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center">
                                <Eye size={12} className="text-zinc-400" />
                              </button>
                            )}
                            {doc.url && (
                              <a href={doc.url} download={doc.nom}
                                className="w-7 h-7 rounded-lg bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center">
                                <Download size={12} className="text-zinc-400" />
                              </a>
                            )}
                            <button onClick={() => removeDoc(doc)}
                              className="w-7 h-7 rounded-lg bg-red-500/10 hover:bg-red-500/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <Trash2 size={12} className="text-red-400" />
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Search empty state */}
            {search && currentDocs.length === 0 && (
              <div className="text-center py-12">
                <p className="text-3xl mb-2">🔍</p>
                <p className="text-zinc-500 text-sm">Aucun résultat pour « {search} »</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ══ MODAL NOUVEAU DOSSIER ══ */}
      {showNewFolder && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111111] border border-zinc-800 rounded-2xl w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-zinc-800">
              <h2 className="text-white font-bold">Nouveau dossier</h2>
              <button onClick={() => setShowNewFolder(false)} className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white">
                <X size={14} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {currentFolder && (
                <div className="flex items-center gap-2 px-3 py-2 bg-zinc-800/60 rounded-xl text-xs text-zinc-400">
                  <Folder size={12} style={{ color: currentFolder.couleur }} />
                  Dans : <span className="text-zinc-200 font-semibold">{currentFolder.nom}</span>
                </div>
              )}
              <input value={folderForm.nom} onChange={e => setFolderForm(f => ({ ...f, nom: e.target.value }))}
                onKeyDown={e => e.key === "Enter" && createFolder()}
                placeholder="Nom du dossier *" autoFocus
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-500/60" />

              {/* Color picker */}
              <div>
                <p className="text-zinc-500 text-xs mb-2">Couleur</p>
                <div className="flex gap-2 flex-wrap">
                  {FOLDER_COLORS.map(c => (
                    <button key={c} onClick={() => setFolderForm(f => ({ ...f, couleur: c }))}
                      className={`w-8 h-8 rounded-lg transition-all ${folderForm.couleur === c ? "ring-2 ring-white ring-offset-1 ring-offset-zinc-900 scale-110" : "hover:scale-105"}`}
                      style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>

              {/* Preview */}
              <div className="flex items-center gap-3 px-3 py-3 bg-zinc-800/60 rounded-xl">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: folderForm.couleur + "20" }}>
                  <Folder size={18} style={{ color: folderForm.couleur }} />
                </div>
                <span className="text-white text-sm font-semibold">{folderForm.nom || "Nom du dossier"}</span>
              </div>

              <button onClick={createFolder} disabled={!folderForm.nom.trim()}
                className="w-full py-3 rounded-xl text-black font-bold text-sm bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 transition-colors">
                Créer le dossier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ MODAL UPLOAD ══ */}
      {showUpload && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111111] border border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-zinc-800">
              <h2 className="text-white font-bold">Ajouter un document</h2>
              <button onClick={() => { setShowUpload(false); setSelectedFile(null); setForm({ nom: "", description: "", categorie: "Autre" }) }}
                className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white">
                <X size={14} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {currentFolder && (
                <div className="flex items-center gap-2 px-3 py-2 bg-zinc-800/60 rounded-xl text-xs text-zinc-400">
                  <Folder size={12} style={{ color: currentFolder.couleur }} />
                  Dans : <span className="text-zinc-200 font-semibold">{currentFolder.nom}</span>
                </div>
              )}

              {/* Drop zone */}
              <div onClick={() => fileRef.current?.click()}
                onDragOver={e => e.preventDefault()}
                onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFileSelect(f) }}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${selectedFile ? "border-yellow-500/50 bg-yellow-500/5" : "border-zinc-700 hover:border-zinc-500"}`}>
                {selectedFile ? (
                  <><p className="text-yellow-400 font-semibold text-sm">✓ {selectedFile.name}</p><p className="text-zinc-500 text-xs mt-1">{formatSize(selectedFile.size)}</p></>
                ) : (
                  <><Upload size={24} className="text-zinc-600 mx-auto mb-2" /><p className="text-zinc-400 text-sm">Cliquez ou glissez un fichier ici</p><p className="text-zinc-600 text-xs mt-1">PDF, images, Excel, Word...</p></>
                )}
                <input ref={fileRef} type="file" className="hidden" onChange={e => e.target.files?.[0] && handleFileSelect(e.target.files[0])} />
              </div>

              <input value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))}
                placeholder="Nom du document *"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-500/60" />
              <select value={form.categorie} onChange={e => setForm(f => ({ ...f, categorie: e.target.value }))}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none">
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Description (optionnel)" rows={2}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-500/60 resize-none" />
              <button onClick={upload} disabled={uploading || !selectedFile || !form.nom.trim()}
                className="w-full py-3 rounded-xl text-black font-bold text-sm bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 transition-colors">
                {uploading ? "Envoi en cours..." : "Envoyer le document"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
