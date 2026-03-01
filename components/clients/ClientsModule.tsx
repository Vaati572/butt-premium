"use client"

import { useEffect, useState, useRef } from "react"
import { supabase } from "@/lib/supabase"
import {
  Users, AlertTriangle, Plus, X, Pencil, Trash2,
  Mail, Phone, MapPin, Clock, Search, SlidersHorizontal,
  CheckCircle, Tag, ShoppingBag, TrendingUp, Star,
  FileText, Camera, ChevronRight,
} from "lucide-react"

interface Client {
  id: string
  nom: string
  email: string
  telephone: string
  adresse: string
  contrat: string
  relance: number
  avatar_url?: string
  notes?: string
  tags?: string[]
  derniere_commande?: string
  created_at: string
  society_id: string
}

interface Props { activeSociety: any; profile: any }

const CONTRATS = ["Aucun", "Essentielle", "Avantage", "Élite", "ProTeam"]
const TAG_SUGGESTIONS = ["VIP", "Relance", "Inactif", "Nouveau", "Fidèle", "Pro", "En attente"]

const contratConfig: Record<string, { className: string; dot: string; relanceDays: number }> = {
  "Aucun":      { className: "text-zinc-400 bg-zinc-800 border-zinc-700",              dot: "bg-zinc-500",    relanceDays: 30 },
  "Essentielle":{ className: "text-amber-400 bg-amber-900/30 border-amber-800",        dot: "bg-amber-400",   relanceDays: 30 },
  "Avantage":   { className: "text-zinc-200 bg-zinc-600/40 border-zinc-500",           dot: "bg-zinc-300",    relanceDays: 60 },
  "Élite":      { className: "text-yellow-400 bg-yellow-900/30 border-yellow-700",     dot: "bg-yellow-400",  relanceDays: 90 },
  "ProTeam":    { className: "text-black bg-yellow-400 border-yellow-300",             dot: "bg-black",       relanceDays: 90 },
}

const getInitials = (nom: string) => nom.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
const avatarColors = ["#d97706","#b45309","#f59e0b","#d4af37","#92400e"]
const getAvatarColor = (id: string) => avatarColors[id.charCodeAt(0) % avatarColors.length]

const emptyClient = { nom: "", email: "", telephone: "", adresse: "", contrat: "Aucun", relance: 30, notes: "", tags: [] as string[] }

/* ── BADGE CONTRAT ───────────────────────────── */
function ContratBadge({ contrat }: { contrat: string }) {
  const cfg = contratConfig[contrat] ?? contratConfig["Aucun"]
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${cfg.className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {contrat}
    </span>
  )
}

