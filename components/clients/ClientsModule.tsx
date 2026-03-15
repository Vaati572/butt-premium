"use client"

import { useEffect, useState, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import {
  Plus, X, Search, Phone, Mail, MapPin, User,
  Pencil, Trash2, ChevronRight, Tag, Calendar,
  Star, Package, Euro, Check, TrendingUp
} from "lucide-react"

interface Props { activeSociety: any; profile: any }

interface Client {
  id: string; nom: string; prenom?: string; email?: string; telephone?: string
  adresse?: string; ville?: string; cp?: string; contrat?: string
  notes?: string; tags?: string[]; created_at?: string; avatar_url?: string
  statut?: string; ca_total?: number; latitude?: number; longitude?: number
}

interface Product { id: string; name: string; gamme: string; pv: number }

const CONTRATS = ["Particuliers", "Professionnels", "Particulier", "Professionnel", "Pharmacie", "Grossiste", "Revendeur", "Convention"]

const FIDELITE_TIERS: { id: string; label: string; cardColor: string | null }[] = [
  { id: "aucun",       label: "Aucun",          cardColor: null },
  { id: "essentielle", label: "Essentielle 🥉", cardColor: "#cd7f32" },
  { id: "avantage",    label: "Avantage 🥈",    cardColor: "#94a3b8" },
  { id: "elite",       label: "Elite 🥇",       cardColor: "#eab308" },
  { id: "proteam",     label: "ProTeam 💎",     cardColor: "#a855f7" },
]
const getFideliteConfig = (tier?: string) => FIDELITE_TIERS.find(t => t.id === tier) || FIDELITE_TIERS[0]
const STATUTS  = [
  { id: "actif",   label: "Actif",    color: "text-green-400 bg-green-400/10 border-green-400/20" },
  { id: "inactif", label: "Inactif",  color: "text-zinc-500 bg-zinc-800 border-zinc-700" },
  { id: "vip",     label: "VIP ⭐",   color: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20" },
]

function initials(nom: string) {
  return (nom || "?").split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
}

/* ── TARIFS PERSO PANEL ───────────────────── */
function TarifsPanel({
  client, societyId, onClose
}: { client: Client; societyId: string; onClose: () => void }) {
  const [products, setProducts]   = useState<Product[]>([])
  const [prixMap, setPrixMap]     = useState<Record<string, number>>({})
  const [baseGamme, setBaseGamme] = useState<"Particuliers"|"Professionnels">("Particuliers")
  const [saving, setSaving]       = useState(false)
  const [saved, setSaved]         = useState(false)

  useEffect(() => {
    const load = async () => {
      const [{ data: prods }, { data: clientPrix }] = await Promise.all([
        supabase.from("products").select("id,name,gamme,pv").eq("society_id", societyId).order("gamme").order("name"),
        supabase.from("client_prix").select("*").eq("client_id", client.id),
      ])
      setProducts(prods || [])
      const map: Record<string, number> = {}
      ;(clientPrix || []).forEach((p: any) => { map[p.product_id] = p.prix })
      setPrixMap(map)
    }
    load()
  }, [client.id, societyId])

  const applyBaseGamme = () => {
    const map: Record<string, number> = { ...prixMap }
    products.forEach(p => {
      if (p.gamme === baseGamme) map[p.id] = Number(p.pv)
    })
    setPrixMap(map)
  }

  const saveTarifs = async () => {
    setSaving(true)
    // Delete all existing prices for this client, then re-insert
    await supabase.from("client_prix").delete().eq("client_id", client.id)
    const rows = Object.entries(prixMap)
      .filter(([_, prix]) => prix > 0)
      .map(([product_id, prix]) => ({ client_id: client.id, product_id, prix }))
    if (rows.length > 0) await supabase.from("client_prix").insert(rows)
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const gammes = [...new Set(products.map(p => p.gamme))]

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-end z-50">
      <div className="bg-[#111111] border-l border-zinc-800 w-full max-w-lg h-full flex flex-col shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-zinc-800">
          <div>
            <h3 className="text-base font-bold text-white">💰 Tarifs perso — {client.nom}</h3>
            <p className="text-zinc-500 text-xs mt-0.5">Prix spécifiques pour ce client</p>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white"><X size={18}/></button>
        </div>

        {/* Apply base gamme */}
        <div className="px-5 py-3 border-b border-zinc-800 flex items-center gap-3">
          <p className="text-zinc-400 text-xs">Partir des prix :</p>
          <div className="flex gap-1.5">
            {(["Particuliers","Professionnels"] as const).map(g => (
              <button key={g} onClick={() => setBaseGamme(g)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${baseGamme===g ? "bg-yellow-500 text-black border-yellow-500" : "bg-zinc-800 text-zinc-400 border-zinc-700"}`}>
                {g === "Particuliers" ? "👤 Particuliers" : "🏢 Pro"}
              </button>
            ))}
          </div>
          <button onClick={applyBaseGamme}
            className="flex items-center gap-1 text-xs text-blue-400 bg-blue-400/10 border border-blue-400/20 px-2.5 py-1.5 rounded-lg hover:bg-blue-400/20">
            ↩ Appliquer
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {gammes.map(gamme => (
            <div key={gamme}>
              <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-2">{gamme}</p>
              <div className="space-y-2">
                {products.filter(p => p.gamme === gamme).map(p => (
                  <div key={p.id} className="flex items-center gap-3 bg-zinc-800/60 border border-zinc-700 rounded-xl px-4 py-2.5">
                    <p className="flex-1 text-sm text-white truncate">{p.name}</p>
                    <p className="text-zinc-500 text-xs shrink-0">PV: {Number(p.pv).toFixed(2)}€</p>
                    <div className="relative w-24">
                      <input
                        type="number" min="0" step="0.01"
                        value={prixMap[p.id] ?? ""}
                        onChange={e => setPrixMap(prev => ({ ...prev, [p.id]: parseFloat(e.target.value) || 0 }))}
                        placeholder={Number(p.pv).toFixed(2)}
                        className="w-full bg-zinc-700 border border-zinc-600 rounded-lg px-3 py-1.5 text-sm text-white text-right focus:outline-none focus:border-yellow-500/60"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 text-[10px]">€</span>
                    </div>
                    {prixMap[p.id] != null && prixMap[p.id] !== Number(p.pv) && (
                      <span className={`text-[10px] font-bold shrink-0 ${prixMap[p.id] < Number(p.pv) ? "text-blue-400" : "text-red-400"}`}>
                        {prixMap[p.id] < Number(p.pv) ? "▼" : "▲"}{Math.abs(prixMap[p.id] - Number(p.pv)).toFixed(2)}€
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="p-5 border-t border-zinc-800 flex gap-3">
          <button onClick={saveTarifs} disabled={saving}
            className={`flex-1 font-bold py-3 rounded-xl text-sm transition-all flex items-center justify-center gap-2 ${saved ? "bg-green-500 text-white" : "bg-yellow-500 hover:bg-yellow-400 text-black disabled:opacity-40"}`}>
            {saved ? <><Check size={15}/> Sauvegardé !</> : saving ? "Sauvegarde..." : "💾 Sauvegarder les tarifs"}
          </button>
          <button onClick={onClose} className="px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold rounded-xl text-sm">Fermer</button>
        </div>
      </div>
    </div>
  )
}

/* ── CLIENT FORM ──────────────────────────── */
function ClientForm({
  societyId, profile, client, onClose, onDone
}: { societyId: string; profile: any; client?: Client; onClose: () => void; onDone: () => void }) {
  const [form, setForm] = useState({
    nom: client?.nom || "", prenom: client?.prenom || "",
    email: client?.email || "", telephone: client?.telephone || "",
    adresse: client?.adresse || "", ville: client?.ville || "", cp: client?.cp || "",
    contrat: client?.contrat || "Particulier", statut: client?.statut || "actif",
    fidelite: (client as any)?.fidelite || "aucun",
    latitude: String((client as any)?.latitude || ""),
    longitude: String((client as any)?.longitude || ""),
    notes: client?.notes || "", tags: (client?.tags || []).join(", "),
  })
  const [saving, setSaving] = useState(false)
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  const save = async () => {
    if (!form.nom.trim()) return
    setSaving(true)
    const data = {
      society_id: societyId, user_id: profile.id,
      nom: form.nom.trim(), prenom: form.prenom,
      email: form.email, telephone: form.telephone,
      adresse: form.adresse, ville: form.ville, cp: form.cp,
      contrat: form.contrat, statut: form.statut, notes: form.notes,
      fidelite: (form as any).fidelite || "aucun",
      latitude: (form as any).latitude ? parseFloat((form as any).latitude) : null,
      longitude: (form as any).longitude ? parseFloat((form as any).longitude) : null,
      tags: form.tags.split(",").map((t: string) => t.trim()).filter(Boolean),
    }
    if (client?.id) await supabase.from("clients").update(data).eq("id", client.id)
    else await supabase.from("clients").insert(data)
    setSaving(false); onDone(); onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-end z-50">
      <div className="bg-[#111111] border-l border-zinc-800 w-full max-w-md h-full flex flex-col shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-zinc-800">
          <h3 className="text-base font-bold text-white">{client ? "Modifier" : "Nouveau"} client</h3>
          <button onClick={onClose} className="text-zinc-500 hover:text-white"><X size={18}/></button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Identité */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Prénom</label>
              <input value={form.prenom} onChange={e => set("prenom", e.target.value)} placeholder="Prénom"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-500/60"/>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Nom *</label>
              <input value={form.nom} onChange={e => set("nom", e.target.value)} placeholder="Nom"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-500/60"/>
            </div>
          </div>

          {[
            { label: "Téléphone", key: "telephone", placeholder: "06 xx xx xx xx", icon: "📞" },
            { label: "Email",     key: "email",     placeholder: "email@exemple.com", icon: "✉️" },
          ].map(({ label, key, placeholder, icon }) => (
            <div key={key}>
              <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">{icon} {label}</label>
              <input value={(form as any)[key]} onChange={e => set(key, e.target.value)} placeholder={placeholder}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-500/60"/>
            </div>
          ))}

          {/* Adresse */}
          <div>
            <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">📍 Adresse</label>
            <input value={form.adresse} onChange={e => set("adresse", e.target.value)} placeholder="Numéro + Rue"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none mb-2"/>
            <div className="grid grid-cols-3 gap-2">
              <input value={form.cp} onChange={e => set("cp", e.target.value)} placeholder="Code postal"
                className="bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"/>
              <input value={form.ville} onChange={e => set("ville", e.target.value)} placeholder="Ville"
                className="col-span-2 bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"/>
            </div>
          </div>

          {/* Contrat + Statut */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Type</label>
              <select value={form.contrat} onChange={e => set("contrat", e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none">
                {CONTRATS.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Statut</label>
              <select value={form.statut} onChange={e => set("statut", e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none">
                {STATUTS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">🏷️ Tags <span className="normal-case text-zinc-600 font-normal">(séparés par virgule)</span></label>
            <input value={form.tags} onChange={e => set("tags", e.target.value)} placeholder="fidèle, pro, convention..."
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none"/>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">📝 Notes</label>
            <textarea value={form.notes} onChange={e => set("notes", e.target.value)} rows={3}
              placeholder="Informations complémentaires..."
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none resize-none"/>
          </div>
        </div>

        <div className="p-5 border-t border-zinc-800 flex gap-3">
          <button onClick={save} disabled={saving || !form.nom.trim()}
            className="flex-1 bg-yellow-500 hover:bg-yellow-400 disabled:opacity-40 text-black font-bold py-3 rounded-xl text-sm">
            {saving ? "Sauvegarde..." : client ? "Modifier" : "Créer le client"}
          </button>
          <button onClick={onClose} className="px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold rounded-xl text-sm">Annuler</button>
        </div>
      </div>
    </div>
  )
}

/* ── CLIENT CARD ──────────────────────────── */
function ClientCard({ client, accentColor, onEdit, onDelete, onTarifs }: {
  client: Client & { ca_total?: number; nb_achats?: number }
  accentColor: string
  onEdit: () => void
  onDelete: () => void
  onTarifs: () => void
}) {
  const statut   = STATUTS.find(s => s.id === (client.statut || "actif")) || STATUTS[0]
  const colors   = ["#d97706","#7c3aed","#db2777","#059669","#2563eb","#dc2626"]
  const avatarBg = colors[(client.nom?.charCodeAt(0) || 0) % colors.length]
  const hasCA    = (client.ca_total || 0) > 0
  const isVIP    = client.statut === "vip"
  const fidelite      = getFideliteConfig((client as any).fidelite)
  const cardBorderColor: string = fidelite.cardColor || ""
  const hasBorderColor = cardBorderColor !== ""

  return (
    <div className="group relative bg-[#111111] border border-zinc-800/80 rounded-2xl overflow-hidden transition-all duration-200 hover:border-zinc-600 hover:shadow-xl hover:shadow-black/40 flex flex-col"
      style={{
        borderColor: hasBorderColor ? cardBorderColor+"70" : (isVIP ? accentColor+"50" : "#27272a"),
        ...(hasBorderColor ? { boxShadow: `0 0 16px ${cardBorderColor}20` } : isVIP ? { boxShadow: `0 0 20px ${accentColor}10` } : {}),
      }}>

      {/* Accent bar top */}
      <div className="h-0.5 w-full" style={{ background: `linear-gradient(90deg, ${hasBorderColor ? cardBorderColor : avatarBg}90, transparent)` }}/>

      {/* HEADER — Avatar + Nom + actions */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3">
        {/* Avatar */}
        <div className="relative shrink-0">
          <div className="w-11 h-11 rounded-xl overflow-hidden flex items-center justify-center text-white font-black text-sm ring-2 ring-black"
            style={{ backgroundColor: client.avatar_url ? "#18181b" : avatarBg }}>
            {client.avatar_url
              ? <img src={client.avatar_url} alt={client.nom} className="w-full h-full object-cover"/>
              : initials(client.nom)
            }
          </div>
          {/* Statut dot */}
          <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full ring-2 ring-[#111111] ${
            client.statut === "vip" ? "bg-yellow-400" :
            client.statut === "inactif" ? "bg-zinc-600" :
            "bg-green-400"
          }`}/>
        </div>

        {/* Nom + type */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <p className="text-white font-bold text-sm leading-tight truncate">
              {client.prenom ? `${client.prenom} ` : ""}{client.nom}
            </p>
            {isVIP && <span className="text-[10px]">⭐</span>}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            {fidelite.id !== "aucun" && hasBorderColor && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md text-black"
                style={{ backgroundColor: cardBorderColor }}>
                {fidelite.label}
              </span>
            )}
            {client.contrat && client.contrat !== "Aucun" && (
              <span className="text-[10px] font-semibold text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded-md">
                {client.contrat}
              </span>
            )}
            {(client.tags || []).slice(0, 2).map(tag => (
              <span key={tag} className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md"
                style={{ color: accentColor, backgroundColor: accentColor+"18" }}>
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Actions — toujours visibles */}
        <div className="flex items-center gap-0.5 shrink-0">
          <button onClick={onTarifs} className="w-7 h-7 flex items-center justify-center text-blue-400 hover:text-blue-300 rounded-lg hover:bg-blue-400/10 transition-colors" title="Tarifs perso">
            <Euro size={13}/>
          </button>
          <button onClick={onEdit} className="w-7 h-7 flex items-center justify-center text-zinc-500 hover:text-white rounded-lg hover:bg-zinc-700 transition-colors">
            <Pencil size={13}/>
          </button>
          <button onClick={onDelete} className="w-7 h-7 flex items-center justify-center text-zinc-700 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-colors">
            <Trash2 size={13}/>
          </button>
        </div>
      </div>

      {/* SÉPARATEUR */}
      <div className="mx-4 h-px bg-zinc-800/60"/>

      {/* INFOS CONTACT */}
      <div className="px-4 py-3 space-y-1.5 flex-1">
        {client.telephone && (
          <a href={`tel:${client.telephone}`}
            className="flex items-center gap-2.5 group/link">
            <div className="w-5 h-5 rounded-md bg-zinc-800 flex items-center justify-center shrink-0">
              <Phone size={10} className="text-zinc-400"/>
            </div>
            <span className="text-zinc-300 text-xs font-medium group-hover/link:text-white transition-colors">
              {client.telephone}
            </span>
          </a>
        )}
        {client.email && (
          <a href={`mailto:${client.email}`}
            className="flex items-center gap-2.5 group/link">
            <div className="w-5 h-5 rounded-md bg-zinc-800 flex items-center justify-center shrink-0">
              <Mail size={10} className="text-zinc-400"/>
            </div>
            <span className="text-zinc-400 text-xs truncate group-hover/link:text-white transition-colors">
              {client.email}
            </span>
          </a>
        )}
        {(client.adresse || client.ville) && (
          <div className="flex items-start gap-2.5">
            <div className="w-5 h-5 rounded-md bg-zinc-800 flex items-center justify-center shrink-0 mt-0.5">
              <MapPin size={10} className="text-zinc-400"/>
            </div>
            <span className="text-zinc-500 text-xs leading-snug">
              {[client.adresse, client.cp && client.ville ? `${client.cp} ${client.ville}` : client.ville].filter(Boolean).join(", ")}
            </span>
          </div>
        )}
        {client.notes && (
          <div className="flex items-start gap-2.5 pt-0.5">
            <div className="w-5 h-5 rounded-md bg-zinc-800/60 flex items-center justify-center shrink-0 mt-0.5">
              <span className="text-[9px]">📝</span>
            </div>
            <p className="text-zinc-500 text-[11px] italic leading-relaxed line-clamp-2">
              {client.notes}
            </p>
          </div>
        )}
      </div>

      {/* FOOTER — CA + stats */}
      <div className="mx-4 h-px bg-zinc-800/60"/>
      <div className="px-4 py-2.5 flex items-center justify-between">
        {/* CA */}
        <div className="flex items-center gap-1.5">
          <TrendingUp size={11} style={{ color: hasCA ? accentColor : "#52525b" }}/>
          <span className={`text-xs font-bold ${hasCA ? "" : "text-zinc-600"}`}
            style={hasCA ? { color: accentColor } : {}}>
            {(client.ca_total || 0).toFixed(2)}€
          </span>
          {(client.nb_achats || 0) > 0 && (
            <>
              <span className="text-zinc-700 text-[10px]">·</span>
              <span className="text-zinc-500 text-[10px]">{client.nb_achats} achat{(client.nb_achats||0)>1?"s":""}</span>
            </>
          )}
        </div>

        {/* Date */}
        {client.created_at && (
          <div className="flex items-center gap-1">
            <Calendar size={10} className="text-zinc-700"/>
            <span className="text-zinc-700 text-[10px]">
              {new Date(client.created_at).toLocaleDateString("fr-FR", { month:"short", year:"numeric" })}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════
   MAIN
══════════════════════════════════════════════ */
export default function ClientsModule({ activeSociety, profile }: Props) {
  const [clients, setClients]       = useState<any[]>([])
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState("")
  const [filterContrat, setFilterContrat] = useState("all")
  const [filterStatut, setFilterStatut]   = useState("all")
  const [showForm, setShowForm]     = useState(false)
  const [editClient, setEditClient] = useState<Client | null>(null)
  const [tarifsClient, setTarifsClient] = useState<Client | null>(null)
  const [sortBy, setSortBy]         = useState<"nom"|"ca"|"date">("nom")

  const load = useCallback(async () => {
    if (!activeSociety?.id) return
    setLoading(true)
    // Load clients + their CA
    const { data: cls } = await supabase.from("clients")
      .select("*").eq("society_id", activeSociety.id).order("nom")

    if (!cls) { setLoading(false); return }

    // Load CA per client from ventes
    const { data: ventes } = await supabase.from("ventes")
      .select("client_id, total_ttc")
      .eq("society_id", activeSociety.id)
      .not("client_id", "is", null)

    const caMap: Record<string, { total: number; count: number }> = {}
    ;(ventes || []).forEach((v: any) => {
      if (!caMap[v.client_id]) caMap[v.client_id] = { total: 0, count: 0 }
      caMap[v.client_id].total += Number(v.total_ttc || 0)
      caMap[v.client_id].count += 1
    })

    const enriched = cls.map(c => ({
      ...c,
      ca_total: caMap[c.id]?.total || 0,
      nb_achats: caMap[c.id]?.count || 0,
    }))

    setClients(enriched)
    setLoading(false)
  }, [activeSociety?.id])

  useEffect(() => { load() }, [load])

  const deleteClient = async (id: string) => {
    if (!confirm("Supprimer ce client ?")) return
    await supabase.from("clients").delete().eq("id", id)
    setClients(prev => prev.filter(c => c.id !== id))
  }

  const filtered = clients
    .filter(c => {
      if (filterContrat !== "all" && c.contrat !== filterContrat) return false
      if (filterStatut !== "all" && (c.statut || "actif") !== filterStatut) return false
      if (search) {
        const s = search.toLowerCase()
        return c.nom?.toLowerCase().includes(s) || c.prenom?.toLowerCase().includes(s) ||
          c.email?.toLowerCase().includes(s) || c.telephone?.includes(s) ||
          c.ville?.toLowerCase().includes(s) || (c.tags||[]).some((t:string)=>t.toLowerCase().includes(s))
      }
      return true
    })
    .sort((a, b) => {
      if (sortBy === "ca") return (b.ca_total || 0) - (a.ca_total || 0)
      if (sortBy === "date") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      return a.nom.localeCompare(b.nom)
    })

  const accentColor = "#eab308"
  const totalCA = clients.reduce((s, c) => s + (c.ca_total || 0), 0)

  return (
    <div className="flex-1 overflow-y-auto bg-[#0a0a0a]">
      <div className="p-6 max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-white">👥 Clients</h1>
            <p className="text-zinc-500 text-sm mt-0.5">{clients.length} client{clients.length>1?"s":""} · CA total : <span className="text-yellow-400 font-bold">{totalCA.toFixed(2)}€</span></p>
          </div>
          <button onClick={() => { setEditClient(null); setShowForm(true) }}
            className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-4 py-2.5 rounded-xl text-sm shadow-lg shadow-yellow-500/20">
            <Plus size={16}/> Nouveau client
          </button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: "Clients actifs", value: clients.filter(c=>(c.statut||"actif")==="actif").length, sub: `${clients.filter(c=>c.statut==="vip").length} VIP` },
            { label: "CA moyen", value: clients.length > 0 ? (totalCA/clients.length).toFixed(0)+"€" : "—", sub: "par client" },
            { label: "Meilleur client", value: clients.length > 0 ? clients.sort((a,b)=>(b.ca_total||0)-(a.ca_total||0))[0]?.nom?.split(" ")[0] || "—" : "—", sub: clients.length > 0 ? (clients.sort((a,b)=>(b.ca_total||0)-(a.ca_total||0))[0]?.ca_total||0).toFixed(0)+"€" : "" },
          ].map(({ label, value, sub }) => (
            <div key={label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <p className="text-zinc-500 text-[10px] uppercase tracking-wider mb-1">{label}</p>
              <p className="text-white text-xl font-bold">{value}</p>
              {sub && <p className="text-zinc-600 text-xs mt-0.5">{sub}</p>}
            </div>
          ))}
        </div>

        {/* Filtres */}
        <div className="flex items-center gap-2 mb-5 flex-wrap">
          <div className="relative flex-1 min-w-[180px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"/>
            <input type="text" placeholder="Nom, email, ville, tag..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-500/50"/>
          </div>

          <select value={filterContrat} onChange={e => setFilterContrat(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none">
            <option value="all">Tous types</option>
            {CONTRATS.map(c => <option key={c}>{c}</option>)}
          </select>

          <select value={filterStatut} onChange={e => setFilterStatut(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none">
            <option value="all">Tous statuts</option>
            {STATUTS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>

          <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-xl p-1">
            {([["nom","A-Z"],["ca","CA ↓"],["date","Date"]] as const).map(([val,lbl])=>(
              <button key={val} onClick={()=>setSortBy(val as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${sortBy===val?"bg-zinc-700 text-white":"text-zinc-500 hover:text-zinc-300"}`}>
                {lbl}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin"/>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24 text-zinc-600">
            <User size={48} className="mx-auto mb-4 opacity-20"/>
            <p className="text-base font-semibold text-zinc-500 mb-2">Aucun client{search ? " trouvé" : ""}</p>
            {!search && (
              <button onClick={() => setShowForm(true)}
                className="mt-4 bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-5 py-2.5 rounded-xl text-sm inline-flex items-center gap-2">
                <Plus size={15}/> Créer un client
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map(client => (
              <ClientCard
                key={client.id}
                client={client}
                accentColor={accentColor}
                onEdit={() => { setEditClient(client); setShowForm(true) }}
                onDelete={() => deleteClient(client.id)}
                onTarifs={() => setTarifsClient(client)}
              />
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <ClientForm
          societyId={activeSociety.id} profile={profile}
          client={editClient || undefined}
          onClose={() => { setShowForm(false); setEditClient(null) }}
          onDone={load}
        />
      )}
      {tarifsClient && (
        <TarifsPanel
          client={tarifsClient} societyId={activeSociety.id}
          onClose={() => setTarifsClient(null)}
        />
      )}
    </div>
  )
}