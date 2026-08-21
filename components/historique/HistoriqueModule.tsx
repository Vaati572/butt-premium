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
  vente:   { label: "Vente",   emoji: "🛒", color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/30" },
  stock:   { label: "Stock",   emoji: "📦", color: "text-blue-400",   bg: "bg-blue-500/10",   border: "border-blue-500/30" },
  depense: { label: "Dépense", emoji: "💸", color: "text-rose-400",   bg: "bg-rose-500/10",   border: "border-rose-500/30" },
  offert:  { label: "Offert",  emoji: "🎁", color: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/30" },
}

const PAIEMENTS = ["Espèces", "CB", "Virement", "Chèque", "En attente"]

const formatEuro = (n: number) =>
  (isNaN(n) ? 0 : n).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €"

const formatDateTime = (d: string) =>
  new Date(d).toLocaleString("fr-FR", {
    weekday: "short", day: "numeric", month: "short",
    hour: "2-digit", minute: "2-digit",
  })

const dayKey = (d: string) => d?.slice(0, 10) || ""

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
  const [page, setPage] = useState(1)
  const PER_PAGE = 35

  // Detail / Edit
  const [detail, setDetail] = useState<any | null>(null)       // entry opened in drawer
  const [editMode, setEditMode] = useState(false)              // editing inside drawer
  const [editForm, setEditForm] = useState<any>({})
  const [editItems, setEditItems] = useState<any[]>([])
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    if (!activeSociety?.id) return
    setLoading(true)
    const [v, s, d] = await Promise.all([
      supabase.from("ventes").select("*, vente_items(*)")
        .eq("society_id", activeSociety.id)
        .order("created_at", { ascending: false })
        .limit(700),
      supabase.from("stock_history").select("*")
        .order("created_at", { ascending: false })
        .limit(500),
      supabase.from("depenses").select("*")
        .eq("society_id", activeSociety.id)
        .order("created_at", { ascending: false })
        .limit(500),
    ])
    setVentes(v.data || [])
    setStocks(s.data || [])
    setDepenses(d.data || [])
    setLoading(false)
  }, [activeSociety?.id])

  useEffect(() => { load() }, [load])
  useEffect(() => { setPage(1) }, [search, typeFilter, dateFrom, dateTo])

  const entries = useMemo(() => {
    const all: any[] = []

    ventes.forEach(v => {
      if (typeFilter !== "all" && typeFilter !== "vente") return
      const label = v.client_nom || "Client de passage"
      const details = (v.vente_items || []).map((i: any) => `${i.produit_nom} ×${i.quantite}`).join(", ")
      if (search) {
        const s = search.toLowerCase()
        if (!label.toLowerCase().includes(s) && !details.toLowerCase().includes(s) && !(v.notes || "").toLowerCase().includes(s) && !(v.paiement || "").toLowerCase().includes(s)) return
      }
      if (dateFrom && v.created_at < dateFrom) return
      if (dateTo && v.created_at > dateTo + "T23:59:59") return
      all.push({
        _type: "vente", _date: v.created_at, _id: v.id, _raw: v,
        label, details, montant: Number(v.total_ttc || 0),
        paiement: v.paiement, items: v.vente_items || [], notes: v.notes,
        port: Number(v.port || 0), total_ht: Number(v.total_ht || 0),
      })
    })

    stocks.forEach(s => {
      if (typeFilter !== "all" && typeFilter !== "stock") return
      if (search) {
        const q = search.toLowerCase()
        if (!s.produit_nom?.toLowerCase().includes(q) && !(s.notes || "").toLowerCase().includes(q) && !(s.action || "").toLowerCase().includes(q)) return
      }
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
      if (search) {
        const q = search.toLowerCase()
        if (!label.toLowerCase().includes(q) && !(d.categorie || "").toLowerCase().includes(q)) return
      }
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

  const kpi = useMemo(() => {
    const v = entries.filter(e => e._type === "vente")
    const d = entries.filter(e => e._type === "depense")
    const o = entries.filter(e => e._type === "offert")
    const s = entries.filter(e => e._type === "stock")
    const ca = v.reduce((sum, e) => sum + (e.montant || 0), 0)
    const dep = d.reduce((sum, e) => sum + (e.montant || 0), 0)
    const off = o.reduce((sum, e) => sum + (e.montant || 0), 0)
    return { ca, nbVentes: v.length, depenses: dep, offerts: off, stocks: s.length, net: ca - dep, total: entries.length }
  }, [entries])

  const openDetail = (e: any) => {
    setDetail(e)
    setEditMode(false)
    if (e._type === "vente") {
      setEditForm({
        client_nom: e._raw.client_nom || "",
        paiement: e._raw.paiement || "Espèces",
        notes: e._raw.notes || "",
        date: e._raw.created_at?.slice(0, 10) || "",
        port: String(e._raw.port ?? 0),
        total_ttc: String(e._raw.total_ttc ?? 0),
      })
      setEditItems((e._raw.vente_items || []).map((it: any) => ({
        id: it.id,
        produit_nom: it.produit_nom,
        quantite: String(it.quantite),
        pv_unitaire: String(it.pv_unitaire ?? it.total / (it.quantite || 1)),
        cf_unitaire: String(it.cf_unitaire ?? 0),
      })))
    } else if (e._type === "depense" || e._type === "offert") {
      setEditForm({
        description: e._raw.description || e._raw.libelle || "",
        categorie: e._raw.categorie || "",
        montant: String(e._raw.montant ?? 0),
        date: e._raw.created_at?.slice(0, 10) || "",
        type: e._type === "offert" ? "offert" : "depense",
      })
    } else if (e._type === "stock") {
      setEditForm({
        notes: e._raw.notes || "",
        action: e._raw.action || "",
      })
    }
  }

  const closeDetail = () => {
    setDetail(null)
    setEditMode(false)
  }

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
    closeDetail()
    load()
  }

  const saveVente = async () => {
    if (!detail || detail._type !== "vente") return
    setSaving(true)
    try {
      const port = parseFloat(editForm.port) || 0
      // recalc from items
      let totalHT = 0
      for (const it of editItems) {
        totalHT += (parseFloat(it.pv_unitaire) || 0) * (parseFloat(it.quantite) || 0)
      }
      const totalTTC = totalHT + port

      await supabase.from("ventes").update({
        client_nom: editForm.client_nom,
        paiement: editForm.paiement,
        notes: editForm.notes || null,
        port,
        total_ht: totalHT,
        total_ttc: totalTTC,
        created_at: editForm.date ? new Date(editForm.date + "T12:00:00").toISOString() : detail._raw.created_at,
      }).eq("id", detail._id)

      // Update items
      for (const it of editItems) {
        if (it.id) {
          const q = parseFloat(it.quantite) || 0
          const pv = parseFloat(it.pv_unitaire) || 0
          const cf = parseFloat(it.cf_unitaire) || 0
          await supabase.from("vente_items").update({
            produit_nom: it.produit_nom,
            quantite: q,
            pv_unitaire: pv,
            cf_unitaire: cf,
            total: q * pv,
          }).eq("id", it.id)
        }
      }

      closeDetail()
      load()
    } catch (err) {
      console.error(err)
      alert("Erreur lors de la sauvegarde")
    } finally {
      setSaving(false)
    }
  }

  const saveDepense = async () => {
    if (!detail || (detail._type !== "depense" && detail._type !== "offert")) return
    setSaving(true)
    await supabase.from("depenses").update({
      description: editForm.description,
      libelle: editForm.description,
      categorie: editForm.categorie,
      montant: parseFloat(editForm.montant) || 0,
      type: editForm.type,
      created_at: editForm.date ? new Date(editForm.date + "T12:00:00").toISOString() : detail._raw.created_at,
    }).eq("id", detail._id)
    setSaving(false)
    closeDetail()
    load()
  }

  const updateItem = (idx: number, field: string, value: string) => {
    setEditItems(prev => prev.map((it, i) => i === idx ? { ...it, [field]: value } : it))
  }

  const removeItem = async (idx: number) => {
    const it = editItems[idx]
    if (it.id && !confirm("Supprimer cette ligne de la vente ?")) return
    if (it.id) await supabase.from("vente_items").delete().eq("id", it.id)
    setEditItems(prev => prev.filter((_, i) => i !== idx))
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

  // ─── Detail drawer content ───
  const renderDetail = () => {
    if (!detail) return null
    const meta = TYPE_META[detail._type]

    if (detail._type === "vente") {
      const items = editMode ? editItems : (detail.items || [])
      const marge = items.reduce((s: number, it: any) => {
        const q = parseFloat(it.quantite) || 0
        const pv = parseFloat(it.pv_unitaire ?? it.total / (q || 1)) || 0
        const cf = parseFloat(it.cf_unitaire) || 0
        return s + (pv - cf) * q
      }, 0)
      const totalHT = items.reduce((s: number, it: any) => {
        const q = parseFloat(it.quantite) || 0
        const pv = parseFloat(it.pv_unitaire ?? 0) || 0
        return s + q * pv
      }, 0)
      const port = editMode ? (parseFloat(editForm.port) || 0) : (detail.port || 0)
      const totalTTC = totalHT + port

      return (
        <div className="flex flex-col h-full">
          <div className="px-5 py-4 border-b border-zinc-800 flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{meta.emoji}</span>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${meta.color} ${meta.bg}`}>{meta.label}</span>
              </div>
              <h2 className="text-lg font-bold text-white">
                {editMode ? "Modifier la vente" : (detail.label)}
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">{formatDateTime(detail._date)}</p>
            </div>
            <button onClick={closeDetail} className="text-zinc-500 hover:text-white text-lg">✕</button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {/* Infos principales */}
            <div className="space-y-3">
              <Field label="Client">
                {editMode ? (
                  <input value={editForm.client_nom} onChange={e => setEditForm((f: any) => ({ ...f, client_nom: e.target.value }))}
                    className="input-field" />
                ) : (
                  <p className="text-white text-sm">{detail.label}</p>
                )}
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Paiement">
                  {editMode ? (
                    <select value={editForm.paiement} onChange={e => setEditForm((f: any) => ({ ...f, paiement: e.target.value }))}
                      className="input-field">
                      {PAIEMENTS.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  ) : (
                    <p className="text-white text-sm">{detail.paiement || "—"}</p>
                  )}
                </Field>
                <Field label="Date">
                  {editMode ? (
                    <input type="date" value={editForm.date} onChange={e => setEditForm((f: any) => ({ ...f, date: e.target.value }))}
                      className="input-field" />
                  ) : (
                    <p className="text-white text-sm">{detail._date?.slice(0, 10)}</p>
                  )}
                </Field>
              </div>

              <Field label="Port / livraison">
                {editMode ? (
                  <input type="number" step="0.01" value={editForm.port}
                    onChange={e => setEditForm((f: any) => ({ ...f, port: e.target.value }))}
                    className="input-field" />
                ) : (
                  <p className="text-white text-sm">{formatEuro(detail.port || 0)}</p>
                )}
              </Field>

              <Field label="Notes">
                {editMode ? (
                  <textarea value={editForm.notes} rows={2}
                    onChange={e => setEditForm((f: any) => ({ ...f, notes: e.target.value }))}
                    className="input-field resize-none" />
                ) : (
                  <p className="text-zinc-400 text-sm">{detail.notes || "—"}</p>
                )}
              </Field>
            </div>

            {/* Lignes produits */}
            <div>
              <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                Articles ({items.length})
              </p>
              <div className="space-y-2">
                {items.map((it: any, idx: number) => {
                  const q = parseFloat(it.quantite) || 0
                  const pv = parseFloat(it.pv_unitaire) || 0
                  const cf = parseFloat(it.cf_unitaire) || 0
                  return (
                    <div key={it.id || idx} className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3">
                      {editMode ? (
                        <div className="space-y-2">
                          <input
                            value={it.produit_nom}
                            onChange={e => updateItem(idx, "produit_nom", e.target.value)}
                            className="input-field text-sm"
                            placeholder="Nom produit"
                          />
                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <label className="text-[10px] text-zinc-500">Qté</label>
                              <input type="number" step="any" value={it.quantite}
                                onChange={e => updateItem(idx, "quantite", e.target.value)}
                                className="input-field" />
                            </div>
                            <div>
                              <label className="text-[10px] text-zinc-500">PV unit.</label>
                              <input type="number" step="0.01" value={it.pv_unitaire}
                                onChange={e => updateItem(idx, "pv_unitaire", e.target.value)}
                                className="input-field" />
                            </div>
                            <div>
                              <label className="text-[10px] text-zinc-500">CF unit.</label>
                              <input type="number" step="0.01" value={it.cf_unitaire}
                                onChange={e => updateItem(idx, "cf_unitaire", e.target.value)}
                                className="input-field" />
                            </div>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-zinc-500">Ligne : {formatEuro(q * pv)}</span>
                            <button onClick={() => removeItem(idx)} className="text-[11px] text-rose-400 hover:text-rose-300">
                              Supprimer la ligne
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm text-white font-medium truncate">{it.produit_nom}</p>
                            <p className="text-[11px] text-zinc-500">
                              {it.quantite} × {formatEuro(Number(it.pv_unitaire || 0))}
                              {Number(it.cf_unitaire) > 0 && ` · CF ${formatEuro(Number(it.cf_unitaire))}`}
                            </p>
                          </div>
                          <p className="text-sm font-semibold tabular-nums" style={{ color: ACCENT }}>
                            {formatEuro(Number(it.total ?? q * pv))}
                          </p>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Totaux */}
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 space-y-1.5">
              <div className="flex justify-between text-sm text-zinc-400">
                <span>Sous-total HT</span>
                <span>{formatEuro(totalHT)}</span>
              </div>
              {port > 0 && (
                <div className="flex justify-between text-sm text-zinc-400">
                  <span>Port</span>
                  <span>{formatEuro(port)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold text-white pt-1 border-t border-zinc-800">
                <span>Total TTC</span>
                <span style={{ color: ACCENT }}>{formatEuro(editMode ? totalTTC : detail.montant)}</span>
              </div>
              <div className="flex justify-between text-xs text-zinc-500">
                <span>Marge estimée</span>
                <span className={marge >= 0 ? "text-emerald-400" : "text-rose-400"}>{formatEuro(marge)}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="px-5 py-4 border-t border-zinc-800 flex gap-2">
            {editMode ? (
              <>
                <button onClick={() => setEditMode(false)} className="flex-1 h-10 rounded-xl text-sm text-zinc-400 bg-zinc-800">
                  Annuler
                </button>
                <button onClick={saveVente} disabled={saving}
                  className="flex-1 h-10 rounded-xl text-sm font-bold text-black disabled:opacity-40"
                  style={{ background: ACCENT }}>
                  {saving ? "…" : "Enregistrer"}
                </button>
              </>
            ) : (
              <>
                <button onClick={() => setEditMode(true)}
                  className="flex-1 h-10 rounded-xl text-sm font-semibold text-black"
                  style={{ background: ACCENT }}>
                  Modifier
                </button>
                <button onClick={() => deleteEntry(detail)}
                  className="h-10 px-4 rounded-xl text-sm text-rose-400 bg-rose-500/10 hover:bg-rose-500/20">
                  Supprimer
                </button>
              </>
            )}
          </div>
        </div>
      )
    }

    // Stock / Dépense / Offert detail
    return (
      <div className="flex flex-col h-full">
        <div className="px-5 py-4 border-b border-zinc-800 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{meta.emoji}</span>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${meta.color} ${meta.bg}`}>{meta.label}</span>
            </div>
            <h2 className="text-lg font-bold text-white">{detail.label}</h2>
            <p className="text-xs text-zinc-500 mt-0.5">{formatDateTime(detail._date)}</p>
          </div>
          <button onClick={closeDetail} className="text-zinc-500 hover:text-white">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {detail._type === "stock" && (
            <>
              <div className="grid grid-cols-3 gap-3">
                <StatBox label="Action" value={detail.action || "—"} />
                <StatBox label="Avant" value={String(detail.quantite_avant ?? "—")} />
                <StatBox label="Après" value={String(detail.quantite_apres ?? "—")} />
              </div>
              <Field label="Quantité mouvement">
                <p className="text-white text-sm font-semibold">
                  {detail.action === "Sortie" || detail.action === "Transfert" ? "−" : "+"}
                  {detail.quantite}
                </p>
              </Field>
              <Field label="Notes">
                {editMode ? (
                  <textarea value={editForm.notes} rows={3}
                    onChange={e => setEditForm((f: any) => ({ ...f, notes: e.target.value }))}
                    className="input-field resize-none" />
                ) : (
                  <p className="text-zinc-400 text-sm">{detail.details || "—"}</p>
                )}
              </Field>
            </>
          )}

          {(detail._type === "depense" || detail._type === "offert") && (
            <>
              {editMode ? (
                <div className="space-y-3">
                  <Field label="Description">
                    <input value={editForm.description}
                      onChange={e => setEditForm((f: any) => ({ ...f, description: e.target.value }))}
                      className="input-field" />
                  </Field>
                  <Field label="Catégorie">
                    <input value={editForm.categorie}
                      onChange={e => setEditForm((f: any) => ({ ...f, categorie: e.target.value }))}
                      className="input-field" />
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Montant">
                      <input type="number" step="0.01" value={editForm.montant}
                        onChange={e => setEditForm((f: any) => ({ ...f, montant: e.target.value }))}
                        className="input-field" />
                    </Field>
                    <Field label="Date">
                      <input type="date" value={editForm.date}
                        onChange={e => setEditForm((f: any) => ({ ...f, date: e.target.value }))}
                        className="input-field" />
                    </Field>
                  </div>
                  <Field label="Type">
                    <select value={editForm.type}
                      onChange={e => setEditForm((f: any) => ({ ...f, type: e.target.value }))}
                      className="input-field">
                      <option value="depense">Dépense</option>
                      <option value="offert">Offert</option>
                    </select>
                  </Field>
                </div>
              ) : (
                <>
                  <StatBox label="Montant" value={formatEuro(detail.montant)} big />
                  <Field label="Catégorie"><p className="text-white text-sm">{detail.details || "—"}</p></Field>
                </>
              )}
            </>
          )}
        </div>

        <div className="px-5 py-4 border-t border-zinc-800 flex gap-2">
          {(detail._type === "depense" || detail._type === "offert") && (
            editMode ? (
              <>
                <button onClick={() => setEditMode(false)} className="flex-1 h-10 rounded-xl text-sm text-zinc-400 bg-zinc-800">Annuler</button>
                <button onClick={saveDepense} disabled={saving}
                  className="flex-1 h-10 rounded-xl text-sm font-bold text-black disabled:opacity-40"
                  style={{ background: ACCENT }}>
                  {saving ? "…" : "Enregistrer"}
                </button>
              </>
            ) : (
              <>
                <button onClick={() => setEditMode(true)}
                  className="flex-1 h-10 rounded-xl text-sm font-semibold text-black"
                  style={{ background: ACCENT }}>
                  Modifier
                </button>
                <button onClick={() => deleteEntry(detail)}
                  className="h-10 px-4 rounded-xl text-sm text-rose-400 bg-rose-500/10 hover:bg-rose-500/20">
                  Supprimer
                </button>
              </>
            )
          )}
          {detail._type === "stock" && (
            <button onClick={() => deleteEntry(detail)}
              className="flex-1 h-10 rounded-xl text-sm text-rose-400 bg-rose-500/10 hover:bg-rose-500/20">
              Supprimer
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex bg-[#0a0a0a] overflow-hidden">
      {/* Main list */}
      <div className={`flex-1 overflow-y-auto transition-all ${detail ? "hidden lg:block" : ""}`}>
        <div className="p-5 max-w-4xl mx-auto space-y-5">

          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-xl font-bold text-white">Historique</h1>
              <p className="text-sm text-zinc-500 mt-0.5">
                {kpi.total} événement{kpi.total > 1 ? "s" : ""}
              </p>
            </div>
            <button onClick={exportCSV} disabled={!entries.length}
              className="h-9 px-3 rounded-xl text-xs font-medium text-zinc-400 border border-zinc-800 hover:text-white hover:bg-zinc-800 disabled:opacity-40">
              ↓ Export CSV
            </button>
          </div>

          {/* KPI */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
            {[
              { label: "CA", value: formatEuro(kpi.ca), color: ACCENT },
              { label: "Ventes", value: String(kpi.nbVentes), color: "#fbbf24" },
              { label: "Dépenses", value: formatEuro(kpi.depenses), color: "#f87171" },
              { label: "Offerts", value: formatEuro(kpi.offerts), color: "#c084fc" },
              { label: "Net", value: formatEuro(kpi.net), color: kpi.net >= 0 ? "#4ade80" : "#f87171" },
            ].map((k, i) => (
              <div key={i} className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3">
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider">{k.label}</p>
                <p className="text-base font-bold mt-0.5 truncate" style={{ color: k.color }}>{k.value}</p>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[160px] max-w-xs">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">⌕</span>
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Rechercher…"
                className="w-full h-9 bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-3 text-sm text-white placeholder-zinc-600 focus:outline-none" />
            </div>
            {(["all", "vente", "stock", "depense", "offert"] as const).map(k => (
              <button key={k} onClick={() => setTypeFilter(k)}
                className={`h-8 px-2.5 rounded-lg text-xs font-medium transition ${
                  typeFilter === k ? "text-black" : "text-zinc-500 bg-zinc-900 hover:text-zinc-300"
                }`}
                style={typeFilter === k ? { background: ACCENT } : {}}>
                {k === "all" ? "Tout" : TYPE_META[k]?.label || k}
              </button>
            ))}
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
              className="h-8 bg-zinc-900 border border-zinc-800 rounded-lg px-2 text-xs text-zinc-300" />
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
              className="h-8 bg-zinc-900 border border-zinc-800 rounded-lg px-2 text-xs text-zinc-300" />
          </div>

          {/* Timeline */}
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: ACCENT }} />
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-20 text-zinc-500 text-sm">Aucun événement</div>
          ) : (
            <div className="space-y-5">
              {visibleGrouped.map(([day, items]) => {
                const dayCA = items.filter(e => e._type === "vente").reduce((s, e) => s + (e.montant || 0), 0)
                const isToday = day === new Date().toISOString().slice(0, 10)
                return (
                  <div key={day}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-xs font-semibold ${isToday ? "text-yellow-400" : "text-zinc-400"}`}>
                        {isToday ? "Aujourd'hui" : new Date(day + "T12:00:00").toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
                      </span>
                      {dayCA > 0 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-zinc-800 text-zinc-400">{formatEuro(dayCA)}</span>
                      )}
                      <span className="text-[10px] text-zinc-600">{items.length}</span>
                    </div>
                    <div className="space-y-1.5">
                      {items.map(e => {
                        const meta = TYPE_META[e._type]
                        const active = detail?._id === e._id && detail?._type === e._type
                        return (
                          <button
                            key={`${e._type}-${e._id}`}
                            onClick={() => openDetail(e)}
                            className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition ${
                              active
                                ? `${meta.border} ${meta.bg} ring-1 ring-white/10`
                                : "border-zinc-800/80 bg-zinc-900/50 hover:bg-zinc-900 hover:border-zinc-700"
                            }`}
                          >
                            <span className="text-base shrink-0">{meta.emoji}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-white font-medium truncate">{e.label}</p>
                              <p className="text-[11px] text-zinc-500 truncate">
                                {new Date(e._date).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                                {e.paiement && ` · ${e.paiement}`}
                                {e.action && ` · ${e.action}`}
                                {e.details && ` · ${e.details}`}
                              </p>
                            </div>
                            <div className="text-right shrink-0">
                              {e.montant != null && e.montant !== 0 && (
                                <p className={`text-sm font-bold tabular-nums ${
                                  e._type === "depense" ? "text-rose-400" : e._type === "offert" ? "text-violet-400" : ""
                                }`} style={e._type === "vente" ? { color: ACCENT } : {}}>
                                  {e._type === "depense" ? "−" : ""}{formatEuro(Math.abs(e.montant))}
                                </p>
                              )}
                              {e._type === "stock" && (
                                <p className="text-sm font-semibold text-blue-400">
                                  {e.action === "Sortie" || e.action === "Transfert" ? "−" : "+"}{e.quantite}
                                </p>
                              )}
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })}

              {hasMore && (
                <div className="text-center pb-6">
                  <button onClick={() => setPage(p => p + 1)}
                    className="h-9 px-5 rounded-xl text-sm text-zinc-400 border border-zinc-800 hover:text-white hover:bg-zinc-800">
                    Charger plus ({entries.length - visible.length})
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Detail drawer */}
      {detail && (
        <div className="w-full lg:w-[420px] xl:w-[460px] border-l border-zinc-800 bg-[#0c0c0e] flex flex-col shrink-0 h-full">
          {renderDetail()}
        </div>
      )}

      <style jsx global>{`
        .input-field {
          width: 100%;
          height: 2.25rem;
          background: rgb(24 24 27);
          border: 1px solid rgb(63 63 70);
          border-radius: 0.75rem;
          padding: 0 0.75rem;
          font-size: 0.875rem;
          color: white;
          outline: none;
        }
        .input-field:focus {
          border-color: rgb(113 113 122);
        }
        textarea.input-field {
          height: auto;
          padding-top: 0.5rem;
          padding-bottom: 0.5rem;
        }
      `}</style>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] font-medium text-zinc-500 mb-1">{label}</p>
      {children}
    </div>
  )
}

function StatBox({ label, value, big }: { label: string; value: string; big?: boolean }) {
  return (
    <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3">
      <p className="text-[10px] text-zinc-500 uppercase tracking-wider">{label}</p>
      <p className={`font-bold text-white mt-0.5 ${big ? "text-xl" : "text-sm"}`}>{value}</p>
    </div>
  )
}