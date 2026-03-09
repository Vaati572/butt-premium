"use client"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Plus, X, Search, Trash2, Pencil, Eye, Package, Truck, CheckCircle, Clock, AlertCircle } from "lucide-react"

interface Commande {
  id: string; numero: string; fournisseur: string; statut: string
  produits: { nom: string; qte: number; prix_unitaire: number }[]
  total: number; date_commande: string; date_livraison: string | null
  notes: string; user_nom: string; created_at: string
}

const STATUTS = [
  { id: "brouillon",  label: "Brouillon",    color: "#71717a", icon: Clock },
  { id: "envoyee",    label: "Envoyée",      color: "#3b82f6", icon: Truck },
  { id: "en_cours",   label: "En transit",   color: "#f97316", icon: Package },
  { id: "recue",      label: "Reçue",        color: "#22c55e", icon: CheckCircle },
  { id: "annulee",    label: "Annulée",      color: "#ef4444", icon: AlertCircle },
]

const EMPTY_PRODUIT = { nom: "", qte: 1, prix_unitaire: 0 }
const EMPTY = { numero: "", fournisseur: "", statut: "brouillon", produits: [{ ...EMPTY_PRODUIT }], date_commande: new Date().toISOString().split("T")[0], date_livraison: "", notes: "" }

