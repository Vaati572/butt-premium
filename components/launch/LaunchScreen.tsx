"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { X, Package, AlertTriangle, CheckCircle2, Truck, ChevronRight } from "lucide-react"

interface Props {
  profile: any
  activeSociety: any
  topTabs: { id: string; label: string; icon: string }[]
  onClose: (tabId?: string) => void
}

interface BriefingData {
  stockCritiques: number
  inactifsCount: number
  tachesUrgentes: { id: string; titre: string; priorite: string }[]
  livraisonsCount: number
  agendaToday: { id: string; titre: string; heure?: string; couleur?: string }[]
  tachesToday: { id: string; titre: string; priorite: string }[]
}

const PRIO_STYLE: Record<string, { label: string; color: string; bg: string }> = {
  urgente: { label: "Urgent",  color: "#ef4444", bg: "rgba(239,68,68,0.15)"  },
  haute:   { label: "Haute",   color: "#f97316", bg: "rgba(249,115,22,0.15)" },
  normale: { label: "Normale", color: "#3b82f6", bg: "rgba(59,130,246,0.12)" },
  basse:   { label: "Basse",   color: "#71717a", bg: "rgba(113,113,122,0.12)"},
}

const GREETING = () => {
  const h = new Date().getHours()
  if (h < 6) return "Bonne nuit"
  if (h < 12) return "Bonjour"
  if (h < 18) return "Bon après-midi"
  return "Bonsoir"
}

const dateStr = () => {
  const d = new Date()
  return d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
}

const timeStr = () => new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })

