"use client"

import { useEffect, useState, useMemo, useRef } from "react"
import { supabase } from "@/lib/supabase"
import { useUserSettings } from "@/lib/UserSettingsContext"

interface Product {
  id: string
  name: string
  gamme: string
  pv: number
  cf: number
  avatar_url?: string
}
interface Client {
  id: string
  nom: string
  prenom?: string
  nom_shop?: string
  contrat: string
  telephone?: string
}
interface CartItem {
  product_id: string
  nom: string
  gamme: string
  quantite: number
  pv: number
  cf: number
}
interface Props {
  activeSociety: any
  profile: any
}

const PAIEMENTS = ["Espèces", "CB", "Virement", "Chèque", "En attente"]
const PORT_OPTIONS = [
  { label: "Sans frais", value: 0 },
  { label: "0.200 - 0.300 kg", value: 6.84 },
  { label: "0.300 - 0.500 kg", value: 7.71 },
  { label: "0.500 - 0.750 kg", value: 8.60 },
  { label: "0.750 - 1 kg", value: 9.34 },
  { label: "1 - 2 kg", value: 10.48 },
  { label: "2 - 3 kg", value: 11 },
]

const GAMMES = [
  { val: "Particuliers",   emoji: "👤", color: "#eab308" },
  { val: "Professionnels", emoji: "🏢", color: "#a855f7" },
  { val: "Shopify",        emoji: "🛍️", color: "#22c55e" },
  { val: "Convention",     emoji: "🎪", color: "#f97316" },
]

const formatEuro = (n: number) =>
  n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €"

