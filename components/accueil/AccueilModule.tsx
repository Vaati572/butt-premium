"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import { supabase } from "@/lib/supabase"
import { useUserSettings } from "@/lib/UserSettingsContext"

interface Props {
  activeSociety: any
  profile: any
}

/* ───────────────────────────────────────────────
   HELPERS
─────────────────────────────────────────────── */
const today = () => new Date().toISOString().slice(0, 10)
const startOfWeek = () => {
  const d = new Date()
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  return d.toISOString().slice(0, 10)
}
const startOfMonth = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`
}
const daysAgo = (n: number) => {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}
const formatEuro = (n: number) =>
  isNaN(n) ? "—" : n.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + " €"
const formatEuroDec = (n: number) =>
  isNaN(n) ? "—" : n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €"

const DEFAULT_SETTINGS = {
  showKpis: true,
  showObjectifs: true,
  showAlertes: true,
  showVentesJour: true,
  showTopProduits: true,
  showEquipe: true,
  showAgenda: true,
  showGraph7j: true,
  showClientsProspects: true,
  showStock: true,
  showMemo: true,
  showRaccourcis: true,
  objectifJour: 150,
  objectifMois: 3000,
  urssafRate: 0.22,
  dense: true,
}

type AccueilSettings = typeof DEFAULT_SETTINGS

/* ───────────────────────────────────────────────
   COMPOSANT PRINCIPAL
─────────────────────────────────────────────── */
export default function AccueilModule({ activeSociety, profile }: Props) {
  const { settings: userSettings } = useUserSettings()
  const ACCENT = userSettings.accent_color || "#eab308"

  const [loading, setLoading] = useState(true)
  const [showSettings, setShowSettings] = useState(false)
  const [accueilSettings, setAccueilSettings] = useState<AccueilSettings>(DEFAULT_SETTINGS)

  // Data
  const [ventesToday, setVentesToday] = useState<any[]>([])
  const [ventesWeek, setVentesWeek] = useState<any[]>([])
  const [ventesMonth, setVentesMonth] = useState<any[]>([])
  const [ventes7j, setVentes7j] = useState<any[]>([])
  const [stock, setStock] = useState<any[]>([])
  const [taches, setTaches] = useState<any[]>([])
  const [agenda, setAgenda] = useState<any[]>([])
  const [messagesUnread, setMessagesUnread] = useState(0)
  const [conventions, setConventions] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [prospects, setProspects] = useState<any[]>([])
  const [team, setTeam] = useState<any[]>([])
  const [memo, setMemo] = useState("")
  const [editMemo, setEditMemo] = useState(false)
  const [memoInput, setMemoInput] = useState("")

  const SETTINGS_KEY = `accueil_settings_${profile?.id || "default"}`
  const MEMO_KEY = `accueil_memo_${profile?.id || "default"}`

  // Charger settings + memo
  useEffect(() => {
    try {
      const s = localStorage.getItem(SETTINGS_KEY)
      if (s) setAccueilSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(s) })
      const m = localStorage.getItem(MEMO_KEY)
      if (m) setMemo(m)
    } catch {}
  }, [profile?.id])

  const saveSettings = (next: AccueilSettings) => {
    setAccueilSettings(next)
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(next)) } catch {}
  }

  // ─── Chargement des données ───
  const load = useCallback(async () => {
    if (!activeSociety?.id) return
    setLoading(true)

    const t = today()
    const w = startOfWeek()
    const m = startOfMonth()
    const d7 = daysAgo(7)

    try {
      const [
        { data: vToday },
        { data: vWeek },
        { data: vMonth },
        { data: v7 },
        { data: stk },
        { data: tch },
        { data: ag },
        { data: conv },
        { data: cli },
        { data: pro },
        { data: members },
        { count: msgCount },
      ] = await Promise.all([
        supabase.from("ventes").select("*, vente_items(*)")
          .eq("society_id", activeSociety.id)
          .gte("created_at", t + "T00:00:00")
          .order("created_at", { ascending: false }),
        supabase.from("ventes").select("total_ttc, created_at, profile_id")
          .eq("society_id", activeSociety.id)
          .gte("created_at", w),
        supabase.from("ventes").select("total_ttc, total_ht, created_at, profile_id, vente_items(*)")
          .eq("society_id", activeSociety.id)
          .gte("created_at", m),
        supabase.from("ventes").select("total_ttc, created_at")
          .eq("society_id", activeSociety.id)
          .gte("created_at", d7)
          .order("created_at"),
        supabase.from("stock").select("*").eq("society_id", activeSociety.id),
        supabase.from("liste_taches").select("*")
          .eq("society_id", activeSociety.id)
          .not("statut", "in", "(termine,annulee)"),
        supabase.from("taches").select("*")
          .eq("society_id", activeSociety.id)
          .gte("date", t)
          .order("date").order("heure_debut")
          .limit(8),
        supabase.from("conventions").select("*")
          .eq("society_id", activeSociety.id)
          .lte("date_debut", t)
          .gte("date_fin", t),
        supabase.from("clients").select("id, nom, prenom, created_at")
          .eq("society_id", activeSociety.id)
          .gte("created_at", m)
          .order("created_at", { ascending: false })
          .limit(10),
        supabase.from("prospects").select("id, nom, entreprise, statut, updated_at")
          .eq("society_id", activeSociety.id)
          .order("updated_at", { ascending: false })
          .limit(20),
        supabase.from("profiles").select("id, nom, avatar_url, color")
          .eq("society_id", activeSociety.id),
        supabase.from("messages").select("*", { count: "exact", head: true })
          .eq("society_id", activeSociety.id)
          .not("read_by", "cs", `{${profile.id}}`)
          .neq("sender_id", profile.id),
      ])

      setVentesToday(vToday || [])
      setVentesWeek(vWeek || [])
      setVentesMonth(vMonth || [])
      setVentes7j(v7 || [])
      setStock(stk || [])
      setTaches(tch || [])
      setAgenda(ag || [])
      setConventions(conv || [])
      setClients(cli || [])
      setProspects(pro || [])
      setTeam(members || [])
      setMessagesUnread(msgCount || 0)
    } catch (e) {
      console.error("Accueil load error", e)
    } finally {
      setLoading(false)
    }
  }, [activeSociety?.id, profile?.id])

  useEffect(() => { load() }, [load])

  // ─── Calculs ───
  const caToday = useMemo(() => ventesToday.reduce((s, v) => s + Number(v.total_ttc || 0), 0), [ventesToday])
  const caWeek = useMemo(() => ventesWeek.reduce((s, v) => s + Number(v.total_ttc || 0), 0), [ventesWeek])
  const caMonth = useMemo(() => ventesMonth.reduce((s, v) => s + Number(v.total_ttc || 0), 0), [ventesMonth])
  const netUrssaf = caToday * (1 - accueilSettings.urssafRate)
  const netMonth = caMonth * (1 - accueilSettings.urssafRate)

  const margeToday = useMemo(() => {
    return ventesToday.reduce((s, v) => {
      const items = v.vente_items || []
      return s + items.reduce((ms: number, it: any) => {
        const pv = Number(it.pv_unitaire ?? 0)
        const cf = Number(it.cf_unitaire ?? 0)
        return ms + (pv - cf) * Number(it.quantite ?? 0)
      }, 0)
    }, 0)
  }, [ventesToday])

  const panierMoyen = ventesToday.length ? caToday / ventesToday.length : 0
  const progressMois = Math.min(100, (caMonth / (accueilSettings.objectifMois || 1)) * 100)
  const progressJour = Math.min(100, (caToday / (accueilSettings.objectifJour || 1)) * 100)
  const resteMois = Math.max(0, accueilSettings.objectifMois - caMonth)
  const resteJour = Math.max(0, accueilSettings.objectifJour - caToday)

  const stockAlerts = useMemo(() =>
    stock.filter(s => s.quantite < 0 || (s.seuil_alerte > 0 && s.quantite <= s.seuil_alerte)),
  [stock])

  const valeurStock = useMemo(() =>
    stock.reduce((s, i) => s + Number(i.quantite || 0) * Number(i.prix_achat || i.cf || 0), 0),
  [stock])

  const tachesUrgentes = useMemo(() => {
    const t = today()
    return taches.filter(x =>
      x.priorite === "urgente" ||
      (x.echeance && x.echeance < t) ||
      x.echeance === t
    ).slice(0, 6)
  }, [taches])

  const topProduits = useMemo(() => {
    const map: Record<string, { nom: string; qty: number; ca: number }> = {}
    ventesMonth.forEach(v => {
      (v.vente_items || []).forEach((it: any) => {
        const key = it.produit_nom || it.name || "Inconnu"
        if (!map[key]) map[key] = { nom: key, qty: 0, ca: 0 }
        map[key].qty += Number(it.quantite || 0)
        map[key].ca += Number(it.pv_unitaire || 0) * Number(it.quantite || 0)
      })
    })
    return Object.values(map).sort((a, b) => b.ca - a.ca).slice(0, 6)
  }, [ventesMonth])

  // CA par membre aujourd'hui
  const teamCA = useMemo(() => {
    const map: Record<string, number> = {}
    ventesToday.forEach(v => {
      const id = v.profile_id || v.created_by
      if (id) map[id] = (map[id] || 0) + Number(v.total_ttc || 0)
    })
    return team
      .map(m => ({ ...m, ca: map[m.id] || 0 }))
      .sort((a, b) => b.ca - a.ca)
  }, [team, ventesToday])

  // Graph 7 jours
  const graph7j = useMemo(() => {
    const days: { date: string; label: string; ca: number }[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const key = d.toISOString().slice(0, 10)
      const label = d.toLocaleDateString("fr-FR", { weekday: "short" }).slice(0, 2)
      const ca = ventes7j
        .filter(v => v.created_at?.startsWith(key))
        .reduce((s, v) => s + Number(v.total_ttc || 0), 0)
      days.push({ date: key, label, ca })
    }
    return days
  }, [ventes7j])

  const maxGraph = Math.max(...graph7j.map(d => d.ca), 1)

  const prospectsChauds = useMemo(() =>
    prospects.filter(p => ["chaud", "interesse", "rdv", "négociation", "négociation"].includes((p.statut || "").toLowerCase())).slice(0, 5),
  [prospects])

  const todayLabel = new Date().toLocaleDateString("fr-FR", {
    weekday: "long", day: "numeric", month: "long", year: "numeric"
  })

  const heure = new Date().getHours()
  const salutation = heure < 12 ? "Bonjour" : heure < 18 ? "Bon après-midi" : "Bonsoir"

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#0a0a0a]">
        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: ACCENT }} />
      </div>
    )
  }

  const S = accueilSettings

  return (
    <div className="flex-1 overflow-y-auto bg-[#0a0a0a]">
      <div className={`p-5 max-w-7xl mx-auto space-y-5 ${S.dense ? "space-y-4" : "space-y-6"}`}>

        {/* ─── HEADER ─── */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-white">
              {salutation}, {profile?.prenom || profile?.nom?.split(" ")[0] || "toi"} 👋
            </h1>
            <p className="text-zinc-500 text-sm capitalize mt-0.5">{todayLabel}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSettings(true)}
              className="h-9 px-3 rounded-lg text-xs font-medium text-zinc-400 bg-zinc-900 border border-zinc-800 hover:text-white hover:border-zinc-600 transition"
            >
              ⚙️ Personnaliser
            </button>
            <button
              onClick={load}
              className="h-9 w-9 rounded-lg text-zinc-500 bg-zinc-900 border border-zinc-800 hover:text-white transition flex items-center justify-center"
            >
              ↻
            </button>
          </div>
        </div>

        {/* ─── KPI PRINCIPAUX ─── */}
        {S.showKpis && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-3">
            {[
              { label: "CA Aujourd'hui", value: formatEuroDec(caToday), color: ACCENT, sub: `${ventesToday.length} vente${ventesToday.length > 1 ? "s" : ""}` },
              { label: "CA Semaine", value: formatEuro(caWeek), color: "#a3e635", sub: "Lun → auj." },
              { label: "CA Mois", value: formatEuro(caMonth), color: "#38bdf8", sub: new Date().toLocaleDateString("fr-FR", { month: "long" }) },
              { label: "Net URSSAF", value: formatEuroDec(netUrssaf), color: "#4ade80", sub: `Après ${(S.urssafRate * 100).toFixed(0)}%` },
              { label: "Marge du jour", value: formatEuroDec(margeToday), color: margeToday >= 0 ? "#34d399" : "#f87171", sub: "Après CF" },
              { label: "Panier moyen", value: formatEuroDec(panierMoyen), color: "#c084fc", sub: "Par vente" },
              { label: "Ventes du jour", value: String(ventesToday.length), color: "#fbbf24", sub: "Transactions" },
              { label: "Objectif mois", value: `${progressMois.toFixed(0)}%`, color: progressMois >= 100 ? "#4ade80" : ACCENT, sub: formatEuro(caMonth) },
            ].map((kpi, i) => (
              <div key={i} className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3.5">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">{kpi.label}</p>
                <p className="text-lg font-bold truncate" style={{ color: kpi.color }}>{kpi.value}</p>
                <p className="text-[11px] text-zinc-600 mt-0.5">{kpi.sub}</p>
              </div>
            ))}
          </div>
        )}

        {/* ─── OBJECTIFS ─── */}
        {S.showObjectifs && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-white">Objectif du jour</p>
                <p className="text-xs text-zinc-500">{formatEuroDec(caToday)} / {formatEuro(S.objectifJour)}</p>
              </div>
              <div className="h-2.5 bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progressJour}%`, background: ACCENT }} />
              </div>
              <p className="text-xs text-zinc-500 mt-2">
                {resteJour > 0 ? `Il reste ${formatEuroDec(resteJour)}` : "🎉 Objectif atteint !"}
              </p>
            </div>
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-white">Objectif du mois</p>
                <p className="text-xs text-zinc-500">{formatEuro(caMonth)} / {formatEuro(S.objectifMois)}</p>
              </div>
              <div className="h-2.5 bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progressMois}%`, background: progressMois >= 100 ? "#4ade80" : "#38bdf8" }} />
              </div>
              <p className="text-xs text-zinc-500 mt-2">
                {resteMois > 0 ? `Il reste ${formatEuro(resteMois)}` : "🏆 Objectif mensuel atteint !"}
              </p>
            </div>
          </div>
        )}

        {/* ─── ALERTES ─── */}
        {S.showAlertes && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Stocks critiques */}
            <div className={`rounded-xl border p-4 ${stockAlerts.length ? "bg-rose-500/5 border-rose-500/30" : "bg-zinc-900/80 border-zinc-800"}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">⚠️</span>
                <p className="text-sm font-semibold text-white">Stocks critiques</p>
              </div>
              {stockAlerts.length === 0 ? (
                <p className="text-xs text-zinc-500">Tout est OK</p>
              ) : (
                <div className="space-y-1.5 max-h-28 overflow-y-auto">
                  {stockAlerts.slice(0, 4).map((s, i) => (
                    <div key={i} className="flex justify-between text-xs">
                      <span className="text-zinc-300 truncate">{s.produit_nom}</span>
                      <span className={s.quantite < 0 ? "text-rose-400 font-bold" : "text-amber-400 font-medium"}>{s.quantite}</span>
                    </div>
                  ))}
                  {stockAlerts.length > 4 && <p className="text-[10px] text-zinc-500">+{stockAlerts.length - 4} autres</p>}
                </div>
              )}
            </div>

            {/* Tâches */}
            <div className={`rounded-xl border p-4 ${tachesUrgentes.length ? "bg-amber-500/5 border-amber-500/30" : "bg-zinc-900/80 border-zinc-800"}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">✅</span>
                <p className="text-sm font-semibold text-white">Tâches à traiter</p>
              </div>
              {tachesUrgentes.length === 0 ? (
                <p className="text-xs text-zinc-500">Aucune urgence</p>
              ) : (
                <div className="space-y-1.5 max-h-28 overflow-y-auto">
                  {tachesUrgentes.map((t, i) => (
                    <div key={i} className="flex items-center justify-between gap-2 text-xs">
                      <span className="text-zinc-300 truncate">{t.titre}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                        t.priorite === "urgente" ? "bg-rose-500/20 text-rose-400" :
                        t.echeance === today() ? "bg-amber-500/20 text-amber-400" : "bg-zinc-700 text-zinc-400"
                      }`}>
                        {t.priorite === "urgente" ? "Urgent" : t.echeance === today() ? "Aujourd'hui" : "Retard"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Messages */}
            <div className={`rounded-xl border p-4 ${messagesUnread > 0 ? "bg-blue-500/5 border-blue-500/30" : "bg-zinc-900/80 border-zinc-800"}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">💬</span>
                <p className="text-sm font-semibold text-white">Messages</p>
              </div>
              <p className={`text-2xl font-bold ${messagesUnread > 0 ? "text-blue-400" : "text-zinc-600"}`}>
                {messagesUnread}
              </p>
              <p className="text-xs text-zinc-500 mt-1">{messagesUnread > 0 ? "non lus" : "Tout est lu"}</p>
            </div>

            {/* Conventions */}
            <div className={`rounded-xl border p-4 ${conventions.length ? "bg-violet-500/5 border-violet-500/30" : "bg-zinc-900/80 border-zinc-800"}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">🎪</span>
                <p className="text-sm font-semibold text-white">Conventions</p>
              </div>
              {conventions.length === 0 ? (
                <p className="text-xs text-zinc-500">Aucune en cours</p>
              ) : (
                <div className="space-y-1">
                  {conventions.map((c, i) => (
                    <p key={i} className="text-xs text-violet-300 truncate">{c.nom}</p>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── GRAPHIQUE 7 JOURS + VENTES DU JOUR ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
          {S.showGraph7j && (
            <div className="lg:col-span-2 bg-zinc-900/80 border border-zinc-800 rounded-xl p-4">
              <p className="text-sm font-semibold text-white mb-3">CA des 7 derniers jours</p>
              <div className="flex items-end gap-1.5 h-28">
                {graph7j.map((d, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-full rounded-t transition-all duration-300"
                      style={{
                        height: `${Math.max(4, (d.ca / maxGraph) * 100)}%`,
                        background: d.date === today() ? ACCENT : "#3f3f46"
                      }}
                      title={formatEuroDec(d.ca)}
                    />
                    <span className="text-[10px] text-zinc-500">{d.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {S.showVentesJour && (
            <div className="lg:col-span-3 bg-zinc-900/80 border border-zinc-800 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-white">Ventes du jour</p>
                <span className="text-xs text-zinc-500">{ventesToday.length} vente{ventesToday.length > 1 ? "s" : ""}</span>
              </div>
              {ventesToday.length === 0 ? (
                <p className="text-xs text-zinc-600 py-6 text-center">Aucune vente aujourd'hui</p>
              ) : (
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {ventesToday.slice(0, 8).map((v, i) => {
                    const heure = v.created_at ? new Date(v.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : ""
                    return (
                      <div key={i} className="flex items-center justify-between gap-3 py-1.5 px-2 rounded-lg hover:bg-zinc-800/50">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-white truncate">{v.client_nom || "Client"}</p>
                          <p className="text-[11px] text-zinc-500">{heure}</p>
                        </div>
                        <p className="text-sm font-semibold" style={{ color: ACCENT }}>{formatEuroDec(Number(v.total_ttc))}</p>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ─── TOP PRODUITS + ÉQUIPE + AGENDA ─── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {S.showTopProduits && (
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4">
              <p className="text-sm font-semibold text-white mb-3">Top produits du mois</p>
              {topProduits.length === 0 ? (
                <p className="text-xs text-zinc-600">Pas encore de données</p>
              ) : (
                <div className="space-y-2">
                  {topProduits.map((p, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-xs font-bold text-zinc-600 w-4">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-zinc-200 truncate">{p.nom}</p>
                        <p className="text-[11px] text-zinc-500">{p.qty} u. · {formatEuro(p.ca)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {S.showEquipe && (
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4">
              <p className="text-sm font-semibold text-white mb-3">Équipe · CA du jour</p>
              {teamCA.length === 0 ? (
                <p className="text-xs text-zinc-600">Aucun membre</p>
              ) : (
                <div className="space-y-2">
                  {teamCA.slice(0, 6).map((m, i) => (
                    <div key={m.id} className="flex items-center gap-2">
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-black shrink-0"
                        style={{ background: m.color || ACCENT }}
                      >
                        {(m.nom || "?")[0]}
                      </div>
                      <p className="flex-1 text-sm text-zinc-300 truncate">{m.nom}</p>
                      <p className="text-sm font-medium" style={{ color: m.ca > 0 ? ACCENT : "#52525b" }}>
                        {formatEuro(m.ca)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {S.showAgenda && (
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4">
              <p className="text-sm font-semibold text-white mb-3">Agenda à venir</p>
              {agenda.length === 0 ? (
                <p className="text-xs text-zinc-600">Aucun rendez-vous</p>
              ) : (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {agenda.map((a, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <div className="text-[11px] text-zinc-500 font-medium w-12 shrink-0 pt-0.5">
                        {a.heure_debut?.slice(0, 5) || a.date?.slice(5)}
                      </div>
                      <p className="text-sm text-zinc-300 truncate">{a.titre || a.nom || "RDV"}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ─── CLIENTS + PROSPECTS + STOCK ─── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {S.showClientsProspects && (
            <>
              <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4">
                <p className="text-sm font-semibold text-white mb-3">Nouveaux clients (mois)</p>
                {clients.length === 0 ? (
                  <p className="text-xs text-zinc-600">Aucun nouveau client</p>
                ) : (
                  <div className="space-y-1.5">
                    {clients.slice(0, 5).map((c, i) => (
                      <p key={i} className="text-sm text-zinc-300 truncate">
                        {c.prenom ? `${c.prenom} ${c.nom}` : c.nom}
                      </p>
                    ))}
                    {clients.length > 5 && <p className="text-[11px] text-zinc-500">+{clients.length - 5} autres</p>}
                  </div>
                )}
              </div>

              <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4">
                <p className="text-sm font-semibold text-white mb-3">Prospects à suivre</p>
                {prospectsChauds.length === 0 ? (
                  <p className="text-xs text-zinc-600">Aucun prospect chaud</p>
                ) : (
                  <div className="space-y-1.5">
                    {prospectsChauds.map((p, i) => (
                      <div key={i} className="flex items-center justify-between gap-2">
                        <p className="text-sm text-zinc-300 truncate">{p.entreprise || p.nom}</p>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 shrink-0">{p.statut}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {S.showStock && (
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4">
              <p className="text-sm font-semibold text-white mb-3">Stock global</p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Références</span>
                  <span className="text-white font-medium">{stock.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">En alerte</span>
                  <span className={stockAlerts.length ? "text-rose-400 font-medium" : "text-emerald-400"}>
                    {stockAlerts.length}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Valeur estimée</span>
                  <span className="text-white font-medium">{formatEuro(valeurStock)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ─── MÉMO + RACCOURCIS ─── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {S.showMemo && (
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-white">Mémo personnel</p>
                <button
                  onClick={() => { setEditMemo(true); setMemoInput(memo) }}
                  className="text-xs text-zinc-500 hover:text-white"
                >
                  ✎
                </button>
              </div>
              {editMemo ? (
                <div className="space-y-2">
                  <textarea
                    value={memoInput}
                    onChange={e => setMemoInput(e.target.value)}
                    rows={4}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-zinc-500 resize-none"
                    placeholder="Écris tes notes ici…"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setMemo(memoInput)
                        setEditMemo(false)
                        try { localStorage.setItem(MEMO_KEY, memoInput) } catch {}
                      }}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-black"
                      style={{ background: ACCENT }}
                    >
                      Sauver
                    </button>
                    <button onClick={() => setEditMemo(false)} className="px-3 py-1.5 rounded-lg text-xs text-zinc-400 bg-zinc-800">
                      Annuler
                    </button>
                  </div>
                </div>
              ) : memo ? (
                <p className="text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed">{memo}</p>
              ) : (
                <p className="text-xs text-zinc-600 italic">Aucune note — clique sur ✎ pour écrire</p>
              )}
            </div>
          )}

          {S.showRaccourcis && (
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4">
              <p className="text-sm font-semibold text-white mb-3">Raccourcis</p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "vente", icon: "🛒", label: "Vente" },
                  { id: "stocks", icon: "📦", label: "Stock" },
                  { id: "clients", icon: "👤", label: "Clients" },
                  { id: "taches", icon: "✅", label: "Tâches" },
                  { id: "prospection", icon: "💊", label: "Prospection" },
                  { id: "messages", icon: "💬", label: "Messages" },
                ].map(r => (
                  <div
                    key={r.id}
                    className="flex flex-col items-center gap-1 py-2.5 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 transition cursor-default"
                  >
                    <span className="text-lg">{r.icon}</span>
                    <span className="text-[11px] text-zinc-400">{r.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Petit footer */}
        <p className="text-center text-[11px] text-zinc-700 pb-4">
          Dernière mise à jour · {new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>

      {/* ─── MODAL PERSONNALISATION ─── */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-4">
          <div className="bg-[#18181b] border border-zinc-700 rounded-2xl w-full max-w-md max-h-[85vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
              <h2 className="text-base font-semibold text-white">Personnaliser mon Accueil</h2>
              <button onClick={() => setShowSettings(false)} className="text-zinc-500 hover:text-white">✕</button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              <div>
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Blocs visibles</p>
                <div className="space-y-1.5">
                  {[
                    { key: "showKpis", label: "KPI principaux" },
                    { key: "showObjectifs", label: "Objectifs" },
                    { key: "showAlertes", label: "Alertes" },
                    { key: "showGraph7j", label: "Graphique 7 jours" },
                    { key: "showVentesJour", label: "Ventes du jour" },
                    { key: "showTopProduits", label: "Top produits" },
                    { key: "showEquipe", label: "Équipe" },
                    { key: "showAgenda", label: "Agenda" },
                    { key: "showClientsProspects", label: "Clients & Prospects" },
                    { key: "showStock", label: "Stock global" },
                    { key: "showMemo", label: "Mémo personnel" },
                    { key: "showRaccourcis", label: "Raccourcis" },
                  ].map(item => (
                    <label key={item.key} className="flex items-center justify-between py-1.5 cursor-pointer">
                      <span className="text-sm text-zinc-300">{item.label}</span>
                      <input
                        type="checkbox"
                        checked={(S as any)[item.key]}
                        onChange={e => saveSettings({ ...S, [item.key]: e.target.checked })}
                        className="w-4 h-4 rounded accent-yellow-500"
                      />
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Objectifs</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-zinc-500">Objectif jour (€)</label>
                    <input
                      type="number"
                      value={S.objectifJour}
                      onChange={e => saveSettings({ ...S, objectifJour: Number(e.target.value) || 0 })}
                      className="w-full h-9 mt-1 bg-zinc-900 border border-zinc-700 rounded-lg px-3 text-sm text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-zinc-500">Objectif mois (€)</label>
                    <input
                      type="number"
                      value={S.objectifMois}
                      onChange={e => saveSettings({ ...S, objectifMois: Number(e.target.value) || 0 })}
                      className="w-full h-9 mt-1 bg-zinc-900 border border-zinc-700 rounded-lg px-3 text-sm text-white focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">URSSAF</p>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0"
                    max="0.4"
                    step="0.01"
                    value={S.urssafRate}
                    onChange={e => saveSettings({ ...S, urssafRate: Number(e.target.value) })}
                    className="flex-1"
                  />
                  <span className="text-sm text-white w-12">{(S.urssafRate * 100).toFixed(0)}%</span>
                </div>
              </div>

              <div>
                <label className="flex items-center justify-between py-1.5 cursor-pointer">
                  <span className="text-sm text-zinc-300">Mode dense</span>
                  <input
                    type="checkbox"
                    checked={S.dense}
                    onChange={e => saveSettings({ ...S, dense: e.target.checked })}
                    className="w-4 h-4 rounded accent-yellow-500"
                  />
                </label>
              </div>
            </div>

            <div className="px-5 py-4 border-t border-zinc-800 flex justify-end">
              <button
                onClick={() => setShowSettings(false)}
                className="px-5 py-2 rounded-xl text-sm font-semibold text-black"
                style={{ background: ACCENT }}
              >
                Terminé
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}