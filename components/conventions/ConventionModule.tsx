"use client"

import { useEffect, useState, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import { useUserSettings } from "@/lib/UserSettingsContext"
import { Plus, X, Calendar, MapPin, Euro, Package, ShoppingCart, Check, Pencil, Trash2, ChevronRight } from "lucide-react"

interface Props { activeSociety: any; profile: any }

/* ── VENTE CONVENTION PANEL ───────────────── */
function VenteConventionPanel({
  societyId, profile, convention, onClose, onDone
}: { societyId: string; profile: any; convention: any; onClose: () => void; onDone: () => void }) {
  const { settings } = useUserSettings()
  const urssafRate = Number((settings as any).urssaf_rate ?? 0.138)

  const [tab, setTab] = useState<"catalogue" | "libre">("catalogue")
  const [products, setProducts] = useState<any[]>([])
  const [cart, setCart] = useState<{ id: string; nom: string; pv: number; qty: number }[]>([])
  const [paiement, setPaiement] = useState("Espèces")
  const [clientNom, setClientNom] = useState("")
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)

  // Libre mode
  const [libreItems, setLibreItems] = useState([{ produit: "", qty: 1, pv: 0 }])
  const [libreClientNom, setLibreClientNom] = useState("")
  const [librePaiement, setLibrePaiement] = useState("Espèces")

  useEffect(() => {
    supabase.from("products").select("*")
      .eq("society_id", societyId).eq("gamme", "Convention")
      .order("name")
      .then(({ data }) => setProducts(data || []))
  }, [societyId])

  const addToCart = (p: any) => {
    setCart(prev => {
      const ex = prev.find(i => i.id === p.id)
      if (ex) return prev.map(i => i.id === p.id ? { ...i, qty: i.qty + 1 } : i)
      return [...prev, { id: p.id, nom: p.name, pv: Number(p.pv), qty: 1 }]
    })
  }

  const totalCart = cart.reduce((s, i) => s + i.pv * i.qty, 0)
  const totalLibre = libreItems.reduce((s, i) => s + i.pv * i.qty, 0)

  const saveVente = async (items: { nom: string; pv: number; qty: number }[], total: number, client: string, pmt: string) => {
    setSaving(true)
    const { data: vente } = await supabase.from("ventes").insert({
      society_id: societyId,
      user_id: profile.id,
      client_nom: client || "Convention",
      total_ht: total, port: 0, remise: 0, total_ttc: total,
      paiement: pmt,
      notes: `Convention : ${convention.nom}`,
      gamme: "Convention",
    }).select().single()

    if (vente) {
      await supabase.from("vente_items").insert(items.map(i => ({
        vente_id: vente.id,
        produit_nom: i.nom,
        quantite: i.qty,
        pv_unitaire: i.pv,
        cf_unitaire: 0,
        total: i.pv * i.qty,
        gamme: "Convention",
      })))
    }
    setSaving(false)
    setSuccess(true)
    setTimeout(() => { setSuccess(false); setCart([]); setLibreItems([{ produit: "", qty: 1, pv: 0 }]) }, 2000)
    onDone()
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-end z-50">
      <div className="bg-[#111111] border-l border-zinc-800 w-full max-w-lg h-full flex flex-col shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-zinc-800">
          <div>
            <p className="text-[11px] font-bold text-orange-400 uppercase tracking-wider mb-0.5">🎪 {convention.nom}</p>
            <h3 className="text-white font-bold text-base">Nouvelle vente</h3>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white"><X size={18}/></button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-zinc-800">
          {([["catalogue", "📦 Catalogue Convention"], ["libre", "✏️ Vente libre"]] as const).map(([val, lbl]) => (
            <button key={val} onClick={() => setTab(val)}
              className={`flex-1 py-3 text-sm font-semibold transition-colors ${tab===val ? "text-orange-400 border-b-2 border-orange-400" : "text-zinc-500 hover:text-zinc-300"}`}>
              {lbl}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto">
          {tab === "catalogue" ? (
            <div className="p-4 space-y-4">
              {/* Products catalogue */}
              {products.length === 0 ? (
                <div className="text-center py-8 text-zinc-600">
                  <Package size={32} className="mx-auto mb-2 opacity-20"/>
                  <p className="text-sm">Aucun produit dans la gamme "Convention"</p>
                  <p className="text-xs mt-1">Créez des produits avec la gamme Convention dans l'onglet Admin</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {products.map(p => {
                    const inCart = cart.find(i => i.id === p.id)
                    return (
                      <button key={p.id} onClick={() => addToCart(p)}
                        className={`relative text-left rounded-xl border p-3 transition-all ${inCart ? "border-orange-500/50 bg-orange-500/10" : "border-zinc-800 bg-zinc-900 hover:border-orange-500/30"}`}>
                        {inCart && (
                          <span className="absolute top-2 right-2 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center text-[10px] font-black text-black">
                            {inCart.qty}
                          </span>
                        )}
                        <p className="text-white text-sm font-semibold truncate mb-1">{p.name}</p>
                        <p className="text-orange-400 font-bold text-sm">{Number(p.pv).toFixed(2)}€</p>
                      </button>
                    )
                  })}
                </div>
              )}

              {/* Cart */}
              {cart.length > 0 && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-2">
                  {cart.map(item => (
                    <div key={item.id} className="flex items-center gap-2">
                      <span className="text-zinc-300 text-sm flex-1 truncate">{item.nom}</span>
                      <div className="flex items-center gap-1 bg-zinc-800 rounded-lg px-2 py-1">
                        <button onClick={() => setCart(prev => prev.map(i => i.id===item.id ? {...i, qty: Math.max(1,i.qty-1)} : i))} className="text-zinc-400 hover:text-white w-4">-</button>
                        <span className="text-white text-sm w-4 text-center">{item.qty}</span>
                        <button onClick={() => setCart(prev => prev.map(i => i.id===item.id ? {...i, qty: i.qty+1} : i))} className="text-zinc-400 hover:text-white w-4">+</button>
                      </div>
                      <span className="text-orange-400 text-sm font-bold w-16 text-right">{(item.pv*item.qty).toFixed(2)}€</span>
                      <button onClick={() => setCart(prev => prev.filter(i => i.id !== item.id))} className="text-red-500 hover:text-red-400"><X size={13}/></button>
                    </div>
                  ))}
                </div>
              )}

              {cart.length > 0 && (
                <div className="space-y-3">
                  <input value={clientNom} onChange={e => setClientNom(e.target.value)}
                    placeholder="Nom du client (optionnel)"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none"/>
                  <div className="flex gap-1.5 flex-wrap">
                    {["Espèces","Carte Bancaire","Virement","Chèque"].map(p => (
                      <button key={p} onClick={() => setPaiement(p)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${paiement===p ? "bg-orange-500 text-black border-orange-500" : "bg-zinc-800 text-zinc-400 border-zinc-700"}`}>
                        {p}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center justify-between bg-zinc-900 rounded-xl px-4 py-3">
                    <span className="text-zinc-400 text-sm">Total</span>
                    <span className="text-orange-400 text-xl font-black">{totalCart.toFixed(2)}€</span>
                  </div>
                  <button
                    onClick={() => saveVente(cart.map(i => ({ nom: i.nom, pv: i.pv, qty: i.qty })), totalCart, clientNom, paiement)}
                    disabled={saving || success}
                    className={`w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${success ? "bg-green-500 text-white" : "bg-orange-500 hover:bg-orange-400 text-black disabled:opacity-40"}`}>
                    {success ? <><Check size={16}/> Enregistrée !</> : saving ? "..." : <><ShoppingCart size={15}/> Valider {totalCart.toFixed(2)}€</>}
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Vente libre */
            <div className="p-4 space-y-4">
              <p className="text-zinc-500 text-xs">Sélectionne un produit de la gamme Particuliers avec un tarif personnalisé</p>
              <div className="space-y-2">
                {libreItems.map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input value={item.produit} onChange={e => setLibreItems(prev => prev.map((p,j)=>j===i?{...p,produit:e.target.value}:p))}
                      placeholder="Produit" className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"/>
                    <input type="number" min="1" value={item.qty} onChange={e => setLibreItems(prev => prev.map((p,j)=>j===i?{...p,qty:parseInt(e.target.value)||1}:p))}
                      className="w-14 bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-2 text-sm text-white text-center focus:outline-none"/>
                    <input type="number" min="0" step="0.01" value={item.pv} onChange={e => setLibreItems(prev => prev.map((p,j)=>j===i?{...p,pv:parseFloat(e.target.value)||0}:p))}
                      placeholder="Prix" className="w-20 bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-2 text-sm text-white text-center focus:outline-none"/>
                    <button onClick={() => setLibreItems(prev => prev.filter((_,j)=>j!==i))} className="text-red-500 hover:text-red-400"><X size={13}/></button>
                  </div>
                ))}
                <button onClick={() => setLibreItems(prev => [...prev, { produit:"", qty:1, pv:0 }])}
                  className="flex items-center gap-1 text-xs text-orange-400 hover:text-orange-300 font-semibold">
                  <Plus size={12}/> Ajouter un article
                </button>
              </div>

              {libreItems.some(i => i.produit.trim() && i.pv > 0) && (
                <div className="space-y-3">
                  <input value={libreClientNom} onChange={e => setLibreClientNom(e.target.value)}
                    placeholder="Nom du client (optionnel)"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none"/>
                  <div className="flex gap-1.5 flex-wrap">
                    {["Espèces","Carte Bancaire","Virement","Chèque"].map(p => (
                      <button key={p} onClick={() => setLibrePaiement(p)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${librePaiement===p ? "bg-orange-500 text-black border-orange-500" : "bg-zinc-800 text-zinc-400 border-zinc-700"}`}>{p}</button>
                    ))}
                  </div>
                  <div className="flex items-center justify-between bg-zinc-900 rounded-xl px-4 py-3">
                    <span className="text-zinc-400 text-sm">Total</span>
                    <span className="text-orange-400 text-xl font-black">{totalLibre.toFixed(2)}€</span>
                  </div>
                  <button
                    onClick={() => saveVente(
                      libreItems.filter(i => i.produit.trim() && i.pv > 0).map(i => ({ nom: i.produit, pv: i.pv, qty: i.qty })),
                      totalLibre, libreClientNom, librePaiement
                    )}
                    disabled={saving || success}
                    className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 ${success ? "bg-green-500 text-white" : "bg-orange-500 hover:bg-orange-400 text-black disabled:opacity-40"}`}>
                    {success ? <><Check size={16}/> Enregistrée !</> : <><ShoppingCart size={15}/> Valider {totalLibre.toFixed(2)}€</>}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── FORM CONVENTION ──────────────────────── */
function ConventionForm({ societyId, profile, convention, onClose, onDone }: { societyId: string; profile: any; convention?: any; onClose: () => void; onDone: () => void }) {
  const [nom, setNom]           = useState(convention?.nom || "")
  const [lieu, setLieu]         = useState(convention?.lieu || "")
  const [dateDebut, setDateDebut] = useState(convention?.date_debut || "")
  const [dateFin, setDateFin]   = useState(convention?.date_fin || "")
  const [budget, setBudget]     = useState(String(convention?.budget || ""))
  const [notes, setNotes]       = useState(convention?.notes || "")
  const [saving, setSaving]     = useState(false)

  const save = async () => {
    if (!nom.trim() || !dateDebut || !dateFin) return
    setSaving(true)
    const data = {
      society_id: societyId, user_id: profile.id,
      nom, lieu, date_debut: dateDebut, date_fin: dateFin,
      budget: parseFloat(budget) || 0, notes,
      statut: "planifiee",
    }
    if (convention?.id) await supabase.from("conventions").update(data).eq("id", convention.id)
    else await supabase.from("conventions").insert(data)
    setSaving(false); onDone(); onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-end z-50">
      <div className="bg-[#111111] border-l border-zinc-800 w-full max-w-sm h-full flex flex-col shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <h3 className="text-base font-bold text-white">{convention ? "Modifier" : "Nouvelle"} convention</h3>
          <button onClick={onClose} className="text-zinc-500 hover:text-white"><X size={18}/></button>
        </div>
        <div className="flex-1 p-6 space-y-4 overflow-y-auto">
          {[
            { label: "Nom de la convention", value: nom, set: setNom, placeholder: "Ex: Japan Expo 2025" },
            { label: "Lieu", value: lieu, set: setLieu, placeholder: "Ex: Paris Le Bourget, Hall 5" },
            { label: "Budget (€)", value: budget, set: setBudget, placeholder: "0", type: "number" },
          ].map(({ label, value, set, placeholder, type = "text" }) => (
            <div key={label}>
              <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">{label}</label>
              <input type={type} value={value} onChange={e => set(e.target.value)} placeholder={placeholder}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-orange-500/60"/>
            </div>
          ))}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Date début", value: dateDebut, set: setDateDebut },
              { label: "Date fin", value: dateFin, set: setDateFin },
            ].map(({ label, value, set }) => (
              <div key={label}>
                <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">{label}</label>
                <input type="date" value={value} onChange={e => set(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500/60"/>
              </div>
            ))}
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none resize-none"/>
          </div>
        </div>
        <div className="p-6 border-t border-zinc-800 space-y-3">
          <button onClick={save} disabled={saving || !nom.trim() || !dateDebut || !dateFin}
            className="w-full bg-orange-500 hover:bg-orange-400 disabled:opacity-40 text-black font-bold py-3 rounded-xl text-sm">
            {saving ? "Sauvegarde..." : convention ? "Modifier" : "Créer la convention"}
          </button>
          <button onClick={onClose} className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold py-2.5 rounded-xl text-sm">Annuler</button>
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════
   MAIN
══════════════════════════════════════════════ */
export default function ConventionModule({ activeSociety, profile }: Props) {
  const [conventions, setConventions]   = useState<any[]>([])
  const [loading, setLoading]           = useState(true)
  const [showForm, setShowForm]         = useState(false)
  const [editConv, setEditConv]         = useState<any>(null)
  const [venteConv, setVenteConv]       = useState<any>(null)
  const [filter, setFilter]             = useState<"all" | "active" | "upcoming" | "past">("all")

  const load = useCallback(async () => {
    if (!activeSociety?.id) return
    setLoading(true)
    const { data } = await supabase.from("conventions")
      .select("*")
      .eq("society_id", activeSociety.id)
      .order("date_debut", { ascending: false })
    setConventions(data || [])
    setLoading(false)
  }, [activeSociety?.id])

  useEffect(() => { load() }, [load])

  const deleteConvention = async (id: string) => {
    if (!confirm("Supprimer cette convention ?")) return
    await supabase.from("conventions").delete().eq("id", id)
    load()
  }

  const todayStr = new Date().toISOString().split("T")[0]

  const filtered = conventions.filter(c => {
    if (filter === "active")   return c.date_debut <= todayStr && c.date_fin >= todayStr
    if (filter === "upcoming") return c.date_debut > todayStr
    if (filter === "past")     return c.date_fin < todayStr
    return true
  })

  const activeNow = conventions.find(c => c.date_debut <= todayStr && c.date_fin >= todayStr)

  return (
    <div className="flex-1 overflow-y-auto bg-[#0a0a0a]">
      <div className="p-6 max-w-4xl mx-auto">

        {/* Header */}
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

        {/* Active convention banner */}
        {activeNow && (
          <div className="mb-6 bg-orange-500/10 border border-orange-500/30 rounded-2xl p-5">
            <div className="flex items-start justify-between">
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
              <button onClick={() => setVenteConv(activeNow)}
                className="flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-black font-bold px-4 py-2.5 rounded-xl text-sm shrink-0">
                <ShoppingCart size={15}/> Vendre
              </button>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex gap-2 mb-5 flex-wrap">
          {[
            { id: "all",      label: "Toutes" },
            { id: "active",   label: "🟢 En cours" },
            { id: "upcoming", label: "🔵 À venir" },
            { id: "past",     label: "⚫ Passées" },
          ].map(f => (
            <button key={f.id} onClick={() => setFilter(f.id as any)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-colors ${filter===f.id ? "bg-orange-500 text-black border-orange-500" : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-600"}`}>
              {f.label}
            </button>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"/>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24 text-zinc-600">
            <p className="text-5xl mb-4">🎪</p>
            <p className="text-sm">Aucune convention</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map(c => {
              const isActive   = c.date_debut <= todayStr && c.date_fin >= todayStr
              const isUpcoming = c.date_debut > todayStr
              const isPast     = c.date_fin < todayStr

              const daysUntil = isUpcoming
                ? Math.ceil((new Date(c.date_debut).getTime() - Date.now()) / 86400000)
                : 0
              const duration = Math.ceil(
                (new Date(c.date_fin+"T00:00:00").getTime() - new Date(c.date_debut+"T00:00:00").getTime()) / 86400000
              ) + 1

              return (
                <div key={c.id} className={`bg-zinc-900 border rounded-2xl p-5 ${isActive ? "border-orange-500/40" : "border-zinc-800"}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-white font-bold">{c.nom}</h3>
                        {isActive && <span className="text-[10px] font-bold text-orange-400 bg-orange-400/10 border border-orange-400/20 px-1.5 py-0.5 rounded-full animate-pulse">En cours</span>}
                        {isUpcoming && <span className="text-[10px] font-bold text-blue-400 bg-blue-400/10 border border-blue-400/20 px-1.5 py-0.5 rounded-full">J-{daysUntil}</span>}
                        {isPast && <span className="text-[10px] font-bold text-zinc-500 bg-zinc-800 border border-zinc-700 px-1.5 py-0.5 rounded-full">Terminée</span>}
                      </div>
                      {c.lieu && <p className="text-zinc-500 text-xs">📍 {c.lieu}</p>}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {isActive && (
                        <button onClick={() => setVenteConv(c)}
                          className="flex items-center gap-1 text-[11px] font-bold text-orange-400 bg-orange-400/10 border border-orange-400/20 px-2 py-1.5 rounded-lg hover:bg-orange-400/20">
                          <ShoppingCart size={11}/> Vendre
                        </button>
                      )}
                      <button onClick={() => { setEditConv(c); setShowForm(true) }}
                        className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800">
                        <Pencil size={13}/>
                      </button>
                      <button onClick={() => deleteConvention(c.id)}
                        className="p-1.5 text-red-500 hover:text-red-400 rounded-lg hover:bg-red-500/10">
                        <Trash2 size={13}/>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-zinc-800 rounded-xl px-3 py-2">
                      <p className="text-zinc-500 text-[10px] uppercase tracking-wider mb-0.5">Début</p>
                      <p className="text-white font-semibold text-xs">{new Date(c.date_debut+"T00:00:00").toLocaleDateString("fr-FR", { weekday:"short", day:"numeric", month:"short" })}</p>
                    </div>
                    <div className="bg-zinc-800 rounded-xl px-3 py-2">
                      <p className="text-zinc-500 text-[10px] uppercase tracking-wider mb-0.5">Fin</p>
                      <p className="text-white font-semibold text-xs">{new Date(c.date_fin+"T00:00:00").toLocaleDateString("fr-FR", { weekday:"short", day:"numeric", month:"short" })}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mt-3 text-xs text-zinc-500">
                    <span>📅 {duration} jour{duration>1?"s":""}</span>
                    {c.budget > 0 && <span>💰 Budget : {c.budget.toFixed(2)}€</span>}
                    {c.notes && <span className="italic truncate">{c.notes}</span>}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {showForm && (
        <ConventionForm
          societyId={activeSociety.id} profile={profile}
          convention={editConv}
          onClose={() => { setShowForm(false); setEditConv(null) }}
          onDone={load}
        />
      )}
      {venteConv && (
        <VenteConventionPanel
          societyId={activeSociety.id} profile={profile}
          convention={venteConv}
          onClose={() => setVenteConv(null)}
          onDone={load}
        />
      )}
    </div>
  )
}