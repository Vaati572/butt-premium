"use client"

import { useEffect, useState, useRef } from "react"
import { supabase } from "@/lib/supabase"
import {
  ShoppingCart, Plus, X, Search, User, Receipt,
  ChevronDown, Minus, Check, Package, AlertTriangle,
  Pencil, Save, RotateCcw, Trash2, Zap, TrendingUp,
  ChevronRight,
} from "lucide-react"

interface Product { id: string; name: string; gamme: string; pv: number; cf: number; avatar_url?: string; composition?: any }
interface Client { id: string; nom: string; prenom?: string; nom_shop?: string; contrat: string; telephone?: string }
interface CartItem { product_id: string; nom: string; gamme: string; quantite: number; pv: number; cf: number }
interface Props { activeSociety: any; profile: any }

const PAIEMENTS = ["Espèces", "CB", "Virement", "Chèque", "En attente"]
const PORT_OPTIONS = [
  "0.00€ ( Sans frais )",
  "6.84€ ( 0.200 - 0.300 )",
  "7.71€ ( 0.300 - 0.500 )",
  "8.60€ ( 0.500 - 0.750 )",
  "9.34€ ( 0.750 - 1kg )",
  "10.48€ ( 1kg - 2kg )",
  "11€ ( 2kg - 3kg )",
]
const DEFAULT_URSSAF = 0.138
const parsePort = (p: string) => { const m = p.match(/^([\d.,]+)€/); return m ? parseFloat(m[1].replace(",", ".")) : 0 }

const GAMMES = [
  { val: "Particuliers",   emoji: "👤", color: "#eab308", bg: "rgba(234,179,8,0.12)",  border: "rgba(234,179,8,0.5)"  },
  { val: "Professionnels", emoji: "🏢", color: "#a855f7", bg: "rgba(168,85,247,0.12)", border: "rgba(168,85,247,0.5)" },
  { val: "Shopify",        emoji: "🛍️", color: "#22c55e", bg: "rgba(34,197,94,0.12)",  border: "rgba(34,197,94,0.5)"  },
  { val: "Convention",     emoji: "🎪", color: "#f97316", bg: "rgba(249,115,22,0.12)", border: "rgba(249,115,22,0.5)" },
]

const createFacture = async (societyId: string, venteId: string, clientNom: string, montant: number, notes: string) => {
  try {
    const d = new Date()
    const num = `FAC-${d.getFullYear()}${String(d.getMonth()+1).padStart(2,"0")}${String(d.getDate()).padStart(2,"0")}-${Math.floor(Math.random()*9000)+1000}`
    await supabase.from("factures").insert({ society_id: societyId, numero: num, client_nom: clientNom, montant, statut: "en_attente", source: "vente", vente_id: venteId, date_emission: new Date().toISOString().slice(0,10), notes })
  } catch {}
}

