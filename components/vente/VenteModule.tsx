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
  { label: "0.20-0.30 kg", value: 6.84 },
  { label: "0.30-0.50 kg", value: 7.71 },
  { label: "0.50-0.75 kg", value: 8.60 },
  { label: "0.75-1 kg", value: 9.34 },
  { label: "1-2 kg", value: 10.48 },
  { label: "2-3 kg", value: 11 },
]
const GAMMES = ["Particuliers", "Professionnels", "Shopify", "Convention"]
const TYPES = ["Particulier", "Pharmacie", "Shopify", "Convention"] as const

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
  const [typeVente, setTypeVente] = useState<typeof TYPES[number]>("Particulier")
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [clientSearch, setClientSearch] = useState("")
  const [showClientList, setShowClientList] = useState(false)
  const [paiement, setPaiement] = useState("Espèces")
  const [port, setPort] = useState(0)
  const [notes, setNotes] = useState("")
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [showHistorique, setShowHistorique] = useState(false)
  const [clientPrixMap, setClientPrixMap] = useState<Record<string, number>>({})

  const clientRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!activeSociety?.id) return
    Promise.all([
      supabase.from("products").select("id, name, gamme, pv, cf").eq("society_id", activeSociety.id).order("name"),
      supabase.from("stock").select("*").eq("society_id", activeSociety.id),
      supabase.from("clients").select("id, nom, prenom, nom_shop, contrat, telephone").eq("society_id", activeSociety.id).order("nom"),
      supabase.from("pharmacies").select("id, nom, ville, telephone").eq("society_id", activeSociety.id).order("nom"),
    ]).then(([p, s, c, ph]) => {
      setProducts(p.data || [])
      setStock(s.data || [])
      setClients(c.data || [])
      setPharmacies(ph.data || [])
    })
    setTimeout(() => searchRef.current?.focus(), 100)
  }, [activeSociety?.id])

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (clientRef.current && !clientRef.current.contains(e.target as Node)) setShowClientList(false)
    }
    document.addEventListener("mousedown", h)
    return () => document.removeEventListener("mousedown", h)
  }, [])

  useEffect(() => {
    if (!selectedClient?.id) { setClientPrixMap({}); return }
    supabase.from("client_prix").select("product_id, prix").eq("client_id", selectedClient.id)
      .then(({ data }) => {
        const map: Record<string, number> = {}
        ;(data || []).forEach((r: any) => { map[r.product_id] = Number(r.prix) })
        setClientPrixMap(map)
      })
  }, [selectedClient?.id])

  const stockMap = useMemo(() => {
    const m: Record<string, number> = {}
    stock.forEach(s => { m[s.product_id] = Number(s.quantite) })
    return m
  }, [stock])

  const filteredProducts = useMemo(() => {
    const q = search.toLowerCase()
    return products.filter(p =>
      p.gamme === activeGamme &&
      (!q || p.name.toLowerCase().includes(q))
    )
  }, [products, activeGamme, search])

  const clientList = useMemo(() => {
    const q = clientSearch.toLowerCase()
    if (typeVente === "Pharmacie") {
      return pharmacies
        .filter((p: any) => !q || p.nom.toLowerCase().includes(q))
        .map((p: any) => ({
          id: p.id, nom: p.nom, prenom: undefined,
          nom_shop: p.ville, contrat: "Pharmacie", telephone: p.telephone
        }))
    }
    return clients.filter(c =>
      !q ||
      c.nom?.toLowerCase().includes(q) ||
      c.prenom?.toLowerCase().includes(q) ||
      c.nom_shop?.toLowerCase().includes(q)
    )
  }, [typeVente, clients, pharmacies, clientSearch])

  const addToCart = (product: Product) => {
    const prix = clientPrixMap[product.id] ?? product.pv
    setCart(prev => {
      const exist = prev.find(i => i.product_id === product.id)
      if (exist) {
        return prev.map(i => i.product_id === product.id ? { ...i, quantite: i.quantite + 1 } : i)
      }
      return [...prev, { product_id: product.id, nom: product.name, quantite: 1, pv: prix, cf: product.cf }]
    })
  }

  const updateQty = (id: string, delta: number) => {
    setCart(prev =>
      prev.map(i => i.product_id === id ? { ...i, quantite: i.quantite + delta } : i)
        .filter(i => i.quantite > 0)
    )
  }

  const removeItem = (id: string) => setCart(prev => prev.filter(i => i.product_id !== id))

  const clearCart = () => {
    setCart([])
    setSelectedClient(null)
    setNotes("")
    setPort(0)
    setPaiement("Espèces")
  }

  const totalHT = cart.reduce((s, i) => s + i.pv * i.quantite, 0)
  const totalTTC = totalHT + port
  const urssaf = totalTTC * 0.138
  const cfTotal = cart.reduce((s, i) => s + i.cf * i.quantite, 0)
  const net = totalTTC - urssaf - cfTotal
  const cartCount = cart.reduce((s, i) => s + i.quantite, 0)

  const handleVente = async () => {
    if (!cart.length || saving) return
    setSaving(true)

    const clientNom = selectedClient
      ? (selectedClient.prenom ? `${selectedClient.prenom} ${selectedClient.nom}` : selectedClient.nom)
      : typeVente === "Shopify" ? "Commande Shopify"
      : typeVente === "Pharmacie" ? "Pharmacie"
      : typeVente === "Convention" ? "Convention"
      : "Client de passage"

    try {
      const { data: vente, error } = await supabase.from("ventes").insert({
        society_id: activeSociety.id,
        user_id: profile.id,
        client_id: selectedClient?.id || null,
        client_nom: clientNom,
        total_ht: totalHT,
        port,
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

      for (const item of cart) {
        const stk = stock.find(s => s.product_id === item.product_id)
        if (stk) {
          await supabase.from("stock").update({ quantite: stk.quantite - item.quantite }).eq("id", stk.id)
        }
      }

      setSuccess(true)
      setTimeout(() => {
        setSuccess(false)
        clearCart()
        searchRef.current?.focus()
      }, 1500)
    } catch (e) {
      console.error(e)
      alert("Erreur lors de l'enregistrement")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="h-full flex bg-[#0a0a0a] overflow-hidden">

      {/* ════════ COLONNE GAUCHE – PRODUITS ════════ */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Header */}
        <div className="h-13 flex items-center justify-between px-5 py-3 border-b border-zinc-800/70 shrink-0">
          <div className="flex items-center gap-4">
            <h1 className="text-base font-semibold text-white">Nouvelle vente</h1>
            <div className="flex gap-1">
              {TYPES.map(t => (
                <button
                  key={t}
                  onClick={() => { setTypeVente(t); setSelectedClient(null) }}
                  className={`h-7 px-2.5 rounded-md text-[11px] font-medium transition ${
                    typeVente === t
                      ? "text-black"
                      : "text-zinc-500 hover:text-zinc-300"
                  }`}
                  style={typeVente === t ? { background: ACCENT } : {}}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={() => setShowHistorique(true)}
            className="h-8 px-3 rounded-lg text-xs text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            Historique
          </button>
        </div>

        {/* Recherche + Gammes */}
        <div className="px-5 py-3 border-b border-zinc-800/50 space-y-3 shrink-0">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">⌕</span>
            <input
              ref={searchRef}
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher un produit…"
              className="w-full h-10 bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600"
            />
          </div>
          <div className="flex gap-1.5">
            {GAMMES.map(g => (
              <button
                key={g}
                onClick={() => setActiveGamme(g)}
                className={`h-7 px-3 rounded-full text-xs font-medium transition ${
                  activeGamme === g
                    ? "text-black"
                    : "text-zinc-500 bg-zinc-900 hover:text-zinc-300"
                }`}
                style={activeGamme === g ? { background: ACCENT } : {}}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        {/* Liste produits (compacte) */}
        <div className="flex-1 overflow-y-auto">
          {filteredProducts.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <p className="text-sm text-zinc-600">Aucun produit trouvé</p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-800/60">
              {filteredProducts.map(p => {
                const qty = stockMap[p.id]
                const prix = clientPrixMap[p.id] ?? p.pv
                const inCart = cart.find(i => i.product_id === p.id)
                const low = qty !== undefined && qty <= 3

                return (
                  <button
                    key={p.id}
                    onClick={() => addToCart(p)}
                    className="w-full flex items-center gap-4 px-5 py-3 hover:bg-zinc-900/80 transition text-left group"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-medium truncate group-hover:text-white">
                        {p.name}
                      </p>
                      <p className="text-[11px] text-zinc-500 mt-0.5">
                        {qty !== undefined ? (
                          <span className={low ? "text-rose-400" : ""}>{qty} en stock</span>
                        ) : "—"}
                      </p>
                    </div>

                    <p className="text-sm font-semibold tabular-nums" style={{ color: ACCENT }}>
                      {formatEuro(prix)}
                    </p>

                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold transition ${
                      inCart
                        ? "text-black"
                        : "bg-zinc-800 text-zinc-400 group-hover:bg-zinc-700 group-hover:text-white"
                    }`}
                      style={inCart ? { background: ACCENT } : {}}
                    >
                      {inCart ? inCart.quantite : "+"}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ════════ COLONNE DROITE – PANIER ════════ */}
      <div className="w-[320px] xl:w-[360px] flex flex-col border-l border-zinc-800/80 bg-[#0c0c0e] shrink-0">

        {/* Client */}
        <div className="p-4 border-b border-zinc-800/70" ref={clientRef}>
          <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-2">Client</p>
          <button
            onClick={() => setShowClientList(p => !p)}
            className="w-full h-10 flex items-center gap-2.5 px-3 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-600 transition text-left"
          >
            <span className="text-base">👤</span>
            <span className={`flex-1 text-sm truncate ${selectedClient ? "text-white font-medium" : "text-zinc-500"}`}>
              {selectedClient
                ? (selectedClient.prenom ? `${selectedClient.prenom} ${selectedClient.nom}` : selectedClient.nom)
                : "Client de passage"}
            </span>
            <span className="text-zinc-600 text-xs">▾</span>
          </button>

          {showClientList && (
            <div className="absolute z-30 mt-1 w-[288px] xl:w-[328px] bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl overflow-hidden">
              <div className="p-2">
                <input
                  autoFocus
                  value={clientSearch}
                  onChange={e => setClientSearch(e.target.value)}
                  placeholder="Rechercher un client…"
                  className="w-full h-8 bg-zinc-800 border border-zinc-700 rounded-lg px-3 text-sm text-white focus:outline-none"
                />
              </div>
              <div className="max-h-52 overflow-y-auto">
                <button
                  onClick={() => { setSelectedClient(null); setShowClientList(false) }}
                  className="w-full text-left px-3 py-2.5 text-sm text-zinc-400 hover:bg-zinc-800"
                >
                  Client de passage
                </button>
                {clientList.map(c => (
                  <button
                    key={c.id}
                    onClick={() => { setSelectedClient(c); setShowClientList(false); setClientSearch("") }}
                    className="w-full text-left px-3 py-2.5 hover:bg-zinc-800"
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

        {/* Articles */}
        <div className="flex-1 overflow-y-auto">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center px-6 text-center">
              <p className="text-3xl mb-2 opacity-20">🛒</p>
              <p className="text-sm text-zinc-500">Panier vide</p>
              <p className="text-xs text-zinc-600 mt-1">Clique sur un produit pour l’ajouter</p>
            </div>
          ) : (
            <div className="p-3 space-y-1">
              {cart.map(item => (
                <div key={item.product_id} className="flex items-center gap-2 p-2.5 rounded-xl bg-zinc-900/70">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{item.nom}</p>
                    <p className="text-[11px] text-zinc-500">{formatEuro(item.pv)}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => updateQty(item.product_id, -1)}
                      className="w-6 h-6 rounded-md bg-zinc-800 text-zinc-400 hover:text-white text-xs font-bold"
                    >−</button>
                    <span className="w-5 text-center text-sm font-semibold text-white">{item.quantite}</span>
                    <button
                      onClick={() => updateQty(item.product_id, 1)}
                      className="w-6 h-6 rounded-md bg-zinc-800 text-zinc-400 hover:text-white text-xs font-bold"
                    >+</button>
                  </div>
                  <p className="text-sm font-semibold w-16 text-right tabular-nums" style={{ color: ACCENT }}>
                    {formatEuro(item.pv * item.quantite)}
                  </p>
                  <button onClick={() => removeItem(item.product_id)} className="text-zinc-600 hover:text-rose-400 text-xs">✕</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Résumé + Validation */}
        <div className="border-t border-zinc-800/70 p-4 space-y-3">
          <div className="flex gap-2">
            <select
              value={port}
              onChange={e => setPort(Number(e.target.value))}
              className="flex-1 h-8 bg-zinc-900 border border-zinc-800 rounded-lg px-2 text-xs text-zinc-300 focus:outline-none"
            >
              {PORT_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label} · {formatEuro(o.value)}</option>
              ))}
            </select>
            <select
              value={paiement}
              onChange={e => setPaiement(e.target.value)}
              className="w-28 h-8 bg-zinc-900 border border-zinc-800 rounded-lg px-2 text-xs text-zinc-300 focus:outline-none"
            >
              {PAIEMENTS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          <input
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Note (optionnel)"
            className="w-full h-8 bg-zinc-900 border border-zinc-800 rounded-lg px-3 text-xs text-white placeholder-zinc-600 focus:outline-none"
          />

          <div className="space-y-1">
            <div className="flex justify-between text-xs text-zinc-500">
              <span>Sous-total · {cartCount} article{cartCount > 1 ? "s" : ""}</span>
              <span>{formatEuro(totalHT)}</span>
            </div>
            {port > 0 && (
              <div className="flex justify-between text-xs text-zinc-500">
                <span>Port</span>
                <span>{formatEuro(port)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-bold text-white pt-1">
              <span>Total</span>
              <span style={{ color: ACCENT }}>{formatEuro(totalTTC)}</span>
            </div>
            <div className="flex justify-between text-[11px] text-zinc-600">
              <span>Net estimé</span>
              <span className={net >= 0 ? "text-emerald-500" : "text-rose-400"}>{formatEuro(net)}</span>
            </div>
          </div>

          <button
            onClick={handleVente}
            disabled={!cart.length || saving}
            className="w-full h-12 rounded-xl text-sm font-bold text-black transition active:scale-[0.98] disabled:opacity-40"
            style={{ background: success ? "#22c55e" : ACCENT }}
          >
            {saving ? "Enregistrement…" : success ? "✓ Vente enregistrée" : `Valider · ${formatEuro(totalTTC)}`}
          </button>

          {cart.length > 0 && !success && (
            <button onClick={clearCart} className="w-full text-xs text-zinc-600 hover:text-rose-400 transition">
              Vider le panier
            </button>
          )}
        </div>
      </div>

      {/* Historique */}
      {showHistorique && (
        <HistoriqueDrawer societyId={activeSociety.id} onClose={() => setShowHistorique(false)} ACCENT={ACCENT} />
      )}
    </div>
  )
}

function HistoriqueDrawer({ societyId, onClose, ACCENT }: { societyId: string; onClose: () => void; ACCENT: string }) {
  const [ventes, setVentes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  useEffect(() => {
    supabase.from("ventes").select("*, vente_items(*)")
      .eq("society_id", societyId)
      .order("created_at", { ascending: false })
      .limit(40)
      .then(({ data }) => { setVentes(data || []); setLoading(false) })
  }, [societyId])

  const filtered = ventes.filter(v =>
    !search || (v.client_nom || "").toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex justify-end">
      <div className="w-full max-w-md h-full bg-[#111] border-l border-zinc-800 flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          <div>
            <h3 className="text-base font-semibold text-white">Historique</h3>
            <p className="text-xs text-zinc-500">{filtered.length} ventes</p>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white">✕</button>
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
          ) : filtered.map(v => (
            <div key={v.id} className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-white">{v.client_nom || "Passage"}</p>
                  <p className="text-[11px] text-zinc-500">
                    {new Date(v.created_at).toLocaleString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold" style={{ color: ACCENT }}>{Number(v.total_ttc).toFixed(2)} €</p>
                  <span className="text-[10px] text-zinc-500">{v.paiement}</span>
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
          ))}
        </div>
      </div>
    </div>
  )
}