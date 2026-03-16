"use client"

import { useEffect, useState, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import { Search, Trash2, Pencil, X, Download, ChevronDown, ChevronUp } from "lucide-react"

interface Props { activeSociety: any; profile: any }

const TYPE_CONFIG = {
  vente:   { label: "Vente",   color: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20", emoji: "🛒" },
  stock:   { label: "Stock",   color: "text-blue-400 bg-blue-400/10 border-blue-400/20",        emoji: "📦" },
  depense: { label: "Dépense", color: "text-red-400 bg-red-400/10 border-red-400/20",           emoji: "💸" },
  offert:  { label: "Offert",  color: "text-purple-400 bg-purple-400/10 border-purple-400/20",  emoji: "🎁" },
}

function EditVenteModal({ vente, onClose, onDone }: { vente: any; onClose: () => void; onDone: () => void }) {
  const [clientNom, setClientNom] = useState(vente.client_nom || "")
  const [paiement, setPaiement]   = useState(vente.paiement || "Espèces")
  const [notes, setNotes]         = useState(vente.notes || "")
  const [dateStr, setDateStr]     = useState(vente.created_at?.split("T")[0] || "")
  const [saving, setSaving]       = useState(false)
  const save = async () => {
    setSaving(true)
    await supabase.from("ventes").update({ client_nom: clientNom, paiement, notes, created_at: dateStr ? new Date(dateStr+"T12:00:00").toISOString() : vente.created_at }).eq("id", vente.id)
    setSaving(false); onDone(); onClose()
  }
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-[#111111] border border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          <div><p className="text-white font-bold">Modifier la vente</p><p className="text-zinc-500 text-xs">{Number(vente.total_ttc).toFixed(2)}€</p></div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white"><X size={18}/></button>
        </div>
        <div className="p-5 space-y-3">
          <div><label className="block text-[11px] text-zinc-500 uppercase tracking-wider font-semibold mb-1.5">Client</label>
            <input value={clientNom} onChange={e=>setClientNom(e.target.value)} placeholder="Nom client" className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-500/60"/></div>
          <div><label className="block text-[11px] text-zinc-500 uppercase tracking-wider font-semibold mb-1.5">Date</label>
            <input type="date" value={dateStr} onChange={e=>setDateStr(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"/></div>
          <div><label className="block text-[11px] text-zinc-500 uppercase tracking-wider font-semibold mb-1.5">Paiement</label>
            <div className="flex gap-1.5 flex-wrap">
              {["Espèces","Carte Bancaire","Virement","Chèque","En attente"].map(p=>(
                <button key={p} onClick={()=>setPaiement(p)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${paiement===p?"bg-yellow-500 text-black border-yellow-500":"bg-zinc-800 text-zinc-400 border-zinc-700"}`}>{p}</button>
              ))}
            </div>
          </div>
          <div><label className="block text-[11px] text-zinc-500 uppercase tracking-wider font-semibold mb-1.5">Notes</label>
            <input value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Notes..." className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"/></div>
        </div>
        <div className="px-5 pb-5 flex gap-3">
          <button onClick={save} disabled={saving} className="flex-1 bg-yellow-500 hover:bg-yellow-400 disabled:opacity-40 text-black font-bold py-2.5 rounded-xl text-sm">{saving?"Sauvegarde...":"Sauvegarder"}</button>
          <button onClick={onClose} className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold rounded-xl text-sm">Annuler</button>
        </div>
      </div>
    </div>
  )
}

export default function HistoriqueModule({ activeSociety, profile }: Props) {
  const [ventes, setVentes]     = useState<any[]>([])
  const [stocks, setStocks]     = useState<any[]>([])
  const [depenses, setDepenses] = useState<any[]>([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState("")
  // ── Par défaut : afficher uniquement les ventes ──
  const [typeFilter, setTypeFilter] = useState<"all"|"vente"|"stock"|"depense"|"offert">("vente")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo]     = useState("")
  const [editVente, setEditVente] = useState<any>(null)
  const [expanded, setExpanded] = useState<string|null>(null)
  const [page, setPage]         = useState(1)
  const PER_PAGE = 60

  const load = useCallback(async () => {
    if (!activeSociety?.id) return
    setLoading(true)
    const [{ data: v }, { data: s }, { data: d }] = await Promise.all([
      supabase.from("ventes").select("*, vente_items(*)").eq("society_id", activeSociety.id).order("created_at", { ascending: false }).limit(500),
      supabase.from("stock_history").select("*").order("created_at", { ascending: false }).limit(500),
      supabase.from("depenses").select("*").eq("society_id", activeSociety.id).order("created_at", { ascending: false }).limit(500),
    ])
    setVentes(v||[]); setStocks(s||[]); setDepenses(d||[])
    setLoading(false)
  }, [activeSociety?.id])

  useEffect(() => { load() }, [load])

  const deleteVente = async (id: string) => {
    if (!confirm("Supprimer cette vente ?")) return
    await supabase.from("vente_items").delete().eq("vente_id", id)
    await supabase.from("ventes").delete().eq("id", id)
    setVentes(prev => prev.filter(v => v.id !== id))
  }
  const deleteStock = async (id: string) => {
    if (!confirm("Supprimer cette ligne ?")) return
    await supabase.from("stock_history").delete().eq("id", id)
    setStocks(prev => prev.filter(s => s.id !== id))
  }
  const deleteDepense = async (id: string) => {
    if (!confirm("Supprimer cette dépense ?")) return
    await supabase.from("depenses").delete().eq("id", id)
    setDepenses(prev => prev.filter(d => d.id !== id))
  }

  // Build entries
  const allEntries: any[] = []

  ventes.forEach(v => {
    if (typeFilter !== "all" && typeFilter !== "vente") return
    const label = v.client_nom || "Client de passage"
    const details = (v.vente_items||[]).map((i:any)=>`${i.produit_nom} ×${i.quantite}`).join(", ")
    if (search) { const s=search.toLowerCase(); if (!label.toLowerCase().includes(s) && !details.toLowerCase().includes(s) && !(v.notes||"").toLowerCase().includes(s)) return }
    if (dateFrom && v.created_at < dateFrom) return
    if (dateTo && v.created_at > dateTo+"T23:59:59") return
    allEntries.push({ _type:"vente", _date:v.created_at, _id:v.id, _raw:v, label, details, montant:Number(v.total_ttc), paiement:v.paiement, items:v.vente_items||[] })
  })

  stocks.forEach(s => {
    if (typeFilter !== "all" && typeFilter !== "stock") return
    if (search && !s.produit_nom?.toLowerCase().includes(search.toLowerCase())) return
    if (dateFrom && s.created_at < dateFrom) return
    if (dateTo && s.created_at > dateTo+"T23:59:59") return
    allEntries.push({ _type:"stock", _date:s.created_at, _id:s.id, _raw:s, label:s.produit_nom, details:s.notes, action:s.action })
  })

  depenses.forEach(d => {
    const isOffert = d.type==="offert"||(d.categorie||"").toLowerCase().includes("offert")
    const t = isOffert ? "offert" : "depense"
    if (typeFilter !== "all" && typeFilter !== t) return
    const label = d.description || d.libelle || "Dépense"
    if (search && !label.toLowerCase().includes(search.toLowerCase())) return
    if (dateFrom && d.created_at < dateFrom) return
    if (dateTo && d.created_at > dateTo+"T23:59:59") return
    allEntries.push({ _type:t, _date:d.created_at, _id:d.id, _raw:d, label, details:d.categorie, montant:Number(d.montant||0) })
  })

  allEntries.sort((a,b) => new Date(b._date).getTime() - new Date(a._date).getTime())
  const paginated = allEntries.slice(0, page*PER_PAGE)

  const totalVentes   = ventes.reduce((s,v)=>s+Number(v.total_ttc||0),0)
  const totalDepenses = depenses.filter(d=>d.type!=="offert").reduce((s,d)=>s+Number(d.montant||0),0)
  const totalOfferts  = depenses.filter(d=>d.type==="offert").reduce((s,d)=>s+Number(d.montant||0),0)

  const exportCSV = () => {
    const rows = [["Date","Type","Client/Libellé","Montant","Détails","Paiement"]]
    allEntries.forEach(e => rows.push([new Date(e._date).toLocaleString("fr-FR"),e._type,e.label,e.montant!=null?e.montant.toFixed(2):"",e.details||"",e.paiement||""]))
    const a = document.createElement("a"); a.href="data:text/csv;charset=utf-8,"+encodeURIComponent(rows.map(r=>r.join(";")).join("\n")); a.download="historique.csv"; a.click()
  }

  const FILTERS = [
    { id: "vente",   l: "🛒 Ventes"   },
    { id: "stock",   l: "📦 Stock"    },
    { id: "depense", l: "💸 Dépenses" },
    { id: "offert",  l: "🎁 Offerts"  },
    { id: "all",     l: "Tout"        },
  ] as const

  return (
    <div className="flex-1 overflow-y-auto bg-[#0a0a0a]">
      <div className="p-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-white">🕒 Historique</h1>
            <p className="text-zinc-500 text-sm mt-0.5">{allEntries.length} entrée{allEntries.length>1?"s":""}</p>
          </div>
          <button onClick={exportCSV} className="flex items-center gap-1.5 text-xs text-zinc-400 bg-zinc-900 border border-zinc-800 px-3 py-2 rounded-xl hover:bg-zinc-800">
            <Download size={13}/> Export CSV
          </button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label:"CA Ventes",  val:totalVentes,   c:"text-yellow-400", sub:`${ventes.length} vente${ventes.length>1?"s":""}` },
            { label:"Dépenses",   val:totalDepenses, c:"text-red-400",    sub:"" },
            { label:"Offerts",    val:totalOfferts,  c:"text-purple-400", sub:"" },
          ].map(({label,val,c,sub})=>(
            <div key={label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center">
              <p className="text-zinc-500 text-[10px] uppercase tracking-wider mb-1">{label}</p>
              <p className={`text-lg font-bold ${c}`}>{val.toFixed(2)}€</p>
              {sub && <p className="text-zinc-600 text-xs">{sub}</p>}
            </div>
          ))}
        </div>

        {/* Filtres */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <div className="relative flex-1 min-w-[160px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"/>
            <input type="text" placeholder="Rechercher..." value={search}
              onChange={e=>{setSearch(e.target.value);setPage(1)}}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-500/50"/>
          </div>

          {/* Boutons filtre — ventes en premier et actif par défaut */}
          <div className="flex gap-1 flex-wrap">
            {FILTERS.map(t=>(
              <button key={t.id} onClick={()=>{setTypeFilter(t.id as any);setPage(1)}}
                className={`px-3 py-2 rounded-lg text-[11px] font-semibold border transition-colors ${
                  typeFilter===t.id
                    ? "bg-yellow-500 text-black border-yellow-500"
                    : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-600"
                }`}>
                {t.l}
              </button>
            ))}
          </div>

          {/* Dates */}
          <input type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"/>
          <span className="text-zinc-600 text-xs">→</span>
          <input type="date" value={dateTo} onChange={e=>setDateTo(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"/>
          {(dateFrom||dateTo) && (
            <button onClick={()=>{setDateFrom("");setDateTo("")}} className="text-zinc-500 hover:text-white">✕</button>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin"/>
          </div>
        ) : allEntries.length===0 ? (
          <div className="text-center py-24 text-zinc-600">
            <p className="text-4xl mb-3">📭</p>
            <p className="text-sm">Aucune entrée</p>
          </div>
        ) : (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
            <div className="divide-y divide-zinc-800">
              {paginated.map(entry => {
                const cfg = TYPE_CONFIG[entry._type as keyof typeof TYPE_CONFIG]
                const isExpanded = expanded === entry._id
                const isVente = entry._type === "vente"
                return (
                  <div key={entry._id+entry._type} className="group">
                    <div className="flex items-start gap-3 px-5 py-3.5 hover:bg-zinc-800/30 transition-colors">
                      {isVente && entry.items?.length > 0 ? (
                        <button onClick={()=>setExpanded(isExpanded?null:entry._id)} className="text-zinc-500 hover:text-zinc-300 mt-0.5 shrink-0">
                          {isExpanded?<ChevronUp size={14}/>:<ChevronDown size={14}/>}
                        </button>
                      ) : <span className="text-lg shrink-0 mt-0.5">{cfg.emoji}</span>}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2 flex-wrap">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${cfg.color}`}>{entry.action||cfg.label}</span>
                          <p className="text-white text-sm font-semibold truncate">{entry.label}</p>
                          {entry.paiement && <span className="text-zinc-600 text-[10px] bg-zinc-800 px-1.5 py-0.5 rounded">{entry.paiement}</span>}
                        </div>
                        {!isExpanded && entry.details && <p className="text-zinc-500 text-xs mt-0.5 truncate">{entry.details}</p>}
                        <p className="text-zinc-700 text-[10px] mt-0.5">{new Date(entry._date).toLocaleString("fr-FR")}</p>
                      </div>
                      {entry.montant!=null && (
                        <div className="shrink-0 text-right">
                          <p className={`text-sm font-bold ${entry._type==="vente"?"text-yellow-400":entry._type==="depense"?"text-red-400":"text-purple-400"}`}>
                            {entry._type==="vente"?"+":"-"}{entry.montant.toFixed(2)}€
                          </p>
                        </div>
                      )}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        {entry._type==="vente" && (
                          <button onClick={()=>setEditVente(entry._raw)} className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-700"><Pencil size={13}/></button>
                        )}
                        <button onClick={()=>{
                          if(entry._type==="vente") deleteVente(entry._id)
                          else if(entry._type==="stock") deleteStock(entry._id)
                          else deleteDepense(entry._id)
                        }} className="p-1.5 text-red-500 hover:text-red-400 rounded-lg hover:bg-red-500/10"><Trash2 size={13}/></button>
                      </div>
                    </div>
                    {isExpanded && isVente && entry.items?.length>0 && (
                      <div className="px-5 pb-3 pl-12 space-y-1 border-t border-zinc-800/60 pt-2 bg-zinc-900/30">
                        {entry.items.map((item:any)=>(
                          <div key={item.id} className="flex items-center justify-between">
                            <span className="text-zinc-400 text-xs">{item.produit_nom} <span className="text-zinc-600">×{item.quantite}</span></span>
                            <span className="text-zinc-300 text-xs font-semibold">{Number(item.total).toFixed(2)}€</span>
                          </div>
                        ))}
                        <div className="flex items-center justify-between pt-1 border-t border-zinc-800">
                          <span className="text-zinc-500 text-xs">Total</span>
                          <span className="text-yellow-400 text-sm font-bold">{entry.montant?.toFixed(2)}€</span>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
            {paginated.length < allEntries.length && (
              <div className="py-3 text-center border-t border-zinc-800">
                <button onClick={()=>setPage(p=>p+1)} className="text-sm text-zinc-500 hover:text-yellow-400 transition-colors">
                  Charger plus ({allEntries.length-paginated.length} restants)
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      {editVente && <EditVenteModal vente={editVente} onClose={()=>setEditVente(null)} onDone={load}/>}
    </div>
  )
}