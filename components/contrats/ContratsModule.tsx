"use client"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Plus, X, Search, Trash2, Pencil, Eye, FileText, AlertTriangle, CheckCircle, Clock } from "lucide-react"

interface Contrat {
  id: string; titre: string; client_nom: string; client_id: string | null
  type: string; statut: string; montant: number | null; montant_mensuel: number | null
  date_debut: string; date_fin: string | null; duree_mois: number | null
  notes: string; fichier_url: string; created_at: string
}

const TYPES = ["CDI", "CDD", "Freelance", "Prestation", "Maintenance", "Abonnement", "Partenariat", "Autre"]
const STATUTS = [
  { id: "actif",    label: "Actif",      color: "#22c55e", icon: CheckCircle },
  { id: "attente",  label: "En attente", color: "#eab308", icon: Clock },
  { id: "expire",   label: "Expiré",     color: "#ef4444", icon: AlertTriangle },
  { id: "resilie",  label: "Résilié",    color: "#71717a", icon: X },
]

const EMPTY = { titre: "", client_nom: "", client_id: null as string | null, type: "Prestation", statut: "actif", montant: "" as any, montant_mensuel: "" as any, date_debut: "", date_fin: "", duree_mois: "" as any, notes: "", fichier_url: "" }

export default function ContratsModule({ activeSociety, profile }: { activeSociety: any; profile: any }) {
  const [contrats, setContrats] = useState<Contrat[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filterStatut, setFilterStatut] = useState("tous")
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Contrat | null>(null)
  const [viewing, setViewing] = useState<Contrat | null>(null)
  const [form, setForm] = useState({ ...EMPTY })
  const [saving, setSaving] = useState(false)

  useEffect(() => { load() }, [activeSociety])

  const load = async () => {
    setLoading(true)
    const { data } = await supabase.from("contrats").select("*").eq("society_id", activeSociety.id).order("created_at", { ascending: false })
    setContrats(data || [])
    const { data: c } = await supabase.from("clients").select("id, nom").eq("society_id", activeSociety.id).order("nom")
    setClients(c || [])
    setLoading(false)
  }

  const openCreate = () => { setForm({ ...EMPTY }); setEditing(null); setShowForm(true) }
  const openEdit = (c: Contrat) => { setForm({ ...c, montant: c.montant ?? "", montant_mensuel: c.montant_mensuel ?? "", duree_mois: c.duree_mois ?? "", date_fin: c.date_fin ?? "" } as any); setEditing(c); setShowForm(true) }

  const save = async () => {
    if (!form.titre.trim() || !form.date_debut) return
    setSaving(true)
    const payload = { ...form, montant: form.montant || null, montant_mensuel: form.montant_mensuel || null, duree_mois: form.duree_mois || null, date_fin: form.date_fin || null, society_id: activeSociety.id }
    if (editing) await supabase.from("contrats").update(payload).eq("id", editing.id)
    else await supabase.from("contrats").insert(payload)
    setSaving(false); setShowForm(false); load()
  }

  const remove = async (id: string) => {
    if (!confirm("Supprimer ce contrat ?")) return
    await supabase.from("contrats").delete().eq("id", id)
    if (viewing?.id === id) setViewing(null)
    load()
  }

  const getStatut = (id: string) => STATUTS.find(s => s.id === id) || STATUTS[0]

  // Check expiring soon (within 30 days)
  const isExpiringSoon = (c: Contrat) => {
    if (!c.date_fin || c.statut !== "actif") return false
    const diff = new Date(c.date_fin).getTime() - Date.now()
    return diff > 0 && diff < 30 * 24 * 60 * 60 * 1000
  }

  const filtered = contrats.filter(c => {
    const matchSearch = !search || c.titre?.toLowerCase().includes(search.toLowerCase()) || c.client_nom?.toLowerCase().includes(search.toLowerCase())
    const matchStatut = filterStatut === "tous" || c.statut === filterStatut
    return matchSearch && matchStatut
  })

  const totalMensuel = contrats.filter(c => c.statut === "actif").reduce((sum, c) => sum + (c.montant_mensuel || 0), 0)

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#0a0a0a]">
      <div className="px-6 py-4 border-b border-zinc-900 flex items-center justify-between">
        <div>
          <h1 className="text-white font-bold text-xl">📑 Contrats</h1>
          <p className="text-zinc-500 text-xs mt-0.5">{contrats.length} contrat{contrats.length > 1 ? "s" : ""} · {totalMensuel > 0 && <span className="text-green-400 font-semibold">{totalMensuel.toFixed(2)}€/mois actifs</span>}</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 rounded-xl text-black text-sm font-bold bg-yellow-500 hover:bg-yellow-400 transition-colors"><Plus size={14} /> Nouveau</button>
      </div>

      {/* Stats bar */}
      <div className="px-6 py-2 flex gap-2 overflow-x-auto border-b border-zinc-900">
        <button onClick={() => setFilterStatut("tous")} className={`px-3 py-1.5 rounded-lg text-xs font-semibold border whitespace-nowrap transition-all ${filterStatut === "tous" ? "bg-zinc-700 text-white border-zinc-600" : "border-zinc-800 text-zinc-500"}`}>Tous · {contrats.length}</button>
        {STATUTS.map(s => (
          <button key={s.id} onClick={() => setFilterStatut(s.id)} className="px-3 py-1.5 rounded-lg text-xs font-semibold border whitespace-nowrap transition-all"
            style={filterStatut === s.id ? { backgroundColor: s.color + "20", color: s.color, borderColor: s.color + "50" } : { borderColor: "#27272a", color: "#71717a" }}>
            {contrats.filter(c => c.statut === s.id).length} {s.label}
          </button>
        ))}
      </div>

      <div className="px-6 py-3 border-b border-zinc-900">
        <div className="relative"><Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..." className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600" /></div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (<div className="flex items-center justify-center h-40"><div className="w-6 h-6 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" /></div>)
        : filtered.length === 0 ? (
          <div className="text-center py-20"><p className="text-4xl mb-3">📑</p><p className="text-zinc-400 font-semibold">Aucun contrat</p><button onClick={openCreate} className="mt-4 px-4 py-2 rounded-xl text-black text-sm font-bold bg-yellow-500">+ Nouveau contrat</button></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {filtered.map(c => {
              const sc = getStatut(c.statut)
              const expiring = isExpiringSoon(c)
              return (
                <div key={c.id} className={`bg-zinc-900 border rounded-2xl p-4 hover:border-zinc-700 transition-all group ${expiring ? "border-orange-500/40" : "border-zinc-800"}`}>
                  {expiring && <div className="flex items-center gap-1.5 text-orange-400 text-[11px] font-semibold mb-2"><AlertTriangle size={11} /> Expire bientôt</div>}
                  <div className="flex items-start justify-between mb-2">
                    <p className="text-white font-bold text-sm truncate flex-1">{c.titre}</p>
                    <span className="text-xs font-bold px-2 py-1 rounded-lg ml-2 shrink-0" style={{ backgroundColor: sc.color + "20", color: sc.color }}>{sc.label}</span>
                  </div>
                  {c.client_nom && <p className="text-zinc-500 text-xs mb-1">👤 {c.client_nom}</p>}
                  <p className="text-zinc-500 text-xs mb-3">📋 {c.type}</p>
                  <div className="flex gap-3 mb-3">
                    {c.montant && <div><p className="text-white font-bold text-sm">{Number(c.montant).toFixed(2)}€</p><p className="text-zinc-600 text-[10px]">Total</p></div>}
                    {c.montant_mensuel && <div><p className="text-green-400 font-bold text-sm">{Number(c.montant_mensuel).toFixed(2)}€/mois</p><p className="text-zinc-600 text-[10px]">Mensuel</p></div>}
                  </div>
                  {c.date_debut && <p className="text-zinc-600 text-[10px] mb-3">Du {new Date(c.date_debut).toLocaleDateString("fr-FR")}{c.date_fin ? ` au ${new Date(c.date_fin).toLocaleDateString("fr-FR")}` : ""}</p>}
                  <div className="flex gap-1.5 pt-3 border-t border-zinc-800">
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
              <h2 className="text-white font-bold">{viewing.titre}</h2>
              <div className="flex gap-2">
                <button onClick={() => openEdit(viewing)} className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white"><Pencil size={13} /></button>
                <button onClick={() => setViewing(null)} className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white"><X size={13} /></button>
              </div>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {[{ l: "Client", v: viewing.client_nom }, { l: "Type", v: viewing.type }, { l: "Statut", v: getStatut(viewing.statut).label }, { l: "Début", v: viewing.date_debut ? new Date(viewing.date_debut).toLocaleDateString("fr-FR") : "—" }, { l: "Fin", v: viewing.date_fin ? new Date(viewing.date_fin).toLocaleDateString("fr-FR") : "Indéterminé" }, { l: "Durée", v: viewing.duree_mois ? `${viewing.duree_mois} mois` : "—" }].filter(x => x.v).map(({ l, v }) => (
                  <div key={l} className="bg-zinc-900 rounded-xl p-3"><p className="text-zinc-600 text-[10px] uppercase tracking-wider mb-1">{l}</p><p className="text-zinc-200 text-sm font-medium">{v}</p></div>
                ))}
              </div>
              {(viewing.montant || viewing.montant_mensuel) && (
                <div className="grid grid-cols-2 gap-3">
                  {viewing.montant && <div className="bg-zinc-900 rounded-xl p-3"><p className="text-zinc-600 text-[10px] uppercase tracking-wider mb-1">Montant total</p><p className="text-white text-lg font-black">{Number(viewing.montant).toFixed(2)}€</p></div>}
                  {viewing.montant_mensuel && <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3"><p className="text-zinc-600 text-[10px] uppercase tracking-wider mb-1">Mensuel</p><p className="text-green-400 text-lg font-black">{Number(viewing.montant_mensuel).toFixed(2)}€</p></div>}
                </div>
              )}
              {viewing.notes && <div className="bg-zinc-900 rounded-xl p-3"><p className="text-zinc-600 text-[10px] uppercase tracking-wider mb-2">Notes</p><p className="text-zinc-300 text-sm">{viewing.notes}</p></div>}
            </div>
          </div>
        </div>
      )}

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111111] border border-zinc-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between p-5 border-b border-zinc-800">
              <h2 className="text-white font-bold">{editing ? "Modifier le contrat" : "Nouveau contrat"}</h2>
              <button onClick={() => setShowForm(false)} className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white"><X size={14} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div><label className="block text-zinc-500 text-[11px] uppercase tracking-wider mb-1.5">Titre <span className="text-red-400">*</span></label><input value={form.titre} onChange={e => setForm(f => ({ ...f, titre: e.target.value }))} placeholder="Nom du contrat" className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-500/60" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-zinc-500 text-[11px] uppercase tracking-wider mb-1.5">Client</label>
                  <select value={form.client_id || ""} onChange={e => { const cl = clients.find(c => c.id === e.target.value); setForm(f => ({ ...f, client_id: e.target.value || null, client_nom: cl?.nom || "" })) }} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none">
                    <option value="">— Sélectionner —</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
                  </select>
                </div>
                <div><label className="block text-zinc-500 text-[11px] uppercase tracking-wider mb-1.5">Type</label><select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none">{TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-zinc-500 text-[11px] uppercase tracking-wider mb-1.5">Statut</label><select value={form.statut} onChange={e => setForm(f => ({ ...f, statut: e.target.value }))} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none">{STATUTS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}</select></div>
                <div><label className="block text-zinc-500 text-[11px] uppercase tracking-wider mb-1.5">Durée (mois)</label><input type="number" value={form.duree_mois} onChange={e => setForm(f => ({ ...f, duree_mois: e.target.value }))} placeholder="Ex: 12" className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-500/60" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-zinc-500 text-[11px] uppercase tracking-wider mb-1.5">Montant total (€)</label><input type="number" value={form.montant} onChange={e => setForm(f => ({ ...f, montant: e.target.value }))} placeholder="0.00" className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-500/60" /></div>
                <div><label className="block text-zinc-500 text-[11px] uppercase tracking-wider mb-1.5">Mensuel (€)</label><input type="number" value={form.montant_mensuel} onChange={e => setForm(f => ({ ...f, montant_mensuel: e.target.value }))} placeholder="0.00" className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-500/60" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-zinc-500 text-[11px] uppercase tracking-wider mb-1.5">Date début <span className="text-red-400">*</span></label><input type="date" value={form.date_debut} onChange={e => setForm(f => ({ ...f, date_debut: e.target.value }))} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-500/60" /></div>
                <div><label className="block text-zinc-500 text-[11px] uppercase tracking-wider mb-1.5">Date fin</label><input type="date" value={form.date_fin} onChange={e => setForm(f => ({ ...f, date_fin: e.target.value }))} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-500/60" /></div>
              </div>
              <div><label className="block text-zinc-500 text-[11px] uppercase tracking-wider mb-1.5">Notes</label><textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={3} placeholder="Informations complémentaires..." className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-500/60 resize-none" /></div>
              <button onClick={save} disabled={saving || !form.titre.trim() || !form.date_debut} className="w-full py-3 rounded-xl text-black font-bold text-sm bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 transition-colors">{saving ? "Enregistrement..." : editing ? "Mettre à jour" : "Créer le contrat"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}