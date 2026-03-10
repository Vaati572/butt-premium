"use client"

import { useEffect, useState, useRef } from "react"
import { supabase } from "@/lib/supabase"
import {
  ShoppingCart, Plus, X, Search, User,
  Receipt, ChevronDown, Minus, Check, Package,
  AlertTriangle, Pencil, Save, RotateCcw,
} from "lucide-react"

interface Product { id: string; name: string; gamme: string; pv: number; cf: number }
interface Client { id: string; nom: string; contrat: string; telephone?: string }
interface CartItem { product_id: string; nom: string; gamme: string; quantite: number; pv: number; cf: number }
interface Props { activeSociety: any; profile: any }

const PAIEMENTS = ["Espèces", "Carte Bancaire", "Virement", "Chèque", "En attente"]
const PORT_OPTIONS = [
  "0.00€ ( Sans frais )",
  "6.84€ ( 0.200 - 0.300 )",
  "7.71€ ( 0.300 - 0.500 )",
  "8.60€ ( 0.500 - 0.750 )",
  "9.34€ ( 0.750 - 1kg )",
  "10.48€ ( 1kg - 2kg )",
  "11€ ( 2kg - 3kg )",
]
const DEFAULT_URSSAF_RATE = 0.138
const parsePort = (p: string) => { const m = p.match(/^([\d.,]+)€/); return m ? parseFloat(m[1].replace(",", ".")) : 0 }

const GAMMES = [
  { val: "Particuliers",   label: "👤 Particuliers",   active: "bg-yellow-500 text-black border-yellow-500 shadow-lg shadow-yellow-500/20",  hover: "hover:border-yellow-500/50", gradient: "from-yellow-500/20", iconBg: "bg-yellow-500/20", iconColor: "text-yellow-500/60", pvBg: "bg-yellow-500/15", pvText: "text-yellow-400"  },
  { val: "Professionnels", label: "🏢 Professionnels", active: "bg-purple-500 text-white border-purple-500 shadow-lg shadow-purple-500/20",  hover: "hover:border-purple-500/50", gradient: "from-purple-500/20", iconBg: "bg-purple-500/20", iconColor: "text-purple-400/60", pvBg: "bg-purple-500/15", pvText: "text-purple-300" },
  { val: "Shopify",        label: "🛍️ Shopify",         active: "bg-green-500 text-black border-green-500 shadow-lg shadow-green-500/20",    hover: "hover:border-green-500/50",  gradient: "from-green-500/20",  iconBg: "bg-green-500/20",  iconColor: "text-green-500/60",  pvBg: "bg-green-500/15",  pvText: "text-green-400"  },
]

