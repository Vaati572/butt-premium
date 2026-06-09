"use client"

import { useEffect, useState, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import {
  Plus, X, Search, Phone, Mail, MapPin,
  Pencil, Trash2, Euro, Check, TrendingUp,
  ShoppingBag, ChevronUp, ChevronDown, ChevronsUpDown,
  FileText, Star, User, Calendar, Tag,
} from "lucide-react"

interface Props { activeSociety: any; profile: any }

interface Client {
  id: string; nom: string; prenom?: string; email?: string; telephone?: string
  adresse?: string; ville?: string; cp?: string; contrat?: string
  notes?: string; tags?: string[]; created_at?: string; avatar_url?: string
  statut?: string; ca_total?: number; nb_achats?: number
  latitude?: number; longitude?: number; nom_shop?: string
}

interface Vente {
  id: string; created_at: string; total_ttc: number
  lignes?: { produit_nom: string; quantite: number; prix_unitaire: number }[]
}

/* ── CONFIG CONTRATS ── */
const CONTRAT_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; badge: string }> = {
  "Aucun":      { label: "Aucun",      color: "text-zinc-500",   bg: "bg-zinc-800",        border: "border-zinc-700",        badge: ""             },
  "Essentielle":{ label: "Essentielle",color: "text-orange-400", bg: "bg-orange-500/10",   border: "border-orange-500/30",   badge: "🥉 Essentielle"},
  "Avantage":   { label: "Avantage",   color: "text-slate-300",  bg: "bg-slate-500/10",    border: "border-slate-500/30",    badge: "🥈 Avantage"  },
  "Élite":      { label: "Élite",      color: "text-yellow-400", bg: "bg-yellow-500/10",   border: "border-yellow-500/30",   badge: "🥇 Élite"     },
  "ProTeam":    { label: "ProTeam",    color: "text-purple-400", bg: "bg-purple-500/10",   border: "border-purple-500/30",   badge: "💎 ProTeam"   },
}
const CONTRAT_ACCENT: Record<string, string> = {
  "Aucun": "", "Essentielle": "#f97316", "Avantage": "#94a3b8", "Élite": "#eab308", "ProTeam": "#a855f7"
}
const CONTRATS = Object.keys(CONTRAT_CONFIG)

const STATUTS = [
  { id: "actif",   label: "Actif",    dot: "bg-green-400",  color: "text-green-400"  },
  { id: "vip",     label: "VIP ⭐",   dot: "bg-yellow-400", color: "text-yellow-400" },
  { id: "inactif", label: "Inactif",  dot: "bg-zinc-600",   color: "text-zinc-500"   },
]

const initials = (nom: string) =>
  (nom || "?").split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)

const avatarColors = ["#d97706","#7c3aed","#db2777","#059669","#2563eb","#dc2626","#0891b2","#65a30d"]
const getAvatarColor = (nom: string) => avatarColors[(nom?.charCodeAt(0) || 0) % avatarColors.length]

