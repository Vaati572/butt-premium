"use client"

import { useEffect, useState, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import { Plus, X, Package, Truck, ChevronDown, Trash2, CheckCircle2, Clock, Search } from "lucide-react"

interface Props { activeSociety: any; profile: any }

// Fournisseurs définis
const FOURNISSEURS = [
  {
    id: "tiny_tube",
    nom: "Tiny Tube",
    emoji: "🧴",
    color: "#3b82f6",
    description: "Fournisseur de contenants",
    produits: [
      { id: "pots_250", nom: "Pots 250ml",          stock_produit: "Baume 250ml",      prix_defaut: 0 },
      { id: "pots_50",  nom: "Pots 50ml",            stock_produit: "Baume 50ml",       prix_defaut: 0 },
      { id: "pots_20",  nom: "Pots 20ml",            stock_produit: "20ml",             prix_defaut: 0 },
      { id: "btle_hse", nom: "Bouteilles Huile Sèche", stock_produit: "Huile Sèche",   prix_defaut: 0 },
    ],
    // Tiny Tube: commande pots → met à jour stock Ludivine
    targetFournisseur: "ludivine",
  },
  {
    id: "ludivine",
    nom: "Ludivine (Labo)",
    emoji: "🔬",
    color: "#a855f7",
    description: "Laboratoire de fabrication",
    produits: [
      { id: "pots_250", nom: "Pots 250ml",          stock_produit: "Baume 250ml",      prix_defaut: 0 },
      { id: "pots_50",  nom: "Pots 50ml",            stock_produit: "Baume 50ml",       prix_defaut: 0 },
      { id: "pots_20",  nom: "Pots 20ml",            stock_produit: "20ml",             prix_defaut: 0 },
      { id: "btle_hse", nom: "Bouteilles Huile Sèche", stock_produit: "Huile Sèche",   prix_defaut: 0 },
    ],
    targetFournisseur: null, // commande chez Ludivine → met à jour stock principal
  },
  {
    id: "claudia",
    nom: "Claudia",
    emoji: "🌸",
    color: "#ec4899",
    description: "Savons & soins — 4€/pièce",
    produits: [
      { id: "milky",      nom: "Milky",      stock_produit: "Milky",      prix_defaut: 4 },
      { id: "white_soap", nom: "White Soap", stock_produit: "White Soap", prix_defaut: 4 },
    ],
    targetFournisseur: null, // toujours → stock principal
  },
]

type CommStatus = "en_attente" | "reçu" | "annulé"

interface Commande {
  id: string
  fournisseur_id: string
  produit_nom: string
  stock_produit: string
  quantite: number
  prix_unitaire: number
  frais_livraison: number
  total: number
  statut: CommStatus
  date_commande: string
  date_reception?: string
  notes?: string
  society_id: string
}

/* ── PANEL NOUVELLE COMMANDE ──────────────── */
function NouvelleCommandePanel({
  societyId, profile, fournisseur, onClose, onDone
}: { societyId: string; profile: any; fournisseur: typeof FOURNISSEURS[0]; onClose: () => void; onDone: () => void }) {
  const [produitId, setProduitId]     = useState(fournisseur.produits[0]?.id || "")
  const [quantite, setQuantite]       = useState("")
  const [prixUnit, setPrixUnit]       = useState(String(fournisseur.produits[0]?.prix_defaut || ""))
  const [fraisLiv, setFraisLiv]       = useState("0")
  const [dateCmd, setDateCmd]         = useState(new Date().toISOString().split("T")[0])
  const [notes, setNotes]             = useState("")
  const [saving, setSaving]           = useState(false)

  const produitInfo = fournisseur.produits.find(p => p.id === produitId)
  const qty     = parseFloat(quantite) || 0
  const prix    = parseFloat(prixUnit)  || (fournisseur.id === "claudia" ? 4 : 0)
  const frais   = parseFloat(fraisLiv)  || 0
  const total   = qty * prix + frais

  const handleSave = async () => {
    if (!produitInfo || qty <= 0) return
    setSaving(true)

    const realPrix = fournisseur.id === "claudia" ? 4 : prix

    // Save to commandes table
    // Utilise les colonnes existantes + nouvelles (si migration faite)
    const insertData: any = {
      society_id: societyId,
      user_id: profile.id,
      fournisseur: fournisseur.nom,
      // Stocke les infos dans les champs existants
      produit: produitInfo.nom,          // colonne existante
      quantite: qty,
      statut: "en_attente",
      notes: [
        notes,
        `Produit stock: ${produitInfo.stock_produit}`,
        `Prix unit: ${realPrix}€`,
        `Frais livraison: ${frais}€`,
        `Total: ${qty * realPrix + frais}€`,
        `Date: ${dateCmd}`,
        `Fournisseur ID: ${fournisseur.id}`,
      ].filter(Boolean).join(" | "),
    }
    // Ajouter les nouvelles colonnes si la migration a été faite
    try {
      insertData.fournisseur_id = fournisseur.id
      insertData.produit_nom = produitInfo.nom
      insertData.stock_produit = produitInfo.stock_produit
      insertData.prix_unitaire = realPrix
      insertData.frais_livraison = frais
      insertData.total = qty * realPrix + frais
      insertData.date_commande = dateCmd
    } catch {}
    const { data: cmd, error } = await supabase.from("commandes").insert(insertData).select().single()

    if (!error && cmd) {
      // Logic selon fournisseur
      if (fournisseur.id === "tiny_tube") {
        // Tiny Tube: commande pots → stock Ludivine (stock_labo)
        await updateStockByName(societyId, produitInfo.stock_produit, qty, profile.id, `Commande Tiny Tube — ${produitInfo.nom}`, "labo")
      } else if (fournisseur.id === "ludivine") {
        // Ludivine commande pots → retire du stock Ludivine, ajoute au stock principal
        await updateStockByName(societyId, produitInfo.stock_produit, -qty, profile.id, `Sortie Labo Ludivine — ${produitInfo.nom}`, "labo")
        await updateStockByName(societyId, produitInfo.stock_produit, qty, profile.id, `Réception Ludivine — ${produitInfo.nom}`, "main")
      } else if (fournisseur.id === "claudia") {
        // Claudia: ajoute au stock principal directement
        await updateStockByName(societyId, produitInfo.stock_produit, qty, profile.id, `Commande Claudia — ${produitInfo.nom}`, "main")
      }
    }

    setSaving(false)
    if (error) {
      alert("Erreur lors de la commande : " + error.message + "\nVérifie que la migration SQL a bien été exécutée dans Supabase.")
      return
    }
    onDone()
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-end z-50">
      <div className="bg-[#111111] border-l border-zinc-800 w-full max-w-sm h-full flex flex-col shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-zinc-800"
          style={{ background: `linear-gradient(135deg, ${fournisseur.color}10, transparent)` }}>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider mb-0.5" style={{ color: fournisseur.color }}>
              {fournisseur.emoji} {fournisseur.nom}
            </p>
            <h3 className="text-base font-bold text-white">Nouvelle commande</h3>
            <p className="text-zinc-600 text-xs mt-0.5">{fournisseur.description}</p>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white"><X size={18}/></button>
        </div>

        <div className="flex-1 p-6 space-y-4 overflow-y-auto">
          {/* Produit */}
          <div>
            <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Produit</label>
            <select value={produitId} onChange={e => {
              setProduitId(e.target.value)
              const p = fournisseur.produits.find(pp => pp.id === e.target.value)
              if (p && fournisseur.id === "claudia") setPrixUnit("4")
              else if (p) setPrixUnit(String(p.prix_defaut))
            }} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-500/60">
              {fournisseur.produits.map(p => (
                <option key={p.id} value={p.id}>{p.nom}</option>
              ))}
            </select>
          </div>

          {/* Quantité */}
          <div>
            <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Quantité</label>
            <input type="number" min="1" step="1" placeholder="0" value={quantite}
              onChange={e => setQuantite(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-500/60"/>
          </div>

          {/* Prix unitaire */}
          <div>
            <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">
              Prix unitaire (€) {fournisseur.id === "claudia" && <span className="text-pink-400">— fixe 4€</span>}
            </label>
            <input type="number" min="0" step="0.01" placeholder="0.00"
              value={fournisseur.id === "claudia" ? "4" : prixUnit}
              onChange={e => { if (fournisseur.id !== "claudia") setPrixUnit(e.target.value) }}
              readOnly={fournisseur.id === "claudia"}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-500/60 disabled:opacity-50"/>
          </div>

          {/* Frais livraison */}
          <div>
            <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Frais de livraison (€)</label>
            <input type="number" min="0" step="0.01" placeholder="0.00" value={fraisLiv}
              onChange={e => setFraisLiv(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"/>
          </div>

          {/* Date */}
          <div>
            <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Date de commande</label>
            <input type="date" value={dateCmd} onChange={e => setDateCmd(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"/>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Notes</label>
            <input type="text" placeholder="Informations supplémentaires..." value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none"/>
          </div>

          {/* Total preview */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-zinc-400">
                <span>Produits</span>
                <span>{(qty * (fournisseur.id==="claudia"?4:prix)).toFixed(2)}€</span>
              </div>
              <div className="flex justify-between text-xs text-zinc-400">
                <span>Livraison</span>
                <span>{frais.toFixed(2)}€</span>
              </div>
              <div className="flex justify-between text-sm font-bold border-t border-zinc-800 pt-2 mt-2" style={{ color: fournisseur.color }}>
                <span>Total</span>
                <span>{total.toFixed(2)}€</span>
              </div>
            </div>
          </div>

          {/* Stock info */}
          {produitInfo && (
            <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-3 text-xs text-zinc-500">
              <p className="font-semibold text-zinc-400 mb-1">Impact stock :</p>
              {fournisseur.id === "tiny_tube" && <p>→ +{qty||0} {produitInfo.stock_produit} dans le <span className="text-purple-400">stock Ludivine</span></p>}
              {fournisseur.id === "ludivine" && <><p>→ -{qty||0} {produitInfo.stock_produit} du <span className="text-purple-400">stock Ludivine</span></p><p>→ +{qty||0} {produitInfo.stock_produit} dans votre <span className="text-yellow-400">stock principal</span></p></>}
              {fournisseur.id === "claudia" && <p>→ +{qty||0} {produitInfo.stock_produit} dans votre <span className="text-yellow-400">stock principal</span></p>}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-zinc-800 space-y-3">
          <button onClick={handleSave} disabled={saving || !quantite || qty <= 0}
            className="w-full font-bold py-3 rounded-xl text-black text-sm disabled:opacity-40 flex items-center justify-center gap-2"
            style={{ backgroundColor: fournisseur.color }}>
            {saving ? "Enregistrement..." : `✓ Passer la commande`}
          </button>
          <button onClick={onClose} className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold py-2.5 rounded-xl text-sm">Annuler</button>
        </div>
      </div>
    </div>
  )
}

/* ── Helper: update stock by name ─────────── */
async function updateStockByName(
  societyId: string,
  produitNom: string,
  delta: number,
  userId: string,
  notes: string,
  target: "main" | "labo"
) {
  // Find stock entry matching name (case-insensitive)
  const { data: allStock } = await supabase.from("stock")
    .select("*").eq("society_id", societyId)
  const item = (allStock || []).find((s: any) =>
    s.produit_nom.toLowerCase().trim() === produitNom.toLowerCase().trim() &&
    (target === "labo" ? s.is_labo === true : !s.is_labo)
  ) || (allStock || []).find((s: any) =>
    s.produit_nom.toLowerCase().trim() === produitNom.toLowerCase().trim()
  )

  if (item) {
    const newQty = item.quantite + delta
    await supabase.from("stock").update({ quantite: newQty, updated_at: new Date().toISOString() }).eq("id", item.id)
    await supabase.from("stock_history").insert({
      society_id: societyId,
      product_id: item.product_id || item.id,
      produit_nom: item.produit_nom,
      user_id: userId,
      action: delta > 0 ? "Entrée" : "Sortie",
      quantite: Math.abs(delta),
      quantite_avant: item.quantite,
      quantite_apres: newQty,
      notes,
    })
  }
}

const STATUS_CONFIG: Record<CommStatus, { label: string; color: string; bg: string; border: string }> = {
  en_attente: { label: "En attente", color: "text-yellow-400", bg: "bg-yellow-400/10", border: "border-yellow-400/20" },
  reçu:       { label: "Reçu",       color: "text-green-400",  bg: "bg-green-400/10",  border: "border-green-400/20" },
  annulé:     { label: "Annulé",     color: "text-red-400",    bg: "bg-red-400/10",    border: "border-red-400/20"  },
}

/* ── STOCK DISPLAY ───────────────────────── */
function StockDisplay({ societyId }: { societyId: string }) {
  const [stock, setStock] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from("stock").select("*")
      .eq("society_id", societyId)
      .order("produit_nom")
      .then(({ data }) => { setStock(data || []); setLoading(false) })
  }, [societyId])

  if (loading) return <div className="text-zinc-600 text-sm text-center py-2">Chargement...</div>
  if (stock.length === 0) return <div className="text-zinc-600 text-sm text-center py-2">Aucun produit en stock</div>

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
      {stock.filter(s => !s.is_labo).map(s => {
        const neg = s.quantite < 0
        const alert = !neg && s.seuil_alerte > 0 && s.quantite <= s.seuil_alerte
        return (
          <div key={s.id} className={`bg-zinc-800 border rounded-xl px-3 py-2 ${neg ? "border-red-500/30" : alert ? "border-orange-500/30" : "border-zinc-700"}`}>
            <p className="text-zinc-400 text-[11px] truncate mb-0.5">{s.produit_nom}</p>
            <p className={`text-lg font-black ${neg ? "text-red-500" : s.quantite === 0 ? "text-zinc-600" : alert ? "text-orange-400" : "text-white"}`}>
              {s.quantite}{s.unite ? <span className="text-xs font-normal text-zinc-600 ml-0.5">{s.unite}</span> : ""}
            </p>
          </div>
        )
      })}
    </div>
  )
}

export default function FournisseurModule({ activeSociety, profile }: Props) {
  const [commandes, setCommandes]           = useState<any[]>([])
  const [loading, setLoading]               = useState(true)
  const [activeFourn, setActiveFourn]       = useState<typeof FOURNISSEURS[0] | null>(null)
  const [filterFourn, setFilterFourn]       = useState("all")
  const [filterStatus, setFilterStatus]     = useState("all")
  const [search, setSearch]                 = useState("")

  const load = useCallback(async () => {
    if (!activeSociety?.id) return
    setLoading(true)
    const { data } = await supabase.from("commandes")
      .select("*")
      .eq("society_id", activeSociety.id)
      .order("date_commande", { ascending: false })
    setCommandes(data || [])
    setLoading(false)
  }, [activeSociety?.id])

  useEffect(() => { load() }, [load])

  const markAsReceived = async (cmd: any) => {
    await supabase.from("commandes").update({
      statut: "reçu",
      date_reception: new Date().toISOString(),
    }).eq("id", cmd.id)
    load()
  }

  const deleteCommande = async (id: string) => {
    if (!confirm("Supprimer cette commande ?")) return
    await supabase.from("commandes").delete().eq("id", id)
    setCommandes(prev => prev.filter(c => c.id !== id))
  }

  const filtered = commandes.filter(c => {
    if (filterFourn !== "all" && c.fournisseur_id !== filterFourn) return false
    if (filterStatus !== "all" && c.statut !== filterStatus) return false
    if (search) {
      const s = search.toLowerCase()
      const prodNom = c.produit_nom || c.produit || ""
      if (!prodNom.toLowerCase().includes(s) && !c.fournisseur?.toLowerCase().includes(s)) return false
    }
    return true
  })

  const totalEnAttente = commandes.filter(c => c.statut === "en_attente").reduce((s: number, c: any) => s + Number(c.total||0), 0)
  const totalRecu      = commandes.filter(c => c.statut === "reçu").reduce((s: number, c: any) => s + Number(c.total||0), 0)

  return (
    <div className="flex-1 overflow-y-auto bg-[#0a0a0a]">
      <div className="p-6 max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-white">🏭 Fournisseurs</h1>
            <p className="text-zinc-500 text-sm mt-0.5">Gestion des commandes & stocks</p>
          </div>
        </div>

        {/* Stock société actuel */}
        <div className="mb-6 bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
          <div className="px-5 py-3 border-b border-zinc-800 flex items-center justify-between">
            <p className="text-white font-bold text-sm">📦 Stock société</p>
            <p className="text-zinc-500 text-xs">Mis à jour en temps réel</p>
          </div>
          <div className="p-4">
            <StockDisplay societyId={activeSociety.id} />
          </div>
        </div>

        {/* Fournisseur cards - Commander */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {FOURNISSEURS.map(f => {
            const count = commandes.filter(c => c.fournisseur_id === f.id && c.statut === "en_attente").length
            return (
              <div key={f.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 hover:border-zinc-700 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-2xl mb-1">{f.emoji}</p>
                    <h3 className="text-white font-bold">{f.nom}</h3>
                    <p className="text-zinc-500 text-xs">{f.description}</p>
                  </div>
                  {count > 0 && (
                    <span className="text-[10px] font-bold px-2 py-1 rounded-full text-yellow-400 bg-yellow-400/10 border border-yellow-400/20">
                      {count} en attente
                    </span>
                  )}
                </div>

                <div className="space-y-1 mb-4">
                  {f.produits.map(p => (
                    <p key={p.id} className="text-zinc-600 text-xs">• {p.nom}</p>
                  ))}
                </div>

                <button onClick={() => setActiveFourn(f)}
                  className="w-full py-2.5 rounded-xl font-bold text-sm text-black flex items-center justify-center gap-2 hover:brightness-110 transition"
                  style={{ backgroundColor: f.color }}>
                  <Plus size={14}/> Commander
                </button>
              </div>
            )
          })}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <p className="text-zinc-500 text-[11px] uppercase tracking-wider mb-1">💸 À payer</p>
            <p className="text-red-400 text-xl font-bold">{totalEnAttente.toFixed(2)}€</p>
            <p className="text-zinc-600 text-xs mt-0.5">Commandes en attente</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <p className="text-zinc-500 text-[11px] uppercase tracking-wider mb-1">✅ Payé (reçu)</p>
            <p className="text-green-400 text-xl font-bold">{totalRecu.toFixed(2)}€</p>
            <p className="text-zinc-600 text-xs mt-0.5">Commandes reçues</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <p className="text-zinc-500 text-[11px] uppercase tracking-wider mb-1">📦 Total dépensé</p>
            <p className="text-orange-400 text-xl font-bold">{(totalEnAttente + totalRecu).toFixed(2)}€</p>
            <p className="text-zinc-600 text-xs mt-0.5">Achats fournisseurs</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <div className="relative flex-1 min-w-[140px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"/>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..."
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none"/>
          </div>
          <select value={filterFourn} onChange={e => setFilterFourn(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none">
            <option value="all">Tous fournisseurs</option>
            {FOURNISSEURS.map(f => <option key={f.id} value={f.id}>{f.emoji} {f.nom}</option>)}
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none">
            <option value="all">Tous statuts</option>
            <option value="en_attente">En attente</option>
            <option value="reçu">Reçus</option>
            <option value="annulé">Annulés</option>
          </select>
        </div>

        {/* Commandes list */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin"/>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24 text-zinc-600">
            <Truck size={40} className="mx-auto mb-4 opacity-20"/>
            <p className="text-sm">Aucune commande</p>
            <p className="text-xs mt-2">Créez votre première commande via les cartes ci-dessus</p>
          </div>
        ) : (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-800">
                  {["Fournisseur","Produit","Qté","Prix unit.","Frais liv.","Total","Statut","Date","Actions"].map(h => (
                    <th key={h} className="px-4 py-3 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider text-left">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {filtered.map(cmd => {
                  const fourn = FOURNISSEURS.find(f => f.id === cmd.fournisseur_id)
                  const sCfg = STATUS_CONFIG[cmd.statut as CommStatus] || STATUS_CONFIG.en_attente
                  return (
                    <tr key={cmd.id} className="hover:bg-zinc-800/30 transition-colors group">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span>{fourn?.emoji || "📦"}</span>
                          <span className="text-zinc-300 text-sm font-medium" style={{ color: fourn?.color }}>
                            {cmd.fournisseur}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-white text-sm">{cmd.produit_nom || cmd.produit || "—"}</td>
                      <td className="px-4 py-3 text-white text-sm font-bold">{cmd.quantite}</td>
                      <td className="px-4 py-3 text-zinc-400 text-sm">{Number(cmd.prix_unitaire||0).toFixed(2)}€</td>
                      <td className="px-4 py-3 text-zinc-400 text-sm">{Number(cmd.frais_livraison||0).toFixed(2)}€</td>
                      <td className="px-4 py-3 text-red-400 text-sm font-bold">-{Number(cmd.total||0).toFixed(2)}€</td>
                      <td className="px-4 py-3">
                        <span className={`text-[11px] font-bold px-2 py-1 rounded-full border ${sCfg.color} ${sCfg.bg} ${sCfg.border}`}>
                          {sCfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-zinc-500 text-xs">
                        {new Date(cmd.date_commande).toLocaleDateString("fr-FR")}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          {cmd.statut === "en_attente" && (
                            <button onClick={() => markAsReceived(cmd)}
                              className="p-1.5 text-green-400 hover:text-green-300 bg-green-400/10 rounded-lg hover:bg-green-400/20 transition-colors"
                              title="Marquer comme reçu (payé)">
                              <CheckCircle2 size={13}/>
                            </button>
                          )}
                          <button onClick={() => deleteCommande(cmd.id)}
                            className="p-1.5 text-red-500 hover:text-red-400 rounded-lg hover:bg-red-500/10">
                            <Trash2 size={13}/>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {activeFourn && (
        <NouvelleCommandePanel
          societyId={activeSociety.id}
          profile={profile}
          fournisseur={activeFourn}
          onClose={() => setActiveFourn(null)}
          onDone={load}
        />
      )}
    </div>
  )
}