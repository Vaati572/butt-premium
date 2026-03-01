"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import {
  TrendingUp, TrendingDown, ShoppingCart, Users,
  Package, Target, AlertTriangle, Trophy, RefreshCw,
} from "lucide-react"

interface Props { activeSociety: any; profile: any }

const URSSAF = 0.14
const PERIODS = ["Aujourd'hui", "7 derniers jours", "30 derniers jours", "Mois en cours", "Mois précédent", "Année en cours", "Tout"]

/* ── MINI BAR CHART SVG ──────────────────────── */
function BarChart({ data, color = "#eab308", height = 120 }: {
  data: { label: string; value: number }[]
  color?: string
  height?: number
}) {
  if (!data.length) return <p className="text-zinc-600 text-sm text-center py-8">Aucune donnée</p>
  const max = Math.max(...data.map(d => d.value)) || 1
  const w = 100 / data.length

  return (
    <div className="w-full" style={{ height }}>
      <svg width="100%" height={height} viewBox={`0 0 ${data.length * 40} ${height}`} preserveAspectRatio="none">
        {data.map((d, i) => {
          const bh = Math.max(2, (d.value / max) * (height - 24))
          const x = i * 40 + 4
          const y = height - 16 - bh
          return (
            <g key={i}>
              <rect x={x} y={y} width={32} height={bh} fill={d.value === max ? color : color + "80"} rx={3} />
              {data.length <= 15 && (
                <text x={x + 16} y={height - 2} textAnchor="middle" fontSize={8} fill="#52525b">{d.label}</text>
              )}
            </g>
          )
        })}
      </svg>
    </div>
  )
}

/* ── KPI CARD ────────────────────────────────── */
function KpiCard({ label, value, sub, color, icon: Icon, trend }: {
  label: string; value: string; sub?: string; color: string
  icon: any; trend?: "up" | "down" | null
}) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: color + "20" }}>
          <Icon size={14} style={{ color }} />
        </div>
        <p className="text-zinc-500 text-[11px] font-semibold uppercase tracking-wider">{label}</p>
        {trend === "up" && <TrendingUp size={12} className="text-green-400 ml-auto" />}
        {trend === "down" && <TrendingDown size={12} className="text-red-400 ml-auto" />}
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      {sub && <p className="text-zinc-600 text-[11px] mt-1">{sub}</p>}
    </div>
  )
}

