"use client"

import { useEffect, useState, useMemo, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import { useUserSettings } from "@/lib/UserSettingsContext"

interface Props {
  activeSociety: any
  profile: any
}

type EntryType = "all" | "vente" | "stock" | "depense" | "offert"

const TYPE_META: Record<string, { label: string; emoji: string; color: string; bg: string; border: string }> = {
  vente:   { label: "Vente",   emoji: "🛒", color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/25" },
  stock:   { label: "Stock",   emoji: "📦", color: "text-blue-400",   bg: "bg-blue-500/10",   border: "border-blue-500/25" },
  depense: { label: "Dépense", emoji: "💸", color: "text-rose-400",   bg: "bg-rose-500/10",   border: "border-rose-500/25" },
  offert:  { label: "Offert",  emoji: "🎁", color: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/25" },
}

const PAIEMENTS = ["Espèces", "CB", "Virement", "Chèque", "En attente"]

const formatEuro = (n: number) =>
  n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €"

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" })

const formatTime = (d: string) =>
  new Date(d).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })

const dayKey = (d: string) => d.slice(0, 10)

export default function HistoriqueModule({ activeSociety, profile }: Props) {
  const { settings } = useUserSettings()
  const ACCENT = settings.accent_color || "#eab308"

  const [ventes, setVentes] = useState<any[]>([])
  const [stocks, setStocks] = useState<any[]>([])
  const [depenses, setDepenses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState<EntryType>("all")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [expanded, setExpanded] = useState<string | null>(null)
  const [editVente, setEditVente] = useState<any>(null)
  const [page, setPage] = useState(1)
  const PER_PAGE = 40

  const load = useCallback(async () => {
    if (!activeSociety?.id) return
    setLoading(true)
    const [v, s, d] = await Promise.all([
      supabase.from("ventes").select("*, vente_items(*)")
        .eq("society_id", activeSociety.id)
        .order("created_at", { ascending: false })
        .limit(600),
      supabase.from("stock_history").select("*")
        .order("created_at", { ascending: false })
        .limit(400),
      supabase.from("depenses").select("*")
        .eq("society_id", activeSociety.id)
        .order("created_at", { ascending: false })
        .limit(400),
    ])
    setVentes(v.data || [])
    setStocks(s.data || [])
    setDepenses(d.data || [])
    setLoading(false)
  }, [activeSociety?.id])

  useEffect(() => { load() }, [load])
  useEffect(() => { setPage(1) }, [search, typeFilter, dateFrom, dateTo])

  // ─── Build unified timeline ───
  const entries = useMemo(() => {
    const all: any[] = []

    ventes.forEach(v => {
      if (typeFilter !== "all" && typeFilter !== "vente") return
      const label = v.client_nom || "Client de passage"
      const details = (v.vente_items || []).map((i: any) => `${i.produit_nom} ×${i.quantite}`).join(", ")
      if (search) {
        const s = search.toLowerCase()
        if (!label.toLowerCase().includes(s) && !details.toLowerCase().includes(s) && !(v.notes || "").toLowerCase().includes(s)) return
      }
      if (dateFrom && v.created_at < dateFrom) return
      if (dateTo && v.created_at > dateTo + "T23:59:59") return
      all.push({
        _type: "vente", _date: v.created_at, _id: v.id, _raw: v,
        label, details, montant: Number(v.total_ttc || 0),
        paiement: v.paiement, items: v.vente_items || [], notes: v.notes,
      })
    })

    stocks.forEach(s => {
      if (typeFilter !== "all" && typeFilter !== "stock") return
      if (search && !s.produit_nom?.toLowerCase().includes(search.toLowerCase()) && !(s.notes || "").toLowerCase().includes(search.toLowerCase())) return
      if (dateFrom && s.created_at < dateFrom) return
      if (dateTo && s.created_at > dateTo + "T23:59:59") return
      all.push({
        _type: "stock", _date: s.created_at, _id: s.id, _raw: s,
        label: s.produit_nom, details: s.notes, action: s.action,
        quantite: s.quantite, quantite_avant: s.quantite_avant, quantite_apres: s.quantite_apres,
      })
    })

    depenses.forEach(d => {
      const isOffert = d.type === "offert" || (d.categorie || "").toLowerCase().includes("offert")
      const t = isOffert ? "offert" : "depense"
      if (typeFilter !== "all" && typeFilter !== t) return
      const label = d.description || d.libelle || (isOffert ? "Offert" : "Dépense")
      if (search && !label.toLowerCase().includes(search.toLowerCase()) && !(d.categorie || "").toLowerCase().includes(search.toLowerCase())) return
      if (dateFrom && d.created_at < dateFrom) return
      if (dateTo && d.created_at > dateTo + "T23:59:59") return
      all.push({
        _type: t, _date: d.created_at, _id: d.id, _raw: d,
        label, details: d.categorie, montant: Number(d.montant || 0),
      })
    })

    all.sort((a, b) => new Date(b._date).getTime() - new Date(a._date).getTime())
    return all
  }, [ventes, stocks, depenses, search, typeFilter, dateFrom, dateTo])

  // Group by day
  const grouped = useMemo(() => {
    const map: Record<string, any[]> = {}
    entries.forEach(e => {
      const k = dayKey(e._date)
      if (!map[k]) map[k] = []
      map[k].push(e)
    })
    return Object.entries(map).sort(([a], [b]) => b.localeCompare(a))
  }, [entries])

  const visible = useMemo(() => {
    const flat = grouped.flatMap(([, items]) => items)
    return flat.slice(0, page * PER_PAGE)
  }, [grouped, page])

  const visibleGrouped = useMemo(() => {
    const map: Record<string, any[]> = {}
    visible.forEach(e => {
      const k = dayKey(e._date)
      if (!map[k]) map[k] = []
      map[k].push(e)
    })
    return Object.entries(map).sort(([a], [b]) => b.localeCompare(a))
  }, [visible])

  // KPIs (on filtered set)
  const kpi = useMemo(() => {
    const v = entries.filter(e => e._type === "vente")
    const d = entries.filter(e => e._type === "depense")
    const o = entries.filter(e => e._type === "offert")
    const s = entries.filter(e => e._type === "stock")
    const ca = v.reduce((sum, e) => sum + (e.montant || 0), 0)
    const dep = d.reduce((sum, e) => sum + (e.montant || 0), 0)
    const off = o.reduce((sum, e) => sum + (e.montant || 0), 0)
    return {
      ca,
      nbVentes: v.length,
      depenses: dep,
      offerts: off,
      stocks: s.length,
      net: ca - dep,
      total: entries.length,
    }
  }, [entries])

  const deleteEntry = async (e: any) => {
    if (!confirm("Supprimer définitivement cet élément ?")) return
    if (e._type === "vente") {
      await supabase.from("vente_items").delete().eq("vente_id", e._id)
      await supabase.from("ventes").delete().eq("id", e._id)
    } else if (e._type === "stock") {
      await supabase.from("stock_history").delete().eq("id", e._id)
    } else {
      await supabase.from("depenses").delete().eq("id", e._id)
    }
    load()
  }

  const exportCSV = () => {
    const rows = [["Date", "Type", "Libellé", "Montant", "Détails", "Paiement"]]
    entries.forEach(e => {
      rows.push([
        new Date(e._date).toLocaleString("fr-FR"),
        e._type,
        e.label,
        e.montant != null ? e.montant.toFixed(2) : "",
        e.details || e.action || "",
        e.paiement || "",
      ])
    })
    const a = document.createElement("a")
    a.href = "data:text/csv;charset=utf-8," + encodeURIComponent(rows.map(r => r.join(";")).join("\n"))
    a.download = `historique_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
  }

  const hasMore = visible.length < entries.length

  return (
    <div className="h-full overflow-y-auto bg-[#0a0a0a]">
      <div className="p-5 max-w-5xl mx-auto space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl font-bold text-white">Historique</h1>
            <p className="text-sm text-zinc-500 mt-0.5">
              {kpi.total} événement{kpi.total > 1 ? "s" : ""}
              {(dateFrom || dateTo || search || typeFilter !== "all") && " (filtrés)"}
            </p>
          </div>
          <button
            onClick={exportCSV}
            disabled={entries.length === 0}
            className="h-9 px-3 rounded-xl text-xs font-medium text-zinc-400 border border-zinc-800 hover:text-white hover:bg-zinc-800 disabled:opacity-40 transition"
          >
            ↓ Export CSV
          </button>
        </div>

        {/* KPI */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[
            { label: "CA ventes", value: formatEuro(kpi.ca), color: ACCENT, sub: `${kpi.nbVentes} vente${kpi.nbVentes > 1 ? "s" : ""}` },
            { label: "Dépenses", value: formatEuro(kpi.depenses), color: "#f87171", sub: "sorties" },
            { label: "Offerts", value: formatEuro(kpi.offerts), color: "#c084fc", sub: "cadeaux" },
            { label: "Mouvements stock", value: String(kpi.stocks), color: "#60a5fa", sub: "actions" },
            { label: "Net estimé", value: formatEuro(kpi.net), color: kpi.net >= 0 ? "#4ade80" : "#f87171", sub: "CA − dépenses" },
          ].map((k, i) => (
            <div key={i} className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3.5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-1">{k.label}</p>
              <p className="text-lg font-bold truncate" style={{ color: k.color }}>{k.value}</p>
              <p className="text-[11px] text-zinc-600 mt-0.5">{k.sub}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">⌕</span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher client, produit, note…"
              className="w-full h-9 bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600"
            />
          </div>

          <div className="flex gap-1">
            {([
              { key: "all", label: "Tout" },
              { key: "vente", label: "Ventes" },
              { key: "stock", label: "Stock" },
              { key: "depense", label: "Dépenses" },
              { key: "offert", label: "Offerts" },
            ] as const).map(f => (
              <button
                key={f.key}
                onClick={() => setTypeFilter(f.key)}
                className={`h-8 px-2.5 rounded-lg text-xs font-medium transition ${
                  typeFilter === f.key ? "text-black" : "text-zinc-500 bg-zinc-900 hover:text-zinc-300"
                }`}
                style={typeFilter === f.key ? { background: ACCENT } : {}}
              >
                {f.label}
              </button>
            ))}
          </div>

          <input
            type="date"
            value={dateFrom}
            onChange={e => setDateFrom(e.target.value)}
            className="h-8 bg-zinc-900 border border-zinc-800 rounded-lg px-2 text-xs text-zinc-300 focus:outline-none"
            title="Du"
          />
          <span className="text-zinc-600 text-xs">→</span>
          <input
            type="date"
            value={dateTo}
            onChange={e => setDateTo(e.target.value)}
            className="h-8 bg-zinc-900 border border-zinc-800 rounded-lg px-2 text-xs text-zinc-300 focus:outline-none"
            title="Au"
          />

          {(dateFrom || dateTo || search || typeFilter !== "all") && (
            <button
              onClick={() => { setSearch(""); setTypeFilter("all"); setDateFrom(""); setDateTo("") }}
              className="h-8 px-2 rounded-lg text-xs text-zinc-500 hover:text-white"
            >
              Réinitialiser
            </button>
          )}
        </div>

        {/* Timeline */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: ACCENT }} />
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-4xl mb-3 opacity-20">🕓</p>
            <p className="text-sm text-zinc-500">Aucun événement trouvé</p>
          </div>
        ) : (
          <div className="space-y-6">
            {visibleGrouped.map(([day, items]) => {
              const dayTotal = items
                .filter(e => e._type === "vente")
                .reduce((s, e) => s + (e.montant || 0), 0)
              const isToday = day === new Date().toISOString().slice(0, 10)

              return (
                <div key={day}>
                  {/* Day header */}
                  <div className="flex items-center gap-3 mb-3 sticky top-0 z-10 bg-[#0a0a0a]/95 py-1.5 backdrop-blur-sm">
                    <div className={`h-px flex-1 ${isToday ? "bg-yellow-500/30" : "bg-zinc-800"}`} />
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-semibold ${isToday ? "text-yellow-400" : "text-zinc-400"}`}>
                        {isToday ? "Aujourd'hui" : formatDate(day + "T12:00:00")}
                      </span>
                      {dayTotal > 0 && (
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-zinc-900 text-zinc-400 border border-zinc-800">
                          {formatEuro(dayTotal)}
                        </span>
                      )}
                      <span className="text-[10px] text-zinc-600">{items.length}</span>
                    </div>
                    <div className={`h-px flex-1 ${isToday ? "bg-yellow-500/30" : "bg-zinc-800"}`} />
                  </div>

                  {/* Entries */}
                  <div className="space-y-2">
                    {items.map(e => {
                      const meta = TYPE_META[e._type] || TYPE_META.vente
                      const isOpen = expanded === `${e._type}-${e._id}`

                      return (
                        <div
                          key={`${e._type}-${e._id}`}
                          className={`rounded-xl border transition ${meta.border} ${meta.bg} ${isOpen ? "ring-1 ring-white/10" : ""}`}
                        >
                          <button
                            onClick={() => setExpanded(isOpen ? null : `${e._type}-${e._id}`)}
                            className="w-full flex items-center gap-3 p-3.5 text-left"
                          >
                            <span className="text-lg shrink-0">{meta.emoji}</span>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium text-white truncate">{e.label}</p>
                                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${meta.color} bg-black/20`}>
                                  {meta.label}
                                </span>
                              </div>
                              <p className="text-[11px] text-zinc-500 mt-0.5 truncate">
                                {formatTime(e._date)}
                                {e._type === "stock" && e.action && ` · ${e.action}`}
                                {e._type === "vente" && e.paiement && ` · ${e.paiement}`}
                                {e.details && ` · ${e.details}`}
                              </p>
                            </div>

                            <div className="text-right shrink-0">
                              {e.montant != null && e.montant !== 0 && (
                                <p className={`text-sm font-bold tabular-nums ${
                                  e._type === "depense" ? "text-rose-400" :
                                  e._type === "offert" ? "text-violet-400" :
                                  "text-white"
                                }`}
                                  style={e._type === "vente" ? { color: ACCENT } : {}}
                                >
                                  {e._type === "depense" ? "−" : ""}{formatEuro(Math.abs(e.montant))}
                                </p>
                              )}
                              {e._type === "stock" && e.quantite != null && (
                                <p className="text-sm font-semibold text-blue-400">
                                  {e.action === "Sortie" || e.action === "Transfert" ? "−" : "+"}{e.quantite}
                                </p>
                              )}
                            </div>

                            <span className={`text-zinc-600 text-xs transition-transform ${isOpen ? "rotate-180" : ""}`}>▾</span>
                          </button>

                          {/* Expanded details */}
                          {isOpen && (
                            <div className="px-3.5 pb-3.5 pt-0 border-t border-white/5">
                              {e._type === "vente" && (
                                <div className="mt-3 space-y-2">
                                  {e.items?.length > 0 && (
                                    <div className="bg-black/20 rounded-lg p-2.5 space-y-1">
                                      {e.items.map((it: any, i: number) => (
                                        <div key={i} className="flex justify-between text-xs">
                                          <span className="text-zinc-300">{it.produit_nom} ×{it.quantite}</span>
                                          <span className="text-zinc-500">{Number(it.total || it.pv_unitaire * it.quantite).toFixed(2)} €</span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                  {e.notes && <p className="text-xs text-zinc-500 italic">Note : {e.notes}</p>}
                                  <div className="flex gap-2 pt-1">
                                    <button
                                      onClick={ev => { ev.stopPropagation(); setEditVente(e._raw) }}
                                      className="h-7 px-2.5 rounded-lg text-[11px] bg-zinc-800 text-zinc-300 hover:text-white"
                                    >
                                      Modifier
                                    </button>
                                    <button
                                      onClick={ev => { ev.stopPropagation(); deleteEntry(e) }}
                                      className="h-7 px-2.5 rounded-lg text-[11px] bg-rose-500/10 text-rose-400 hover:bg-rose-500/20"
                                    >
                                      Supprimer
                                    </button>
                                  </div>
                                </div>
                              )}

                              {e._type === "stock" && (
                                <div className="mt-3 space-y-2">
                                  <div className="flex gap-4 text-xs text-zinc-400">
                                    <span>Avant : <strong className="text-white">{e.quantite_avant}</strong></span>
                                    <span>→</span>
                                    <span>Après : <strong className="text-white">{e.quantite_apres}</strong></span>
                                  </div>
                                  {e.details && <p className="text-xs text-zinc-500">{e.details}</p>}
                                  <button
                                    onClick={ev => { ev.stopPropagation(); deleteEntry(e) }}
                                    className="h-7 px-2.5 rounded-lg text-[11px] bg-rose-500/10 text-rose-400 hover:bg-rose-500/20"
                                  >
                                    Supprimer
                                  </button>
                                </div>
                              )}

                              {(e._type === "depense" || e._type === "offert") && (
                                <div className="mt-3 space-y-2">
                                  {e.details && <p className="text-xs text-zinc-400">Catégorie : {e.details}</p>}
                                  <button
                                    onClick={ev => { ev.stopPropagation(); deleteEntry(e) }}
                                    className="h-7 px-2.5 rounded-lg text-[11px] bg-rose-500/10 text-rose-400 hover:bg-rose-500/20"
                                  >
                                    Supprimer
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}

            {hasMore && (
              <div className="text-center pt-2 pb-6">
                <button
                  onClick={() => setPage(p => p + 1)}
                  className="h-9 px-5 rounded-xl text-sm text-zinc-400 border border-zinc-800 hover:text-white hover:bg-zinc-800 transition"
                >
                  Charger plus ({entries.length - visible.length} restants)
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Edit vente modal */}
      {editVente && (
        <EditVenteModal
          vente={editVente}
          ACCENT={ACCENT}
          onClose={() => setEditVente(null)}
          onDone={() => { setEditVente(null); load() }}
        />
      )}
    </div>
  )
}

function EditVenteModal({ vente, ACCENT, onClose, onDone }: {
  vente: any; ACCENT: string; onClose: () => void; onDone: () => void
}) {
  const [clientNom, setClientNom] = useState(vente.client_nom || "")
  const [paiement, setPaiement] = useState(vente.paiement || "Espèces")
  const [notes, setNotes] = useState(vente.notes || "")
  const [dateStr, setDateStr] = useState(vente.created_at?.split("T")[0] || "")
  const [saving, setSaving] = useState(false)

  const save = async () => {
    setSaving(true)
    await supabase.from("ventes").update({
      client_nom: clientNom,
      paiement,
      notes,
      created_at: dateStr ? new Date(dateStr + "T12:00:00").toISOString() : vente.created_at,
    }).eq("id", vente.id)
    setSaving(false)
    onDone()
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-[#18181b] border border-zinc-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          <div>
            <p className="text-white font-semibold">Modifier la vente</p>
            <p className="text-xs text-zinc-500">{formatEuro(Number(vente.total_ttc))}</p>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white">✕</button>
        </div>
        <div className="p-5 space-y-3">
          <div>
            <label className="text-[11px] text-zinc-500 font-medium">Client</label>
            <input value={clientNom} onChange={e => setClientNom(e.target.value)}
              className="w-full h-10 mt-1 bg-zinc-900 border border-zinc-700 rounded-xl px-3 text-sm text-white focus:outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-zinc-500 font-medium">Paiement</label>
              <select value={paiement} onChange={e => setPaiement(e.target.value)}
                className="w-full h-10 mt-1 bg-zinc-900 border border-zinc-700 rounded-xl px-3 text-sm text-white focus:outline-none">
                {PAIEMENTS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[11px] text-zinc-500 font-medium">Date</label>
              <input type="date" value={dateStr} onChange={e => setDateStr(e.target.value)}
                className="w-full h-10 mt-1 bg-zinc-900 border border-zinc-700 rounded-xl px-3 text-sm text-white focus:outline-none" />
            </div>
          </div>
          <div>
            <label className="text-[11px] text-zinc-500 font-medium">Notes</label>
            <input value={notes} onChange={e => setNotes(e.target.value)}
              className="w-full h-10 mt-1 bg-zinc-900 border border-zinc-700 rounded-xl px-3 text-sm text-white focus:outline-none" />
          </div>
        </div>
        <div className="px-5 pb-5 flex gap-2">
          <button onClick={onClose} className="flex-1 h-10 rounded-xl text-sm text-zinc-400 bg-zinc-800">Annuler</button>
          <button onClick={save} disabled={saving}
            className="flex-1 h-10 rounded-xl text-sm font-bold text-black disabled:opacity-40"
            style={{ background: ACCENT }}>
            {saving ? "…" : "Enregistrer"}
          </button>
        </div>
      </div>
    </div>
  )
}