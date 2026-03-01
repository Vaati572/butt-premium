"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import {
  Package, AlertTriangle, Plus, X, Pencil,
  Trash2, Search, TrendingUp, TrendingDown,
  History, ChevronDown, Eye, EyeOff, RotateCcw,
} from "lucide-react"

interface StockItem {
  id: string
  product_id: string
  produit_nom: string
  quantite: number
  seuil_alerte: number
  hidden: boolean
  updated_at: string
}

interface StockHistory {
  id: string
  produit_nom: string
  action: string
  quantite: number
  quantite_avant: number
  quantite_apres: number
  notes?: string
  created_at: string
  user_nom?: string
}

interface Product {
  id: string
  name: string
  gamme: string
}

interface Props {
  activeSociety: any
  profile: any
}

const ACTION_COLORS: Record<string, string> = {
  "Entrée":      "text-green-400 bg-green-400/10 border-green-400/20",
  "Sortie":      "text-red-400 bg-red-400/10 border-red-400/20",
  "Correction":  "text-blue-400 bg-blue-400/10 border-blue-400/20",
  "Inventaire":  "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
}

/* ── PANEL MOUVEMENT ─────────────────────────── */
function MouvementPanel({ item, profile, onClose, onDone }: {
  item: StockItem
  profile: any
  onClose: () => void
  onDone: () => void
}) {
  const [action, setAction] = useState("Entrée")
  const [quantite, setQuantite] = useState("")
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    const qty = parseFloat(quantite)
    if (!qty || isNaN(qty)) return
    setLoading(true)

    let newQty = item.quantite
    if (action === "Entrée") newQty = item.quantite + qty
    else if (action === "Sortie") newQty = Math.max(0, item.quantite - qty)
    else if (action === "Correction" || action === "Inventaire") newQty = qty

    await supabase.from("stock").update({
      quantite: newQty,
      updated_at: new Date().toISOString(),
    }).eq("id", item.id)

    await supabase.from("stock_history").insert({
      society_id: item.product_id,
      product_id: item.product_id,
      produit_nom: item.produit_nom,
      user_id: profile.id,
      action,
      quantite: qty,
      quantite_avant: item.quantite,
      quantite_apres: newQty,
      notes,
    })

    setLoading(false)
    onDone()
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-end z-50">
      <div className="bg-[#111111] border-l border-zinc-800 w-full max-w-sm h-full flex flex-col shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <div>
            <h3 className="text-base font-bold text-white">Mouvement de stock</h3>
            <p className="text-xs text-zinc-500 mt-0.5">{item.produit_nom}</p>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors"><X size={18} /></button>
        </div>

        <div className="flex-1 p-6 space-y-5">
          {/* Stock actuel */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center">
            <p className="text-[11px] text-zinc-500 uppercase tracking-wider mb-1">Stock actuel</p>
            <p className={`text-3xl font-bold ${item.quantite <= item.seuil_alerte ? "text-red-400" : "text-yellow-500"}`}>
              {item.quantite}
            </p>
            {item.seuil_alerte > 0 && (
              <p className="text-[11px] text-zinc-600 mt-1">Seuil alerte : {item.seuil_alerte}</p>
            )}
          </div>

          {/* Type de mouvement */}
          <div>
            <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-2">Type</label>
            <div className="grid grid-cols-2 gap-2">
              {["Entrée", "Sortie", "Correction", "Inventaire"].map((a) => (
                <button key={a} onClick={() => setAction(a)}
                  className={`py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                    action === a
                      ? "bg-yellow-500 text-black border-yellow-500"
                      : "bg-zinc-800 text-zinc-400 border-zinc-700 hover:border-zinc-500"
                  }`}>
                  {a === "Entrée" && "📥 "}
                  {a === "Sortie" && "📤 "}
                  {a === "Correction" && "✏️ "}
                  {a === "Inventaire" && "📋 "}
                  {a}
                </button>
              ))}
            </div>
          </div>

          {/* Quantité */}
          <div>
            <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">
              {action === "Correction" || action === "Inventaire" ? "Nouvelle quantité" : "Quantité"}
            </label>
            <input
              type="number"
              min="0"
              step="0.001"
              placeholder="0"
              value={quantite}
              onChange={(e) => setQuantite(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white text-lg font-bold text-center focus:outline-none focus:border-yellow-500/60 transition-colors"
            />
            {quantite && action === "Entrée" && (
              <p className="text-xs text-green-400 mt-1 text-center">→ Nouveau stock : {item.quantite + parseFloat(quantite || "0")}</p>
            )}
            {quantite && action === "Sortie" && (
              <p className="text-xs text-red-400 mt-1 text-center">→ Nouveau stock : {Math.max(0, item.quantite - parseFloat(quantite || "0"))}</p>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Notes</label>
            <input
              type="text"
              placeholder="Raison du mouvement..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-500/60 transition-colors"
            />
          </div>
        </div>

        <div className="p-6 border-t border-zinc-800 space-y-3">
          <button onClick={handleSave} disabled={loading || !quantite}
            className="w-full bg-yellow-500 hover:bg-yellow-400 disabled:opacity-40 text-black font-bold py-3 rounded-xl text-sm transition-colors">
            {loading ? "Enregistrement..." : "Valider le mouvement"}
          </button>
          <button onClick={onClose}
            className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold py-2.5 rounded-xl text-sm transition-colors">
            Annuler
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── PANEL HISTORIQUE ───────────────────────── */
function HistoryPanel({ societyId, onClose }: { societyId: string; onClose: () => void }) {
  const [history, setHistory] = useState<StockHistory[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("stock_history")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100)
      setHistory(data || [])
      setLoading(false)
    }
    load()
  }, [])

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-end z-50">
      <div className="bg-[#111111] border-l border-zinc-800 w-full max-w-md h-full flex flex-col shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <div>
            <h3 className="text-base font-bold text-white">Historique des mouvements</h3>
            <p className="text-xs text-zinc-500 mt-0.5">{history.length} entrées</p>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors"><X size={18} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-12 text-zinc-600">
              <History size={32} className="mx-auto mb-3 opacity-20" />
              <p className="text-sm">Aucun mouvement enregistré</p>
            </div>
          ) : history.map((h) => (
            <div key={h.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <div className="flex items-start justify-between mb-2">
                <p className="text-white text-sm font-semibold">{h.produit_nom}</p>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${ACTION_COLORS[h.action] || "text-zinc-400 bg-zinc-800 border-zinc-700"}`}>
                  {h.action}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-zinc-500">
                <span>{h.quantite_avant} → <span className="text-white font-semibold">{h.quantite_apres}</span></span>
                {h.notes && <span className="italic truncate">"{h.notes}"</span>}
              </div>
              <p className="text-[11px] text-zinc-700 mt-1">
                {new Date(h.created_at).toLocaleString("fr-FR")}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ── PANEL NOUVEAU PRODUIT STOCK ─────────────── */
function AddStockPanel({ societyId, onClose, onDone }: {
  societyId: string
  onClose: () => void
  onDone: () => void
}) {
  const [products, setProducts] = useState<Product[]>([])
  const [selected, setSelected] = useState("")
  const [customName, setCustomName] = useState("")
  const [quantite, setQuantite] = useState("0")
  const [seuil, setSeuil] = useState("0")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    supabase.from("products").select("*").eq("society_id", societyId).then(({ data }) => {
      setProducts(data || [])
    })
  }, [societyId])

  const handleSave = async () => {
    const nom = selected === "__custom" ? customName : products.find(p => p.id === selected)?.name || customName
    if (!nom.trim()) return
    setLoading(true)

    await supabase.from("stock").insert({
      society_id: societyId,
      product_id: selected !== "__custom" ? selected : null,
      produit_nom: nom,
      quantite: parseFloat(quantite) || 0,
      seuil_alerte: parseFloat(seuil) || 0,
    })

    setLoading(false)
    onDone()
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-end z-50">
      <div className="bg-[#111111] border-l border-zinc-800 w-full max-w-sm h-full flex flex-col shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <div>
            <h3 className="text-base font-bold text-white">Ajouter au stock</h3>
            <p className="text-xs text-zinc-500 mt-0.5">Nouveau produit à suivre</p>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors"><X size={18} /></button>
        </div>

        <div className="flex-1 p-6 space-y-4">
          <div>
            <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Produit</label>
            <select value={selected} onChange={(e) => setSelected(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-500/60 transition-colors">
              <option value="">-- Sélectionner --</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              <option value="__custom">+ Nom personnalisé</option>
            </select>
          </div>

          {(selected === "__custom" || !selected) && (
            <div>
              <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Nom du produit</label>
              <input type="text" placeholder="Nom du produit..." value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-500/60 transition-colors" />
            </div>
          )}

          <div>
            <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Quantité initiale</label>
            <input type="number" min="0" step="0.001" value={quantite}
              onChange={(e) => setQuantite(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-500/60 transition-colors" />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Seuil d'alerte</label>
            <input type="number" min="0" step="0.001" value={seuil}
              onChange={(e) => setSeuil(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-500/60 transition-colors" />
            <p className="text-[11px] text-zinc-600 mt-1">Une alerte s'affiche si le stock passe sous ce seuil</p>
          </div>
        </div>

        <div className="p-6 border-t border-zinc-800 space-y-3">
          <button onClick={handleSave} disabled={loading}
            className="w-full bg-yellow-500 hover:bg-yellow-400 disabled:opacity-40 text-black font-bold py-3 rounded-xl text-sm transition-colors flex items-center justify-center gap-2">
            <Plus size={16} /> Ajouter au stock
          </button>
          <button onClick={onClose}
            className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold py-2.5 rounded-xl text-sm transition-colors">
            Annuler
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── MAIN ───────────────────────────────────── */
export default function StocksModule({ activeSociety, profile }: Props) {
  const [stock, setStock] = useState<StockItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [showAdd, setShowAdd] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [movementItem, setMovementItem] = useState<StockItem | null>(null)
  const [filterAlert, setFilterAlert] = useState(false)
  const [showHidden, setShowHidden] = useState(false)

  useEffect(() => { if (activeSociety) loadStock() }, [activeSociety])

  const loadStock = async () => {
    setLoading(true)
    const { data } = await supabase
      .from("stock")
      .select("*")
      .eq("society_id", activeSociety.id)
      .order("produit_nom")
    setStock(data || [])
    setLoading(false)
  }

  const toggleHidden = async (item: StockItem) => {
    await supabase.from("stock").update({ hidden: !item.hidden }).eq("id", item.id)
    loadStock()
  }

  const deleteStock = async (id: string) => {
    if (!confirm("Supprimer ce produit du stock ?")) return
    await supabase.from("stock").delete().eq("id", id)
    loadStock()
  }

  const filtered = stock.filter(item => {
    if (!showHidden && item.hidden) return false
    if (filterAlert && item.quantite > item.seuil_alerte) return false
    return item.produit_nom.toLowerCase().includes(search.toLowerCase())
  })

  const alertCount = stock.filter(i => !i.hidden && i.seuil_alerte > 0 && i.quantite <= i.seuil_alerte).length
  const totalProduits = stock.filter(i => !i.hidden).length
  const stockVide = stock.filter(i => !i.hidden && i.quantite === 0).length

  return (
    <div className="flex-1 overflow-y-auto bg-[#0a0a0a]">
      <div className="p-8 max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Stock</h1>
            <p className="text-sm text-zinc-500 mt-0.5">{totalProduits} produits — {activeSociety.name}</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setShowHistory(true)}
              className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors border border-zinc-700">
              <History size={15} /> Historique
            </button>
            <button onClick={() => setShowAdd(true)}
              className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-4 py-2.5 rounded-xl text-sm transition-colors shadow-lg shadow-yellow-500/20">
              <Plus size={16} /> Ajouter
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { icon: Package, label: "Total produits", value: totalProduits, color: "text-yellow-500", bg: "bg-yellow-500/10", border: "border-zinc-800" },
            { icon: AlertTriangle, label: "En alerte", value: alertCount, color: alertCount > 0 ? "text-red-400" : "text-zinc-500", bg: alertCount > 0 ? "bg-red-400/10" : "bg-zinc-800", border: alertCount > 0 ? "border-red-500/20" : "border-zinc-800" },
            { icon: TrendingDown, label: "Stock vide", value: stockVide, color: stockVide > 0 ? "text-orange-400" : "text-zinc-500", bg: stockVide > 0 ? "bg-orange-400/10" : "bg-zinc-800", border: stockVide > 0 ? "border-orange-500/20" : "border-zinc-800" },
          ].map(({ icon: Icon, label, value, color, bg, border }) => (
            <div key={label} className={`bg-zinc-900 border ${border} rounded-2xl p-5`}>
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 ${bg} rounded-lg flex items-center justify-center`}>
                  <Icon size={16} className={color} />
                </div>
                <div>
                  <p className="text-[11px] text-zinc-500 font-semibold uppercase tracking-wider">{label}</p>
                  <p className={`text-xl font-bold ${color}`}>{value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Filtres */}
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input type="text" placeholder="Rechercher un produit..." value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-500/50 transition-colors" />
          </div>
          <button onClick={() => setFilterAlert(!filterAlert)}
            className={`flex items-center gap-2 text-[11px] font-semibold px-3 py-2 rounded-lg border transition-colors ${
              filterAlert ? "bg-red-500/20 text-red-400 border-red-500/40" : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-600"
            }`}>
            <AlertTriangle size={12} /> Alertes seulement
          </button>
          <button onClick={() => setShowHidden(!showHidden)}
            className={`flex items-center gap-2 text-[11px] font-semibold px-3 py-2 rounded-lg border transition-colors ${
              showHidden ? "bg-zinc-700 text-zinc-200 border-zinc-600" : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-600"
            }`}>
            {showHidden ? <Eye size={12} /> : <EyeOff size={12} />}
            {showHidden ? "Masquer cachés" : "Voir cachés"}
          </button>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24 text-zinc-600">
            <Package size={40} className="mx-auto mb-4 opacity-20" />
            <p className="text-sm">Aucun produit en stock</p>
            <button onClick={() => setShowAdd(true)} className="mt-4 text-yellow-500 text-xs hover:underline">
              + Ajouter un produit
            </button>
          </div>
        ) : (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="text-left px-6 py-4 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Produit</th>
                  <th className="text-center px-6 py-4 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Quantité</th>
                  <th className="text-center px-6 py-4 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Seuil alerte</th>
                  <th className="text-center px-6 py-4 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Statut</th>
                  <th className="text-right px-6 py-4 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {filtered.map((item) => {
                  const enAlerte = item.seuil_alerte > 0 && item.quantite <= item.seuil_alerte
                  const vide = item.quantite === 0
                  return (
                    <tr key={item.id} className={`hover:bg-zinc-800/40 transition-colors ${item.hidden ? "opacity-40" : ""}`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                            enAlerte ? "bg-red-500/20 text-red-400" : "bg-yellow-500/20 text-yellow-500"
                          }`}>
                            <Package size={14} />
                          </div>
                          <span className="text-white text-sm font-medium">{item.produit_nom}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`text-lg font-bold ${
                          vide ? "text-zinc-600" : enAlerte ? "text-red-400" : "text-white"
                        }`}>
                          {item.quantite}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-zinc-500 text-sm">{item.seuil_alerte || "—"}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {vide ? (
                          <span className="text-[11px] font-semibold text-zinc-500 bg-zinc-800 px-2.5 py-1 rounded-full border border-zinc-700">Vide</span>
                        ) : enAlerte ? (
                          <span className="text-[11px] font-semibold text-red-400 bg-red-400/10 px-2.5 py-1 rounded-full border border-red-400/20 animate-pulse">⚠ Alerte</span>
                        ) : (
                          <span className="text-[11px] font-semibold text-green-400 bg-green-400/10 px-2.5 py-1 rounded-full border border-green-400/20">OK</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => setMovementItem(item)}
                            className="flex items-center gap-1 text-[11px] font-semibold text-yellow-400 bg-yellow-400/10 border border-yellow-400/20 px-2.5 py-1.5 rounded-lg hover:bg-yellow-400/20 transition-colors">
                            <TrendingUp size={11} /> Mouvement
                          </button>
                          <button onClick={() => toggleHidden(item)}
                            className="text-zinc-500 hover:text-zinc-300 p-1.5 rounded-lg hover:bg-zinc-800 transition-colors">
                            {item.hidden ? <Eye size={14} /> : <EyeOff size={14} />}
                          </button>
                          <button onClick={() => deleteStock(item.id)}
                            className="text-red-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10 transition-colors">
                            <Trash2 size={14} />
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

      {showAdd && (
        <AddStockPanel societyId={activeSociety.id} onClose={() => setShowAdd(false)} onDone={loadStock} />
      )}
      {showHistory && (
        <HistoryPanel societyId={activeSociety.id} onClose={() => setShowHistory(false)} />
      )}
      {movementItem && (
        <MouvementPanel item={movementItem} profile={profile} onClose={() => setMovementItem(null)} onDone={loadStock} />
      )}
    </div>
  )
}
