"use client"

import { useEffect, useState, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import {
  Plus, X, Search, Phone, Mail, MapPin,
  Pencil, Trash2, Building2, Euro, TrendingUp,
  Package, Check, Calendar
} from "lucide-react"

interface Props { activeSociety: any; profile: any }
interface Pharmacie {
  id: string; nom: string; responsable?: string; telephone?: string; email?: string
  adresse?: string; ville?: string; cp?: string; notes?: string
  remise?: number; contrat?: string; created_at?: string
}

function initials(nom: string) {
  return (nom||"?").split(" ").map(n=>n[0]).join("").toUpperCase().slice(0,2)
}

const COLORS = ["#22c55e","#3b82f6","#a855f7","#f97316","#ec4899","#14b8a6"]
const avatarColor = (nom: string) => COLORS[(nom?.charCodeAt(0)||0) % COLORS.length]

/* ── FORM ─────────────────────────────────── */
function PharmacieForm({ societyId, profile, pharmacie, onClose, onDone }: {
  societyId: string; profile: any; pharmacie?: Pharmacie; onClose: ()=>void; onDone: ()=>void
}) {
  const [form, setForm] = useState({
    nom: pharmacie?.nom||"", responsable: pharmacie?.responsable||"",
    telephone: pharmacie?.telephone||"", email: pharmacie?.email||"",
    adresse: pharmacie?.adresse||"", ville: pharmacie?.ville||"", cp: pharmacie?.cp||"",
    contrat: pharmacie?.contrat||"Aucun", remise: String(pharmacie?.remise||""),
    notes: pharmacie?.notes||"",
  })
  const [saving, setSaving] = useState(false)
  const set = (k: string, v: string) => setForm(p=>({...p,[k]:v}))

  const save = async () => {
    if (!form.nom.trim()) return
    setSaving(true)
    const data = {
      society_id: societyId, user_id: profile.id,
      nom: form.nom.trim(), responsable: form.responsable,
      telephone: form.telephone, email: form.email,
      adresse: form.adresse, ville: form.ville, cp: form.cp,
      contrat: form.contrat, remise: parseFloat(form.remise)||0,
      notes: form.notes,
    }
    if (pharmacie?.id) await supabase.from("pharmacies").update(data).eq("id", pharmacie.id)
    else await supabase.from("pharmacies").insert(data)
    setSaving(false); onDone(); onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-end z-50">
      <div className="bg-[#111111] border-l border-zinc-800 w-full max-w-md h-full flex flex-col shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-zinc-800">
          <h3 className="text-base font-bold text-white">{pharmacie?"Modifier":"Nouvelle"} pharmacie</h3>
          <button onClick={onClose} className="text-zinc-500 hover:text-white"><X size={18}/></button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div><label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Nom *</label>
            <input value={form.nom} onChange={e=>set("nom",e.target.value)} placeholder="Pharmacie du Centre"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-green-500/60"/></div>
          <div><label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Responsable</label>
            <input value={form.responsable} onChange={e=>set("responsable",e.target.value)} placeholder="Dr. Martin"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"/></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">📞 Téléphone</label>
              <input value={form.telephone} onChange={e=>set("telephone",e.target.value)} placeholder="03 xx xx xx xx"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"/></div>
            <div><label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">✉️ Email</label>
              <input value={form.email} onChange={e=>set("email",e.target.value)} placeholder="contact@..."
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"/></div>
          </div>
          <div><label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">📍 Adresse</label>
            <input value={form.adresse} onChange={e=>set("adresse",e.target.value)} placeholder="Rue et numéro"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none mb-2"/>
            <div className="grid grid-cols-3 gap-2">
              <input value={form.cp} onChange={e=>set("cp",e.target.value)} placeholder="CP"
                className="bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"/>
              <input value={form.ville} onChange={e=>set("ville",e.target.value)} placeholder="Ville"
                className="col-span-2 bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"/>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Contrat</label>
              <select value={form.contrat} onChange={e=>set("contrat",e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none">
                {["Aucun","Dépôt-vente","Grossiste","Partenaire"].map(c=><option key={c}>{c}</option>)}
              </select></div>
            <div><label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Remise (%)</label>
              <input type="number" min="0" max="100" step="0.5" value={form.remise} onChange={e=>set("remise",e.target.value)}
                placeholder="0" className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"/></div>
          </div>
          <div><label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">📝 Notes</label>
            <textarea value={form.notes} onChange={e=>set("notes",e.target.value)} rows={3}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none resize-none"/></div>
        </div>
        <div className="p-5 border-t border-zinc-800 flex gap-3">
          <button onClick={save} disabled={saving||!form.nom.trim()}
            className="flex-1 bg-green-500 hover:bg-green-400 disabled:opacity-40 text-black font-bold py-3 rounded-xl text-sm">
            {saving?"Sauvegarde...":pharmacie?"Modifier":"Créer la pharmacie"}
          </button>
          <button onClick={onClose} className="px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold rounded-xl text-sm">Annuler</button>
        </div>
      </div>
    </div>
  )
}

/* ── TARIFS PANEL ────────────────────────── */
function TarifsPanel({ pharmacie, societyId, onClose }: { pharmacie: Pharmacie; societyId: string; onClose: ()=>void }) {
  const [products, setProducts] = useState<any[]>([])
  const [prixMap, setPrixMap]   = useState<Record<string,number>>({})
  const [baseGamme, setBaseGamme] = useState<"Particuliers"|"Professionnels">("Particuliers")
  const [saving, setSaving]     = useState(false)
  const [saved, setSaved]       = useState(false)

  useEffect(() => {
    const load = async () => {
      const [{ data: prods }, { data: cp }] = await Promise.all([
        supabase.from("products").select("id,name,gamme,pv").eq("society_id",societyId).order("gamme").order("name"),
        supabase.from("client_prix").select("*").eq("client_id", pharmacie.id),
      ])
      setProducts(prods||[])
      const map: Record<string,number> = {}
      ;(cp||[]).forEach((p:any) => { map[p.product_id] = p.prix })
      setPrixMap(map)
    }
    load()
  }, [pharmacie.id, societyId])

  const applyBase = () => {
    const map = {...prixMap}
    products.forEach(p => { if (p.gamme===baseGamme) map[p.id]=Number(p.pv) })
    setPrixMap(map)
  }

  const saveTarifs = async () => {
    setSaving(true)
    await supabase.from("client_prix").delete().eq("client_id", pharmacie.id)
    const rows = Object.entries(prixMap).filter(([_,v])=>v>0).map(([product_id,prix])=>({ client_id: pharmacie.id, product_id, prix }))
    if (rows.length>0) await supabase.from("client_prix").insert(rows)
    setSaving(false); setSaved(true); setTimeout(()=>setSaved(false),2000)
  }

  const gammes = [...new Set(products.map(p=>p.gamme))]
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-end z-50">
      <div className="bg-[#111111] border-l border-zinc-800 w-full max-w-lg h-full flex flex-col shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-zinc-800">
          <div><h3 className="text-base font-bold text-white">💰 Tarifs — {pharmacie.nom}</h3>
            <p className="text-zinc-500 text-xs mt-0.5">Prix spécifiques pour cette pharmacie</p></div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white"><X size={18}/></button>
        </div>
        <div className="px-5 py-3 border-b border-zinc-800 flex items-center gap-3">
          <p className="text-zinc-400 text-xs">Partir de :</p>
          {(["Particuliers","Professionnels"] as const).map(g=>(
            <button key={g} onClick={()=>setBaseGamme(g)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${baseGamme===g?"bg-yellow-500 text-black border-yellow-500":"bg-zinc-800 text-zinc-400 border-zinc-700"}`}>
              {g==="Particuliers"?"👤 Particuliers":"🏢 Pro"}
            </button>
          ))}
          <button onClick={applyBase} className="text-xs text-blue-400 bg-blue-400/10 border border-blue-400/20 px-2.5 py-1.5 rounded-lg hover:bg-blue-400/20">↩ Appliquer</button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {gammes.map(gamme=>(
            <div key={gamme}>
              <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-2">{gamme}</p>
              <div className="space-y-2">
                {products.filter(p=>p.gamme===gamme).map(p=>(
                  <div key={p.id} className="flex items-center gap-3 bg-zinc-800/60 border border-zinc-700 rounded-xl px-4 py-2.5">
                    <p className="flex-1 text-sm text-white truncate">{p.name}</p>
                    <p className="text-zinc-500 text-xs shrink-0">PV: {Number(p.pv).toFixed(2)}€</p>
                    <input type="number" min="0" step="0.01" value={prixMap[p.id]??""} placeholder={Number(p.pv).toFixed(2)}
                      onChange={e=>setPrixMap(prev=>({...prev,[p.id]:parseFloat(e.target.value)||0}))}
                      className="w-24 bg-zinc-700 border border-zinc-600 rounded-lg px-3 py-1.5 text-sm text-white text-right focus:outline-none focus:border-yellow-500/60"/>
                    {prixMap[p.id]!=null&&prixMap[p.id]!==Number(p.pv)&&(
                      <span className={`text-[10px] font-bold shrink-0 ${prixMap[p.id]<Number(p.pv)?"text-blue-400":"text-red-400"}`}>
                        {prixMap[p.id]<Number(p.pv)?"▼":"▲"}{Math.abs(prixMap[p.id]-Number(p.pv)).toFixed(2)}€
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="p-5 border-t border-zinc-800 flex gap-3">
          <button onClick={saveTarifs} disabled={saving}
            className={`flex-1 font-bold py-3 rounded-xl text-sm flex items-center justify-center gap-2 ${saved?"bg-green-500 text-white":"bg-yellow-500 hover:bg-yellow-400 text-black disabled:opacity-40"}`}>
            {saved?<><Check size={15}/> Sauvegardé!</>:saving?"...":"💾 Sauvegarder"}
          </button>
          <button onClick={onClose} className="px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold rounded-xl text-sm">Fermer</button>
        </div>
      </div>
    </div>
  )
}

/* ── CARD ─────────────────────────────────── */
function PharmacieCard({ pharma, accentColor, onEdit, onDelete, onTarifs, ca, nbAchats }: {
  pharma: Pharmacie; accentColor: string; onEdit:()=>void; onDelete:()=>void; onTarifs:()=>void
  ca: number; nbAchats: number
}) {
  const bg = avatarColor(pharma.nom)
  const hasCA = ca > 0
  return (
    <div className="group relative bg-[#111111] border border-zinc-800/80 rounded-2xl overflow-hidden flex flex-col hover:border-zinc-600 transition-all hover:shadow-xl hover:shadow-black/40">
      <div className="h-0.5 w-full" style={{ background: `linear-gradient(90deg, ${bg}80, transparent)` }}/>
      <div className="flex items-center gap-3 px-4 pt-4 pb-3">
        <div className="w-11 h-11 rounded-xl overflow-hidden flex items-center justify-center text-white font-black text-sm ring-2 ring-black shrink-0"
          style={{ backgroundColor: bg }}>
          {initials(pharma.nom)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-sm truncate">{pharma.nom}</p>
          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            {pharma.contrat && pharma.contrat !== "Aucun" && (
              <span className="text-[10px] font-semibold text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded-md">{pharma.contrat}</span>
            )}
            {pharma.remise && pharma.remise > 0 && (
              <span className="text-[10px] font-semibold text-blue-400 bg-blue-400/10 px-1.5 py-0.5 rounded-md">-{pharma.remise}%</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          <button onClick={onTarifs} className="w-7 h-7 flex items-center justify-center text-blue-400 hover:text-blue-300 rounded-lg hover:bg-blue-400/10 transition-colors" title="Tarifs perso">
            <Euro size={13}/>
          </button>
          <button onClick={onEdit} className="w-7 h-7 flex items-center justify-center text-zinc-500 hover:text-white rounded-lg hover:bg-zinc-700 transition-colors">
            <Pencil size={13}/>
          </button>
          <button onClick={onDelete} className="w-7 h-7 flex items-center justify-center text-zinc-700 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-colors">
            <Trash2 size={13}/>
          </button>
        </div>
      </div>
      <div className="mx-4 h-px bg-zinc-800/60"/>
      <div className="px-4 py-3 space-y-1.5 flex-1">
        {pharma.responsable && (
          <div className="flex items-center gap-2.5">
            <div className="w-5 h-5 rounded-md bg-zinc-800 flex items-center justify-center shrink-0">
              <span className="text-[9px]">👤</span>
            </div>
            <span className="text-zinc-300 text-xs font-medium">{pharma.responsable}</span>
          </div>
        )}
        {pharma.telephone && (
          <a href={`tel:${pharma.telephone}`} className="flex items-center gap-2.5 group/link">
            <div className="w-5 h-5 rounded-md bg-zinc-800 flex items-center justify-center shrink-0">
              <Phone size={10} className="text-zinc-400"/>
            </div>
            <span className="text-zinc-300 text-xs group-hover/link:text-white transition-colors">{pharma.telephone}</span>
          </a>
        )}
        {pharma.email && (
          <a href={`mailto:${pharma.email}`} className="flex items-center gap-2.5 group/link">
            <div className="w-5 h-5 rounded-md bg-zinc-800 flex items-center justify-center shrink-0">
              <Mail size={10} className="text-zinc-400"/>
            </div>
            <span className="text-zinc-400 text-xs truncate group-hover/link:text-white transition-colors">{pharma.email}</span>
          </a>
        )}
        {(pharma.adresse || pharma.ville) && (
          <div className="flex items-start gap-2.5">
            <div className="w-5 h-5 rounded-md bg-zinc-800 flex items-center justify-center shrink-0 mt-0.5">
              <MapPin size={10} className="text-zinc-400"/>
            </div>
            <span className="text-zinc-500 text-xs leading-snug">
              {[pharma.adresse, pharma.cp&&pharma.ville?`${pharma.cp} ${pharma.ville}`:pharma.ville].filter(Boolean).join(", ")}
            </span>
          </div>
        )}
        {pharma.notes && (
          <div className="flex items-start gap-2.5 pt-0.5">
            <div className="w-5 h-5 rounded-md bg-zinc-800/60 flex items-center justify-center shrink-0 mt-0.5">
              <span className="text-[9px]">📝</span>
            </div>
            <p className="text-zinc-500 text-[11px] italic leading-relaxed line-clamp-2">{pharma.notes}</p>
          </div>
        )}
      </div>
      <div className="mx-4 h-px bg-zinc-800/60"/>
      <div className="px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <TrendingUp size={11} style={{ color: hasCA ? accentColor : "#52525b" }}/>
          <span className={`text-xs font-bold ${hasCA?"":"text-zinc-600"}`} style={hasCA?{color:accentColor}:{}}>
            {ca.toFixed(2)}€
          </span>
          {nbAchats > 0 && <><span className="text-zinc-700 text-[10px]">·</span><span className="text-zinc-500 text-[10px]">{nbAchats} cmd</span></>}
        </div>
        {pharma.created_at && (
          <span className="text-zinc-700 text-[10px]">
            {new Date(pharma.created_at).toLocaleDateString("fr-FR",{month:"short",year:"numeric"})}
          </span>
        )}
      </div>
    </div>
  )
}

/* ══ MAIN ══════════════════════════════════ */
export default function PharmaciesModule({ activeSociety, profile }: Props) {
  const [pharmacies, setPharmacies] = useState<any[]>([])
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState("")
  const [showForm, setShowForm]     = useState(false)
  const [editPharma, setEditPharma] = useState<Pharmacie|null>(null)
  const [tarifsPharma, setTarifsPharma] = useState<Pharmacie|null>(null)
  const [sortBy, setSortBy]         = useState<"nom"|"ca">("nom")

  const load = useCallback(async () => {
    if (!activeSociety?.id) return
    setLoading(true)
    const { data: ph } = await supabase.from("pharmacies").select("*").eq("society_id",activeSociety.id).order("nom")
    if (!ph) { setLoading(false); return }
    const { data: ventes } = await supabase.from("ventes").select("client_id,total_ttc").eq("society_id",activeSociety.id).eq("type_client","pharmacie")
    const caMap: Record<string,{total:number;count:number}> = {}
    ;(ventes||[]).forEach((v:any) => {
      if (!caMap[v.client_id]) caMap[v.client_id]={total:0,count:0}
      caMap[v.client_id].total += Number(v.total_ttc||0)
      caMap[v.client_id].count += 1
    })
    setPharmacies(ph.map(p=>({...p, ca_total: caMap[p.id]?.total||0, nb_achats: caMap[p.id]?.count||0})))
    setLoading(false)
  }, [activeSociety?.id])

  useEffect(() => { load() }, [load])

  const deletePharma = async (id: string) => {
    if (!confirm("Supprimer cette pharmacie ?")) return
    await supabase.from("pharmacies").delete().eq("id", id)
    setPharmacies(prev => prev.filter(p => p.id !== id))
  }

  const filtered = pharmacies
    .filter(p => p.nom?.toLowerCase().includes(search.toLowerCase()) || p.ville?.toLowerCase().includes(search.toLowerCase()) || p.responsable?.toLowerCase().includes(search.toLowerCase()))
    .sort((a,b) => sortBy==="ca" ? (b.ca_total||0)-(a.ca_total||0) : a.nom.localeCompare(b.nom))

  const totalCA = pharmacies.reduce((s,p)=>s+(p.ca_total||0),0)
  const accentColor = "#22c55e"

  return (
    <div className="flex-1 overflow-y-auto bg-[#0a0a0a]">
      <div className="p-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-white">🏥 Pharmacies</h1>
            <p className="text-zinc-500 text-sm mt-0.5">{pharmacies.length} pharmacie{pharmacies.length>1?"s":""} · CA total : <span className="font-bold" style={{color:accentColor}}>{totalCA.toFixed(2)}€</span></p>
          </div>
          <button onClick={()=>{setEditPharma(null);setShowForm(true)}}
            className="flex items-center gap-2 font-bold px-4 py-2.5 rounded-xl text-sm shadow-lg text-black" style={{backgroundColor:accentColor}}>
            <Plus size={16}/> Nouvelle pharmacie
          </button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label:"Pharmacies", value:pharmacies.length, sub: `${pharmacies.filter(p=>p.contrat&&p.contrat!=="Aucun").length} avec contrat` },
            { label:"CA moyen", value: pharmacies.length>0?(totalCA/pharmacies.length).toFixed(0)+"€":"—", sub:"par pharmacie" },
            { label:"Meilleure",  value: pharmacies.length>0?pharmacies.sort((a,b)=>(b.ca_total||0)-(a.ca_total||0))[0]?.nom?.split(" ").slice(0,2).join(" ")||"—":"—", sub:(pharmacies[0]?.ca_total||0).toFixed(0)+"€" },
          ].map(({label,value,sub})=>(
            <div key={label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <p className="text-zinc-500 text-[10px] uppercase tracking-wider mb-1">{label}</p>
              <p className="text-white text-xl font-bold">{value}</p>
              {sub&&<p className="text-zinc-600 text-xs mt-0.5">{sub}</p>}
            </div>
          ))}
        </div>

        {/* Filtres */}
        <div className="flex items-center gap-2 mb-5 flex-wrap">
          <div className="relative flex-1 min-w-[180px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"/>
            <input type="text" placeholder="Nom, ville, responsable..." value={search} onChange={e=>setSearch(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-green-500/50"/>
          </div>
          <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-xl p-1">
            {([["nom","A-Z"],["ca","CA ↓"]] as const).map(([val,lbl])=>(
              <button key={val} onClick={()=>setSortBy(val)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${sortBy===val?"bg-zinc-700 text-white":"text-zinc-500 hover:text-zinc-300"}`}>
                {lbl}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{borderColor:accentColor}}/>
          </div>
        ) : filtered.length===0 ? (
          <div className="text-center py-24 text-zinc-600">
            <Building2 size={48} className="mx-auto mb-4 opacity-20"/>
            <p className="text-base font-semibold text-zinc-500 mb-2">Aucune pharmacie{search?" trouvée":""}</p>
            {!search && <button onClick={()=>setShowForm(true)} className="mt-4 font-bold px-5 py-2.5 rounded-xl text-sm inline-flex items-center gap-2 text-black" style={{backgroundColor:accentColor}}><Plus size={15}/> Ajouter</button>}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map(p=>(
              <PharmacieCard key={p.id} pharma={p} accentColor={accentColor}
                ca={p.ca_total||0} nbAchats={p.nb_achats||0}
                onEdit={()=>{setEditPharma(p);setShowForm(true)}}
                onDelete={()=>deletePharma(p.id)}
                onTarifs={()=>setTarifsPharma(p)}
              />
            ))}
          </div>
        )}
      </div>

      {showForm && <PharmacieForm societyId={activeSociety.id} profile={profile} pharmacie={editPharma||undefined} onClose={()=>{setShowForm(false);setEditPharma(null)}} onDone={load}/>}
      {tarifsPharma && <TarifsPanel pharmacie={tarifsPharma} societyId={activeSociety.id} onClose={()=>setTarifsPharma(null)}/>}
    </div>
  )
}