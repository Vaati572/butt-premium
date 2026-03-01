"use client"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Plus, X, Search, Trash2, Pencil, Eye, Phone, Mail, MapPin, ShoppingCart, TrendingUp } from "lucide-react"

interface Pharmacie {
  id: string; nom: string; enseigne: string; responsable: string
  tel: string; email: string; adresse: string; cp: string; ville: string
  statut: string; categorie: string; notes: string
  chiffre_affaires: number | null; created_at: string
}

const STATUTS = [
  { id: "actif",     label: "Actif",      color: "#22c55e" },
  { id: "prospect",  label: "Prospect",   color: "#3b82f6" },
  { id: "inactif",   label: "Inactif",    color: "#71717a" },
]
const CATEGORIES = ["Indépendante", "Groupe", "Réseau", "CHU", "Clinique", "EHPAD", "Autre"]
const EMPTY = { nom: "", enseigne: "", responsable: "", tel: "", email: "", adresse: "", cp: "", ville: "", statut: "actif", categorie: "Indépendante", notes: "", chiffre_affaires: "" as any }

export default function PharmaciesModule({ activeSociety, profile }: { activeSociety: any; profile: any }) {
  const [pharmacies, setPharmacies] = useState<Pharmacie[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filterStatut, setFilterStatut] = useState("tous")
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Pharmacie | null>(null)
  const [viewing, setViewing] = useState<Pharmacie | null>(null)
  const [form, setForm] = useState({ ...EMPTY })
  const [saving, setSaving] = useState(false)
  const [showVentes, setShowVentes] = useState<string | null>(null)
  const [ventes, setVentes] = useState<any[]>([])

  useEffect(() => { load() }, [activeSociety])

  const load = async () => {
    setLoading(true)
    const { data } = await supabase.from("pharmacies").select("*").eq("society_id", activeSociety.id).order("nom")
    setPharmacies(data || [])
    setLoading(false)
  }

  const openCreate = () => { setForm({ ...EMPTY }); setEditing(null); setShowForm(true) }
  const openEdit = (p: Pharmacie) => { setForm({ ...p, chiffre_affaires: p.chiffre_affaires ?? "" } as any); setEditing(p); setShowForm(true) }

  const save = async () => {
    if (!form.nom.trim()) return
    setSaving(true)
    const payload = { ...form, chiffre_affaires: form.chiffre_affaires || null, society_id: activeSociety.id }
    if (editing) await supabase.from("pharmacies").update(payload).eq("id", editing.id)
    else await supabase.from("pharmacies").insert(payload)
    setSaving(false); setShowForm(false); load()
  }

  const remove = async (id: string) => {
    if (!confirm("Supprimer cette pharmacie ?")) return
    await supabase.from("pharmacies").delete().eq("id", id)
    if (viewing?.id === id) setViewing(null)
    load()
  }

  const loadVentes = async (pharmacieId: string) => {
    const { data } = await supabase.from("ventes").select("*").eq("client_id", pharmacieId).order("created_at", { ascending: false }).limit(20)
    setVentes(data || [])
    setShowVentes(pharmacieId)
  }

  const getStatut = (id: string) => STATUTS.find(s => s.id === id) || STATUTS[0]

  const filtered = pharmacies.filter(p => {
    const matchSearch = !search || p.nom?.toLowerCase().includes(search.toLowerCase()) || p.ville?.toLowerCase().includes(search.toLowerCase()) || p.responsable?.toLowerCase().includes(search.toLowerCase())
    const matchStatut = filterStatut === "tous" || p.statut === filterStatut
    return matchSearch && matchStatut
  })

  const totalCA = pharmacies.filter(p => p.statut === "actif").reduce((s, p) => s + (p.chiffre_affaires || 0), 0)

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#0a0a0a]">
      <div className="px-6 py-4 border-b border-zinc-900 flex items-center justify-between">
        <div>
          <h1 className="text-white font-bold text-xl">🏥 Pharmacies</h1>
          <p className="text-zinc-500 text-xs mt-0.5">{pharmacies.length} pharmacie{pharmacies.length > 1 ? "s" : ""}{totalCA > 0 && <span className="text-green-400 font-semibold ml-2">· CA: {totalCA.toFixed(0)}€</span>}</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 rounded-xl text-black text-sm font-bold bg-yellow-500 hover:bg-yellow-400 transition-colors"><Plus size={14} /> Nouvelle</button>
      </div>

      <div className="px-6 py-2 flex gap-2 overflow-x-auto border-b border-zinc-900">
        <button onClick={() => setFilterStatut("tous")} className={`px-3 py-1.5 rounded-lg text-xs font-semibold border whitespace-nowrap transition-all ${filterStatut === "tous" ? "bg-zinc-700 text-white border-zinc-600" : "border-zinc-800 text-zinc-500"}`}>Toutes · {pharmacies.length}</button>
        {STATUTS.map(s => (
          <button key={s.id} onClick={() => setFilterStatut(s.id)} className="px-3 py-1.5 rounded-lg text-xs font-semibold border whitespace-nowrap transition-all"
            style={filterStatut === s.id ? { backgroundColor: s.color + "20", color: s.color, borderColor: s.color + "50" } : { borderColor: "#27272a", color: "#71717a" }}>
            {pharmacies.filter(p => p.statut === s.id).length} {s.label}
          </button>
        ))}
      </div>

      <div className="px-6 py-3 border-b border-zinc-900">
        <div className="relative"><Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher par nom, ville, responsable..." className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600" /></div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (<div className="flex items-center justify-center h-40"><div className="w-6 h-6 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" /></div>)
        : filtered.length === 0 ? (
          <div className="text-center py-20"><p className="text-4xl mb-3">🏥</p><p className="text-zinc-400 font-semibold">Aucune pharmacie</p><button onClick={openCreate} className="mt-4 px-4 py-2 rounded-xl text-black text-sm font-bold bg-yellow-500">+ Nouvelle pharmacie</button></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {filtered.map(p => {
              const sc = getStatut(p.statut)
              return (
                <div key={p.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 hover:border-zinc-700 transition-all group">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-bold text-sm truncate">{p.nom}</p>
                      {p.enseigne && <p className="text-zinc-500 text-xs truncate">{p.enseigne}</p>}
                    </div>
                    <span className="text-xs font-bold px-2 py-1 rounded-lg ml-2 shrink-0" style={{ backgroundColor: sc.color + "20", color: sc.color }}>{sc.label}</span>
                  </div>
                  <div className="space-y-1 mb-3">
                    {p.responsable && <p className="text-zinc-500 text-xs flex items-center gap-1.5">👤 {p.responsable}</p>}
                    {p.ville && <p className="text-zinc-500 text-xs flex items-center gap-1.5"><MapPin size={10} />{p.cp} {p.ville}</p>}
                    {p.tel && <p className="text-zinc-500 text-xs flex items-center gap-1.5"><Phone size={10} />{p.tel}</p>}
                    {p.chiffre_affaires && <p className="text-green-400 text-xs font-semibold flex items-center gap-1.5"><TrendingUp size={10} />CA: {Number(p.chiffre_affaires).toFixed(0)}€</p>}
                  </div>
                  <div className="flex gap-1.5 pt-3 border-t border-zinc-800">
                    <button onClick={() => setViewing(p)} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs"><Eye size={11} /> Voir</button>
                    <button onClick={() => openEdit(p)} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs"><Pencil size={11} /> Éditer</button>
                    <button onClick={() => loadVentes(p.id)} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold" style={{ backgroundColor: "#22c55e20", color: "#22c55e" }}><ShoppingCart size={11} /> Ventes</button>
                    <button onClick={() => remove(p.id)} className="ml-auto w-7 h-7 rounded-lg bg-red-500/10 hover:bg-red-500/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={11} className="text-red-400" /></button>
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
              <h2 className="text-white font-bold">{viewing.nom}</h2>
              <div className="flex gap-2">
                <button onClick={() => openEdit(viewing)} className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white"><Pencil size={13} /></button>
                <button onClick={() => setViewing(null)} className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white"><X size={13} /></button>
              </div>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {[{ l: "Enseigne", v: viewing.enseigne }, { l: "Responsable", v: viewing.responsable }, { l: "Téléphone", v: viewing.tel }, { l: "Email", v: viewing.email }, { l: "Catégorie", v: viewing.categorie }, { l: "Ville", v: `${viewing.cp || ""} ${viewing.ville || ""}`.trim() }].filter(x => x.v).map(({ l, v }) => (
                  <div key={l} className="bg-zinc-900 rounded-xl p-3"><p className="text-zinc-600 text-[10px] uppercase tracking-wider mb-1">{l}</p><p className="text-zinc-200 text-sm font-medium">{v}</p></div>
                ))}
              </div>
              {viewing.adresse && <div className="bg-zinc-900 rounded-xl p-3"><p className="text-zinc-600 text-[10px] uppercase tracking-wider mb-1">📍 Adresse</p><p className="text-zinc-200 text-sm">{viewing.adresse}, {viewing.cp} {viewing.ville}</p></div>}
              {viewing.chiffre_affaires && <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3"><p className="text-zinc-600 text-[10px] uppercase tracking-wider mb-1">📈 Chiffre d'affaires</p><p className="text-green-400 text-xl font-black">{Number(viewing.chiffre_affaires).toFixed(2)}€</p></div>}
              {viewing.notes && <div className="bg-zinc-900 rounded-xl p-3"><p className="text-zinc-600 text-[10px] uppercase tracking-wider mb-2">Notes</p><p className="text-zinc-300 text-sm">{viewing.notes}</p></div>}
              <button onClick={() => loadVentes(viewing.id)} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold" style={{ backgroundColor: "#22c55e20", color: "#22c55e" }}><ShoppingCart size={14} /> Voir les ventes</button>
            </div>
          </div>
        </div>
      )}

      {/* Ventes panel */}
      {showVentes && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111111] border border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between p-5 border-b border-zinc-800">
              <h2 className="text-white font-bold">Historique des ventes</h2>
              <button onClick={() => setShowVentes(null)} className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white"><X size={13} /></button>
            </div>
            <div className="p-4">
              {ventes.length === 0 ? <p className="text-zinc-500 text-sm text-center py-8">Aucune vente enregistrée</p> : (
                <div className="space-y-2">
                  {ventes.map(v => (
                    <div key={v.id} className="flex items-center justify-between bg-zinc-900 rounded-xl px-4 py-3">
                      <div><p className="text-white text-sm font-semibold">{new Date(v.created_at).toLocaleDateString("fr-FR")}</p><p className="text-zinc-500 text-xs">{v.produits?.length || 0} produit{(v.produits?.length || 0) > 1 ? "s" : ""}</p></div>
                      <p className="text-green-400 font-bold">{Number(v.total || 0).toFixed(2)}€</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111111] border border-zinc-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between p-5 border-b border-zinc-800">
              <h2 className="text-white font-bold">{editing ? "Modifier la pharmacie" : "Nouvelle pharmacie"}</h2>
              <button onClick={() => setShowForm(false)} className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white"><X size={14} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2"><label className="block text-zinc-500 text-[11px] uppercase tracking-wider mb-1.5">Nom <span className="text-red-400">*</span></label><input value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} placeholder="Pharmacie du Centre" className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-500/60" /></div>
                <div><label className="block text-zinc-500 text-[11px] uppercase tracking-wider mb-1.5">Enseigne</label><input value={form.enseigne} onChange={e => setForm(f => ({ ...f, enseigne: e.target.value }))} placeholder="Groupe Lafayette..." className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-500/60" /></div>
                <div><label className="block text-zinc-500 text-[11px] uppercase tracking-wider mb-1.5">Responsable</label><input value={form.responsable} onChange={e => setForm(f => ({ ...f, responsable: e.target.value }))} placeholder="Dr. Martin..." className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-500/60" /></div>
                <div><label className="block text-zinc-500 text-[11px] uppercase tracking-wider mb-1.5">Téléphone</label><input value={form.tel} onChange={e => setForm(f => ({ ...f, tel: e.target.value }))} placeholder="03 00 00 00 00" className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-500/60" /></div>
                <div><label className="block text-zinc-500 text-[11px] uppercase tracking-wider mb-1.5">Email</label><input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="contact@pharmacie.fr" className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-500/60" /></div>
                <div><label className="block text-zinc-500 text-[11px] uppercase tracking-wider mb-1.5">Statut</label><select value={form.statut} onChange={e => setForm(f => ({ ...f, statut: e.target.value }))} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none">{STATUTS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}</select></div>
                <div><label className="block text-zinc-500 text-[11px] uppercase tracking-wider mb-1.5">Catégorie</label><select value={form.categorie} onChange={e => setForm(f => ({ ...f, categorie: e.target.value }))} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none">{CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                <div className="col-span-2"><label className="block text-zinc-500 text-[11px] uppercase tracking-wider mb-1.5">Adresse</label><input value={form.adresse} onChange={e => setForm(f => ({ ...f, adresse: e.target.value }))} placeholder="Rue, numéro..." className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-500/60" /></div>
                <div><label className="block text-zinc-500 text-[11px] uppercase tracking-wider mb-1.5">Code postal</label><input value={form.cp} onChange={e => setForm(f => ({ ...f, cp: e.target.value }))} placeholder="57000" className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-500/60" /></div>
                <div><label className="block text-zinc-500 text-[11px] uppercase tracking-wider mb-1.5">Ville</label><input value={form.ville} onChange={e => setForm(f => ({ ...f, ville: e.target.value }))} placeholder="Metz..." className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-500/60" /></div>
                <div className="col-span-2"><label className="block text-zinc-500 text-[11px] uppercase tracking-wider mb-1.5">CA estimé (€)</label><input type="number" value={form.chiffre_affaires} onChange={e => setForm(f => ({ ...f, chiffre_affaires: e.target.value }))} placeholder="0.00" className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-500/60" /></div>
                <div className="col-span-2"><label className="block text-zinc-500 text-[11px] uppercase tracking-wider mb-1.5">Notes</label><textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={3} placeholder="Informations..." className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-500/60 resize-none" /></div>
              </div>
              <button onClick={save} disabled={saving || !form.nom.trim()} className="w-full py-3 rounded-xl text-black font-bold text-sm bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 transition-colors">{saving ? "Enregistrement..." : editing ? "Mettre à jour" : "Créer la pharmacie"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}