/* ── HISTORIQUE ─────────────────────────────── */
function HistoriquePanel({ societyId, onClose }: { societyId: string; onClose: () => void }) {
  const [ventes, setVentes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    supabase.from("ventes").select("*, vente_items(*)")
      .eq("society_id", societyId).order("created_at", { ascending: false }).limit(100)
      .then(({ data }) => { setVentes(data || []); setLoading(false) })
  }, [])
  const totalCA = ventes.reduce((s, v) => s + Number(v.total_ttc), 0)
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-end z-50">
      <div className="bg-[#111111] border-l border-zinc-800 w-full max-w-lg h-full flex flex-col shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <div>
            <h3 className="text-base font-bold text-white">Historique des ventes</h3>
            <p className="text-xs text-zinc-500 mt-0.5">{ventes.length} ventes — CA : <span className="text-yellow-500 font-bold">{totalCA.toFixed(2)}€</span></p>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white"><X size={18} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loading
            ? <div className="flex items-center justify-center py-12"><div className="w-6 h-6 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" /></div>
            : ventes.length === 0
              ? <div className="text-center py-12 text-zinc-600"><Receipt size={32} className="mx-auto mb-3 opacity-20" /><p className="text-sm">Aucune vente</p></div>
              : ventes.map(v => (
                <div key={v.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-white text-sm font-semibold">{v.client_nom || "Passage"}</p>
                      <p className="text-zinc-500 text-xs">{new Date(v.created_at).toLocaleString("fr-FR")}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-yellow-500 font-bold">{Number(v.total_ttc).toFixed(2)}€</p>
                      <span className="text-[10px] text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded-full">{v.paiement}</span>
                    </div>
                  </div>
                  {v.vente_items?.length > 0 && (
                    <div className="space-y-0.5 mt-2 pt-2 border-t border-zinc-800">
                      {v.vente_items.map((item: any) => (
                        <div key={item.id} className="flex justify-between text-[11px] text-zinc-500">
                          <span>{item.produit_nom} x{item.quantite}</span>
                          <span>{Number(item.total).toFixed(2)}€</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
        </div>
      </div>
    </div>
  )
}

/* ── VENTE MANUELLE ─────────────────────────── */
function VenteManuellePanel({ profile, societyId, clients, onClose, onDone }: {
  profile: any; societyId: string; clients: Client[]; onClose: () => void; onDone: () => void
}) {
  const [items, setItems] = useState([{ nom: "", quantite: 1, pv: 0 }])
  const [clientSearch, setClientSearch] = useState("")
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [showClients, setShowClients] = useState(false)
  const [paiement, setPaiement] = useState("Espèces")
  const [notes, setNotes] = useState("")
  const [saving, setSaving] = useState(false)
  const total = items.reduce((s, i) => s + i.quantite * i.pv, 0)
  const filteredClients = clients.filter(c => c.nom.toLowerCase().includes(clientSearch.toLowerCase()))
  const handleSave = async () => {
    const validItems = items.filter(i => i.nom.trim() && i.pv > 0)
    if (!validItems.length) return
    setSaving(true)
    const { data: vente } = await supabase.from("ventes").insert({
      society_id: societyId, user_id: profile.id,
      client_id: selectedClient?.id || null,
      client_nom: selectedClient?.nom || "Client de passage",
      total_ht: total, port: 0, remise: 0, total_ttc: total, paiement, notes,
    }).select().single()
    if (vente) {
      await supabase.from("vente_items").insert(validItems.map(i => ({
        vente_id: vente.id, produit_nom: i.nom, quantite: i.quantite,
        pv_unitaire: i.pv, cf_unitaire: 0, total: i.quantite * i.pv,
      })))
    }
    setSaving(false); onDone(); onClose()
  }
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-end z-50">
      <div className="bg-[#111111] border-l border-zinc-800 w-full max-w-md h-full flex flex-col shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <div><h3 className="text-base font-bold text-white">Vente manuelle</h3><p className="text-xs text-zinc-500 mt-0.5">Produits et prix libres</p></div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white"><X size={18} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="relative">
            <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Client</label>
            <button onClick={() => setShowClients(!showClients)}
              className="w-full flex items-center gap-3 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 hover:border-yellow-500/40 transition-colors">
              <User size={14} className="text-yellow-500 shrink-0" />
              <span className="text-white text-sm flex-1 text-left">{selectedClient?.nom || "Client de passage"}</span>
              <ChevronDown size={14} className="text-zinc-500" />
            </button>
            {showClients && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl z-20 overflow-hidden">
                <div className="p-2"><input type="text" placeholder="Rechercher..." value={clientSearch} onChange={e => setClientSearch(e.target.value)} autoFocus className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none" /></div>
                <div className="max-h-40 overflow-y-auto">
                  <button onClick={() => { setSelectedClient(null); setShowClients(false) }} className="w-full text-left px-4 py-2 text-sm text-zinc-400 hover:bg-zinc-800">Client de passage</button>
                  {filteredClients.map(c => (
                    <button key={c.id} onClick={() => { setSelectedClient(c); setShowClients(false) }} className="w-full text-left px-4 py-2 hover:bg-zinc-800">
                      <p className="text-white text-sm">{c.nom}</p><p className="text-zinc-500 text-[11px]">{c.contrat}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Articles</label>
            <div className="space-y-2">
              {items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input type="text" placeholder="Article" value={item.nom}
                    onChange={e => setItems(prev => prev.map((i, j) => j === idx ? { ...i, nom: e.target.value } : i))}
                    className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-500/60" />
                  <input type="number" placeholder="Qté" value={item.quantite} min={1}
                    onChange={e => setItems(prev => prev.map((i, j) => j === idx ? { ...i, quantite: parseInt(e.target.value) || 1 } : i))}
                    className="w-14 bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-2 text-sm text-white text-center focus:outline-none" />
                  <input type="number" placeholder="Prix" value={item.pv} min={0} step={0.01}
                    onChange={e => setItems(prev => prev.map((i, j) => j === idx ? { ...i, pv: parseFloat(e.target.value) || 0 } : i))}
                    className="w-20 bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-2 text-sm text-white text-center focus:outline-none" />
                  <button onClick={() => setItems(prev => prev.filter((_, j) => j !== idx))} className="text-zinc-600 hover:text-red-400"><X size={14} /></button>
                </div>
              ))}
              <button onClick={() => setItems(prev => [...prev, { nom: "", quantite: 1, pv: 0 }])}
                className="flex items-center gap-2 text-[11px] font-semibold text-yellow-500 hover:text-yellow-400">
                <Plus size={12} /> Ajouter un article
              </button>
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Paiement</label>
            <div className="grid grid-cols-3 gap-1.5">
              {PAIEMENTS.map(p => <button key={p} onClick={() => setPaiement(p)} className={`py-2 rounded-lg text-[11px] font-semibold border transition-colors ${paiement === p ? "bg-yellow-500 text-black border-yellow-500" : "bg-zinc-800 text-zinc-400 border-zinc-700 hover:border-zinc-500"}`}>{p}</button>)}
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Notes</label>
            <input type="text" placeholder="Optionnel" value={notes} onChange={e => setNotes(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-500/60" />
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center">
            <p className="text-zinc-500 text-xs mb-1">Total</p>
            <p className="text-yellow-500 text-2xl font-bold">{total.toFixed(2)}€</p>
          </div>
        </div>
        <div className="p-5 border-t border-zinc-800 space-y-3">
          <button onClick={handleSave} disabled={saving} className="w-full bg-yellow-500 hover:bg-yellow-400 disabled:opacity-40 text-black font-bold py-3 rounded-xl text-sm flex items-center justify-center gap-2"><Check size={16} /> Valider</button>
          <button onClick={onClose} className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold py-2.5 rounded-xl text-sm">Annuler</button>
        </div>
      </div>
    </div>
  )
}

/* ── AJOUT PRODUIT ──────────────────────────── */
function AddProductPanel({ societyId, onClose, onDone }: { societyId: string; onClose: () => void; onDone: () => void }) {
  const [nom, setNom] = useState("")
  const [pv, setPv] = useState("")
  const [cf, setCf] = useState("")
  const [gamme, setGamme] = useState("Particuliers")
  const [saving, setSaving] = useState(false)
  const handleSave = async () => {
    if (!nom.trim() || !pv) return
    setSaving(true)
    await supabase.from("products").insert({ society_id: societyId, name: nom, pv: parseFloat(pv) || 0, cf: parseFloat(cf) || 0, gamme, in_stock: true })
    setSaving(false); onDone(); onClose()
  }
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-end z-50">
      <div className="bg-[#111111] border-l border-zinc-800 w-full max-w-sm h-full flex flex-col shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <div><h3 className="text-base font-bold text-white">Nouveau produit</h3><p className="text-xs text-zinc-500 mt-0.5">Ajouter au catalogue</p></div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white"><X size={18} /></button>
        </div>
        <div className="flex-1 p-6 space-y-4">
          {[
            { label: "Nom du produit", value: nom, set: setNom, placeholder: "Ex: Crème hydratante 50ml", type: "text" },
            { label: "Prix de vente (€)", value: pv, set: setPv, placeholder: "0.00", type: "number" },
            { label: "Coût de fabrication (€)", value: cf, set: setCf, placeholder: "0.00", type: "number" },
          ].map(({ label, value, set, placeholder, type }) => (
            <div key={label}>
              <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">{label}</label>
              <input type={type} placeholder={placeholder} value={value} onChange={e => set(e.target.value)} step={type === "number" ? "0.01" : undefined}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-500/60" />
            </div>
          ))}
          <div>
            <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Gamme</label>
            <div className="flex gap-2">
              {[
                { val: "Particuliers",   color: "bg-yellow-500 text-black border-yellow-500" },
                { val: "Professionnels", color: "bg-purple-500 text-white border-purple-500" },
                { val: "Shopify",        color: "bg-green-500 text-black border-green-500" },
              ].map(({ val, color }) => (
                <button key={val} onClick={() => setGamme(val)}
                  className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-colors ${gamme === val ? color : "bg-zinc-800 text-zinc-400 border-zinc-700"}`}>
                  {val === "Shopify" ? "🛍️ Shopify" : val === "Particuliers" ? "👤 Part." : "🏢 Pro"}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="p-6 border-t border-zinc-800 space-y-3">
          <button onClick={handleSave} disabled={saving || !nom.trim() || !pv} className="w-full bg-yellow-500 hover:bg-yellow-400 disabled:opacity-40 text-black font-bold py-3 rounded-xl text-sm flex items-center justify-center gap-2"><Plus size={16} /> Ajouter le produit</button>
          <button onClick={onClose} className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold py-2.5 rounded-xl text-sm">Annuler</button>
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════
   MAIN
══════════════════════════════════════════════ */
export default function VenteModule({ activeSociety, profile }: Props) {
  const [products, setProducts] = useState<Product[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [urssafRate, setUrssafRate] = useState(DEFAULT_URSSAF_RATE)
  const [cart, setCart] = useState<CartItem[]>([])
  const [search, setSearch] = useState("")
  const [searchClient, setSearchClient] = useState("")
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [clientPrixMap, setClientPrixMap] = useState<Record<string, number>>({})
  const [venteDate, setVenteDate] = useState<string>(new Date().toISOString().split("T")[0])
  const [showClients, setShowClients] = useState(false)
  const [typeVente, setTypeVente] = useState("Particulier")
  const [paiement, setPaiement] = useState("Espèces")
  const [port, setPort] = useState(PORT_OPTIONS[0])
  const [portPerso, setPortPerso] = useState("")
  const [fraisColis, setFraisColis] = useState("")
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showHistorique, setShowHistorique] = useState(false)
  const [showManuelle, setShowManuelle] = useState(false)
  const [showAddProduct, setShowAddProduct] = useState(false)
  const [activeGamme, setActiveGamme] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [stockAlerts, setStockAlerts] = useState<string[]>([])
  const [mobileTab, setMobileTab] = useState<"catalogue" | "panier">("catalogue")
  const barcodeRef = useRef<HTMLInputElement>(null)

  useEffect(() => { if (activeSociety) loadData() }, [activeSociety])

  const loadData = async () => {
    setLoading(true)
    const [{ data: prods }, { data: cls }, { data: stockData }, { data: cfgData }] = await Promise.all([
      supabase.from("products").select("*").eq("society_id", activeSociety.id).order("gamme").order("name"),
      supabase.from("clients").select("id, nom, contrat, telephone").eq("society_id", activeSociety.id).order("nom"),
      supabase.from("stock").select("*").eq("society_id", activeSociety.id),
      supabase.from("settings").select("key, value").eq("society_id", activeSociety.id).eq("key", "urssaf_rate_global").single(),
    ])
    setProducts(prods || [])
    setClients(cls || [])
    if (cfgData?.value != null) setUrssafRate(Number(cfgData.value))
    const alerts = (stockData || [])
      .filter((s: any) => s.quantite === 0 || (s.seuil_alerte > 0 && s.quantite <= s.seuil_alerte))
      .map((s: any) => s.quantite === 0 ? `⚠ RUPTURE: ${s.produit_nom}` : `⚠ Faible: ${s.produit_nom} (${s.quantite})`)
    setStockAlerts(alerts)
    setLoading(false)
  }

  const filteredProducts = activeGamme
    ? products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) && p.gamme === activeGamme)
    : []

  const filteredClients = clients.filter(c => c.nom.toLowerCase().includes(searchClient.toLowerCase()))

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(i => i.product_id === product.id)
      const prix = clientPrixMap[product.id] ?? product.pv
      if (existing) return prev.map(i => i.product_id === product.id ? { ...i, quantite: i.quantite + 1 } : i)
      return [...prev, { product_id: product.id, nom: product.name, gamme: product.gamme, quantite: 1, pv: prix, cf: product.cf }]
    })
  }

  const updateQty = (productId: string, qty: number) => {
    if (qty <= 0) { setCart(prev => prev.filter(i => i.product_id !== productId)); return }
    setCart(prev => prev.map(i => i.product_id === productId ? { ...i, quantite: qty } : i))
  }

  const updatePrice = (productId: string, price: number) => {
    setCart(prev => prev.map(i => i.product_id === productId ? { ...i, pv: price } : i))
  }

  const portVal = portPerso ? parseFloat(portPerso.replace(",", ".")) || 0 : parsePort(port)
  const totalHT = cart.reduce((sum, i) => sum + i.pv * i.quantite, 0)
  const totalTTC = totalHT + portVal
  const urssaf = totalTTC * urssafRate
  const cfTotal = cart.reduce((sum, i) => sum + i.cf * i.quantite, 0)
  const fraisColisVal = parseFloat(fraisColis.replace(",", ".")) || 0
  const resultat = totalTTC - urssaf - cfTotal - fraisColisVal
  const cartCount = cart.reduce((s, i) => s + i.quantite, 0)

  const saveBrouillon = () => {
    try { localStorage.setItem("brouillon_vente_" + activeSociety.id, JSON.stringify(cart)) } catch {}
    alert("Brouillon sauvegardé !")
  }
  const loadBrouillon = () => {
    try {
      const data = localStorage.getItem("brouillon_vente_" + activeSociety.id)
      if (data) setCart(JSON.parse(data))
    } catch {}
  }

  const handleVente = async () => {
    if (cart.length === 0) return
    setSaving(true)
    const { data: vente, error } = await supabase.from("ventes").insert({
      society_id: activeSociety.id, user_id: profile.id,
      client_id: selectedClient?.id || null,
      client_nom: selectedClient?.nom || (typeVente === "Shopify" ? "Commande Shopify" : typeVente === "Pharmacie" ? "Pharmacie" : "Client de passage"),
      created_at: venteDate ? new Date(venteDate + "T12:00:00").toISOString() : new Date().toISOString(),
      total_ht: totalHT, port: portVal, remise: 0, total_ttc: totalTTC, paiement, notes,
    }).select().single()
    if (!error && vente) {
      await supabase.from("vente_items").insert(cart.map(item => ({
        vente_id: vente.id, product_id: item.product_id, produit_nom: item.nom,
        gamme: item.gamme, quantite: item.quantite, pv_unitaire: item.pv,
        cf_unitaire: item.cf, total: item.pv * item.quantite,
      })))
      const { data: allStockData } = await supabase.from("stock").select("*").eq("society_id", activeSociety.id)
      const allStock = allStockData || []
      for (const item of cart) {
        const { data: fullProduct } = await supabase.from("products").select("composition, in_stock").eq("id", item.product_id).single()
        let composition: Record<string, number> = {}
        if (fullProduct?.composition) {
          composition = typeof fullProduct.composition === "string" ? JSON.parse(fullProduct.composition) : fullProduct.composition
        }
        const compoEntries = Object.entries(composition)
        if (compoEntries.length > 0) {
          for (const [compNom, qtyParUnite] of compoEntries) {
            const totalADeduire = item.quantite * Number(qtyParUnite)
            const stockItem = allStock.find((s: any) => s.produit_nom.toLowerCase().trim() === compNom.toLowerCase().trim())
            if (stockItem) {
              const newQty = stockItem.quantite - totalADeduire
              await supabase.from("stock").update({ quantite: newQty, updated_at: new Date().toISOString() }).eq("id", stockItem.id)
              await supabase.from("stock_history").insert({ society_id: activeSociety.id, product_id: stockItem.product_id, produit_nom: stockItem.produit_nom, user_id: profile.id, action: "Sortie", quantite: totalADeduire, quantite_avant: stockItem.quantite, quantite_apres: newQty, notes: `Vente "${item.nom}" ×${item.quantite} via composition — ${selectedClient?.nom || "passage"}` })
              stockItem.quantite = newQty
            }
          }
        } else {
          const stockItem = allStock.find((s: any) => s.product_id === item.product_id)
          if (stockItem) {
            const newQty = stockItem.quantite - item.quantite
            await supabase.from("stock").update({ quantite: newQty, updated_at: new Date().toISOString() }).eq("id", stockItem.id)
            await supabase.from("stock_history").insert({ society_id: activeSociety.id, product_id: item.product_id, produit_nom: item.nom, user_id: profile.id, action: "Sortie", quantite: item.quantite, quantite_avant: stockItem.quantite, quantite_apres: newQty, notes: `Vente — ${selectedClient?.nom || "passage"}` })
            stockItem.quantite = newQty
          }
        }
      }
      setCart([]); setSelectedClient(null); setNotes(""); setClientPrixMap({})
      setPaiement("Espèces"); setPort(PORT_OPTIONS[0]); setPortPerso(""); setFraisColis("")
      setSuccess(true)
      setMobileTab("catalogue")
      setTimeout(() => { setSuccess(false); loadData() }, 2500)
    }
    setSaving(false)
  }

  const gammeConfig = GAMMES.find(g => g.val === activeGamme) || GAMMES[0]

  /* ─────────────────────────────────────────────
     CATALOGUE (partagé desktop + mobile)
  ───────────────────────────────────────────── */
  const Catalogue = (
    <div className="flex-1 flex flex-col overflow-hidden border-r border-zinc-900 min-w-0">
      <div className="p-4 border-b border-zinc-900 space-y-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-white">🛒 Vente</h1>
          <div className="flex gap-2">
            <button onClick={() => setShowManuelle(true)} className="flex items-center gap-1.5 text-xs text-zinc-400 bg-zinc-900 border border-zinc-800 px-3 py-2 rounded-xl hover:border-zinc-600">
              <Pencil size={13} /> Manuelle
            </button>
            <button onClick={() => setShowHistorique(true)} className="flex items-center gap-1.5 text-xs text-zinc-400 bg-zinc-900 border border-zinc-800 px-3 py-2 rounded-xl hover:border-zinc-600">
              <Receipt size={13} /> Historique
            </button>
          </div>
        </div>

        {stockAlerts.length > 0 && (
          <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2">
            <AlertTriangle size={13} className="text-red-400 shrink-0" />
            <p className="text-red-400 text-[11px] font-semibold truncate">{stockAlerts.slice(0, 3).join(" | ")}</p>
          </div>
        )}

        <div className="flex gap-1.5 flex-wrap">
          {["Particulier", "Shopify", "Clients", "Pharmacie"].map(t => (
            <button key={t} onClick={() => { setTypeVente(t); setSelectedClient(null) }}
              className={`text-[11px] font-semibold px-3 py-1.5 rounded-lg border transition-colors ${typeVente === t ? "bg-yellow-500 text-black border-yellow-500" : "text-zinc-400 border-zinc-800 bg-zinc-900 hover:border-zinc-600"}`}>
              {t === "Pharmacie" ? "🏥 " : ""}{t}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          {GAMMES.map(({ val, label, active }) => (
            <button key={val} onClick={() => setActiveGamme(activeGamme === val ? null : val)}
              className={`flex-1 py-2 text-[11px] md:text-sm font-bold rounded-xl border transition-all duration-200 ${activeGamme === val ? active : "text-zinc-400 border-zinc-800 bg-zinc-900 hover:border-zinc-600"}`}>
              {label}
            </button>
          ))}
        </div>

        {activeGamme && (
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input type="text" placeholder={`Rechercher dans ${activeGamme}...`} value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-500/50" />
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 pb-24 md:pb-4">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !activeGamme ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="text-5xl mb-4">🛒</div>
            <p className="text-white text-lg font-bold mb-2">Choisissez une gamme</p>
            <p className="text-zinc-500 text-sm mb-8">Sélectionnez une gamme pour afficher le catalogue</p>
            <div className="flex gap-3 flex-wrap justify-center">
              {GAMMES.map(({ val, label, hover }) => (
                <button key={val} onClick={() => setActiveGamme(val)}
                  className={`flex flex-col items-center gap-3 bg-zinc-900 border border-zinc-800 ${hover} rounded-2xl p-5 transition-all hover:bg-zinc-800/60`}>
                  <span className="text-4xl">{label.split(" ")[0]}</span>
                  <p className="text-white font-bold">{val}</p>
                  <p className="text-zinc-500 text-xs">{products.filter(p => p.gamme === val).length} produits</p>
                </button>
              ))}
            </div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-16 text-zinc-600">
            <Package size={36} className="mx-auto mb-3 opacity-20" />
            <p className="text-sm">Aucun produit trouvé</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 xl:grid-cols-3 gap-3">
            {filteredProducts.map(product => {
              const inCart = cart.find(i => i.product_id === product.id)
              const prod = product as any
              const composition: Record<string, number> = prod.composition
                ? (typeof prod.composition === "string" ? JSON.parse(prod.composition) : prod.composition)
                : {}
              const hasCompo = Object.keys(composition).length > 0
              const marge = product.pv - product.cf
              return (
                <button key={product.id} onClick={() => addToCart(product)}
                  className={`relative text-left rounded-2xl border transition-all duration-200 overflow-hidden ${
                    inCart ? "bg-yellow-500/10 border-yellow-500/50 shadow-lg shadow-yellow-500/10" : "bg-zinc-900 border-zinc-800 hover:border-yellow-500/30 hover:bg-zinc-800/60"
                  }`}>
                  {inCart && (
                    <div className="absolute top-2 right-2 z-10 w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center text-black text-xs font-bold shadow-lg">
                      {inCart.quantite}
                    </div>
                  )}
                  <div className={`w-full h-32 md:h-44 flex items-center justify-center relative overflow-hidden bg-gradient-to-br ${gammeConfig.gradient} to-zinc-900`}>
                    {prod.avatar_url ? (
                      <img src={prod.avatar_url} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className={`w-14 h-14 md:w-20 md:h-20 rounded-2xl flex items-center justify-center ${gammeConfig.iconBg}`}>
                        <Package size={24} className={gammeConfig.iconColor} />
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-white text-xs md:text-sm font-bold leading-tight mb-2">{product.name}</p>
                    <div className="grid grid-cols-2 gap-1.5 mb-2">
                      <div className="bg-zinc-800 rounded-lg px-2 py-1">
                        <p className="text-zinc-500 text-[9px] uppercase font-semibold">CF</p>
                        <p className="text-zinc-300 text-xs font-bold">{Number(product.cf).toFixed(2)}€</p>
                      </div>
                      <div className={`rounded-lg px-2 py-1 ${gammeConfig.pvBg}`}>
                        <p className="text-zinc-500 text-[9px] uppercase font-semibold">PV</p>
                        <p className={`text-xs font-bold ${gammeConfig.pvText}`}>{Number(product.pv).toFixed(2)}€</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-600 text-[10px]">Marge</span>
                      <span className={`text-[11px] font-semibold ${marge >= 0 ? "text-green-400" : "text-red-400"}`}>+{marge.toFixed(2)}€</span>
                    </div>
                    {hasCompo && (
                      <div className="border-t border-zinc-800 pt-2 mt-2">
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(composition).map(([name, qty]) => (
                            <span key={name} className="text-[9px] bg-zinc-800 border border-zinc-700 text-zinc-400 px-1.5 py-0.5 rounded-full">{qty}× {name}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )

  /* ─────────────────────────────────────────────
     PANIER (partagé desktop + mobile)
  ───────────────────────────────────────────── */
  const Panier = (
    <div className="flex-1 md:flex-none md:w-96 bg-[#111111] flex flex-col overflow-hidden">
      <div className="p-4 border-b border-zinc-800">
        {typeVente === "Clients" ? (
          <div className="relative">
            <button onClick={() => setShowClients(!showClients)}
              className="w-full flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 hover:border-yellow-500/40 transition-colors">
              <div className="w-8 h-8 bg-yellow-500/10 rounded-lg flex items-center justify-center shrink-0">
                <User size={13} className="text-yellow-500" />
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="text-white text-sm font-medium truncate">{selectedClient?.nom || "Sélectionner un client"}</p>
                {selectedClient && <p className="text-zinc-500 text-[11px]">{selectedClient.contrat}</p>}
              </div>
              <ChevronDown size={13} className="text-zinc-500 shrink-0" />
            </button>
            {showClients && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl z-20 overflow-hidden">
                <div className="p-2"><input type="text" placeholder="Rechercher..." value={searchClient} onChange={e => setSearchClient(e.target.value)} autoFocus className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none" /></div>
                <div className="max-h-48 overflow-y-auto">
                  {filteredClients.map(c => (
                    <button key={c.id} onClick={async () => {
                      setSelectedClient(c); setShowClients(false)
                      const { data } = await supabase.from("client_prix").select("*").eq("client_id", c.id)
                      const map: Record<string, number> = {}
                      ;(data || []).forEach((p: any) => { map[p.product_id] = p.prix })
                      setClientPrixMap(map)
                    }} className="w-full text-left px-4 py-2.5 hover:bg-zinc-800">
                      <p className="text-white text-sm">{c.nom}</p><p className="text-zinc-500 text-[11px]">{c.contrat}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3">
            <div className="w-8 h-8 bg-zinc-800 rounded-lg flex items-center justify-center shrink-0">
              <User size={13} className="text-zinc-500" />
            </div>
            <p className="text-zinc-400 text-sm">{typeVente === "Shopify" ? "🛍️ Commande Shopify" : typeVente === "Pharmacie" ? "🏥 Pharmacie" : "Client de passage"}</p>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2 pb-24 md:pb-4">
        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-zinc-700">
            <ShoppingCart size={36} className="mb-3 opacity-30" />
            <p className="text-sm">Panier vide</p>
            <p className="text-xs mt-1 text-center">Allez sur "Catalogue" pour ajouter des produits</p>
          </div>
        ) : cart.map(item => (
          <div key={item.product_id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-3">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 mr-2">
                <p className="text-white text-sm font-medium leading-tight">{item.nom}</p>
                <p className="text-zinc-600 text-[11px]">{item.gamme}</p>
              </div>
              <button onClick={() => setCart(prev => prev.filter(i => i.product_id !== item.product_id))} className="text-zinc-600 hover:text-red-400">
                <X size={13} />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-zinc-800 rounded-lg">
                <button onClick={() => updateQty(item.product_id, item.quantite - 1)} className="w-7 h-7 flex items-center justify-center text-zinc-400 hover:text-white"><Minus size={11} /></button>
                <span className="text-white text-sm font-bold w-6 text-center">{item.quantite}</span>
                <button onClick={() => updateQty(item.product_id, item.quantite + 1)} className="w-7 h-7 flex items-center justify-center text-zinc-400 hover:text-white"><Plus size={11} /></button>
              </div>
              <input type="number" step="0.01" value={item.pv}
                onChange={e => updatePrice(item.product_id, parseFloat(e.target.value) || 0)}
                className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1.5 text-sm text-white text-center focus:outline-none focus:border-yellow-500/60" />
              <span className="text-zinc-500 text-xs">€</span>
              <p className="text-yellow-500 font-bold text-sm w-16 text-right shrink-0">{(item.pv * item.quantite).toFixed(2)}€</p>
            </div>
          </div>
        ))}
      </div>

      {cart.length > 0 && (
        <div className="px-4 py-2 border-t border-zinc-900 flex gap-3">
          <button onClick={saveBrouillon} className="flex items-center gap-1 text-[11px] font-semibold text-zinc-500 hover:text-yellow-500 transition-colors">
            <Save size={11} /> ⏸ En attente
          </button>
          <button onClick={loadBrouillon} className="flex items-center gap-1 text-[11px] font-semibold text-zinc-500 hover:text-yellow-500 transition-colors">
            <RotateCcw size={11} /> ▶ Reprendre
          </button>
        </div>
      )}

      {cart.length > 0 && (
        <div className="border-t border-zinc-800 p-4 space-y-3">
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-[10px] text-zinc-500 font-semibold uppercase tracking-wider mb-1">PORT</label>
              <select value={port} onChange={e => setPort(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1.5 text-[11px] text-white focus:outline-none">
                {PORT_OPTIONS.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div className="w-24">
              <label className="block text-[10px] text-zinc-500 font-semibold uppercase tracking-wider mb-1">PORT PERSO</label>
              <input type="text" placeholder="0.00" value={portPerso} onChange={e => setPortPerso(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1.5 text-sm text-white text-center focus:outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-[10px] text-zinc-500 font-semibold uppercase tracking-wider mb-1">NOTES</label>
            <input type="text" placeholder="Notes de la vente..." value={notes} onChange={e => setNotes(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-white placeholder-zinc-600 focus:outline-none" />
          </div>
          <div>
            <label className="block text-[10px] text-zinc-500 font-semibold uppercase tracking-wider mb-1">FRAIS COLIS <span className="normal-case text-zinc-600 font-normal">(optionnel)</span></label>
            <div className="relative">
              <input type="text" placeholder="0.00" value={fraisColis} onChange={e => setFraisColis(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-red-500/40" />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 text-xs">€</span>
            </div>
          </div>
          <div>
            <label className="block text-[10px] text-zinc-500 font-semibold uppercase tracking-wider mb-1">PAIEMENT</label>
            <div className="grid grid-cols-3 gap-1">
              {PAIEMENTS.map(p => (
                <button key={p} onClick={() => setPaiement(p)}
                  className={`py-1.5 rounded-lg text-[10px] font-semibold border transition-colors ${paiement === p ? "bg-yellow-500 text-black border-yellow-500" : "bg-zinc-800 text-zinc-400 border-zinc-700 hover:border-zinc-500"}`}>
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2">
            <span className="text-zinc-500 text-xs whitespace-nowrap">📅 Date :</span>
            <input type="date" value={venteDate} onChange={e => setVenteDate(e.target.value)} className="flex-1 bg-transparent text-xs text-white focus:outline-none" />
            {venteDate !== new Date().toISOString().split("T")[0] && (
              <span className="text-orange-400 text-[10px] font-bold whitespace-nowrap">≠ Aujourd'hui</span>
            )}
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 space-y-1">
            <div className="flex justify-between text-xs text-zinc-400"><span>CA Brut</span><span>{totalHT.toFixed(2)}€</span></div>
            {portVal > 0 && <div className="flex justify-between text-xs text-zinc-400"><span>Port</span><span>+{portVal.toFixed(2)}€</span></div>}
            <div className="flex justify-between text-xs text-zinc-500 border-t border-zinc-800 pt-1"><span>Sous-total</span><span>{totalTTC.toFixed(2)}€</span></div>
            <div className="flex justify-between text-xs text-zinc-600"><span>URSSAF ({(urssafRate * 100).toFixed(1)}%)</span><span>-{urssaf.toFixed(2)}€</span></div>
            <div className="flex justify-between text-xs text-orange-400/80"><span>Après URSSAF</span><span>{(totalTTC - urssaf).toFixed(2)}€</span></div>
            <div className="flex justify-between text-xs text-zinc-600"><span>Coût fabrication</span><span>-{cfTotal.toFixed(2)}€</span></div>
            {fraisColisVal > 0 && <div className="flex justify-between text-xs text-red-400/80"><span>Frais colis</span><span>-{fraisColisVal.toFixed(2)}€</span></div>}
            <div className={`flex justify-between text-sm font-bold border-t border-zinc-800 pt-1.5 ${resultat >= 0 ? "text-green-400" : "text-red-400"}`}>
              <span>Résultat net</span><span>{resultat.toFixed(2)}€</span>
            </div>
            <div className="flex justify-between text-base font-bold text-white border-t border-zinc-800 pt-1.5">
              <span>TOTAL CLIENT</span><span className="text-yellow-500 text-lg">{totalTTC.toFixed(2)}€</span>
            </div>
          </div>
          <button onClick={handleVente} disabled={saving || cart.length === 0}
            className={`w-full font-bold py-3.5 rounded-xl text-sm transition-all flex items-center justify-center gap-2 ${success ? "bg-green-500 text-white" : "bg-yellow-500 hover:bg-yellow-400 disabled:opacity-40 text-black shadow-lg shadow-yellow-500/20"}`}>
            {success ? <><Check size={16} /> ✔ Vente enregistrée !</>
              : saving ? <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
              : <><ShoppingCart size={15} /> ✔ VALIDER — {totalTTC.toFixed(2)}€</>}
          </button>
        </div>
      )}
    </div>
  )

  /* ─────────────────────────────────────────────
     RENDER
  ───────────────────────────────────────────── */
  return (
    <div className="flex-1 overflow-hidden bg-[#0a0a0a] relative flex flex-col">

      {/* ── DESKTOP (md+) : côte à côte ── */}
      <div className="hidden md:flex flex-1 overflow-hidden">
        {Catalogue}
        {Panier}
      </div>

      {/* ── MOBILE : un seul panneau à la fois ── */}
      <div className="flex md:hidden flex-1 overflow-hidden">
        {mobileTab === "catalogue" ? Catalogue : Panier}
      </div>

      {/* ── BARRE DE NAV MOBILE (fixe en bas) ── */}
      <div className="flex md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-zinc-800 bg-[#111111]">
        <button
          onClick={() => setMobileTab("catalogue")}
          className={`flex-1 flex flex-col items-center justify-center py-3 gap-0.5 transition-colors ${mobileTab === "catalogue" ? "text-yellow-500" : "text-zinc-500"}`}>
          <Package size={22} />
          <span className="text-[10px] font-bold">Catalogue</span>
        </button>
        <button
          onClick={() => setMobileTab("panier")}
          className={`flex-1 flex flex-col items-center justify-center py-3 gap-0.5 transition-colors relative ${mobileTab === "panier" ? "text-yellow-500" : "text-zinc-500"}`}>
          <div className="relative">
            <ShoppingCart size={22} />
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-3 w-5 h-5 bg-yellow-500 text-black text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
                {cartCount > 9 ? "9+" : cartCount}
              </span>
            )}
          </div>
          <span className="text-[10px] font-bold">
            {cartCount > 0 ? `Panier · ${totalTTC.toFixed(0)}€` : "Panier"}
          </span>
        </button>
      </div>

      {showHistorique && <HistoriquePanel societyId={activeSociety.id} onClose={() => setShowHistorique(false)} />}
      {showManuelle && <VenteManuellePanel profile={profile} societyId={activeSociety.id} clients={clients} onClose={() => setShowManuelle(false)} onDone={loadData} />}
      {showAddProduct && <AddProductPanel societyId={activeSociety.id} onClose={() => setShowAddProduct(false)} onDone={loadData} />}
    </div>
  )
}
