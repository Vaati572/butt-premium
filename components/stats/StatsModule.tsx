"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useUserSettings } from "@/lib/UserSettingsContext"
import { ChevronLeft, ChevronRight, Calendar, Package, Users, Clock } from "lucide-react"

interface Props { activeSociety: any; profile: any }

const MOIS_FR    = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"]
const MOIS_SHORT = ["Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"]

const PAIEMENT_COLORS: Record<string, string> = {
  "Espèces":       "#22c55e",
  "Carte Bancaire":"#3b82f6",
  "Virement":      "#a855f7",
  "Chèque":        "#f97316",
  "En attente":    "#ef4444",
}
const getPaiementColor = (mode: string) => PAIEMENT_COLORS[mode] || "#eab308"

export default function StatsModule({ activeSociety, profile }: Props) {
  const { settings } = useUserSettings()
  const ACCENT = settings.accent_color || "#eab308"
  const today = new Date()

  const [urssafRate,    setUrssafRate]    = useState(0.138)
  const [view,          setView]          = useState<"annee"|"mois"|"jour">("annee")
  const [year,          setYear]          = useState(today.getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth())
  const [selectedDay,   setSelectedDay]   = useState(today.toISOString().slice(0,10))
  const [statsView,     setStatsView]     = useState<"ca"|"marge">("ca")
  const [hoveredBar,    setHoveredBar]    = useState<number|null>(null)

  const [allVentesRaw, setAllVentesRaw] = useState<any[]>([])
  const [allDepenses,  setAllDepenses]  = useState<any[]>([])
  const [loading,      setLoading]      = useState(true)

  useEffect(() => {
    if (!activeSociety?.id) return
    supabase.from("settings").select("value")
      .eq("society_id", activeSociety.id).eq("key", "urssaf_rate_global").single()
      .then(({ data }) => { if (data?.value != null) setUrssafRate(Number(data.value)) })
  }, [activeSociety?.id])

  useEffect(() => {
    if (!activeSociety?.id) return
    const fetchAll = async () => {
      setLoading(true)
      const { data: ventes } = await supabase
        .from("ventes")
        .select("id,created_at,total_ttc,client_nom,paiement,vente_items(produit_nom,cf_unitaire,quantite,pv_unitaire)")
        .eq("society_id", activeSociety.id)
        .order("created_at", { ascending: false })
      const { data: deps } = await supabase.from("depenses").select("montant,created_at").eq("society_id", activeSociety.id)
      const ventesData = ventes || []
      setAllVentesRaw(ventesData)
      setAllDepenses(deps || [])
      if (ventesData.length > 0) setYear(new Date(ventesData[0].created_at).getFullYear())
      setLoading(false)
    }
    fetchAll()
  }, [activeSociety?.id])

  const allVentes = allVentesRaw.filter(v => new Date(v.created_at).getFullYear() === year)
  const depenses  = allDepenses.filter(d => new Date(d.created_at).getFullYear() === year)
    .reduce((s:number,d:any) => s + Number(d.montant||0), 0)

  const availableYears = [...new Set(allVentesRaw.map(v => new Date(v.created_at).getFullYear()))].sort((a,b)=>b-a)
  const minYear = availableYears.length > 0 ? Math.min(...availableYears) : today.getFullYear()

  // ── Calculs année ──
  const monthlyCA = new Array(12).fill(0)
  const monthlyNb = new Array(12).fill(0)
  const monthlyCF = new Array(12).fill(0)
  allVentes.forEach((v:any) => {
    const m = new Date(v.created_at).getMonth()
    monthlyCA[m] += Number(v.total_ttc||0)
    monthlyNb[m] += 1
    ;(v.vente_items||[]).forEach((it:any) => { monthlyCF[m] += Number(it.cf_unitaire||0) * Number(it.quantite||0) })
  })
  const totalCA       = monthlyCA.reduce((s,v)=>s+v,0)
  const totalCF       = monthlyCF.reduce((s,v)=>s+v,0)
  const urssafTotal   = totalCA * urssafRate
  const resultatFinal = totalCA - urssafTotal - totalCF - depenses

  // ── Calculs mois ──
  const ventesMonth = allVentes.filter(v => new Date(v.created_at).getMonth() === selectedMonth)
  const caMonth     = ventesMonth.reduce((s:number,v:any) => s + Number(v.total_ttc||0), 0)
  const daysInMonth = new Date(year, selectedMonth+1, 0).getDate()
  const dailyCA = new Array(daysInMonth).fill(0)
  const dailyNb = new Array(daysInMonth).fill(0)
  ventesMonth.forEach((v:any) => {
    const d = new Date(v.created_at).getDate()-1
    dailyCA[d] += Number(v.total_ttc||0)
    dailyNb[d] += 1
  })

  const prodStats: Record<string,{qty:number,ca:number}> = {}
  ventesMonth.forEach((v:any) => {
    ;(v.vente_items||[]).forEach((it:any) => {
      const k = it.produit_nom||"Inconnu"
      if (!prodStats[k]) prodStats[k] = {qty:0,ca:0}
      prodStats[k].qty += Number(it.quantite||0)
      prodStats[k].ca  += Number(it.pv_unitaire||0)*Number(it.quantite||0)
    })
  })
  const topProduits = Object.entries(prodStats).sort((a,b)=>b[1].ca-a[1].ca).slice(0,8)

  const clientStats: Record<string,number> = {}
  ventesMonth.forEach((v:any) => {
    if (v.client_nom) clientStats[v.client_nom] = (clientStats[v.client_nom]||0) + Number(v.total_ttc||0)
  })
  const topClients = Object.entries(clientStats).sort((a,b)=>b[1]-a[1]).slice(0,5)

  // ── Modes de paiement du mois ──
  const pmtStats: Record<string, number> = {}
  ventesMonth.forEach((v:any) => {
    const mode = v.paiement || "Non renseigné"
    pmtStats[mode] = (pmtStats[mode] || 0) + Number(v.total_ttc||0)
  })
  const pmtEntries: [string,number][] = Object.entries(pmtStats).sort((a,b)=>b[1]-a[1])

  // ── Modes de paiement de l'année ──
  const pmtYearStats: Record<string, number> = {}
  allVentes.forEach((v:any) => {
    const mode = v.paiement || "Non renseigné"
    pmtYearStats[mode] = (pmtYearStats[mode] || 0) + Number(v.total_ttc||0)
  })
  const pmtYearEntries: [string,number][] = Object.entries(pmtYearStats).sort((a,b)=>b[1]-a[1])

  // ── Calculs jour ──
  const ventesDay = allVentesRaw.filter(v => {
    const d = new Date(v.created_at)
    const ds = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`
    return ds === selectedDay
  })
  const caDay    = ventesDay.reduce((s:number,v:any) => s + Number(v.total_ttc||0), 0)
  const nbDay    = ventesDay.length
  const hourlyCA = new Array(14).fill(0)
  ventesDay.forEach((v:any) => {
    const h = new Date(v.created_at).getHours()
    if (h>=8 && h<=21) hourlyCA[h-8] += Number(v.total_ttc||0)
  })
  const maxHourly = Math.max(...hourlyCA, 1)

  // ── Modes paiement du jour ──
  const pmtDayStats: Record<string, number> = {}
  ventesDay.forEach((v:any) => {
    const mode = v.paiement || "Non renseigné"
    pmtDayStats[mode] = (pmtDayStats[mode] || 0) + Number(v.total_ttc||0)
  })
  const pmtDayEntries: [string,number][] = Object.entries(pmtDayStats).sort((a,b)=>b[1]-a[1])

  const anneeDisplay = statsView==="ca" ? monthlyCA : monthlyCA.map((ca,i)=>Math.max(0,ca-monthlyCF[i]))
  const moisDisplay  = statsView==="ca" ? dailyCA   : dailyCA.map(ca=>Math.max(0,ca))
  const maxAnnee = Math.max(...anneeDisplay, 1)
  const maxMois  = Math.max(...moisDisplay, 1)

  const Kpi = ({label,value,color}:{label:string,value:string,color:string}) => (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
      <p className="text-zinc-500 text-[11px] font-semibold uppercase tracking-wider mb-1">{label}</p>
      <p className="text-xl font-black" style={{color}}>{value}</p>
    </div>
  )

  /* ── Bloc modes de paiement ── */
  const PaiementBlock = ({ entries, total, title }: { entries: [string,number][]; total: number; title: string }) => {
    if (entries.length === 0) return null
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
        <p className="text-white font-bold text-sm mb-4">💳 {title}</p>
        <div className="space-y-3">
          {entries.map(([mode, ca]) => {
            const pct = Math.round((ca / (total||1)) * 100)
            const color = getPaiementColor(mode)
            const nb = (view === "annee" ? allVentes : view === "mois" ? ventesMonth : ventesDay)
              .filter((v:any) => (v.paiement || "Non renseigné") === mode).length
            return (
              <div key={mode}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }}/>
                    <span className="text-zinc-300 text-sm font-semibold">{mode}</span>
                    <span className="text-zinc-600 text-xs">· {nb} vente{nb>1?"s":""}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold" style={{ color }}>{ca.toFixed(2)}€</span>
                    <span className="text-zinc-600 text-xs w-8 text-right">{pct}%</span>
                  </div>
                </div>
                <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500" style={{ width:`${pct}%`, backgroundColor: color }}/>
                </div>
              </div>
            )
          })}
        </div>
        {/* Barre colorée composée */}
        <div className="flex h-2 rounded-full overflow-hidden mt-4 gap-0.5">
          {entries.map(([mode, ca]) => {
            const pct = (ca / (total||1)) * 100
            return <div key={mode} className="h-full rounded-sm transition-all" style={{ width:`${pct}%`, backgroundColor: getPaiementColor(mode) }} title={`${mode}: ${ca.toFixed(0)}€`}/>
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto bg-[#0a0a0a]">
      <div className="p-6 max-w-6xl mx-auto space-y-6">

        {/* HEADER */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-white">📊 Statistiques</h1>
            <p className="text-zinc-500 text-sm mt-0.5">{activeSociety?.name}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-xl p-1">
              {(["annee","mois","jour"] as const).map(v=>(
                <button key={v} onClick={()=>setView(v)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${view===v?"text-black":"text-zinc-500 hover:text-zinc-300"}`}
                  style={view===v?{backgroundColor:ACCENT}:{}}>
                  {v==="annee"?"Année":v==="mois"?"Mois":"Jour"}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2">
              <button onClick={()=>setYear(y=>y-1)} disabled={year<=minYear} className="text-zinc-500 hover:text-white disabled:opacity-30"><ChevronLeft size={14}/></button>
              <span className="text-white font-bold text-sm px-2">{year}</span>
              <button onClick={()=>setYear(y=>y+1)} disabled={year>=today.getFullYear()} className="text-zinc-500 hover:text-white disabled:opacity-30"><ChevronRight size={14}/></button>
            </div>
            {view==="mois" && (
              <select value={selectedMonth} onChange={e=>setSelectedMonth(Number(e.target.value))}
                className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none">
                {MOIS_FR.map((m,i)=><option key={i} value={i}>{m}</option>)}
              </select>
            )}
            {view==="jour" && (
              <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2">
                <Calendar size={13} className="text-zinc-500"/>
                <input type="date" value={selectedDay} onChange={e=>setSelectedDay(e.target.value)}
                  max={today.toISOString().slice(0,10)}
                  className="bg-transparent text-sm text-white focus:outline-none cursor-pointer"/>
              </div>
            )}
            <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-xl p-1">
              {(["ca","marge"] as const).map(v=>(
                <button key={v} onClick={()=>setStatsView(v)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${statsView===v?"text-black":"text-zinc-500 hover:text-zinc-300"}`}
                  style={statsView===v?{backgroundColor:ACCENT}:{}}>
                  {v==="ca"?"CA":"Marge"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{borderColor:ACCENT}}/>
          </div>

        ) : view==="annee" ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Kpi label="CA Brut"         value={totalCA.toFixed(2)+"€"}                color={ACCENT}/>
              <Kpi label="Net URSSAF"       value={(totalCA*(1-urssafRate)).toFixed(2)+"€"} color="#22c55e"/>
              <Kpi label="Coût fabrication" value={totalCF.toFixed(2)+"€"}               color="#f97316"/>
              <Kpi label="Résultat final"   value={resultatFinal.toFixed(2)+"€"}          color={resultatFinal>=0?"#22c55e":"#ef4444"}/>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
              <p className="text-white font-bold mb-6">{statsView==="ca"?"CA":"Marge"} par mois — {year}</p>
              {totalCA===0 ? (
                <div className="py-12 text-center text-zinc-600 text-sm">Aucune vente pour {year}</div>
              ) : (
                <>
                  <div className="flex items-end gap-1 h-48 mb-2">
                    {anneeDisplay.map((val,i)=>{
                      const isNow = i===today.getMonth()&&year===today.getFullYear()
                      const barH  = Math.max((val/maxAnnee)*170,val>0?4:2)
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1 cursor-pointer"
                          onClick={()=>{setSelectedMonth(i);setView("mois")}}
                          onMouseEnter={()=>setHoveredBar(i)} onMouseLeave={()=>setHoveredBar(null)}>
                          <div className={`text-white text-[10px] font-bold bg-zinc-800 border border-zinc-700 px-2 py-1 rounded-lg whitespace-nowrap transition-opacity ${hoveredBar===i&&val>0?"opacity-100":"opacity-0"}`}>
                            {val.toFixed(0)}€ <span className="text-zinc-500">({monthlyNb[i]})</span>
                          </div>
                          <div className="w-full rounded-t-lg transition-all duration-200"
                            style={{height:`${barH}px`,backgroundColor:hoveredBar===i?ACCENT:isNow?ACCENT+"80":val>0?ACCENT+"50":"#3f3f46"}}/>
                        </div>
                      )
                    })}
                  </div>
                  <div className="flex gap-1">
                    {MOIS_SHORT.map((m,i)=>(
                      <div key={i} className="flex-1 text-center">
                        <p className={`text-[10px] font-semibold ${i===today.getMonth()&&year===today.getFullYear()?"text-white":"text-zinc-600"}`}>{m}</p>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-zinc-800"><p className="text-white font-bold">Récap financier {year}</p></div>
              <div className="divide-y divide-zinc-800">
                {[
                  {label:"CA Brut",                                  value:"+"+totalCA.toFixed(2)+"€",     color:ACCENT},
                  {label:`URSSAF (${(urssafRate*100).toFixed(0)}%)`, value:"-"+urssafTotal.toFixed(2)+"€", color:"#ef4444"},
                  {label:"Coût fabrication",                          value:"-"+totalCF.toFixed(2)+"€",    color:"#f97316"},
                  {label:"Dépenses",                                  value:"-"+depenses.toFixed(2)+"€",   color:"#ef4444"},
                ].map(({label,value,color})=>(
                  <div key={label} className="flex items-center justify-between px-6 py-3">
                    <span className="text-zinc-400 text-sm">{label}</span>
                    <span className="font-bold text-sm" style={{color}}>{value}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between px-6 py-4 bg-zinc-800/50">
                  <span className="text-white font-bold">Résultat final</span>
                  <span className="text-xl font-black" style={{color:resultatFinal>=0?"#22c55e":"#ef4444"}}>{resultatFinal.toFixed(2)}€</span>
                </div>
              </div>
            </div>

            {/* Modes de paiement année */}
            <PaiementBlock entries={pmtYearEntries} total={totalCA} title={`Modes de paiement — ${year}`}/>
          </>

        ) : view==="mois" ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Kpi label={MOIS_FR[selectedMonth]+" CA"} value={caMonth.toFixed(2)+"€"}                                            color={ACCENT}/>
              <Kpi label="Net URSSAF"                    value={(caMonth*(1-urssafRate)).toFixed(2)+"€"}                            color="#22c55e"/>
              <Kpi label="Nb ventes"                     value={String(ventesMonth.length)}                                         color="#a78bfa"/>
              <Kpi label="Panier moyen"                  value={ventesMonth.length?(caMonth/ventesMonth.length).toFixed(2)+"€":"—"} color="#f97316"/>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
              <p className="text-white font-bold mb-4 text-sm">
                CA par jour — {MOIS_FR[selectedMonth]} {year}
                <span className="text-zinc-500 font-normal text-xs ml-2">(cliquer un jour → détail)</span>
              </p>
              {caMonth===0 ? (
                <div className="py-10 text-center text-zinc-600 text-sm">Aucune vente ce mois</div>
              ) : (
                <>
                  <div className="flex items-end gap-0.5 h-32 mb-2">
                    {moisDisplay.map((val,i)=>{
                      const ds = `${year}-${String(selectedMonth+1).padStart(2,"0")}-${String(i+1).padStart(2,"0")}`
                      const isToday = ds===today.toISOString().slice(0,10)
                      const barH = Math.max((val/maxMois)*110,val>0?3:1)
                      return (
                        <div key={i} className="flex flex-col items-center gap-0.5 cursor-pointer flex-1"
                          onClick={()=>{ setSelectedDay(ds); setView("jour") }}
                          onMouseEnter={()=>setHoveredBar(i+100)} onMouseLeave={()=>setHoveredBar(null)}>
                          {hoveredBar===i+100&&val>0&&(
                            <div className="text-white text-[9px] font-bold bg-zinc-800 px-1.5 py-0.5 rounded whitespace-nowrap">{val.toFixed(0)}€</div>
                          )}
                          <div className="w-full rounded-t-sm" style={{height:`${barH}px`,backgroundColor:isToday?ACCENT:val>0?ACCENT+"60":"#3f3f46"}}/>
                        </div>
                      )
                    })}
                  </div>
                  <div className="flex gap-0.5">
                    {moisDisplay.map((_,i)=>(
                      <div key={i} className="flex-1 text-center"><p className="text-[9px] text-zinc-700">{i+1}</p></div>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4"><Package size={14} className="text-zinc-400"/><p className="text-white font-bold text-sm">Top produits</p></div>
                {topProduits.length===0 ? <p className="text-zinc-600 text-sm">Aucune vente</p> : (
                  <div className="space-y-2.5">
                    {topProduits.map(([nom,{qty,ca}],i)=>{
                      const pct=(ca/(caMonth||1))*100
                      return (
                        <div key={nom}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-zinc-300 text-xs truncate flex-1 mr-2"><span className="text-zinc-600 mr-1">#{i+1}</span>{nom}</span>
                            <span className="text-xs font-bold shrink-0" style={{color:ACCENT}}>{ca.toFixed(0)}€</span>
                            <span className="text-zinc-500 text-xs ml-1.5 shrink-0">×{qty}</span>
                          </div>
                          <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{width:`${pct}%`,backgroundColor:ACCENT+"80"}}/>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4"><Users size={14} className="text-zinc-400"/><p className="text-white font-bold text-sm">Top clients</p></div>
                {topClients.length===0 ? <p className="text-zinc-600 text-sm">Aucun client</p> : (
                  <div className="space-y-2.5">
                    {topClients.map(([nom,ca],i)=>{
                      const pct=(ca/(caMonth||1))*100
                      return (
                        <div key={nom}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-zinc-300 text-xs truncate flex-1 mr-2"><span className="text-zinc-600 mr-1">#{i+1}</span>{nom}</span>
                            <span className="text-xs font-bold" style={{color:"#22c55e"}}>{ca.toFixed(0)}€</span>
                          </div>
                          <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{width:`${pct}%`,backgroundColor:"#22c55e60"}}/>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Modes de paiement mois */}
            <PaiementBlock entries={pmtEntries} total={caMonth} title={`Modes de paiement — ${MOIS_FR[selectedMonth]} ${year}`}/>
          </>

        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Kpi label="CA du jour"   value={caDay.toFixed(2)+"€"}                   color={ACCENT}/>
              <Kpi label="Net URSSAF"   value={(caDay*(1-urssafRate)).toFixed(2)+"€"}   color="#22c55e"/>
              <Kpi label="Nb ventes"    value={String(nbDay)}                           color="#a78bfa"/>
              <Kpi label="Panier moyen" value={nbDay?(caDay/nbDay).toFixed(2)+"€":"—"} color="#f97316"/>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Clock size={14} className="text-zinc-400"/>
                <p className="text-white font-bold text-sm">
                  Ventes par heure — {new Date(selectedDay+"T12:00:00").toLocaleDateString("fr-FR",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}
                </p>
              </div>
              {nbDay===0 ? (
                <div className="py-10 text-center text-zinc-600 text-sm">Aucune vente ce jour</div>
              ) : (
                <>
                  <div className="flex items-end gap-2 h-32 mb-2">
                    {hourlyCA.map((val,i)=>{
                      const barH=Math.max((val/maxHourly)*110,val>0?4:2)
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1"
                          onMouseEnter={()=>setHoveredBar(i+200)} onMouseLeave={()=>setHoveredBar(null)}>
                          {hoveredBar===i+200&&val>0&&(
                            <div className="text-white text-[9px] font-bold bg-zinc-800 px-1.5 py-0.5 rounded">{val.toFixed(0)}€</div>
                          )}
                          <div className="w-full rounded-t-lg" style={{height:`${barH}px`,backgroundColor:val>0?ACCENT+"90":"#3f3f46"}}/>
                        </div>
                      )
                    })}
                  </div>
                  <div className="flex gap-2">
                    {hourlyCA.map((_,i)=>(
                      <div key={i} className="flex-1 text-center"><p className="text-[10px] text-zinc-600">{i+8}h</p></div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Modes de paiement jour */}
            {pmtDayEntries.length > 0 && (
              <PaiementBlock entries={pmtDayEntries} total={caDay} title="Modes de paiement du jour"/>
            )}

            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
                <p className="text-white font-bold text-sm">Ventes du jour ({nbDay})</p>
                <p className="text-zinc-500 text-xs">{caDay.toFixed(2)}€</p>
              </div>
              {ventesDay.length===0 ? (
                <div className="text-center py-10 text-zinc-600 text-sm">Aucune vente ce jour</div>
              ) : (
                <div className="divide-y divide-zinc-800">
                  {ventesDay.map((v:any)=>(
                    <div key={v.id} className="flex items-start justify-between px-5 py-3">
                      <div>
                        <p className="text-white text-sm font-semibold">{v.client_nom||"—"}</p>
                        <p className="text-zinc-500 text-xs">
                          {new Date(v.created_at).toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"})}
                          {v.paiement && <span className="ml-2 text-zinc-600">{v.paiement}</span>}
                        </p>
                        {(v.vente_items||[]).length>0 && (
                          <p className="text-zinc-600 text-[10px] mt-0.5">
                            {(v.vente_items as any[]).map((it:any)=>`${it.produit_nom} ×${it.quantite}`).join(" · ")}
                          </p>
                        )}
                      </div>
                      <p className="text-sm font-bold shrink-0 ml-3" style={{color:ACCENT}}>{Number(v.total_ttc||0).toFixed(2)}€</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}