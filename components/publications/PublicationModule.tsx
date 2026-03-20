"use client"

import { useEffect, useState, useRef } from "react"
import { supabase } from "@/lib/supabase"
import {
  X, Plus, Sparkles, Calendar, List, ChevronLeft, ChevronRight,
  Clock, Hash, FileText, Send, Pencil, Trash2, Copy,
  CheckCircle, Circle, AlertCircle, Eye, LayoutGrid,
  Upload, Download, Film, ImageIcon, File, XCircle,
} from "lucide-react"

interface Props { activeSociety: any; profile: any }

interface Publication {
  id: string
  titre: string
  caption: string
  hashtags: string
  image_url: string
  fichier_url: string
  fichier_nom: string
  fichier_type: string
  fichier_taille: number
  reseau: "instagram" | "tiktok"
  statut: "brouillon" | "planifie" | "publie"
  date_publication: string
  heure_publication: string
  notes: string
  created_at: string
}

const RESEAUX = {
  instagram: { label: "Instagram", color: "#E1306C", bg: "bg-pink-500/15", border: "border-pink-500/40", text: "text-pink-400", dot: "bg-pink-500", emoji: "📸" },
  tiktok:    { label: "TikTok",    color: "#000000", bg: "bg-zinc-500/15", border: "border-zinc-400/40", text: "text-zinc-300", dot: "bg-zinc-100", emoji: "🎵" },
}