/* ── FICHE CLIENT (panel latéral) ────────────── */
function ClientFiche({ client, societyId, profile, onClose, onUpdated }: {
  client: Client; societyId: string; profile: any; onClose: () => void; onUpdated: () => void
}) {
  const [activeTab, setActiveTab] = useState("historique")
  const [ventes, setVentes] = useState<any[]>([])
  const [loadingVentes, setLoadingVentes] = useState(true)
  const [noteText, setNoteText] = useState(client.notes || "")
  const [savingNote, setSavingNote] = useState(false)
  const [newTag, setNewTag] = useState("")
  const [tags, setTags] = useState<string[]>(client.tags || [])
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => { loadVentes() }, [])

  const loadVentes = async () => {
    setLoadingVentes(true)
    const { data } = await supabase.from("ventes").select("*, vente_items(*)")
      .eq("society_id", societyId).eq("client_id", client.id)
      .order("created_at", { ascending: false })
    setVentes(data || [])
    setLoadingVentes(false)
  }

  const saveNote = async () => {
    setSavingNote(true)
    await supabase.from("clients").update({ notes: noteText }).eq("id", client.id)
    setSavingNote(false)
    onUpdated()
  }

  const addTag = async (tag: string) => {
    const t = tag.trim()
    if (!t || tags.includes(t)) { setNewTag(""); return }
    const newTags = [...tags, t]
    setTags(newTags)
    await supabase.from("clients").update({ tags: newTags }).eq("id", client.id)
    setNewTag("")
    onUpdated()
  }

  const removeTag = async (tag: string) => {
    const newTags = tags.filter(t => t !== tag)
    setTags(newTags)
    await supabase.from("clients").update({ tags: newTags }).eq("id", client.id)
    onUpdated()
  }

  const uploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    setUploading(true)
    const ext = file.name.split(".").pop()
    const path = `clients/${client.id}_${Date.now()}.${ext}`
    const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true })
    if (!error) {
      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path)
      await supabase.from("clients").update({ avatar_url: publicUrl }).eq("id", client.id)
      onUpdated()
    }
    setUploading(false)
  }

  // Stats
  const caTotal = ventes.reduce((s, v) => s + Number(v.total_ttc), 0)
  const nbCmd = ventes.length
  const panierMoyen = nbCmd > 0 ? caTotal / nbCmd : 0
  const prodsCnt: Record<string, number> = {}
  ventes.forEach(v => v.vente_items?.forEach((i: any) => {
    prodsCnt[i.produit_nom] = (prodsCnt[i.produit_nom] || 0) + i.quantite
  }))
  const topProd = Object.entries(prodsCnt).sort((a, b) => b[1] - a[1])[0]?.[0] || "—"

  // Score RFM simple
  const daysSinceLast = client.derniere_commande
    ? Math.floor((Date.now() - new Date(client.derniere_commande).getTime()) / 86400000)
    : 999
  const rfmScore = Math.min(10, Math.max(1,
    (nbCmd > 10 ? 4 : nbCmd > 5 ? 3 : nbCmd > 2 ? 2 : 1) +
    (caTotal > 500 ? 3 : caTotal > 200 ? 2 : 1) +
    (daysSinceLast < 30 ? 3 : daysSinceLast < 90 ? 2 : 1)
  ))
  const rfmBadge = rfmScore >= 8 ? "⭐" : rfmScore >= 6 ? "🥈" : rfmScore >= 4 ? "🥉" : "💤"

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-end z-50">
      <div className="bg-[#111111] border-l border-zinc-800 w-full max-w-lg h-full flex flex-col shadow-2xl">

        {/* Header */}
        <div className="p-6 border-b border-zinc-800">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-4">
              {/* Avatar */}
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-zinc-700 shrink-0">
                  {client.avatar_url ? (
                    <img src={client.avatar_url} alt={client.nom} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-black text-lg font-bold"
                      style={{ backgroundColor: getAvatarColor(client.id) }}>
                      {getInitials(client.nom)}
                    </div>
                  )}
                </div>
                <button onClick={() => fileRef.current?.click()} disabled={uploading}
                  className="absolute -bottom-1 -right-1 w-6 h-6 bg-yellow-500 hover:bg-yellow-400 rounded-full flex items-center justify-center shadow-lg transition-colors">
                  <Camera size={11} className="text-black" />
                </button>
                <input ref={fileRef} type="file" accept="image/*" onChange={uploadAvatar} className="hidden" />
              </div>
              <div>
                <h2 className="text-white font-bold text-lg leading-tight">{client.nom}</h2>
                <ContratBadge contrat={client.contrat} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-center">
                <p className="text-2xl">{rfmBadge}</p>
                <p className="text-yellow-500 text-xs font-bold">{rfmScore}/10</p>
                <p className="text-zinc-600 text-[9px]">Score RFM</p>
              </div>
              <button onClick={onClose} className="text-zinc-500 hover:text-white ml-2"><X size={18} /></button>
            </div>
          </div>

          {/* Infos contact */}
          <div className="space-y-1.5 mb-4">
            {client.email && <div className="flex items-center gap-2 text-zinc-400 text-xs"><Mail size={11} className="text-zinc-600 shrink-0" />{client.email}</div>}
            {client.telephone && <div className="flex items-center gap-2 text-zinc-400 text-xs"><Phone size={11} className="text-zinc-600 shrink-0" />{client.telephone}</div>}
            {client.adresse && <div className="flex items-center gap-2 text-zinc-400 text-xs"><MapPin size={11} className="text-zinc-600 shrink-0" />{client.adresse}</div>}
            {client.derniere_commande && <div className="flex items-center gap-2 text-zinc-500 text-xs"><Clock size={11} className="text-zinc-600 shrink-0" />Dernière commande : {new Date(client.derniere_commande).toLocaleDateString("fr-FR")}</div>}
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {tags.map(tag => (
              <span key={tag} className="flex items-center gap-1 text-[11px] bg-zinc-800 border border-zinc-700 text-zinc-300 px-2 py-0.5 rounded-full">
                {tag}
                <button onClick={() => removeTag(tag)} className="text-zinc-600 hover:text-red-400 transition-colors"><X size={9} /></button>
              </span>
            ))}
            <div className="flex items-center gap-1">
              <input type="text" placeholder="+ Tag" value={newTag} onChange={e => setNewTag(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addTag(newTag)}
                className="text-[11px] bg-zinc-800 border border-zinc-700 rounded-full px-2 py-0.5 text-white placeholder-zinc-600 focus:outline-none w-16 focus:w-24 transition-all" />
            </div>
          </div>
          {/* Suggestions tags */}
          <div className="flex flex-wrap gap-1">
            {TAG_SUGGESTIONS.filter(t => !tags.includes(t)).slice(0, 5).map(t => (
              <button key={t} onClick={() => addTag(t)}
                className="text-[10px] text-zinc-600 hover:text-yellow-500 hover:bg-yellow-500/10 border border-zinc-800 px-2 py-0.5 rounded-full transition-colors">
                + {t}
              </button>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-zinc-800">
          {[
            { id: "historique", label: "🧾 Historique" },
            { id: "stats", label: "📊 Stats" },
            { id: "notes", label: "📝 Notes" },
          ].map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`flex-1 py-3 text-xs font-semibold transition-colors border-b-2 ${activeTab === t.id ? "border-yellow-500 text-yellow-500" : "border-transparent text-zinc-500 hover:text-zinc-300"}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto">

          {/* HISTORIQUE */}
          {activeTab === "historique" && (
            <div className="p-4 space-y-2">
              {loadingVentes ? (
                <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" /></div>
              ) : ventes.length === 0 ? (
                <div className="text-center py-12 text-zinc-600">
                  <ShoppingBag size={32} className="mx-auto mb-3 opacity-20" />
                  <p className="text-sm">Aucune commande</p>
                </div>
              ) : ventes.map(v => (
                <div key={v.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-3">
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-white text-sm font-semibold">{Number(v.total_ttc).toFixed(2)}€</p>
                    <p className="text-zinc-600 text-[11px]">{new Date(v.created_at).toLocaleDateString("fr-FR")}</p>
                  </div>
                  {v.vente_items?.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {v.vente_items.map((i: any) => (
                        <span key={i.id} className="text-[10px] bg-zinc-800 text-zinc-400 border border-zinc-700 px-1.5 py-0.5 rounded-full">
                          {i.produit_nom} ×{i.quantite}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2 mt-1.5">
                    <span className="text-zinc-600 text-[10px]">{v.paiement}</span>
                    {v.port > 0 && <span className="text-zinc-700 text-[10px]">Port: {Number(v.port).toFixed(2)}€</span>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* STATS */}
          {activeTab === "stats" && (
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "💰 CA Total", value: `${caTotal.toFixed(2)}€`, color: "text-yellow-500" },
                  { label: "📦 Commandes", value: String(nbCmd), color: "text-blue-400" },
                  { label: "🛒 Panier moyen", value: `${panierMoyen.toFixed(2)}€`, color: "text-green-400" },
                  { label: "🏆 Produit favori", value: topProd, color: "text-purple-400" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                    <p className="text-zinc-500 text-[11px] mb-1">{label}</p>
                    <p className={`font-bold text-sm ${color} truncate`}>{value}</p>
                  </div>
                ))}
              </div>

              {/* Score RFM détaillé */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                <p className="text-zinc-400 text-xs font-semibold mb-3">Score RFM — Fidélité client</p>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-3xl">{rfmBadge}</span>
                  <div className="flex-1">
                    <div className="w-full bg-zinc-800 rounded-full h-2">
                      <div className="bg-yellow-500 h-2 rounded-full transition-all" style={{ width: `${rfmScore * 10}%` }} />
                    </div>
                    <p className="text-yellow-500 text-xs font-bold mt-1">{rfmScore}/10</p>
                  </div>
                </div>
                <div className="space-y-1 text-[11px] text-zinc-500">
                  <p>• Récence : {daysSinceLast < 999 ? `${daysSinceLast} jours` : "Jamais commandé"}</p>
                  <p>• Fréquence : {nbCmd} commande{nbCmd > 1 ? "s" : ""}</p>
                  <p>• Montant total : {caTotal.toFixed(2)}€</p>
                </div>
              </div>

              {/* Top produits */}
              {Object.keys(prodsCnt).length > 0 && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                  <p className="text-zinc-400 text-xs font-semibold mb-3">Produits achetés</p>
                  <div className="space-y-2">
                    {Object.entries(prodsCnt).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([nom, qty]) => (
                      <div key={nom} className="flex justify-between items-center">
                        <span className="text-zinc-300 text-xs truncate flex-1">{nom}</span>
                        <span className="text-yellow-500 text-xs font-bold ml-2">{qty} u.</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* NOTES */}
          {activeTab === "notes" && (
            <div className="p-4">
              <p className="text-zinc-500 text-xs mb-2">Notes internes sur ce client</p>
              <textarea value={noteText} onChange={e => setNoteText(e.target.value)} rows={8}
                placeholder="Préférences, informations importantes, rappels..."
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-500/50 resize-none mb-3" />
              <button onClick={saveNote} disabled={savingNote}
                className="w-full bg-yellow-500 hover:bg-yellow-400 disabled:opacity-40 text-black font-bold py-2.5 rounded-xl text-sm transition-colors">
                {savingNote ? "Sauvegarde..." : "💾 Sauvegarder les notes"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── CLIENT CARD ─────────────────────────────── */
function ClientCard({ client, onEdit, onDelete, onOpen, isRelanceDepassee }: {
  client: Client; onEdit: () => void; onDelete: () => void; onOpen: () => void; isRelanceDepassee: boolean
}) {
  return (
    <div onClick={onOpen} className={`group relative bg-zinc-900 rounded-2xl overflow-hidden border transition-all duration-200 cursor-pointer ${
      isRelanceDepassee ? "border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.1)]" : "border-zinc-800 hover:border-yellow-500/40"
    }`}>
      {isRelanceDepassee && <div className="h-0.5 w-full bg-red-500" />}
      {!isRelanceDepassee && <div className="h-0.5 w-full bg-gradient-to-r from-yellow-500/0 via-yellow-500 to-yellow-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />}

      <div className="p-5">
        <div className="flex items-start gap-3 mb-3">
          {/* Avatar */}
          <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-zinc-700">
            {client.avatar_url ? (
              <img src={client.avatar_url} alt={client.nom} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-black text-sm font-bold"
                style={{ backgroundColor: getAvatarColor(client.id) }}>
                {getInitials(client.nom)}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-white text-sm leading-tight truncate mb-1">{client.nom}</h3>
            <ContratBadge contrat={client.contrat} />
          </div>
          {isRelanceDepassee && (
            <div className="flex items-center gap-1 bg-red-500/10 border border-red-500/30 text-red-400 text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 animate-pulse">
              <AlertTriangle size={9} /> Relance
            </div>
          )}
        </div>

        {/* Infos */}
        <div className="space-y-1.5 mb-3">
          {client.email && <div className="flex items-center gap-2 text-[11px] text-zinc-500"><Mail size={10} className="shrink-0" /><span className="truncate">{client.email}</span></div>}
          {client.telephone && <div className="flex items-center gap-2 text-[11px] text-zinc-500"><Phone size={10} className="shrink-0" />{client.telephone}</div>}
          {client.derniere_commande && <div className="flex items-center gap-2 text-[11px] text-zinc-600"><Clock size={10} className="shrink-0" />Dernière : {new Date(client.derniere_commande).toLocaleDateString("fr-FR")}</div>}
        </div>

        {/* Tags */}
        {client.tags && client.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {client.tags.slice(0, 3).map(t => (
              <span key={t} className="text-[10px] bg-zinc-800 border border-zinc-700 text-zinc-400 px-1.5 py-0.5 rounded-full">{t}</span>
            ))}
            {client.tags.length > 3 && <span className="text-[10px] text-zinc-600">+{client.tags.length - 3}</span>}
          </div>
        )}

        <div className="border-t border-zinc-800 pt-3 flex items-center gap-2">
          <button onClick={e => { e.stopPropagation(); onEdit() }}
            className="flex items-center gap-1.5 text-[11px] font-semibold text-blue-400 bg-blue-400/10 border border-blue-400/20 px-2.5 py-1.5 rounded-lg hover:bg-blue-400/20 transition-colors">
            <Pencil size={11} /> Modifier
          </button>
          <button onClick={e => { e.stopPropagation(); onDelete() }}
            className="ml-auto text-red-400 bg-red-400/10 border border-red-400/20 p-1.5 rounded-lg hover:bg-red-400/20 transition-colors">
            <Trash2 size={11} />
          </button>
          <ChevronRight size={13} className="text-zinc-600 group-hover:text-yellow-500 transition-colors" />
        </div>
      </div>
    </div>
  )
}

/* ── PANEL NOUVEAU/MODIFIER ──────────────────── */
function ClientPanel({ client, onSave, onClose }: {
  client: any; onSave: (c: any) => void; onClose: () => void
}) {
  const [form, setForm] = useState({ ...client })
  const isEdit = !!client.id

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-end z-50">
      <div className="bg-[#111111] border-l border-zinc-800 w-full max-w-sm h-full flex flex-col shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <div>
            <h3 className="text-base font-bold text-white">{isEdit ? "Modifier le client" : "Nouveau client"}</h3>
            <p className="text-xs text-zinc-500 mt-0.5">{isEdit ? form.nom : "Ajouter au carnet"}</p>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white"><X size={18} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {[
            { key: "nom",       label: "Nom complet",  placeholder: "Jean Dupont" },
            { key: "email",     label: "Email",        placeholder: "jean@email.com",  type: "email" },
            { key: "telephone", label: "Téléphone",    placeholder: "06 12 34 56 78", type: "tel" },
            { key: "adresse",   label: "Adresse",      placeholder: "12 rue de la Paix" },
          ].map(({ key, label, placeholder, type }) => (
            <div key={key}>
              <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">{label}</label>
              <input type={type || "text"} placeholder={placeholder} value={form[key] || ""}
                onChange={e => setForm((p: any) => ({ ...p, [key]: e.target.value }))}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-500/60" />
            </div>
          ))}
          <div>
            <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Contrat</label>
            <div className="grid grid-cols-2 gap-2">
              {CONTRATS.map(c => (
                <button key={c} onClick={() => setForm((p: any) => ({ ...p, contrat: c }))}
                  className={`py-2 rounded-xl text-xs font-semibold border transition-colors ${form.contrat === c ? "bg-yellow-500 text-black border-yellow-500" : "bg-zinc-800 text-zinc-400 border-zinc-700 hover:border-zinc-500"}`}>
                  {c}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Délai relance (jours)</label>
            <input type="number" value={form.relance || 30}
              onChange={e => setForm((p: any) => ({ ...p, relance: parseInt(e.target.value) || 30 }))}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-500/60" />
          </div>
        </div>
        <div className="p-6 border-t border-zinc-800 space-y-3">
          <button onClick={() => onSave(form)} disabled={!form.nom?.trim()}
            className="w-full bg-yellow-500 hover:bg-yellow-400 disabled:opacity-40 text-black font-bold py-3 rounded-xl text-sm flex items-center justify-center gap-2">
            <Plus size={15} /> {isEdit ? "Sauvegarder" : "Ajouter le client"}
          </button>
          <button onClick={onClose} className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold py-2.5 rounded-xl text-sm">Annuler</button>
        </div>
      </div>
    </div>
  )
}

/* ── MAIN ───────────────────────────────────── */
export default function ClientsModule({ activeSociety, profile }: Props) {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filterContrat, setFilterContrat] = useState("Tous")
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [editingClient, setEditingClient] = useState<any>(null)
  const [showPanel, setShowPanel] = useState(false)

  useEffect(() => { if (activeSociety) loadClients() }, [activeSociety])

  const loadClients = async () => {
    setLoading(true)
    const { data } = await supabase.from("clients").select("*")
      .eq("society_id", activeSociety.id).order("nom")
    setClients(data || [])
    setLoading(false)
  }

  const isRelanceDepassee = (c: Client) => {
    if (!c.derniere_commande || c.contrat === "Aucun") return false
    const days = Math.floor((Date.now() - new Date(c.derniere_commande).getTime()) / 86400000)
    const limit = contratConfig[c.contrat]?.relanceDays ?? 30
    return days > limit
  }

  const saveClient = async (form: any) => {
    const payload = {
      society_id: activeSociety.id,
      nom: form.nom.trim(),
      email: form.email || "",
      telephone: form.telephone || "",
      adresse: form.adresse || "",
      contrat: form.contrat || "Aucun",
      relance: form.relance || 30,
    }
    if (form.id) {
      await supabase.from("clients").update(payload).eq("id", form.id)
    } else {
      await supabase.from("clients").insert(payload)
    }
    setEditingClient(null)
    setShowPanel(false)
    loadClients()
  }

  const deleteClient = async (id: string) => {
    if (!confirm("Supprimer ce client ?")) return
    await supabase.from("clients").delete().eq("id", id)
    loadClients()
  }

  const filtered = clients.filter(c => {
    const matchSearch = c.nom.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase())
    const matchContrat = filterContrat === "Tous" || c.contrat === filterContrat
    return matchSearch && matchContrat
  })

  const relancesEnRetard = clients.filter(isRelanceDepassee).length
  const contratsActifs = clients.filter(c => c.contrat !== "Aucun").length

  return (
    <div className="flex-1 overflow-y-auto bg-[#0a0a0a]">
      <div className="p-6 max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">👤 Clients</h1>
            <p className="text-sm text-zinc-500 mt-0.5">{clients.length} client{clients.length > 1 ? "s" : ""}</p>
          </div>
          <button onClick={() => { setEditingClient(emptyClient); setShowPanel(true) }}
            className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-4 py-2.5 rounded-xl text-sm shadow-lg shadow-yellow-500/20">
            <Plus size={16} /> Nouveau client
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <p className="text-zinc-500 text-[11px] uppercase tracking-wider mb-1">Total clients</p>
            <p className="text-2xl font-bold text-yellow-500">{clients.length}</p>
          </div>
          <div className={`border rounded-2xl p-5 ${relancesEnRetard > 0 ? "bg-red-950/30 border-red-500/30" : "bg-zinc-900 border-zinc-800"}`}>
            <p className="text-zinc-500 text-[11px] uppercase tracking-wider mb-1">Relances en retard</p>
            <p className={`text-2xl font-bold ${relancesEnRetard > 0 ? "text-red-400" : "text-green-400"}`}>{relancesEnRetard}</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <p className="text-zinc-500 text-[11px] uppercase tracking-wider mb-1">Contrats actifs</p>
            <p className="text-2xl font-bold text-purple-400">{contratsActifs}</p>
          </div>
        </div>

        {/* Filtres */}
        <div className="flex items-center gap-3 mb-5 flex-wrap">
          <div className="relative flex-1 max-w-xs">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input type="text" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-500/50" />
          </div>
          <div className="flex gap-2 flex-wrap">
            {["Tous", ...CONTRATS].map(c => (
              <button key={c} onClick={() => setFilterContrat(c)}
                className={`text-[11px] font-semibold px-3 py-2 rounded-lg border transition-colors ${filterContrat === c ? "bg-yellow-500 text-black border-yellow-500" : "text-zinc-400 border-zinc-800 bg-zinc-900 hover:border-zinc-600"}`}>
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-zinc-600">
            <Users size={36} className="mx-auto mb-3 opacity-20" />
            <p className="text-sm">Aucun client trouvé</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map(c => (
              <ClientCard key={c.id} client={c}
                isRelanceDepassee={isRelanceDepassee(c)}
                onOpen={() => setSelectedClient(c)}
                onEdit={() => { setEditingClient(c); setShowPanel(true) }}
                onDelete={() => deleteClient(c.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Fiche client */}
      {selectedClient && (
        <ClientFiche
          client={selectedClient}
          societyId={activeSociety.id}
          profile={profile}
          onClose={() => setSelectedClient(null)}
          onUpdated={() => { loadClients(); setSelectedClient(null) }}
        />
      )}

      {/* Panel nouveau/modifier */}
      {showPanel && editingClient && (
        <ClientPanel
          client={editingClient}
          onSave={saveClient}
          onClose={() => { setShowPanel(false); setEditingClient(null) }}
        />
      )}
    </div>
  )
}