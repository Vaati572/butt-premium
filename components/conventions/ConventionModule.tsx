"use client"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Plus, X, ChevronLeft, Trash2, FileText, Package, Clock, Calendar } from "lucide-react"

interface Convention {
  id: string; nom: string; lieu: string
  date_debut: string; date_fin: string
  statut: string; notes: string; created_at: string
}
interface ConventionVente {
  id: string; convention_id: string
  produit_nom: string; produit_id: string | null
  client_nom: string
  quantite: number; prix_unitaire: number; cout_fab: number
  jour: string; heure: string; paiement: string; created_at: string
}
interface Product { id: string; name: string; pv: number; cf: number; gamme: string }
interface Props { activeSociety: any; profile: any }

const JOURS = ["Vendredi", "Samedi", "Dimanche"]

const JOUR_COLORS: Record<string, string> = {
  Vendredi:  "#3b82f6",
  Samedi:    "#a855f7",
  Dimanche:  "#f97316",
}

const PAIEMENTS = [
  { id: "especes", label: "Espèces", icon: "💵" },
  { id: "cb", label: "CB", icon: "💳" },
  { id: "virement", label: "Virement", icon: "🏦" },
  { id: "cheque", label: "Chèque", icon: "📝" },
  { id: "mixte", label: "Mixte", icon: "🔀" },
]