export default function CommandesModule({ activeSociety, profile }: { activeSociety: any; profile: any }) {
  const [commandes, setCommandes] = useState<Commande[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filterStatut, setFilterStatut] = useState("tous")
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Commande | null>(null)
  const [viewing, setViewing] = useState<Commande | null>(null)
  const [form, setForm] = useState<typeof EMPTY>({ ...EMPTY })
  const [saving, setSaving] = useState(false)

  useEffect(() => { load() }, [activeSociety])

  const load = async () => {
    setLoading(true)
    const { data } = await supabase.from("commandes").select("*").eq("society_id", activeSociety.id).order("created_at", { ascending: false })
    setCommandes(data || [])
    setLoading(false)
  }

  const calcTotal = (produits: typeof EMPTY.produits) => produits.reduce((s, p) => s + (p.qte * p.prix_unitaire), 0)

  const openCreate = () => {
    const num = `CMD-${Date.now().toString().slice(-6)}`
    setForm({ ...EMPTY, numero: num }); setEditing(null); setShowForm(true)
  }
  const openEdit = (c: Commande) => { setForm({ ...c, date_livraison: c.date_livraison || "", produits: c.produits || [{ ...EMPTY_PRODUIT }] } as any); setEditing(c); setShowForm(true) }

  const save = async () => {
    if (!form.fournisseur.trim()) return
    setSaving(true)
    const total = calcTotal(form.produits)
    const payload = {
      numero: form.numero,
      fournisseur: form.fournisseur,
      statut: form.statut,
      produits: form.produits,
      total,
      date_commande: form.date_commande || null,
      date_livraison: form.date_livraison || null,
      notes: form.notes,
      user_nom: profile.nom || "",
      society_id: activeSociety.id,
    }
    let error: any = null
    if (editing) {
      const res = await supabase.from("commandes").update(payload).eq("id", editing.id)
      error = res.error
    } else {
      const res = await supabase.from("commandes").insert(payload)
      error = res.error
    }
    setSaving(false)
    if (error) { alert("Erreur: " + error.message); return }
    setShowForm(false); load()
  }

  const remove = async (id: string) => {
    if (!confirm("Supprimer cette commande ?")) return
    await supabase.from("commandes").delete().eq("id", id)
    if (viewing?.id === id) setViewing(null)
    load()
  }

  const updateStatut = async (id: string, statut: string) => {
    await supabase.from("commandes").update({ statut }).eq("id", id); load()
    if (viewing?.id === id) setViewing(v => v ? { ...v, statut } : v)
  }

  const addProduit = () => setForm(f => ({ ...f, produits: [...f.produits, { ...EMPTY_PRODUIT }] }))
  const removeProduit = (i: number) => setForm(f => ({ ...f, produits: f.produits.filter((_, idx) => idx !== i) }))
  const updateProduit = (i: number, field: string, value: any) => setForm(f => ({ ...f, produits: f.produits.map((p, idx) => idx === i ? { ...p, [field]: value } : p) }))

  const getStatut = (id: string) => STATUTS.find(s => s.id === id) || STATUTS[0]

  const filtered = commandes.filter(c => {
    const matchSearch = !search || c.numero?.toLowerCase().includes(search.toLowerCase()) || c.fournisseur?.toLowerCase().includes(search.toLowerCase())
    const matchStatut = filterStatut === "tous" || c.statut === filterStatut
    return matchSearch && matchStatut
  })

  const totalEnCours = commandes.filter(c => ["envoyee", "en_cours"].includes(c.statut)).reduce((s, c) => s + (c.total || 0), 0)

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#0a0a0a]">
      <div className="px-6 py-4 border-b border-zinc-900 flex items-center justify-between">
        <div>
          <h1 className="text-white font-bold text-xl">📋 Commandes</h1>
          <p className="text-zinc-500 text-xs mt-0.5">{commandes.length} commande{commandes.length > 1 ? "s" : ""}{totalEnCours > 0 && <span className="text-orange-400 font-semibold ml-2">· {totalEnCours.toFixed(2)}€ en transit</span>}</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 rounded-xl text-black text-sm font-bold bg-yellow-500 hover:bg-yellow-400 transition-colors"><Plus size={14} /> Nouvelle</button>
      </div>

      <div className="px-6 py-2 flex gap-2 overflow-x-auto border-b border-zinc-900">
        <button onClick={() => setFilterStatut("tous")} className={`px-3 py-1.5 rounded-lg text-xs font-semibold border whitespace-nowrap transition-all ${filterStatut === "tous" ? "bg-zinc-700 text-white border-zinc-600" : "border-zinc-800 text-zinc-500"}`}>Toutes · {commandes.length}</button>
        {STATUTS.map(s => (
          <button key={s.id} onClick={() => setFilterStatut(s.id)} className="px-3 py-1.5 rounded-lg text-xs font-semibold border whitespace-nowrap transition-all"
            style={filterStatut === s.id ? { backgroundColor: s.color + "20", color: s.color, borderColor: s.color + "50" } : { borderColor: "#27272a", color: "#71717a" }}>
            {commandes.filter(c => c.statut === s.id).length} {s.label}
          </button>
        ))}
      </div>

      <div className="px-6 py-3 border-b border-zinc-900">
        <div className="relative"><Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher par numéro ou fournisseur..." className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600" /></div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (<div className="flex items-center justify-center h-40"><div className="w-6 h-6 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" /></div>)
        : filtered.length === 0 ? (
          <div className="text-center py-20"><p className="text-4xl mb-3">📋</p><p className="text-zinc-400 font-semibold">Aucune commande</p><button onClick={openCreate} className="mt-4 px-4 py-2 rounded-xl text-black text-sm font-bold bg-yellow-500">+ Nouvelle commande</button></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {filtered.map(c => {
              const sc = getStatut(c.statut)
              const Icon = sc.icon
              return (
                <div key={c.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 hover:border-zinc-700 transition-all group">
                  <div className="flex items-start justify-between mb-2">
                    <div><p className="text-white font-bold text-sm">{c.numero}</p><p className="text-zinc-500 text-xs">{c.fournisseur}</p></div>
                    <span className="flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg" style={{ backgroundColor: sc.color + "20", color: sc.color }}><Icon size={10} />{sc.label}</span>
                  </div>
                  <div className="text-white font-black text-lg mb-1">{Number(c.total || 0).toFixed(2)}€</div>
                  <p className="text-zinc-600 text-xs mb-1">{c.produits?.length || 0} produit{(c.produits?.length || 0) > 1 ? "s" : ""}</p>
                  <p className="text-zinc-600 text-xs">{new Date(c.date_commande).toLocaleDateString("fr-FR")}{c.date_livraison && ` → ${new Date(c.date_livraison).toLocaleDateString("fr-FR")}`}</p>
                  <div className="flex gap-1.5 pt-3 border-t border-zinc-800 mt-3">
                    <button onClick={() => setViewing(c)} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs"><Eye size={11} /> Voir</button>
                    <button onClick={() => openEdit(c)} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs"><Pencil size={11} /> Éditer</button>
                    <button onClick={() => remove(c.id)} className="ml-auto w-7 h-7 rounded-lg bg-red-500/10 hover:bg-red-500/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={11} className="text-red-400" /></button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Detail modal */}
      {viewing && !showForm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111111] border border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between p-5 border-b border-zinc-800">
              <div><p className="text-white font-bold">{viewing.numero}</p><p className="text-zinc-500 text-sm">{viewing.fournisseur}</p></div>
              <div className="flex gap-2">
                <button onClick={() => openEdit(viewing)} className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white"><Pencil size={13} /></button>
                <button onClick={() => setViewing(null)} className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white"><X size={13} /></button>
              </div>
            </div>
            <div className="p-5 space-y-4">
              {/* Statut buttons */}
              <div>
                <p className="text-zinc-500 text-[11px] uppercase tracking-wider mb-2">Statut</p>
                <div className="flex gap-2 flex-wrap">
                  {STATUTS.map(s => (
                    <button key={s.id} onClick={() => updateStatut(viewing.id, s.id)} className="px-3 py-1.5 rounded-lg text-xs font-bold border transition-all"
                      style={viewing.statut === s.id ? { backgroundColor: s.color + "20", color: s.color, borderColor: s.color + "50" } : { borderColor: "#27272a", color: "#71717a" }}>
                      {viewing.statut === s.id && "✓ "}{s.label}
                    </button>
                  ))}
                </div>
              </div>
              {/* Produits */}
              <div>
                <p className="text-zinc-500 text-[11px] uppercase tracking-wider mb-2">Produits commandés</p>
                <div className="space-y-1">
                  {(viewing.produits || []).map((p, i) => (
                    <div key={i} className="flex items-center justify-between bg-zinc-900 rounded-xl px-3 py-2">
                      <span className="text-zinc-200 text-sm">{p.nom}</span>
                      <span className="text-zinc-400 text-sm">×{p.qte} · {(p.qte * p.prix_unitaire).toFixed(2)}€</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 flex items-center justify-between">
                <span className="text-zinc-400 font-semibold">Total</span>
                <span className="text-yellow-400 font-black text-xl">{Number(viewing.total || 0).toFixed(2)}€</span>
              </div>
              {viewing.notes && <div className="bg-zinc-900 rounded-xl p-3"><p className="text-zinc-600 text-[10px] mb-2">Notes</p><p className="text-zinc-300 text-sm">{viewing.notes}</p></div>}
            </div>
          </div>
        </div>
      )}

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111111] border border-zinc-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between p-5 border-b border-zinc-800">
              <h2 className="text-white font-bold">{editing ? "Modifier la commande" : "Nouvelle commande"}</h2>
              <button onClick={() => setShowForm(false)} className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white"><X size={14} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-zinc-500 text-[11px] uppercase tracking-wider mb-1.5">N° commande</label><input value={form.numero} onChange={e => setForm(f => ({ ...f, numero: e.target.value }))} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-500/60" /></div>
                <div><label className="block text-zinc-500 text-[11px] uppercase tracking-wider mb-1.5">Fournisseur <span className="text-red-400">*</span></label><input value={form.fournisseur} onChange={e => setForm(f => ({ ...f, fournisseur: e.target.value }))} placeholder="Nom du fournisseur" className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-500/60" /></div>
                <div><label className="block text-zinc-500 text-[11px] uppercase tracking-wider mb-1.5">Date commande</label><input type="date" value={form.date_commande} onChange={e => setForm(f => ({ ...f, date_commande: e.target.value }))} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-500/60" /></div>
                <div><label className="block text-zinc-500 text-[11px] uppercase tracking-wider mb-1.5">Date livraison prévue</label><input type="date" value={form.date_livraison} onChange={e => setForm(f => ({ ...f, date_livraison: e.target.value }))} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-500/60" /></div>
                <div className="col-span-2"><label className="block text-zinc-500 text-[11px] uppercase tracking-wider mb-1.5">Statut</label><select value={form.statut} onChange={e => setForm(f => ({ ...f, statut: e.target.value }))} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none">{STATUTS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}</select></div>
              </div>

              {/* Produits */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-zinc-500 text-[11px] uppercase tracking-wider">Produits</label>
                  <button onClick={addProduit} className="text-xs text-yellow-400 hover:text-yellow-300 font-semibold">+ Ajouter</button>
                </div>
                <div className="space-y-2">
                  {form.produits.map((p, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <input value={p.nom} onChange={e => updateProduit(i, "nom", e.target.value)} placeholder="Produit" className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-500/60" />
                      <input type="number" value={p.qte} onChange={e => updateProduit(i, "qte", Number(e.target.value))} placeholder="Qté" className="w-16 bg-zinc-800 border border-zinc-700 rounded-xl px-2 py-2 text-sm text-white text-center focus:outline-none focus:border-yellow-500/60" />
                      <input type="number" value={p.prix_unitaire} onChange={e => updateProduit(i, "prix_unitaire", Number(e.target.value))} placeholder="€" className="w-20 bg-zinc-800 border border-zinc-700 rounded-xl px-2 py-2 text-sm text-white text-center focus:outline-none focus:border-yellow-500/60" />
                      {form.produits.length > 1 && <button onClick={() => removeProduit(i)} className="w-7 h-7 rounded-lg bg-red-500/20 flex items-center justify-center shrink-0"><X size={11} className="text-red-400" /></button>}
                    </div>
                  ))}
                </div>
                <div className="flex justify-end mt-2">
                  <span className="text-yellow-400 font-black text-lg">Total: {calcTotal(form.produits).toFixed(2)}€</span>
                </div>
              </div>

              <div><label className="block text-zinc-500 text-[11px] uppercase tracking-wider mb-1.5">Notes</label><textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} placeholder="Informations complémentaires..." className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-500/60 resize-none" /></div>
              <button onClick={save} disabled={saving || !form.fournisseur.trim()} className="w-full py-3 rounded-xl text-black font-bold text-sm bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 transition-colors">{saving ? "Enregistrement..." : editing ? "Mettre à jour" : "Créer la commande"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