/* ── HISTORIQUE ── */
function HistoriquePanel({ societyId, onClose }: { societyId: string; onClose: () => void }) {
  const [ventes, setVentes]   = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState("")
  const [editVente, setEditVente] = useState<any>(null)
  const [editFields, setEditFields] = useState({ clientNom: "", paiement: "", notes: "" })

  const load = () => {
    setLoading(true)
    supabase.from("ventes").select("*, vente_items(*)").eq("society_id", societyId)
      .order("created_at", { ascending: false }).limit(200)
      .then(({ data }) => { setVentes(data||[]); setLoading(false) })
  }
  useEffect(() => { load() }, [])

  const del = async (id: string) => {
    if (!confirm("Supprimer cette vente ?")) return
    await supabase.from("vente_items").delete().eq("vente_id", id)
    await supabase.from("ventes").delete().eq("id", id)
    setVentes(p => p.filter(v => v.id !== id))
  }
  const saveEdit = async () => {
    await supabase.from("ventes").update({ client_nom: editFields.clientNom, paiement: editFields.paiement, notes: editFields.notes }).eq("id", editVente.id)
    setEditVente(null); load()
  }

  const filtered = ventes.filter(v => !search || (v.client_nom||"").toLowerCase().includes(search.toLowerCase()) || (v.notes||"").toLowerCase().includes(search.toLowerCase()))
  const totalCA = filtered.reduce((s,v) => s + Number(v.total_ttc), 0)

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-end z-50">
      <div className="bg-[#111111] border-l border-zinc-800 w-full max-w-lg h-full flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          <div>
            <h3 className="text-base font-bold text-white">Historique des ventes</h3>
            <p className="text-xs text-zinc-500 mt-0.5">{filtered.length} ventes · CA : <span className="text-yellow-400 font-bold">{totalCA.toFixed(2)}€</span></p>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white"><X size={18}/></button>
        </div>
        <div className="px-4 py-2 border-b border-zinc-900">
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"/>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher client, notes..."
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg pl-8 pr-3 py-2 text-sm text-white focus:outline-none"/>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loading
            ? <div className="flex items-center justify-center py-12"><div className="w-6 h-6 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin"/></div>
            : filtered.length === 0
              ? <div className="text-center py-12 text-zinc-600"><Receipt size={32} className="mx-auto mb-3 opacity-20"/><p className="text-sm">Aucune vente</p></div>
              : filtered.map(v => (
                <div key={v.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 group">
                  {editVente?.id === v.id ? (
                    <div className="space-y-2">
                      <input value={editFields.clientNom} onChange={e => setEditFields(p=>({...p,clientNom:e.target.value}))} placeholder="Client"
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none"/>
                      <div className="flex gap-1.5 flex-wrap">
                        {["Espèces","CB","Virement","Chèque","En attente"].map(p => (
                          <button key={p} onClick={() => setEditFields(prev=>({...prev,paiement:p}))}
                            className={`px-2 py-1 rounded text-[11px] font-semibold border transition-colors ${editFields.paiement===p?"bg-yellow-500 text-black border-yellow-500":"bg-zinc-700 text-zinc-400 border-zinc-600"}`}>{p}</button>
                        ))}
                      </div>
                      <input value={editFields.notes} onChange={e => setEditFields(p=>({...p,notes:e.target.value}))} placeholder="Notes"
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none"/>
                      <div className="flex gap-2">
                        <button onClick={saveEdit} className="flex-1 py-1.5 bg-yellow-500 text-black font-bold rounded-lg text-xs">Sauvegarder</button>
                        <button onClick={() => setEditVente(null)} className="px-3 py-1.5 bg-zinc-700 text-zinc-300 rounded-lg text-xs">Annuler</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-white text-sm font-semibold">{v.client_nom || "Passage"}</p>
                          <p className="text-zinc-500 text-xs">{new Date(v.created_at).toLocaleString("fr-FR")}</p>
                        </div>
                        <div className="flex items-start gap-2">
                          <div className="text-right">
                            <p className="text-yellow-400 font-bold">{Number(v.total_ttc).toFixed(2)}€</p>
                            <span className="text-[10px] text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded-full">{v.paiement}</span>
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => { setEditVente(v); setEditFields({ clientNom: v.client_nom||"", paiement: v.paiement||"Espèces", notes: v.notes||"" }) }}
                              className="p-1 text-zinc-400 hover:text-white"><Pencil size={12}/></button>
                            <button onClick={() => del(v.id)} className="p-1 text-red-500 hover:text-red-400"><Trash2 size={12}/></button>
                          </div>
                        </div>
                      </div>
                      {v.vente_items?.length > 0 && (
                        <div className="space-y-0.5 mt-2 pt-2 border-t border-zinc-800">
                          {v.vente_items.map((item: any) => (
                            <div key={item.id} className="flex justify-between text-[11px] text-zinc-500">
                              <span>{item.produit_nom} ×{item.quantite}</span>
                              <span>{Number(item.total).toFixed(2)}€</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
        </div>
      </div>
    </div>
  )
}

/* ── VENTE MANUELLE ── */
function VenteManuellePanel({ societyId, profile, clients, onClose, onDone }: {
  societyId: string; profile: any; clients: Client[]; onClose: () => void; onDone: () => void
}) {
  const [items, setItems] = useState([{ nom: "", quantite: 1, pv: 0 }])
  const [clientSearch, setClientSearch] = useState("")
  const [selectedClient, setSelectedClient] = useState<Client|null>(null)
  const [showClients, setShowClients] = useState(false)
  const [paiement, setPaiement] = useState("Espèces")
  const [notes, setNotes] = useState("")
  const [saving, setSaving] = useState(false)
  const total = items.reduce((s,i) => s + i.quantite * i.pv, 0)
  const filtered = clients.filter(c => { const s = clientSearch.toLowerCase(); return c.nom?.toLowerCase().includes(s)||c.prenom?.toLowerCase().includes(s)||c.nom_shop?.toLowerCase().includes(s) })

  const save = async () => {
    const valid = items.filter(i => i.nom.trim() && i.pv > 0); if (!valid.length) return
    setSaving(true)
    try {
      const { data: vente } = await supabase.from("ventes").insert({
        society_id: societyId, user_id: profile.id, client_id: selectedClient?.id||null,
        client_nom: selectedClient?.nom||"Client de passage", total_ht: total, port: 0, remise: 0, total_ttc: total, paiement, notes,
      }).select().single()
      if (vente) {
        await supabase.from("vente_items").insert(valid.map(i => ({
          vente_id: vente.id, produit_nom: i.nom, quantite: i.quantite, pv_unitaire: i.pv, cf_unitaire: 0, total: i.quantite * i.pv,
        })))
        await createFacture(societyId, vente.id, selectedClient?.nom||"Client de passage", total, "Vente manuelle")
      }
    } finally { setSaving(false); onDone(); onClose() }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-end z-50">
      <div className="bg-[#111111] border-l border-zinc-800 w-full max-w-md h-full flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          <div><h3 className="text-base font-bold text-white">Vente manuelle</h3><p className="text-xs text-zinc-500">Articles et prix libres</p></div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white"><X size={18}/></button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Client */}
          <div className="relative">
            <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Client</label>
            <button onClick={() => setShowClients(!showClients)} className="w-full flex items-center gap-3 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 hover:border-yellow-500/40">
              <User size={14} className="text-yellow-500 shrink-0"/>
              <span className="text-white text-sm flex-1 text-left">{selectedClient?.nom || "Client de passage"}</span>
              <ChevronDown size={14} className="text-zinc-500"/>
            </button>
            {showClients && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl z-20 overflow-hidden">
                <div className="p-2"><input type="text" placeholder="Rechercher..." value={clientSearch} onChange={e => setClientSearch(e.target.value)} autoFocus className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"/></div>
                <div className="max-h-40 overflow-y-auto">
                  <button onClick={() => { setSelectedClient(null); setShowClients(false) }} className="w-full text-left px-4 py-2 text-sm text-zinc-400 hover:bg-zinc-800">Client de passage</button>
                  {filtered.map(c => (
                    <button key={c.id} onClick={() => { setSelectedClient(c); setShowClients(false) }} className="w-full text-left px-4 py-2 hover:bg-zinc-800">
                      <p className="text-white text-sm">{c.prenom ? `${c.prenom} ${c.nom}` : c.nom}</p>
                      {c.nom_shop && <p className="text-zinc-500 text-[11px]">🏪 {c.nom_shop}</p>}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          {/* Articles */}
          <div>
            <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Articles</label>
            <div className="space-y-2">
              {items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input type="text" placeholder="Article" value={item.nom} onChange={e => setItems(p => p.map((i,j) => j===idx?{...i,nom:e.target.value}:i))}
                    className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-500/60"/>
                  <input type="number" placeholder="Qté" value={item.quantite} min={1} onChange={e => setItems(p => p.map((i,j) => j===idx?{...i,quantite:parseInt(e.target.value)||1}:i))}
                    className="w-14 bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-2 text-sm text-white text-center focus:outline-none"/>
                  <input type="number" placeholder="€" value={item.pv} min={0} step={0.01} onChange={e => setItems(p => p.map((i,j) => j===idx?{...i,pv:parseFloat(e.target.value)||0}:i))}
                    className="w-20 bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-2 text-sm text-white text-center focus:outline-none"/>
                  <button onClick={() => setItems(p => p.filter((_,j) => j!==idx))} className="text-zinc-600 hover:text-red-400"><X size={14}/></button>
                </div>
              ))}
              <button onClick={() => setItems(p => [...p, { nom: "", quantite: 1, pv: 0 }])} className="flex items-center gap-2 text-[11px] font-semibold text-yellow-500 hover:text-yellow-400">
                <Plus size={12}/> Ajouter un article
              </button>
            </div>
          </div>
          {/* Paiement */}
          <div>
            <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Paiement</label>
            <div className="flex gap-1.5 flex-wrap">
              {PAIEMENTS.map(p => <button key={p} onClick={() => setPaiement(p)} className={`flex-1 py-2 rounded-lg text-[11px] font-semibold border transition-colors min-w-[60px] ${paiement===p?"bg-yellow-500 text-black border-yellow-500":"bg-zinc-800 text-zinc-400 border-zinc-700 hover:border-zinc-500"}`}>{p}</button>)}
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Notes</label>
            <input type="text" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optionnel..."
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none"/>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center">
            <p className="text-zinc-500 text-xs mb-1">Total</p>
            <p className="text-yellow-400 text-2xl font-bold">{total.toFixed(2)}€</p>
          </div>
        </div>
        <div className="p-5 border-t border-zinc-800 flex gap-3">
          <button onClick={save} disabled={saving} className="flex-1 bg-yellow-500 hover:bg-yellow-400 disabled:opacity-40 text-black font-bold py-3 rounded-xl text-sm flex items-center justify-center gap-2">
            <Check size={16}/> Valider la vente
          </button>
          <button onClick={onClose} className="px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold rounded-xl text-sm">Annuler</button>
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════
   MAIN — Redesign
══════════════════════════════════════════════ */
export default function VenteModule({ activeSociety, profile }: Props) {
  const [products, setProducts]     = useState<Product[]>([])
  const [allStock, setAllStock]     = useState<any[]>([])
  const [clients, setClients]       = useState<Client[]>([])
  const [pharmacies, setPharmacies] = useState<any[]>([])
  const [urssafRate, setUrssafRate] = useState(DEFAULT_URSSAF)
  const [cart, setCart]             = useState<CartItem[]>([])
  const [search, setSearch]         = useState("")
  const [searchClient, setSearchClient] = useState("")
  const [selectedClient, setSelectedClient] = useState<Client|null>(null)
  const [clientPrixMap, setClientPrixMap]   = useState<Record<string,number>>({})
  const [venteDate, setVenteDate]   = useState(new Date().toISOString().split("T")[0])
  const [showClients, setShowClients] = useState(false)
  const [typeVente, setTypeVente]   = useState("Particulier")
  const [paiement, setPaiement]     = useState("Espèces")
  const [port, setPort]             = useState(PORT_OPTIONS[0])
  const [portPerso, setPortPerso]   = useState("")
  const [fraisColis, setFraisColis] = useState("")
  const [notes, setNotes]           = useState("")
  const [loading, setLoading]       = useState(true)
  const [saving, setSaving]         = useState(false)
  const [showHistorique, setShowHistorique] = useState(false)
  const [showManuelle, setShowManuelle]     = useState(false)
  const [activeGamme, setActiveGamme]       = useState<string|null>(null)
  const [success, setSuccess]       = useState(false)
  const [stockAlerts, setStockAlerts] = useState<string[]>([])
  const [mobileTab, setMobileTab]   = useState<"catalogue"|"panier">("catalogue")
  const [showCart, setShowCart]     = useState(false)

  useEffect(() => { if (activeSociety) loadData() }, [activeSociety])

  const loadData = async () => {
    setLoading(true)
    try {
      const [{ data: prods }, { data: cls }, { data: stockData }, { data: cfgData }, { data: pharmas }] = await Promise.all([
        supabase.from("products").select("*").eq("society_id", activeSociety.id).order("gamme").order("name"),
        supabase.from("clients").select("id, nom, prenom, nom_shop, contrat, telephone").eq("society_id", activeSociety.id).order("nom"),
        supabase.from("stock").select("*").eq("society_id", activeSociety.id),
        supabase.from("settings").select("key, value").eq("society_id", activeSociety.id).eq("key", "urssaf_rate_global").single(),
        supabase.from("pharmacies").select("id, nom, ville, telephone").eq("society_id", activeSociety.id).order("nom"),
      ])
      setProducts(prods || [])
      setClients(cls || [])
      setAllStock(stockData || [])
      setPharmacies(pharmas || [])
      if (cfgData?.value != null) setUrssafRate(Number(cfgData.value))
      const alerts = (stockData||[])
        .filter((s:any) => s.quantite <= 0 || (s.seuil_alerte > 0 && s.quantite <= s.seuil_alerte))
        .map((s:any) => s.quantite <= 0 ? `Rupture: ${s.produit_nom}` : `Faible: ${s.produit_nom}`)
      setStockAlerts(alerts)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const findStockItem = (productId: string, productName: string) =>
    allStock.find((s:any) => s.product_id && s.product_id === productId) ||
    allStock.find((s:any) => s.produit_nom?.toLowerCase().trim() === productName.toLowerCase().trim())

  const filteredProducts = activeGamme
    ? products.filter(p => p.gamme === activeGamme && p.name.toLowerCase().includes(search.toLowerCase()))
    : []

  const filteredClients = typeVente === "Pharmacie"
    ? pharmacies.filter((p:any) => p.nom.toLowerCase().includes(searchClient.toLowerCase()))
        .map((p:any) => ({ id: p.id, nom: p.nom, contrat: p.ville||"Pharmacie", telephone: p.telephone }))
    : clients.filter(c => { const s = searchClient.toLowerCase(); return c.nom?.toLowerCase().includes(s)||c.prenom?.toLowerCase().includes(s)||c.nom_shop?.toLowerCase().includes(s) })

  const addToCart = (product: Product) => {
    setCart(prev => {
      const prix = clientPrixMap[product.id] ?? product.pv
      const existing = prev.find(i => i.product_id === product.id)
      if (existing) return prev.map(i => i.product_id === product.id ? { ...i, quantite: i.quantite + 1 } : i)
      return [...prev, { product_id: product.id, nom: product.name, gamme: product.gamme, quantite: 1, pv: prix, cf: product.cf }]
    })
  }

  const portVal       = portPerso ? parseFloat(portPerso.replace(",", ".")) || 0 : parsePort(port)
  const totalHT       = cart.reduce((s,i) => s + i.pv * i.quantite, 0)
  const totalTTC      = totalHT + portVal
  const urssaf        = totalTTC * urssafRate
  const cfTotal       = cart.reduce((s,i) => s + i.cf * i.quantite, 0)
  const fraisColisVal = parseFloat(fraisColis.replace(",", ".")) || 0
  const resultat      = totalTTC - urssaf - cfTotal - fraisColisVal
  const cartCount     = cart.reduce((s,i) => s + i.quantite, 0)

  /* ══ VALIDATION VENTE + FIX STOCK ══ */
  const handleVente = async () => {
    if (!cart.length) return
    setSaving(true)
    const clientNom = selectedClient?.nom ||
      (typeVente === "Shopify" ? "Commande Shopify" : typeVente === "Pharmacie" ? "Pharmacie" : typeVente === "Convention" ? "Convention" : "Client de passage")
    try {
      const { data: vente, error } = await supabase.from("ventes").insert({
        society_id: activeSociety.id, user_id: profile.id,
        client_id: selectedClient?.id || null, client_nom: clientNom,
        created_at: new Date(venteDate + "T12:00:00").toISOString(),
        total_ht: totalHT, port: portVal, remise: 0, total_ttc: totalTTC, paiement, notes,
        lignes: cart.map(i => ({ product_id: i.product_id, produit_nom: i.nom, quantite: i.quantite, prix_unitaire: i.pv })),
      }).select().single()

      if (!error && vente) {
        // Vente items
        await supabase.from("vente_items").insert(cart.map(item => ({
          vente_id: vente.id, product_id: item.product_id, produit_nom: item.nom,
          gamme: item.gamme, quantite: item.quantite, pv_unitaire: item.pv, cf_unitaire: item.cf,
          total: item.pv * item.quantite,
        })))

        // Facture
        await createFacture(activeSociety.id, vente.id, clientNom, totalTTC, `Vente — ${paiement}`)

        // ── STOCK SYNC (avec fallback par nom) ──
        const freshStock = [...allStock]
        for (const item of cart) {
          const prod = products.find(p => p.id === item.product_id)
          let composition: Record<string, number> = {}
          if (prod?.composition) {
            composition = typeof prod.composition === "string" ? JSON.parse(prod.composition) : prod.composition
          }
          const entries = Object.entries(composition)

          if (entries.length > 0) {
            // Produit avec composition → décrémenter les ingrédients
            for (const [compNom, qtyParUnite] of entries) {
              const totalADeduire = item.quantite * Number(qtyParUnite)
              const stockItem = freshStock.find((s:any) => s.produit_nom?.toLowerCase().trim() === compNom.toLowerCase().trim())
              if (stockItem) {
                const newQty = stockItem.quantite - totalADeduire
                await supabase.from("stock").update({ quantite: newQty, updated_at: new Date().toISOString() }).eq("id", stockItem.id)
                try { await supabase.from("stock_history").insert({ society_id: activeSociety.id, product_id: stockItem.product_id, produit_nom: stockItem.produit_nom, user_id: profile.id, action: "Sortie", quantite: totalADeduire, quantite_avant: stockItem.quantite, quantite_apres: newQty, notes: `Vente "${item.nom}" ×${item.quantite} (composition) — ${clientNom}` }) } catch {}
                stockItem.quantite = newQty
              }
            }
          } else {
            // Produit simple → décrémenter directement
            // FIX: essai par product_id d'abord, puis fallback par nom
            const stockItem = findStockItem(item.product_id, item.nom)
            if (stockItem) {
              const newQty = stockItem.quantite - item.quantite
              await supabase.from("stock").update({ quantite: newQty, updated_at: new Date().toISOString() }).eq("id", stockItem.id)
              try { await supabase.from("stock_history").insert({ society_id: activeSociety.id, product_id: item.product_id, produit_nom: item.nom, user_id: profile.id, action: "Sortie", quantite: item.quantite, quantite_avant: stockItem.quantite, quantite_apres: newQty, notes: `Vente — ${clientNom}` }) } catch {}
              stockItem.quantite = newQty
            }
          }
        }

        // Reset
        setCart([]); setSelectedClient(null); setNotes("")
        setClientPrixMap({}); setPaiement("Espèces"); setPort(PORT_OPTIONS[0])
        setPortPerso(""); setFraisColis("")
        setSuccess(true); setMobileTab("catalogue"); setShowCart(false)
        setTimeout(() => { setSuccess(false); loadData() }, 2500)
      }
    } catch (e) { console.error("handleVente error:", e) }
    finally { setSaving(false) }
  }

  const activeGammeCfg = GAMMES.find(g => g.val === activeGamme)

  /* ════════════════════════════════════
     RENDU CATALOGUE
  ════════════════════════════════════ */
  const CatalogueView = (
    <div className="flex-1 flex flex-col overflow-hidden">

      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-zinc-900 space-y-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            🛒 Vente
            {cartCount > 0 && (
              <span className="text-sm font-black text-black bg-yellow-500 px-2 py-0.5 rounded-full">{cartCount}</span>
            )}
          </h1>
          <div className="flex gap-2">
            <button onClick={() => setShowManuelle(true)}
              className="flex items-center gap-1.5 text-xs text-zinc-400 bg-zinc-900 border border-zinc-800 px-3 py-2 rounded-xl hover:border-zinc-600 transition-colors">
              <Pencil size={12}/> Manuelle
            </button>
            <button onClick={() => setShowHistorique(true)}
              className="flex items-center gap-1.5 text-xs text-zinc-400 bg-zinc-900 border border-zinc-800 px-3 py-2 rounded-xl hover:border-zinc-600 transition-colors">
              <Receipt size={12}/> Historique
            </button>
          </div>
        </div>

        {/* Alertes stock */}
        {stockAlerts.length > 0 && (
          <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
            <AlertTriangle size={12} className="text-red-400 shrink-0"/>
            <p className="text-red-400 text-[11px] font-semibold truncate">{stockAlerts.slice(0,3).join(" · ")}</p>
          </div>
        )}

        {/* Type vente */}
        <div className="flex gap-1.5">
          {[
            { key: "Particulier", label: "Particulier", emoji: "👤" },
            { key: "Clients",     label: "Client enregistré", emoji: "👥" },
            { key: "Shopify",     label: "Shopify", emoji: "🛍️" },
            { key: "Pharmacie",   label: "Pharmacie", emoji: "🏥" },
          ].map(({ key, label, emoji }) => (
            <button key={key} onClick={() => { setTypeVente(key); setSelectedClient(null) }}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2 rounded-xl border text-[10px] font-bold transition-all ${typeVente===key ? "bg-yellow-500 text-black border-yellow-500" : "bg-zinc-900 text-zinc-500 border-zinc-800 hover:border-zinc-600 hover:text-zinc-300"}`}>
              <span className="text-sm">{emoji}</span>
              <span className="hidden sm:block">{label}</span>
            </button>
          ))}
        </div>

        {/* Gammes */}
        <div className="grid grid-cols-4 gap-2">
          {GAMMES.map(g => (
            <button key={g.val} onClick={() => setActiveGamme(activeGamme === g.val ? null : g.val)}
              className="flex flex-col items-center gap-1 py-2.5 rounded-xl border transition-all font-bold text-[11px]"
              style={activeGamme === g.val
                ? { backgroundColor: g.bg, borderColor: g.border, color: g.color }
                : { backgroundColor: "rgba(24,24,27,0.8)", borderColor: "rgba(63,63,70,0.5)", color: "#71717a" }
              }>
              <span className="text-xl">{g.emoji}</span>
              <span>{g.val}</span>
              <span className="text-[9px] opacity-60">{products.filter(p=>p.gamme===g.val).length} art.</span>
            </button>
          ))}
        </div>

        {/* Recherche produit */}
        {activeGamme && (
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"/>
            <input type="text" placeholder={`Rechercher dans ${activeGamme}...`} value={search} onChange={e => setSearch(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-500/50"/>
          </div>
        )}
      </div>

      {/* Liste produits */}
      <div className="flex-1 overflow-y-auto p-3">
        {loading ? (
          <div className="flex items-center justify-center py-16"><div className="w-6 h-6 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin"/></div>
        ) : !activeGamme ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4 py-8">
            <div className="text-5xl mb-4">👆</div>
            <p className="text-white text-lg font-bold mb-2">Sélectionnez une gamme</p>
            <p className="text-zinc-500 text-sm">Choisissez une gamme ci-dessus pour afficher les produits</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-16 text-zinc-600">
            <Package size={32} className="mx-auto mb-3 opacity-20"/>
            <p className="text-sm">Aucun produit trouvé</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {filteredProducts.map(product => {
              const inCart = cart.find(i => i.product_id === product.id)
              const stockItem = findStockItem(product.id, product.name)
              const stockQty  = stockItem?.quantite ?? null
              const stockLow  = stockQty !== null && stockQty <= (stockItem?.seuil_alerte || 0) && stockItem?.seuil_alerte > 0
              const stockOut  = stockQty !== null && stockQty <= 0
              const prix = clientPrixMap[product.id] ?? product.pv

              return (
                <button key={product.id} onClick={() => addToCart(product)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left group ${inCart ? "border-yellow-500/60 bg-yellow-500/8" : "border-zinc-800/60 bg-zinc-900/60 hover:border-zinc-600 hover:bg-zinc-800/60"}`}
                  style={inCart && activeGammeCfg ? { borderColor: activeGammeCfg.border, backgroundColor: activeGammeCfg.bg } : {}}>

                  {/* Avatar / image */}
                  <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 flex items-center justify-center"
                    style={{ backgroundColor: activeGammeCfg ? activeGammeCfg.bg : "rgba(39,39,42,0.6)" }}>
                    {product.avatar_url
                      ? <img src={product.avatar_url} className="w-full h-full object-cover" alt={product.name}/>
                      : <span className="text-xl">{activeGammeCfg?.emoji || "📦"}</span>
                    }
                  </div>

                  {/* Infos produit */}
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-semibold truncate">{product.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-zinc-500 text-[11px]">CF: {product.cf.toFixed(2)}€</span>
                      {stockQty !== null && (
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${stockOut ? "bg-red-500/15 text-red-400" : stockLow ? "bg-orange-500/15 text-orange-400" : "bg-green-500/10 text-green-500"}`}>
                          {stockOut ? "Rupture" : `Stock: ${stockQty}`}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Prix + badge panier */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-base font-black" style={{ color: activeGammeCfg?.color || "#eab308" }}>
                      {prix.toFixed(2)}€
                    </span>
                    {inCart ? (
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-black text-xs font-black" style={{ backgroundColor: activeGammeCfg?.color || "#eab308" }}>
                        {inCart.quantite}
                      </div>
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-500 group-hover:border-zinc-500 group-hover:text-zinc-300 transition-colors">
                        <Plus size={13}/>
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

  /* ════════════════════════════════════
     RENDU PANIER
  ════════════════════════════════════ */
  const PanierView = (
    <div className="w-full md:w-96 bg-[#111111] flex flex-col overflow-hidden border-l border-zinc-900">

      {/* Sélecteur client */}
      <div className="p-3 border-b border-zinc-800">
        {(typeVente === "Clients" || typeVente === "Pharmacie") ? (
          <div className="relative">
            <button onClick={() => setShowClients(!showClients)}
              className="w-full flex items-center gap-2.5 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 hover:border-yellow-500/40 transition-colors">
              <div className="w-8 h-8 bg-yellow-500/10 rounded-lg flex items-center justify-center shrink-0"><User size={13} className="text-yellow-500"/></div>
              <div className="flex-1 text-left min-w-0">
                <p className="text-white text-sm font-medium truncate">{selectedClient?.nom || "Sélectionner un client"}</p>
                {selectedClient && <p className="text-zinc-500 text-[11px]">{selectedClient.nom_shop ? `🏪 ${selectedClient.nom_shop}` : selectedClient.contrat}</p>}
              </div>
              <ChevronDown size={13} className="text-zinc-500 shrink-0"/>
            </button>
            {showClients && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl z-20 overflow-hidden">
                <div className="p-2">
                  <input type="text" placeholder="Nom, prénom, shop..." value={searchClient} onChange={e => setSearchClient(e.target.value)} autoFocus
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"/>
                </div>
                <div className="max-h-48 overflow-y-auto">
                  {filteredClients.map(c => (
                    <button key={c.id} onClick={async () => {
                      setSelectedClient(c); setShowClients(false)
                      const { data } = await supabase.from("client_prix").select("*").eq("client_id", c.id)
                      const map: Record<string,number> = {}; (data||[]).forEach((p:any) => { map[p.product_id] = p.prix })
                      setClientPrixMap(map)
                    }} className="w-full text-left px-4 py-2.5 hover:bg-zinc-800">
                      <p className="text-white text-sm">{(c as any).prenom ? `${(c as any).prenom} ${c.nom}` : c.nom}</p>
                      <p className="text-zinc-500 text-[11px]">{(c as any).nom_shop ? `🏪 ${(c as any).nom_shop}` : c.contrat}</p>
                    </button>
                  ))}
                  {filteredClients.length === 0 && <p className="text-zinc-600 text-xs text-center py-4">Aucun client trouvé</p>}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2.5 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5">
            <div className="w-8 h-8 bg-zinc-800 rounded-lg flex items-center justify-center shrink-0"><User size={13} className="text-zinc-500"/></div>
            <p className="text-zinc-400 text-sm">{typeVente === "Shopify" ? "🛍️ Commande Shopify" : typeVente === "Convention" ? "🎪 Convention" : "Client de passage"}</p>
          </div>
        )}
      </div>

      {/* Articles panier */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-zinc-700 py-8">
            <ShoppingCart size={32} className="mb-3 opacity-30"/>
            <p className="text-sm font-medium">Panier vide</p>
            <p className="text-xs mt-1 text-center text-zinc-800">Sélectionnez une gamme et cliquez sur un produit</p>
          </div>
        ) : cart.map(item => (
          <div key={item.product_id} className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2">
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-semibold truncate">{item.nom}</p>
              <p className="text-zinc-600 text-[10px]">{item.gamme}</p>
            </div>
            {/* Qty control */}
            <div className="flex items-center gap-1 bg-zinc-800 rounded-lg">
              <button onClick={() => { if (item.quantite <= 1) setCart(p => p.filter(i => i.product_id !== item.product_id)); else setCart(p => p.map(i => i.product_id === item.product_id ? {...i, quantite: i.quantite-1} : i)) }}
                className="w-6 h-6 flex items-center justify-center text-zinc-400 hover:text-white"><Minus size={10}/></button>
              <span className="text-white text-xs font-bold w-5 text-center">{item.quantite}</span>
              <button onClick={() => setCart(p => p.map(i => i.product_id === item.product_id ? {...i, quantite: i.quantite+1} : i))}
                className="w-6 h-6 flex items-center justify-center text-zinc-400 hover:text-white"><Plus size={10}/></button>
            </div>
            {/* Prix modifiable */}
            <div className="relative w-16">
              <input type="number" step="0.01" value={item.pv}
                onChange={e => setCart(p => p.map(i => i.product_id === item.product_id ? {...i, pv: parseFloat(e.target.value)||0} : i))}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-1 py-1.5 text-xs text-white text-center focus:outline-none focus:border-yellow-500/60"/>
              <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-zinc-600 text-[9px]">€</span>
            </div>
            <p className="text-yellow-400 font-bold text-xs w-12 text-right shrink-0">{(item.pv * item.quantite).toFixed(2)}€</p>
            <button onClick={() => setCart(p => p.filter(i => i.product_id !== item.product_id))} className="text-zinc-700 hover:text-red-400 shrink-0"><X size={12}/></button>
          </div>
        ))}
      </div>

      {/* Actions rapides sur le panier */}
      {cart.length > 0 && (
        <div className="px-3 py-1.5 border-t border-zinc-900 flex items-center gap-3">
          <button onClick={() => { try { localStorage.setItem("brouillon_"+activeSociety.id, JSON.stringify(cart)) } catch {}; alert("Brouillon sauvegardé") }}
            className="flex items-center gap-1 text-[10px] text-zinc-500 hover:text-yellow-500 transition-colors"><Save size={10}/> Sauvegarder</button>
          <button onClick={() => { try { const d = localStorage.getItem("brouillon_"+activeSociety.id); if (d) setCart(JSON.parse(d)) } catch {} }}
            className="flex items-center gap-1 text-[10px] text-zinc-500 hover:text-yellow-500 transition-colors"><RotateCcw size={10}/> Reprendre</button>
          {selectedClient && (
            <button onClick={async () => {
              const { data } = await supabase.from("client_prix").select("*").eq("client_id", selectedClient.id)
              if (data?.length) {
                const map: Record<string,number> = {}; data.forEach((p:any) => { map[p.product_id] = p.prix })
                setClientPrixMap(map); setCart(p => p.map(i => map[i.product_id]!=null ? {...i, pv: map[i.product_id]} : i))
              }
            }} className="flex items-center gap-1 text-[10px] text-blue-400 hover:text-blue-300 transition-colors ml-auto">
              <Zap size={10}/> Tarif {selectedClient.nom.split(" ")[0]}
            </button>
          )}
        </div>
      )}

      {/* Options + Total */}
      {cart.length > 0 && (
        <div className="border-t border-zinc-800 p-3 space-y-2">
          {/* Port + frais */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[9px] text-zinc-600 font-bold uppercase tracking-wider mb-1">Port</label>
              <select value={port} onChange={e => setPort(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1.5 text-[11px] text-white focus:outline-none">
                {PORT_OPTIONS.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[9px] text-zinc-600 font-bold uppercase tracking-wider mb-1">Port perso / Frais</label>
              <div className="flex gap-1">
                <input type="text" placeholder="0.00" value={portPerso} onChange={e => setPortPerso(e.target.value)}
                  className="flex-1 w-0 bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1.5 text-xs text-white text-center focus:outline-none"/>
                <input type="text" placeholder="colis" value={fraisColis} onChange={e => setFraisColis(e.target.value)}
                  className="flex-1 w-0 bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1.5 text-xs text-white text-center focus:outline-none"/>
              </div>
            </div>
          </div>

          {/* Notes */}
          <input type="text" placeholder="Notes..." value={notes} onChange={e => setNotes(e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-zinc-600 focus:outline-none"/>

          {/* Paiement */}
          <div className="flex gap-1">
            {PAIEMENTS.map(p => (
              <button key={p} onClick={() => setPaiement(p)}
                className={`flex-1 py-1.5 rounded-lg text-[10px] font-semibold border transition-colors ${paiement===p ? "bg-yellow-500 text-black border-yellow-500" : "bg-zinc-800 text-zinc-500 border-zinc-700 hover:border-zinc-500"}`}>
                {p}
              </button>
            ))}
          </div>

          {/* Date */}
          <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5">
            <span className="text-zinc-600 text-[10px]">📅</span>
            <input type="date" value={venteDate} onChange={e => setVenteDate(e.target.value)} className="flex-1 bg-transparent text-xs text-white focus:outline-none"/>
            {venteDate !== new Date().toISOString().split("T")[0] && <span className="text-orange-400 text-[9px] font-bold">≠ Auj.</span>}
          </div>

          {/* Récapitulatif financier */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 space-y-0.5">
            <div className="flex justify-between text-[11px] text-zinc-500"><span>Sous-total HT</span><span>{totalHT.toFixed(2)}€</span></div>
            {portVal > 0 && <div className="flex justify-between text-[11px] text-zinc-500"><span>Port</span><span>+{portVal.toFixed(2)}€</span></div>}
            <div className="flex justify-between text-[11px] text-zinc-600 border-t border-zinc-800 pt-0.5 mt-0.5"><span>URSSAF {(urssafRate*100).toFixed(1)}%</span><span>-{urssaf.toFixed(2)}€</span></div>
            <div className="flex justify-between text-[11px] text-zinc-600"><span>CF total</span><span>-{cfTotal.toFixed(2)}€</span></div>
            {fraisColisVal > 0 && <div className="flex justify-between text-[11px] text-red-400/80"><span>Frais colis</span><span>-{fraisColisVal.toFixed(2)}€</span></div>}
            <div className={`flex justify-between text-sm font-bold border-t border-zinc-800 pt-1.5 mt-1 ${resultat>=0?"text-green-400":"text-red-400"}`}>
              <span>Résultat net</span><span>{resultat.toFixed(2)}€</span>
            </div>
            <div className="flex justify-between items-center pt-1 border-t border-zinc-800">
              <span className="text-white font-bold text-sm">Total client</span>
              <span className="text-yellow-400 text-xl font-black">{totalTTC.toFixed(2)}€</span>
            </div>
          </div>

          {/* Bouton valider */}
          <button onClick={handleVente} disabled={saving || !cart.length}
            className={`w-full font-black py-4 rounded-xl text-base transition-all flex items-center justify-center gap-2 shadow-lg ${success ? "bg-green-500 text-white shadow-green-500/20" : "bg-yellow-500 hover:bg-yellow-400 disabled:opacity-40 text-black shadow-yellow-500/20"}`}>
            {success ? <><Check size={18}/> Vente enregistrée !</>
              : saving ? <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"/>
              : <><ShoppingCart size={18}/> Valider · {totalTTC.toFixed(2)}€</>
            }
          </button>
        </div>
      )}
    </div>
  )

  return (
    <div className="flex-1 overflow-hidden bg-[#0a0a0a] flex flex-col">
      {/* Desktop : 2 colonnes */}
      <div className="hidden md:flex flex-1 overflow-hidden">
        {CatalogueView}
        {PanierView}
      </div>

      {/* Mobile : tabs */}
      <div className="flex md:hidden flex-1 overflow-hidden">
        {mobileTab === "catalogue" ? CatalogueView : PanierView}
      </div>

      {/* Tab bar mobile */}
      <div className="flex md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-zinc-800 bg-[#111111]">
        <button onClick={() => setMobileTab("catalogue")}
          className={`flex-1 flex flex-col items-center justify-center py-3 gap-0.5 ${mobileTab==="catalogue" ? "text-yellow-500" : "text-zinc-500"}`}>
          <Package size={20}/>
          <span className="text-[10px] font-bold">Catalogue</span>
        </button>
        <button onClick={() => setMobileTab("panier")}
          className={`flex-1 flex flex-col items-center justify-center py-3 gap-0.5 relative ${mobileTab==="panier" ? "text-yellow-500" : "text-zinc-500"}`}>
          <div className="relative">
            <ShoppingCart size={20}/>
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-3 w-5 h-5 bg-yellow-500 text-black text-[10px] font-bold rounded-full flex items-center justify-center">
                {cartCount > 9 ? "9+" : cartCount}
              </span>
            )}
          </div>
          <span className="text-[10px] font-bold">{cartCount > 0 ? `${totalTTC.toFixed(0)}€` : "Panier"}</span>
        </button>
      </div>

      {showHistorique && <HistoriquePanel societyId={activeSociety.id} onClose={() => setShowHistorique(false)}/>}
      {showManuelle   && <VenteManuellePanel societyId={activeSociety.id} profile={profile} clients={clients} onClose={() => setShowManuelle(false)} onDone={loadData}/>}
    </div>
  )
}