/* ══════════════════════════════════════════════
   GÉOLOCALISATION
══════════════════════════════════════════════ */
function GeolocButton({ adresse, cp, ville, onLocate, hasCoords, lat, lng }: {
  adresse?: string; cp?: string; ville?: string
  onLocate: (lat: number, lng: number) => void
  hasCoords: boolean; lat?: string; lng?: string
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState("")
  const geocode = async () => {
    const q = [adresse, cp, ville].filter(Boolean).join(", ")
    if (!q.trim()) { setError("Renseigne une adresse d'abord"); return }
    setLoading(true); setError("")
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=1`)
      const data = await res.json()
      if (data?.length) onLocate(parseFloat(data[0].lat), parseFloat(data[0].lon))
      else setError("Adresse introuvable")
    } catch { setError("Erreur réseau") }
    setLoading(false)
  }
  return (
    <div className="mt-2">
      <div className="flex items-center gap-2">
        <button type="button" onClick={geocode} disabled={loading}
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl border transition-colors disabled:opacity-40 bg-blue-500/10 border-blue-500/30 text-blue-400 hover:bg-blue-500/20">
          {loading ? <><div className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"/>Localisation...</> : "📍 Géolocaliser"}
        </button>
        {hasCoords && lat && lng && (
          <span className="text-[10px] text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-1 rounded-lg">
            ✓ {parseFloat(lat).toFixed(4)}, {parseFloat(lng).toFixed(4)}
          </span>
        )}
      </div>
      {error && <p className="text-red-400 text-[11px] mt-1">{error}</p>}
    </div>
  )
}

/* ══════════════════════════════════════════════
   FORMULAIRE CLIENT
══════════════════════════════════════════════ */
function ClientForm({ societyId, profile, client, onClose, onDone }: {
  societyId: string; profile: any; client?: Client; onClose: () => void; onDone: () => void
}) {
  const [form, setForm] = useState({
    nom: client?.nom || "", prenom: client?.prenom || "", nom_shop: client?.nom_shop || "",
    email: client?.email || "", telephone: client?.telephone || "",
    adresse: client?.adresse || "", ville: client?.ville || "", cp: client?.cp || "",
    contrat: client?.contrat || "Aucun", statut: client?.statut || "actif",
    latitude: String((client as any)?.latitude || ""), longitude: String((client as any)?.longitude || ""),
    notes: client?.notes || "", tags: (client?.tags || []).join(", "),
  })
  const [saving, setSaving] = useState(false)
  const set = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }))

  const save = async () => {
    if (!form.nom.trim()) return
    setSaving(true)
    const data: any = {
      society_id: societyId, nom: form.nom.trim(), prenom: form.prenom || null,
      nom_shop: form.nom_shop || null, email: form.email || null, telephone: form.telephone || null,
      adresse: form.adresse || null, ville: form.ville || null, cp: form.cp || null,
      contrat: form.contrat || "Aucun", statut: form.statut || "actif",
      notes: form.notes || null,
      tags: form.tags ? form.tags.split(",").map((t: string) => t.trim()).filter(Boolean) : [],
    }
    if (form.latitude)  data.latitude  = parseFloat(form.latitude)  || null
    if (form.longitude) data.longitude = parseFloat(form.longitude) || null

    let error = null
    if (client?.id) {
      const { error: e } = await supabase.from("clients").update(data).eq("id", client.id); error = e
    } else {
      const { error: e } = await supabase.from("clients").insert(data); error = e
    }
    setSaving(false)
    if (error) { alert("Erreur : " + error.message); return }
    onDone(); onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-end z-50">
      <div className="bg-[#111111] border-l border-zinc-800 w-full max-w-md h-full flex flex-col shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-zinc-800">
          <h3 className="text-base font-bold text-white">{client ? "Modifier" : "Nouveau"} client</h3>
          <button onClick={onClose} className="text-zinc-500 hover:text-white"><X size={18}/></button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Prénom</label>
              <input value={form.prenom} onChange={e => set("prenom", e.target.value)} placeholder="Prénom"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-500/60"/>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Nom *</label>
              <input value={form.nom} onChange={e => set("nom", e.target.value)} placeholder="Nom" autoFocus
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-500/60"/>
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">🏪 Shop / Salon</label>
            <input value={form.nom_shop} onChange={e => set("nom_shop", e.target.value)} placeholder="Studio Ink, Salon Beauty..."
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-500/60"/>
          </div>
          {[
            { label: "Téléphone", key: "telephone", ph: "06 xx xx xx xx", icon: "📞" },
            { label: "Email",     key: "email",     ph: "email@exemple.com", icon: "✉️" },
          ].map(({ label, key, ph, icon }) => (
            <div key={key}>
              <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">{icon} {label}</label>
              <input value={(form as any)[key]} onChange={e => set(key, e.target.value)} placeholder={ph}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-500/60"/>
            </div>
          ))}
          <div>
            <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">📍 Adresse</label>
            <input value={form.adresse} onChange={e => set("adresse", e.target.value)} placeholder="Numéro + Rue"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none mb-2"/>
            <div className="grid grid-cols-3 gap-2">
              <input value={form.cp} onChange={e => set("cp", e.target.value)} placeholder="CP"
                className="bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"/>
              <input value={form.ville} onChange={e => set("ville", e.target.value)} placeholder="Ville"
                className="col-span-2 bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"/>
            </div>
            <GeolocButton adresse={form.adresse} cp={form.cp} ville={form.ville}
              hasCoords={!!form.latitude}
              lat={form.latitude} lng={form.longitude}
              onLocate={(lat, lng) => { set("latitude", String(lat)); set("longitude", String(lng)) }}
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">📋 Contrat</label>
            <div className="grid grid-cols-2 gap-1.5">
              {CONTRATS.map(c => {
                const cfg = CONTRAT_CONFIG[c]; const isActive = form.contrat === c
                return (
                  <button key={c} type="button" onClick={() => set("contrat", c)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all text-left ${isActive ? `${cfg.bg} ${cfg.border} ${cfg.color}` : "bg-zinc-900 border-zinc-800 text-zinc-600 hover:border-zinc-600"}`}>
                    <span className={`w-2 h-2 rounded-full shrink-0`} style={{ backgroundColor: CONTRAT_ACCENT[c] || "#52525b" }}/>
                    {cfg.badge || cfg.label}
                  </button>
                )
              })}
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Statut</label>
            <div className="flex gap-2">
              {STATUTS.map(s => (
                <button key={s.id} type="button" onClick={() => set("statut", s.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold transition-all ${form.statut===s.id ? "bg-zinc-700 border-zinc-600 text-white" : "bg-zinc-900 border-zinc-800 text-zinc-600 hover:border-zinc-600"}`}>
                  <span className={`w-2 h-2 rounded-full ${s.dot}`}/>
                  {s.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">🏷️ Tags <span className="normal-case font-normal text-zinc-600">(virgule)</span></label>
            <input value={form.tags} onChange={e => set("tags", e.target.value)} placeholder="tattoo, pro, revendeur..."
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none"/>
          </div>
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

/* ══════════════════════════════════════════════
   PANEL TARIFS
══════════════════════════════════════════════ */
function TarifsPanel({ client, societyId, onClose }: { client: Client; societyId: string; onClose: () => void }) {
  const [products, setProducts] = useState<any[]>([])
  const [prixMap, setPrixMap]   = useState<Record<string, number>>({})
  const [baseGamme, setBaseGamme] = useState<"Particuliers"|"Professionnels">("Particuliers")
  const [saving, setSaving]     = useState(false)
  const [saved, setSaved]       = useState(false)

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
    products.forEach(p => { if (p.gamme === baseGamme) map[p.id] = Number(p.pv) })
    setPrixMap(map)
  }

  const saveTarifs = async () => {
    setSaving(true)
    await supabase.from("client_prix").delete().eq("client_id", client.id)
    const rows = Object.entries(prixMap).filter(([_, prix]) => prix > 0)
      .map(([product_id, prix]) => ({ client_id: client.id, product_id, prix }))
    if (rows.length > 0) await supabase.from("client_prix").insert(rows)
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2000)
  }

  const gammes = [...new Set(products.map(p => p.gamme))]

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-end z-50">
      <div className="bg-[#111111] border-l border-zinc-800 w-full max-w-lg h-full flex flex-col shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-zinc-800">
          <div>
            <h3 className="text-base font-bold text-white">💰 Tarifs perso — {client.prenom ? `${client.prenom} ${client.nom}` : client.nom}</h3>
            <p className="text-zinc-500 text-xs mt-0.5">Prix spécifiques pour ce client</p>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white"><X size={18}/></button>
        </div>
        <div className="px-5 py-3 border-b border-zinc-800 flex items-center gap-3">
          <p className="text-zinc-400 text-xs">Base :</p>
          <div className="flex gap-1.5">
            {(["Particuliers","Professionnels"] as const).map(g => (
              <button key={g} onClick={() => setBaseGamme(g)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${baseGamme===g ? "bg-yellow-500 text-black border-yellow-500" : "bg-zinc-800 text-zinc-400 border-zinc-700"}`}>
                {g === "Particuliers" ? "👤 Part." : "🏢 Pro"}
              </button>
            ))}
          </div>
          <button onClick={applyBaseGamme} className="text-xs text-blue-400 bg-blue-400/10 border border-blue-400/20 px-2.5 py-1.5 rounded-lg hover:bg-blue-400/20">↩ Appliquer</button>
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
                      <input type="number" min="0" step="0.01" value={prixMap[p.id] ?? ""}
                        onChange={e => setPrixMap(prev => ({ ...prev, [p.id]: parseFloat(e.target.value) || 0 }))}
                        placeholder={Number(p.pv).toFixed(2)}
                        className="w-full bg-zinc-700 border border-zinc-600 rounded-lg px-3 py-1.5 text-sm text-white text-right focus:outline-none focus:border-yellow-500/60"/>
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
            className={`flex-1 font-bold py-3 rounded-xl text-sm flex items-center justify-center gap-2 transition-all ${saved ? "bg-green-500 text-white" : "bg-yellow-500 hover:bg-yellow-400 text-black disabled:opacity-40"}`}>
            {saved ? <><Check size={15}/> Sauvegardé !</> : saving ? "Sauvegarde..." : "💾 Sauvegarder les tarifs"}
          </button>
          <button onClick={onClose} className="px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold rounded-xl text-sm">Fermer</button>
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════
   PANEL FICHE CLIENT
══════════════════════════════════════════════ */
function ClientPanel({ client, societyId, onClose, onEdit, onTarifs, onDelete }: {
  client: Client; societyId: string
  onClose: () => void; onEdit: () => void; onTarifs: () => void; onDelete: () => void
}) {
  const [activeSection, setActiveSection] = useState<"infos"|"historique">("infos")
  const [ventes, setVentes]               = useState<Vente[]>([])
  const [loadingVentes, setLoadingVentes] = useState(false)

  const cfg        = CONTRAT_CONFIG[client.contrat || "Aucun"] || CONTRAT_CONFIG["Aucun"]
  const accentHex  = CONTRAT_ACCENT[client.contrat || "Aucun"]
  const statut     = STATUTS.find(s => s.id === (client.statut || "actif")) || STATUTS[0]

  useEffect(() => {
    const loadVentes = async () => {
      setLoadingVentes(true)
      const { data } = await supabase.from("ventes")
        .select("id, created_at, total_ttc, lignes")
        .eq("society_id", societyId)
        .eq("client_id", client.id)
        .order("created_at", { ascending: false })
        .limit(20)
      setVentes(data || [])
      setLoadingVentes(false)
    }
    if (activeSection === "historique") loadVentes()
  }, [activeSection, client.id, societyId])

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end">
      <div className="bg-[#111111] border-l border-zinc-800 w-full max-w-md h-full flex flex-col shadow-2xl">

        {/* Header */}
        <div className="shrink-0"
          style={accentHex ? { borderBottom: `1px solid ${accentHex}40`, background: `linear-gradient(135deg, ${accentHex}10, transparent)` } : { borderBottom: "1px solid #27272a" }}>
          <div className="flex items-start justify-between px-5 pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-base shrink-0"
                style={{ backgroundColor: getAvatarColor(client.nom), border: `2px solid ${accentHex || "#3f3f46"}` }}>
                {client.avatar_url
                  ? <img src={client.avatar_url} className="w-full h-full object-cover rounded-2xl" alt={client.nom}/>
                  : initials(client.nom)
                }
              </div>
              <div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h2 className="text-white font-bold text-base leading-tight">
                    {client.prenom ? `${client.prenom} ${client.nom}` : client.nom}
                  </h2>
                  <span className={`w-2 h-2 rounded-full shrink-0 ${statut.dot}`}/>
                </div>
                {client.nom_shop && <p className="text-zinc-400 text-xs mt-0.5">🏪 {client.nom_shop}</p>}
                {client.contrat && client.contrat !== "Aucun" && (
                  <span className={`inline-flex text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 border ${cfg.bg} ${cfg.border} ${cfg.color}`}>
                    {cfg.badge}
                  </span>
                )}
              </div>
            </div>
            <button onClick={onClose} className="text-zinc-500 hover:text-white shrink-0"><X size={16}/></button>
          </div>

          {/* Stats rapides */}
          <div className="flex gap-2 px-5 pb-4">
            <div className="flex-1 bg-zinc-900/80 rounded-xl px-3 py-2 text-center">
              <p className="text-[10px] text-zinc-500 mb-0.5">CA total</p>
              <p className="text-white text-sm font-black" style={accentHex ? { color: accentHex } : {}}>
                {((client.ca_total || 0)).toFixed(0)}€
              </p>
            </div>
            <div className="flex-1 bg-zinc-900/80 rounded-xl px-3 py-2 text-center">
              <p className="text-[10px] text-zinc-500 mb-0.5">Achats</p>
              <p className="text-white text-sm font-black">{client.nb_achats || 0}</p>
            </div>
            <div className="flex-1 bg-zinc-900/80 rounded-xl px-3 py-2 text-center">
              <p className="text-[10px] text-zinc-500 mb-0.5">Moy/achat</p>
              <p className="text-white text-sm font-black">
                {(client.nb_achats || 0) > 0 ? ((client.ca_total||0) / (client.nb_achats||1)).toFixed(0)+"€" : "—"}
              </p>
            </div>
          </div>

          {/* Onglets */}
          <div className="flex border-t border-zinc-800/60">
            {([["infos","Infos"],["historique","Historique"]] as const).map(([id, label]) => (
              <button key={id} onClick={() => setActiveSection(id)}
                className={`flex-1 py-2.5 text-xs font-bold transition-colors ${activeSection===id ? "border-b-2 text-white" : "text-zinc-500 hover:text-zinc-300"}`}
                style={activeSection===id ? { borderColor: accentHex || "#eab308" } : {}}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Contenu section */}
        <div className="flex-1 overflow-y-auto">

          {activeSection === "infos" && (
            <div className="p-5 space-y-4">
              {/* Contact */}
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider">Contact</p>
                {client.telephone && (
                  <a href={`tel:${client.telephone}`}
                    className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 hover:border-zinc-600 transition-colors group">
                    <div className="w-7 h-7 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0 group-hover:bg-green-500/10">
                      <Phone size={13} className="text-zinc-400 group-hover:text-green-400"/>
                    </div>
                    <span className="text-white text-sm font-medium">{client.telephone}</span>
                    <span className="ml-auto text-zinc-600 text-[10px]">Appeler</span>
                  </a>
                )}
                {client.email && (
                  <a href={`mailto:${client.email}`}
                    className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 hover:border-zinc-600 transition-colors group">
                    <div className="w-7 h-7 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0 group-hover:bg-blue-500/10">
                      <Mail size={13} className="text-zinc-400 group-hover:text-blue-400"/>
                    </div>
                    <span className="text-zinc-300 text-sm truncate">{client.email}</span>
                    <span className="ml-auto text-zinc-600 text-[10px] shrink-0">Email</span>
                  </a>
                )}
                {(client.adresse || client.ville) && (
                  <div className="flex items-start gap-3 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5">
                    <div className="w-7 h-7 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0 mt-0.5">
                      <MapPin size={13} className="text-zinc-400"/>
                    </div>
                    <span className="text-zinc-400 text-sm leading-relaxed">
                      {[client.adresse, client.cp && client.ville ? `${client.cp} ${client.ville}` : client.ville].filter(Boolean).join(", ")}
                    </span>
                  </div>
                )}
                {!client.telephone && !client.email && !client.adresse && !client.ville && (
                  <p className="text-zinc-700 text-xs italic px-1">Aucune information de contact</p>
                )}
              </div>

              {/* Tags */}
              {client.tags && client.tags.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider">Tags</p>
                  <div className="flex flex-wrap gap-1.5">
                    {client.tags.map(tag => (
                      <span key={tag} className="text-xs bg-zinc-800 border border-zinc-700 text-zinc-300 px-2.5 py-1 rounded-full">{tag}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              {client.notes && (
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider">Notes</p>
                  <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3">
                    <p className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap">{client.notes}</p>
                  </div>
                </div>
              )}

              {/* Infos système */}
              {client.created_at && (
                <div className="flex items-center gap-2 pt-1">
                  <Calendar size={12} className="text-zinc-700"/>
                  <p className="text-zinc-700 text-[11px]">
                    Client depuis le {new Date(client.created_at).toLocaleDateString("fr-FR", { day:"numeric", month:"long", year:"numeric" })}
                  </p>
                </div>
              )}
            </div>
          )}

          {activeSection === "historique" && (
            <div className="p-5">
              {loadingVentes ? (
                <div className="flex justify-center py-10">
                  <div className="w-5 h-5 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin"/>
                </div>
              ) : ventes.length === 0 ? (
                <div className="text-center py-10">
                  <ShoppingBag size={32} className="mx-auto text-zinc-800 mb-3"/>
                  <p className="text-zinc-600 text-sm">Aucun achat enregistré</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider mb-3">
                    {ventes.length} vente{ventes.length > 1 ? "s" : ""} · CA {(client.ca_total || 0).toFixed(2)}€
                  </p>
                  {ventes.map(v => (
                    <div key={v.id} className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-white text-sm font-bold">{Number(v.total_ttc).toFixed(2)}€</p>
                        <p className="text-zinc-500 text-[11px]">
                          {new Date(v.created_at).toLocaleDateString("fr-FR", { day:"numeric", month:"short", year:"numeric" })}
                        </p>
                      </div>
                      {v.lignes && Array.isArray(v.lignes) && v.lignes.length > 0 && (
                        <div className="space-y-0.5 mt-1.5">
                          {(v.lignes as any[]).slice(0, 4).map((l: any, i: number) => (
                            <div key={i} className="flex items-center justify-between">
                              <p className="text-zinc-400 text-[11px] truncate">{l.quantite}× {l.produit_nom}</p>
                              <p className="text-zinc-500 text-[10px] shrink-0 ml-2">{Number(l.prix_unitaire || 0).toFixed(2)}€</p>
                            </div>
                          ))}
                          {(v.lignes as any[]).length > 4 && (
                            <p className="text-zinc-700 text-[10px]">+{(v.lignes as any[]).length - 4} autres articles</p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="shrink-0 p-4 border-t border-zinc-800 grid grid-cols-3 gap-2">
          <button onClick={onEdit}
            className="flex flex-col items-center gap-1 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 transition-colors">
            <Pencil size={14} className="text-zinc-300"/>
            <span className="text-[10px] text-zinc-400 font-medium">Modifier</span>
          </button>
          <button onClick={onTarifs}
            className="flex flex-col items-center gap-1 py-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 transition-colors">
            <Euro size={14} className="text-blue-400"/>
            <span className="text-[10px] text-blue-400 font-medium">Tarifs</span>
          </button>
          <button onClick={onDelete}
            className="flex flex-col items-center gap-1 py-2.5 rounded-xl bg-red-500/5 border border-red-500/15 hover:bg-red-500/15 transition-colors">
            <Trash2 size={14} className="text-red-400/70"/>
            <span className="text-[10px] text-red-400/70 font-medium">Supprimer</span>
          </button>
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════
   MAIN MODULE
══════════════════════════════════════════════ */
export default function ClientsModule({ activeSociety, profile }: Props) {
  const [clients, setClients]       = useState<Client[]>([])
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState("")
  const [filterContrat, setFilterContrat] = useState("all")
  const [filterStatut, setFilterStatut]   = useState("all")
  const [sortBy, setSortBy]         = useState<"nom"|"ca"|"date"|"nb_achats">("nom")
  const [sortDir, setSortDir]       = useState<"asc"|"desc">("asc")
  const [showForm, setShowForm]     = useState(false)
  const [editClient, setEditClient] = useState<Client | null>(null)
  const [tarifsClient, setTarifsClient] = useState<Client | null>(null)
  const [panelClient, setPanelClient]   = useState<Client | null>(null)

  const ACCENT = "#eab308"

  const load = useCallback(async () => {
    if (!activeSociety?.id) return
    setLoading(true)
    try {
      const [{ data: cls }, { data: ventes }] = await Promise.all([
        supabase.from("clients").select("*").eq("society_id", activeSociety.id).order("nom"),
        supabase.from("ventes").select("client_id, total_ttc").eq("society_id", activeSociety.id).not("client_id", "is", null),
      ])
      const caMap: Record<string, { total: number; count: number }> = {}
      ;(ventes || []).forEach((v: any) => {
        if (!caMap[v.client_id]) caMap[v.client_id] = { total: 0, count: 0 }
        caMap[v.client_id].total += Number(v.total_ttc || 0)
        caMap[v.client_id].count += 1
      })
      setClients((cls || []).map(c => ({
        ...c, ca_total: caMap[c.id]?.total || 0, nb_achats: caMap[c.id]?.count || 0
      })))
    } catch (e) { console.error(e) }
    setLoading(false)
  }, [activeSociety?.id])

  useEffect(() => { load() }, [load])

  const deleteClient = async (id: string) => {
    if (!confirm("Supprimer ce client ?")) return
    await supabase.from("clients").delete().eq("id", id)
    setClients(prev => prev.filter(c => c.id !== id))
    if (panelClient?.id === id) setPanelClient(null)
  }

  const filtered = clients
    .filter(c => {
      if (filterContrat !== "all" && c.contrat !== filterContrat) return false
      if (filterStatut !== "all" && (c.statut || "actif") !== filterStatut) return false
      if (search) {
        const s = search.toLowerCase()
        return c.nom?.toLowerCase().includes(s)
          || c.prenom?.toLowerCase().includes(s)
          || c.email?.toLowerCase().includes(s)
          || c.telephone?.includes(s)
          || c.ville?.toLowerCase().includes(s)
          || c.nom_shop?.toLowerCase().includes(s)
          || (c.tags||[]).some((t:string) => t.toLowerCase().includes(s))
      }
      return true
    })
    .sort((a, b) => {
      let cmp = 0
      if (sortBy === "ca")       cmp = (b.ca_total||0) - (a.ca_total||0)
      else if (sortBy === "nb_achats") cmp = (b.nb_achats||0) - (a.nb_achats||0)
      else if (sortBy === "date")      cmp = new Date(b.created_at||"").getTime() - new Date(a.created_at||"").getTime()
      else cmp = a.nom.localeCompare(b.nom)
      return sortDir === "asc" ? cmp : -cmp
    })

  const totalCA  = clients.reduce((s, c) => s + (c.ca_total||0), 0)
  const actifs   = clients.filter(c => (c.statut||"actif") === "actif").length
  const vips     = clients.filter(c => c.statut === "vip").length
  const withContrat = clients.filter(c => c.contrat && c.contrat !== "Aucun").length

  const toggleSort = (col: typeof sortBy) => {
    if (sortBy === col) setSortDir(d => d === "asc" ? "desc" : "asc")
    else { setSortBy(col); setSortDir(col === "nom" ? "asc" : "desc") }
  }

  const SortIcon = ({ col }: { col: typeof sortBy }) => {
    if (sortBy !== col) return <ChevronsUpDown size={11} className="text-zinc-700"/>
    return sortDir === "asc" ? <ChevronUp size={11} className="text-yellow-400"/> : <ChevronDown size={11} className="text-yellow-400"/>
  }

  return (
    <div className="flex-1 overflow-hidden flex flex-col bg-[#0a0a0a]">

      {/* ── HEADER ── */}
      <div className="border-b border-zinc-900 px-5 pt-4 pb-3 shrink-0 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h1 className="text-white font-bold text-xl">👥 Clients</h1>
            <p className="text-zinc-500 text-xs mt-0.5">
              {clients.length} client{clients.length>1?"s":""} · CA total : <span className="text-yellow-400 font-bold">{totalCA.toFixed(2)}€</span>
            </p>
          </div>
          <button onClick={() => { setEditClient(null); setShowForm(true) }}
            className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-4 py-2.5 rounded-xl text-sm shadow-lg shadow-yellow-500/20">
            <Plus size={15}/> Nouveau client
          </button>
        </div>

        {/* Stats chips */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {[
            { label: "Total",        value: clients.length,  color: "text-white"       },
            { label: "Actifs",       value: actifs,          color: "text-green-400"   },
            { label: "VIP ⭐",       value: vips,            color: "text-yellow-400"  },
            { label: "Sous contrat", value: withContrat,     color: "text-purple-400"  },
            { label: "CA moyen",     value: clients.length > 0 ? (totalCA/clients.length).toFixed(0)+"€" : "—", color: "text-zinc-300" },
          ].map(({ label, value, color }) => (
            <div key={label} className="shrink-0 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 flex items-center gap-2">
              <p className={`text-sm font-black ${color}`}>{value}</p>
              <p className="text-zinc-600 text-[10px]">{label}</p>
            </div>
          ))}
        </div>

        {/* Filtres */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[180px]">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"/>
            <input type="text" placeholder="Nom, shop, email, téléphone, ville, tag..." value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-500/40"/>
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-white">
                <X size={12}/>
              </button>
            )}
          </div>
          <select value={filterContrat} onChange={e => setFilterContrat(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none">
            <option value="all">Tous contrats</option>
            {CONTRATS.map(c => <option key={c} value={c}>{CONTRAT_CONFIG[c].badge || c}</option>)}
          </select>
          <select value={filterStatut} onChange={e => setFilterStatut(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none">
            <option value="all">Tous statuts</option>
            {STATUTS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </div>
      </div>

      {/* ── TABLEAU ── */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-7 h-7 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin"/>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
          <User size={40} className="text-zinc-800 mb-4"/>
          <p className="text-zinc-500 font-semibold mb-1">{search ? "Aucun client trouvé" : "Aucun client"}</p>
          {!search && (
            <button onClick={() => setShowForm(true)} className="mt-4 bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-5 py-2.5 rounded-xl text-sm flex items-center gap-2">
              <Plus size={15}/> Créer un client
            </button>
          )}
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          <table className="w-full border-collapse">
            <thead className="sticky top-0 z-10 bg-[#0d0d0d] border-b border-zinc-800">
              <tr>
                <th className="text-left px-5 py-3">
                  <button onClick={() => toggleSort("nom")} className="flex items-center gap-1 text-[10px] font-bold text-zinc-500 uppercase tracking-wider hover:text-zinc-300">
                    Client <SortIcon col="nom"/>
                  </button>
                </th>
                <th className="text-left px-3 py-3 hidden md:table-cell">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Contrat</span>
                </th>
                <th className="text-left px-3 py-3 hidden lg:table-cell">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Contact</span>
                </th>
                <th className="text-left px-3 py-3 hidden xl:table-cell">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Ville</span>
                </th>
                <th className="text-right px-3 py-3">
                  <button onClick={() => toggleSort("ca")} className="flex items-center gap-1 text-[10px] font-bold text-zinc-500 uppercase tracking-wider hover:text-zinc-300 ml-auto">
                    CA <SortIcon col="ca"/>
                  </button>
                </th>
                <th className="text-right px-3 py-3 hidden sm:table-cell">
                  <button onClick={() => toggleSort("nb_achats")} className="flex items-center gap-1 text-[10px] font-bold text-zinc-500 uppercase tracking-wider hover:text-zinc-300 ml-auto">
                    Achats <SortIcon col="nb_achats"/>
                  </button>
                </th>
                <th className="w-20 px-3 py-3"/>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900">
              {filtered.map(client => {
                const cfg        = CONTRAT_CONFIG[client.contrat || "Aucun"] || CONTRAT_CONFIG["Aucun"]
                const accentHex  = CONTRAT_ACCENT[client.contrat || "Aucun"]
                const statut     = STATUTS.find(s => s.id === (client.statut||"actif")) || STATUTS[0]
                const isActive   = panelClient?.id === client.id
                return (
                  <tr key={client.id}
                    onClick={() => setPanelClient(isActive ? null : client)}
                    className="cursor-pointer transition-colors group hover:bg-zinc-900/60"
                    style={isActive ? { backgroundColor: accentHex ? `${accentHex}08` : "rgba(39,39,42,0.4)" } : {}}>

                    {/* Barre couleur contrat */}
                    <td className="px-0 py-0 w-1">
                      <div className="w-0.5 h-full min-h-[52px] rounded-full" style={{ backgroundColor: accentHex || "transparent" }}/>
                    </td>

                    {/* Nom + shop */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-xs shrink-0"
                          style={{ backgroundColor: getAvatarColor(client.nom) }}>
                          {client.avatar_url
                            ? <img src={client.avatar_url} className="w-full h-full object-cover rounded-xl" alt={client.nom}/>
                            : initials(client.nom)
                          }
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-white text-sm font-semibold truncate">
                              {client.prenom ? `${client.prenom} ${client.nom}` : client.nom}
                            </p>
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${statut.dot}`}/>
                          </div>
                          {client.nom_shop && (
                            <p className="text-zinc-500 text-[11px] truncate">🏪 {client.nom_shop}</p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Contrat */}
                    <td className="px-3 py-3 hidden md:table-cell">
                      {client.contrat && client.contrat !== "Aucun" ? (
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-lg border whitespace-nowrap ${cfg.bg} ${cfg.border} ${cfg.color}`}>
                          {cfg.badge}
                        </span>
                      ) : (
                        <span className="text-zinc-700 text-xs">—</span>
                      )}
                    </td>

                    {/* Contact */}
                    <td className="px-3 py-3 hidden lg:table-cell">
                      <div className="space-y-0.5">
                        {client.telephone && (
                          <p className="text-zinc-300 text-xs font-medium">{client.telephone}</p>
                        )}
                        {client.email && (
                          <p className="text-zinc-500 text-[11px] truncate max-w-[160px]">{client.email}</p>
                        )}
                        {!client.telephone && !client.email && <span className="text-zinc-700 text-xs">—</span>}
                      </div>
                    </td>

                    {/* Ville */}
                    <td className="px-3 py-3 hidden xl:table-cell">
                      <p className="text-zinc-400 text-xs">{client.ville || "—"}</p>
                    </td>

                    {/* CA */}
                    <td className="px-3 py-3 text-right">
                      <p className="text-sm font-bold" style={(client.ca_total||0) > 0 ? { color: accentHex || ACCENT } : { color: "#52525b" }}>
                        {((client.ca_total||0)).toFixed(0)}€
                      </p>
                    </td>

                    {/* Achats */}
                    <td className="px-3 py-3 text-right hidden sm:table-cell">
                      <p className="text-zinc-500 text-xs">{client.nb_achats || 0}</p>
                    </td>

                    {/* Actions hover */}
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-0.5 justify-end opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={e => e.stopPropagation()}>
                        <button onClick={() => { setEditClient(client); setShowForm(true) }}
                          className="w-7 h-7 flex items-center justify-center text-zinc-500 hover:text-white rounded-lg hover:bg-zinc-700">
                          <Pencil size={12}/>
                        </button>
                        <button onClick={() => setTarifsClient(client)}
                          className="w-7 h-7 flex items-center justify-center text-blue-400/60 hover:text-blue-400 rounded-lg hover:bg-blue-500/10">
                          <Euro size={12}/>
                        </button>
                        <button onClick={() => deleteClient(client.id)}
                          className="w-7 h-7 flex items-center justify-center text-zinc-700 hover:text-red-400 rounded-lg hover:bg-red-500/10">
                          <Trash2 size={12}/>
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {/* Footer tableau */}
          <div className="px-5 py-3 border-t border-zinc-900 flex items-center justify-between">
            <p className="text-zinc-600 text-xs">{filtered.length} client{filtered.length>1?"s":""} affichés</p>
            {(search || filterContrat !== "all" || filterStatut !== "all") && (
              <button onClick={() => { setSearch(""); setFilterContrat("all"); setFilterStatut("all") }}
                className="text-zinc-500 hover:text-white text-xs flex items-center gap-1">
                <X size={11}/> Réinitialiser les filtres
              </button>
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      {showForm && (
        <ClientForm key={editClient?.id || "new"} societyId={activeSociety.id} profile={profile}
          client={editClient || undefined}
          onClose={() => { setShowForm(false); setEditClient(null) }}
          onDone={load}
        />
      )}
      {tarifsClient && (
        <TarifsPanel client={tarifsClient} societyId={activeSociety.id} onClose={() => setTarifsClient(null)}/>
      )}
      {panelClient && (
        <ClientPanel
          client={panelClient}
          societyId={activeSociety.id}
          onClose={() => setPanelClient(null)}
          onEdit={() => { setEditClient(panelClient); setShowForm(true); setPanelClient(null) }}
          onTarifs={() => { setTarifsClient(panelClient); setPanelClient(null) }}
          onDelete={() => { deleteClient(panelClient.id) }}
        />
      )}
    </div>
  )
}