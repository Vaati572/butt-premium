"use client"

import { useEffect, useState, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import { useUserSettings } from "@/lib/UserSettingsContext"
import { TrendingUp, TrendingDown, Package, AlertTriangle, Target, BarChart2, X, ChevronRight } from "lucide-react"

interface Props { activeSociety: any; profile: any }

const MOIS = ["Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"]

function today() {
  const d = new Date()
  return d.toISOString().split("T")[0]
}
function startOfWeek() {
  const d = new Date()
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  return d.toISOString().split("T")[0]
}
function startOfMonth() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-01`
}

/* ── STOCK CRITIQUE POPUP ──────────────────── */
function StockCritiquePopup({ items, onClose }: { items: any[]; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#111111] border border-red-500/30 rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden">
        <div className="px-6 pt-6 pb-4 flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
            <AlertTriangle size={18} className="text-red-400" />
          </div>
          <div>
            <h2 className="text-white font-bold text-base">⚠️ Stocks critiques</h2>
            <p className="text-zinc-500 text-xs mt-0.5">{items.length} produit{items.length>1?"s":""} nécessite{items.length>1?"nt":""} une attention immédiate</p>
          </div>
          <button onClick={onClose} className="ml-auto text-zinc-600 hover:text-white"><X size={16}/></button>
        </div>
        <div className="px-6 pb-2 space-y-2 max-h-60 overflow-y-auto">
          {items.map((item: any) => (
            <div key={item.id} className="flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5">
              <span className="text-white text-sm font-medium">{item.produit_nom}</span>
              <span className={`text-sm font-bold ${item.quantite < 0 ? "text-red-500" : "text-orange-400"}`}>
                {item.quantite} {item.unite||"u."}
              </span>
            </div>
          ))}
        </div>
        <div className="px-6 pb-6 pt-4">
          <button onClick={onClose} className="w-full py-2.5 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 font-bold text-sm hover:bg-red-500/30 transition-colors">
            Compris
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── VENTE DETAIL POPUP ────────────────────── */
function VenteDetailPopup({ vente, onClose }: { vente: any; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#111111] border border-zinc-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="px-6 pt-6 pb-4 border-b border-zinc-800 flex items-center justify-between">
          <div>
            <h2 className="text-white font-bold text-base">{vente.client_nom || "Client de passage"}</h2>
            <p className="text-zinc-500 text-xs mt-0.5">{new Date(vente.created_at).toLocaleString("fr-FR")}</p>
          </div>
          <button onClick={onClose} className="text-zinc-600 hover:text-white"><X size={18}/></button>
        </div>
        <div className="px-6 py-4 space-y-2">
          {(vente.vente_items || []).map((item: any) => (
            <div key={item.id} className="flex items-center justify-between">
              <span className="text-zinc-300 text-sm">{item.produit_nom} <span className="text-zinc-600">×{item.quantite}</span></span>
              <span className="text-white text-sm font-semibold">{Number(item.total).toFixed(2)}€</span>
            </div>
          ))}
        </div>
        <div className="px-6 pb-4 border-t border-zinc-800 pt-3">
          <div className="flex items-center justify-between">
            <span className="text-zinc-400 text-sm">Total</span>
            <span className="text-yellow-500 text-lg font-bold">{Number(vente.total_ttc).toFixed(2)}€</span>
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-zinc-600 text-xs">Paiement</span>
            <span className="text-zinc-400 text-xs bg-zinc-800 px-2 py-0.5 rounded-full">{vente.paiement}</span>
          </div>
          {vente.notes && (
            <p className="text-zinc-600 text-xs mt-2 italic">{vente.notes}</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default function AccueilModule({ activeSociety, profile }: Props) {
  const { settings } = useUserSettings()
  const ACCENT = settings.accent_color || "#eab308"

  // URSSAF — always read from settings (global)
  const urssafRate = Number((settings as any).urssaf_rate ?? (settings as any).urssaf_rate_global ?? 0.138)

  const [loading, setLoading]               = useState(true)
  const [ventesAujourd, setVentesAujourd]   = useState<any[]>([])
  const [ventesWeek, setVentesWeek]         = useState<any[]>([])
  const [ventesMois, setVentesMois]         = useState<any[]>([])
  const [stockAlerts, setStockAlerts]       = useState<any[]>([])
  const [showStockPopup, setShowStockPopup] = useState(false)
  const [selectedVente, setSelectedVente]   = useState<any>(null)
  const [memo, setMemo]                     = useState("")
  const [editMemo, setEditMemo]             = useState(false)
  const [memoInput, setMemoInput]           = useState("")
  const [objectifMensuel, setObjectifMensuel] = useState(0)
  const [showStockPopupShown, setShowStockPopupShown] = useState(false)

  const MEMO_KEY = `accueil_memo_${activeSociety?.id}_${profile?.id}`
  const OBJ_KEY  = `accueil_objectif_${activeSociety?.id}`

  useEffect(() => {
    try {
      setMemo(localStorage.getItem(MEMO_KEY) || "")
      setObjectifMensuel(Number(localStorage.getItem(OBJ_KEY)) || 3000)
    } catch {}
  }, [MEMO_KEY, OBJ_KEY])

  const load = useCallback(async () => {
    if (!activeSociety?.id) return
    setLoading(true)

    const todayStr = today()
    const weekStr  = startOfWeek()
    const monthStr = startOfMonth()

    const todayStart = todayStr + "T00:00:00"
    const todayEnd   = todayStr + "T23:59:59"

    const [
      { data: vA },
      { data: vW },
      { data: vM },
      { data: stk },
    ] = await Promise.all([
      supabase.from("ventes").select("*, vente_items(*)")
        .eq("society_id", activeSociety.id)
        .gte("created_at", todayStart).lte("created_at", todayEnd)
        .order("created_at", { ascending: false }),
      supabase.from("ventes").select("total_ttc")
        .eq("society_id", activeSociety.id)
        .gte("created_at", weekStr),
      supabase.from("ventes").select("total_ttc, total_ht")
        .eq("society_id", activeSociety.id)
        .gte("created_at", monthStr),
      supabase.from("stock").select("*")
        .eq("society_id", activeSociety.id),
    ])

    setVentesAujourd(vA || [])
    setVentesWeek(vW || [])
    setVentesMois(vM || [])

    // Stock alerts: négatif ou <= seuil
    const alerts = (stk || []).filter((s: any) =>
      s.quantite < 0 || (s.seuil_alerte > 0 && s.quantite <= s.seuil_alerte)
    )
    setStockAlerts(alerts)

    // Show stock popup on first load if there are alerts
    if (alerts.length > 0 && !showStockPopupShown) {
      setTimeout(() => setShowStockPopup(true), 800)
      setShowStockPopupShown(true)
    }

    setLoading(false)
  }, [activeSociety?.id])

  useEffect(() => { load() }, [load])

  // Calculations
  const caToday   = ventesAujourd.reduce((s, v) => s + Number(v.total_ttc || 0), 0)
  const caSemaine = ventesWeek.reduce((s, v) => s + Number(v.total_ttc || 0), 0)
  const caMois    = ventesMois.reduce((s, v) => s + Number(v.total_ttc || 0), 0)
  const netUrssaf = caToday * (1 - urssafRate)
  const netMois   = caMois * (1 - urssafRate)

  // Marge du jour — safe: avoid NaN when cf is null
  const margeToday = ventesAujourd.reduce((s, v) => {
    const items = v.vente_items || []
    const marge = items.reduce((ms: number, it: any) => {
      const cf = Number(it.cf_unitaire ?? 0)
      return ms + (Number(it.pv_unitaire ?? 0) - cf) * Number(it.quantite ?? 0)
    }, 0)
    return s + marge
  }, 0)

  const progressPct = Math.min(100, (caMois / (objectifMensuel || 1)) * 100)

  if (loading) return (
    <div className="flex-1 flex items-center justify-center bg-[#0a0a0a]">
      <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: ACCENT }} />
    </div>
  )

  const todayLabel = new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })

  return (
    <div className="flex-1 overflow-y-auto bg-[#0a0a0a]">
      <div className="p-6 max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">🏠 Accueil</h1>
            <p className="text-zinc-500 text-sm mt-0.5 capitalize">{todayLabel}</p>
          </div>
          <button onClick={load} className="text-zinc-500 hover:text-white text-xl transition-colors">↻</button>
        </div>

        {/* Top KPIs */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: ACCENT+"20" }}>
                <TrendingUp size={15} style={{ color: ACCENT }} />
              </div>
              <p className="text-zinc-500 text-[11px] font-bold uppercase tracking-wider">CA aujourd'hui</p>
            </div>
            <p className="text-3xl font-black" style={{ color: ACCENT }}>{caToday.toFixed(2)}€</p>
            <p className="text-zinc-600 text-xs mt-1">Mois : {caMois.toFixed(2)}€</p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                <TrendingUp size={15} className="text-green-400" />
              </div>
              <p className="text-zinc-500 text-[11px] font-bold uppercase tracking-wider">Net URSSAF</p>
            </div>
            <p className="text-3xl font-black text-green-400">{netUrssaf.toFixed(2)}€</p>
            <p className="text-zinc-600 text-xs mt-1">Après {(urssafRate*100).toFixed(1)}% de charges</p>
          </div>
        </div>

        {/* Objectif mensuel + CA semaine */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-zinc-400 text-sm font-semibold flex items-center gap-2">
                <Target size={14} style={{ color: ACCENT }} /> Objectif mensuel
              </p>
              <button
                onClick={() => {
                  const v = prompt("Objectif mensuel (€) :", String(objectifMensuel))
                  if (v && !isNaN(Number(v))) {
                    const n = Number(v)
                    setObjectifMensuel(n)
                    try { localStorage.setItem(OBJ_KEY, String(n)) } catch {}
                  }
                }}
                className="text-zinc-600 hover:text-zinc-400 text-[10px] underline"
              >
                Modifier
              </button>
            </div>
            <div className="flex items-end justify-between mb-2">
              <span className="text-zinc-300 text-sm">{caMois.toFixed(0)}€</span>
              <span className="text-zinc-600 text-xs">/ {objectifMensuel}€</span>
            </div>
            <div className="w-full bg-zinc-800 rounded-full h-2 mb-2">
              <div className="h-2 rounded-full transition-all duration-700"
                style={{ width: `${progressPct}%`, backgroundColor: ACCENT }} />
            </div>
            <p className="font-bold text-sm" style={{ color: ACCENT }}>{progressPct.toFixed(0)}% atteint</p>
            <p className="text-zinc-600 text-xs">Il reste {Math.max(0, objectifMensuel - caMois).toFixed(0)}€ à faire</p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <BarChart2 size={14} className="text-blue-400" />
              <p className="text-zinc-400 text-sm font-semibold">CA de la semaine</p>
            </div>
            <p className="text-3xl font-black text-blue-400">{caSemaine.toFixed(2)}€</p>
            <p className="text-zinc-600 text-xs mt-1">{ventesWeek.length} vente{ventesWeek.length>1?"s":""} cette semaine</p>
          </div>
        </div>

        {/* Mémo + Marge + Stocks critiques */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          {/* Mémo */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-zinc-400 text-sm font-semibold">📝 Mon mémo du jour</p>
              <button onClick={() => { setEditMemo(true); setMemoInput(memo) }}
                className="text-zinc-600 hover:text-zinc-400 text-[10px] underline">
                {memo ? "Modifier" : "Créer"}
              </button>
            </div>
            {editMemo ? (
              <div className="space-y-2">
                <textarea value={memoInput} onChange={e => setMemoInput(e.target.value)} rows={3}
                  placeholder="Notes du jour..." autoFocus
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-500/60 resize-none" />
                <div className="flex gap-2">
                  <button onClick={() => {
                    setMemo(memoInput); setEditMemo(false)
                    try { localStorage.setItem(MEMO_KEY, memoInput) } catch {}
                  }} className="flex-1 py-1.5 rounded-lg text-xs font-bold text-black" style={{ backgroundColor: ACCENT }}>
                    Sauvegarder
                  </button>
                  <button onClick={() => setEditMemo(false)} className="px-3 py-1.5 rounded-lg text-xs bg-zinc-800 text-zinc-400">Annuler</button>
                </div>
              </div>
            ) : memo ? (
              <p className="text-zinc-300 text-sm whitespace-pre-wrap leading-relaxed">{memo}</p>
            ) : (
              <p className="text-zinc-600 text-sm italic">Aucun mémo — configure-le via ✏ Créer</p>
            )}
          </div>

          {/* Marge du jour */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <TrendingUp size={14} className="text-emerald-400" />
              </div>
              <p className="text-zinc-400 text-sm font-semibold">Marge du jour</p>
            </div>
            <p className={`text-3xl font-black ${margeToday >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {isNaN(margeToday) ? "—" : `${margeToday.toFixed(2)}€`}
            </p>
            <p className="text-zinc-600 text-xs mt-1">Après coût de fabrication</p>
          </div>

          {/* Stocks critiques */}
          <div
            onClick={() => stockAlerts.length > 0 && setShowStockPopup(true)}
            className={`bg-zinc-900 border rounded-2xl p-5 ${stockAlerts.length > 0 ? "border-red-500/30 cursor-pointer hover:bg-zinc-800/50 transition-colors" : "border-zinc-800"}`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${stockAlerts.length > 0 ? "bg-red-500/10" : "bg-zinc-800"}`}>
                  <AlertTriangle size={14} className={stockAlerts.length > 0 ? "text-red-400" : "text-zinc-600"} />
                </div>
                <p className="text-zinc-400 text-sm font-semibold">
                  Stocks critiques{stockAlerts.length > 0 ? ` (${stockAlerts.length})` : ""}
                </p>
              </div>
              {stockAlerts.length > 0 && <ChevronRight size={14} className="text-red-400" />}
            </div>
            {stockAlerts.length === 0 ? (
              <p className="text-zinc-600 text-sm">✅ Tous les stocks sont OK</p>
            ) : (
              <div className="space-y-1.5">
                {stockAlerts.slice(0, 4).map((s: any) => (
                  <div key={s.id} className="flex items-center justify-between">
                    <span className="text-zinc-300 text-xs truncate">{s.produit_nom}</span>
                    <span className={`text-xs font-bold ${s.quantite < 0 ? "text-red-500" : "text-orange-400"}`}>
                      {s.quantite} {s.unite||"u."}
                    </span>
                  </div>
                ))}
                {stockAlerts.length > 4 && <p className="text-zinc-600 text-[10px]">+ {stockAlerts.length-4} autres</p>}
              </div>
            )}
          </div>
        </div>

        {/* Ventes du jour */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
            <p className="text-white font-bold">🛒 Ventes du jour</p>
            <p className="text-zinc-500 text-xs">{ventesAujourd.length} vente{ventesAujourd.length>1?"s":""} — {caToday.toFixed(2)}€</p>
          </div>
          {ventesAujourd.length === 0 ? (
            <div className="px-6 py-8 text-center text-zinc-600">
              <p className="text-3xl mb-2">📭</p>
              <p className="text-sm">Aucune vente aujourd'hui</p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-800">
              {ventesAujourd.map(v => (
                <button key={v.id} onClick={() => setSelectedVente(v)}
                  className="w-full flex items-center justify-between px-6 py-3 hover:bg-zinc-800/40 transition-colors text-left group">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-black"
                      style={{ backgroundColor: ACCENT }}>
                      {(v.client_nom||"P").charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">{v.client_nom || "Client de passage"}</p>
                      <p className="text-zinc-500 text-xs">{new Date(v.created_at).toLocaleTimeString("fr-FR", { hour:"2-digit", minute:"2-digit" })} — {v.paiement}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="font-bold" style={{ color: ACCENT }}>{Number(v.total_ttc).toFixed(2)}€</p>
                    <ChevronRight size={14} className="text-zinc-600 group-hover:text-zinc-400 transition-colors" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* CA par mois (mini graph) */}
        <MonthlyMiniChart societyId={activeSociety.id} accent={ACCENT} />

      </div>

      {showStockPopup && stockAlerts.length > 0 && (
        <StockCritiquePopup items={stockAlerts} onClose={() => setShowStockPopup(false)} />
      )}
      {selectedVente && (
        <VenteDetailPopup vente={selectedVente} onClose={() => setSelectedVente(null)} />
      )}
    </div>
  )
}

/* ── MINI CHART CA mensuel ─────────────────── */
function MonthlyMiniChart({ societyId, accent }: { societyId: string; accent: string }) {
  const [data, setData] = useState<number[]>(new Array(12).fill(0))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const year = new Date().getFullYear()
    supabase.from("ventes")
      .select("created_at, total_ttc")
      .eq("society_id", societyId)
      .gte("created_at", `${year}-01-01`)
      .lte("created_at", `${year}-12-31`)
      .then(({ data: ventes }) => {
        const monthly = new Array(12).fill(0)
        ;(ventes || []).forEach((v: any) => {
          const m = new Date(v.created_at).getMonth()
          monthly[m] += Number(v.total_ttc || 0)
        })
        setData(monthly)
        setLoading(false)
      })
  }, [societyId])

  const max = Math.max(...data, 1)

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
      <p className="text-white font-bold text-sm mb-4">📊 CA par mois — {new Date().getFullYear()}</p>
      {loading ? (
        <div className="h-24 flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: accent }} />
        </div>
      ) : (
        <div className="flex items-end gap-1 h-24">
          {data.map((val, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full rounded-t-sm transition-all duration-700 relative group"
                style={{ height: `${(val / max) * 80}px`, backgroundColor: val > 0 ? accent : "#27272a", minHeight: "4px" }}>
                {val > 0 && (
                  <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-zinc-800 text-white text-[9px] px-1.5 py-0.5 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    {val.toFixed(0)}€
                  </div>
                )}
              </div>
              <p className="text-zinc-600 text-[9px]">{["J","F","M","A","M","J","J","A","S","O","N","D"][i]}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}