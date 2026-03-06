"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import {
  Plus, X, Trash2, Check, Receipt, Gift,
  TrendingDown, Package, AlertTriangle, ShoppingBag,
} from "lucide-react"

interface Props { activeSociety: any; profile: any }

const DEP_CATEGORIES = [
  "Matières premières", "Emballage", "Transport", "Publicité",
  "Équipement", "Loyer", "Salaires", "Frais bancaires", "Autre",
]

/* ══════════════════════════════════════════════
   TAB 1 — DÉPENSES
══════════════════════════════════════════════ */
function DepensesTab({ activeSociety, profile }: Props) {
  const [depenses, setDepenses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [motif, setMotif] = useState("")
  const [montant, setMontant] = useState("")
  const [categorie, setCategorie] = useState(DEP_CATEGORIES[0])
  const [saving, setSaving] = useState(false)
  const [filterCat, setFilterCat] = useState("Toutes")
  const [periodFilter, setPeriodFilter] = useState("Mois en cours")

  useEffect(() => { loadDepenses() }, [activeSociety])

  const loadDepenses = async () => {
    setLoading(true)
    const { data } = await supabase.from("depenses")
      .select("*").eq("society_id", activeSociety.id)
      .order("created_at", { ascending: false })
    setDepenses(data || [])
    setLoading(false)
  }

  const addDepense = async () => {
    if (!motif.trim() || !montant) return
    const mt = parseFloat(montant.replace(",", "."))
    if (isNaN(mt) || mt <= 0) return
    setSaving(true)
    const { error } = await supabase.from("depenses").insert({
      society_id: activeSociety.id,
      user_id: profile.id,
      motif: motif.trim(),
      montant: mt,
      categorie,
    })
    if (error) { alert("Erreur: " + error.message); setSaving(false); return }
    setMotif(""); setMontant("")
    await loadDepenses()
    setSaving(false)
  }

  const deleteDepense = async (id: string) => {
    if (!confirm("Supprimer cette dépense ?")) return
    await supabase.from("depenses").delete().eq("id", id)
    loadDepenses()
  }

  // Filtres période
  const now = new Date()
  const filtered = depenses.filter(d => {
    const dt = new Date(d.created_at)
    const matchCat = filterCat === "Toutes" || d.categorie === filterCat
    if (!matchCat) return false
    if (periodFilter === "Aujourd'hui") return dt.toDateString() === now.toDateString()
    if (periodFilter === "Mois en cours") return dt.getMonth() === now.getMonth() && dt.getFullYear() === now.getFullYear()
    if (periodFilter === "Année en cours") return dt.getFullYear() === now.getFullYear()
    return true
  })

  const totalFiltered = filtered.reduce((s, d) => s + Number(d.montant), 0)
  const totalMois = depenses.filter(d => {
    const dt = new Date(d.created_at)
    return dt.getMonth() === now.getMonth() && dt.getFullYear() === now.getFullYear()
  }).reduce((s, d) => s + Number(d.montant), 0)

  // Par catégorie
  const byCat: Record<string, number> = {}
  filtered.forEach(d => { byCat[d.categorie] = (byCat[d.categorie] || 0) + Number(d.montant) })
  const topCats = Object.entries(byCat).sort((a, b) => b[1] - a[1]).slice(0, 4)

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-5">
      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <p className="text-zinc-500 text-[11px] uppercase tracking-wider mb-1">Total mois</p>
          <p className="text-2xl font-bold text-red-400">{totalMois.toFixed(2)}€</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <p className="text-zinc-500 text-[11px] uppercase tracking-wider mb-1">Nb dépenses</p>
          <p className="text-2xl font-bold text-white">{filtered.length}</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <p className="text-zinc-500 text-[11px] uppercase tracking-wider mb-1">Période sélectionnée</p>
          <p className="text-2xl font-bold text-orange-400">{totalFiltered.toFixed(2)}€</p>
        </div>
      </div>

      {/* Formulaire ajout */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
        <p className="text-white font-bold text-sm mb-4">+ Nouvelle dépense</p>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="block text-[11px] text-zinc-500 uppercase tracking-wider mb-1.5">Motif</label>
            <input type="text" value={motif} onChange={e => setMotif(e.target.value)}
              placeholder="Ex: Achat emballages..."
              onKeyDown={e => e.key === "Enter" && addDepense()}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-500/60" />
          </div>
          <div>
            <label className="block text-[11px] text-zinc-500 uppercase tracking-wider mb-1.5">Montant (€)</label>
            <input type="number" step="0.01" value={montant} onChange={e => setMontant(e.target.value)}
              placeholder="0.00"
              onKeyDown={e => e.key === "Enter" && addDepense()}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-500/60" />
          </div>
        </div>
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="block text-[11px] text-zinc-500 uppercase tracking-wider mb-1.5">Catégorie</label>
            <div className="flex flex-wrap gap-2">
              {DEP_CATEGORIES.map(c => (
                <button key={c} onClick={() => setCategorie(c)}
                  className={`text-[11px] font-semibold px-3 py-1.5 rounded-lg border transition-colors ${categorie === c ? "bg-yellow-500 text-black border-yellow-500" : "text-zinc-400 border-zinc-700 bg-zinc-800 hover:border-zinc-500"}`}>
                  {c}
                </button>
              ))}
            </div>
          </div>
          <button onClick={addDepense} disabled={saving || !motif.trim() || !montant}
            className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-400 disabled:opacity-40 text-black font-bold px-5 py-2.5 rounded-xl text-sm shrink-0 transition-colors">
            {saving ? <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" /> : <Plus size={15} />}
            Ajouter
          </button>
        </div>
      </div>

      {/* Répartition par catégorie */}
      {topCats.length > 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <p className="text-zinc-400 text-xs font-semibold mb-3">Répartition par catégorie</p>
          <div className="space-y-2">
            {topCats.map(([cat, total]) => (
              <div key={cat} className="flex items-center gap-3">
                <span className="text-zinc-400 text-xs w-36 truncate">{cat}</span>
                <div className="flex-1 bg-zinc-800 rounded-full h-2">
                  <div className="bg-orange-500 h-2 rounded-full transition-all"
                    style={{ width: `${(total / totalFiltered) * 100}%` }} />
                </div>
                <span className="text-orange-400 text-xs font-bold w-16 text-right">{total.toFixed(2)}€</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filtres */}
      <div className="flex gap-3 flex-wrap">
        {["Aujourd'hui", "Mois en cours", "Année en cours", "Tout"].map(p => (
          <button key={p} onClick={() => setPeriodFilter(p)}
            className={`text-[11px] font-semibold px-3 py-1.5 rounded-lg border transition-colors ${periodFilter === p ? "bg-yellow-500 text-black border-yellow-500" : "text-zinc-400 border-zinc-700 bg-zinc-900 hover:border-zinc-600"}`}>
            {p}
          </button>
        ))}
        <div className="w-px bg-zinc-800 mx-1" />
        {["Toutes", ...DEP_CATEGORIES].map(c => (
          <button key={c} onClick={() => setFilterCat(c)}
            className={`text-[11px] font-semibold px-3 py-1.5 rounded-lg border transition-colors ${filterCat === c ? "bg-orange-500/20 text-orange-400 border-orange-500/40" : "text-zinc-500 border-zinc-800 bg-zinc-900 hover:border-zinc-600"}`}>
            {c}
          </button>
        ))}
      </div>

      {/* Liste */}
      {loading ? (
        <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-zinc-600"><Receipt size={32} className="mx-auto mb-3 opacity-20" /><p className="text-sm">Aucune dépense</p></div>
      ) : (
        <div className="space-y-2">
          {filtered.map(d => (
            <div key={d.id} className="bg-zinc-900 border border-zinc-800 rounded-xl px-5 py-3 flex items-center gap-4">
              <div className="w-2 h-2 rounded-full bg-orange-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-semibold truncate">{d.motif}</p>
                <p className="text-zinc-500 text-[11px]">{d.categorie} · {new Date(d.created_at).toLocaleDateString("fr-FR")}</p>
              </div>
              <p className="text-red-400 font-bold text-sm shrink-0">-{Number(d.montant).toFixed(2)}€</p>
              <button onClick={() => deleteDepense(d.id)} className="text-zinc-700 hover:text-red-400 transition-colors shrink-0">
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ══════════════════════════════════════════════
   TAB 2 — OFFERTS / CASSÉS
══════════════════════════════════════════════ */
function OffertsTab({ activeSociety, profile }: Props) {
  const [products, setProducts] = useState<any[]>([])
  const [stock, setStock] = useState<any[]>([])
  const [cart, setCart] = useState<{ product_id: string; nom: string; cf: number; pv: number; quantite: number }[]>([])
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [qty, setQty] = useState(1)
  const [motifSortie, setMotifSortie] = useState("Offert")
  const [saving, setSaving] = useState(false)
  const [history, setHistory] = useState<any[]>([])
  const [loadingHistory, setLoadingHistory] = useState(true)

  const MOTIFS = ["Offert", "Cassé", "Périmé", "Erreur commande", "Test", "Don", "Autre"]

  useEffect(() => { loadData() }, [activeSociety])

  const loadData = async () => {
    const [{ data: prods }, { data: st }, { data: hist }] = await Promise.all([
      supabase.from("products").select("id, name, pv, cf, in_stock, composition, gamme")
        .eq("society_id", activeSociety.id).order("gamme").order("name"),
      supabase.from("stock").select("*").eq("society_id", activeSociety.id),
      supabase.from("stock_history").select("*").eq("society_id", activeSociety.id)
        .ilike("notes", "%OFFERT%").order("created_at", { ascending: false }).limit(50),
    ])
    setProducts(prods || [])
    setStock(st || [])
    setHistory(hist || [])
    setLoadingHistory(false)
  }

  const getStockQty = (productId: string) => {
    return stock.find(s => s.product_id === productId)?.quantite ?? null
  }

  const addToCart = () => {
    if (!selectedProduct || qty < 1) return
    setCart(prev => {
      const existing = prev.find(i => i.product_id === selectedProduct.id)
      if (existing) return prev.map(i => i.product_id === selectedProduct.id ? { ...i, quantite: i.quantite + qty } : i)
      return [...prev, { product_id: selectedProduct.id, nom: selectedProduct.name, cf: selectedProduct.cf, pv: selectedProduct.pv, quantite: qty }]
    })
    setQty(1)
  }

  const totalPerte = cart.reduce((s, i) => s + i.cf * i.quantite, 0)
  const totalValeur = cart.reduce((s, i) => s + i.pv * i.quantite, 0)

  const valider = async () => {
    if (cart.length === 0) return
    if (!confirm(`Sortir ${cart.length} article(s) du stock ? Perte coût : ${totalPerte.toFixed(2)}€`)) return
    setSaving(true)

    const allStock = [...stock]

    for (const item of cart) {
      const { data: fullProd } = await supabase.from("products")
        .select("composition, in_stock").eq("id", item.product_id).single()

      let composition: Record<string, number> = {}
      if (fullProd?.composition) {
        composition = typeof fullProd.composition === "string"
          ? JSON.parse(fullProd.composition) : fullProd.composition
      }

      const compoEntries = Object.entries(composition)

      if (compoEntries.length > 0) {
        for (const [compNom, qtyPar] of compoEntries) {
          const stockItem = allStock.find(s => s.produit_nom.toLowerCase().trim() === compNom.toLowerCase().trim())
          if (stockItem) {
            const newQty = stockItem.quantite - item.quantite * Number(qtyPar)
            await supabase.from("stock").update({ quantite: newQty }).eq("id", stockItem.id)
            await supabase.from("stock_history").insert({
              society_id: activeSociety.id,
              product_id: stockItem.product_id,
              produit_nom: stockItem.produit_nom,
              user_id: profile.id,
              action: "Sortie",
              quantite: item.quantite * Number(qtyPar),
              quantite_avant: stockItem.quantite,
              quantite_apres: newQty,
              notes: `OFFERT/CASSÉ — ${item.nom} ×${item.quantite} (${motifSortie})`,
            })
            stockItem.quantite = newQty
          }
        }
      } else {
        const stockItem = allStock.find(s => s.product_id === item.product_id)
        if (stockItem) {
          const newQty = stockItem.quantite - item.quantite
          await supabase.from("stock").update({ quantite: newQty }).eq("id", stockItem.id)
          await supabase.from("stock_history").insert({
            society_id: activeSociety.id,
            product_id: item.product_id,
            produit_nom: item.nom,
            user_id: profile.id,
            action: "Sortie",
            quantite: item.quantite,
            quantite_avant: stockItem.quantite,
            quantite_apres: newQty,
            notes: `OFFERT/CASSÉ — ${item.nom} ×${item.quantite} (${motifSortie})`,
          })
          stockItem.quantite = newQty
        }
      }
    }

    setCart([])
    setSaving(false)
    loadData()
  }

  return (
    <div className="flex-1 overflow-hidden flex gap-0">

      {/* GAUCHE : sélection produit + panier */}
      <div className="flex-1 overflow-y-auto p-6 border-r border-zinc-900 space-y-5">

        {/* Sélecteur produit */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <p className="text-white font-bold text-sm mb-4">🎁 Ajouter un article à sortir</p>

          {/* Motif */}
          <div className="mb-4">
            <label className="block text-[11px] text-zinc-500 uppercase tracking-wider mb-2">Motif de sortie</label>
            <div className="flex flex-wrap gap-2">
              {MOTIFS.map(m => (
                <button key={m} onClick={() => setMotifSortie(m)}
                  className={`text-[11px] font-semibold px-3 py-1.5 rounded-lg border transition-colors ${motifSortie === m ? "bg-red-500/20 text-red-400 border-red-500/40" : "text-zinc-500 border-zinc-700 bg-zinc-800 hover:border-zinc-500"}`}>
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Liste produits */}
          <div className="mb-3">
            <label className="block text-[11px] text-zinc-500 uppercase tracking-wider mb-2">Produit</label>
            <div className="max-h-48 overflow-y-auto space-y-1">
              {products.map(p => {
                const stockQty = getStockQty(p.id)
                const isSelected = selectedProduct?.id === p.id
                return (
                  <button key={p.id} onClick={() => setSelectedProduct(p)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors ${isSelected ? "bg-yellow-500/10 border border-yellow-500/30" : "hover:bg-zinc-800 border border-transparent"}`}>
                    <div>
                      <p className="text-white text-xs font-semibold">{p.name}</p>
                      <p className="text-zinc-600 text-[10px]">{p.gamme} · CF: {Number(p.cf).toFixed(2)}€</p>
                    </div>
                    {stockQty !== null && (
                      <span className={`text-xs font-bold ${stockQty < 0 ? "text-red-400" : stockQty === 0 ? "text-orange-400" : "text-green-400"}`}>
                        {stockQty} u.
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Quantité + ajout */}
          <div className="flex gap-3 items-end">
            <div>
              <label className="block text-[11px] text-zinc-500 uppercase tracking-wider mb-1.5">Quantité</label>
              <div className="flex items-center gap-2 bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2">
                <button onClick={() => setQty(q => Math.max(1, q - 1))} className="text-zinc-400 hover:text-white w-5 text-center">-</button>
                <span className="text-white font-bold text-sm w-6 text-center">{qty}</span>
                <button onClick={() => setQty(q => q + 1)} className="text-zinc-400 hover:text-white w-5 text-center">+</button>
              </div>
            </div>
            <button onClick={addToCart} disabled={!selectedProduct}
              className="flex-1 flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-zinc-300 font-bold py-2.5 rounded-xl text-sm transition-colors border border-zinc-700">
              <Plus size={14} /> Ajouter à la liste
            </button>
          </div>
        </div>

        {/* Panier sortie */}
        {cart.length > 0 && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
            <div className="px-5 py-3 border-b border-zinc-800 flex justify-between items-center">
              <p className="text-white font-bold text-sm">Liste de sortie</p>
              <button onClick={() => setCart([])} className="text-zinc-600 hover:text-red-400 transition-colors"><Trash2 size={13} /></button>
            </div>
            <div className="p-4 space-y-2">
              {cart.map(item => (
                <div key={item.product_id} className="flex items-center gap-3 bg-zinc-800 rounded-xl px-4 py-2.5">
                  <div className="flex-1">
                    <p className="text-white text-sm font-semibold">{item.nom}</p>
                    <p className="text-zinc-500 text-[11px]">CF: {item.cf.toFixed(2)}€ × {item.quantite}</p>
                  </div>
                  <p className="text-red-400 text-sm font-bold">-{(item.cf * item.quantite).toFixed(2)}€</p>
                  <button onClick={() => setCart(prev => prev.filter(i => i.product_id !== item.product_id))}
                    className="text-zinc-600 hover:text-red-400 transition-colors"><X size={13} /></button>
                </div>
              ))}
            </div>
            {/* Total + validation */}
            <div className="px-5 py-4 bg-red-950/30 border-t border-red-500/20 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-400">Perte coût fabrication</span>
                <span className="text-red-400 font-bold">-{totalPerte.toFixed(2)}€</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-400">Valeur catalogue perdue</span>
                <span className="text-zinc-500 font-bold">-{totalValeur.toFixed(2)}€</span>
              </div>
              <button onClick={valider} disabled={saving}
                className="w-full bg-red-500 hover:bg-red-400 disabled:opacity-40 text-white font-bold py-3 rounded-xl text-sm flex items-center justify-center gap-2 transition-colors">
                {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Check size={15} />}
                ✔ VALIDER LA SORTIE ({motifSortie})
              </button>
            </div>
          </div>
        )}
      </div>

      {/* DROITE : historique des sorties */}
      <div className="w-80 overflow-y-auto bg-[#111111] p-5">
        <p className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-4">Historique des sorties</p>
        {loadingHistory ? (
          <div className="flex justify-center py-8"><div className="w-5 h-5 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : history.length === 0 ? (
          <div className="text-center py-8 text-zinc-700"><Gift size={28} className="mx-auto mb-2 opacity-30" /><p className="text-xs">Aucun historique</p></div>
        ) : history.map(h => (
          <div key={h.id} className="mb-2 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3">
            <p className="text-white text-xs font-semibold truncate">{h.produit_nom}</p>
            <p className="text-zinc-500 text-[10px] mt-0.5 truncate">{h.notes?.replace("OFFERT/CASSÉ — ", "")}</p>
            <div className="flex justify-between mt-1">
              <span className="text-red-400 text-[11px] font-bold">-{h.quantite} u.</span>
              <span className="text-zinc-600 text-[10px]">{new Date(h.created_at).toLocaleDateString("fr-FR")}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════
   MAIN MODULE
══════════════════════════════════════════════ */
export default function DepensesOffertsModule({ activeSociety, profile }: Props) {
  const [activeTab, setActiveTab] = useState<"depenses" | "offerts">("depenses")

  const tabs = [
    { id: "depenses", label: "💸 Dépenses", desc: "Suivi des frais professionnels" },
    { id: "offerts",  label: "🎁 Offerts / Cassés", desc: "Sorties de stock non-vente" },
  ]

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#0a0a0a]">
      {/* Header avec onglets */}
      <div className="border-b border-zinc-900 px-6 pt-6 pb-0">
        <h1 className="text-xl font-bold text-white mb-4">📋 Dépenses & Sorties</h1>
        <div className="flex gap-1">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id as any)}
              className={`flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-t-xl border-b-2 transition-colors ${
                activeTab === t.id
                  ? "text-yellow-500 border-yellow-500 bg-yellow-500/5"
                  : "text-zinc-500 border-transparent hover:text-zinc-300"
              }`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Contenu */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {activeTab === "depenses" && <DepensesTab activeSociety={activeSociety} profile={profile} />}
        {activeTab === "offerts"  && <OffertsTab  activeSociety={activeSociety} profile={profile} />}
      </div>
    </div>
  )
}