export default function LaunchScreen({ profile, activeSociety, topTabs, onClose }: Props) {
  const [data, setData] = useState<BriefingData | null>(null)
  const [time, setTime] = useState(timeStr())
  const [closing, setClosing] = useState(false)

  useEffect(() => {
    const t = setInterval(() => setTime(timeStr()), 30000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    if (!activeSociety?.id) return
    const todayStr = new Date().toISOString().slice(0, 10)
    const societyId = activeSociety.id

    Promise.all([
      // stocks critiques
      supabase.from("stock").select("quantite,seuil_alerte").eq("society_id", societyId),
      // clients inactifs (dernière commande avec date)
      supabase.from("suivi_commandes").select("client_id,date_commande")
        .eq("society_id", societyId).not("date_commande","is",null)
        .order("date_commande", { ascending: false }),
      supabase.from("suivi_clients").select("client_id").eq("society_id", societyId),
      // tâches urgentes/aujourd'hui (liste_taches)
      supabase.from("liste_taches").select("id,titre,priorite,echeance")
        .eq("society_id", societyId).not("statut","in","(termine,annulee)"),
      // livraisons en cours
      supabase.from("suivi_commandes").select("id").eq("society_id", societyId)
        .eq("statut_colis","en_livraison"),
      // agenda aujourd'hui (table taches de l'agenda)
      supabase.from("taches").select("id,titre,heure,couleur,date")
        .eq("society_id", societyId).eq("date", todayStr).eq("done", false)
        .order("heure", { ascending: true }),
    ]).then(([stockR, cmdsR, suivisR, tachesR, livrR, agendaR]) => {
      const stockCritiques = (stockR.data || []).filter((s: any) =>
        s.quantite < 0 || (s.seuil_alerte > 0 && s.quantite <= s.seuil_alerte)
      ).length

      // inactifs : clients sans commande depuis 25j+
      const lastMap: Record<string, string> = {}
      ;(cmdsR.data || []).forEach((c: any) => { if (!lastMap[c.client_id]) lastMap[c.client_id] = c.date_commande })
      const today = new Date()
      const inactifsCount = (suivisR.data || []).filter((sc: any) => {
        const last = lastMap[sc.client_id]
        if (!last) return true
        const diff = Math.floor((today.getTime() - new Date(last).getTime()) / 86400000)
        return diff >= 25
      }).length

      const allTaches = (tachesR.data || []) as any[]
      const tachesUrgentes = allTaches
        .filter(t => t.priorite === "urgente" || t.priorite === "haute")
        .sort((a, b) => {
          const order = { urgente: 0, haute: 1 }
          return (order[a.priorite as keyof typeof order] ?? 2) - (order[b.priorite as keyof typeof order] ?? 2)
        })
        .slice(0, 4)
      const tachesToday = allTaches.filter(t => t.echeance === todayStr).slice(0, 3)

      setData({
        stockCritiques,
        inactifsCount,
        tachesUrgentes,
        livraisonsCount: (livrR.data || []).length,
        agendaToday: (agendaR.data || []).slice(0, 4) as any[],
        tachesToday,
      })
    })
  }, [activeSociety?.id])

  const handleClose = (tabId?: string) => {
    setClosing(true)
    setTimeout(() => onClose(tabId), 250)
  }

  const prenom = profile?.prenom || profile?.nom?.split(" ")[0] || profile?.email?.split("@")[0] || "toi"
  const alerts = data ? [
    { value: data.stockCritiques, label: "stocks critiques", icon: Package, color: "#ef4444", bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.25)" },
    { value: data.inactifsCount, label: "clients −25j", icon: AlertTriangle, color: "#f97316", bg: "rgba(249,115,22,0.08)", border: "rgba(249,115,22,0.25)" },
    { value: data.tachesUrgentes.length, label: "tâches urgentes", icon: CheckCircle2, color: "#3b82f6", bg: "rgba(59,130,246,0.08)", border: "rgba(59,130,246,0.25)" },
    { value: data.livraisonsCount, label: "livraisons en cours", icon: Truck, color: "#f97316", bg: "rgba(234,179,8,0.08)", border: "rgba(234,179,8,0.25)" },
  ] : []

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)", transition: "opacity 250ms", opacity: closing ? 0 : 1 }}>
      <div className="w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl flex flex-col"
        style={{ backgroundColor: "#0a0a0a", border: "0.5px solid #27272a", maxHeight: "90vh" }}>

        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b shrink-0" style={{ borderColor: "#18181b" }}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: "#52525b" }}>
                ✦ Briefing du {dateStr()}
              </p>
              <h1 className="text-2xl font-bold text-white mb-0.5">
                {GREETING()}, {prenom} 👋
              </h1>
              <p className="text-sm" style={{ color: "#52525b" }}>{time}</p>
            </div>
            <button onClick={() => handleClose("vente")}
              className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold shrink-0 transition-colors"
              style={{ backgroundColor: "#18181b", border: "0.5px solid #27272a", color: "#71717a" }}>
              <X size={13}/> Fermer → Vente
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
          {/* Alertes */}
          {!data ? (
            <div className="grid grid-cols-4 gap-3">
              {[0,1,2,3].map(i => (
                <div key={i} className="h-16 rounded-xl animate-pulse" style={{ backgroundColor: "#18181b" }}/>
              ))}
            </div>
          ) : (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-2.5" style={{ color: "#52525b" }}>Alertes du jour</p>
              <div className="grid grid-cols-4 gap-2">
                {alerts.map(({ value, label, icon: Icon, color, bg, border }) => (
                  <div key={label} className="rounded-xl p-3 border flex flex-col gap-1.5"
                    style={{ backgroundColor: bg, borderColor: border }}>
                    <div className="flex items-center justify-between">
                      <span className="text-xl font-black" style={{ color }}>{value}</span>
                      <Icon size={14} style={{ color, opacity: 0.7 }}/>
                    </div>
                    <p className="text-[10px] font-semibold" style={{ color }}>{label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Agenda + Tâches */}
          <div className="grid grid-cols-2 gap-3">
            {/* Agenda */}
            <div className="rounded-xl p-4 border" style={{ backgroundColor: "#111", borderColor: "#1f1f1f" }}>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: "#52525b" }}>📅 Agenda aujourd'hui</p>
              {!data ? (
                <div className="space-y-2">{[0,1,2].map(i => <div key={i} className="h-8 rounded-lg animate-pulse" style={{ backgroundColor: "#1a1a1a" }}/>)}</div>
              ) : data.agendaToday.length === 0 ? (
                <p className="text-xs" style={{ color: "#3f3f46" }}>Rien de prévu aujourd'hui</p>
              ) : data.agendaToday.map(ev => (
                <div key={ev.id} className="flex items-center gap-2.5 py-2 border-b" style={{ borderColor: "#1a1a1a" }}>
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: ev.couleur || "#eab308" }}/>
                  <span className="text-xs flex-1 truncate" style={{ color: "#d4d4d8" }}>{ev.titre}</span>
                  {(ev as any).heure && <span className="text-[10px] shrink-0" style={{ color: "#52525b" }}>{(ev as any).heure?.slice(0, 5)}</span>}
                </div>
              ))}
            </div>

            {/* Tâches prioritaires */}
            <div className="rounded-xl p-4 border" style={{ backgroundColor: "#111", borderColor: "#1f1f1f" }}>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: "#52525b" }}>✅ Tâches prioritaires</p>
              {!data ? (
                <div className="space-y-2">{[0,1,2].map(i => <div key={i} className="h-8 rounded-lg animate-pulse" style={{ backgroundColor: "#1a1a1a" }}/>)}</div>
              ) : data.tachesUrgentes.length === 0 && data.tachesToday.length === 0 ? (
                <p className="text-xs" style={{ color: "#3f3f46" }}>Aucune tâche urgente 🎉</p>
              ) : [...data.tachesToday.filter(t => !data.tachesUrgentes.find(u => u.id === t.id)), ...data.tachesUrgentes]
                .slice(0, 4).map(t => {
                  const prio = PRIO_STYLE[t.priorite] || PRIO_STYLE.normale
                  return (
                    <div key={t.id} className="flex items-center gap-2.5 py-2 border-b" style={{ borderColor: "#1a1a1a" }}>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0"
                        style={{ backgroundColor: prio.bg, color: prio.color }}>{prio.label}</span>
                      <span className="text-xs flex-1 truncate" style={{ color: "#d4d4d8" }}>{t.titre}</span>
                    </div>
                  )
                })
              }
            </div>
          </div>
        </div>

        {/* Footer : raccourcis */}
        <div className="px-6 py-4 shrink-0 border-t" style={{ borderColor: "#18181b" }}>
          <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: "#52525b" }}>Tes raccourcis habituels</p>
          <div className="flex gap-2 flex-wrap mb-3">
            {topTabs.map((tab, i) => (
              <button key={tab.id} onClick={() => handleClose(tab.id)}
                className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold transition-colors"
                style={{
                  backgroundColor: i < 2 ? "rgba(234,179,8,0.08)" : "#111",
                  border: `0.5px solid ${i < 2 ? "rgba(234,179,8,0.35)" : "#27272a"}`,
                  color: i < 2 ? "#eab308" : "#a1a1aa",
                }}>
                <span>{tab.icon}</span>
                {tab.label}
                {i < 2 && <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#eab308" }}/>}
              </button>
            ))}
          </div>
          <button onClick={() => handleClose("vente")}
            className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors"
            style={{ backgroundColor: "#eab308", color: "#000" }}>
            Commencer la journée sur Vente <ChevronRight size={16}/>
          </button>
        </div>
      </div>
    </div>
  )
}