export default function VenteModule({ activeSociety, profile }: Props) {
  const { settings } = useUserSettings()
  const ACCENT = settings.accent_color || "#eab308"

  const [products, setProducts] = useState<Product[]>([])
  const [stock, setStock] = useState<any[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [pharmacies, setPharmacies] = useState<any[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [search, setSearch] = useState("")
  const [activeGamme, setActiveGamme] = useState("Particuliers")
  const [typeVente, setTypeVente] = useState<"Particulier" | "Pharmacie" | "Shopify" | "Convention">("Particulier")
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [clientSearch, setClientSearch] = useState("")
  const [showClientList, setShowClientList] = useState(false)
  const [paiement, setPaiement] = useState("Espèces")
  const [port, setPort] = useState(0)
  const [portPerso, setPortPerso] = useState("")
  const [notes, setNotes] = useState("")
  const [venteDate, setVenteDate] = useState(new Date().toISOString().slice(0, 10))
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [showHistorique, setShowHistorique] = useState(false)
  const [urssafRate] = useState(0.138)
  const [clientPrixMap, setClientPrixMap] = useState<Record<string, number>>({})

  const clientRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!activeSociety?.id) return
    Promise.all([
      supabase.from("products").select("*").eq("society_id", activeSociety.id).order("gamme").order("name"),
      supabase.from("stock").select("*").eq("society_id", activeSociety.id),
      supabase.from("clients").select("id, nom, prenom, nom_shop, contrat, telephone").eq("society_id", activeSociety.id).order("nom"),
      supabase.from("pharmacies").select("id, nom, ville, telephone").eq("society_id", activeSociety.id).order("nom"),
    ]).then(([prod, stk, cli, pharma]) => {
      setProducts(prod.data || [])
      setStock(stk.data || [])
      setClients(cli.data || [])
      setPharmacies(pharma.data || [])
    })
  }, [activeSociety?.id])

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (clientRef.current && !clientRef.current.contains(e.target as Node)) setShowClientList(false)
    }
    document.addEventListener("mousedown", h)
    return () => document.removeEventListener("mousedown", h)
  }, [])

  // Prix client spécifiques
  useEffect(() => {
    if (!selectedClient?.id) { setClientPrixMap({}); return }
    supabase.from("client_prix").select("product_id, prix")
      .eq("client_id", selectedClient.id)
      .then(({ data }) => {
        const map: Record<string, number> = {}
        ;(data || []).forEach((r: any) => { map[r.product_id] = Number(r.prix) })
        setClientPrixMap(map)
      })
  }, [selectedClient?.id])

  const stockMap = useMemo(() => {
    const m: Record<string, number> = {}
    stock.forEach(s => { m[s.product_id || s.produit_nom] = s.quantite })
    return m
  }, [stock])

  const filteredProducts = useMemo(() => {
    return products.filter(p =>
      p.gamme === activeGamme &&
      p.name.toLowerCase().includes(search.toLowerCase())
    )
  }, [products, activeGamme, search])

  const clientList = useMemo(() => {
    if (typeVente === "Pharmacie") {
      return pharmacies
        .filter((p: any) => p.nom.toLowerCase().includes(clientSearch.toLowerCase()))
        .map((p: any) => ({
          id: p.id,
          nom: p.nom,
          prenom: undefined,
          nom_shop: p.ville,
          contrat: "Pharmacie",
          telephone: p.telephone,
        }))
    }
    return clients.filter(c => {
      const s = clientSearch.toLowerCase()
      return (
        c.nom?.toLowerCase().includes(s) ||
        c.prenom?.toLowerCase().includes(s) ||
        c.nom_shop?.toLowerCase().includes(s)
      )
    })
  }, [typeVente, clients, pharmacies, clientSearch])

  const addToCart = (product: Product) => {
    const prix = clientPrixMap[product.id] ?? product.pv
    setCart(prev => {
      const existing = prev.find(i => i.product_id === product.id)
      if (existing) {
        return prev.map(i =>
          i.product_id === product.id ? { ...i, quantite: i.quantite + 1 } : i
        )
      }
      return [...prev, {
        product_id: product.id,
        nom: product.name,
        gamme: product.gamme,
        quantite: 1,
        pv: prix,
        cf: product.cf,
      }]
    })
  }

  const updateQty = (productId: string, delta: number) => {
    setCart(prev =>
      prev
        .map(i => i.product_id === productId ? { ...i, quantite: i.quantite + delta } : i)
        .filter(i => i.quantite > 0)
    )
  }

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(i => i.product_id !== productId))
  }

  const clearCart = () => {
    setCart([])
    setSelectedClient(null)
    setNotes("")
    setPort(0)
    setPortPerso("")
  }

  const portVal = portPerso ? parseFloat(portPerso.replace(",", ".")) || 0 : port
  const totalHT = cart.reduce((s, i) => s + i.pv * i.quantite, 0)
  const totalTTC = totalHT + portVal
  const urssaf = totalTTC * urssafRate
  const cfTotal = cart.reduce((s, i) => s + i.cf * i.quantite, 0)
  const resultat = totalTTC - urssaf - cfTotal
  const cartCount = cart.reduce((s, i) => s + i.quantite, 0)

  const handleVente = async () => {
    if (!cart.length || saving) return
    setSaving(true)

    const clientNom =
      selectedClient?.nom ||
      (typeVente === "Shopify" ? "Commande Shopify" :
       typeVente === "Pharmacie" ? "Pharmacie" :
       typeVente === "Convention" ? "Convention" : "Client de passage")

    try {
      const { data: vente, error } = await supabase.from("ventes").insert({
        society_id: activeSociety.id,
        user_id: profile.id,
        client_id: selectedClient?.id || null,
        client_nom: clientNom,
        created_at: new Date(venteDate + "T12:00:00").toISOString(),
        total_ht: totalHT,
        port: portVal,
        remise: 0,
        total_ttc: totalTTC,
        paiement,
        notes: notes || null,
      }).select().single()

      if (error) throw error

      await supabase.from("vente_items").insert(
        cart.map(i => ({
          vente_id: vente.id,
          product_id: i.product_id,
          produit_nom: i.nom,
          quantite: i.quantite,
          pv_unitaire: i.pv,
          cf_unitaire: i.cf,
          total: i.pv * i.quantite,
        }))
      )

      // Décrément stock
      for (const item of cart) {
        const stk = stock.find(s => s.product_id === item.product_id)
        if (stk) {
          await supabase.from("stock")
            .update({ quantite: stk.quantite - item.quantite })
            .eq("id", stk.id)
        }
      }

      setSuccess(true)
      setTimeout(() => {
        setSuccess(false)
        clearCart()
      }, 1800)
    } catch (e) {
      console.error(e)
      alert("Erreur lors de l'enregistrement de la vente")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="h-full flex bg-[#0a0a0a] overflow-hidden">
      {/* ════════ LEFT – CATALOGUE ════════ */}
      <div className="flex-1 flex flex-col min-w-0 border-r border-zinc-800/80">
        {/* Top bar */}
        <div className="h-14 flex items-center gap-3 px-4 border-b border-zinc-800/80 shrink-0">
          <div className="relative flex-1 max-w-md">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">⌕</span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher un produit…"
              className="w-full h-9 bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600"
            />
          </div>

          <div className="flex items-center gap-1.5">
            {GAMMES.map(g => (
              <button
                key={g.val}
                onClick={() => setActiveGamme(g.val)}
                className={`h-8 px-3 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                  activeGamme === g.val
                    ? "text-black"
                    : "text-zinc-400 hover:text-white hover:bg-zinc-800"
                }`}
                style={activeGamme === g.val ? { background: g.color } : {}}
              >
                <span>{g.emoji}</span>
                <span className="hidden lg:inline">{g.val}</span>
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowHistorique(true)}
            className="h-8 px-3 rounded-lg text-xs text-zinc-400 border border-zinc-800 hover:text-white hover:bg-zinc-800 transition"
          >
            Historique
          </button>
        </div>

        {/* Product grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {filteredProducts.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <p className="text-zinc-600 text-sm">Aucun produit dans cette gamme</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {filteredProducts.map(p => {
                const qty = stockMap[p.id] ?? stockMap[p.name] ?? null
                const lowStock = qty !== null && qty <= 5
                const prix = clientPrixMap[p.id] ?? p.pv
                const inCart = cart.find(i => i.product_id === p.id)

                return (
                  <button
                    key={p.id}
                    onClick={() => addToCart(p)}
                    className={`group relative text-left rounded-xl border p-3 transition-all hover:scale-[1.02] active:scale-[0.98] ${
                      inCart
                        ? "bg-zinc-800/80 border-zinc-600"
                        : "bg-zinc-900/60 border-zinc-800 hover:border-zinc-600"
                    }`}
                  >
                    {inCart && (
                      <span
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full text-[10px] font-bold text-black flex items-center justify-center"
                        style={{ background: ACCENT }}
                      >
                        {inCart.quantite}
                      </span>
                    )}
                    <p className="text-sm font-medium text-white leading-snug line-clamp-2 min-h-[2.5rem]">
                      {p.name}
                    </p>
                    <div className="mt-2 flex items-end justify-between">
                      <p className="text-base font-bold" style={{ color: ACCENT }}>
                        {formatEuro(prix)}
                      </p>
                      {qty !== null && (
                        <span className={`text-[10px] font-medium ${lowStock ? "text-rose-400" : "text-zinc-500"}`}>
                          {qty} en stock
                        </span>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ════════ RIGHT – PANIER ════════ */}
      <div className="w-[340px] xl:w-[380px] flex flex-col bg-[#0c0c0e] shrink-0">
        {/* Client + type */}
        <div className="p-4 border-b border-zinc-800/80 space-y-3">
          <div className="flex gap-1.5">
            {(["Particulier", "Pharmacie", "Shopify", "Convention"] as const).map(t => (
              <button
                key={t}
                onClick={() => { setTypeVente(t); setSelectedClient(null) }}
                className={`flex-1 h-8 rounded-lg text-[11px] font-medium transition ${
                  typeVente === t
                    ? "text-black"
                    : "text-zinc-500 hover:text-zinc-300 bg-zinc-900"
                }`}
                style={typeVente === t ? { background: ACCENT } : {}}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="relative" ref={clientRef}>
            <button
              onClick={() => setShowClientList(p => !p)}
              className="w-full h-10 flex items-center gap-2.5 px-3 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-600 transition text-left"
            >
              <span className="text-zinc-500">👤</span>
              <span className={`flex-1 text-sm truncate ${selectedClient ? "text-white" : "text-zinc-500"}`}>
                {selectedClient
                  ? (selectedClient.prenom ? `${selectedClient.prenom} ${selectedClient.nom}` : selectedClient.nom)
                  : "Client de passage"}
              </span>
              <span className="text-zinc-600 text-xs">▾</span>
            </button>

            {showClientList && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl z-30 overflow-hidden">
                <div className="p-2">
                  <input
                    autoFocus
                    value={clientSearch}
                    onChange={e => setClientSearch(e.target.value)}
                    placeholder="Rechercher…"
                    className="w-full h-8 bg-zinc-800 border border-zinc-700 rounded-lg px-3 text-sm text-white focus:outline-none"
                  />
                </div>
                <div className="max-h-48 overflow-y-auto">
                  <button
                    onClick={() => { setSelectedClient(null); setShowClientList(false) }}
                    className="w-full text-left px-3 py-2 text-sm text-zinc-400 hover:bg-zinc-800"
                  >
                    Client de passage
                  </button>
                  {clientList.map(c => (
                    <button
                      key={c.id}
                      onClick={() => { setSelectedClient(c); setShowClientList(false); setClientSearch("") }}
                      className="w-full text-left px-3 py-2 hover:bg-zinc-800"
                    >
                      <p className="text-sm text-white">
                        {c.prenom ? `${c.prenom} ${c.nom}` : c.nom}
                      </p>
                      {c.nom_shop && <p className="text-[11px] text-zinc-500">{c.nom_shop}</p>}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Cart items */}
        <div className="flex-1 overflow-y-auto">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-6">
              <div className="text-4xl mb-3 opacity-30">🛒</div>
              <p className="text-sm text-zinc-500">Panier vide</p>
              <p className="text-xs text-zinc-600 mt-1">Clique sur un produit pour l’ajouter</p>
            </div>
          ) : (
            <div className="p-3 space-y-1.5">
              {cart.map(item => (
                <div
                  key={item.product_id}
                  className="flex items-center gap-2 p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800/60"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate font-medium">{item.nom}</p>
                    <p className="text-[11px] text-zinc-500">{formatEuro(item.pv)} / u.</p>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => updateQty(item.product_id, -1)}
                      className="w-7 h-7 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 text-sm font-bold"
                    >
                      −
                    </button>
                    <span className="w-6 text-center text-sm font-semibold text-white">{item.quantite}</span>
                    <button
                      onClick={() => updateQty(item.product_id, 1)}
                      className="w-7 h-7 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 text-sm font-bold"
                    >
                      +
                    </button>
                  </div>

                  <p className="text-sm font-semibold w-16 text-right" style={{ color: ACCENT }}>
                    {formatEuro(item.pv * item.quantite)}
                  </p>

                  <button
                    onClick={() => removeFromCart(item.product_id)}
                    className="text-zinc-600 hover:text-rose-400 text-xs ml-0.5"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Totals + actions */}
        <div className="border-t border-zinc-800/80 p-4 space-y-3">
          {/* Port */}
          <div className="flex items-center gap-2">
            <select
              value={portPerso ? "perso" : port}
              onChange={e => {
                if (e.target.value === "perso") setPortPerso("0")
                else { setPort(Number(e.target.value)); setPortPerso("") }
              }}
              className="flex-1 h-8 bg-zinc-900 border border-zinc-800 rounded-lg px-2 text-xs text-zinc-300 focus:outline-none"
            >
              {PORT_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label} — {formatEuro(o.value)}</option>
              ))}
              <option value="perso">Personnalisé…</option>
            </select>
            {portPerso !== "" && (
              <input
                value={portPerso}
                onChange={e => setPortPerso(e.target.value)}
                className="w-20 h-8 bg-zinc-900 border border-zinc-800 rounded-lg px-2 text-xs text-white focus:outline-none"
                placeholder="0.00"
              />
            )}
          </div>

          {/* Paiement + date */}
          <div className="flex gap-2">
            <select
              value={paiement}
              onChange={e => setPaiement(e.target.value)}
              className="flex-1 h-8 bg-zinc-900 border border-zinc-800 rounded-lg px-2 text-xs text-zinc-300 focus:outline-none"
            >
              {PAIEMENTS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <input
              type="date"
              value={venteDate}
              onChange={e => setVenteDate(e.target.value)}
              className="h-8 bg-zinc-900 border border-zinc-800 rounded-lg px-2 text-xs text-zinc-300 focus:outline-none"
            />
          </div>

          {/* Notes */}
          <input
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Notes (optionnel)"
            className="w-full h-8 bg-zinc-900 border border-zinc-800 rounded-lg px-3 text-xs text-white placeholder-zinc-600 focus:outline-none"
          />

          {/* Summary */}
          <div className="space-y-1 pt-1">
            <div className="flex justify-between text-xs text-zinc-500">
              <span>Sous-total ({cartCount} article{cartCount > 1 ? "s" : ""})</span>
              <span>{formatEuro(totalHT)}</span>
            </div>
            {portVal > 0 && (
              <div className="flex justify-between text-xs text-zinc-500">
                <span>Port</span>
                <span>{formatEuro(portVal)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-semibold text-white pt-1">
              <span>Total TTC</span>
              <span style={{ color: ACCENT }}>{formatEuro(totalTTC)}</span>
            </div>
            <div className="flex justify-between text-[11px] text-zinc-600">
              <span>Net estimé (après URSSAF + CF)</span>
              <span className={resultat >= 0 ? "text-emerald-500" : "text-rose-400"}>{formatEuro(resultat)}</span>
            </div>
          </div>

          {/* Validate */}
          <button
            onClick={handleVente}
            disabled={!cart.length || saving}
            className="w-full h-11 rounded-xl text-sm font-bold text-black transition disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]"
            style={{ background: success ? "#22c55e" : ACCENT }}
          >
            {saving ? "Enregistrement…" : success ? "✓ Vente enregistrée" : `Valider · ${formatEuro(totalTTC)}`}
          </button>

          {cart.length > 0 && (
            <button
              onClick={clearCart}
              className="w-full h-8 text-xs text-zinc-500 hover:text-rose-400 transition"
            >
              Vider le panier
            </button>
          )}
        </div>
      </div>

      {/* Historique simple */}
      {showHistorique && (
        <HistoriqueDrawer
          societyId={activeSociety.id}
          onClose={() => setShowHistorique(false)}
          ACCENT={ACCENT}
        />
      )}
    </div>
  )
}

/* ─── Historique drawer ─── */
function HistoriqueDrawer({ societyId, onClose, ACCENT }: { societyId: string; onClose: () => void; ACCENT: string }) {
  const [ventes, setVentes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  useEffect(() => {
    supabase.from("ventes").select("*, vente_items(*)")
      .eq("society_id", societyId)
      .order("created_at", { ascending: false })
      .limit(50)
      .then(({ data }) => {
        setVentes(data || [])
        setLoading(false)
      })
  }, [societyId])

  const filtered = ventes.filter(v =>
    !search || (v.client_nom || "").toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex justify-end">
      <div className="w-full max-w-md h-full bg-[#111] border-l border-zinc-800 flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          <div>
            <h3 className="text-base font-semibold text-white">Historique des ventes</h3>
            <p className="text-xs text-zinc-500">{filtered.length} ventes</p>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white text-lg">✕</button>
        </div>

        <div className="px-4 py-3">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un client…"
            className="w-full h-9 bg-zinc-900 border border-zinc-800 rounded-lg px-3 text-sm text-white placeholder-zinc-600 focus:outline-none"
          />
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
          {loading ? (
            <p className="text-center text-zinc-600 text-sm py-10">Chargement…</p>
          ) : filtered.length === 0 ? (
            <p className="text-center text-zinc-600 text-sm py-10">Aucune vente</p>
          ) : (
            filtered.map(v => (
              <div key={v.id} className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-white">{v.client_nom || "Passage"}</p>
                    <p className="text-[11px] text-zinc-500">
                      {new Date(v.created_at).toLocaleString("fr-FR", {
                        day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold" style={{ color: ACCENT }}>
                      {Number(v.total_ttc).toFixed(2)} €
                    </p>
                    <span className="text-[10px] text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded-full">
                      {v.paiement}
                    </span>
                  </div>
                </div>
                {v.vente_items?.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-zinc-800 space-y-0.5">
                    {v.vente_items.map((it: any) => (
                      <div key={it.id} className="flex justify-between text-[11px] text-zinc-500">
                        <span>{it.produit_nom} ×{it.quantite}</span>
                        <span>{Number(it.total).toFixed(2)} €</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}