export default function ConventionModule({ activeSociety, profile }: Props) {
  const [view, setView] = useState<"list" | "detail" | "rapport">("list")
  const [conventions, setConventions] = useState<Convention[]>([])
  const [selected, setSelected] = useState<Convention | null>(null)
  const [ventes, setVentes] = useState<ConventionVente[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  // Formulaire convention
  const [showConvForm, setShowConvForm] = useState(false)
  const [convForm, setConvForm] = useState({ nom: "", lieu: "", date_debut: "", date_fin: "", notes: "" })
  const [savingConv, setSavingConv] = useState(false)

  // Formulaire vente (panier multi-produits)
  const [showVenteForm, setShowVenteForm] = useState(false)
  const [panier, setPanier] = useState<Array<{
    produit_nom: string; produit_id: string
    prix_unitaire: string; cout_fab: string; quantite: number
  }>>([])
  const [venteGlobal, setVenteGlobal] = useState({ client_nom: "", jour: "Vendredi", heure: "", paiement: "especes" })
  const [editVente, setEditVente] = useState<ConventionVente | null>(null)
  const [editForm, setEditForm] = useState({ produit_nom: "", client_nom: "", quantite: 1, prix_unitaire: "", cout_fab: "", jour: "Vendredi", heure: "", paiement: "especes" })
  const [savingVente, setSavingVente] = useState(false)
  const [searchProd, setSearchProd] = useState("")
  const [panierSearch, setPanierSearch] = useState("")

  useEffect(() => { loadConventions() }, [activeSociety])
  useEffect(() => { loadProducts() }, [activeSociety])
  useEffect(() => { if (selected) loadVentes(selected.id) }, [selected])

  const loadConventions = async () => {
    setLoading(true)
    const { data } = await supabase.from("conventions")
      .select("*").eq("society_id", activeSociety.id)
      .order("date_debut", { ascending: false })
    setConventions(data || [])
    setLoading(false)
  }

  const loadProducts = async () => {
    const { data } = await supabase.from("products")
      .select("id, name, pv, cf, gamme")
      .eq("society_id", activeSociety.id).order("name")
    setProducts(data || [])
  }

  const loadVentes = async (convId: string) => {
    const { data } = await supabase.from("convention_ventes")
      .select("*").eq("convention_id", convId)
      .order("jour").order("heure")
    setVentes(data || [])
  }

  const saveConvention = async () => {
    if (!convForm.nom.trim() || !convForm.date_debut || !convForm.date_fin) return
    setSavingConv(true)
    const { error } = await supabase.from("conventions").insert({
      ...convForm, society_id: activeSociety.id, user_id: profile.id, statut: "en_cours"
    })
    if (error) { alert("Erreur: " + error.message); setSavingConv(false); return }
    setSavingConv(false)
    setShowConvForm(false)
    setConvForm({ nom: "", lieu: "", date_debut: "", date_fin: "", notes: "" })
    loadConventions()
  }

  const terminerConvention = async (id: string) => {
    if (!confirm("Marquer cette convention comme terminée ?")) return
    await supabase.from("conventions").update({ statut: "terminee" }).eq("id", id)
    loadConventions()
    if (selected?.id === id) setSelected(prev => prev ? { ...prev, statut: "terminee" } : prev)
  }

  const deleteConvention = async (id: string) => {
    if (!confirm("Supprimer cette convention et toutes ses ventes ?")) return
    await supabase.from("conventions").delete().eq("id", id)
    loadConventions()
    if (selected?.id === id) { setSelected(null); setView("list") }
  }

  const addToCart = (p: Product) => {
    setPanier(prev => {
      const existing = prev.findIndex(x => x.produit_id === p.id)
      if (existing >= 0) {
        const next = [...prev]
        next[existing] = { ...next[existing], quantite: next[existing].quantite + 1 }
        return next
      }
      return [...prev, { produit_nom: p.name, produit_id: p.id, prix_unitaire: String(p.pv), cout_fab: String(p.cf), quantite: 1 }]
    })
    setPanierSearch("")
    setSearchProd("")
  }

  const updateCartQty = (idx: number, delta: number) => {
    setPanier(prev => {
      const next = [...prev]
      const nq = next[idx].quantite + delta
      if (nq <= 0) return prev.filter((_, i) => i !== idx)
      next[idx] = { ...next[idx], quantite: nq }
      return next
    })
  }

  const removeFromCart = (idx: number) => setPanier(prev => prev.filter((_, i) => i !== idx))

  const saveVente = async () => {
    if (!selected || panier.length === 0) return
    setSavingVente(true)
    const rows = panier.map(item => ({
      convention_id: selected.id,
      society_id: activeSociety.id,
      produit_nom: item.produit_nom,
      produit_id: item.produit_id || null,
      client_nom: venteGlobal.client_nom || "",
      quantite: Number(item.quantite),
      prix_unitaire: Number(item.prix_unitaire),
      cout_fab: Number(item.cout_fab) || 0,
      jour: venteGlobal.jour,
      heure: venteGlobal.heure,
      paiement: venteGlobal.paiement,
    }))
    const { error } = await supabase.from("convention_ventes").insert(rows)
    if (error) { alert("Erreur: " + error.message); setSavingVente(false); return }
    setSavingVente(false)
    setShowVenteForm(false)
    setPanier([])
    setVenteGlobal({ client_nom: "", jour: "Vendredi", heure: "", paiement: "especes" })
    setSearchProd(""); setPanierSearch("")
    loadVentes(selected.id)
  }

  const deleteVente = async (id: string) => {
    await supabase.from("convention_ventes").delete().eq("id", id)
    if (selected) loadVentes(selected.id)
  }

  const openEdit = (v: ConventionVente) => {
    setEditVente(v)
    setEditForm({
      produit_nom: v.produit_nom, client_nom: v.client_nom || "",
      quantite: v.quantite, prix_unitaire: String(v.prix_unitaire),
      cout_fab: String(v.cout_fab), jour: v.jour, heure: v.heure || "",
      paiement: v.paiement || "especes"
    })
  }

  const saveEdit = async () => {
    if (!editVente) return
    const { error } = await supabase.from("convention_ventes").update({
      produit_nom: editForm.produit_nom,
      client_nom: editForm.client_nom,
      quantite: Number(editForm.quantite),
      prix_unitaire: Number(editForm.prix_unitaire),
      cout_fab: Number(editForm.cout_fab) || 0,
      jour: editForm.jour,
      heure: editForm.heure,
      paiement: editForm.paiement,
    }).eq("id", editVente.id)
    if (error) { alert("Erreur: " + error.message); return }
    setEditVente(null)
    if (selected) loadVentes(selected.id)
  }

  // Calculs totaux
  const totalBrut = ventes.reduce((s, v) => s + v.prix_unitaire * v.quantite, 0)
  const totalCF = ventes.reduce((s, v) => s + v.cout_fab * v.quantite, 0)
  const totalMarge = totalBrut - totalCF
  const totalQty = ventes.reduce((s, v) => s + v.quantite, 0)
  const urssaf = totalBrut * 0.138
  const beneficeNet = totalBrut - urssaf - totalCF

  // Par jour
  const parJour = JOURS.map(jour => {
    const lignes = ventes.filter(v => v.jour === jour)
    return {
      jour,
      brut: lignes.reduce((s, v) => s + v.prix_unitaire * v.quantite, 0),
      cf: lignes.reduce((s, v) => s + v.cout_fab * v.quantite, 0),
      qty: lignes.reduce((s, v) => s + v.quantite, 0),
      lignes
    }
  })

  // Par produit
  const parProduit = Object.values(
    ventes.reduce((acc, v) => {
      const key = v.produit_nom
      if (!acc[key]) acc[key] = { nom: key, qty: 0, brut: 0, cf: 0 }
      acc[key].qty += v.quantite
      acc[key].brut += v.prix_unitaire * v.quantite
      acc[key].cf += v.cout_fab * v.quantite
      return acc
    }, {} as Record<string, { nom: string; qty: number; brut: number; cf: number }>)
  ).sort((a, b) => b.brut - a.brut)

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(panierSearch.toLowerCase())
  ).slice(0, 8)

  const formatDate = (d: string) => d ? new Date(d + "T00:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" }) : ""

  // ═══ LISTE DES CONVENTIONS ═══
  if (view === "list") return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#0a0a0a]">
      <div className="px-6 py-4 border-b border-zinc-900 flex items-center justify-between">
        <div>
          <h1 className="text-white font-bold text-xl">🎪 Conventions</h1>
          <p className="text-zinc-500 text-xs mt-0.5">{conventions.length} convention{conventions.length > 1 ? "s" : ""}</p>
        </div>
        <button onClick={() => setShowConvForm(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-black text-sm font-bold"
          style={{ backgroundColor: "#eab308" }}>
          <Plus size={14} /> Nouvelle convention
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-6 h-6 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : conventions.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-5xl mb-4">🎪</p>
            <p className="text-zinc-400 font-bold text-lg">Aucune convention</p>
            <p className="text-zinc-600 text-sm mt-2">Créez votre première convention pour commencer le suivi</p>
          </div>
        ) : (
          <div className="space-y-3 max-w-2xl mx-auto">
            {conventions.map(c => {
              const isActive = c.statut === "en_cours"
              return (
                <div key={c.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 hover:border-zinc-700 transition-all">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-white font-bold truncate">{c.nom}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isActive ? "bg-green-500/20 text-green-400" : "bg-zinc-700 text-zinc-400"}`}>
                          {isActive ? "● En cours" : "✓ Terminée"}
                        </span>
                      </div>
                      {c.lieu && <p className="text-zinc-500 text-xs mb-1">📍 {c.lieu}</p>}
                      <p className="text-zinc-600 text-xs">
                        📅 {formatDate(c.date_debut)} → {formatDate(c.date_fin)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button onClick={() => { setSelected(c); setView("detail") }}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-yellow-500 hover:bg-yellow-400 text-black transition-colors">
                        {isActive ? "Saisir ventes" : "Voir détail"}
                      </button>
                      <button onClick={() => { setSelected(c); loadVentes(c.id); setView("rapport") }}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors">
                        <FileText size={12} /> Rapport
                      </button>
                      <button onClick={() => deleteConvention(c.id)}
                        className="w-8 h-8 rounded-lg bg-red-500/10 hover:bg-red-500/20 flex items-center justify-center text-red-400 transition-colors">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal création convention */}
      {showConvForm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111111] border border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-zinc-800">
              <h2 className="text-white font-bold">Nouvelle convention</h2>
              <button onClick={() => setShowConvForm(false)} className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white">
                <X size={14} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-zinc-500 text-[11px] uppercase tracking-wider mb-1.5">Nom de la convention <span className="text-red-400">*</span></label>
                <input value={convForm.nom} onChange={e => setConvForm(f => ({ ...f, nom: e.target.value }))}
                  placeholder="Ex: Convention Paris 2026"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-500/60" />
              </div>
              <div>
                <label className="block text-zinc-500 text-[11px] uppercase tracking-wider mb-1.5">Lieu</label>
                <input value={convForm.lieu} onChange={e => setConvForm(f => ({ ...f, lieu: e.target.value }))}
                  placeholder="Ex: Parc des Expositions, Hall 3"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-500/60" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-500 text-[11px] uppercase tracking-wider mb-1.5">Début (Vendredi) <span className="text-red-400">*</span></label>
                  <input type="date" value={convForm.date_debut} onChange={e => setConvForm(f => ({ ...f, date_debut: e.target.value }))}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-500/60" />
                </div>
                <div>
                  <label className="block text-zinc-500 text-[11px] uppercase tracking-wider mb-1.5">Fin (Dimanche) <span className="text-red-400">*</span></label>
                  <input type="date" value={convForm.date_fin} onChange={e => setConvForm(f => ({ ...f, date_fin: e.target.value }))}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-500/60" />
                </div>
              </div>
              <div>
                <label className="block text-zinc-500 text-[11px] uppercase tracking-wider mb-1.5">Notes</label>
                <textarea value={convForm.notes} onChange={e => setConvForm(f => ({ ...f, notes: e.target.value }))}
                  rows={2} placeholder="Infos utiles..."
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-500/60 resize-none" />
              </div>
              <button onClick={saveConvention} disabled={savingConv || !convForm.nom.trim() || !convForm.date_debut || !convForm.date_fin}
                className="w-full py-3 rounded-xl text-black font-bold text-sm bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 transition-colors">
                {savingConv ? "Création..." : "Créer la convention"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  // ═══ DÉTAIL / SAISIE VENTES ═══
  if (view === "detail" && selected) return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#0a0a0a]">
      {/* Header */}
      <div className="px-6 py-4 border-b border-zinc-900">
        <div className="flex items-center gap-3 mb-1">
          <button onClick={() => setView("list")} className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white transition-colors">
            <ChevronLeft size={16} />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-white font-bold text-lg truncate">{selected.nom}</h1>
            {selected.lieu && <p className="text-zinc-500 text-xs">{selected.lieu}</p>}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={() => setView("rapport")}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors">
              <FileText size={12} /> Rapport
            </button>
            {selected.statut === "en_cours" && (
              <button onClick={() => terminerConvention(selected.id)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-green-500/20 hover:bg-green-500/30 text-green-400 transition-colors">
                ✓ Terminer
              </button>
            )}
          </div>
        </div>

        {/* Totaux rapides */}
        <div className="grid grid-cols-3 gap-2 mt-3">
          {[
            { label: "CA Brut", value: `${totalBrut.toFixed(2)}€`, color: "#eab308" },
            { label: "Coût fab.", value: `${totalCF.toFixed(2)}€`, color: "#ef4444" },
            { label: "Marge brute", value: `${totalMarge.toFixed(2)}€`, color: "#22c55e" },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-zinc-900 rounded-xl p-2.5 text-center">
              <p className="font-bold text-sm" style={{ color }}>{value}</p>
              <p className="text-zinc-600 text-[10px] mt-0.5">{label}</p>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-2 mt-2">
          <div className="bg-zinc-900 rounded-xl p-2.5 text-center">
            <p className="font-bold text-sm text-orange-400">-{urssaf.toFixed(2)}€</p>
            <p className="text-zinc-600 text-[10px] mt-0.5">URSSAF 13.8%</p>
          </div>
          <div className="col-span-2 bg-zinc-900 rounded-xl p-2.5 text-center" style={{ borderColor: beneficeNet >= 0 ? "#22c55e40" : "#ef444440", border: "1px solid" }}>
            <p className="font-bold text-base" style={{ color: beneficeNet >= 0 ? "#22c55e" : "#ef4444" }}>{beneficeNet.toFixed(2)}€</p>
            <p className="text-zinc-500 text-[10px] mt-0.5 font-semibold">✦ Bénéfice net</p>
          </div>
        </div>
      </div>

      {/* Bouton ajouter */}
      <div className="px-6 py-3 border-b border-zinc-900 flex items-center justify-between">
        <p className="text-zinc-500 text-xs">{ventes.length} vente{ventes.length > 1 ? "s" : ""} saisie{ventes.length > 1 ? "s" : ""}</p>
        {selected.statut === "en_cours" && (
          <button onClick={() => setShowVenteForm(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-black text-sm font-bold"
            style={{ backgroundColor: "#eab308" }}>
            <Plus size={14} /> Ajouter une vente
          </button>
        )}
      </div>

      {/* Liste ventes par jour */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {JOURS.map(jour => {
          const lignes = ventes.filter(v => v.jour === jour)
          if (lignes.length === 0) return null
          const jourBrut = lignes.reduce((s, v) => s + v.prix_unitaire * v.quantite, 0)
          return (
            <div key={jour}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: JOUR_COLORS[jour] }} />
                  <h3 className="text-white font-bold">{jour}</h3>
                  <span className="text-zinc-600 text-xs">({lignes.length} vente{lignes.length > 1 ? "s" : ""})</span>
                </div>
                <span className="font-bold text-sm" style={{ color: JOUR_COLORS[jour] }}>{jourBrut.toFixed(2)}€</span>
              </div>
              <div className="space-y-2">
                {lignes.map(v => (
                  <div key={v.id} className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 flex items-center gap-3 group hover:border-zinc-700 transition-all">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-white font-semibold text-sm truncate">{v.produit_nom}</span>
                        {v.client_nom && (
                          <span className="text-blue-400 text-xs shrink-0">👤 {v.client_nom}</span>
                        )}
                        {v.heure && (
                          <span className="text-zinc-500 text-xs flex items-center gap-1 shrink-0">
                            <Clock size={10} />{v.heure}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-zinc-500 text-xs">x{v.quantite}</span>
                        <span className="text-zinc-500 text-xs">{v.prix_unitaire.toFixed(2)}€/u</span>
                        {v.cout_fab > 0 && <span className="text-red-400/60 text-xs">CF: {v.cout_fab.toFixed(2)}€/u</span>}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-yellow-400 font-bold text-sm">{(v.prix_unitaire * v.quantite).toFixed(2)}€</p>
                      {v.cout_fab > 0 && (
                        <p className="text-green-400 text-xs">+{((v.prix_unitaire - v.cout_fab) * v.quantite).toFixed(2)}€</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {v.paiement && (
                        <span className="text-[10px] text-zinc-600">
                          {PAIEMENTS.find(p => p.id === v.paiement)?.icon}
                        </span>
                      )}
                      {selected.statut === "en_cours" && (
                        <>
                          <button onClick={() => openEdit(v)}
                            className="w-7 h-7 rounded-lg bg-zinc-700/50 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white opacity-0 group-hover:opacity-100 transition-all">
                            ✏️
                          </button>
                          <button onClick={() => deleteVente(v.id)}
                            className="w-7 h-7 rounded-lg bg-red-500/10 hover:bg-red-500/20 flex items-center justify-center text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                            <Trash2 size={11} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
        {ventes.length === 0 && (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">📋</p>
            <p className="text-zinc-500">Aucune vente saisie</p>
            <p className="text-zinc-700 text-sm mt-1">Cliquez sur "Ajouter une vente" pour commencer</p>
          </div>
        )}
      </div>

      {/* Modal saisie vente — PANIER MULTI-PRODUITS */}
      {showVenteForm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111111] border border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl max-h-[92vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-zinc-800 shrink-0">
              <div>
                <h2 className="text-white font-bold">Nouvelle vente</h2>
                {panier.length > 0 && (
                  <p className="text-yellow-400 text-xs mt-0.5">
                    {panier.reduce((s, i) => s + i.quantite, 0)} produit{panier.reduce((s, i) => s + i.quantite, 0) > 1 ? "s" : ""} —{" "}
                    {panier.reduce((s, i) => s + Number(i.prix_unitaire) * i.quantite, 0).toFixed(2)}€
                  </p>
                )}
              </div>
              <button onClick={() => { setShowVenteForm(false); setPanier([]); setPanierSearch(""); setVenteGlobal({ client_nom: "", jour: "Vendredi", heure: "" }) }}
                className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white">
                <X size={14} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">

              {/* Recherche produit */}
              <div>
                <label className="block text-zinc-500 text-[11px] uppercase tracking-wider mb-1.5">Ajouter un produit</label>
                <input value={panierSearch} onChange={e => setPanierSearch(e.target.value)}
                  placeholder="Rechercher dans le catalogue..."
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-500/60" />
                {panierSearch && filteredProducts.length > 0 && (
                  <div className="mt-1.5 bg-zinc-800 border border-zinc-700 rounded-xl overflow-hidden">
                    {filteredProducts.map(p => (
                      <button key={p.id} onClick={() => addToCart(p)}
                        className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-zinc-700 active:bg-yellow-500/20 transition-colors text-left border-b border-zinc-700 last:border-0">
                        <div>
                          <p className="text-white text-sm font-medium">{p.name}</p>
                          <p className="text-zinc-500 text-xs">{p.gamme}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-yellow-400 text-sm font-bold">{p.pv.toFixed(2)}€</p>
                          <p className="text-zinc-500 text-xs">+ Ajouter</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Panier */}
              {panier.length > 0 && (
                <div>
                  <label className="block text-zinc-500 text-[11px] uppercase tracking-wider mb-2">🛒 Panier ({panier.length} produit{panier.length > 1 ? "s" : ""})</label>
                  <div className="space-y-2">
                    {panier.map((item, idx) => (
                      <div key={idx} className="bg-zinc-800/80 border border-zinc-700 rounded-xl px-3 py-2.5 flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-semibold truncate">{item.produit_nom}</p>
                          <p className="text-zinc-500 text-xs">{Number(item.prix_unitaire).toFixed(2)}€/u · CF: {Number(item.cout_fab).toFixed(2)}€</p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button onClick={() => updateCartQty(idx, -1)}
                            className="w-7 h-7 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-white font-bold flex items-center justify-center text-sm">−</button>
                          <span className="text-white font-bold text-sm w-6 text-center">{item.quantite}</span>
                          <button onClick={() => updateCartQty(idx, 1)}
                            className="w-7 h-7 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-white font-bold flex items-center justify-center text-sm">+</button>
                        </div>
                        <div className="text-right shrink-0 min-w-[52px]">
                          <p className="text-yellow-400 font-bold text-sm">{(Number(item.prix_unitaire) * item.quantite).toFixed(2)}€</p>
                        </div>
                        <button onClick={() => removeFromCart(idx)}
                          className="w-6 h-6 rounded-lg bg-red-500/10 hover:bg-red-500/20 flex items-center justify-center text-red-400 shrink-0">
                          <X size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Client + Jour + Heure */}
              <div>
                <label className="block text-zinc-500 text-[11px] uppercase tracking-wider mb-1.5">Nom du client (optionnel)</label>
                <input value={venteGlobal.client_nom} onChange={e => setVenteGlobal(f => ({ ...f, client_nom: e.target.value }))}
                  placeholder="Ex: Jean Dupont, Stand B12..."
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-500/60" />
              </div>

              <div>
                <label className="block text-zinc-500 text-[11px] uppercase tracking-wider mb-2">Jour</label>
                <div className="grid grid-cols-3 gap-2">
                  {JOURS.map(j => (
                    <button key={j} onClick={() => setVenteGlobal(f => ({ ...f, jour: j }))}
                      className="py-2.5 rounded-xl text-sm font-bold border transition-all"
                      style={venteGlobal.jour === j
                        ? { backgroundColor: JOUR_COLORS[j] + "25", color: JOUR_COLORS[j], borderColor: JOUR_COLORS[j] + "60" }
                        : { backgroundColor: "#18181b", color: "#71717a", borderColor: "#3f3f46" }}>
                      {j}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-zinc-500 text-[11px] uppercase tracking-wider mb-1.5">Heure (optionnel)</label>
                <input type="time" value={venteGlobal.heure} onChange={e => setVenteGlobal(f => ({ ...f, heure: e.target.value }))}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-500/60" />
              </div>

              <div>
                <label className="block text-zinc-500 text-[11px] uppercase tracking-wider mb-2">Paiement</label>
                <div className="grid grid-cols-5 gap-1.5">
                  {PAIEMENTS.map(p => (
                    <button key={p.id} onClick={() => setVenteGlobal(f => ({ ...f, paiement: p.id }))}
                      className="flex flex-col items-center gap-1 py-2 rounded-xl text-xs font-bold border transition-all"
                      style={venteGlobal.paiement === p.id
                        ? { backgroundColor: "#eab30820", color: "#eab308", borderColor: "#eab30860" }
                        : { backgroundColor: "#18181b", color: "#71717a", borderColor: "#3f3f46" }}>
                      <span>{p.icon}</span>
                      <span className="text-[10px]">{p.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer fixe */}
            <div className="p-5 border-t border-zinc-800 shrink-0">
              <button onClick={saveVente} disabled={savingVente || panier.length === 0}
                className="w-full py-3 rounded-xl text-black font-bold text-sm bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 transition-colors">
                {savingVente ? "Enregistrement..." : panier.length === 0 ? "Ajoute des produits au panier" : `✓ Enregistrer ${panier.reduce((s, i) => s + i.quantite, 0)} produit${panier.reduce((s, i) => s + i.quantite, 0) > 1 ? "s" : ""} — ${panier.reduce((s, i) => s + Number(i.prix_unitaire) * i.quantite, 0).toFixed(2)}€`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  // ═══ RAPPORT FINAL ═══
  if (view === "rapport" && selected) return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#0a0a0a]">
      <div className="px-6 py-4 border-b border-zinc-900 flex items-center gap-3">
        <button onClick={() => setView("detail")} className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white transition-colors">
          <ChevronLeft size={16} />
        </button>
        <div>
          <h1 className="text-white font-bold text-lg">📊 Rapport — {selected.nom}</h1>
          <p className="text-zinc-500 text-xs">{formatDate(selected.date_debut)} → {formatDate(selected.date_fin)}{selected.lieu ? ` · ${selected.lieu}` : ""}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-2xl mx-auto w-full">

        {/* Totaux globaux */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <h2 className="text-white font-bold mb-4 flex items-center gap-2">💰 Résumé global</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "CA Brut total", value: `${totalBrut.toFixed(2)}€`, color: "#eab308", sub: `${totalQty} produits vendus` },
              { label: "Coût fabrication", value: `${totalCF.toFixed(2)}€`, color: "#ef4444", sub: `${((totalCF / totalBrut) * 100 || 0).toFixed(1)}% du CA` },
              { label: "Marge brute", value: `${totalMarge.toFixed(2)}€`, color: "#22c55e", sub: `${((totalMarge / totalBrut) * 100 || 0).toFixed(1)}% de marge` },
              { label: "Marge / produit", value: `${totalQty > 0 ? (totalMarge / totalQty).toFixed(2) : "0.00"}€`, color: "#a855f7", sub: "moyenne par unité" },
              { label: "Bénéfice net", value: `${beneficeNet.toFixed(2)}€`, color: beneficeNet >= 0 ? "#22c55e" : "#ef4444", sub: `Après URSSAF 13.8% + CF` },
            ].map(({ label, value, color, sub }) => (
              <div key={label} className="bg-zinc-800/50 rounded-xl p-3">
                <p className="font-bold text-lg" style={{ color }}>{value}</p>
                <p className="text-white text-xs font-semibold mt-0.5">{label}</p>
                <p className="text-zinc-500 text-[10px] mt-0.5">{sub}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Par jour */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <h2 className="text-white font-bold mb-4 flex items-center gap-2"><Calendar size={16} /> Par jour</h2>
          <div className="space-y-3">
            {parJour.filter(j => j.qty > 0).map(({ jour, brut, cf, qty }) => (
              <div key={jour} className="bg-zinc-800/50 rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: JOUR_COLORS[jour] }} />
                    <span className="text-white font-bold">{jour}</span>
                    <span className="text-zinc-500 text-xs">{qty} vente{qty > 1 ? "s" : ""}</span>
                  </div>
                  <span className="font-bold" style={{ color: JOUR_COLORS[jour] }}>{brut.toFixed(2)}€</span>
                </div>
                <div className="flex items-center gap-1 h-2 rounded-full overflow-hidden bg-zinc-700">
                  <div className="h-full rounded-full transition-all" style={{ width: `${totalBrut > 0 ? (brut / totalBrut) * 100 : 0}%`, backgroundColor: JOUR_COLORS[jour] }} />
                </div>
                <div className="flex justify-between mt-1.5 text-xs text-zinc-500">
                  <span>CF: {cf.toFixed(2)}€</span>
                  <span className="text-green-400">Marge: {(brut - cf).toFixed(2)}€</span>
                  <span>{totalBrut > 0 ? ((brut / totalBrut) * 100).toFixed(0) : 0}% du CA</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Par produit */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <h2 className="text-white font-bold mb-4 flex items-center gap-2"><Package size={16} /> Top produits</h2>
          <div className="space-y-2">
            {parProduit.map(({ nom, qty, brut, cf }, i) => (
              <div key={nom} className="bg-zinc-800/50 rounded-xl px-3 py-2.5 flex items-center gap-3">
                <span className="text-zinc-600 text-xs font-bold w-5 text-center">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-semibold truncate">{nom}</p>
                  <p className="text-zinc-500 text-xs">{qty} unité{qty > 1 ? "s" : ""}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-yellow-400 font-bold text-sm">{brut.toFixed(2)}€</p>
                  <p className="text-green-400 text-xs">+{(brut - cf).toFixed(2)}€</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )


      {/* Modal édition vente */}
      {editVente && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111111] border border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-zinc-800">
              <h2 className="text-white font-bold">Modifier la vente</h2>
              <button onClick={() => setEditVente(null)} className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white">
                <X size={14} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-zinc-500 text-[11px] uppercase tracking-wider mb-1.5">Produit</label>
                <input value={editForm.produit_nom} onChange={e => setEditForm(f => ({ ...f, produit_nom: e.target.value }))}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-500/60" />
              </div>
              <div>
                <label className="block text-zinc-500 text-[11px] uppercase tracking-wider mb-1.5">Nom du client</label>
                <input value={editForm.client_nom} onChange={e => setEditForm(f => ({ ...f, client_nom: e.target.value }))}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-500/60" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-500 text-[11px] uppercase tracking-wider mb-1.5">Prix €</label>
                  <input type="number" step="0.01" value={editForm.prix_unitaire} onChange={e => setEditForm(f => ({ ...f, prix_unitaire: e.target.value }))}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-500/60" />
                </div>
                <div>
                  <label className="block text-zinc-500 text-[11px] uppercase tracking-wider mb-1.5">Coût fab. €</label>
                  <input type="number" step="0.01" value={editForm.cout_fab} onChange={e => setEditForm(f => ({ ...f, cout_fab: e.target.value }))}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-500/60" />
                </div>
              </div>
              <div>
                <label className="block text-zinc-500 text-[11px] uppercase tracking-wider mb-1.5">Quantité</label>
                <div className="flex items-center gap-3">
                  <button onClick={() => setEditForm(f => ({ ...f, quantite: Math.max(1, f.quantite - 1) }))}
                    className="w-10 h-10 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xl font-bold flex items-center justify-center">−</button>
                  <span className="text-white font-bold text-xl w-12 text-center">{editForm.quantite}</span>
                  <button onClick={() => setEditForm(f => ({ ...f, quantite: f.quantite + 1 }))}
                    className="w-10 h-10 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xl font-bold flex items-center justify-center">+</button>
                </div>
              </div>
              <div>
                <label className="block text-zinc-500 text-[11px] uppercase tracking-wider mb-2">Jour</label>
                <div className="grid grid-cols-3 gap-2">
                  {JOURS.map(j => (
                    <button key={j} onClick={() => setEditForm(f => ({ ...f, jour: j }))}
                      className="py-2.5 rounded-xl text-sm font-bold border transition-all"
                      style={editForm.jour === j
                        ? { backgroundColor: JOUR_COLORS[j] + "25", color: JOUR_COLORS[j], borderColor: JOUR_COLORS[j] + "60" }
                        : { backgroundColor: "#18181b", color: "#71717a", borderColor: "#3f3f46" }}>
                      {j}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-zinc-500 text-[11px] uppercase tracking-wider mb-1.5">Heure</label>
                <input type="time" value={editForm.heure} onChange={e => setEditForm(f => ({ ...f, heure: e.target.value }))}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-500/60" />
              </div>
              <div>
                <label className="block text-zinc-500 text-[11px] uppercase tracking-wider mb-2">Paiement</label>
                <div className="grid grid-cols-5 gap-1.5">
                  {PAIEMENTS.map(p => (
                    <button key={p.id} onClick={() => setEditForm(f => ({ ...f, paiement: p.id }))}
                      className="flex flex-col items-center gap-1 py-2 rounded-xl text-xs font-bold border transition-all"
                      style={editForm.paiement === p.id
                        ? { backgroundColor: "#eab30820", color: "#eab308", borderColor: "#eab30860" }
                        : { backgroundColor: "#18181b", color: "#71717a", borderColor: "#3f3f46" }}>
                      <span>{p.icon}</span>
                      <span className="text-[10px]">{p.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={saveEdit}
                className="w-full py-3 rounded-xl text-black font-bold text-sm bg-yellow-500 hover:bg-yellow-400 transition-colors">
                ✓ Enregistrer les modifications
              </button>
            </div>
          </div>
        </div>
      )}
  return null
}