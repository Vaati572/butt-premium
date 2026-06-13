"use client"

import { useEffect, useState, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import {
  Plus, X, ShoppingCart, Check, Pencil, Trash2, Package,
  Wallet, Search, Minus, AlertTriangle, ChevronDown, User,
  Tag, FileText, CreditCard, Calendar, TrendingUp, Zap,
  Receipt, ChevronLeft, ChevronRight,
} from "lucide-react"

interface Props { activeSociety: any; profile: any }

/* ══════════════════════════════════════════════
   CAISSE JOURNALIÈRE (inchangée)
══════════════════════════════════════════════ */
const BILLETS = [500, 200, 100, 50, 20, 10, 5]
const PIECES  = [2, 1, 0.50, 0.20, 0.10, 0.05, 0.02, 0.01]

function CaissePanel({ societyId, convention, onClose }: { societyId: string; convention: any; onClose: () => void }) {
  const today = new Date().toISOString().slice(0, 10)
  const [date, setDate]                     = useState(today)
  const [fondOuverture, setFondOuverture]   = useState(0)
  const [billets, setBillets]               = useState<Record<number,number>>({})
  const [pieces, setPieces]                 = useState<Record<number,number>>({})
  const [notes, setNotes]                   = useState("")
  const [caConvention, setCaConvention]     = useState(0)
  const [saving, setSaving]                 = useState(false)
  const [saved, setSaved]                   = useState(false)
  const [existingId, setExistingId]         = useState<string|null>(null)
  const [section, setSection]               = useState<"ouverture"|"fermeture">("ouverture")

  useEffect(() => {
    supabase.from("ventes").select("total_ttc").eq("society_id", societyId)
      .gte("created_at", `${date}T00:00:00`).lte("created_at", `${date}T23:59:59`)
      .then(({ data }) => setCaConvention((data||[]).reduce((s:number,v:any) => s + Number(v.total_ttc||0), 0)))
  }, [date, societyId])

  useEffect(() => {
    supabase.from("caisse_journaliere").select("*").eq("convention_id", convention.id).eq("date", date).single()
      .then(({ data }) => {
        if (data) { setExistingId(data.id); setFondOuverture(Number(data.fond_ouverture||0)); setBillets(data.billets||{}); setPieces(data.pieces||{}); setNotes(data.notes||"") }
        else { setExistingId(null); setFondOuverture(0); setBillets({}); setPieces({}); setNotes("") }
      })
  }, [date, convention.id])

  const totalBillets = BILLETS.reduce((s,b) => s + b*(billets[b]||0), 0)
  const totalPieces  = PIECES.reduce((s,p) => s + p*(pieces[p]||0), 0)
  const totalCompte  = totalBillets + totalPieces
  const ecart        = totalCompte - fondOuverture - caConvention

  const save = async () => {
    setSaving(true)
    const payload = { society_id: societyId, convention_id: convention.id, date, fond_ouverture: fondOuverture, billets, pieces, total_compte: totalCompte, ca_convention: caConvention, notes, updated_at: new Date().toISOString() }
    if (existingId) await supabase.from("caisse_journaliere").update(payload).eq("id", existingId)
    else { const { data } = await supabase.from("caisse_journaliere").insert(payload).select().single(); if (data) setExistingId(data.id) }
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-end z-50">
      <div className="bg-[#111111] border-l border-zinc-800 w-full max-w-lg h-full flex flex-col shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-zinc-800">
          <div>
            <p className="text-[11px] font-bold text-orange-400 uppercase tracking-wider mb-0.5">🎪 {convention.nom}</p>
            <h3 className="text-white font-bold text-base flex items-center gap-2"><Wallet size={16}/> Caisse journalière</h3>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white"><X size={18}/></button>
        </div>
        <div className="px-5 py-3 border-b border-zinc-800 flex items-center gap-3">
          <label className="text-zinc-500 text-xs font-semibold uppercase tracking-wider shrink-0">Date</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} min={convention.date_debut} max={convention.date_fin}
            className="bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"/>
          {existingId && <span className="text-green-400 text-[10px] font-bold">✓ Enregistrée</span>}
        </div>
        <div className="flex border-b border-zinc-800">
          {([["ouverture","🌅 Ouverture"],["fermeture","🌙 Fermeture"]] as const).map(([v,l]) => (
            <button key={v} onClick={() => setSection(v)} className={`flex-1 py-3 text-sm font-semibold transition-colors ${section===v?"text-orange-400 border-b-2 border-orange-400":"text-zinc-500 hover:text-zinc-300"}`}>{l}</button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {section === "ouverture" && (
            <>
              <div>
                <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-2">Fond de caisse (€)</label>
                <input type="number" min="0" step="0.01" value={fondOuverture} onChange={e => setFondOuverture(parseFloat(e.target.value)||0)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-lg text-white font-bold focus:outline-none focus:border-orange-500/60"/>
              </div>
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
                <p className="text-zinc-500 text-[11px] uppercase tracking-wider font-semibold mb-1">CA enregistré ({date})</p>
                <p className="text-orange-400 text-2xl font-black">{caConvention.toFixed(2)}€</p>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-2">Notes</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Observations..."
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none resize-none"/>
              </div>
            </>
          )}
          {section === "fermeture" && (
            <>
              <div>
                <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-3">Billets</p>
                {BILLETS.map(val => (
                  <div key={val} className="flex items-center gap-3 mb-2">
                    <div className="w-16 text-center"><span className="text-white font-bold text-sm">{val}€</span></div>
                    <div className="flex items-center gap-2 flex-1">
                      <button onClick={() => setBillets(p => ({...p,[val]:Math.max(0,(p[val]||0)-1)}))} className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold flex items-center justify-center">−</button>
                      <input type="number" min="0" value={billets[val]||0} onChange={e => setBillets(p => ({...p,[val]:parseInt(e.target.value)||0}))} className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-white text-center focus:outline-none"/>
                      <button onClick={() => setBillets(p => ({...p,[val]:(p[val]||0)+1}))} className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold flex items-center justify-center">+</button>
                    </div>
                    <div className="w-20 text-right"><span className="text-orange-400 text-sm font-bold">{((billets[val]||0)*val).toFixed(0)}€</span></div>
                  </div>
                ))}
                <div className="flex justify-between pt-2 border-t border-zinc-800"><span className="text-zinc-400 text-sm">Total billets</span><span className="text-white font-bold">{totalBillets.toFixed(2)}€</span></div>
              </div>
              <div>
                <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-3">Pièces</p>
                {PIECES.map(val => (
                  <div key={val} className="flex items-center gap-3 mb-2">
                    <div className="w-16 text-center"><span className="text-white font-bold text-sm">{val>=1?`${val}€`:`${Math.round(val*100)}c`}</span></div>
                    <div className="flex items-center gap-2 flex-1">
                      <button onClick={() => setPieces(p => ({...p,[val]:Math.max(0,(p[val]||0)-1)}))} className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold flex items-center justify-center">−</button>
                      <input type="number" min="0" value={pieces[val]||0} onChange={e => setPieces(p => ({...p,[val]:parseInt(e.target.value)||0}))} className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-white text-center focus:outline-none"/>
                      <button onClick={() => setPieces(p => ({...p,[val]:(p[val]||0)+1}))} className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold flex items-center justify-center">+</button>
                    </div>
                    <div className="w-20 text-right"><span className="text-orange-400 text-sm font-bold">{((pieces[val]||0)*val).toFixed(2)}€</span></div>
                  </div>
                ))}
                <div className="flex justify-between pt-2 border-t border-zinc-800"><span className="text-zinc-400 text-sm">Total pièces</span><span className="text-white font-bold">{totalPieces.toFixed(2)}€</span></div>
              </div>
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-3">
                <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Récapitulatif</p>
                {[{label:"Total compté",val:totalCompte,color:"text-white"},{label:"Fond d'ouverture",val:-fondOuverture,color:"text-zinc-400"},{label:"CA système",val:-caConvention,color:"text-orange-400"}].map(({label,val,color}) => (
                  <div key={label} className="flex items-center justify-between"><span className="text-zinc-500 text-sm">{label}</span><span className={`font-bold text-sm ${color}`}>{val>=0?"":"−"}{Math.abs(val).toFixed(2)}€</span></div>
                ))}
                <div className="border-t border-zinc-700 pt-3 flex items-center justify-between">
                  <span className="text-white font-bold">Écart de caisse</span>
                  <span className={`text-xl font-black ${ecart===0?"text-green-400":ecart>0?"text-blue-400":"text-red-400"}`}>{ecart>=0?"+":""}{ecart.toFixed(2)}€</span>
                </div>
                {ecart===0&&totalCompte>0&&<p className="text-green-400 text-xs text-center font-semibold">✓ Caisse équilibrée</p>}
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-2">Notes fermeture</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Observations..."
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none resize-none"/>
              </div>
            </>
          )}
        </div>
        <div className="p-5 border-t border-zinc-800">
          <button onClick={save} disabled={saving}
            className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 ${saved?"bg-green-500 text-white":"bg-orange-500 hover:bg-orange-400 text-black disabled:opacity-40"}`}>
            {saved?<><Check size={16}/>Caisse sauvegardée !</>:saving?"Sauvegarde...":<><Wallet size={15}/>Sauvegarder</>}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════
   VENTE CONVENTION — PANEL COMPLET
══════════════════════════════════════════════ */
const GAMMES_ALL = ["Tous","Particuliers","Professionnels","Shopify","Convention"]
const GAMME_COLOR: Record<string,string> = { Particuliers:"#eab308", Professionnels:"#a855f7", Shopify:"#22c55e", Convention:"#f97316" }
const GAMME_EMOJI: Record<string,string> = { Particuliers:"👤", Professionnels:"🏢", Shopify:"🛍️", Convention:"🎪" }
const PAIEMENTS = ["Espèces","CB","Virement","Chèque","En attente"]
const DEFAULT_URSSAF = 0.138

interface CartItem {
  product_id: string; nom: string; gamme: string
  pv: number; pv_original: number; cf: number
  quantite: number; note_article: string
  stock_qty: number | null
}

function VenteConventionPanel({ societyId, profile, convention, onClose, onDone }: {
  societyId: string; profile: any; convention: any; onClose: () => void; onDone: () => void
}) {
  const [products, setProducts]     = useState<any[]>([])
  const [allStock, setAllStock]     = useState<any[]>([])
  const [urssafRate, setUrssafRate] = useState(DEFAULT_URSSAF)
  const [cart, setCart]             = useState<CartItem[]>([])
  const [search, setSearch]         = useState("")
  const [activeGamme, setActiveGamme] = useState("Convention")
  const [paiement, setPaiement]     = useState("Espèces")
  const [clientNom, setClientNom]   = useState("")
  const [notes, setNotes]           = useState("")
  const [remise, setRemise]         = useState("")
  const [venteDate, setVenteDate]   = useState(new Date().toISOString().split("T")[0])
  const [saving, setSaving]         = useState(false)
  const [success, setSuccess]       = useState(false)
  const [view, setView]             = useState<"catalogue"|"panier">("catalogue")
  const [loading, setLoading]       = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const [{ data: prods }, { data: stock }, { data: cfg }] = await Promise.all([
        supabase.from("products").select("*").eq("society_id", societyId).order("gamme").order("name"),
        supabase.from("stock").select("*").eq("society_id", societyId),
        supabase.from("settings").select("key,value").eq("society_id", societyId).eq("key","urssaf_rate_global").single(),
      ])
      setProducts(prods || [])
      setAllStock(stock || [])
      if (cfg?.value != null) setUrssafRate(Number(cfg.value))
      setLoading(false)
    }
    load()
  }, [societyId])

  const findStock = (productId: string, productName: string) =>
    allStock.find((s:any) => s.product_id && s.product_id === productId) ||
    allStock.find((s:any) => s.produit_nom?.toLowerCase().trim() === productName.toLowerCase().trim())

  const filteredProds = products.filter(p => {
    if (activeGamme !== "Tous" && p.gamme !== activeGamme) return false
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const addToCart = (product: any) => {
    const si = findStock(product.id, product.name)
    setCart(prev => {
      const ex = prev.find(i => i.product_id === product.id)
      if (ex) return prev.map(i => i.product_id===product.id ? {...i, quantite: i.quantite+1} : i)
      return [...prev, { product_id: product.id, nom: product.name, gamme: product.gamme, pv: Number(product.pv), pv_original: Number(product.pv), cf: Number(product.cf||0), quantite: 1, note_article: "", stock_qty: si?.quantite ?? null }]
    })
  }

  const updateItem = (productId: string, field: keyof CartItem, value: any) =>
    setCart(prev => prev.map(i => i.product_id === productId ? {...i, [field]: value} : i))

  const removeItem = (productId: string) =>
    setCart(prev => prev.filter(i => i.product_id !== productId))

  const cartCount  = cart.reduce((s,i) => s + i.quantite, 0)
  const totalHT    = cart.reduce((s,i) => s + i.pv * i.quantite, 0)
  const remiseVal  = parseFloat(remise) || 0
  const totalApresRemise = Math.max(0, totalHT - remiseVal)
  const urssaf     = totalApresRemise * urssafRate
  const cfTotal    = cart.reduce((s,i) => s + i.cf * i.quantite, 0)
  const resultat   = totalApresRemise - urssaf - cfTotal

  const saveVente = async () => {
    if (!cart.length) return
    setSaving(true)
    try {
      const { data: vente, error } = await supabase.from("ventes").insert({
        society_id: societyId, user_id: profile.id,
        client_nom: clientNom || `Convention ${convention.nom}`,
        created_at: new Date(venteDate + "T12:00:00").toISOString(),
        total_ht: totalHT, port: 0, remise: remiseVal, total_ttc: totalApresRemise,
        paiement, notes: notes || `Convention : ${convention.nom}`,
      }).select().single()

      if (error) { alert("Erreur : " + error.message); setSaving(false); return }

      if (vente) {
        await supabase.from("vente_items").insert(cart.map(i => ({
          vente_id: vente.id, product_id: i.product_id, produit_nom: i.nom,
          gamme: i.gamme, quantite: i.quantite, pv_unitaire: i.pv,
          cf_unitaire: i.cf, total: i.pv * i.quantite,
          notes: i.note_article || null,
        })))

        // Stock sync
        const freshStock = [...allStock]
        for (const item of cart) {
          const prod = products.find(p => p.id === item.product_id)
          let compo: Record<string,number> = {}
          if (prod?.composition) { compo = typeof prod.composition === "string" ? JSON.parse(prod.composition) : prod.composition }
          const entries = Object.entries(compo)
          if (entries.length > 0) {
            for (const [cNom, qpu] of entries) {
              const tot = item.quantite * Number(qpu)
              const si = freshStock.find((s:any) => s.produit_nom?.toLowerCase().trim() === cNom.toLowerCase().trim())
              if (si) {
                const nq = si.quantite - tot
                await supabase.from("stock").update({ quantite: nq, updated_at: new Date().toISOString() }).eq("id", si.id)
                try { await supabase.from("stock_history").insert({ society_id: societyId, product_id: si.product_id, produit_nom: si.produit_nom, user_id: profile.id, action: "Sortie", quantite: tot, quantite_avant: si.quantite, quantite_apres: nq, notes: `Conv "${convention.nom}"` }) } catch {}
                si.quantite = nq
              }
            }
          } else {
            const si = freshStock.find((s:any) => (s.product_id&&s.product_id===item.product_id) || s.produit_nom?.toLowerCase().trim()===item.nom.toLowerCase().trim())
            if (si) {
              const nq = si.quantite - item.quantite
              await supabase.from("stock").update({ quantite: nq, updated_at: new Date().toISOString() }).eq("id", si.id)
              try { await supabase.from("stock_history").insert({ society_id: societyId, product_id: item.product_id, produit_nom: item.nom, user_id: profile.id, action: "Sortie", quantite: item.quantite, quantite_avant: si.quantite, quantite_apres: nq, notes: `Conv "${convention.nom}"` }) } catch {}
              si.quantite = nq
            }
          }
        }

        setAllStock(freshStock)
        setCart([]); setClientNom(""); setNotes(""); setRemise(""); setPaiement("Espèces")
        setVenteDate(new Date().toISOString().split("T")[0])
        setSuccess(true); setView("catalogue")
        setTimeout(() => { setSuccess(false); onDone() }, 2000)
      }
    } catch (e) { console.error(e); alert("Erreur inattendue") }
    finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-end z-50">
      <div className="bg-[#0d0d0d] border-l border-zinc-800 w-full max-w-xl h-full flex flex-col shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 shrink-0"
          style={{ background: "linear-gradient(135deg,rgba(249,115,22,0.12),transparent)" }}>
          <div>
            <p className="text-[11px] font-bold text-orange-400 uppercase tracking-wider mb-0.5">🎪 {convention.nom}</p>
            <h3 className="text-white font-bold text-base">Nouvelle vente</h3>
          </div>
          <div className="flex items-center gap-2">
            {cartCount > 0 && (
              <button onClick={() => setView(v => v==="catalogue"?"panier":"catalogue")}
                className="flex items-center gap-1.5 bg-orange-500 text-black font-bold px-3 py-2 rounded-xl text-xs">
                <ShoppingCart size={13}/>
                {view==="catalogue" ? `Panier (${cartCount})` : "← Catalogue"}
              </button>
            )}
            <button onClick={onClose} className="text-zinc-500 hover:text-white"><X size={18}/></button>
          </div>
        </div>

        {/* ════ CATALOGUE ════ */}
        {view === "catalogue" && (
          <>
            <div className="px-4 py-3 border-b border-zinc-800 space-y-2 shrink-0">
              {/* Filtres gamme */}
              <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                {GAMMES_ALL.map(g => (
                  <button key={g} onClick={() => setActiveGamme(g)}
                    className="shrink-0 px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-all"
                    style={activeGamme===g
                      ? { backgroundColor: (GAMME_COLOR[g]||"#f97316")+"25", borderColor: GAMME_COLOR[g]||"#f97316", color: GAMME_COLOR[g]||"#f97316" }
                      : { backgroundColor: "rgba(24,24,27,0.7)", borderColor: "rgba(63,63,70,0.5)", color: "#71717a" }}>
                    {g} {g!=="Tous" && <span className="opacity-50">({products.filter(p=>p.gamme===g).length})</span>}
                  </button>
                ))}
              </div>
              {/* Recherche */}
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"/>
                <input type="text" placeholder="Rechercher un produit..." value={search} onChange={e => setSearch(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-orange-500/50"/>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3">
              {loading
                ? <div className="flex items-center justify-center py-12"><div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"/></div>
                : filteredProds.length === 0
                  ? <div className="text-center py-12 text-zinc-600"><Package size={32} className="mx-auto mb-3 opacity-20"/><p className="text-sm">Aucun produit</p></div>
                  : <div className="space-y-1.5">
                    {filteredProds.map(product => {
                      const inCart   = cart.find(i => i.product_id === product.id)
                      const si       = findStock(product.id, product.name)
                      const sqty     = si?.quantite ?? null
                      const sOut     = sqty !== null && sqty <= 0
                      const sLow     = sqty !== null && si?.seuil_alerte > 0 && sqty <= si.seuil_alerte && sqty > 0
                      const gc       = GAMME_COLOR[product.gamme] || "#f97316"
                      return (
                        <button key={product.id} onClick={() => !sOut && addToCart(product)}
                          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left group${sOut?" opacity-50 cursor-not-allowed":""}`}
                          style={inCart ? { borderColor: gc+"60", backgroundColor: gc+"12" } : { borderColor:"rgba(63,63,70,0.5)", backgroundColor:"rgba(24,24,27,0.7)" }}>
                          <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 flex items-center justify-center" style={{ backgroundColor: gc+"20" }}>
                            {product.avatar_url ? <img src={product.avatar_url} className="w-full h-full object-cover" alt={product.name}/> : <span className="text-xl">{GAMME_EMOJI[product.gamme]||"📦"}</span>}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-semibold truncate">{product.name}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: gc+"15", color: gc }}>{product.gamme}</span>
                              <span className="text-zinc-600 text-[10px]">CF: {Number(product.cf||0).toFixed(2)}€</span>
                              {sqty !== null && <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${sOut?"bg-red-500/15 text-red-400":sLow?"bg-orange-500/15 text-orange-400":"bg-green-500/10 text-green-400"}`}>{sOut?"Rupture":sLow?`⚠ Stock: ${sqty}`:`Stock: ${sqty}`}</span>}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-base font-black" style={{ color: gc }}>{Number(product.pv).toFixed(2)}€</span>
                            {inCart
                              ? <div className="w-7 h-7 rounded-full flex items-center justify-center text-black text-xs font-black" style={{ backgroundColor: gc }}>{inCart.quantite}</div>
                              : <div className="w-7 h-7 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-500 group-hover:border-zinc-500 transition-colors"><Plus size={13}/></div>
                            }
                          </div>
                        </button>
                      )
                    })}
                  </div>
              }
            </div>

            {/* Mini barre panier */}
            {cartCount > 0 && (
              <div className="border-t border-zinc-800 px-4 py-3 flex items-center justify-between bg-zinc-900/80 shrink-0">
                <div className="flex items-center gap-2">
                  <ShoppingCart size={14} className="text-orange-400"/>
                  <span className="text-zinc-300 text-sm">{cartCount} article{cartCount>1?"s":""}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-orange-400 font-black text-lg">{totalHT.toFixed(2)}€</span>
                  <button onClick={() => setView("panier")} className="bg-orange-500 hover:bg-orange-400 text-black font-bold px-4 py-2 rounded-xl text-sm flex items-center gap-1.5">
                    Finaliser →
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* ════ PANIER COMPLET ════ */}
        {view === "panier" && (
          <>
            <div className="flex-1 overflow-y-auto">
              <div className="p-4 space-y-3">

                {/* Articles avec prix modifiable + note */}
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider">Articles ({cartCount})</p>
                  {cart.map(item => {
                    const gc = GAMME_COLOR[item.gamme] || "#f97316"
                    const prixModif = item.pv !== item.pv_original
                    const sLow = item.stock_qty !== null && item.stock_qty !== undefined && item.stock_qty > 0 && item.stock_qty <= item.quantite
                    const sOut = item.stock_qty !== null && item.stock_qty !== undefined && item.stock_qty <= 0
                    return (
                      <div key={item.product_id} className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                        {/* Ligne principale */}
                        <div className="flex items-center gap-2 p-3">
                          <div className="flex items-center gap-1 bg-zinc-800 rounded-lg shrink-0">
                            <button onClick={() => { if (item.quantite<=1) removeItem(item.product_id); else updateItem(item.product_id,"quantite",item.quantite-1) }}
                              className="w-7 h-7 flex items-center justify-center text-zinc-400 hover:text-white"><Minus size={11}/></button>
                            <span className="text-white text-sm font-bold w-6 text-center">{item.quantite}</span>
                            <button onClick={() => updateItem(item.product_id,"quantite",item.quantite+1)}
                              className="w-7 h-7 flex items-center justify-center text-zinc-400 hover:text-white"><Plus size={11}/></button>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-xs font-semibold truncate">{item.nom}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: gc+"15", color: gc }}>{item.gamme}</span>
                              {item.stock_qty !== null && <span className={`text-[9px] font-semibold ${sOut?"text-red-400":sLow?"text-orange-400":"text-green-500"}`}>{sOut?"⚠ Rupture":sLow?`⚠ Stock: ${item.stock_qty}`:`Stock: ${item.stock_qty}`}</span>}
                            </div>
                          </div>
                          <p className="font-black text-sm shrink-0" style={{ color: gc }}>{(item.pv*item.quantite).toFixed(2)}€</p>
                          <button onClick={() => removeItem(item.product_id)} className="text-zinc-700 hover:text-red-400 shrink-0 ml-1"><X size={12}/></button>
                        </div>

                        {/* Zone prix + note — toujours visible */}
                        <div className="border-t border-zinc-800/80 px-3 py-2.5 space-y-2 bg-zinc-800/30">
                          {/* Prix modifiable */}
                          <div className="flex items-center gap-2">
                            <Tag size={12} className="text-zinc-500 shrink-0"/>
                            <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider shrink-0 w-20">Prix unit.</label>
                            <div className="flex-1 relative">
                              <input
                                type="number" step="0.01" min="0" value={item.pv}
                                onChange={e => updateItem(item.product_id, "pv", parseFloat(e.target.value)||0)}
                                className="w-full bg-zinc-800 border rounded-lg px-3 py-1.5 text-sm text-white text-center focus:outline-none font-bold"
                                style={{ borderColor: prixModif ? "#f97316" : "#3f3f46" }}
                              />
                              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 text-[10px]">€</span>
                            </div>
                            {prixModif && (
                              <button onClick={() => updateItem(item.product_id, "pv", item.pv_original)}
                                className="text-[10px] text-zinc-500 hover:text-orange-400 font-bold whitespace-nowrap shrink-0">
                                ↺ {item.pv_original.toFixed(2)}€
                              </button>
                            )}
                          </div>
                          {prixModif && (
                            <p className="text-[10px] pl-[26px]" style={{ color: "#f97316" }}>
                              {item.pv < item.pv_original ? `▼ Remise: −${(item.pv_original-item.pv).toFixed(2)}€/u` : `▲ Majoration: +${(item.pv-item.pv_original).toFixed(2)}€/u`}
                            </p>
                          )}
                          {/* Note article */}
                          <div className="flex items-center gap-2">
                            <FileText size={12} className="text-zinc-500 shrink-0"/>
                            <input
                              type="text" placeholder="Note sur cet article..." value={item.note_article}
                              onChange={e => updateItem(item.product_id, "note_article", e.target.value)}
                              className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600"
                            />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Client */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <User size={13} className="text-zinc-400 shrink-0"/>
                    <p className="text-xs font-bold text-zinc-300">Client</p>
                  </div>
                  <input type="text" placeholder="Nom du client (optionnel)..." value={clientNom} onChange={e => setClientNom(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-orange-500/40"/>
                </div>

                {/* Notes globales */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText size={13} className="text-zinc-400 shrink-0"/>
                    <p className="text-xs font-bold text-zinc-300">Notes de la vente</p>
                  </div>
                  <textarea
                    value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                    placeholder="Informations, livraison, remarques..."
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none resize-none focus:border-orange-500/40"
                  />
                </div>

                {/* Remise globale */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Tag size={13} className="text-zinc-400 shrink-0"/>
                      <p className="text-xs font-bold text-zinc-300">Remise globale</p>
                    </div>
                    {remiseVal > 0 && <span className="text-xs font-bold text-orange-400">−{remiseVal.toFixed(2)}€</span>}
                  </div>
                  <div className="relative">
                    <input type="number" step="0.01" min="0" value={remise} onChange={e => setRemise(e.target.value)} placeholder="0.00"
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500/40 text-center"/>
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 text-[10px]">€</span>
                  </div>
                </div>

                {/* Paiement */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <CreditCard size={13} className="text-zinc-400 shrink-0"/>
                    <p className="text-xs font-bold text-zinc-300">Mode de paiement</p>
                  </div>
                  <div className="flex gap-1.5 flex-wrap">
                    {PAIEMENTS.map(p => (
                      <button key={p} onClick={() => setPaiement(p)}
                        className={`flex-1 py-2 rounded-lg text-[11px] font-bold border transition-all min-w-[65px] ${paiement===p?"bg-orange-500 text-black border-orange-500":"bg-zinc-800 text-zinc-500 border-zinc-700 hover:border-zinc-500 hover:text-zinc-300"}`}>
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Date */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 flex items-center gap-2">
                  <Calendar size={13} className="text-zinc-400 shrink-0"/>
                  <p className="text-xs font-bold text-zinc-300 shrink-0">Date</p>
                  <input type="date" value={venteDate} onChange={e => setVenteDate(e.target.value)}
                    className="flex-1 bg-transparent text-xs text-white focus:outline-none text-right"/>
                  {venteDate !== new Date().toISOString().split("T")[0] && <span className="text-orange-400 text-[9px] font-bold shrink-0">≠ Auj.</span>}
                </div>

                {/* Alerte stock */}
                {cart.some(i => i.stock_qty !== null && i.stock_qty !== undefined && i.stock_qty <= i.quantite) && (
                  <div className="flex items-start gap-2 bg-orange-500/10 border border-orange-500/25 rounded-xl px-3 py-2.5">
                    <AlertTriangle size={14} className="text-orange-400 shrink-0 mt-0.5"/>
                    <p className="text-orange-300 text-xs">Certains produits ont un stock faible. La vente sera quand même enregistrée.</p>
                  </div>
                )}

                {/* Récapitulatif financier */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3">
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Récapitulatif</p>
                  <div className="space-y-1">
                    {cart.map(item => (
                      <div key={item.product_id} className="flex justify-between text-[11px] text-zinc-600">
                        <span className="truncate mr-2">{item.nom} ×{item.quantite} @ {item.pv.toFixed(2)}€{item.pv!==item.pv_original?" ✏️":""}</span>
                        <span className="shrink-0">{(item.pv*item.quantite).toFixed(2)}€</span>
                      </div>
                    ))}
                    <div className="border-t border-zinc-800 pt-1 mt-1 space-y-1">
                      <div className="flex justify-between text-xs text-zinc-400"><span>Sous-total</span><span>{totalHT.toFixed(2)}€</span></div>
                      {remiseVal > 0 && <div className="flex justify-between text-xs text-orange-400"><span>Remise</span><span>−{remiseVal.toFixed(2)}€</span></div>}
                      <div className="flex justify-between text-xs text-zinc-600"><span>URSSAF {(urssafRate*100).toFixed(1)}%</span><span>−{urssaf.toFixed(2)}€</span></div>
                      <div className="flex justify-between text-xs text-zinc-600"><span>CF total</span><span>−{cfTotal.toFixed(2)}€</span></div>
                      <div className={`flex justify-between text-sm font-bold border-t border-zinc-800 pt-1 ${resultat>=0?"text-green-400":"text-red-400"}`}>
                        <span>Résultat net</span><span>{resultat.toFixed(2)}€</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center mt-3 pt-2 border-t border-zinc-700">
                    <span className="text-white font-bold">Total à payer</span>
                    <span className="text-orange-400 text-2xl font-black">{totalApresRemise.toFixed(2)}€</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Boutons */}
            <div className="border-t border-zinc-800 p-4 space-y-2 shrink-0">
              <button onClick={saveVente} disabled={saving || !cart.length}
                className={`w-full font-black py-4 rounded-xl text-base transition-all flex items-center justify-center gap-2 shadow-lg ${success?"bg-green-500 text-white shadow-green-500/20":"bg-orange-500 hover:bg-orange-400 disabled:opacity-40 text-black shadow-orange-500/20"}`}>
                {success ? <><Check size={18}/> Vente enregistrée !</>
                  : saving ? <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"/>
                  : <><ShoppingCart size={18}/> Valider · {totalApresRemise.toFixed(2)}€</>
                }
              </button>
              <button onClick={() => setView("catalogue")}
                className="w-full py-2.5 rounded-xl text-zinc-400 font-semibold text-sm bg-zinc-900 hover:bg-zinc-800 border border-zinc-800">
                ← Retour au catalogue
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════
   HISTORIQUE COMPLET CONVENTION
══════════════════════════════════════════════ */
function HistoriqueConventionPanel({ societyId, convention, onClose }: {
  societyId: string; convention: any; onClose: () => void
}) {
  const [ventes, setVentes]   = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set())

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const debut = convention.date_debut?.slice(0,10)
      const fin   = convention.date_fin?.slice(0,10)
      if (!debut || !fin) { setLoading(false); return }
      const { data } = await supabase
        .from("ventes")
        .select("*, vente_items(*)")
        .eq("society_id", societyId)
        .gte("created_at", `${debut}T00:00:00`)
        .lte("created_at", `${fin}T23:59:59`)
        .order("created_at", { ascending: false })
      setVentes(data || [])
      // Ouvrir le premier jour par défaut
      if (data && data.length > 0) {
        const firstDay = data[0].created_at.slice(0,10)
        setExpandedDays(new Set([firstDay]))
      }
      setLoading(false)
    }
    load()
  }, [societyId, convention])

  const toggleVente = (id: string) => setExpanded(prev => { const n = new Set(prev); n.has(id)?n.delete(id):n.add(id); return n })
  const toggleDay   = (d: string)  => setExpandedDays(prev => { const n = new Set(prev); n.has(d)?n.delete(d):n.add(d); return n })

  // Grouper par jour
  const byDay: Record<string, any[]> = {}
  ventes.forEach(v => {
    const d = v.created_at.slice(0,10)
    if (!byDay[d]) byDay[d] = []
    byDay[d].push(v)
  })
  const days = Object.keys(byDay).sort((a,b) => b.localeCompare(a))

  const totalConv = ventes.reduce((s,v) => s + Number(v.total_ttc||0), 0)
  const totalRemises = ventes.reduce((s,v) => s + Number(v.remise||0), 0)

  // CA par paiement global
  const byPaiement: Record<string,number> = {}
  ventes.forEach(v => { byPaiement[v.paiement] = (byPaiement[v.paiement]||0) + Number(v.total_ttc||0) })

  // Articles agrégés global
  const articlesMap: Record<string,{nom:string;qty:number;total:number}> = {}
  ventes.forEach(v => (v.vente_items||[]).forEach((item:any) => {
    if (!articlesMap[item.produit_nom]) articlesMap[item.produit_nom]={nom:item.produit_nom,qty:0,total:0}
    articlesMap[item.produit_nom].qty   += Number(item.quantite||0)
    articlesMap[item.produit_nom].total += Number(item.total||0)
  }))
  const articles = Object.values(articlesMap).sort((a,b) => b.total - a.total)

  const duration = convention.date_debut && convention.date_fin
    ? Math.ceil((new Date(convention.date_fin+"T00:00:00").getTime()-new Date(convention.date_debut+"T00:00:00").getTime())/86400000)+1
    : 0

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-end z-50">
      <div className="bg-[#111111] border-l border-zinc-800 w-full max-w-lg h-full flex flex-col shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 shrink-0"
          style={{background:"linear-gradient(135deg,rgba(249,115,22,0.1),transparent)"}}>
          <div>
            <p className="text-[11px] font-bold text-orange-400 uppercase tracking-wider mb-0.5">🎪 {convention.nom}</p>
            <h3 className="text-white font-bold text-base flex items-center gap-2">
              <Receipt size={16}/> Historique des ventes
            </h3>
            {convention.lieu && <p className="text-zinc-500 text-xs mt-0.5">📍 {convention.lieu} · {duration}j</p>}
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white"><X size={18}/></button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"/>
            </div>
          ) : ventes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-6">
              <Receipt size={40} className="text-zinc-800 mb-4"/>
              <p className="text-zinc-500 font-semibold">Aucune vente enregistrée</p>
              <p className="text-zinc-700 text-sm mt-1">
                {convention.date_debut && convention.date_fin
                  ? `Du ${new Date(convention.date_debut+"T00:00:00").toLocaleDateString("fr-FR")} au ${new Date(convention.date_fin+"T00:00:00").toLocaleDateString("fr-FR")}`
                  : "Période non définie"}
              </p>
            </div>
          ) : (
            <div className="p-4 space-y-4">

              {/* Stats globales */}
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-center">
                  <p className="text-orange-400 text-lg font-black">{totalConv.toFixed(2)}€</p>
                  <p className="text-zinc-600 text-[10px]">CA total</p>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-center">
                  <p className="text-white text-lg font-black">{ventes.length}</p>
                  <p className="text-zinc-600 text-[10px]">Vente{ventes.length>1?"s":""}</p>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-center">
                  <p className="text-zinc-300 text-lg font-black">{days.length}j</p>
                  <p className="text-zinc-600 text-[10px]">Jours actifs</p>
                </div>
              </div>

              {/* CA par jour (mini chart) */}
              {days.length > 1 && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3">
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">📅 CA par jour</p>
                  <div className="space-y-1.5">
                    {[...days].reverse().map(d => {
                      const ca = byDay[d].reduce((s,v) => s+Number(v.total_ttc||0), 0)
                      const pct = totalConv > 0 ? (ca/totalConv)*100 : 0
                      const label = new Date(d+"T00:00:00").toLocaleDateString("fr-FR",{weekday:"short",day:"numeric",month:"short"})
                      return (
                        <div key={d}>
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="text-zinc-400 text-xs capitalize">{label}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-zinc-600 text-[10px]">{byDay[d].length} vente{byDay[d].length>1?"s":""}</span>
                              <span className="text-orange-400 text-xs font-bold">{ca.toFixed(2)}€</span>
                            </div>
                          </div>
                          <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                            <div className="h-full rounded-full bg-orange-500" style={{width:`${pct}%`}}/>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Paiement global */}
              {Object.keys(byPaiement).length > 0 && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3">
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">💳 Par mode de paiement</p>
                  <div className="space-y-1.5">
                    {Object.entries(byPaiement).sort((a,b)=>b[1]-a[1]).map(([mode,montant]) => {
                      const pct = totalConv > 0 ? (montant/totalConv)*100 : 0
                      return (
                        <div key={mode}>
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="text-zinc-300 text-xs">{mode}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-zinc-500 text-[10px]">{pct.toFixed(0)}%</span>
                              <span className="text-orange-400 text-xs font-bold">{montant.toFixed(2)}€</span>
                            </div>
                          </div>
                          <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                            <div className="h-full rounded-full bg-orange-500" style={{width:`${pct}%`}}/>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  {totalRemises > 0 && <p className="text-zinc-600 text-[10px] mt-2">Remises totales : {totalRemises.toFixed(2)}€</p>}
                </div>
              )}

              {/* Top articles */}
              {articles.length > 0 && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3">
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">📦 Articles vendus</p>
                  <div className="space-y-1.5">
                    {articles.map(art => (
                      <div key={art.nom} className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-orange-400 text-[10px] font-black shrink-0 w-5 text-center">×{art.qty}</span>
                          <span className="text-zinc-300 text-xs truncate">{art.nom}</span>
                        </div>
                        <span className="text-white text-xs font-bold shrink-0 ml-2">{art.total.toFixed(2)}€</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Ventes groupées par jour */}
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">🧾 Détail par jour</p>
                {days.map(d => {
                  const ventesJour = byDay[d]
                  const caJour = ventesJour.reduce((s,v)=>s+Number(v.total_ttc||0),0)
                  const isOpen = expandedDays.has(d)
                  const label  = new Date(d+"T00:00:00").toLocaleDateString("fr-FR",{weekday:"long",day:"numeric",month:"long"})
                  return (
                    <div key={d} className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                      {/* En-tête jour */}
                      <button onClick={() => toggleDay(d)} className="w-full flex items-center justify-between px-4 py-3 hover:bg-zinc-800/50 transition-colors">
                        <div className="text-left">
                          <p className="text-white text-sm font-bold capitalize">{label}</p>
                          <p className="text-zinc-500 text-[11px]">{ventesJour.length} vente{ventesJour.length>1?"s":""}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <p className="text-orange-400 font-black">{caJour.toFixed(2)}€</p>
                          <ChevronRight size={14} className={`text-zinc-600 transition-transform ${isOpen?"rotate-90":""}`}/>
                        </div>
                      </button>

                      {/* Ventes du jour */}
                      {isOpen && (
                        <div className="border-t border-zinc-800 bg-zinc-800/20 divide-y divide-zinc-800/50">
                          {ventesJour.map(v => (
                            <div key={v.id}>
                              <button onClick={() => toggleVente(v.id)} className="w-full flex items-center justify-between px-5 py-2.5 hover:bg-zinc-800/50 transition-colors">
                                <div className="text-left">
                                  <p className="text-zinc-200 text-xs font-semibold">{v.client_nom||"Client de passage"}</p>
                                  <div className="flex items-center gap-1.5 mt-0.5">
                                    <span className="text-zinc-600 text-[10px]">{new Date(v.created_at).toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"})}</span>
                                    <span className="text-[9px] bg-zinc-800 border border-zinc-700 text-zinc-500 px-1.5 py-0.5 rounded-full">{v.paiement}</span>
                                    {v.remise>0&&<span className="text-[9px] text-orange-400">−{Number(v.remise).toFixed(2)}€</span>}
                                  </div>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <p className="text-orange-400 font-bold text-xs">{Number(v.total_ttc).toFixed(2)}€</p>
                                  <ChevronRight size={12} className={`text-zinc-700 transition-transform ${expanded.has(v.id)?"rotate-90":""}`}/>
                                </div>
                              </button>
                              {expanded.has(v.id) && (
                                <div className="px-5 pb-2.5 bg-zinc-800/30">
                                  {v.notes && <p className="text-zinc-600 text-[10px] italic mb-1.5">"{v.notes}"</p>}
                                  {(v.vente_items||[]).map((item:any,i:number) => (
                                    <div key={i} className="flex items-center justify-between py-0.5">
                                      <div className="flex items-center gap-2 min-w-0">
                                        <span className="text-zinc-600 text-[10px] shrink-0">×{item.quantite}</span>
                                        <span className="text-zinc-400 text-[11px] truncate">{item.produit_nom}</span>
                                        {item.notes&&<span className="text-zinc-600 text-[9px] italic">"{item.notes}"</span>}
                                      </div>
                                      <div className="flex items-center gap-1.5 shrink-0 ml-2">
                                        <span className="text-zinc-600 text-[9px]">{Number(item.pv_unitaire).toFixed(2)}€</span>
                                        <span className="text-zinc-300 text-[11px] font-bold">{Number(item.total).toFixed(2)}€</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {!loading && ventes.length > 0 && (
          <div className="border-t border-zinc-800 px-5 py-3 shrink-0 flex items-center justify-between bg-zinc-900/50">
            <div>
              <p className="text-zinc-500 text-xs">{ventes.length} ventes · {days.length} jour{days.length>1?"s":""}</p>
              {totalRemises>0&&<p className="text-zinc-600 text-[10px]">Remises : {totalRemises.toFixed(2)}€</p>}
            </div>
            <p className="text-orange-400 text-xl font-black">{totalConv.toFixed(2)}€</p>
          </div>
        )}
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════
   VENTES JOURNALIÈRES — PANEL DÉTAIL
══════════════════════════════════════════════ */
function VentesJourPanel({ societyId, convention, onClose }: {
  societyId: string; convention: any; onClose: () => void
}) {
  const today = new Date().toISOString().slice(0, 10)
  const [date, setDate]     = useState(today)
  const [ventes, setVentes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  // Génère les jours de la convention pour le sélecteur
  const getDays = () => {
    const days: string[] = []
    if (!convention.date_debut || !convention.date_fin) return days
    let cur = new Date(convention.date_debut + "T00:00:00")
    const end = new Date(convention.date_fin + "T00:00:00")
    while (cur <= end) {
      days.push(cur.toISOString().slice(0, 10))
      cur.setDate(cur.getDate() + 1)
    }
    return days
  }
  const days = getDays()

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const { data } = await supabase
        .from("ventes")
        .select("*, vente_items(*)")
        .eq("society_id", societyId)
        .gte("created_at", `${date}T00:00:00`)
        .lte("created_at", `${date}T23:59:59`)
        .order("created_at", { ascending: false })
      setVentes(data || [])
      setLoading(false)
    }
    load()
  }, [date, societyId])

  const toggle = (id: string) => setExpanded(prev => {
    const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n
  })

  const prevDay = () => {
    const idx = days.indexOf(date); if (idx > 0) setDate(days[idx - 1])
  }
  const nextDay = () => {
    const idx = days.indexOf(date); if (idx < days.length - 1) setDate(days[idx + 1])
  }

  const totalJour    = ventes.reduce((s, v) => s + Number(v.total_ttc || 0), 0)
  const totalRemises = ventes.reduce((s, v) => s + Number(v.remise || 0), 0)

  // CA par mode de paiement
  const byPaiement: Record<string, number> = {}
  ventes.forEach(v => { byPaiement[v.paiement] = (byPaiement[v.paiement] || 0) + Number(v.total_ttc || 0) })

  // Articles vendus agrégés
  const articlesMap: Record<string, { nom: string; qty: number; total: number }> = {}
  ventes.forEach(v => {
    (v.vente_items || []).forEach((item: any) => {
      if (!articlesMap[item.produit_nom]) articlesMap[item.produit_nom] = { nom: item.produit_nom, qty: 0, total: 0 }
      articlesMap[item.produit_nom].qty   += Number(item.quantite || 0)
      articlesMap[item.produit_nom].total += Number(item.total || 0)
    })
  })
  const articles = Object.values(articlesMap).sort((a, b) => b.total - a.total)

  const curIdx  = days.indexOf(date)
  const dateLabel = date ? new Date(date + "T00:00:00").toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" }) : date

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-end z-50">
      <div className="bg-[#111111] border-l border-zinc-800 w-full max-w-lg h-full flex flex-col shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 shrink-0"
          style={{ background: "linear-gradient(135deg,rgba(249,115,22,0.1),transparent)" }}>
          <div>
            <p className="text-[11px] font-bold text-orange-400 uppercase tracking-wider mb-0.5">🎪 {convention.nom}</p>
            <h3 className="text-white font-bold text-base flex items-center gap-2"><Receipt size={16}/> Ventes du jour</h3>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white"><X size={18}/></button>
        </div>

        {/* Sélecteur de jour */}
        <div className="px-4 py-3 border-b border-zinc-800 shrink-0">
          {days.length > 0 ? (
            <div className="flex items-center gap-2">
              <button onClick={prevDay} disabled={curIdx <= 0}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 disabled:opacity-30 shrink-0">
                <ChevronLeft size={15}/>
              </button>
              <div className="flex-1 text-center">
                <p className="text-white font-semibold text-sm capitalize">{dateLabel}</p>
                <p className="text-zinc-500 text-[10px]">Jour {curIdx + 1} / {days.length}</p>
              </div>
              <button onClick={nextDay} disabled={curIdx >= days.length - 1}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 disabled:opacity-30 shrink-0">
                <ChevronRight size={15}/>
              </button>
            </div>
          ) : (
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"/>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"/>
            </div>
          ) : ventes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-6">
              <Receipt size={40} className="text-zinc-800 mb-4"/>
              <p className="text-zinc-500 font-semibold">Aucune vente ce jour</p>
              <p className="text-zinc-700 text-sm mt-1">Aucune vente enregistrée pour le {dateLabel}</p>
            </div>
          ) : (
            <div className="p-4 space-y-4">

              {/* Stats du jour */}
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-center">
                  <p className="text-orange-400 text-lg font-black">{totalJour.toFixed(2)}€</p>
                  <p className="text-zinc-600 text-[10px]">CA total</p>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-center">
                  <p className="text-white text-lg font-black">{ventes.length}</p>
                  <p className="text-zinc-600 text-[10px]">Vente{ventes.length > 1 ? "s" : ""}</p>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-center">
                  <p className="text-zinc-300 text-lg font-black">{ventes.length > 0 ? (totalJour / ventes.length).toFixed(0) : "0"}€</p>
                  <p className="text-zinc-600 text-[10px]">Moy/vente</p>
                </div>
              </div>

              {/* Répartition par paiement */}
              {Object.keys(byPaiement).length > 0 && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3">
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">💳 Par mode de paiement</p>
                  <div className="space-y-1.5">
                    {Object.entries(byPaiement).sort((a,b) => b[1]-a[1]).map(([mode, montant]) => {
                      const pct = totalJour > 0 ? (montant / totalJour) * 100 : 0
                      return (
                        <div key={mode}>
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="text-zinc-300 text-xs">{mode}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-zinc-500 text-[10px]">{pct.toFixed(0)}%</span>
                              <span className="text-orange-400 text-xs font-bold">{montant.toFixed(2)}€</span>
                            </div>
                          </div>
                          <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                            <div className="h-full rounded-full bg-orange-500" style={{ width: `${pct}%` }}/>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  {totalRemises > 0 && <p className="text-zinc-600 text-[10px] mt-2">Remises accordées : {totalRemises.toFixed(2)}€</p>}
                </div>
              )}

              {/* Articles vendus agrégés */}
              {articles.length > 0 && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3">
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">📦 Articles vendus</p>
                  <div className="space-y-1.5">
                    {articles.map(art => (
                      <div key={art.nom} className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-orange-400 text-[10px] font-black shrink-0 w-5 text-center">×{art.qty}</span>
                          <span className="text-zinc-300 text-xs truncate">{art.nom}</span>
                        </div>
                        <span className="text-white text-xs font-bold shrink-0 ml-2">{art.total.toFixed(2)}€</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Liste des ventes individuelles */}
              <div>
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">🧾 Détail des ventes</p>
                <div className="space-y-2">
                  {ventes.map(v => (
                    <div key={v.id} className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                      {/* En-tête vente */}
                      <button onClick={() => toggle(v.id)} className="w-full flex items-center justify-between px-4 py-3 hover:bg-zinc-800/50 transition-colors">
                        <div className="text-left">
                          <p className="text-white text-sm font-semibold">{v.client_nom || "Client de passage"}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <p className="text-zinc-500 text-[11px]">
                              {new Date(v.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                            </p>
                            <span className="text-[10px] bg-zinc-800 border border-zinc-700 text-zinc-400 px-1.5 py-0.5 rounded-full">{v.paiement}</span>
                            {v.remise > 0 && <span className="text-[10px] text-orange-400">−{Number(v.remise).toFixed(2)}€ remise</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <p className="text-orange-400 font-black">{Number(v.total_ttc).toFixed(2)}€</p>
                          <ChevronRight size={14} className={`text-zinc-600 transition-transform ${expanded.has(v.id) ? "rotate-90" : ""}`}/>
                        </div>
                      </button>

                      {/* Détail articles si expanded */}
                      {expanded.has(v.id) && (
                        <div className="border-t border-zinc-800 bg-zinc-800/30">
                          {v.notes && (
                            <div className="px-4 py-2 border-b border-zinc-800/60">
                              <p className="text-zinc-500 text-[10px]">📝 {v.notes}</p>
                            </div>
                          )}
                          {(v.vente_items || []).length > 0 ? (
                            <div className="px-4 py-2 space-y-1.5">
                              {v.vente_items.map((item: any, i: number) => (
                                <div key={i} className="flex items-center justify-between">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span className="text-zinc-500 text-[10px] shrink-0">×{item.quantite}</span>
                                    <span className="text-zinc-300 text-xs truncate">{item.produit_nom}</span>
                                    {item.notes && <span className="text-zinc-600 text-[10px] italic truncate">"{item.notes}"</span>}
                                  </div>
                                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                                    <span className="text-zinc-500 text-[10px]">{Number(item.pv_unitaire).toFixed(2)}€/u</span>
                                    <span className="text-white text-xs font-bold">{Number(item.total).toFixed(2)}€</span>
                                  </div>
                                </div>
                              ))}
                              {v.remise > 0 && (
                                <div className="flex justify-between pt-1 border-t border-zinc-800/60">
                                  <span className="text-orange-400 text-[10px]">Remise globale</span>
                                  <span className="text-orange-400 text-[10px] font-bold">−{Number(v.remise).toFixed(2)}€</span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <p className="px-4 py-2 text-zinc-700 text-xs">Aucun détail disponible</p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer avec total */}
        {!loading && ventes.length > 0 && (
          <div className="border-t border-zinc-800 px-5 py-3 shrink-0 flex items-center justify-between bg-zinc-900/50">
            <div>
              <p className="text-zinc-500 text-xs">{ventes.length} vente{ventes.length > 1 ? "s" : ""} · {dateLabel}</p>
              {totalRemises > 0 && <p className="text-zinc-600 text-[10px]">dont {totalRemises.toFixed(2)}€ de remises</p>}
            </div>
            <p className="text-orange-400 text-xl font-black">{totalJour.toFixed(2)}€</p>
          </div>
        )}
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════
   FORM CONVENTION
══════════════════════════════════════════════ */
function ConventionForm({ societyId, profile, convention, onClose, onDone }: {
  societyId: string; profile: any; convention?: any; onClose: () => void; onDone: () => void
}) {
  const [nom, setNom]             = useState(convention?.nom || "")
  const [lieu, setLieu]           = useState(convention?.lieu || "")
  const [dateDebut, setDateDebut] = useState(convention?.date_debut || "")
  const [dateFin, setDateFin]     = useState(convention?.date_fin || "")
  const [notes, setNotes]         = useState(convention?.notes || "")
  const [saving, setSaving]       = useState(false)

  const save = async () => {
    if (!nom.trim() || !dateDebut || !dateFin) return
    setSaving(true)
    const data: any = { society_id: societyId, nom: nom.trim(), lieu: lieu||null, date_debut: dateDebut, date_fin: dateFin, notes: notes||null, statut: "planifiee" }
    let err = null
    if (convention?.id) { const { error } = await supabase.from("conventions").update(data).eq("id", convention.id); err = error }
    else                { const { error } = await supabase.from("conventions").insert(data); err = error }
    setSaving(false)
    if (err) { alert("Erreur: " + err.message); return }
    onDone(); onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-end z-50">
      <div className="bg-[#111111] border-l border-zinc-800 w-full max-w-sm h-full flex flex-col shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <h3 className="text-base font-bold text-white">{convention ? "Modifier" : "Nouvelle"} convention</h3>
          <button onClick={onClose} className="text-zinc-500 hover:text-white"><X size={18}/></button>
        </div>
        <div className="flex-1 p-6 space-y-4 overflow-y-auto">
          {[{label:"Nom *",value:nom,set:setNom,placeholder:"Ex: Japan Expo 2025"},{label:"Lieu",value:lieu,set:setLieu,placeholder:"Ex: Paris Le Bourget"}].map(({label,value,set,placeholder}) => (
            <div key={label}>
              <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">{label}</label>
              <input type="text" value={value} onChange={e => set(e.target.value)} placeholder={placeholder}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-orange-500/60"/>
            </div>
          ))}
          <div className="grid grid-cols-2 gap-3">
            {[{label:"Date début *",value:dateDebut,set:setDateDebut},{label:"Date fin *",value:dateFin,set:setDateFin}].map(({label,value,set}) => (
              <div key={label}>
                <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">{label}</label>
                <input type="date" value={value} onChange={e => set(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500/60"/>
              </div>
            ))}
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Infos sur la convention..."
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none resize-none"/>
          </div>
        </div>
        <div className="p-6 border-t border-zinc-800 flex gap-3">
          <button onClick={save} disabled={saving || !nom.trim() || !dateDebut || !dateFin}
            className="flex-1 bg-orange-500 hover:bg-orange-400 disabled:opacity-40 text-black font-bold py-3 rounded-xl text-sm">
            {saving ? "Sauvegarde..." : convention ? "Modifier" : "Créer"}
          </button>
          <button onClick={onClose} className="px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold rounded-xl text-sm">Annuler</button>
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════
   MAIN
══════════════════════════════════════════════ */
export default function ConventionModule({ activeSociety, profile }: Props) {
  const [conventions, setConventions] = useState<any[]>([])
  const [loading, setLoading]         = useState(true)
  const [showForm, setShowForm]       = useState(false)
  const [editConv, setEditConv]       = useState<any>(null)
  const [venteConv, setVenteConv]     = useState<any>(null)
  const [caisseConv, setCaisseConv]   = useState<any>(null)
  const [ventesConv, setVentesConv]   = useState<any>(null)
  const [historiqueConv, setHistoriqueConv] = useState<any>(null)
  const [filter, setFilter]           = useState<"all"|"active"|"upcoming"|"past">("all")

  const load = useCallback(async () => {
    if (!activeSociety?.id) return
    setLoading(true)
    const { data } = await supabase.from("conventions").select("*").eq("society_id", activeSociety.id).order("date_debut", { ascending: false })
    setConventions(data || [])
    setLoading(false)
  }, [activeSociety?.id])

  useEffect(() => { load() }, [load])

  const del = async (id: string) => {
    if (!confirm("Supprimer cette convention ?")) return
    await supabase.from("conventions").delete().eq("id", id); load()
  }

  const todayStr = new Date().toISOString().split("T")[0]

  const filtered = conventions.filter(c => {
    if (filter === "all") return true
    const debut = (c.date_debut||"").slice(0,10); const fin = (c.date_fin||"").slice(0,10)
    if (filter === "active")   return debut <= todayStr && fin >= todayStr
    if (filter === "upcoming") return debut > todayStr
    if (filter === "past")     return fin < todayStr
    return true
  })

  const activeNow = conventions.find(c => {
    const debut = (c.date_debut||"").slice(0,10); const fin = (c.date_fin||"").slice(0,10)
    return debut <= todayStr && fin >= todayStr
  })

  return (
    <div className="flex-1 overflow-y-auto bg-[#0a0a0a]">
      <div className="p-6 max-w-4xl mx-auto">

        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-white">🎪 Conventions</h1>
            <p className="text-zinc-500 text-sm mt-0.5">{conventions.length} convention{conventions.length>1?"s":""}</p>
          </div>
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-black font-bold px-4 py-2.5 rounded-xl text-sm shadow-lg shadow-orange-500/20">
            <Plus size={16}/> Nouvelle convention
          </button>
        </div>

        {activeNow && (
          <div className="mb-6 bg-orange-500/10 border border-orange-500/30 rounded-2xl p-5">
            <div className="flex items-start justify-between flex-wrap gap-3">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse"/>
                  <p className="text-orange-400 text-sm font-bold uppercase tracking-wider">Convention en cours</p>
                </div>
                <h2 className="text-white text-xl font-bold mb-1">{activeNow.nom}</h2>
                {activeNow.lieu && <p className="text-zinc-400 text-sm">📍 {activeNow.lieu}</p>}
                <p className="text-zinc-500 text-xs mt-1">
                  {new Date(activeNow.date_debut+"T00:00:00").toLocaleDateString("fr-FR")} → {new Date(activeNow.date_fin+"T00:00:00").toLocaleDateString("fr-FR")}
                </p>
              </div>
              <div className="flex gap-2 shrink-0 flex-wrap">
                <button onClick={() => setHistoriqueConv(activeNow)}
                  className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white font-bold px-4 py-2.5 rounded-xl text-sm border border-zinc-700">
                  <Receipt size={15}/> Historique
                </button>
                <button onClick={() => setVentesConv(activeNow)}
                  className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white font-bold px-4 py-2.5 rounded-xl text-sm border border-zinc-700">
                  <Calendar size={15}/> Ventes du jour
                </button>
                <button onClick={() => setCaisseConv(activeNow)}
                  className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white font-bold px-4 py-2.5 rounded-xl text-sm border border-zinc-700">
                  <Wallet size={15}/> Caisse
                </button>
                <button onClick={() => setVenteConv(activeNow)}
                  className="flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-black font-bold px-4 py-2.5 rounded-xl text-sm">
                  <ShoppingCart size={15}/> Vendre
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-2 mb-5 flex-wrap">
          {[{id:"all",label:"Toutes"},{id:"active",label:"🟢 En cours"},{id:"upcoming",label:"🔵 À venir"},{id:"past",label:"⚫ Passées"}].map(f => (
            <button key={f.id} onClick={() => setFilter(f.id as any)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-colors ${filter===f.id?"bg-orange-500 text-black border-orange-500":"bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-600"}`}>
              {f.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24"><div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"/></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24 text-zinc-600"><p className="text-5xl mb-4">🎪</p><p className="text-sm">Aucune convention</p></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map(c => {
              const debut      = (c.date_debut||"").slice(0,10)
              const fin        = (c.date_fin||"").slice(0,10)
              const isActive   = debut <= todayStr && fin >= todayStr
              const isUpcoming = debut > todayStr
              const isPast     = fin < todayStr
              const daysUntil  = isUpcoming ? Math.ceil((new Date(debut).getTime() - Date.now()) / 86400000) : 0
              const duration   = debut && fin ? Math.ceil((new Date(fin+"T00:00:00").getTime() - new Date(debut+"T00:00:00").getTime()) / 86400000) + 1 : 0
              return (
                <div key={c.id} className={`bg-zinc-900 border rounded-2xl p-5 ${isActive?"border-orange-500/40":"border-zinc-800"}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="text-white font-bold">{c.nom}</h3>
                        {isActive   && <span className="text-[10px] font-bold text-orange-400 bg-orange-400/10 border border-orange-400/20 px-1.5 py-0.5 rounded-full animate-pulse">En cours</span>}
                        {isUpcoming && <span className="text-[10px] font-bold text-blue-400 bg-blue-400/10 border border-blue-400/20 px-1.5 py-0.5 rounded-full">J-{daysUntil}</span>}
                        {isPast     && <span className="text-[10px] font-bold text-zinc-500 bg-zinc-800 border border-zinc-700 px-1.5 py-0.5 rounded-full">Terminée</span>}
                      </div>
                      {c.lieu && <p className="text-zinc-500 text-xs">📍 {c.lieu}</p>}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                      <button onClick={() => setHistoriqueConv(c)} className="flex items-center gap-1 text-[11px] font-bold text-zinc-400 bg-zinc-800 border border-zinc-700 px-2 py-1.5 rounded-lg hover:bg-zinc-700"><Receipt size={11}/> Historique</button>
                      {isActive && (
                        <>
                          <button onClick={() => setVentesConv(c)} className="flex items-center gap-1 text-[11px] font-bold text-zinc-300 bg-zinc-800 border border-zinc-700 px-2 py-1.5 rounded-lg hover:bg-zinc-700"><Calendar size={11}/> Du jour</button>
                          <button onClick={() => setCaisseConv(c)} className="flex items-center gap-1 text-[11px] font-bold text-white bg-zinc-800 border border-zinc-700 px-2 py-1.5 rounded-lg hover:bg-zinc-700"><Wallet size={11}/> Caisse</button>
                          <button onClick={() => setVenteConv(c)} className="flex items-center gap-1 text-[11px] font-bold text-orange-400 bg-orange-400/10 border border-orange-400/20 px-2 py-1.5 rounded-lg hover:bg-orange-400/20"><ShoppingCart size={11}/> Vendre</button>
                        </>
                      )}
                      <button onClick={() => { setEditConv(c); setShowForm(true) }} className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800"><Pencil size={13}/></button>
                      <button onClick={() => del(c.id)} className="p-1.5 text-red-500 hover:text-red-400 rounded-lg hover:bg-red-500/10"><Trash2 size={13}/></button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-zinc-800 rounded-xl px-3 py-2">
                      <p className="text-zinc-500 text-[10px] uppercase tracking-wider mb-0.5">Début</p>
                      <p className="text-white font-semibold text-xs">{debut ? new Date(debut+"T00:00:00").toLocaleDateString("fr-FR",{weekday:"short",day:"numeric",month:"short"}) : "—"}</p>
                    </div>
                    <div className="bg-zinc-800 rounded-xl px-3 py-2">
                      <p className="text-zinc-500 text-[10px] uppercase tracking-wider mb-0.5">Fin</p>
                      <p className="text-white font-semibold text-xs">{fin ? new Date(fin+"T00:00:00").toLocaleDateString("fr-FR",{weekday:"short",day:"numeric",month:"short"}) : "—"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-3 text-xs text-zinc-500">
                    {duration > 0 && <span>📅 {duration}j</span>}
                    {c.notes && <span className="italic truncate">{c.notes}</span>}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {showForm       && <ConventionForm societyId={activeSociety.id} profile={profile} convention={editConv} onClose={() => { setShowForm(false); setEditConv(null) }} onDone={load}/>}
      {venteConv      && <VenteConventionPanel societyId={activeSociety.id} profile={profile} convention={venteConv} onClose={() => setVenteConv(null)} onDone={load}/>}
      {caisseConv     && <CaissePanel societyId={activeSociety.id} convention={caisseConv} onClose={() => setCaisseConv(null)}/>}
      {ventesConv     && <VentesJourPanel societyId={activeSociety.id} convention={ventesConv} onClose={() => setVentesConv(null)}/>}
      {historiqueConv && <HistoriqueConventionPanel societyId={activeSociety.id} convention={historiqueConv} onClose={() => setHistoriqueConv(null)}/>}
    </div>
  )
}