const STATUTS = {
  brouillon: { label: "Brouillon",  icon: Circle,       color: "text-zinc-500",  bg: "bg-zinc-800",       border: "border-zinc-700" },
  planifie:  { label: "Planifié",   icon: AlertCircle,  color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/30" },
  publie:    { label: "Publié",     icon: CheckCircle,  color: "text-green-400",  bg: "bg-green-500/10",  border: "border-green-500/30" },
}

const MOIS = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"]
const JOURS = ["Lun","Mar","Mer","Jeu","Ven","Sam","Dim"]
const HEURES = Array.from({ length: 48 }, (_, i) => {
  const h = Math.floor(i / 2); const m = i % 2 === 0 ? "00" : "30"
  return `${String(h).padStart(2,"0")}:${m}`
})
const THEMES_IA = [
  "Nouveau produit", "Promotion weekend", "Témoignage client", "Coulisses/Behind the scenes",
  "Tutoriel", "Annonce convention", "Produit phare", "Question communauté"
]

const formatFileSize = (bytes: number) => {
  if (!bytes) return ""
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
}

const isVideo = (type: string) => type?.startsWith("video/")
const isImage = (type: string) => type?.startsWith("image/")

/* ── UPLOAD ZONE ── */
function UploadZone({ onUpload, uploading, currentFile, currentType, onRemove }: {
  onUpload: (file: File) => void
  uploading: boolean
  currentFile?: string
  currentType?: string
  onRemove: () => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) onUpload(file)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) onUpload(file)
  }

  if (currentFile) {
    return (
      <div className="relative rounded-xl overflow-hidden border border-zinc-700 bg-zinc-900 group">
        {isVideo(currentType || "") ? (
          <video src={currentFile} controls className="w-full max-h-56 object-contain bg-black" />
        ) : isImage(currentType || "") ? (
          <img src={currentFile} alt="media" className="w-full max-h-56 object-contain bg-zinc-950" />
        ) : (
          <div className="flex items-center justify-center h-32 text-zinc-400">
            <File size={32} />
          </div>
        )}
        <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <a href={currentFile} download target="_blank" rel="noopener noreferrer"
            className="w-8 h-8 bg-black/70 backdrop-blur rounded-lg flex items-center justify-center text-white hover:bg-black transition-colors"
            title="Télécharger">
            <Download size={14} />
          </a>
          <button onClick={onRemove}
            className="w-8 h-8 bg-black/70 backdrop-blur rounded-lg flex items-center justify-center text-red-400 hover:bg-red-500/20 transition-colors"
            title="Supprimer">
            <XCircle size={14} />
          </button>
        </div>
        <div className="px-3 py-2 flex items-center gap-2 border-t border-zinc-800">
          {isVideo(currentType || "") ? <Film size={12} className="text-zinc-400 shrink-0" /> : <ImageIcon size={12} className="text-zinc-400 shrink-0" />}
          <span className="text-zinc-400 text-xs truncate">Fichier uploadé</span>
          <button onClick={() => inputRef.current?.click()} className="ml-auto text-xs text-yellow-500 hover:text-yellow-400 font-semibold shrink-0">
            Remplacer
          </button>
        </div>
        <input ref={inputRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleChange} />
      </div>
    )
  }

  return (
    <div
      onDragOver={e => { e.preventDefault(); setDragOver(true) }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
        dragOver ? "border-yellow-500/60 bg-yellow-500/5" : "border-zinc-700 hover:border-zinc-500 hover:bg-zinc-900/50"
      }`}>
      {uploading ? (
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-zinc-400 text-sm font-semibold">Upload en cours...</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2">
          <div className="w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center">
            <Upload size={20} className="text-zinc-400" />
          </div>
          <div>
            <p className="text-white text-sm font-semibold">Déposer une image ou vidéo</p>
            <p className="text-zinc-500 text-xs mt-0.5">ou cliquer pour parcourir</p>
          </div>
          <div className="flex gap-2 mt-1">
            {["JPG","PNG","MP4","MOV","WEBP"].map(f => (
              <span key={f} className="text-[10px] bg-zinc-800 border border-zinc-700 text-zinc-500 px-2 py-0.5 rounded-full">{f}</span>
            ))}
          </div>
        </div>
      )}
      <input ref={inputRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleChange} />
    </div>
  )
}

/* ── MODAL PUBLICATION ── */
function PublicationModal({ pub, date, societyId, profile, onClose, onSave }: {
  pub?: Publication | null; date?: string; societyId: string; profile: any
  onClose: () => void; onSave: () => void
}) {
  const [titre, setTitre] = useState(pub?.titre || "")
  const [caption, setCaption] = useState(pub?.caption || "")
  const [hashtags, setHashtags] = useState(pub?.hashtags || "")
  const [imageUrl, setImageUrl] = useState(pub?.image_url || "")
  const [fichierUrl, setFichierUrl] = useState(pub?.fichier_url || "")
  const [fichierNom, setFichierNom] = useState(pub?.fichier_nom || "")
  const [fichierType, setFichierType] = useState(pub?.fichier_type || "")
  const [fichierTaille, setFichierTaille] = useState(pub?.fichier_taille || 0)
  const [reseau, setReseau] = useState<"instagram"|"tiktok">(pub?.reseau || "instagram")
  const [statut, setStatut] = useState<"brouillon"|"planifie"|"publie">(pub?.statut || "brouillon")
  const [datePub, setDatePub] = useState(pub?.date_publication || date || new Date().toISOString().split("T")[0])
  const [heure, setHeure] = useState(pub?.heure_publication || "10:00")
  const [notes, setNotes] = useState(pub?.notes || "")
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [showAi, setShowAi] = useState(false)
  const [aiTheme, setAiTheme] = useState("")
  const [aiThemeCustom, setAiThemeCustom] = useState("")
  const [showPreview, setShowPreview] = useState(false)
  const [uploadError, setUploadError] = useState("")

  const handleUpload = async (file: File) => {
    setUploading(true); setUploadError("")
    try {
      const ext = file.name.split(".").pop()
      const path = `${societyId}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
      const { data, error } = await supabase.storage.from("publications").upload(path, file, {
        cacheControl: "3600", upsert: false
      })
      if (error) throw error
      const { data: urlData } = supabase.storage.from("publications").getPublicUrl(path)
      setFichierUrl(urlData.publicUrl)
      setFichierNom(file.name)
      setFichierType(file.type)
      setFichierTaille(file.size)
      // Si image, aussi mettre dans image_url pour l'aperçu
      if (file.type.startsWith("image/")) setImageUrl(urlData.publicUrl)
    } catch (err: any) {
      setUploadError("Erreur upload : " + (err.message || "Vérifiez que le bucket 'publications' existe dans Supabase Storage"))
    }
    setUploading(false)
  }

  const handleRemoveFile = async () => {
    if (fichierUrl) {
      // Extraire le path depuis l'URL
      try {
        const path = fichierUrl.split("/publications/")[1]
        if (path) await supabase.storage.from("publications").remove([path])
      } catch {}
    }
    setFichierUrl(""); setFichierNom(""); setFichierType(""); setFichierTaille(0)
    if (imageUrl === fichierUrl) setImageUrl("")
  }

  const handleSave = async () => {
    if (!titre.trim()) return
    setSaving(true)
    const payload = {
      society_id: societyId, user_id: profile.id,
      titre, caption, hashtags,
      image_url: imageUrl,
      fichier_url: fichierUrl,
      fichier_nom: fichierNom,
      fichier_type: fichierType,
      fichier_taille: fichierTaille,
      reseau, statut,
      date_publication: datePub,
      heure_publication: heure,
      notes, updated_at: new Date().toISOString(),
    }
    if (pub?.id) {
      await supabase.from("publications").update(payload).eq("id", pub.id)
    } else {
      await supabase.from("publications").insert(payload)
    }
    setSaving(false); onSave(); onClose()
  }

  const generateWithAI = async () => {
    const theme = aiThemeCustom || aiTheme
    if (!theme) return
    setAiLoading(true)
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{
            role: "user",
            content: `Tu es un expert en marketing pour les réseaux sociaux (${reseau === "instagram" ? "Instagram" : "TikTok"}).
Génère une publication pour le thème suivant : "${theme}".
C'est pour une marque de cosmétiques naturels / bien-être.
Réponds UNIQUEMENT en JSON valide sans markdown, avec exactement ces champs :
{"titre": "...", "caption": "...", "hashtags": "..."}
- titre : accrocheur, max 60 caractères
- caption : engageante, naturelle, 2-4 paragraphes, avec emojis, adaptée ${reseau === "instagram" ? "Instagram" : "TikTok"}
- hashtags : 8-12 hashtags pertinents séparés par des espaces, commençant par #`
          }]
        })
      })
      const data = await response.json()
      const text = data.content?.[0]?.text || ""
      const parsed = JSON.parse(text)
      if (parsed.titre) setTitre(parsed.titre)
      if (parsed.caption) setCaption(parsed.caption)
      if (parsed.hashtags) setHashtags(parsed.hashtags)
      setShowAi(false)
    } catch (err) { console.error("AI error:", err) }
    setAiLoading(false)
  }

  const cfg = RESEAUX[reseau]

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#111111] border border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg ${cfg.bg} border ${cfg.border}`}>
              {cfg.emoji}
            </div>
            <div>
              <h2 className="text-white font-bold text-sm">{pub ? "Modifier la publication" : "Nouvelle publication"}</h2>
              <p className="text-zinc-500 text-xs">{datePub ? new Date(datePub + "T00:00:00").toLocaleDateString("fr-FR", { weekday:"long", day:"numeric", month:"long" }) : ""}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowPreview(!showPreview)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${showPreview ? "bg-zinc-700 text-white border-zinc-600" : "text-zinc-400 border-zinc-800 hover:border-zinc-600"}`}>
              <Eye size={12} /> Aperçu
            </button>
            <button onClick={onClose} className="text-zinc-500 hover:text-white"><X size={18} /></button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Form */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">

            {/* Réseau + Statut */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Réseau</label>
                <div className="flex gap-2">
                  {(["instagram","tiktok"] as const).map(r => (
                    <button key={r} onClick={() => setReseau(r)}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold border transition-all ${reseau === r ? `${RESEAUX[r].bg} ${RESEAUX[r].border} ${RESEAUX[r].text}` : "bg-zinc-900 border-zinc-800 text-zinc-500"}`}>
                      <span>{RESEAUX[r].emoji}</span> {RESEAUX[r].label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Statut</label>
                <div className="flex gap-1.5">
                  {(["brouillon","planifie","publie"] as const).map(s => {
                    const sc = STATUTS[s]
                    return (
                      <button key={s} onClick={() => setStatut(s)}
                        className={`flex-1 py-2 rounded-xl text-[10px] font-bold border transition-all ${statut === s ? `${sc.bg} ${sc.border} ${sc.color}` : "bg-zinc-900 border-zinc-800 text-zinc-600"}`}>
                        {sc.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Date + Heure */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-2">📅 Date</label>
                <input type="date" value={datePub} onChange={e => setDatePub(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-zinc-600" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-2">⏰ Heure</label>
                <select value={heure} onChange={e => setHeure(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-zinc-600">
                  {HEURES.map(h => <option key={h}>{h}</option>)}
                </select>
              </div>
            </div>

            {/* Titre */}
            <div>
              <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Titre</label>
              <input type="text" placeholder="Ex: Nouveau produit printemps 🌸" value={titre} onChange={e => setTitre(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600" />
            </div>

            {/* UPLOAD FICHIER */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                  📎 Image / Vidéo
                </label>
                {fichierNom && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-zinc-500 text-[10px]">{fichierNom}</span>
                    {fichierTaille > 0 && <span className="text-zinc-600 text-[10px]">({formatFileSize(fichierTaille)})</span>}
                  </div>
                )}
              </div>
              <UploadZone
                onUpload={handleUpload}
                uploading={uploading}
                currentFile={fichierUrl}
                currentType={fichierType}
                onRemove={handleRemoveFile}
              />
              {uploadError && <p className="text-red-400 text-xs mt-2">{uploadError}</p>}
            </div>

            {/* URL image manuelle (si pas d'upload) */}
            {!fichierUrl && (
              <div>
                <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-2">
                  🔗 Ou URL externe (optionnel)
                </label>
                <input type="text" placeholder="https://..." value={imageUrl} onChange={e => setImageUrl(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600" />
              </div>
            )}

            {/* IA Button */}
            <button onClick={() => setShowAi(!showAi)}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-purple-500/40 text-purple-400 bg-purple-500/5 hover:bg-purple-500/10 hover:border-purple-500/60 transition-all text-sm font-semibold">
              <Sparkles size={15} /> ✨ Générer caption + hashtags avec l'IA
            </button>

            {/* IA Panel */}
            {showAi && (
              <div className="bg-zinc-900 border border-purple-500/20 rounded-xl p-4 space-y-3">
                <p className="text-purple-400 text-xs font-bold uppercase tracking-wider">🤖 Assistant IA</p>
                <div className="grid grid-cols-2 gap-2">
                  {THEMES_IA.map(t => (
                    <button key={t} onClick={() => { setAiTheme(t); setAiThemeCustom("") }}
                      className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-colors text-left ${aiTheme === t ? "bg-purple-500/20 border-purple-500/50 text-purple-300" : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-500"}`}>
                      {t}
                    </button>
                  ))}
                </div>
                <input type="text" placeholder="Ou décris ton propre thème..." value={aiThemeCustom}
                  onChange={e => { setAiThemeCustom(e.target.value); setAiTheme("") }}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none" />
                <button onClick={generateWithAI} disabled={aiLoading || (!aiTheme && !aiThemeCustom)}
                  className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white font-bold text-sm flex items-center justify-center gap-2">
                  {aiLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Sparkles size={14} /> Générer</>}
                </button>
              </div>
            )}

            {/* Caption */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">📝 Caption</label>
                <span className="text-zinc-600 text-[10px]">{caption.length} caractères</span>
              </div>
              <textarea value={caption} onChange={e => setCaption(e.target.value)}
                placeholder="Rédigez votre caption ici..." rows={5}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600 resize-none" />
            </div>

            {/* Hashtags */}
            <div>
              <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-2">
                <Hash size={11} className="inline mr-1" />Hashtags
              </label>
              <input type="text" placeholder="#cosmétiques #naturel #beauté ..." value={hashtags} onChange={e => setHashtags(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600" />
              {hashtags && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {hashtags.split(" ").filter(h => h.startsWith("#")).map((h, i) => (
                    <span key={i} className="text-[11px] bg-zinc-800 border border-zinc-700 text-zinc-400 px-2 py-0.5 rounded-full">{h}</span>
                  ))}
                </div>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Notes internes</label>
              <input type="text" placeholder="Notes, idées, rappels..." value={notes} onChange={e => setNotes(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600" />
            </div>
          </div>

          {/* Preview */}
          {showPreview && (
            <div className="w-72 border-l border-zinc-800 p-4 overflow-y-auto bg-[#0d0d0d] shrink-0">
              <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-3">Aperçu {reseau === "instagram" ? "📸 Instagram" : "🎵 TikTok"}</p>
              <div className={`rounded-2xl border overflow-hidden ${cfg.border} bg-zinc-900`}>
                {fichierUrl || imageUrl ? (
                  isVideo(fichierType) ? (
                    <video src={fichierUrl} controls className="w-full h-40 object-cover bg-black" />
                  ) : (
                    <img src={fichierUrl || imageUrl} alt="preview" className="w-full h-40 object-cover"
                      onError={e => { (e.target as HTMLImageElement).style.display="none" }} />
                  )
                ) : (
                  <div className={`w-full h-40 flex items-center justify-center ${cfg.bg} text-4xl`}>{cfg.emoji}</div>
                )}
                <div className="p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-6 h-6 rounded-full ${cfg.bg} border ${cfg.border} flex items-center justify-center text-xs`}>{cfg.emoji}</div>
                    <span className={`text-xs font-bold ${cfg.text}`}>{cfg.label}</span>
                    <span className={`ml-auto text-[10px] px-2 py-0.5 rounded-full ${STATUTS[statut].bg} ${STATUTS[statut].color} border ${STATUTS[statut].border}`}>{STATUTS[statut].label}</span>
                  </div>
                  {titre && <p className="text-white text-xs font-bold mb-1">{titre}</p>}
                  {caption && <p className="text-zinc-400 text-[11px] leading-relaxed whitespace-pre-wrap line-clamp-6">{caption}</p>}
                  {hashtags && <p className={`text-[11px] mt-2 ${cfg.text} line-clamp-2`}>{hashtags.split(" ").slice(0,5).join(" ")}</p>}
                  {heure && <p className="text-zinc-600 text-[10px] mt-2">⏰ {heure}</p>}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-zinc-800 flex gap-3 shrink-0">
          <button onClick={handleSave} disabled={saving || !titre.trim() || uploading}
            className="flex-1 py-3 rounded-xl bg-yellow-500 hover:bg-yellow-400 disabled:opacity-40 text-black font-bold text-sm flex items-center justify-center gap-2">
            {saving ? <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" /> : <><Send size={14} /> {pub ? "Mettre à jour" : "Enregistrer"}</>}
          </button>
          <button onClick={onClose} className="px-6 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold text-sm">Annuler</button>
        </div>
      </div>
    </div>
  )
}

/* ── CARTE MEDIA ── */
function MediaBadge({ pub }: { pub: Publication }) {
  if (!pub.fichier_url) return null
  const video = isVideo(pub.fichier_type)
  return (
    <span className="inline-flex items-center gap-1 text-[9px] text-zinc-400">
      {video ? <Film size={8} /> : <ImageIcon size={8} />}
    </span>
  )
}

/* ══════════════════════════════════════════════
   MAIN MODULE
══════════════════════════════════════════════ */
export default function PublicationModule({ activeSociety, profile }: Props) {
  const [publications, setPublications] = useState<Publication[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<"calendrier" | "liste">("calendrier")
  const [currentDate, setCurrentDate] = useState(new Date())
  const [showModal, setShowModal] = useState(false)
  const [editPub, setEditPub] = useState<Publication | null>(null)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [filterReseau, setFilterReseau] = useState<"all" | "instagram" | "tiktok">("all")
  const [filterStatut, setFilterStatut] = useState<"all" | "brouillon" | "planifie" | "publie">("all")

  const year  = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const today = new Date().toISOString().split("T")[0]

  useEffect(() => { if (activeSociety) loadData() }, [activeSociety, currentDate])

  const loadData = async () => {
    setLoading(true)
    try {
      const startOfMonth = new Date(year, month, 1).toISOString().split("T")[0]
      const endOfMonth   = new Date(year, month + 1, 0).toISOString().split("T")[0]
      const { data } = await supabase.from("publications").select("*")
        .eq("society_id", activeSociety.id)
        .gte("date_publication", startOfMonth)
        .lte("date_publication", endOfMonth)
        .order("date_publication").order("heure_publication")
      setPublications(data || [])
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const deletePub = async (pub: Publication) => {
    if (!confirm("Supprimer cette publication ?")) return
    // Supprimer le fichier du storage si existant
    if (pub.fichier_url) {
      try {
        const path = pub.fichier_url.split("/publications/")[1]
        if (path) await supabase.storage.from("publications").remove([path])
      } catch {}
    }
    await supabase.from("publications").delete().eq("id", pub.id)
    loadData()
  }

  const dupliquerPub = async (pub: Publication) => {
    await supabase.from("publications").insert({
      society_id: activeSociety.id, user_id: profile.id,
      titre: pub.titre + " (copie)", caption: pub.caption,
      hashtags: pub.hashtags, image_url: pub.image_url,
      fichier_url: pub.fichier_url, fichier_nom: pub.fichier_nom,
      fichier_type: pub.fichier_type, fichier_taille: pub.fichier_taille,
      reseau: pub.reseau, statut: "brouillon",
      date_publication: pub.date_publication,
      heure_publication: pub.heure_publication,
      notes: pub.notes,
    })
    loadData()
  }

  const changerStatut = async (id: string, statut: "brouillon"|"planifie"|"publie") => {
    await supabase.from("publications").update({ statut }).eq("id", id)
    loadData()
  }

  // Stats
  const total     = publications.length
  const planifies = publications.filter(p => p.statut === "planifie").length
  const publies   = publications.filter(p => p.statut === "publie").length
  const insta     = publications.filter(p => p.reseau === "instagram").length
  const tiktokN   = publications.filter(p => p.reseau === "tiktok").length
  const daysInMonth  = new Date(year, month + 1, 0).getDate()
  const daysWithPub  = new Set(publications.map(p => p.date_publication)).size

  const filtered = publications.filter(p => {
    if (filterReseau !== "all" && p.reseau !== filterReseau) return false
    if (filterStatut !== "all" && p.statut !== filterStatut) return false
    return true
  })

  const firstDay = new Date(year, month, 1).getDay()
  const offset = firstDay === 0 ? 6 : firstDay - 1

  const pubsByDate: Record<string, Publication[]> = {}
  publications.forEach(p => {
    if (!pubsByDate[p.date_publication]) pubsByDate[p.date_publication] = []
    pubsByDate[p.date_publication].push(p)
  })

  /* ── CALENDRIER ── */
  const CalendrierView = (
    <div className="flex-1 overflow-hidden flex flex-col p-4">
      <div className="grid grid-cols-7 gap-1 mb-2">
        {JOURS.map(j => (
          <div key={j} className="text-center text-[10px] font-bold text-zinc-600 uppercase py-1">{j}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1 flex-1 overflow-y-auto">
        {Array.from({ length: offset }).map((_, i) => <div key={`e-${i}`} />)}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1
          const dateStr = `${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`
          const pubs = pubsByDate[dateStr] || []
          const isToday = dateStr === today
          const isPast  = dateStr < today
          return (
            <div key={day}
              onClick={() => { setSelectedDate(dateStr); setEditPub(null); setShowModal(true) }}
              className={`min-h-[80px] rounded-xl border p-1.5 cursor-pointer transition-all hover:border-zinc-600 group relative ${
                isToday ? "border-yellow-500/60 bg-yellow-500/5" : isPast ? "border-zinc-800/50 bg-zinc-900/30" : "border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900"
              }`}>
              <div className={`text-xs font-bold mb-1 ${isToday ? "text-yellow-500" : isPast ? "text-zinc-700" : "text-zinc-400"}`}>
                {day}{isToday && <span className="ml-1 text-[9px] text-yellow-500">●</span>}
              </div>
              {pubs.length === 0 && !isPast && (
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Plus size={14} className="text-zinc-600" />
                </div>
              )}
              <div className="space-y-0.5">
                {pubs.slice(0, 3).map(pub => {
                  const r = RESEAUX[pub.reseau]
                  return (
                    <div key={pub.id}
                      onClick={e => { e.stopPropagation(); setEditPub(pub); setShowModal(true) }}
                      className={`rounded-lg px-1.5 py-1 border cursor-pointer hover:brightness-110 transition-all ${r.bg} ${r.border}`}>
                      <div className="flex items-center gap-1">
                        <span className="text-[9px]">{r.emoji}</span>
                        <span className={`text-[9px] font-semibold truncate flex-1 ${r.text}`}>{pub.titre}</span>
                        <MediaBadge pub={pub} />
                      </div>
                      {pub.heure_publication && <p className="text-zinc-600 text-[8px]">⏰ {pub.heure_publication}</p>}
                    </div>
                  )
                })}
                {pubs.length > 3 && <p className="text-zinc-600 text-[9px] text-center">+{pubs.length - 3}</p>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )

  /* ── LISTE ── */
  const ListeView = (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="flex gap-2 mb-4 flex-wrap">
        <div className="flex gap-1">
          {(["all","instagram","tiktok"] as const).map(r => (
            <button key={r} onClick={() => setFilterReseau(r)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-colors ${filterReseau === r
                ? r === "all" ? "bg-zinc-700 text-white border-zinc-600" : `${RESEAUX[r].bg} ${RESEAUX[r].border} ${RESEAUX[r].text}`
                : "bg-zinc-900 border-zinc-800 text-zinc-500"}`}>
              {r === "all" ? "Tous" : `${RESEAUX[r].emoji} ${RESEAUX[r].label}`}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          {(["all","brouillon","planifie","publie"] as const).map(s => (
            <button key={s} onClick={() => setFilterStatut(s)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-colors ${filterStatut === s
                ? s === "all" ? "bg-zinc-700 text-white border-zinc-600" : `${STATUTS[s].bg} ${STATUTS[s].border} ${STATUTS[s].color}`
                : "bg-zinc-900 border-zinc-800 text-zinc-500"}`}>
              {s === "all" ? "Tous statuts" : STATUTS[s].label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-zinc-700">
          <Calendar size={48} className="mb-4 opacity-20" />
          <p className="text-sm font-semibold">Aucune publication ce mois</p>
          <p className="text-xs mt-1">Cliquez sur + pour en créer une</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(pub => {
            const r = RESEAUX[pub.reseau]
            const s = STATUTS[pub.statut]
            const StatusIcon = s.icon
            const hasFile = !!pub.fichier_url
            const isVid = isVideo(pub.fichier_type)
            return (
              <div key={pub.id} className={`bg-zinc-900 border rounded-2xl p-4 hover:border-zinc-700 transition-all group ${s.border}`}>
                <div className="flex items-start gap-4">
                  {/* Miniature */}
                  <div className={`w-16 h-16 rounded-xl flex items-center justify-center shrink-0 overflow-hidden ${r.bg} border ${r.border} relative`}>
                    {hasFile && !isVid ? (
                      <img src={pub.fichier_url} alt="" className="w-full h-full object-cover"
                        onError={e => { (e.target as HTMLImageElement).style.display="none" }} />
                    ) : hasFile && isVid ? (
                      <div className="flex flex-col items-center gap-1">
                        <Film size={20} className={r.text} />
                        <span className="text-[9px] text-zinc-500">Vidéo</span>
                      </div>
                    ) : pub.image_url ? (
                      <img src={pub.image_url} alt="" className="w-full h-full object-cover"
                        onError={e => { (e.target as HTMLImageElement).style.display="none" }} />
                    ) : (
                      <span className="text-2xl">{r.emoji}</span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${r.bg} ${r.text}`}>{r.emoji} {r.label}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${s.bg} ${s.color} ${s.border} flex items-center gap-1`}>
                            <StatusIcon size={8} /> {s.label}
                          </span>
                          {hasFile && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-400 flex items-center gap-1">
                              {isVid ? <Film size={8} /> : <ImageIcon size={8} />}
                              {isVid ? "Vidéo" : "Image"}
                              {pub.fichier_taille > 0 && <span className="text-zinc-600">· {formatFileSize(pub.fichier_taille)}</span>}
                            </span>
                          )}
                        </div>
                        <p className="text-white font-bold text-sm">{pub.titre}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-zinc-400 text-xs font-semibold">
                          {new Date(pub.date_publication + "T00:00:00").toLocaleDateString("fr-FR", { day:"numeric", month:"short" })}
                        </p>
                        {pub.heure_publication && <p className="text-zinc-600 text-[11px]">⏰ {pub.heure_publication}</p>}
                      </div>
                    </div>

                    {pub.caption && <p className="text-zinc-500 text-xs line-clamp-2 mb-2">{pub.caption}</p>}
                    {pub.hashtags && <p className={`text-[11px] ${r.text} line-clamp-1 mb-2`}>{pub.hashtags.split(" ").slice(0,5).join(" ")}</p>}

                    {/* Actions */}
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setEditPub(pub); setShowModal(true) }}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white text-[11px] font-semibold">
                        <Pencil size={10} /> Modifier
                      </button>
                      <button onClick={() => dupliquerPub(pub)}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white text-[11px] font-semibold">
                        <Copy size={10} /> Dupliquer
                      </button>
                      {hasFile && (
                        <a href={pub.fichier_url} download target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-zinc-800 text-yellow-400 hover:text-yellow-300 text-[11px] font-semibold">
                          <Download size={10} /> Télécharger
                        </a>
                      )}
                      {pub.statut === "brouillon" && (
                        <button onClick={() => changerStatut(pub.id, "planifie")}
                          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-[11px] font-semibold hover:bg-yellow-500/20">
                          → Planifier
                        </button>
                      )}
                      {pub.statut === "planifie" && (
                        <button onClick={() => changerStatut(pub.id, "publie")}
                          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-[11px] font-semibold hover:bg-green-500/20">
                          ✓ Marquer publié
                        </button>
                      )}
                      <button onClick={() => deletePub(pub)}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg bg-zinc-800 text-red-500 hover:text-red-400 text-[11px] font-semibold ml-auto">
                        <Trash2 size={10} /> Supprimer
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )

  return (
    <div className="flex-1 overflow-hidden bg-[#0a0a0a] flex flex-col">

      {/* HEADER */}
      <div className="border-b border-zinc-900 p-4 space-y-3 shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-white font-bold text-xl">📣 Publications</h1>
            <p className="text-zinc-500 text-xs mt-0.5">Planifiez vos posts Instagram & TikTok</p>
          </div>
          <button onClick={() => { setEditPub(null); setSelectedDate(today); setShowModal(true) }}
            className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-4 py-2.5 rounded-xl text-sm shadow-lg shadow-yellow-500/20">
            <Plus size={15} /> Nouvelle publication
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-5 gap-2">
          {[
            { label: "Ce mois",   value: total,    color: "text-white"    },
            { label: "Planifiés", value: planifies, color: "text-yellow-400" },
            { label: "Publiés",   value: publies,   color: "text-green-400"  },
            { label: "Instagram", value: insta,     color: "text-pink-400", emoji: "📸" },
            { label: "TikTok",    value: tiktokN,   color: "text-zinc-300", emoji: "🎵" },
          ].map(({ label, value, color, emoji }) => (
            <div key={label} className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-center">
              <p className={`text-lg font-black ${color}`}>{emoji ? emoji + " " : ""}{value}</p>
              <p className="text-zinc-600 text-[10px]">{label}</p>
            </div>
          ))}
        </div>

        {/* Nav */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setCurrentDate(new Date(year, month - 1, 1))} className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white hover:border-zinc-600">
              <ChevronLeft size={14} />
            </button>
            <h2 className="text-white font-bold text-sm min-w-[140px] text-center">{MOIS[month]} {year}</h2>
            <button onClick={() => setCurrentDate(new Date(year, month + 1, 1))} className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white hover:border-zinc-600">
              <ChevronRight size={14} />
            </button>
            <span className="text-zinc-600 text-xs">{daysWithPub}/{daysInMonth} jours planifiés</span>
          </div>
          <div className="flex gap-1 bg-zinc-900 border border-zinc-800 rounded-xl p-1">
            <button onClick={() => setView("calendrier")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${view === "calendrier" ? "bg-zinc-700 text-white" : "text-zinc-500 hover:text-zinc-300"}`}>
              <LayoutGrid size={12} /> Calendrier
            </button>
            <button onClick={() => setView("liste")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${view === "liste" ? "bg-zinc-700 text-white" : "text-zinc-500 hover:text-zinc-300"}`}>
              <List size={12} /> Liste
            </button>
          </div>
        </div>
      </div>

      {/* CONTENT */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        view === "calendrier" ? CalendrierView : ListeView
      )}

      {showModal && (
        <PublicationModal
          pub={editPub}
          date={selectedDate || today}
          societyId={activeSociety.id}
          profile={profile}
          onClose={() => { setShowModal(false); setEditPub(null) }}
          onSave={loadData}
        />
      )}
    </div>
  )
}