/* ══════════════════════════════════════════════
   TAB 1 — VUE D'ENSEMBLE
══════════════════════════════════════════════ */
function OverviewTab({ ventes, depenses, period, onPeriodChange }: {
  ventes: any[]; depenses: any[]; period: string; onPeriodChange: (p: string) => void
}) {
  const ca = ventes.reduce((s, v) => s + Number(v.total_ttc), 0)
  const net = ca - ca * URSSAF
  const cfTotal = ventes.reduce((s, v) => s + (v.vente_items || []).reduce((ss: number, i: any) => ss + Number(i.cf_unitaire) * Number(i.quantite), 0), 0)
  const benefice = net - cfTotal
  const depTotal = depenses.reduce((s, d) => s + Number(d.montant), 0)
  const nbCmd = ventes.length
  const panierMoyen = nbCmd > 0 ? ca / nbCmd : 0

  // CA par jour
  const byDay: Record<string, number> = {}
  ventes.forEach(v => {
    const day = new Date(v.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" })
    byDay[day] = (byDay[day] || 0) + Number(v.total_ttc)
  })
  const chartData = Object.entries(byDay).slice(-20).map(([label, value]) => ({ label, value }))

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-5">
      {/* Période */}
      <div className="flex gap-2 flex-wrap">
        {PERIODS.map(p => (
          <button key={p} onClick={() => onPeriodChange(p)}
            className={`text-[11px] font-semibold px-3 py-1.5 rounded-lg border transition-colors ${period === p ? "bg-yellow-500 text-black border-yellow-500" : "text-zinc-400 border-zinc-700 bg-zinc-900 hover:border-zinc-600"}`}>
            {p}
          </button>
        ))}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <KpiCard label="CA Brut" value={`${ca.toFixed(2)}€`} sub={`${nbCmd} vente${nbCmd > 1 ? "s" : ""}`} color="#eab308" icon={TrendingUp} />
        <KpiCard label="Net URSSAF" value={`${net.toFixed(2)}€`} sub={`Après ${(URSSAF * 100).toFixed(0)}% charges`} color="#22c55e" icon={TrendingUp} />
        <KpiCard label="Bénéfice net" value={`${benefice.toFixed(2)}€`} sub="Après CF" color={benefice >= 0 ? "#22c55e" : "#ef4444"} icon={benefice >= 0 ? TrendingUp : TrendingDown} trend={benefice >= 0 ? "up" : "down"} />
        <KpiCard label="Dépenses" value={`${depTotal.toFixed(2)}€`} color="#f97316" icon={TrendingDown} />
        <KpiCard label="Commandes" value={String(nbCmd)} color="#3b82f6" icon={ShoppingCart} />
        <KpiCard label="Panier moyen" value={`${panierMoyen.toFixed(2)}€`} color="#a855f7" icon={Package} />
      </div>

      {/* Graphique CA */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
        <p className="text-zinc-300 text-sm font-bold mb-4">CA par jour</p>
        {chartData.length > 0 ? (
          <BarChart data={chartData} height={140} />
        ) : (
          <p className="text-zinc-600 text-sm text-center py-8">Aucune donnée sur cette période</p>
        )}
      </div>

      {/* Résultat net */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
        <p className="text-zinc-300 text-sm font-bold mb-4">Récap financier</p>
        <div className="space-y-2">
          {[
            { label: "CA Brut", value: ca, color: "text-yellow-500" },
            { label: `URSSAF (${(URSSAF * 100).toFixed(0)}%)`, value: -ca * URSSAF, color: "text-red-400" },
            { label: "Coût fabrication", value: -cfTotal, color: "text-red-400" },
            { label: "Dépenses", value: -depTotal, color: "text-orange-400" },
          ].map(({ label, value, color }) => (
            <div key={label} className="flex justify-between items-center py-1.5 border-b border-zinc-800 last:border-0">
              <span className="text-zinc-400 text-sm">{label}</span>
              <span className={`font-bold text-sm ${color}`}>{value >= 0 ? "+" : ""}{value.toFixed(2)}€</span>
            </div>
          ))}
          <div className="flex justify-between items-center pt-2">
            <span className="text-white font-bold">Résultat final</span>
            <span className={`text-lg font-bold ${(benefice - depTotal) >= 0 ? "text-green-400" : "text-red-400"}`}>
              {(benefice - depTotal).toFixed(2)}€
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════
   TAB 2 — PRODUITS
══════════════════════════════════════════════ */
function ProduitsTab({ ventes }: { ventes: any[] }) {
  const prodStats: Record<string, { qty: number; ca: number; marge: number }> = {}
  ventes.forEach(v => {
    (v.vente_items || []).forEach((i: any) => {
      const nom = i.produit_nom
      if (!prodStats[nom]) prodStats[nom] = { qty: 0, ca: 0, marge: 0 }
      prodStats[nom].qty += Number(i.quantite)
      prodStats[nom].ca += Number(i.pv_unitaire) * Number(i.quantite)
      prodStats[nom].marge += (Number(i.pv_unitaire) - Number(i.cf_unitaire)) * Number(i.quantite)
    })
  })
  const sorted = Object.entries(prodStats).sort((a, b) => b[1].ca - a[1].ca)
  const totalCA = sorted.reduce((s, [, v]) => s + v.ca, 0) || 1
  const top5 = sorted.slice(0, 5)

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-5">
      {/* Top produits chart */}
      {top5.length > 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <p className="text-zinc-300 text-sm font-bold mb-4">🏆 Top produits — CA</p>
          <div className="space-y-3">
            {top5.map(([nom, s], i) => (
              <div key={nom} className="flex items-center gap-3">
                <span className={`text-sm font-bold w-5 text-center ${i === 0 ? "text-yellow-500" : i === 1 ? "text-zinc-400" : i === 2 ? "text-orange-600" : "text-zinc-600"}`}>{i + 1}</span>
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <span className="text-zinc-300 text-xs font-semibold truncate max-w-[200px]">{nom}</span>
                    <span className="text-yellow-500 text-xs font-bold ml-2">{s.ca.toFixed(2)}€</span>
                  </div>
                  <div className="w-full bg-zinc-800 rounded-full h-1.5">
                    <div className="bg-yellow-500 h-1.5 rounded-full" style={{ width: `${(s.ca / totalCA) * 100}%` }} />
                  </div>
                </div>
                <span className="text-zinc-500 text-[11px] w-10 text-right">{s.qty} u.</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tableau complet */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="px-5 py-3 border-b border-zinc-800">
          <p className="text-zinc-300 text-sm font-bold">Tous les produits</p>
        </div>
        {sorted.length === 0 ? (
          <p className="text-zinc-600 text-sm text-center py-8">Aucune donnée</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-800">
                  {["Produit", "Qté", "CA", "Marge", "% CA"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.map(([nom, s]) => (
                  <tr key={nom} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                    <td className="px-4 py-3 text-white text-sm font-medium truncate max-w-[200px]">{nom}</td>
                    <td className="px-4 py-3 text-zinc-400 text-sm">{s.qty}</td>
                    <td className="px-4 py-3 text-yellow-500 font-bold text-sm">{s.ca.toFixed(2)}€</td>
                    <td className={`px-4 py-3 font-bold text-sm ${s.marge >= 0 ? "text-green-400" : "text-red-400"}`}>{s.marge.toFixed(2)}€</td>
                    <td className="px-4 py-3 text-zinc-500 text-sm">{((s.ca / totalCA) * 100).toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════
   TAB 3 — CLIENTS
══════════════════════════════════════════════ */
function ClientsTab({ societyId }: { societyId: string }) {
  const [topClients, setTopClients] = useState<{ nom: string; ca: number; cmds: number }[]>([])
  const [inactifs, setInactifs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])

  const load = async () => {
    const [{ data: ventes }, { data: clients }] = await Promise.all([
      supabase.from("ventes").select("client_nom, total_ttc, client_id").eq("society_id", societyId),
      supabase.from("clients").select("id, nom, contrat, derniere_commande").eq("society_id", societyId),
    ])
    // Top clients
    const clMap: Record<string, { ca: number; cmds: number }> = {}
    ;(ventes || []).forEach(v => {
      const key = v.client_nom
      if (!clMap[key]) clMap[key] = { ca: 0, cmds: 0 }
      clMap[key].ca += Number(v.total_ttc)
      clMap[key].cmds += 1
    })
    const sorted = Object.entries(clMap).sort((a, b) => b[1].ca - a[1].ca)
      .slice(0, 15).map(([nom, s]) => ({ nom, ...s }))
    setTopClients(sorted)

    // Inactifs (>60j sans commande)
    const now = Date.now()
    const inactive = (clients || []).filter(c => {
      if (!c.derniere_commande) return false
      const days = (now - new Date(c.derniere_commande).getTime()) / 86400000
      return days > 60
    })
    setInactifs(inactive)
    setLoading(false)
  }

  if (loading) return <div className="flex justify-center py-16"><div className="w-6 h-6 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-5">
      {/* Top clients */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="px-5 py-3 border-b border-zinc-800">
          <p className="text-zinc-300 text-sm font-bold">🏆 Top clients par CA</p>
        </div>
        {topClients.length === 0 ? (
          <p className="text-zinc-600 text-sm text-center py-8">Aucune donnée</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-800">
                {["#", "Client", "Commandes", "CA total"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {topClients.map((c, i) => (
                <tr key={c.nom} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                  <td className="px-4 py-3">
                    <span className={`text-sm font-bold ${i === 0 ? "text-yellow-500" : i === 1 ? "text-zinc-400" : i === 2 ? "text-orange-600" : "text-zinc-600"}`}>{i + 1}</span>
                  </td>
                  <td className="px-4 py-3 text-white text-sm font-medium">{c.nom}</td>
                  <td className="px-4 py-3 text-zinc-400 text-sm">{c.cmds}</td>
                  <td className="px-4 py-3 text-yellow-500 font-bold text-sm">{c.ca.toFixed(2)}€</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Clients inactifs */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="px-5 py-3 border-b border-zinc-800 flex items-center gap-2">
          <AlertTriangle size={14} className="text-orange-400" />
          <p className="text-zinc-300 text-sm font-bold">Clients inactifs (+60 jours)</p>
          <span className="ml-auto text-orange-400 font-bold text-sm">{inactifs.length}</span>
        </div>
        {inactifs.length === 0 ? (
          <p className="text-green-400 text-sm text-center py-6">✅ Tous les clients sont actifs</p>
        ) : (
          <div className="divide-y divide-zinc-800">
            {inactifs.map(c => (
              <div key={c.id} className="px-5 py-3 flex justify-between items-center hover:bg-zinc-800/30 transition-colors">
                <div>
                  <p className="text-white text-sm font-medium">{c.nom}</p>
                  <p className="text-zinc-500 text-[11px]">{c.contrat}</p>
                </div>
                <p className="text-orange-400 text-xs">
                  Dernière : {new Date(c.derniere_commande).toLocaleDateString("fr-FR")}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════
   TAB 4 — OBJECTIFS
══════════════════════════════════════════════ */
function ObjectifsTab({ ventes, societyId }: { ventes: any[]; societyId: string }) {
  const [objs, setObjs] = useState({ ca: 10000, commandes: 100, benefice: 5000 })

  const caMois = ventes.reduce((s, v) => s + Number(v.total_ttc), 0)
  const nbCmd = ventes.length
  const cfTotal = ventes.reduce((s, v) => s + (v.vente_items || []).reduce((ss: number, i: any) => ss + Number(i.cf_unitaire) * Number(i.quantite), 0), 0)
  const beneficeMois = (caMois - caMois * URSSAF) - cfTotal

  const objectives = [
    { label: "💰 CA Mensuel", target: objs.ca, current: caMois, unit: "€", color: "#eab308" },
    { label: "🛒 Commandes", target: objs.commandes, current: nbCmd, unit: "", color: "#3b82f6" },
    { label: "📈 Bénéfice", target: objs.benefice, current: Math.max(0, beneficeMois), unit: "€", color: "#22c55e" },
  ]

  const updateObj = async (key: string, val: number) => {
    setObjs(p => ({ ...p, [key]: val }))
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-5">
      {/* Config objectifs */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
        <p className="text-zinc-300 text-sm font-bold mb-4">⚙ Définir les objectifs</p>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-[11px] text-zinc-500 uppercase tracking-wider mb-1.5">Objectif CA (€)</label>
            <input type="number" value={objs.ca} onChange={e => updateObj("ca", Number(e.target.value))}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-500/60" />
          </div>
          <div>
            <label className="block text-[11px] text-zinc-500 uppercase tracking-wider mb-1.5">Objectif commandes</label>
            <input type="number" value={objs.commandes} onChange={e => updateObj("commandes", Number(e.target.value))}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-500/60" />
          </div>
          <div>
            <label className="block text-[11px] text-zinc-500 uppercase tracking-wider mb-1.5">Objectif bénéfice (€)</label>
            <input type="number" value={objs.benefice} onChange={e => updateObj("benefice", Number(e.target.value))}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-500/60" />
          </div>
        </div>
      </div>

      {/* Barres de progression */}
      {objectives.map(({ label, target, current, unit, color }) => {
        const pct = target > 0 ? Math.min(100, (current / target) * 100) : 0
        const barColor = pct >= 100 ? "#22c55e" : pct >= 60 ? "#eab308" : "#ef4444"
        return (
          <div key={label} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <div className="flex justify-between items-start mb-3">
              <p className="text-white font-bold text-sm">{label}</p>
              <div className="text-right">
                <p className="text-white font-bold" style={{ color }}>{current.toFixed(unit === "€" ? 2 : 0)}{unit}</p>
                <p className="text-zinc-500 text-[11px]">/ {target.toFixed(unit === "€" ? 0 : 0)}{unit}</p>
              </div>
            </div>
            <div className="w-full bg-zinc-800 rounded-full h-3 mb-2 overflow-hidden">
              <div className="h-3 rounded-full transition-all duration-500"
                style={{ width: `${pct}%`, backgroundColor: barColor }} />
            </div>
            <div className="flex justify-between items-center">
              <p className="font-bold text-sm" style={{ color: barColor }}>{pct.toFixed(0)}% atteint</p>
              {pct < 100 && (
                <p className="text-zinc-600 text-[11px]">
                  Reste : {(target - current).toFixed(unit === "€" ? 2 : 0)}{unit}
                </p>
              )}
              {pct >= 100 && <p className="text-green-400 text-xs font-bold">🎉 Objectif atteint !</p>}
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ══════════════════════════════════════════════
   TAB 5 — COMPARAISON MOIS
══════════════════════════════════════════════ */
function ComparaisonTab({ societyId }: { societyId: string }) {
  const [data, setData] = useState<{ mois: string; ca: number; cmds: number }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])

  const load = async () => {
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
    const { data: ventes } = await supabase.from("ventes").select("total_ttc, created_at")
      .eq("society_id", societyId).gte("created_at", sixMonthsAgo.toISOString())
    const byMonth: Record<string, { ca: number; cmds: number }> = {}
    ;(ventes || []).forEach(v => {
      const key = new Date(v.created_at).toLocaleDateString("fr-FR", { month: "short", year: "2-digit" })
      if (!byMonth[key]) byMonth[key] = { ca: 0, cmds: 0 }
      byMonth[key].ca += Number(v.total_ttc)
      byMonth[key].cmds += 1
    })
    setData(Object.entries(byMonth).map(([mois, s]) => ({ mois, ...s })))
    setLoading(false)
  }

  if (loading) return <div className="flex justify-center py-16"><div className="w-6 h-6 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" /></div>

  const maxCA = Math.max(...data.map(d => d.ca)) || 1
  const curr = data[data.length - 1]
  const prev = data[data.length - 2]
  const evolution = prev && prev.ca > 0 ? ((curr?.ca - prev.ca) / prev.ca) * 100 : null

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-5">
      {/* Evolution M vs M-1 */}
      {curr && prev && (
        <div className={`border rounded-2xl p-5 flex items-center gap-4 ${evolution && evolution >= 0 ? "bg-green-950/20 border-green-500/20" : "bg-red-950/20 border-red-500/20"}`}>
          <span className="text-3xl">{evolution && evolution >= 0 ? "📈" : "📉"}</span>
          <div>
            <p className="text-white font-bold">vs mois précédent</p>
            <p className={`text-2xl font-bold ${evolution && evolution >= 0 ? "text-green-400" : "text-red-400"}`}>
              {evolution !== null ? `${evolution >= 0 ? "+" : ""}${evolution.toFixed(1)}%` : "—"}
            </p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-zinc-400 text-xs">{prev.mois}: {prev.ca.toFixed(0)}€</p>
            <p className="text-white text-sm font-bold">{curr.mois}: {curr.ca.toFixed(0)}€</p>
          </div>
        </div>
      )}

      {/* Graphique barres par mois */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
        <p className="text-zinc-300 text-sm font-bold mb-4">CA des 6 derniers mois</p>
        <BarChart data={data.map(d => ({ label: d.mois, value: d.ca }))} height={160} />
      </div>

      {/* Tableau */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="px-5 py-3 border-b border-zinc-800">
          <p className="text-zinc-300 text-sm font-bold">Détail mensuel</p>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-zinc-800">
              {["Mois", "CA", "Commandes", "Panier moyen"].map(h => (
                <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...data].reverse().map(d => (
              <tr key={d.mois} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                <td className="px-4 py-3 text-white font-semibold text-sm capitalize">{d.mois}</td>
                <td className="px-4 py-3 text-yellow-500 font-bold text-sm">{d.ca.toFixed(2)}€</td>
                <td className="px-4 py-3 text-zinc-400 text-sm">{d.cmds}</td>
                <td className="px-4 py-3 text-zinc-400 text-sm">{d.cmds > 0 ? (d.ca / d.cmds).toFixed(2) : "0.00"}€</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════
   MAIN MODULE
══════════════════════════════════════════════ */
export default function StatsModule({ activeSociety, profile }: Props) {
  const [activeTab, setActiveTab] = useState("overview")
  const [period, setPeriod] = useState("Mois en cours")
  const [ventes, setVentes] = useState<any[]>([])
  const [depenses, setDepenses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { if (activeSociety) loadData() }, [activeSociety, period])

  const getDateRange = () => {
    const now = new Date()
    const today = new Date(now); today.setHours(0, 0, 0, 0)
    if (period === "Aujourd'hui") return today.toISOString()
    if (period === "7 derniers jours") { const d = new Date(now); d.setDate(d.getDate() - 7); return d.toISOString() }
    if (period === "30 derniers jours") { const d = new Date(now); d.setDate(d.getDate() - 30); return d.toISOString() }
    if (period === "Mois en cours") return new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    if (period === "Mois précédent") return new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()
    if (period === "Année en cours") return new Date(now.getFullYear(), 0, 1).toISOString()
    return null // Tout
  }

  const loadData = async () => {
    setLoading(true)
    const from = getDateRange()
    let q = supabase.from("ventes").select("*, vente_items(*)").eq("society_id", activeSociety.id)
    if (from) {
      if (period === "Mois précédent") {
        const now = new Date()
        const end = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
        q = q.gte("created_at", from).lt("created_at", end)
      } else {
        q = q.gte("created_at", from)
      }
    }
    const [{ data: v }, { data: d }] = await Promise.all([
      q.order("created_at", { ascending: true }),
      supabase.from("depenses").select("*").eq("society_id", activeSociety.id),
    ])
    setVentes(v || [])
    setDepenses(d || [])
    setLoading(false)
  }

  const tabs = [
    { id: "overview", label: "📊 Vue d'ensemble" },
    { id: "produits", label: "📦 Produits" },
    { id: "clients",  label: "👤 Clients" },
    { id: "objectifs",label: "🎯 Objectifs" },
    { id: "mois",     label: "📅 Par mois" },
  ]

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#0a0a0a]">
      {/* Header onglets */}
      <div className="border-b border-zinc-900 px-6 pt-5 pb-0">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-white">📊 Statistiques</h1>
          <button onClick={() => loadData()}
            className="flex items-center gap-2 text-xs text-zinc-400 bg-zinc-900 border border-zinc-800 px-3 py-2 rounded-xl hover:border-zinc-600 transition-colors">
            <RefreshCw size={12} /> Actualiser
          </button>
        </div>
        <div className="flex gap-1 overflow-x-auto">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`flex-shrink-0 px-4 py-2.5 text-xs font-semibold rounded-t-xl border-b-2 transition-colors ${
                activeTab === t.id ? "text-yellow-500 border-yellow-500 bg-yellow-500/5" : "text-zinc-500 border-transparent hover:text-zinc-300"
              }`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="flex-1 overflow-hidden flex flex-col">
          {activeTab === "overview"  && <OverviewTab ventes={ventes} depenses={depenses} period={period} onPeriodChange={p => { setPeriod(p); setActiveTab("overview") }} />}
          {activeTab === "produits"  && <ProduitsTab ventes={ventes} />}
          {activeTab === "clients"   && <ClientsTab societyId={activeSociety.id} />}
          {activeTab === "objectifs" && <ObjectifsTab ventes={ventes} societyId={activeSociety.id} />}
          {activeTab === "mois"      && <ComparaisonTab societyId={activeSociety.id} />}
        </div>
      )}
    </div>
  )
}