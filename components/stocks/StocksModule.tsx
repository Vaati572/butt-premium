"use client"

import { useEffect, useState, useMemo } from "react"
import { supabase } from "@/lib/supabase"
import { useUserSettings } from "@/lib/UserSettingsContext"

interface StockItem {
  id: string
  product_id: string
  produit_nom: string
  quantite: number
  seuil_alerte: number
  hidden: boolean
  updated_at: string
  unite?: string
  fournisseur?: string
  prix_achat?: number
  avatar_url?: string
}

interface Props {
  activeSociety: any
  profile: any
}

const formatQty = (n: number) =>
  Number.isInteger(n) ? String(n) : n.toFixed(2)

export default function StocksModule({ activeSociety, profile }: Props) {
  const { settings } = useUserSettings()
  const ACCENT = settings.accent_color || "#eab308"

  const [stock, setStock] = useState<StockItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<"all" | "alert" | "empty">("all")
  const [selected, setSelected] = useState<StockItem | null>(null)
  const [showMouvement, setShowMouvement] = useState(false)
  const [showEdit, setShowEdit] = useState(false)

  const load = async () => {
    if (!activeSociety?.id) return
    setLoading(true)
    const { data: stockData } = await supabase
      .from("stock")
      .select("*")
      .eq("society_id", activeSociety.id)
      .order("produit_nom")

    const { data: products } = await supabase
      .from("products")
      .select("id, name, avatar_url")
      .eq("society_id", activeSociety.id)

    const imgMap: Record<string, string> = {}
    ;(products || []).forEach((p: any) => {
      if (p.avatar_url) imgMap[p.id] = p.avatar_url
    })

    const items = (stockData || []).map((s: any) => ({
      ...s,
      avatar_url: imgMap[s.product_id] || null,
    }))

    setStock(items)
    setLoading(false)
  }

  useEffect(() => { load() }, [activeSociety?.id])

  const filtered = useMemo(() => {
    return stock.filter(item => {
      if (item.hidden) return false
      if (search && !item.produit_nom.toLowerCase().includes(search.toLowerCase())) return false
      if (filter === "alert" && !(item.seuil_alerte > 0 && item.quantite <= item.seuil_alerte)) return false
      if (filter === "empty" && item.quantite > 0) return false
      return true
    })
  }, [stock, search, filter])

  const alertCount = stock.filter(i => !i.hidden && i.seuil_alerte > 0 && i.quantite <= i.seuil_alerte).length
  const emptyCount = stock.filter(i => !i.hidden && i.quantite <= 0).length

  const getStatus = (item: StockItem) => {
    if (item.quantite < 0) return { label: "Négatif", color: "text-rose-400", bg: "bg-rose-500/15", border: "border-rose-500/30" }
    if (item.seuil_alerte > 0 && item.quantite <= item.seuil_alerte) return { label: "Alerte", color: "text-amber-400", bg: "bg-amber-500/15", border: "border-amber-500/30" }
    if (item.quantite === 0) return { label: "Vide", color: "text-zinc-500", bg: "bg-zinc-800", border: "border-zinc-700" }
    return { label: "OK", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" }
  }

  return (
    <div className="h-full overflow-y-auto bg-[#0a0a0a]">
      <div className="p-5 max-w-7xl mx-auto space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl font-bold text-white">Stock</h1>
            <p className="text-sm text-zinc-500 mt-0.5">
              {filtered.length} produit{filtered.length > 1 ? "s" : ""}
              {alertCount > 0 && <span className="text-amber-400"> · {alertCount} alerte{alertCount > 1 ? "s" : ""}</span>}
            </p>
          </div>
        </div>

        {/* Search + filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">⌕</span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher un produit…"
              className="w-full h-10 bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600"
            />
          </div>

          <div className="flex gap-1.5">
            {[
              { key: "all", label: "Tous" },
              { key: "alert", label: `Alertes (${alertCount})` },
              { key: "empty", label: `Vides (${emptyCount})` },
            ].map(f => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key as any)}
                className={`h-9 px-3 rounded-lg text-xs font-medium transition ${
                  filter === f.key
                    ? "text-black"
                    : "text-zinc-500 bg-zinc-900 hover:text-zinc-300"
                }`}
                style={filter === f.key ? { background: ACCENT } : {}}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Cards grid */}
        {loading ? (
          <div className="flex justify-center py-24">
            <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: ACCENT }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-4xl mb-3 opacity-20">📦</p>
            <p className="text-sm text-zinc-500">Aucun produit trouvé</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filtered.map(item => {
              const status = getStatus(item)
              return (
                <div
                  key={item.id}
                  className={`group relative rounded-2xl border overflow-hidden transition-all hover:scale-[1.02] ${status.border} bg-zinc-900/80`}
                >
                  {/* Image */}
                  <div className="aspect-square bg-zinc-800/50 relative overflow-hidden">
                    {item.avatar_url ? (
                      <img
                        src={item.avatar_url}
                        alt={item.produit_nom}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-4xl opacity-20">📦</span>
                      </div>
                    )}

                    {/* Status badge */}
                    <span className={`absolute top-2 left-2 text-[10px] font-semibold px-2 py-0.5 rounded-full ${status.bg} ${status.color}`}>
                      {status.label}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="p-3 space-y-2">
                    <p className="text-sm font-medium text-white leading-snug line-clamp-2 min-h-[2.5rem]">
                      {item.produit_nom}
                    </p>

                    <div className="flex items-end justify-between">
                      <div>
                        <p className={`text-2xl font-bold tabular-nums ${status.color}`}>
                          {formatQty(item.quantite)}
                        </p>
                        {item.unite && (
                          <p className="text-[10px] text-zinc-500">{item.unite}</p>
                        )}
                      </div>
                      {item.seuil_alerte > 0 && (
                        <p className="text-[10px] text-zinc-600">
                          Seuil {item.seuil_alerte}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-1.5 pt-1">
                      <button
                        onClick={() => { setSelected(item); setShowMouvement(true) }}
                        className="flex-1 h-8 rounded-lg text-xs font-semibold text-black transition"
                        style={{ background: ACCENT }}
                      >
                        Mouvement
                      </button>
                      <button
                        onClick={() => { setSelected(item); setShowEdit(true) }}
                        className="h-8 w-8 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center text-sm"
                      >
                        ✎
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal Mouvement */}
      {showMouvement && selected && (
        <MouvementModal
          item={selected}
          profile={profile}
          ACCENT={ACCENT}
          onClose={() => { setShowMouvement(false); setSelected(null) }}
          onDone={() => { setShowMouvement(false); setSelected(null); load() }}
        />
      )}

      {/* Modal Edit */}
      {showEdit && selected && (
        <EditModal
          item={selected}
          ACCENT={ACCENT}
          onClose={() => { setShowEdit(false); setSelected(null) }}
          onDone={() => { setShowEdit(false); setSelected(null); load() }}
        />
      )}
    </div>
  )
}

/* ─── Mouvement ─── */
function MouvementModal({ item, profile, ACCENT, onClose, onDone }: {
  item: StockItem; profile: any; ACCENT: string; onClose: () => void; onDone: () => void
}) {
  const [action, setAction] = useState("Entrée")
  const [quantite, setQuantite] = useState("")
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)

  const qty = parseFloat(quantite) || 0
  let preview = item.quantite
  if (action === "Entrée" || action === "Retour") preview = item.quantite + qty
  else if (action === "Sortie" || action === "Transfert") preview = item.quantite - qty
  else if (action === "Correction" || action === "Inventaire") preview = qty

  const save = async () => {
    if (!qty) return
    setLoading(true)
    await supabase.from("stock").update({ quantite: preview, updated_at: new Date().toISOString() }).eq("id", item.id)
    await supabase.from("stock_history").insert({
      product_id: item.product_id,
      produit_nom: item.produit_nom,
      user_id: profile.id,
      action,
      quantite: qty,
      quantite_avant: item.quantite,
      quantite_apres: preview,
      notes: notes || null,
    })
    setLoading(false)
    onDone()
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-[#18181b] border border-zinc-700 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-white">Mouvement</h3>
            <p className="text-xs text-zinc-500 truncate">{item.produit_nom}</p>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white">✕</button>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-3 gap-1.5">
            {["Entrée", "Sortie", "Correction", "Inventaire", "Transfert", "Retour"].map(a => (
              <button
                key={a}
                onClick={() => setAction(a)}
                className={`h-9 rounded-lg text-xs font-medium border transition ${
                  action === a ? "text-black border-transparent" : "text-zinc-400 border-zinc-700 hover:border-zinc-500"
                }`}
                style={action === a ? { background: ACCENT } : {}}
              >
                {a}
              </button>
            ))}
          </div>

          <div>
            <label className="text-[11px] text-zinc-500 font-medium">
              {action === "Correction" || action === "Inventaire" ? "Nouvelle quantité" : "Quantité"}
            </label>
            <input
              type="number"
              min="0"
              step="any"
              value={quantite}
              onChange={e => setQuantite(e.target.value)}
              autoFocus
              className="w-full h-12 mt-1.5 bg-zinc-900 border border-zinc-700 rounded-xl px-4 text-center text-xl font-bold text-white focus:outline-none focus:border-zinc-500"
            />
            {quantite && (
              <p className={`text-center text-xs mt-1.5 font-medium ${preview < 0 ? "text-rose-400" : "text-zinc-400"}`}>
                → {formatQty(preview)} {item.unite || ""}
              </p>
            )}
          </div>

          <input
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Note (optionnel)"
            className="w-full h-9 bg-zinc-900 border border-zinc-700 rounded-xl px-3 text-sm text-white placeholder-zinc-600 focus:outline-none"
          />
        </div>

        <div className="px-5 pb-5 flex gap-2">
          <button onClick={onClose} className="flex-1 h-10 rounded-xl text-sm text-zinc-400 bg-zinc-800 hover:bg-zinc-700">
            Annuler
          </button>
          <button
            onClick={save}
            disabled={!quantite || loading}
            className="flex-1 h-10 rounded-xl text-sm font-bold text-black disabled:opacity-40"
            style={{ background: ACCENT }}
          >
            {loading ? "…" : "Valider"}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Edit ─── */
function EditModal({ item, ACCENT, onClose, onDone }: {
  item: StockItem; ACCENT: string; onClose: () => void; onDone: () => void
}) {
  const [nom, setNom] = useState(item.produit_nom)
  const [seuil, setSeuil] = useState(String(item.seuil_alerte || ""))
  const [unite, setUnite] = useState(item.unite || "")
  const [fournisseur, setFournisseur] = useState(item.fournisseur || "")
  const [loading, setLoading] = useState(false)

  const save = async () => {
    setLoading(true)
    await supabase.from("stock").update({
      produit_nom: nom,
      seuil_alerte: parseFloat(seuil) || 0,
      unite: unite || null,
      fournisseur: fournisseur || null,
    }).eq("id", item.id)
    setLoading(false)
    onDone()
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-[#18181b] border border-zinc-700 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
          <h3 className="text-base font-semibold text-white">Modifier le produit</h3>
          <button onClick={onClose} className="text-zinc-500 hover:text-white">✕</button>
        </div>
        <div className="p-5 space-y-3">
          <div>
            <label className="text-[11px] text-zinc-500">Nom</label>
            <input value={nom} onChange={e => setNom(e.target.value)}
              className="w-full h-10 mt-1 bg-zinc-900 border border-zinc-700 rounded-xl px-3 text-sm text-white focus:outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-zinc-500">Seuil d’alerte</label>
              <input type="number" value={seuil} onChange={e => setSeuil(e.target.value)}
                className="w-full h-10 mt-1 bg-zinc-900 border border-zinc-700 rounded-xl px-3 text-sm text-white focus:outline-none" />
            </div>
            <div>
              <label className="text-[11px] text-zinc-500">Unité</label>
              <input value={unite} onChange={e => setUnite(e.target.value)} placeholder="u., kg…"
                className="w-full h-10 mt-1 bg-zinc-900 border border-zinc-700 rounded-xl px-3 text-sm text-white focus:outline-none" />
            </div>
          </div>
          <div>
            <label className="text-[11px] text-zinc-500">Fournisseur</label>
            <input value={fournisseur} onChange={e => setFournisseur(e.target.value)}
              className="w-full h-10 mt-1 bg-zinc-900 border border-zinc-700 rounded-xl px-3 text-sm text-white focus:outline-none" />
          </div>
        </div>
        <div className="px-5 pb-5 flex gap-2">
          <button onClick={onClose} className="flex-1 h-10 rounded-xl text-sm text-zinc-400 bg-zinc-800">Annuler</button>
          <button onClick={save} disabled={loading}
            className="flex-1 h-10 rounded-xl text-sm font-bold text-black disabled:opacity-40"
            style={{ background: ACCENT }}>
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  )
}