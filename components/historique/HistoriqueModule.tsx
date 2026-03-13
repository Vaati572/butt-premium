"use client"

import { useEffect, useState, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import { Search, Trash2, Pencil, X, Check, Filter, Download } from "lucide-react"

interface Props { activeSociety: any; profile: any }

interface HistEntry {
  id: string
  type: "vente" | "stock" | "depense" | "offert"
  date: string
  label: string
  montant?: number
  details?: string
  paiement?: string
  action?: string    // for stock
  raw: any
}

const TYPE_CONFIG = {
  vente:   { label: "Vente",    color: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",  emoji: "🛒" },
  stock:   { label: "Stock",    color: "text-blue-400 bg-blue-400/10 border-blue-400/20",         emoji: "📦" },
  depense: { label: "Dépense",  color: "text-red-400 bg-red-400/10 border-red-400/20",            emoji: "💸" },
  offert:  { label: "Offert",   color: "text-purple-400 bg-purple-400/10 border-purple-400/20",   emoji: "🎁" },
}

/* ── EDIT VENTE PANEL ─────────────────────── */
function EditVentePanel({ vente, onClose, onDone }: { vente: any; onClose: () => void; onDone: () => void }) {
  const [clientNom, setClientNom] = useState(vente.client_nom || "")
  const [paiement, setPaiement]   = useState(vente.paiement || "Espèces")
  const [notes, setNotes]         = useState(vente.notes || "")
  const [saving, setSaving]       = useState(false)

  const save = async () => {
    setSaving(true)
    await supabase.from("ventes").update({ client_nom: clientNom, paiement, notes }).eq("id", vente.id)
    setSaving(false); onDone(); onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-end z-50">
      <div className="bg-[#111111] border-l border-zinc-800 w-full max-w-sm h-full flex flex-col shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <div><h3 className="text-base font-bold text-white">Modifier la vente</h3></div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white"><X size={18}/></button>
        </div>
        <div className="flex-1 p-6 space-y-4 overflow-y-auto">
          <div>
            <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Client</label>
            <input value={clientNom} onChange={e => setClientNom(e.target.value)} placeholder="Nom du client"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-500/60"/>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Paiement</label>
            <div className="grid grid-cols-3 gap-1.5">
              {["Espèces","Carte Bancaire","Virement","Chèque","En attente"].map(p => (
                <button key={p} onClick={() => setPaiement(p)}
                  className={`py-2 rounded-lg text-[11px] font-semibold border transition-colors ${paiement===p ? "bg-yellow-500 text-black border-yellow-500" : "bg-zinc-800 text-zinc-400 border-zinc-700"}`}>
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Notes</label>
            <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes..."
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"/>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <p className="text-zinc-500 text-xs">Total : <span className="text-yellow-500 font-bold text-base">{Number(vente.total_ttc).toFixed(2)}€</span></p>
            <p className="text-zinc-600 text-xs mt-1">{new Date(vente.created_at).toLocaleString("fr-FR")}</p>
          </div>
        </div>
        <div className="p-6 border-t border-zinc-800 space-y-3">
          <button onClick={save} disabled={saving} className="w-full bg-yellow-500 hover:bg-yellow-400 disabled:opacity-40 text-black font-bold py-3 rounded-xl text-sm">
            {saving ? "Sauvegarde..." : "Sauvegarder"}
          </button>
          <button onClick={onClose} className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold py-2.5 rounded-xl text-sm">Annuler</button>
        </div>
      </div>
    </div>
  )
}

export default function HistoriqueModule({ activeSociety, profile }: Props) {
  const [entries, setEntries]       = useState<HistEntry[]>([])
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [dateFrom, setDateFrom]     = useState("")
  const [dateTo, setDateTo]         = useState("")
  const [editVente, setEditVente]   = useState<any>(null)
  const [page, setPage]             = useState(1)
  const PER_PAGE = 50

  const load = useCallback(async () => {
    if (!activeSociety?.id) return
    setLoading(true)

    const [
      { data: ventes },
      { data: stocks },
      { data: depenses },
    ] = await Promise.all([
      supabase.from("ventes").select("*, vente_items(*)")
        .eq("society_id", activeSociety.id)
        .order("created_at", { ascending: false })
        .limit(500),
      supabase.from("stock_history").select("*")
        .order("created_at", { ascending: false })
        .limit(500),
      supabase.from("depenses").select("*")
        .eq("society_id", activeSociety.id)
        .order("created_at", { ascending: false })
        .limit(500),
    ])

    const all: HistEntry[] = []

    // Ventes
    ;(ventes || []).forEach((v: any) => {
      const items = (v.vente_items || []).map((i: any) => `${i.produit_nom} ×${i.quantite}`).join(", ")
      all.push({
        id: v.id, type: "vente", date: v.created_at,
        label: v.client_nom || "Client de passage",
        montant: Number(v.total_ttc),
        details: items || undefined,
        paiement: v.paiement,
        raw: v,
      })
    })

    // Stocks
    ;(stocks || []).forEach((s: any) => {
      all.push({
        id: s.id, type: "stock", date: s.created_at,
        label: s.produit_nom,
        details: s.notes || undefined,
        action: s.action,
        montant: undefined,
        raw: s,
      })
    })

    // Dépenses & Offerts
    ;(depenses || []).forEach((d: any) => {
      const isOffert = d.type === "offert" || d.categorie?.toLowerCase().includes("offert")
      all.push({
        id: d.id, type: isOffert ? "offert" : "depense", date: d.created_at,
        label: d.description || d.libelle || "Dépense",
        montant: Number(d.montant || 0),
        details: d.categorie || undefined,
        raw: d,
      })
    })

    // Sort by date desc
    all.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    setEntries(all)
    setLoading(false)
  }, [activeSociety?.id])

  useEffect(() => { load() }, [load])

  const deleteEntry = async (entry: HistEntry) => {
    if (!confirm(`Supprimer cette entrée "${entry.label}" ?`)) return
    const table = entry.type === "vente" ? "ventes"
      : entry.type === "stock" ? "stock_history"
      : "depenses"
    await supabase.from(table).delete().eq("id", entry.id)
    setEntries(prev => prev.filter(e => e.id !== entry.id))
  }

  const exportCSV = () => {
    const rows = [["Date","Type","Libellé","Montant","Détails","Paiement"]]
    filtered.forEach(e => rows.push([
      new Date(e.date).toLocaleString("fr-FR"),
      e.type, e.label,
      e.montant != null ? e.montant.toFixed(2) : "",
      e.details || "", e.paiement || ""
    ]))
    const a = document.createElement("a")
    a.href = "data:text/csv;charset=utf-8," + encodeURIComponent(rows.map(r => r.join(";")).join("\n"))
    a.download = "historique.csv"; a.click()
  }

  const filtered = entries.filter(e => {
    if (typeFilter !== "all" && e.type !== typeFilter) return false
    if (dateFrom && e.date < dateFrom) return false
    if (dateTo && e.date > dateTo + "T23:59:59") return false
    if (search) {
      const s = search.toLowerCase()
      return e.label.toLowerCase().includes(s) || (e.details||"").toLowerCase().includes(s)
    }
    return true
  })

  const paginated = filtered.slice(0, page * PER_PAGE)

  const totalVentes   = filtered.filter(e => e.type === "vente").reduce((s, e) => s + (e.montant||0), 0)
  const totalDepenses = filtered.filter(e => e.type === "depense").reduce((s, e) => s + (e.montant||0), 0)
  const totalOfferts  = filtered.filter(e => e.type === "offert").reduce((s, e) => s + (e.montant||0), 0)

  return (
    <div className="flex-1 overflow-y-auto bg-[#0a0a0a]">
      <div className="p-6 max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-white">🕒 Historique</h1>
            <p className="text-zinc-500 text-sm mt-0.5">Toutes les actions — {filtered.length} entrée{filtered.length>1?"s":""}</p>
          </div>
          <button onClick={exportCSV}
            className="flex items-center gap-1.5 text-xs text-zinc-400 bg-zinc-900 border border-zinc-800 px-3 py-2 rounded-xl hover:bg-zinc-800">
            <Download size={13}/> Export CSV
          </button>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center">
            <p className="text-zinc-500 text-[10px] uppercase tracking-wider mb-1">Ventes</p>
            <p className="text-yellow-400 text-lg font-bold">{totalVentes.toFixed(2)}€</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center">
            <p className="text-zinc-500 text-[10px] uppercase tracking-wider mb-1">Dépenses</p>
            <p className="text-red-400 text-lg font-bold">{totalDepenses.toFixed(2)}€</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center">
            <p className="text-zinc-500 text-[10px] uppercase tracking-wider mb-1">Offerts</p>
            <p className="text-purple-400 text-lg font-bold">{totalOfferts.toFixed(2)}€</p>
          </div>
        </div>

        {/* Filtres */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <div className="relative flex-1 min-w-[160px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"/>
            <input type="text" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-500/50"/>
          </div>

          {/* Type filter buttons */}
          <div className="flex gap-1">
            {([
              { id: "all",     label: "Tout" },
              { id: "vente",   label: "🛒 Ventes" },
              { id: "stock",   label: "📦 Stock" },
              { id: "depense", label: "💸 Dépenses" },
              { id: "offert",  label: "🎁 Offerts" },
            ]).map(t => (
              <button key={t.id} onClick={() => { setTypeFilter(t.id); setPage(1) }}
                className={`px-3 py-2 rounded-lg text-[11px] font-semibold border transition-colors ${typeFilter===t.id ? "bg-yellow-500 text-black border-yellow-500" : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-600"}`}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Date range */}
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"/>
          <span className="text-zinc-600 text-xs">→</span>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"/>
          {(dateFrom || dateTo) && (
            <button onClick={() => { setDateFrom(""); setDateTo("") }} className="text-xs text-zinc-500 hover:text-white">✕</button>
          )}
        </div>

        {/* List */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin"/>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24 text-zinc-600">
            <p className="text-4xl mb-3">📭</p>
            <p className="text-sm">Aucune entrée trouvée</p>
          </div>
        ) : (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
            <div className="divide-y divide-zinc-800">
              {paginated.map(entry => {
                const cfg = TYPE_CONFIG[entry.type]
                return (
                  <div key={entry.id} className="flex items-start gap-3 px-5 py-3.5 group hover:bg-zinc-800/30 transition-colors">
                    {/* Type badge */}
                    <span className="text-lg shrink-0 mt-0.5">{cfg.emoji}</span>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${cfg.color}`}>
                          {entry.action || cfg.label}
                        </span>
                        <p className="text-white text-sm font-semibold truncate">{entry.label}</p>
                        {entry.paiement && (
                          <span className="text-zinc-600 text-[10px] bg-zinc-800 px-1.5 py-0.5 rounded">{entry.paiement}</span>
                        )}
                      </div>
                      {entry.details && (
                        <p className="text-zinc-500 text-xs mt-0.5 truncate">{entry.details}</p>
                      )}
                      <p className="text-zinc-700 text-[10px] mt-0.5">{new Date(entry.date).toLocaleString("fr-FR")}</p>
                    </div>

                    {/* Amount */}
                    {entry.montant != null && (
                      <div className="shrink-0 text-right">
                        <p className={`text-sm font-bold ${entry.type === "vente" ? "text-yellow-400" : entry.type === "depense" ? "text-red-400" : "text-purple-400"}`}>
                          {entry.type === "vente" ? "+" : "-"}{entry.montant.toFixed(2)}€
                        </p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      {entry.type === "vente" && (
                        <button onClick={() => setEditVente(entry.raw)}
                          className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-700">
                          <Pencil size={13}/>
                        </button>
                      )}
                      <button onClick={() => deleteEntry(entry)}
                        className="p-1.5 text-red-500 hover:text-red-400 rounded-lg hover:bg-red-500/10">
                        <Trash2 size={13}/>
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Load more */}
            {paginated.length < filtered.length && (
              <div className="py-3 text-center border-t border-zinc-800">
                <button onClick={() => setPage(p => p + 1)}
                  className="text-sm text-zinc-500 hover:text-yellow-400 transition-colors">
                  Charger plus ({filtered.length - paginated.length} restants)
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {editVente && (
        <EditVentePanel vente={editVente} onClose={() => setEditVente(null)} onDone={load} />
      )}
    </div>
  )
}