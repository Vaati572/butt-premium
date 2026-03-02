"use client"
import { useEffect, useState, useRef } from "react"
import { supabase } from "@/lib/supabase"
import { Plus, X, Search, Trash2, Download, Eye, Upload, FileText, File, Image, FileSpreadsheet } from "lucide-react"

interface Document {
  id: string; nom: string; description: string; type: string
  url: string; taille: number; categorie: string
  user_id: string; user_nom: string; created_at: string
}

const CATEGORIES = ["Contrats", "Factures", "Devis", "RH", "Commercial", "Technique", "Autre"]

const getFileIcon = (type: string) => {
  if (type?.includes("image")) return { icon: Image, color: "#a855f7" }
  if (type?.includes("pdf")) return { icon: FileText, color: "#ef4444" }
  if (type?.includes("sheet") || type?.includes("excel") || type?.includes("csv")) return { icon: FileSpreadsheet, color: "#22c55e" }
  return { icon: File, color: "#3b82f6" }
}

const formatSize = (bytes: number) => {
  if (!bytes) return "—"
  if (bytes < 1024) return bytes + " B"
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
  return (bytes / (1024 * 1024)).toFixed(1) + " MB"
}

export default function DocumentsModule({ activeSociety, profile }: { activeSociety: any; profile: any }) {
  const [docs, setDocs] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filterCat, setFilterCat] = useState("tous")
  const [showForm, setShowForm] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [form, setForm] = useState({ nom: "", description: "", categorie: "Autre" })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => { load() }, [activeSociety])

  const load = async () => {
    setLoading(true)
    const { data } = await supabase.from("documents")
      .select("*").eq("society_id", activeSociety.id)
      .order("created_at", { ascending: false })
    setDocs(data || [])
    setLoading(false)
  }

  const handleFileSelect = (file: File) => {
    setSelectedFile(file)
    if (!form.nom) setForm(f => ({ ...f, nom: file.name.replace(/\.[^.]+$/, "") }))
  }

  const upload = async () => {
    if (!selectedFile || !form.nom.trim()) return
    setUploading(true)
    const path = `documents/${activeSociety.id}/${Date.now()}_${selectedFile.name}`
    const { error: uploadError } = await supabase.storage.from("documents").upload(path, selectedFile, { upsert: true })
    if (uploadError) {
      // Storage bucket might not exist — save without file URL
      const { error: dbError } = await supabase.from("documents").insert({
        nom: form.nom, description: form.description, categorie: form.categorie,
        url: "", type: selectedFile.type, taille: selectedFile.size,
        society_id: activeSociety.id, user_id: profile.id, user_nom: profile.nom || "",
      })
      setUploading(false)
      if (dbError) { alert("Erreur: " + dbError.message); return }
    } else {
      const { data: urlData } = supabase.storage.from("documents").getPublicUrl(path)
      const { error: dbError } = await supabase.from("documents").insert({
        nom: form.nom, description: form.description, categorie: form.categorie,
        url: urlData.publicUrl, type: selectedFile.type, taille: selectedFile.size,
        society_id: activeSociety.id, user_id: profile.id, user_nom: profile.nom || "",
      })
      setUploading(false)
      if (dbError) { alert("Erreur: " + dbError.message); return }
    }
    setShowForm(false); setSelectedFile(null)
    setForm({ nom: "", description: "", categorie: "Autre" }); load()
  }

  const remove = async (doc: Document) => {
    if (!confirm("Supprimer ce document ?")) return
    await supabase.from("documents").delete().eq("id", doc.id)
    load()
  }

  const filtered = docs.filter(d => {
    const matchSearch = !search || d.nom?.toLowerCase().includes(search.toLowerCase())
    const matchCat = filterCat === "tous" || d.categorie === filterCat
    return matchSearch && matchCat
  })

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#0a0a0a]">
      <div className="px-6 py-4 border-b border-zinc-900 flex items-center justify-between">
        <div><h1 className="text-white font-bold text-xl">📁 Documents</h1><p className="text-zinc-500 text-xs mt-0.5">{docs.length} document{docs.length > 1 ? "s" : ""}</p></div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl text-black text-sm font-bold bg-yellow-500 hover:bg-yellow-400 transition-colors"><Upload size={14} /> Ajouter</button>
      </div>

      <div className="px-6 py-3 border-b border-zinc-900 flex gap-3">
        <div className="relative flex-1">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..." className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600" />
        </div>
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)} className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none">
          <option value="tous">Toutes catégories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (<div className="flex items-center justify-center h-40"><div className="w-6 h-6 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" /></div>)
        : filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-4xl mb-3">📁</p>
            <p className="text-zinc-400 font-semibold">Aucun document</p>
            <button onClick={() => setShowForm(true)} className="mt-4 px-4 py-2 rounded-xl text-black text-sm font-bold bg-yellow-500">+ Ajouter un document</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {filtered.map(doc => {
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
                      {doc.type?.includes("image") && (
                        <button onClick={() => window.open(doc.url, "_blank")} className="w-7 h-7 rounded-lg bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center"><Eye size={12} className="text-zinc-400" /></button>
                      )}
                      <a href={doc.url} download={doc.nom} className="w-7 h-7 rounded-lg bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center"><Download size={12} className="text-zinc-400" /></a>
                      <button onClick={() => remove(doc)} className="w-7 h-7 rounded-lg bg-red-500/10 hover:bg-red-500/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={12} className="text-red-400" /></button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111111] border border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-zinc-800">
              <h2 className="text-white font-bold">Ajouter un document</h2>
              <button onClick={() => setShowForm(false)} className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white"><X size={14} /></button>
            </div>
            <div className="p-5 space-y-4">
              {/* Drop zone */}
              <div onClick={() => fileRef.current?.click()} onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFileSelect(f) }}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${selectedFile ? "border-yellow-500/50 bg-yellow-500/5" : "border-zinc-700 hover:border-zinc-500"}`}>
                {selectedFile ? (
                  <><p className="text-yellow-400 font-semibold text-sm">✓ {selectedFile.name}</p><p className="text-zinc-500 text-xs mt-1">{formatSize(selectedFile.size)}</p></>
                ) : (
                  <><Upload size={24} className="text-zinc-600 mx-auto mb-2" /><p className="text-zinc-400 text-sm">Cliquez ou glissez un fichier ici</p><p className="text-zinc-600 text-xs mt-1">PDF, images, Excel, Word...</p></>
                )}
                <input ref={fileRef} type="file" className="hidden" onChange={e => e.target.files?.[0] && handleFileSelect(e.target.files[0])} />
              </div>
              <input value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} placeholder="Nom du document *" className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-500/60" />
              <select value={form.categorie} onChange={e => setForm(f => ({ ...f, categorie: e.target.value }))} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none">
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Description (optionnel)" rows={2} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-500/60 resize-none" />
              <button onClick={upload} disabled={uploading || !selectedFile || !form.nom.trim()} className="w-full py-3 rounded-xl text-black font-bold text-sm bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 transition-colors">
                {uploading ? "Envoi en cours..." : "Envoyer le document"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}