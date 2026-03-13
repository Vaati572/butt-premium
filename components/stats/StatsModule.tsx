"use client"

import { useEffect, useState, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import { useUserSettings } from "@/lib/UserSettingsContext"

interface Props { activeSociety: any; profile: any }

const MOIS_FR = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"]
const MOIS_SHORT = ["Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"]

export default function StatsModule({ activeSociety, profile }: Props) {
  const { settings } = useUserSettings()
  const ACCENT = settings.accent_color || "#eab308"
  const [urssafRate, setUrssafRate] = useState(0.138)

  useEffect(() => {
    if (!activeSociety?.id) return
    // Charge le taux URSSAF global depuis la table settings (même logique que VenteModule)
    supabase.from("settings").select("value")
      .eq("society_id", activeSociety.id).eq("key", "urssaf_rate_global").single()
      .then(({ data }) => { if (data?.value != null) setUrssafRate(Number(data.value)) })
  }, [activeSociety?.id])

  const [year, setYear] = useState(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null)
  const [monthlyCA, setMonthlyCA]     = useState<number[]>(new Array(12).fill(0))
  const [monthlyNb, setMonthlyNb]     = useState<number[]>(new Array(12).fill(0))
  const [monthlyCF, setMonthlyCF]     = useState<number[]>(new Array(12).fill(0))
  const [depenses, setDepenses]        = useState(0)
  const [loading, setLoading]          = useState(true)
  const [hoveredBar, setHoveredBar]    = useState<number | null>(null)
  const [view, setView]                = useState<"ca" | "marge">("ca")

  const load = useCallback(async () => {
    if (!activeSociety?.id) return
    setLoading(true)

    const start = `${year}-01-01T00:00:00`
    const end   = `${year}-12-31T23:59:59`

    const [{ data: ventes }, { data: deps }] = await Promise.all([
      supabase.from("ventes").select("created_at, total_ttc, vente_items(cf_unitaire, quantite)")
        .eq("society_id", activeSociety.id)
        .gte("created_at", start)
        .lte("created_at", end),
      supabase.from("depenses").select("montant")
        .eq("society_id", activeSociety.id)
        .gte("created_at", start)
        .lte("created_at", end),
    ])

    const ca  = new Array(12).fill(0)
    const nb  = new Array(12).fill(0)
    const cf  = new Array(12).fill(0)

    ;(ventes || []).forEach((v: any) => {
      const m = new Date(v.created_at).getMonth()
      ca[m] += Number(v.total_ttc || 0)
      nb[m] += 1
      // sum CF from items
      ;(v.vente_items || []).forEach((it: any) => {
        cf[m] += Number(it.cf_unitaire || 0) * Number(it.quantite || 0)
      })
    })

    setMonthlyCA(ca)
    setMonthlyNb(nb)
    setMonthlyCF(cf)
    setDepenses((deps || []).reduce((s: number, d: any) => s + Number(d.montant || 0), 0))
    setLoading(false)
  }, [activeSociety?.id, year])

  useEffect(() => { load() }, [load])

  const totalCA     = monthlyCA.reduce((s, v) => s + v, 0)
  const totalCF     = monthlyCF.reduce((s, v) => s + v, 0)
  const urssafTotal = totalCA * urssafRate
  const resultatFinal = totalCA - urssafTotal - totalCF - depenses

  const displayData = view === "ca"
    ? monthlyCA
    : monthlyCA.map((ca, i) => Math.max(0, ca - monthlyCF[i]))

  const maxVal = Math.max(...displayData, 1)
  const currentM = new Date().getMonth()
  const currentY = new Date().getFullYear()

  return (
    <div className="flex-1 overflow-y-auto bg-[#0a0a0a]">
      <div className="p-6 max-w-6xl mx-auto space-y-6">

        {/* Header + controls */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-white">📊 Statistiques</h1>
            <p className="text-zinc-500 text-sm mt-0.5">{activeSociety?.name}</p>
          </div>
          <div className="flex items-center gap-3">
            {/* View toggle */}
            <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-xl p-1">
              {(["ca", "marge"] as const).map(v => (
                <button key={v} onClick={() => setView(v)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${view===v ? "text-black" : "text-zinc-500 hover:text-zinc-300"}`}
                  style={view===v ? { backgroundColor: ACCENT } : {}}>
                  {v === "ca" ? "CA" : "Marge"}
                </button>
              ))}
            </div>

            {/* Year selector */}
            <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2">
              <button onClick={() => setYear(y => y - 1)} className="text-zinc-500 hover:text-white w-5 h-5 flex items-center justify-center">‹</button>
              <span className="text-white font-bold text-sm px-2">{year}</span>
              <button onClick={() => setYear(y => y + 1)} disabled={year >= currentY}
                className="text-zinc-500 hover:text-white disabled:opacity-30 w-5 h-5 flex items-center justify-center">›</button>
            </div>
          </div>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "CA Brut", value: totalCA.toFixed(2)+"€", color: ACCENT },
            { label: "Net URSSAF", value: (totalCA * (1-urssafRate)).toFixed(2)+"€", color: "#22c55e" },
            { label: "Coût fabrication", value: totalCF.toFixed(2)+"€", color: "#f97316" },
            { label: "Résultat final", value: resultatFinal.toFixed(2)+"€", color: resultatFinal >= 0 ? "#22c55e" : "#ef4444" },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
              <p className="text-zinc-500 text-[11px] font-semibold uppercase tracking-wider mb-1">{label}</p>
              <p className="text-xl font-black" style={{ color }}>{value}</p>
            </div>
          ))}
        </div>

        {/* GRAPHIQUE principal Jan→Déc */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <p className="text-white font-bold">
              {view === "ca" ? "CA" : "Marge nette"} par mois — {year}
            </p>
            {selectedMonth !== null && (
              <button onClick={() => setSelectedMonth(null)} className="text-xs text-zinc-500 hover:text-white">
                ✕ Désélectionner
              </button>
            )}
          </div>

          {loading ? (
            <div className="h-48 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: ACCENT }} />
            </div>
          ) : (
            <>
              {/* Bars */}
              <div className="flex items-end gap-1 h-48 mb-2">
                {displayData.map((val, i) => {
                  const isCurrentMonth = i === currentM && year === currentY
                  const isSelected = selectedMonth === i
                  const isHovered = hoveredBar === i
                  const barH = Math.max((val / maxVal) * 170, val > 0 ? 6 : 2)
                  const opacity = selectedMonth !== null && !isSelected ? "opacity-30" : ""

                  return (
                    <div key={i} className={`flex-1 flex flex-col items-center gap-1 cursor-pointer group ${opacity}`}
                      onClick={() => setSelectedMonth(isSelected ? null : i)}
                      onMouseEnter={() => setHoveredBar(i)}
                      onMouseLeave={() => setHoveredBar(null)}>

                      {/* Tooltip */}
                      <div className={`text-white text-[10px] font-bold bg-zinc-800 border border-zinc-700 px-2 py-1 rounded-lg whitespace-nowrap transition-opacity ${(isHovered || isSelected) && val > 0 ? "opacity-100" : "opacity-0"}`}>
                        {val.toFixed(0)}€
                        {monthlyNb[i] > 0 && <span className="text-zinc-500 ml-1">({monthlyNb[i]})</span>}
                      </div>

                      {/* Bar */}
                      <div
                        className="w-full rounded-t-lg transition-all duration-300"
                        style={{
                          height: `${barH}px`,
                          backgroundColor: isSelected || isHovered
                            ? ACCENT
                            : isCurrentMonth
                              ? ACCENT + "80"
                              : val > 0 ? ACCENT + "50" : "#3f3f46",
                          boxShadow: isSelected ? `0 0 12px ${ACCENT}60` : "none",
                        }}
                      />
                    </div>
                  )
                })}
              </div>

              {/* Month labels */}
              <div className="flex gap-1">
                {MOIS_SHORT.map((m, i) => (
                  <div key={i} className="flex-1 text-center">
                    <p className={`text-[10px] font-semibold ${i === currentM && year === currentY ? "text-white" : "text-zinc-600"}`}>
                      {m}
                    </p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Détail mois sélectionné */}
        {selectedMonth !== null && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <h3 className="text-white font-bold mb-4">
              Détail — {MOIS_FR[selectedMonth]} {year}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "CA Brut", value: monthlyCA[selectedMonth].toFixed(2)+"€", color: ACCENT },
                { label: "URSSAF", value: "-"+(monthlyCA[selectedMonth]*urssafRate).toFixed(2)+"€", color: "#ef4444" },
                { label: "Net URSSAF", value: (monthlyCA[selectedMonth]*(1-urssafRate)).toFixed(2)+"€", color: "#22c55e" },
                { label: "Nb ventes", value: String(monthlyNb[selectedMonth]), color: "#a78bfa" },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-zinc-800 rounded-xl p-4">
                  <p className="text-zinc-500 text-[11px] uppercase tracking-wider mb-1">{label}</p>
                  <p className="text-lg font-bold" style={{ color }}>{value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Récap financier annuel */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-800">
            <p className="text-white font-bold">Récap financier {year}</p>
          </div>
          <div className="divide-y divide-zinc-800">
            {[
              { label: "CA Brut", value: "+"+totalCA.toFixed(2)+"€", color: ACCENT },
              { label: `URSSAF (${(urssafRate*100).toFixed(0)}%)`, value: "-"+urssafTotal.toFixed(2)+"€", color: "#ef4444" },
              { label: "Coût fabrication", value: "-"+totalCF.toFixed(2)+"€", color: "#f97316" },
              { label: "Dépenses", value: "+"+depenses.toFixed(2)+"€", color: "#ef4444" },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex items-center justify-between px-6 py-3">
                <span className="text-zinc-400 text-sm">{label}</span>
                <span className="font-bold text-sm" style={{ color }}>{value}</span>
              </div>
            ))}
            <div className="flex items-center justify-between px-6 py-4 bg-zinc-800/50">
              <span className="text-white font-bold">Résultat final</span>
              <span className="text-xl font-black" style={{ color: resultatFinal >= 0 ? "#22c55e" : "#ef4444" }}>
                {resultatFinal.toFixed(2)}€
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}